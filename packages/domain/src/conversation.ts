// conversation.ts: the caregiver conversation as a pure state machine.
// Consent gates everything; only an explicit button press can cancel; questions go to the therapist.
import type { Intent } from './intent.ts';
import {
  BUTTON_IDS,
  SLOT_PREFIX,
  booked,
  cancelCheck,
  cancelledAck,
  confirmedAck,
  consentDeclined,
  consentRequest,
  escalatedAck,
  help,
  keptAck,
  noSlots,
  slotList,
  type CatalogueContext,
  type Outbound,
} from './messages.ts';
import type { Slot } from './slots.ts';

export type ConversationState =
  | { step: 'new' }
  | { step: 'awaiting_consent' }
  | { step: 'declined' }
  | { step: 'choosing_slot'; offered: string[]; replaces?: string }
  | { step: 'booked'; startsAt: string };

export type Inbound = { kind: 'text'; text: string } | { kind: 'button'; id: string };

export type EscalationReason = 'question' | 'unknown' | 'no_slots' | 'other_slot';

export type Effect =
  | { type: 'record_consent'; accepted: boolean }
  | { type: 'book'; startsAt: string; replaces?: string }
  | { type: 'confirm_appointment'; startsAt: string }
  | { type: 'cancel_appointment'; startsAt: string; by: 'caregiver' }
  | { type: 'escalate'; reason: EscalationReason };

export interface StepContext {
  /** Intent of a text message, already classified (rules or model). Ignored for buttons. */
  intent: Intent;
  /** Slots offerable right now, already filtered by the intent's preference. */
  offer: { slots: Slot[]; preferenceHonored: boolean };
  catalogue: CatalogueContext;
}

export interface StepResult {
  state: ConversationState;
  outbound: Outbound[];
  effects: Effect[];
}

export function initialState(): ConversationState {
  return { step: 'new' };
}

export function step(state: ConversationState, inbound: Inbound, ctx: StepContext): StepResult {
  switch (state.step) {
    case 'new':
    case 'declined':
      if (inbound.kind === 'button' && inbound.id === BUTTON_IDS.consentYes)
        return acceptConsent(ctx);
      return {
        state: { step: 'awaiting_consent' },
        outbound: [consentRequest(ctx.catalogue)],
        effects: [],
      };

    case 'awaiting_consent':
      return onAwaitingConsent(inbound, ctx);

    case 'choosing_slot':
      return onChoosingSlot(state, inbound, ctx);

    case 'booked':
      return onBooked(state, inbound, ctx);
  }
}

function acceptConsent(ctx: StepContext): StepResult {
  const offered = offerSlots(ctx);
  return { ...offered, effects: [{ type: 'record_consent', accepted: true }, ...offered.effects] };
}

function onAwaitingConsent(inbound: Inbound, ctx: StepContext): StepResult {
  if (inbound.kind === 'button') {
    if (inbound.id === BUTTON_IDS.consentYes) return acceptConsent(ctx);
    if (inbound.id === BUTTON_IDS.consentNo) return decline();
  }
  // Free text never counts as consent: authorization must be explicit, so it is a button press.
  if (inbound.kind === 'text' && ctx.intent.kind === 'deny') return decline();
  return {
    state: { step: 'awaiting_consent' },
    outbound: [consentRequest(ctx.catalogue)],
    effects: [],
  };
}

function decline(): StepResult {
  return {
    state: { step: 'declined' },
    outbound: [consentDeclined()],
    effects: [{ type: 'record_consent', accepted: false }],
  };
}

function offerSlots(ctx: StepContext, replaces?: string): StepResult {
  const { slots, preferenceHonored } = ctx.offer;
  if (slots.length === 0) {
    const state: ConversationState = replaces
      ? { step: 'booked', startsAt: replaces }
      : { step: 'choosing_slot', offered: [] };
    return {
      state,
      outbound: [noSlots()],
      effects: [{ type: 'escalate', reason: 'no_slots' }],
    };
  }
  const list = slotList(slots, preferenceHonored);
  const offered = slots
    .slice(0, list.type === 'list' ? list.rows.length - 1 : 0)
    .map((s) => s.startsAt);
  return {
    state: replaces
      ? { step: 'choosing_slot', offered, replaces }
      : { step: 'choosing_slot', offered },
    outbound: [list],
    effects: [],
  };
}

function onChoosingSlot(
  state: Extract<ConversationState, { step: 'choosing_slot' }>,
  inbound: Inbound,
  ctx: StepContext,
): StepResult {
  if (inbound.kind === 'button') {
    if (inbound.id === BUTTON_IDS.slotOther) return escalate(state, 'other_slot');
    if (inbound.id.startsWith(SLOT_PREFIX)) {
      const startsAt = inbound.id.slice(SLOT_PREFIX.length);
      if (state.offered.includes(startsAt)) {
        const effect: Effect = state.replaces
          ? { type: 'book', startsAt, replaces: state.replaces }
          : { type: 'book', startsAt };
        return {
          state: { step: 'booked', startsAt },
          outbound: [booked(startsAt)],
          effects: [effect],
        };
      }
      return offerSlots(ctx, state.replaces);
    }
    return { state, outbound: [help()], effects: [] };
  }
  switch (ctx.intent.kind) {
    case 'reschedule':
    case 'greeting':
    case 'deny':
      return offerSlots(ctx, state.replaces);
    case 'question':
    case 'unknown':
      return escalate(state, ctx.intent.kind);
    default:
      return { state, outbound: [help()], effects: [] };
  }
}

function onBooked(
  state: Extract<ConversationState, { step: 'booked' }>,
  inbound: Inbound,
  ctx: StepContext,
): StepResult {
  const { startsAt } = state;
  if (inbound.kind === 'button') {
    switch (inbound.id) {
      case BUTTON_IDS.apptConfirm:
        return {
          state,
          outbound: [confirmedAck()],
          effects: [{ type: 'confirm_appointment', startsAt }],
        };
      case BUTTON_IDS.apptCancel:
        return {
          state: { step: 'new' },
          outbound: [cancelledAck()],
          effects: [{ type: 'cancel_appointment', startsAt, by: 'caregiver' }],
        };
      case BUTTON_IDS.apptReschedule:
        return offerSlots(ctx, startsAt);
      case BUTTON_IDS.apptKeep:
        return { state, outbound: [keptAck()], effects: [] };
      default:
        return { state, outbound: [help()], effects: [] };
    }
  }
  switch (ctx.intent.kind) {
    case 'affirm':
      return {
        state,
        outbound: [confirmedAck()],
        effects: [{ type: 'confirm_appointment', startsAt }],
      };
    case 'cancel':
    case 'deny':
      // Interpreted text never cancels; the caregiver confirms with a button.
      return { state, outbound: [cancelCheck(startsAt)], effects: [] };
    case 'reschedule':
      return offerSlots(ctx, startsAt);
    case 'greeting':
      return { state, outbound: [help()], effects: [] };
    default:
      return escalate(state, ctx.intent.kind === 'question' ? 'question' : 'unknown');
  }
}

function escalate(state: ConversationState, reason: EscalationReason): StepResult {
  return { state, outbound: [escalatedAck()], effects: [{ type: 'escalate', reason }] };
}
