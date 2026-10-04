// journey.ts: the guided start route (quest map), its points and rank, the recovery-phrase quiz and
// per-vault progress flags. Every step is derived from real records or real actions, never from clicks.
import { z } from 'zod';
import type { ClinicalRecord } from './records.ts';

export type StepId = 'vault' | 'recovery' | 'patient' | 'session' | 'note' | 'backup';

export interface StepDef {
  id: StepId;
  title: string;
  hint: string;
  xp: number;
}

export const JOURNEY_STEPS: readonly StepDef[] = [
  { id: 'vault', title: 'Crea tu bóveda', hint: 'Tus notas se cifran aquí.', xp: 100 },
  { id: 'recovery', title: 'Comprueba tu clave', hint: '3 palabras de tu papel.', xp: 150 },
  { id: 'patient', title: 'Carga un caso', hint: 'Datos sintéticos de práctica.', xp: 50 },
  { id: 'session', title: 'Registra una sesión', hint: 'Ensayos ✓/✗ con nivel de apoyo.', xp: 200 },
  { id: 'note', title: 'Aprueba una nota SOAP', hint: 'Tú revisas; la IA solo propone.', xp: 200 },
  {
    id: 'backup',
    title: 'Descarga un respaldo',
    hint: 'Una copia cifrada fuera del navegador.',
    xp: 100,
  },
];

export const MAX_XP = JOURNEY_STEPS.reduce((sum, s) => sum + s.xp, 0);

const RANKS: ReadonlyArray<{ minXp: number; name: string }> = [
  { minXp: 0, name: 'Primeros pasos' },
  { minXp: 250, name: 'En marcha' },
  { minXp: 500, name: 'Consulta al día' },
  { minXp: MAX_XP, name: 'Consulta blindada' },
];

export interface JourneyFlags {
  recoveryVerified?: boolean;
  backupAt?: string;
}

export interface JourneyStep extends StepDef {
  done: boolean;
}

export interface Journey {
  steps: JourneyStep[];
  completed: number;
  total: number;
  xp: number;
  rank: string;
  /** The first step not yet done, or null once the route is complete. */
  next: StepId | null;
}

/** Synthetic demo sessions carry this id prefix; a session the therapist records does not. */
export const SYNTHETIC_PREFIX = 'synthetic-';

export function journey(records: readonly ClinicalRecord[], flags: JourneyFlags): Journey {
  const done: Record<StepId, boolean> = {
    vault: true,
    recovery: flags.recoveryVerified === true,
    patient: records.some((r) => r.kind === 'patient'),
    session: records.some((r) => r.kind === 'session' && !r.id.startsWith(SYNTHETIC_PREFIX)),
    note: records.some((r) => r.kind === 'soap_note'),
    backup: typeof flags.backupAt === 'string' && flags.backupAt.length > 0,
  };
  const steps = JOURNEY_STEPS.map((s) => ({ ...s, done: done[s.id] }));
  const xp = steps.reduce((sum, s) => sum + (s.done ? s.xp : 0), 0);
  const rank = [...RANKS].reverse().find((r) => xp >= r.minXp)!.name;
  return {
    steps,
    completed: steps.filter((s) => s.done).length,
    total: steps.length,
    xp,
    rank,
    next: steps.find((s) => !s.done)?.id ?? null,
  };
}

/** BIP-39 phrases have at most 24 words; anything larger is clamped so a bad call cannot exhaust memory. */
const MAX_PHRASE_WORDS = 48;

function clampInt(x: number, max: number): number {
  return Number.isFinite(x) ? Math.min(max, Math.max(0, Math.floor(x))) : 0;
}

/** Picks `count` distinct word positions (0-based, ascending) out of `length`. */
export function quizPositions(length: number, count: number, rand: () => number): number[] {
  const n = clampInt(length, MAX_PHRASE_WORDS);
  const k = clampInt(count, n);
  const pool = Array.from({ length: n }, (_, i) => i);
  for (let i = 0; i < k; i++) {
    const roll = rand();
    const u = Number.isFinite(roll) ? Math.min(0.999999, Math.max(0, roll)) : 0;
    const j = i + Math.floor(u * (n - i));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  return pool.slice(0, k).sort((a, b) => a - b);
}

/** Words are compared as the therapist writes them from paper: no accents, any case, outer spaces. */
export function normalizeWord(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .trim()
    .toLowerCase();
}

export function quizMatches(expected: string, typed: string): boolean {
  const e = normalizeWord(expected);
  return e.length > 0 && e === normalizeWord(typed);
}

const FLAGS_KEY = 'audiorapy.journey.v1';

const FlagsSchema = z.record(
  z.string(),
  z.object({
    recoveryVerified: z.boolean().optional(),
    backupAt: z.string().max(64).optional(),
  }),
);

/** Parses the stored flags; anything malformed counts as "nothing done yet". */
export function parseFlags(raw: string | null, fingerprint: string): JourneyFlags {
  if (!raw) return {};
  try {
    const parsed = FlagsSchema.safeParse(JSON.parse(raw));
    if (!parsed.success || !Object.hasOwn(parsed.data, fingerprint)) return {};
    return { ...parsed.data[fingerprint] };
  } catch {
    return {};
  }
}

export function loadFlags(fingerprint: string): JourneyFlags {
  try {
    return parseFlags(localStorage.getItem(FLAGS_KEY), fingerprint);
  } catch {
    return {};
  }
}

export function saveFlags(fingerprint: string, flags: JourneyFlags): void {
  try {
    const raw = localStorage.getItem(FLAGS_KEY);
    let all: Record<string, JourneyFlags> = {};
    try {
      const parsed = FlagsSchema.safeParse(raw ? JSON.parse(raw) : {});
      if (parsed.success) all = parsed.data;
    } catch {
      /* malformed: start over */
    }
    all[fingerprint] = flags;
    localStorage.setItem(FLAGS_KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable: progress lasts for this page only */
  }
}
