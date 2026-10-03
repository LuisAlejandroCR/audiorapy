// reminders.ts: the database-cron scheduler. Each tick sends due reminders and turns silence into a
// therapist alert. It never cancels an appointment. Rebuildable from the store after a restart.
// A failed send stays pending and is retried on the next tick, until the visit starts.
import { applyReminderReply, reminder, type ChannelPort } from '@audiorapy/domain';
import type { SchedulingStore } from '../store/store.ts';

export interface TickResult {
  sent: number;
  alerts: number;
  skipped: number;
  failed: number;
}

export async function tickReminders(
  store: SchedulingStore,
  channel: ChannelPort,
  now: Date,
): Promise<TickResult> {
  const result: TickResult = { sent: 0, alerts: 0, skipped: 0, failed: 0 };
  for (const job of await store.dueJobs(now)) {
    const appt = await store.getAppointment(job.appointmentId);
    if (!appt || (appt.status !== 'scheduled' && appt.status !== 'confirmed')) {
      await store.setJobState(job.id, 'skipped');
      result.skipped++;
      continue;
    }
    if (job.kind === 'no_reply_check') {
      const outcome = applyReminderReply(appt.status, 'none', new Date(appt.startsAt), now);
      if (outcome.alertTherapist) {
        await store.addAlert(appt.contact, appt.id, 'no_reply', now);
        result.alerts++;
      }
      await store.setJobState(job.id, 'sent');
      continue;
    }
    // A reminder that could not go out before the visit started is no longer worth sending.
    if (Date.parse(appt.startsAt) <= now.getTime()) {
      await store.setJobState(job.id, 'skipped');
      result.skipped++;
      continue;
    }
    if (appt.status === 'confirmed' && job.kind === 'early') {
      await store.setJobState(job.id, 'skipped');
      result.skipped++;
      continue;
    }
    const r = await channel.send(appt.contact, reminder(appt.startsAt), `reminder:${job.id}`);
    if (r.available) {
      await store.setJobState(job.id, 'sent');
      result.sent++;
    } else {
      result.failed++;
    }
  }
  return result;
}

/**
 * Wraps a tick so overlapping calls (the minute timer and a manual tick from the dashboard, or a slow
 * tick that outlives its interval) share the run in flight instead of sending the same reminder twice.
 */
export function singleFlight<A extends unknown[], R>(
  run: (...args: A) => Promise<R>,
): (...args: A) => Promise<R> {
  let inFlight: Promise<R> | null = null;
  return (...args) => {
    inFlight ??= run(...args).finally(() => (inFlight = null));
    return inFlight;
  };
}
