// payload.ts: maps a catalogue message to a WhatsApp Cloud API payload, and to plain text when
// interactive messages are rejected (a 400 means the caregiver receives nothing).
import {
  BUTTON_TITLE_MAX,
  LIST_ROW_TITLE_MAX,
  MAX_BUTTONS,
  MAX_LIST_ROWS,
  type Outbound,
} from '@audiorapy/domain';

const BODY_MAX = 1024;

export function toPlainText(message: Outbound): string {
  if (message.type === 'text') return message.body;
  const options = message.type === 'buttons' ? message.buttons : message.rows;
  const lines = options.map((o, i) => `${i + 1}. ${o.title}`);
  return [message.body, '', ...lines, '', 'Responde con el texto de la opción.'].join('\n');
}

export function fitsInteractiveLimits(message: Outbound): boolean {
  if (message.body.length > BODY_MAX) return false;
  if (message.type === 'buttons')
    return (
      message.buttons.length <= MAX_BUTTONS &&
      message.buttons.every((b) => b.title.length <= BUTTON_TITLE_MAX)
    );
  if (message.type === 'list')
    return (
      message.rows.length <= MAX_LIST_ROWS &&
      message.rows.every((r) => r.title.length <= LIST_ROW_TITLE_MAX)
    );
  return true;
}

export function toMetaPayload(
  to: string,
  message: Outbound,
  forceText = false,
): Record<string, unknown> {
  const base = { messaging_product: 'whatsapp', recipient_type: 'individual', to };
  if (forceText || message.type === 'text' || !fitsInteractiveLimits(message)) {
    return {
      ...base,
      type: 'text',
      text: { body: toPlainText(message).slice(0, 4096), preview_url: false },
    };
  }
  if (message.type === 'buttons') {
    return {
      ...base,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: message.body },
        action: {
          buttons: message.buttons.map((b) => ({
            type: 'reply',
            reply: { id: b.id, title: b.title },
          })),
        },
      },
    };
  }
  return {
    ...base,
    type: 'interactive',
    interactive: {
      type: 'list',
      body: { text: message.body },
      action: {
        button: message.buttonLabel,
        sections: [
          {
            title: 'Cupos',
            rows: message.rows.map((r) => ({
              id: r.id,
              title: r.title,
              ...(r.description ? { description: r.description } : {}),
            })),
          },
        ],
      },
    },
  };
}
