// console-channel.ts: development channel. Keeps sent messages in memory (for the simulator, tests
// and the demo) instead of calling Meta.
import { ok, type ChannelPort, type Outbound, type PortResult } from '@audiorapy/domain';

export interface SentMessage {
  to: string;
  message: Outbound;
  idempotencyKey: string;
  at: string;
}

export class ConsoleChannel implements ChannelPort {
  readonly name = 'console';
  readonly outbox: SentMessage[] = [];
  private readonly keys = new Set<string>();

  async send(
    to: string,
    message: Outbound,
    idempotencyKey: string,
  ): Promise<PortResult<{ id: string }>> {
    if (!this.keys.has(idempotencyKey)) {
      this.keys.add(idempotencyKey);
      this.outbox.push({ to, message, idempotencyKey, at: new Date().toISOString() });
      if (this.outbox.length > 1000) this.outbox.shift();
    }
    return ok(this.name, { id: `console:${idempotencyKey}` });
  }

  sentTo(to: string): Outbound[] {
    return this.outbox.filter((m) => m.to === to).map((m) => m.message);
  }
}
