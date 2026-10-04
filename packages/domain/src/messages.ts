// messages.ts: the fixed catalogue of outbound WhatsApp messages. The bot only ever sends these;
// no model output and no caregiver text is ever interpolated into a body.
import type { Slot } from './slots.ts';
import { formatSlotEs } from './time.ts';

export const BUTTON_TITLE_MAX = 20;
export const LIST_ROW_TITLE_MAX = 24;
export const MAX_BUTTONS = 3;
export const MAX_LIST_ROWS = 10;

export type MessageKey =
  | 'consent_request'
  | 'consent_declined'
  | 'slot_list'
  | 'no_slots'
  | 'booked'
  | 'reminder'
  | 'confirmed_ack'
  | 'cancel_check'
  | 'cancelled_ack'
  | 'kept_ack'
  | 'escalated_ack'
  | 'slot_taken'
  | 'help';

export interface Button {
  id: string;
  title: string;
}

export interface ListRow {
  id: string;
  title: string;
  description?: string;
}

export type Outbound =
  | { type: 'text'; key: MessageKey; body: string }
  | { type: 'buttons'; key: MessageKey; body: string; buttons: Button[] }
  | { type: 'list'; key: MessageKey; body: string; buttonLabel: string; rows: ListRow[] };

export const BUTTON_IDS = {
  consentYes: 'consent:yes',
  consentNo: 'consent:no',
  slotOther: 'slot:other',
  apptConfirm: 'appt:confirm',
  apptReschedule: 'appt:reschedule',
  apptCancel: 'appt:cancel',
  apptKeep: 'appt:keep',
} as const;

export const SLOT_PREFIX = 'slot:';

export function slotButtonId(startsAt: string): string {
  return `${SLOT_PREFIX}${startsAt}`;
}

export interface CatalogueContext {
  practiceName: string;
  privacyUrl: string;
}

export function consentRequest(ctx: CatalogueContext): Outbound {
  return {
    type: 'buttons',
    key: 'consent_request',
    body:
      `Hola, te escribe el asistente de agenda de ${ctx.practiceName}. ` +
      'Para agendar visitas necesitamos tu autorización para tratar tu número y los datos de la cita ' +
      `(Ley 1581 de 2012). Es voluntaria. Política de datos: ${ctx.privacyUrl}`,
    buttons: [
      { id: BUTTON_IDS.consentYes, title: 'Acepto' },
      { id: BUTTON_IDS.consentNo, title: 'No acepto' },
    ],
  };
}

export function consentDeclined(): Outbound {
  return {
    type: 'text',
    key: 'consent_declined',
    body: 'Entendido. No guardamos tus datos. Si cambias de opinión, escribe "Hola".',
  };
}

export function slotList(slots: Slot[], preferenceHonored: boolean): Outbound {
  const rows: ListRow[] = slots
    .slice(0, MAX_LIST_ROWS - 1)
    .map((s) => ({ id: slotButtonId(s.startsAt), title: s.label }));
  rows.push({ id: BUTTON_IDS.slotOther, title: 'Otro horario' });
  return {
    type: 'list',
    key: 'slot_list',
    body: preferenceHonored
      ? 'Estos son los próximos cupos para la visita. Elige uno:'
      : 'No encontré cupos con esa preferencia. Estos son los más próximos:',
    buttonLabel: 'Ver cupos',
    rows,
  };
}

/** Sent when the chosen slot was booked by someone else a moment earlier. */
export function slotTaken(): Outbound {
  return {
    type: 'text',
    key: 'slot_taken',
    body: 'Ese cupo se acaba de ocupar. Te comparto los que siguen libres.',
  };
}

export function noSlots(): Outbound {
  return {
    type: 'text',
    key: 'no_slots',
    body: 'Por ahora no hay cupos disponibles. La terapeuta te escribirá para acordar un horario.',
  };
}

/** Ends a sentence once: a slot label already ends in "a. m." / "p. m.", whose period closes it. */
export function endSentence(text: string): string {
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

export function booked(startsAt: string): Outbound {
  return {
    type: 'text',
    key: 'booked',
    body: `${endSentence(`Listo, la visita quedó agendada para el ${formatSlotEs(new Date(startsAt))}`)} Te enviaremos un recordatorio el día anterior.`,
  };
}

export function reminder(startsAt: string): Outbound {
  return {
    type: 'buttons',
    key: 'reminder',
    body: `${endSentence(`Recordatorio: tienes una visita el ${formatSlotEs(new Date(startsAt))}`)} ¿Nos confirmas?`,
    buttons: [
      { id: BUTTON_IDS.apptConfirm, title: 'Confirmar' },
      { id: BUTTON_IDS.apptReschedule, title: 'Reprogramar' },
      { id: BUTTON_IDS.apptCancel, title: 'Cancelar' },
    ],
  };
}

export function confirmedAck(): Outbound {
  return { type: 'text', key: 'confirmed_ack', body: '¡Gracias! La visita queda confirmada.' };
}

export function cancelCheck(startsAt: string): Outbound {
  return {
    type: 'buttons',
    key: 'cancel_check',
    body: `¿Quieres cancelar la visita del ${formatSlotEs(new Date(startsAt))}?`,
    buttons: [
      { id: BUTTON_IDS.apptCancel, title: 'Sí, cancelar' },
      { id: BUTTON_IDS.apptReschedule, title: 'Reprogramar' },
      { id: BUTTON_IDS.apptKeep, title: 'No, mantener' },
    ],
  };
}

export function cancelledAck(): Outbound {
  return {
    type: 'text',
    key: 'cancelled_ack',
    body: 'La visita fue cancelada. Escribe "Hola" cuando quieras agendar de nuevo.',
  };
}

export function keptAck(): Outbound {
  return { type: 'text', key: 'kept_ack', body: 'Perfecto, la visita se mantiene.' };
}

export function escalatedAck(): Outbound {
  return {
    type: 'text',
    key: 'escalated_ack',
    body: 'Le pasé tu mensaje a la terapeuta; ella te responderá personalmente.',
  };
}

export function help(): Outbound {
  return {
    type: 'text',
    key: 'help',
    body: 'Puedes usar los botones del mensaje anterior, o escribir "Hola" para empezar de nuevo.',
  };
}
