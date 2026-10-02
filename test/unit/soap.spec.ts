// soap.spec.ts: the code computes "O"; model drafts are schema-checked and stripped of figures.
import { describe, expect, it } from 'vitest';
import {
  approve,
  mergeDraft,
  objectiveText,
  redactFigures,
  soapModelInput,
  summarizeTarget,
  templateNote,
} from '@audiorapy/domain';

const session = {
  targetId: 't1',
  targetLabel: '/s/ inicial en palabras',
  trials: [
    { correct: true, cue: 'min' as const },
    { correct: true, cue: 'min' as const },
    { correct: false, cue: 'mod' as const },
    { correct: true, cue: 'independent' as const },
  ],
};

describe('soap', () => {
  const summary = summarizeTarget(session);

  it('summarizes trials by cue level', () => {
    expect(summary).toMatchObject({ total: 4, correct: 3, percent: 75, dominantCue: 'min' });
    expect(summary.byCue.mod).toEqual({ total: 1, correct: 0 });
  });

  it('writes the objective section from data', () => {
    expect(objectiveText([summary])).toBe(
      '/s/ inicial en palabras: 3/4 (75 %), apoyo predominante: mínimo.',
    );
  });

  it('redacts sentences that carry figures', () => {
    expect(redactFigures('Buen avance. Logró 90 % hoy. Seguir igual.')).toEqual({
      text: 'Buen avance. [completar] Seguir igual.',
      redacted: 1,
    });
  });

  it('merges a valid draft and always overwrites O', () => {
    const note = mergeDraft(
      [summary],
      {
        subjective: 'Llegó animado.',
        assessment: 'Mejora con apoyo mínimo.',
        plan: 'Continuar 3 veces por semana.',
      },
      'gemma4:e4b',
    );
    expect(note.objective).toBe(objectiveText([summary]));
    expect(note.plan).toBe('[completar]');
    expect(note).toMatchObject({
      status: 'draft',
      source: 'model',
      aiModel: 'gemma4:e4b',
      redactedSentences: 1,
    });
  });

  it('falls back to the template when the draft does not parse', () => {
    expect(mergeDraft([summary], 'not json', 'gemma4:e4b')).toEqual(templateNote([summary]));
  });

  it('approval is an explicit step', () => {
    expect(approve(templateNote([summary])).status).toBe('approved');
  });

  it('the model input carries target labels and counts only', () => {
    expect(Object.keys(soapModelInput([summary], 'nota')).sort()).toEqual([
      'targets',
      'therapistNotes',
    ]);
    expect(Object.keys(soapModelInput([summary], '').targets[0]!).sort()).toEqual([
      'correct',
      'dominantCue',
      'target',
      'total',
    ]);
  });
});
