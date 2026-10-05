// telegram.spec.ts: the Telegram channel — updates parsed into the same inbound messages as WhatsApp,
// catalogue messages sent as inline keyboards, the webhook failing closed without its secret, and a
// full booking through buttons with the bot token never appearing in a result.
import { describe, expect, it } from 'vitest';
import { consentRequest, type Outbound } from '@audiorapy/domain';
import { buildApp } from '../../../apps/api/src/app.ts';
import { loadConfig } from '../../../apps/api/src/config.ts';
import { FallbackIntentClassifier } from '../../../apps/api/src/ai/rules-intent.ts';
import { MemoryStore } from '../../../apps/api/src/store/memory-store.ts';
import {
  parseTelegramUpdate,
  TelegramChannel,
  toTelegramPayload,
} from '../../../apps/api/src/channel/telegram.ts';
import { buildChannel } from '../../../apps/api/src/providers.ts';
import { fakeFetch } from '../../api-helpers.ts';

const TOKEN = '123456:TEST-token';
const SECRET = 'tg-secret';

const textUpdate = (update_id: number, chat: number, text: string) => ({
  update_id,
  message: { date: 1, chat: { id: chat }, text },
});
const tapUpdate = (update_id: number, chat: number, data: string) => ({
  update_id,
  callback_query: { id: `cb${update_id}`, data, message: { date: 1, chat: { id: chat } } },
});

describe('telegram parsing', () => {
  it('a text and a button tap become inbound messages from tg:<chat>', () => {
    expect(parseTelegramUpdate(textUpdate(1, 42, 'Hola'))).toEqual([
      { id: 'tg-update:1', from: 'tg:42', timestamp: 1, inbound: { kind: 'text', text: 'Hola' } },
    ]);
    expect(parseTelegramUpdate(tapUpdate(2, 42, 'consent:yes'))[0]).toMatchObject({
      from: 'tg:42',
      inbound: { kind: 'button', id: 'consent:yes' },
      callbackId: 'cb2',
    });
  });

  it('anything else is skipped, not thrown', () => {
    expect(parseTelegramUpdate(null)).toEqual([]);
    expect(parseTelegramUpdate({ update_id: 3, message: { chat: { id: 1 } } })).toEqual([]);
    expect(parseTelegramUpdate({ update_id: 'x' })).toEqual([]);
  });
});

describe('telegram payloads', () => {
  it('buttons become one inline row; list rows one row each', () => {
    const consent = toTelegramPayload(
      '42',
      consentRequest({ practiceName: 'P', privacyUrl: 'https://p' }),
    );
    expect(consent).toMatchObject({
      chat_id: '42',
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'Acepto', callback_data: 'consent:yes' },
            { text: 'No acepto', callback_data: 'consent:no' },
          ],
        ],
      },
    });
    const list: Outbound = {
      type: 'list',
      key: 'slot_list',
      body: 'Elige',
      buttonLabel: 'Ver cupos',
      rows: [
        { id: 'slot:2026-10-06T13:00:00.000Z', title: 'mar 6 oct · 8:00 a. m.' },
        { id: 'slot:other', title: 'Otro horario' },
      ],
    };
    expect(
      (toTelegramPayload('42', list).reply_markup as { inline_keyboard: unknown[] })
        .inline_keyboard,
    ).toHaveLength(2);
    expect(toTelegramPayload('42', { type: 'text', key: 'booked', body: 'Listo' })).toEqual({
      chat_id: '42',
      text: 'Listo',
    });
  });
});

describe('telegram webhook and channel', () => {
  async function app(env: Record<string, string>) {
    const sent: Array<{ url: string; body: Record<string, unknown> }> = [];
    let n = 0;
    const channel = new TelegramChannel({
      botToken: TOKEN,
      fetchImpl: fakeFetch((url, init) => {
        sent.push({ url, body: JSON.parse(String(init.body)) });
        return new Response(JSON.stringify({ ok: true, result: { message_id: ++n } }), {
          status: 200,
        });
      }),
    });
    const config = loadConfig({ NODE_ENV: 'test', TELEGRAM_BOT_TOKEN: TOKEN, ...env });
    const built = await buildApp({
      config,
      store: new MemoryStore(),
      channel,
      classifier: new FallbackIntentClassifier(null),
      now: () => new Date('2026-10-01T13:00:00Z'),
    });
    return { app: built, sent };
  }
  const post = (a: Awaited<ReturnType<typeof app>>['app'], body: unknown, secret?: string) =>
    a.inject({
      method: 'POST',
      url: '/telegram/webhook',
      headers: {
        'content-type': 'application/json',
        ...(secret ? { 'x-telegram-bot-api-secret-token': secret } : {}),
      },
      payload: JSON.stringify(body),
    });

  it('the bot token selects the telegram channel', () => {
    expect(buildChannel(loadConfig({ TELEGRAM_BOT_TOKEN: TOKEN })).name).toBe('telegram.bot_api');
    expect(buildChannel(loadConfig({})).name).not.toBe('telegram.bot_api');
  });

  it('without a webhook secret it answers 503; with a wrong one 401', async () => {
    expect((await post((await app({})).app, textUpdate(1, 42, 'Hola'), 'x')).statusCode).toBe(503);
    const { app: a } = await app({ TELEGRAM_WEBHOOK_SECRET: SECRET });
    expect((await post(a, textUpdate(1, 42, 'Hola'))).statusCode).toBe(401);
    expect((await post(a, textUpdate(1, 42, 'Hola'), 'wrong')).statusCode).toBe(401);
  });

  it('Hola → Acepto → a slot books the visit, buttons arrive as inline keyboards', async () => {
    const { app: a, sent } = await app({ TELEGRAM_WEBHOOK_SECRET: SECRET });
    await post(a, textUpdate(1, 42, 'Hola'), SECRET);
    await a.inbox.idle();
    expect(sent.at(-1)!.url).toMatch(/\/sendMessage$/);
    expect(JSON.stringify(sent.at(-1)!.body)).toContain('consent:yes');
    await post(a, tapUpdate(2, 42, 'consent:yes'), SECRET);
    await a.inbox.idle();
    const slots = sent.at(-1)!.body.reply_markup as {
      inline_keyboard: Array<Array<{ callback_data: string }>>;
    };
    const slot = slots.inline_keyboard[0]![0]!.callback_data;
    expect(slot).toMatch(/^slot:/);
    await post(a, tapUpdate(3, 42, slot), SECRET);
    await a.inbox.idle();
    expect(String(sent.filter((s) => s.url.endsWith('/sendMessage')).at(-1)!.body.text)).toContain(
      'quedó agendada',
    );
    expect(sent.some((s) => s.url.endsWith('/answerCallbackQuery'))).toBe(true);
    const agenda = await a.inject({ method: 'GET', url: '/health/providers' });
    expect(agenda.body).not.toContain(TOKEN);
  });

  it('a failed send reports the status, never the bot token', async () => {
    const channel = new TelegramChannel({
      botToken: TOKEN,
      fetchImpl: fakeFetch(() => new Response('{"ok":false}', { status: 403 })),
    });
    const r = await channel.send('tg:42', { type: 'text', key: 'booked', body: 'x' }, 'k1');
    expect(r).toMatchObject({ available: false });
    expect(JSON.stringify(r)).not.toContain(TOKEN);
  });
});
