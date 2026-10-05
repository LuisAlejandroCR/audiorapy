// telegram.invariant.spec.ts: for every catalogue message the bot can send, the Telegram payload keeps
// the text, offers every button the family needs (callback data within Telegram's 64-byte limit) and
// never invents one; a tapped button comes back as exactly the id that was offered.
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  booked,
  cancelCheck,
  consentRequest,
  reminder,
  slotButtonId,
  type Outbound,
} from '@audiorapy/domain';
import {
  MAX_CALLBACK_BYTES,
  parseTelegramUpdate,
  toTelegramPayload,
} from '../../../apps/api/src/channel/telegram.ts';
import { iso } from '../../arbitraries.ts';

const ids = (m: Outbound) =>
  m.type === 'buttons'
    ? m.buttons.map((b) => b.id)
    : m.type === 'list'
      ? m.rows.map((r) => r.id)
      : [];

describe('telegram payloads (invariant)', () => {
  it('every offered button survives with its id, within the limit, and round-trips as a tap', () => {
    const outbound = fc.oneof(
      iso.map((at) => booked(at)),
      iso.map((at) => reminder(at)),
      iso.map((at) => cancelCheck(at)),
      fc.constant(consentRequest({ practiceName: 'P', privacyUrl: 'https://p.example' })),
      fc.array(iso, { minLength: 1, maxLength: 9 }).map((slots): Outbound => ({
        type: 'list',
        key: 'slot_list',
        body: 'Elige',
        buttonLabel: 'Ver cupos',
        rows: slots.map((s) => ({ id: slotButtonId(s), title: s.slice(0, 10) })),
      })),
    );
    fc.assert(
      fc.property(outbound, fc.integer({ min: 1, max: 1e12 }), (m, chat) => {
        const p = toTelegramPayload(String(chat), m) as {
          text: string;
          reply_markup?: { inline_keyboard: Array<Array<{ callback_data: string }>> };
        };
        expect(p.text).toBe(m.body.slice(0, 4096));
        const offered = (p.reply_markup?.inline_keyboard ?? []).flat().map((b) => b.callback_data);
        expect(offered).toEqual(ids(m));
        for (const id of offered) {
          expect(new TextEncoder().encode(id).length).toBeLessThanOrEqual(MAX_CALLBACK_BYTES);
          const [tap] = parseTelegramUpdate({
            update_id: 1,
            callback_query: { id: 'c', data: id, message: { chat: { id: chat } } },
          });
          expect(tap?.inbound).toEqual({ kind: 'button', id });
        }
      }),
      { numRuns: 500 },
    );
  });
});
