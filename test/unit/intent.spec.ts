// intent.spec.ts: the rules classifier on Colombian Spanish caregiver replies.
import { describe, expect, it } from 'vitest';
import { classifyByRules, normalizeText, parseIntent } from '@audiorapy/domain';

const cases: Array<[string, string]> = [
  ['Hola', 'greeting'],
  ['Buenas tardes', 'greeting'],
  ['Sí', 'affirm'],
  ['siii confirmo', 'affirm'],
  ['Dale, listo', 'affirm'],
  ['No', 'deny'],
  ['Quiero cancelar la cita', 'cancel'],
  ['ya no vamos a poder', 'cancel'],
  ['no puedo ese día', 'reschedule'],
  ['¿Podemos cambiar la hora?', 'reschedule'],
  ['otro día por favor', 'reschedule'],
  ['¿Cuánto cuesta la visita?', 'question'],
  ['asdf qwer', 'unknown'],
  ['', 'unknown'],
];

describe('classifyByRules', () => {
  it.each(cases)('%s → %s', (text, kind) => {
    expect(classifyByRules(text).kind).toBe(kind);
  });

  it('extracts weekday and part-of-day preferences', () => {
    expect(classifyByRules('mejor el miércoles en la tarde')).toEqual({
      kind: 'reschedule',
      preference: { weekday: 3, partOfDay: 'afternoon' },
    });
    expect(classifyByRules('el viernes por la mañana')).toEqual({
      kind: 'reschedule',
      preference: { weekday: 5, partOfDay: 'morning' },
    });
  });

  it('normalizes accents, case and punctuation', () => {
    expect(normalizeText('  ¡SÍ, Señora!  ')).toBe('si senora');
  });
});

describe('parseIntent', () => {
  it('accepts schema-valid output and rejects anything else', () => {
    expect(parseIntent({ kind: 'affirm' })).toEqual({ kind: 'affirm' });
    expect(parseIntent({ kind: 'book_now' })).toBeNull();
    expect(parseIntent({ kind: 'affirm', preference: { weekday: 9 } })).toBeNull();
    expect(
      parseIntent({ kind: 'affirm', extra: 'x', preference: { weekday: 1, hack: 1 } }),
    ).toBeNull();
    expect(parseIntent('affirm')).toBeNull();
  });
});
