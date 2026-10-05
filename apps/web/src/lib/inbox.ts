// inbox.ts: the notification center and the therapist profile. Notifications are derived — family
// alerts, visits within 24 h and start-route achievements — so nothing new is stored except which ids
// were read. The profile is a per-browser convenience (name, practice, city), never clinical content.
import { z } from 'zod';
import { ALERT_ES, type Agenda } from './agenda.ts';
import type { Journey } from './journey.ts';

export type NoteKind = 'alert' | 'visit' | 'achievement';

export interface InboxItem {
  id: string;
  kind: NoteKind;
  title: string;
  detail: string;
  at: string; // ISO instant used for ordering
  unread: boolean;
}

export function buildInbox(
  agenda: Agenda | null,
  route: Journey | null,
  read: ReadonlySet<string>,
  now: Date,
): InboxItem[] {
  const items: Omit<InboxItem, 'unread'>[] = [];
  for (const a of agenda?.alerts ?? [])
    if (!a.resolved)
      items.push({
        id: `alert:${a.id}`,
        kind: 'alert',
        title: ALERT_ES[a.reason] ?? 'Aviso de una familia',
        detail: `Familia ${a.contact}`,
        at: a.at,
      });
  const horizon = now.getTime() + 24 * 3_600_000;
  for (const v of agenda?.appointments ?? []) {
    const t = Date.parse(v.startsAt);
    if (
      (v.status === 'scheduled' || v.status === 'confirmed') &&
      t >= now.getTime() &&
      t <= horizon
    )
      items.push({
        id: `visit:${v.id}`,
        kind: 'visit',
        title:
          v.status === 'confirmed'
            ? 'Visita confirmada en menos de 24 h'
            : 'Visita sin confirmar en menos de 24 h',
        detail: `${v.label} · Familia ${v.contact}`,
        at: v.startsAt,
      });
  }
  for (const s of route?.steps ?? [])
    if (s.done && s.id !== 'vault')
      items.push({
        id: `step:${s.id}`,
        kind: 'achievement',
        title: `Logro: ${s.title}`,
        detail: `+${s.xp} puntos`,
        at: '',
      });
  const rank: Record<NoteKind, number> = { alert: 0, visit: 1, achievement: 2 };
  return items
    .map((i) => ({ ...i, unread: !read.has(i.id) }))
    .sort(
      // Achievements keep the route's own order (the sort is stable); the rest go newest first.
      (a, b) =>
        rank[a.kind] - rank[b.kind] ||
        (a.kind === 'achievement' ? 0 : b.at.localeCompare(a.at) || a.id.localeCompare(b.id)),
    );
}

const READ_KEY = 'audiorapy.inbox.read.v1';
const ReadSchema = z.array(z.string().max(120)).max(500);

export function parseRead(raw: string | null): Set<string> {
  if (!raw) return new Set();
  try {
    const parsed = ReadSchema.safeParse(JSON.parse(raw));
    return new Set(parsed.success ? parsed.data : []);
  } catch {
    return new Set();
  }
}

export function loadRead(): Set<string> {
  try {
    return parseRead(localStorage.getItem(READ_KEY));
  } catch {
    return new Set();
  }
}

export function saveRead(read: ReadonlySet<string>): void {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify([...read].slice(-500)));
  } catch {
    /* storage unavailable: read marks last for this page only */
  }
}

export interface Profile {
  name: string;
  profession: string;
  practice: string;
  city: string;
}

export const EMPTY_PROFILE: Profile = {
  name: '',
  profession: 'Fonoaudióloga',
  practice: '',
  city: '',
};

const PROFILE_KEY = 'audiorapy.profile.v1';
const field = z.string().max(80);
const ProfileSchema = z.object({ name: field, profession: field, practice: field, city: field });

export function parseProfile(raw: string | null): Profile {
  if (!raw) return { ...EMPTY_PROFILE };
  try {
    const parsed = ProfileSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : { ...EMPTY_PROFILE };
  } catch {
    return { ...EMPTY_PROFILE };
  }
}

export function loadProfile(): Profile {
  try {
    return parseProfile(localStorage.getItem(PROFILE_KEY));
  } catch {
    return { ...EMPTY_PROFILE };
  }
}

export function saveProfile(p: Profile): Profile {
  const clean: Profile = {
    name: p.name.trim().slice(0, 80),
    profession: p.profession.trim().slice(0, 80),
    practice: p.practice.trim().slice(0, 80),
    city: p.city.trim().slice(0, 80),
  };
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(clean));
  } catch {
    /* storage unavailable: the profile lasts for this page only */
  }
  return clean;
}

/** Up to two initials for the avatar, or "A" (Audiorapy) when there is no name yet. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'A';
  return (parts[0]![0]! + (parts.length > 1 ? parts.at(-1)![0]! : '')).toUpperCase();
}
