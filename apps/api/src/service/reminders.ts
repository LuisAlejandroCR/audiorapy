// reminders.ts: the database-cron scheduler. Each tick sends due reminders and turns silence into a
// therapist alert. It never cancels an appointment. Rebuildable from the store after a restart.
import { applyReminderReply, reminder, type ChannelPort } from '@audiorapy/domain';
import type { MemoryStore } from '../store/memory-store.ts';

export interface TickResult {
  sent: number;
  alerts: number;
  skipped: number;
  failed: number;
}

export async function tickReminders(
  store: MemoryStore,
  channel: ChannelPort,
  now: Date,
): Promise<TickResult> {
  const result: TickResult = { sent: 0, alerts: 0, skipped: 0, failed: 0 };
  for (const job of store.dueJobs(now)) {
    const appt = store.getAppointment(job.appointmentId);
    if (!appt || (appt.status !== 'scheduled' && appt.status !== 'confirmed')) {
      job.state = 'skipped';
      result.skipped++;
      continue;
    }
    if (job.kind === 'no_reply_check') {
      const outcome = applyReminderReply(appt.status, 'none', new Date(appt.startsAt), now);
      if (outcome.alertTherapist) {
        store.addAlert(appt.contact, appt.id, 'no_reply', now);
        result.alerts++;
      }
      job.state = 'sent';
      continue;
    }
    if (appt.status === 'confirmed' && job.kind === 'early') {
      job.state = 'skipped';
      result.skipped++;
      continue;
    }
    const r = await channel.send(appt.contact, reminder(appt.startsAt), `reminder:${job.id}`);
    if (r.available) {
      job.state = 'sent';
      result.sent++;
    } else {
      result.failed++;
    }
  }
  return result;
}
