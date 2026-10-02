// meta-channel.ts: sends catalogue messages through the WhatsApp Cloud API. Never throws; an
// interactive message rejected with 400 is retried once as plain text.
import {
  degraded,
  guard,
  type ChannelPort,
  type Outbound,
  type PortResult,
} from '@audiorapy/domain';
import { toMetaPayload } from './payload.ts';

export interface MetaChannelOptions {
  accessToken: string;
  phoneNumberId: string;
  graphVersion: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

class HttpError extends Error {
  constructor(readonly status: number) {
    super(`meta responded ${status}`);
  }
}

export class MetaChannel implements ChannelPort {
  readonly name = 'meta.cloud_api';
  private readonly sent = new Map<string, string>();

  constructor(private readonly opts: MetaChannelOptions) {}

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

    let result = await this.post(toMetaPayload(recipient, message));
    if (!result.available && result.error === 'meta responded 400' && message.type !== 'text') {
      result = await this.post(toMetaPayload(recipient, message, true));
    }
    if (result.available) this.remember(idempotencyKey, result.data.id);
    return result;
  }

  private async post(payload: Record<string, unknown>): Promise<PortResult<{ id: string }>> {
    const url = `https://graph.facebook.com/${this.opts.graphVersion}/${encodeURIComponent(this.opts.phoneNumberId)}/messages`;
    const doFetch = this.opts.fetchImpl ?? fetch;
    const r = await guard(
      this.name,
      async (signal) => {
        const res = await doFetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.opts.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal,
        });
        if (!res.ok) throw new HttpError(res.status);
        const json = (await res.json()) as { messages?: Array<{ id?: string }> };
        const id = json.messages?.[0]?.id;
        if (!id) throw new Error('meta response without message id');
        return { id };
      },
      this.opts.timeoutMs ?? 8000,
    );
    return r.available ? r : degraded(this.name, r.error);
  }

  private remember(key: string, id: string) {
    this.sent.set(key, id);
    if (this.sent.size > 5000) this.sent.delete(this.sent.keys().next().value!);
  }
}
