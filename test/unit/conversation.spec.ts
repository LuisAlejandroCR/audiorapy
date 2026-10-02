// conversation.spec.ts: the caregiver flow — consent gate, slot choice, reminders, cancel and escalation.
import { describe, expect, it } from 'vitest';
import { BUTTON_IDS, initialState, slotButtonId, step } from '@audiorapy/domain';
import { ctx, slot } from '../helpers.ts';

const A = '2026-10-05T13:00:00.000Z';
const B = '2026-10-06T13:00:00.000Z';

describe('conversation', () => {
  it('asks for consent on first contact, whatever the text', () => {
    const r = step(
      initialState(),
      { kind: 'text', text: 'Hola' },
      ctx({ kind: 'greeting' }, [slot(A)]),
    );
    expect(r.state).toEqual({ step: 'awaiting_consent' });
    expect(r.outbound[0]?.key).toBe('consent_request');
    expect(r.effects).toEqual([]);
  });

  it('does not take a free-text "sí" as consent', () => {
    const r = step(
      { step: 'awaiting_consent' },
      { kind: 'text', text: 'sí' },
      ctx({ kind: 'affirm' }, [slot(A)]),
    );
    expect(r.state.step).toBe('awaiting_consent');
    expect(r.outbound[0]?.key).toBe('consent_request');
  });

  it('offers slots once consent is given by button, and records it', () => {
    const r = step(
      { step: 'awaiting_consent' },
      { kind: 'button', id: BUTTON_IDS.consentYes },
      ctx(undefined, [slot(A), slot(B)]),
    );
    expect(r.effects).toEqual([{ type: 'record_consent', accepted: true }]);
    expect(r.state).toEqual({ step: 'choosing_slot', offered: [A, B] });
    const list = r.outbound[0];
    expect(list?.type).toBe('list');
    if (list?.type === 'list')
      expect(list.rows.map((x) => x.id)).toEqual([
        slotButtonId(A),
        slotButtonId(B),
        BUTTON_IDS.slotOther,
      ]);
  });

  it('records a refusal and keeps no flow going', () => {
    const r = step(
      { step: 'awaiting_consent' },
      { kind: 'button', id: BUTTON_IDS.consentNo },
      ctx(),
    );
    expect(r.state.step).toBe('declined');
    expect(r.effects).toEqual([{ type: 'record_consent', accepted: false }]);
  });

  it('books an offered slot', () => {
    const r = step(
      { step: 'choosing_slot', offered: [A] },
      { kind: 'button', id: slotButtonId(A) },
      ctx(),
    );
    expect(r.state).toEqual({ step: 'booked', startsAt: A });
    expect(r.effects).toEqual([{ type: 'book', startsAt: A }]);
    expect(r.outbound[0]?.key).toBe('booked');
  });

  it('refuses a slot id that was never offered and re-offers', () => {
    const r = step(
      { step: 'choosing_slot', offered: [A] },
      { kind: 'button', id: slotButtonId(B) },
      ctx(undefined, [slot(A)]),
    );
    expect(r.effects).toEqual([]);
    expect(r.outbound[0]?.key).toBe('slot_list');
  });

  it('escalates "other slot" and questions to the therapist', () => {
    expect(
      step(
        { step: 'choosing_slot', offered: [A] },
        { kind: 'button', id: BUTTON_IDS.slotOther },
        ctx(),
      ).effects,
    ).toEqual([{ type: 'escalate', reason: 'other_slot' }]);
    expect(
      step(
        { step: 'booked', startsAt: A },
        { kind: 'text', text: '¿llevo algo?' },
        ctx({ kind: 'question' }),
      ).effects,
    ).toEqual([{ type: 'escalate', reason: 'question' }]);
  });

  it('escalates when there are no slots instead of looping', () => {
    const r = step(
      { step: 'awaiting_consent' },
      { kind: 'button', id: BUTTON_IDS.consentYes },
      ctx(),
    );
    expect(r.outbound[0]?.key).toBe('no_slots');
    expect(r.effects).toContainEqual({ type: 'escalate', reason: 'no_slots' });
  });

  it('confirms from the reminder button', () => {
    const r = step(
      { step: 'booked', startsAt: A },
      { kind: 'button', id: BUTTON_IDS.apptConfirm },
      ctx(),
    );
    expect(r.effects).toEqual([{ type: 'confirm_appointment', startsAt: A }]);
  });

  it('asks before cancelling when the cancel comes as text', () => {
    const r = step(
      { step: 'booked', startsAt: A },
      { kind: 'text', text: 'cancelar' },
      ctx({ kind: 'cancel' }),
    );
    expect(r.effects).toEqual([]);
    expect(r.outbound[0]?.key).toBe('cancel_check');
  });

  it('cancels only on the explicit button', () => {
    const r = step(
      { step: 'booked', startsAt: A },
      { kind: 'button', id: BUTTON_IDS.apptCancel },
      ctx(),
    );
    expect(r.effects).toEqual([{ type: 'cancel_appointment', startsAt: A, by: 'caregiver' }]);
    expect(r.state).toEqual({ step: 'new' });
  });

  it('reschedules: offers slots and books the new one replacing the old', () => {
    const r1 = step(
      { step: 'booked', startsAt: A },
      { kind: 'button', id: BUTTON_IDS.apptReschedule },
      ctx(undefined, [slot(B)]),
    );
    expect(r1.state).toEqual({ step: 'choosing_slot', offered: [B], replaces: A });
    const r2 = step(r1.state, { kind: 'button', id: slotButtonId(B) }, ctx());
    expect(r2.effects).toEqual([{ type: 'book', startsAt: B, replaces: A }]);
  });

  it('keeps the booking when rescheduling finds no slots', () => {
    const r = step(
      { step: 'booked', startsAt: A },
      { kind: 'button', id: BUTTON_IDS.apptReschedule },
      ctx(),
    );
    expect(r.state).toEqual({ step: 'booked', startsAt: A });
  });
});
