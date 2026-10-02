// parse.ts: normalizes a Meta webhook payload into inbound messages. Tolerant: unknown shapes are
// skipped, never thrown. A sender is a phone (wa_id) or, since 2026, a business-scoped user id.
import { z } from 'zod';
import type { Inbound } from '@audiorapy/domain';

export interface NormalizedMessage {
  id: string;
  from: string;
  timestamp: number;
  inbound: Inbound;
}

const MAX_TEXT = 4096;

const MessageSchema = z
  .object({
    id: z.string().min(1).max(256),
    from: z.string().min(1).max(128),
    timestamp: z
      .string()
      .regex(/^\d{1,12}$/)
      .optional(),
    type: z.string(),
    text: z.object({ body: z.string() }).partial().optional(),
    interactive: z
      .object({
        type: z.string(),
        button_reply: z.object({ id: z.string() }).partial().optional(),
        list_reply: z.object({ id: z.string() }).partial().optional(),
      })
      .partial()
      .optional(),
    button: z.object({ payload: z.string(), text: z.string() }).partial().optional(),
  })
  .passthrough();

const PayloadSchema = z.object({
  object: z.string().optional(),
  entry: z
    .array(
      z.object({
        changes: z
          .array(
            z.object({
              field: z.string().optional(),
              value: z
                .object({ messages: z.array(z.unknown()).optional() })
                .passthrough()
                .optional(),
            }),
          )
          .optional(),
      }),
    )
    .optional(),
});

function toInbound(m: z.infer<typeof MessageSchema>): Inbound | null {
  if (m.type === 'text' && typeof m.text?.body === 'string') {
    return { kind: 'text', text: m.text.body.slice(0, MAX_TEXT) };
  }
  if (m.type === 'interactive') {
    const id = m.interactive?.button_reply?.id ?? m.interactive?.list_reply?.id;
    if (typeof id === 'string' && id.length > 0 && id.length <= 256) return { kind: 'button', id };
  }
  if (m.type === 'button') {
    if (typeof m.button?.payload === 'string' && m.button.payload.length > 0)
      return { kind: 'button', id: m.button.payload.slice(0, 256) };
    if (typeof m.button?.text === 'string')
      return { kind: 'text', text: m.button.text.slice(0, MAX_TEXT) };
  }
  return null;
}

export function parseWebhook(body: unknown): NormalizedMessage[] {
  const payload = PayloadSchema.safeParse(body);
  if (!payload.success) return [];
  const out: NormalizedMessage[] = [];
  for (const entry of payload.data.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== undefined && change.field !== 'messages') continue;
      for (const raw of change.value?.messages ?? []) {
        const m = MessageSchema.safeParse(raw);
        if (!m.success) continue;
        const inbound = toInbound(m.data);
        if (!inbound) continue;
        out.push({
          id: m.data.id,
          from: m.data.from,
          timestamp: Number(m.data.timestamp ?? 0),
          inbound,
        });
      }
    }
  }
  return out;
}
