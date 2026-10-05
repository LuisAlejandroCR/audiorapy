// telegram.ts: the Telegram Bot API as a channel — the same catalogue messages and buttons as WhatsApp,
// as inline keyboards. Parses webhook updates (text and button taps) tolerantly; sends never throw.
// Senders are `tg:<chat id>`; nothing clinical ever goes through this channel.
import { z } from 'zod';
import { guard, type ChannelPort, type Outbound, type PortResult } from '@audiorapy/domain';
import type { NormalizedMessage } from '../meta/parse.ts';

export const TG_PREFIX = 'tg:';
const MAX_TEXT = 4096;
/** Telegram rejects callback_data longer than 64 bytes. */
export const MAX_CALLBACK_BYTES = 64;

const Chat = z.object({ id: z.union([z.number().int(), z.string().regex(/^-?\d{1,20}$/)]) });
const Message = z.object({
  date: z.number().int().nonnegative().optional(),
  chat: Chat,
  text: z.string().max(MAX_TEXT).optional(),
});
const Update = z.object({
  update_id: z.number().int().nonnegative(),
  message: Message.optional(),
  callback_query: z
    .object({
      id: z.string().min(1).max(256),
      data: z.string().min(1).max(MAX_CALLBACK_BYTES).optional(),
      message: Message.optional(),
    })
    .optional(),
});

export interface TelegramInbound extends NormalizedMessage {
  /** Present for a button tap: Telegram expects it answered so the button stops spinning. */
  callbackId?: string;
}

/** One webhook update becomes at most one message; anything unexpected is skipped, never thrown. */
export function parseTelegramUpdate(body: unknown): TelegramInbound[] {
  const u = Update.safeParse(body);
  if (!u.success) return [];
  const { update_id, message, callback_query } = u.data;
  const id = `tg-update:${update_id}`;
  if (callback_query?.data && callback_query.message) {
    return [
      {
        id,
        from: `${TG_PREFIX}${callback_query.message.chat.id}`,
        timestamp: callback_query.message.date ?? 0,
        inbound: { kind: 'button', id: callback_query.data },
        callbackId: callback_query.id,
      },
    ];
  }
  if (message?.text && message.text.trim() !== '') {
    return [
      {
        id,
        from: `${TG_PREFIX}${message.chat.id}`,
        timestamp: message.date ?? 0,
        inbound: { kind: 'text', text: message.text },
      },
    ];
  }
  return [];
}

const bytes = (s: string) => new TextEncoder().encode(s).length;

/** The sendMessage body for a catalogue message: buttons and list rows become an inline keyboard. */
export function toTelegramPayload(chatId: string, message: Outbound): Record<string, unknown> {
  const text = message.body.slice(0, MAX_TEXT);
  const keyboard =
    message.type === 'buttons'
      ? [message.buttons.map((b) => ({ text: b.title, callback_data: b.id }))]
      : message.type === 'list'
        ? message.rows.map((r) => [{ text: r.title, callback_data: r.id }])
        : null;
  const safe = keyboard?.map((row) =>
    row.filter((b) => bytes(b.callback_data) <= MAX_CALLBACK_BYTES),
  );
  return {
    chat_id: chatId,
    text,
    ...(safe && safe.some((row) => row.length > 0)
      ? { reply_markup: { inline_keyboard: safe.filter((row) => row.length > 0) } }
      : {}),
  };
}

export interface TelegramChannelOptions {
  botToken: string;
  /** Defaults to https://api.telegram.org; overridden only in tests. */
  baseUrl?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export class TelegramChannel implements ChannelPort {
  readonly name = 'telegram.bot_api';
  private readonly sent = new Map<string, string>();

  constructor(private readonly opts: TelegramChannelOptions) {}

  async send(
    recipient: string,
    message: Outbound,
    idempotencyKey: string,
  ): Promise<PortResult<{ id: string }>> {
    const already = this.sent.get(idempotencyKey);
    if (already)
      return {
        available: true,
        source: this.name,
        checked_at: new Date().toISOString(),
        data: { id: already },
      };
    const chatId = recipient.startsWith(TG_PREFIX) ? recipient.slice(TG_PREFIX.length) : recipient;
    const r = await this.call<{ message_id: number }>(
      'sendMessage',
      toTelegramPayload(chatId, message),
    );
    if (!r.available) return r;
    const id = String(r.data.message_id);
    this.sent.set(idempotencyKey, id);
    if (this.sent.size > 5000) this.sent.delete(this.sent.keys().next().value!);
    return { ...r, data: { id } };
  }

  /** Stops the spinner on a tapped button. Best effort: failure changes nothing for the family. */
  async ack(callbackId: string): Promise<void> {
    await this.call('answerCallbackQuery', { callback_query_id: callbackId });
  }

  private call<T>(method: string, body: Record<string, unknown>): Promise<PortResult<T>> {
    const base = (this.opts.baseUrl ?? 'https://api.telegram.org').replace(/\/$/, '');
    const doFetch = this.opts.fetchImpl ?? fetch;
    return guard(
      this.name,
      async (signal) => {
        const res = await doFetch(`${base}/bot${this.opts.botToken}/${method}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
          signal,
        });
        const json = (await res.json().catch(() => null)) as { ok?: boolean; result?: T } | null;
        if (!res.ok || !json?.ok) throw new Error(`telegram responded ${res.status}`);
        return json.result as T;
      },
      this.opts.timeoutMs ?? 8000,
    );
  }
}
