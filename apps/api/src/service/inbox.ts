// inbox.ts: processes one inbound caregiver message end to end — dedupe, classify, offer slots,
// step the conversation, apply effects, send catalogue replies. Logs carry no message text.
import {
  findSlots,
  planReminders,
  recordConsent,
  step,
  afterSlotTaken,
  toLocalParts,
  type CatalogueContext,
  type Effect,
  type Inbound,
  type ChannelPort,
} from '@audiorapy/domain';
import type { FallbackIntentClassifier } from '../ai/rules-intent.ts';
import type { FallbackRisk } from '../ai/risk.ts';
import type { NormalizedMessage } from '../meta/parse.ts';
import type { SchedulingStore } from '../store/store.ts';

export const CONSENT_TEXT_VERSION = 'whatsapp-scheduling-v1';

export interface InboxDeps {
  store: SchedulingStore;
  channel: ChannelPort;
  classifier: FallbackIntentClassifier;
  catalogue: CatalogueContext;
  /** null = risk off: fixed reminder cadence. */
  risk: FallbackRisk | null;
  now?: () => Date;
  log?: (event: string, fields: Record<string, unknown>) => void;
}

export interface InboxResult {
  duplicate: boolean;
  intentSource?: string;
  effects: Effect[];
  sent: number;
  failedSends: number;
}

export class Inbox {
  private pending = new Set<Promise<unknown>>();

  constructor(private readonly deps: InboxDeps) {}

  /** Queues processing so the webhook can acknowledge first. */
  enqueue(message: NormalizedMessage) {
    const p = this.handle(message)
      .catch((error: unknown) =>
        this.log('inbox.error', { error: error instanceof Error ? error.message : 'unknown' }),
      )
      .finally(() => this.pending.delete(p));
    this.pending.add(p);
  }

  /** Resolves when every queued message has been processed. */
  async idle(): Promise<void> {
    while (this.pending.size > 0) await Promise.allSettled([...this.pending]);
  }

  async handle(message: NormalizedMessage): Promise<InboxResult> {
    const { store, channel, classifier, catalogue } = this.deps;
    const now = this.now();
    if (!(await store.markProcessed(message.id, now))) {
      this.log('inbox.duplicate', { id: message.id });
      return { duplicate: true, effects: [], sent: 0, failedSends: 0 };
    }
    const state = await store.getConversation(message.from);

    const classified =
      message.inbound.kind === 'text'
        ? await classifier.classify(message.inbound.text)
        : { intent: { kind: 'unknown' as const }, source: 'button' };

    const offerNow = async () =>
      findSlots({
        now,
        ...store.schedule,
        busy: await store.busyIntervals(),
        limit: 3,
        ...(classified.intent.preference ? { preference: classified.intent.preference } : {}),
      });
    const offer = await offerNow();

    let result = step(state, message.inbound, { intent: classified.intent, offer, catalogue });
    for (const effect of result.effects) {
      const outcome = await this.apply(effect, message.from, message.inbound, now);
      if (outcome === 'slot_taken' && effect.type === 'book') {
        // Someone else took the slot between the offer and the tap: say so and offer what is free now.
        const ctx = { intent: classified.intent, offer: await offerNow(), catalogue };
        result = afterSlotTaken(ctx, effect.replaces);
        for (const e of result.effects) await this.apply(e, message.from, message.inbound, now);
        this.log('inbox.slot_taken', { id: message.id });
        break;
      }
    }
    await store.setConversation(message.from, result.state);

    let sent = 0;
    let failedSends = 0;
    for (const [i, outbound] of result.outbound.entries()) {
      const r = await channel.send(message.from, outbound, `${message.id}:${i}`);
      if (r.available) sent++;
      else failedSends++;
    }
    this.log('inbox.processed', {
      id: message.id,
      from_step: state.step,
      to_step: result.state.step,
      intent: classified.intent.kind,
      intent_source: classified.source,
      fallback: 'fallbackReason' in classified ? classified.fallbackReason : undefined,
      effects: result.effects.map((e) => e.type),
      sent,
      failed_sends: failedSends,
    });
    return {
      duplicate: false,
      intentSource: classified.source,
      effects: result.effects,
      sent,
      failedSends,
    };
  }

  private async apply(
    effect: Effect,
    contact: string,
    inbound: Inbound,
    now: Date,
  ): Promise<'slot_taken' | void> {
    const { store } = this.deps;
    switch (effect.type) {
      case 'record_consent':
        await store.addConsent(
          recordConsent({
            contactRef: contact,
            purpose: 'whatsapp_scheduling',
            granted: effect.accepted,
            textVersion: CONSENT_TEXT_VERSION,
            text: CONSENT_TEXT_VERSION,
            signedAt: now.toISOString(),
            channel: 'whatsapp_button',
            childAssent: null,
          }),
        );
        return;
      case 'book': {
        const old = effect.replaces ? await store.findActive(contact, effect.replaces) : null;
        const durationMs = store.schedule.durationMinutes * 60_000;
        const booked = await store.book({
          contact,
          startsAt: effect.startsAt,
          endsAt: new Date(Date.parse(effect.startsAt) + durationMs).toISOString(),
          now,
          ...(old ? { replaces: old.id } : {}),
        });
        if (!booked.ok) return 'slot_taken';
        const appt = booked.appointment;
        const band = this.deps.risk
          ? await this.riskBand(this.deps.risk, contact, appt.startsAt, now)
          : null;
        for (const r of planReminders(new Date(appt.startsAt), now, band))
          await store.addJob(appt.id, r.kind, r.dueAt);
        return;
      }
      case 'confirm_appointment': {
        const appt = await store.findActive(contact, effect.startsAt);
        if (appt) await store.updateStatus(appt.id, 'confirmed', now);
        return;
      }
      case 'cancel_appointment': {
        if (inbound.kind !== 'button') return;
        const appt = await store.findActive(contact, effect.startsAt);
        if (!appt) return;
        const late = Date.parse(appt.startsAt) - now.getTime() < 24 * 3_600_000;
        await store.updateStatus(appt.id, late ? 'late_cancel' : 'cancelled_by_caregiver', now);
        await store.addAlert(contact, appt.id, 'cancelled', now);
        return;
      }
      case 'escalate':
        await store.addAlert(contact, null, effect.reason, now);
        return;
    }
  }

  private async riskBand(risk: FallbackRisk, contact: string, startsAt: string, now: Date) {
    const history = (await this.deps.store.listAppointments()).filter(
      (a) => a.contact === contact && a.startsAt < now.toISOString(),
    );
    const local = toLocalParts(new Date(startsAt));
    const { risk: r, source } = await risk.score({
      priorVisits: history.length,
      priorNoShows: history.filter((a) => a.status === 'no_show').length,
      leadTimeDays: (Date.parse(startsAt) - now.getTime()) / 86_400_000,
      repliedToLastReminder: null,
      weekday: local.weekday,
      hour: Math.floor(local.minutes / 60),
      sessionNumber: history.length + 1,
    });
    this.log('risk.scored', { band: r.band, source });
    return r.band;
  }

  private now(): Date {
    return this.deps.now ? this.deps.now() : new Date();
  }

  private log(event: string, fields: Record<string, unknown>) {
    this.deps.log?.(event, fields);
  }
}
