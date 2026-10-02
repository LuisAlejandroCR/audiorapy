// soap.ts: session data to SOAP note. The code computes every figure in "O"; the model may only
// draft S, A and P, and any sentence of its draft that contains a digit is replaced by [completar].
import { z } from 'zod';

export const CUE_LEVELS = ['independent', 'min', 'mod', 'max'] as const;
export type CueLevel = (typeof CUE_LEVELS)[number];

export const CUE_LABEL_ES: Record<CueLevel, string> = {
  independent: 'independiente',
  min: 'mínimo',
  mod: 'moderado',
  max: 'máximo',
};

export interface Trial {
  correct: boolean;
  cue: CueLevel;
}

export interface TargetSession {
  targetId: string;
  targetLabel: string;
  trials: Trial[];
}

export interface TargetSummary {
  targetId: string;
  targetLabel: string;
  total: number;
  correct: number;
  percent: number;
  byCue: Record<CueLevel, { total: number; correct: number }>;
  dominantCue: CueLevel | null;
}

export function summarizeTarget(session: TargetSession): TargetSummary {
  const byCue = Object.fromEntries(CUE_LEVELS.map((c) => [c, { total: 0, correct: 0 }])) as Record<
    CueLevel,
    { total: number; correct: number }
  >;
  let correct = 0;
  for (const t of session.trials) {
    byCue[t.cue].total++;
    if (t.correct) {
      byCue[t.cue].correct++;
      correct++;
    }
  }
  const total = session.trials.length;
  let dominantCue: CueLevel | null = null;
  for (const c of CUE_LEVELS) {
    if (byCue[c].total > 0 && (dominantCue === null || byCue[c].total > byCue[dominantCue].total)) {
      dominantCue = c;
    }
  }
  return {
    targetId: session.targetId,
    targetLabel: session.targetLabel,
    total,
    correct,
    percent: total === 0 ? 0 : Math.round((correct / total) * 100),
    byCue,
    dominantCue,
  };
}

export function objectiveText(summaries: TargetSummary[]): string {
  if (summaries.length === 0) return 'Sin ensayos registrados en esta sesión.';
  return summaries
    .map((s) => {
      if (s.total === 0) return `${s.targetLabel}: sin ensayos.`;
      const cue = s.dominantCue ? CUE_LABEL_ES[s.dominantCue] : '—';
      return `${s.targetLabel}: ${s.correct}/${s.total} (${s.percent} %), apoyo predominante: ${cue}.`;
    })
    .join('\n');
}

export const SoapDraftSchema = z.object({
  subjective: z.string().max(2000),
  assessment: z.string().max(2000),
  plan: z.string().max(2000),
});

export type SoapDraft = z.infer<typeof SoapDraftSchema>;

export const PLACEHOLDER = '[completar]';

export interface SoapNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  status: 'draft' | 'approved';
  source: 'model' | 'template';
  aiModel: string | null;
  redactedSentences: number;
}

/** Removes every sentence that contains a digit: figures belong to the code, not to the model. */
export function redactFigures(text: string): { text: string; redacted: number } {
  let redacted = 0;
  const parts = text.split(/(?<=[.!?\n])\s*/u);
  const kept = parts
    .map((sentence) => {
      if (/\p{Nd}/u.test(sentence)) {
        redacted++;
        return PLACEHOLDER;
      }
      return sentence.trim();
    })
    .filter((s) => s.length > 0);
  return { text: kept.join(' ').trim() || PLACEHOLDER, redacted };
}

export function templateNote(summaries: TargetSummary[]): SoapNote {
  return {
    subjective: PLACEHOLDER,
    objective: objectiveText(summaries),
    assessment: PLACEHOLDER,
    plan: PLACEHOLDER,
    status: 'draft',
    source: 'template',
    aiModel: null,
    redactedSentences: 0,
  };
}

/** Merges untrusted model output into a draft note. Falls back to the template when it does not parse. */
export function mergeDraft(summaries: TargetSummary[], raw: unknown, aiModel: string): SoapNote {
  const parsed = SoapDraftSchema.safeParse(raw);
  if (!parsed.success) return templateNote(summaries);
  const s = redactFigures(parsed.data.subjective);
  const a = redactFigures(parsed.data.assessment);
  const p = redactFigures(parsed.data.plan);
  return {
    subjective: s.text,
    objective: objectiveText(summaries),
    assessment: a.text,
    plan: p.text,
    status: 'draft',
    source: 'model',
    aiModel,
    redactedSentences: s.redacted + a.redacted + p.redacted,
  };
}

export function approve(note: SoapNote): SoapNote {
  return { ...note, status: 'approved' };
}

/**
 * The exact fields the model sees for a SOAP draft (the "model input manifest").
 * Target labels and per-cue counts only; no child name, age, address or diagnosis.
 */
export function soapModelInput(summaries: TargetSummary[], therapistNotes: string) {
  return {
    targets: summaries.map((s) => ({
      target: s.targetLabel,
      correct: s.correct,
      total: s.total,
      dominantCue: s.dominantCue,
    })),
    therapistNotes: therapistNotes.slice(0, 2000),
  };
}

export const SOAP_SYSTEM_PROMPT =
  'Eres asistente de una fonoaudióloga. Redacta en español un borrador breve de las secciones S, A y P ' +
  'de una nota SOAP a partir de los datos dados. Usa solo hechos presentes en los datos; si falta algo, ' +
  `escribe ${PLACEHOLDER}. No escribas cifras ni porcentajes: el sistema las inserta. ` +
  'Responde solo con JSON {"subjective","assessment","plan"}.';
