// notify.ts: opt-in browser notifications for new family alerts. Only logistics travel in them (the
// alert reason and the masked contact), never clinical content. Every call is guarded: the API can be
// missing (Safari on iOS outside a home-screen app) or blocked.
const KEY = 'audiorapy.notify';

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function notificationsOn(): boolean {
  try {
    return (
      notificationsSupported() &&
      Notification.permission === 'granted' &&
      localStorage.getItem(KEY) === '1'
    );
  } catch {
    return false;
  }
}

export function setNotificationsOn(on: boolean): void {
  try {
    if (on) localStorage.setItem(KEY, '1');
    else localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable: lasts for this page only */
  }
}

export async function requestNotifications(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  try {
    return (await Notification.requestPermission()) === 'granted';
  } catch {
    return false;
  }
}

export function showNotification(body: string): void {
  try {
    new Notification('Audiorapy', { body, tag: body, silent: false });
  } catch {
    /* some browsers only allow notifications from a service worker */
  }
}
