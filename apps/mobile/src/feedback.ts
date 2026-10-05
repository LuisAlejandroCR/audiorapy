// feedback.ts: haptics and local notifications for the phone. Haptics confirm a tap without looking
// (✓ light, ✗ warning, a streak milestone or the criterion reached: success). A visit reminder is a local
// notification with logistics only (time and masked family). On the web preview both are no-ops.
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';

const native = Platform.OS !== 'web';

export const haptic = {
  correct: () =>
    native && void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),
  wrong: () =>
    native &&
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}),
  milestone: () =>
    native &&
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
  select: () => native && void Haptics.selectionAsync().catch(() => {}),
};

/** Streak lengths worth a success buzz. */
export const MILESTONES = new Set([3, 5, 10]);

if (native)
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

export type ReminderResult = 'scheduled' | 'denied' | 'past' | 'unsupported';

/** Schedules a reminder one hour before the visit; nothing clinical goes into it. */
export async function remindBefore(
  startsAt: string,
  label: string,
  contact: string,
): Promise<ReminderResult> {
  if (!native) return 'unsupported';
  const at = new Date(Date.parse(startsAt) - 60 * 60_000);
  if (!(at.getTime() > Date.now())) return 'past';
  try {
    const { granted } = await Notifications.requestPermissionsAsync();
    if (!granted) return 'denied';
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Visita en 1 hora', body: `${label} · Familia ${contact}` },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
    });
    return 'scheduled';
  } catch {
    return 'unsupported';
  }
}
