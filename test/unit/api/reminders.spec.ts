// reminders.spec.ts: the cron tick sends due reminders, turns silence into an alert, never cancels.
import { describe, expect, it } from 'vitest';
import { degraded, type ChannelPort } from '@audiorapy/domain';
import { singleFlight, tickReminders } from '../../../apps/api/src/service/reminders.ts';
import { DASH, testApp } from '../../api-helpers.ts';
import { ConsoleChannel } from '../../../apps/api/src/channel/console-channel.ts';
import { MemoryStore } from '../../../apps/api/src/store/memory-store.ts';

async function setup() {
  const store = new MemoryStore();
  const channel = new ConsoleChannel();
  const appt = await store.createAppointment(
    '57300',
    '2026-10-09T14:00:00.000Z',
    '2026-10-09T14:45:00.000Z',
    new Date('2026-10-02T12:00:00Z'),
  );
  await store.addJob(appt.id, 'day_before', '2026-10-08T14:00:00.000Z');
  await store.addJob(appt.id, 'no_reply_check', '2026-10-09T02:00:00.000Z');
  return { store, channel, appt };
}

describe('tickReminders', () => {
  it('sends nothing before the due time', async () => {
    const { store, channel } = await setup();
    expect(await tickReminders(store, channel, new Date('2026-10-08T13:59:00Z'))).toEqual({
      sent: 0,
      alerts: 0,
      skipped: 0,
      failed: 0,
    });
  });

  it('sends the reminder with confirm / reschedule / cancel buttons, once', async () => {
    const { store, channel } = await setup();
    await tickReminders(store, channel, new Date('2026-10-08T14:00:00Z'));
    await tickReminders(store, channel, new Date('2026-10-08T15:00:00Z'));
    const sent = channel.sentTo('57300');
    expect(sent).toHaveLength(1);
    expect(sent[0]?.type === 'buttons' && sent[0].buttons.map((b) => b.id)).toEqual([
      'appt:confirm',
      'appt:reschedule',
      'appt:cancel',
    ]);
  });

  it('A6: silence raises an alert and leaves the appointment scheduled', async () => {
    const { store, channel, appt } = await setup();
    const r = await tickReminders(store, channel, new Date('2026-10-09T03:00:00Z'));
    expect(r.alerts).toBe(1);
    expect((await store.getAppointment(appt.id))?.status).toBe('scheduled');
    expect((await store.listAlerts())[0]).toMatchObject({
      reason: 'no_reply',
      appointmentId: appt.id,
    });
  });

  it('a confirmed visit gets no no-reply alert; a cancelled one gets nothing', async () => {
    const a = await setup();
    await a.store.updateStatus(a.appt.id, 'confirmed', new Date());
    expect((await tickReminders(a.store, a.channel, new Date('2026-10-09T03:00:00Z'))).alerts).toBe(
      0,
    );
    const b = await setup();
    await b.store.updateStatus(b.appt.id, 'cancelled_by_caregiver', new Date());
    expect(await tickReminders(b.store, b.channel, new Date('2026-10-09T03:00:00Z'))).toEqual({
      sent: 0,
      alerts: 0,
      skipped: 0,
      failed: 0,
    });
  });

  it('a reminder that could not go out before the visit started is skipped, not sent late', async () => {
    const { store } = await setup();
    const down: ChannelPort = { name: 'down', send: async () => degraded('down', 'unreachable') };
    expect((await tickReminders(store, down, new Date('2026-10-08T14:00:00Z'))).failed).toBe(1);
    const channel = new ConsoleChannel();
    const after = await tickReminders(store, channel, new Date('2026-10-09T14:00:00Z'));
    // The stale reminder is dropped; the silence check still alerts the therapist.
    expect(after).toEqual({ sent: 0, alerts: 1, skipped: 1, failed: 0 });
    expect(channel.sentTo('57300')).toHaveLength(0);
    expect((await store.listJobs()).find((j) => j.kind === 'day_before')?.state).toBe('skipped');
  });
});

describe('singleFlight', () => {
  it('overlapping calls share the run in flight; the next call starts a new one', async () => {
    let runs = 0;
    let release!: () => void;
    const tick = singleFlight(async () => {
      runs++;
      await new Promise<void>((r) => (release = r));
      return runs;
    });
    const a = tick();
    const b = tick();
    release();
    expect(await Promise.all([a, b])).toEqual([1, 1]);
    const c = tick();
    release();
    expect(await c).toBe(2);
  });

  it('the minute timer and a manual tick from the dashboard send a due reminder once', async () => {
    const { app, store, channel } = await testApp({ now: new Date('2026-10-08T14:00:00Z') });
    const appt = await store.createAppointment(
      '57300',
      '2026-10-09T14:00:00.000Z',
      '2026-10-09T14:45:00.000Z',
      new Date('2026-10-02T12:00:00Z'),
    );
    await store.addJob(appt.id, 'day_before', '2026-10-08T14:00:00.000Z');
    // Count attempts: the console channel itself drops a repeated idempotency key, Meta's might not.
    let attempts = 0;
    const send = channel.send.bind(channel);
    channel.send = async (...args) => {
      attempts++;
      await new Promise((r) => setTimeout(r, 50)); // a slow Meta keeps the first tick in flight
      return send(...args);
    };
    const [timer, manual] = await Promise.all([
      app.tickReminders(new Date('2026-10-08T14:00:00Z')),
      app.inject({
        method: 'POST',
        url: '/api/reminders/tick',
        headers: { authorization: `Bearer ${DASH}` },
      }),
    ]);
    expect(timer.sent).toBe(1);
    expect(manual.statusCode).toBe(200);
    expect(attempts).toBe(1);
  });
});
