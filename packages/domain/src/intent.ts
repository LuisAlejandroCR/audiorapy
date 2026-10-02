// intent.ts: caregiver intent schema and the deterministic rules classifier used as the AI fallback.
import { z } from 'zod';

export const INTENT_KINDS = [
  'greeting',
  'affirm',
  'deny',
  'cancel',
  'reschedule',
  'question',
  'unknown',
] as const;

export const IntentSchema = z.object({
  kind: z.enum(INTENT_KINDS),
  preference: z
    .object({
      weekday: z.number().int().min(0).max(6).optional(),
      partOfDay: z.enum(['morning', 'afternoon', 'evening']).optional(),
    })
    .strict()
    .optional(),
});

export type Intent = z.infer<typeof IntentSchema>;
export type IntentKind = Intent['kind'];

/** Upper bound on caregiver text the classifiers look at; longer input is truncated, never rejected. */
export const MAX_INTENT_TEXT = 500;

export function normalizeText(text: string): string {
  return text
    .slice(0, MAX_INTENT_TEXT)
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}?\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const WEEKDAY_WORDS: Array<[RegExp, number]> = [
  [/\bdomingo\b/, 0],
  [/\blunes\b/, 1],
  [/\bmartes\b/, 2],
  [/\bmiercoles\b/, 3],
  [/\bjueves\b/, 4],
  [/\bviernes\b/, 5],
  [/\bsabado\b/, 6],
];

const RULES: Array<[IntentKind, RegExp]> = [
  ['cancel', /\b(cancel\w*|anul\w*|ya no (vamos|podemos|voy|puedo ir)|no vamos a poder)\b/],
  [
    'reschedule',
    /\b(reprogram\w*|cambi\w* (la )?(cita|hora|fecha|visita)|otro dia|otra hora|otro horario|mover la cita|correr la cita|no puedo|no podemos)\b/,
  ],
  [
    'affirm',
    /^(si+|sii+|claro|dale|listo|ok|okay|okey|vale|perfecto|de una|confirm\w*|acepto|de acuerdo|ahi estaremos|alli estaremos|si señora|si senora|si gracias)\b/,
  ],
  ['deny', /^(no|nop|no gracias|no acepto|negativo)\b/],
  ['greeting', /^(hola|buen(os|as) (dias|tardes|noches)|buenas|saludos|holi)\b/],
];

export function extractPreference(normalized: string): Intent['preference'] {
  const pref: NonNullable<Intent['preference']> = {};
  for (const [pattern, weekday] of WEEKDAY_WORDS) {
    if (pattern.test(normalized)) {
      pref.weekday = weekday;
      break;
    }
  }
  if (/\b(en|por) la manana\b|\btemprano\b/.test(normalized)) pref.partOfDay = 'morning';
  else if (/\b(en|por) la tarde\b|\bdespues del almuerzo\b/.test(normalized))
    pref.partOfDay = 'afternoon';
  else if (/\b(en|por) la noche\b/.test(normalized)) pref.partOfDay = 'evening';
  return Object.keys(pref).length > 0 ? pref : undefined;
}

/** Deterministic classifier: always available, never calls out of process. */
export function classifyByRules(text: string): Intent {
  const normalized = normalizeText(text);
  const preference = extractPreference(normalized);
  const withPref = (kind: IntentKind): Intent => (preference ? { kind, preference } : { kind });

  if (normalized.length === 0) return { kind: 'unknown' };
  for (const [kind, pattern] of RULES) {
    if (pattern.test(normalized)) return withPref(kind);
  }
  if (preference) return { kind: 'reschedule', preference };
  if (
    normalized.includes('?') ||
    /^(cuanto|como|donde|cuando|que|quien|por que)\b/.test(normalized)
  )
    return { kind: 'question' };
  return { kind: 'unknown' };
}

/** Validates untrusted classifier output (e.g. from an LLM); null when it does not match the schema. */
export function parseIntent(raw: unknown): Intent | null {
  const parsed = IntentSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
