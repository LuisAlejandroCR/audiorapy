// telegram.fuzz.spec.ts: a Telegram webhook body is untrusted — any JSON, any shape — and the parser
// must never throw, and must only ever yield well-formed inbound messages from tg:<chat id>.
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { parseTelegramUpdate } from '../../../apps/api/src/channel/telegram.ts';

describe('telegram webhook (fuzz)', () => {
  it('arbitrary bodies never throw and only produce valid messages', () => {
    const near = fc.record(
      {
        update_id: fc.oneof(fc.integer(), fc.string()),
        message: fc.record(
          {
            date: fc.integer(),
            chat: fc.record({ id: fc.oneof(fc.integer(), fc.string()) }),
            text: fc.string({ maxLength: 5000 }),
          },
          { requiredKeys: [] },
        ),
        callback_query: fc.record(
          {
            id: fc.string(),
            data: fc.string({ maxLength: 80 }),
            message: fc.record({ chat: fc.record({ id: fc.integer() }) }),
          },
          { requiredKeys: [] },
        ),
      },
      { requiredKeys: [] },
    );
    fc.assert(
      fc.property(fc.oneof(fc.anything(), near), (body) => {
        for (const m of parseTelegramUpdate(body)) {
          expect(m.from).toMatch(/^tg:-?\d+$/);
          expect(m.id).toMatch(/^tg-update:\d+$/);
          if (m.inbound.kind === 'text') expect(m.inbound.text.length).toBeLessThanOrEqual(4096);
          else expect(new TextEncoder().encode(m.inbound.id).length).toBeLessThanOrEqual(64 * 4);
        }
      }),
      { numRuns: 2000 },
    );
  });
});
