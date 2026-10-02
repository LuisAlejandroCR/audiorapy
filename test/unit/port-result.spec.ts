// port-result.spec.ts: ok/degraded/guard produce the typed result shapes.
import { describe, expect, it } from 'vitest';
import { degraded, guard, ok } from '@audiorapy/domain';

describe('PortResult', () => {
  it('ok carries data and a timestamp', () => {
    const r = ok('rules', 42, new Date('2026-10-02T12:00:00Z'));
    expect(r).toEqual({
      available: true,
      source: 'rules',
      checked_at: '2026-10-02T12:00:00.000Z',
      data: 42,
    });
  });

  it('degraded carries the error message and null data', () => {
    const r = degraded('ollama', new Error('ECONNREFUSED'));
    expect(r.available).toBe(false);
    expect(r.data).toBeNull();
    expect(r.error).toBe('ECONNREFUSED');
  });

  it('guard converts a throw into a degraded result', async () => {
    const r = await guard(
      'x',
      async () => {
        throw new Error('boom');
      },
      1000,
    );
    expect(r).toMatchObject({ available: false, error: 'boom' });
  });

  it('guard converts a slow call into a timeout and aborts it', async () => {
    let aborted = false;
    const r = await guard(
      'slow',
      (signal) =>
        new Promise((resolve) => {
          signal.addEventListener('abort', () => (aborted = true));
          setTimeout(() => resolve('late'), 500);
        }),
      20,
    );
    expect(r).toMatchObject({ available: false, error: 'timeout after 20ms' });
    expect(aborted).toBe(true);
  });
});
