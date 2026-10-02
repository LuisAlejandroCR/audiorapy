// lib.fuzz.spec.ts: an imported backup file and a model reply are untrusted; neither can crash the dashboard.
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { summarizeTarget } from '@audiorapy/domain';
import { draftSoap, isLoopback } from '../../../apps/web/src/lib/ai.ts';
import { parseVaultFile } from '../../../apps/web/src/lib/storage.ts';
import { fakeFetch } from '../../api-helpers.ts';

describe('dashboard (fuzz)', () => {
  it('parseVaultFile never throws on arbitrary input', () => {
    fc.assert(
      fc.property(fc.anything(), (raw) => void parseVaultFile(raw)),
      { numRuns: 2000 },
    );
  });

  it('isLoopback never throws', () => {
    fc.assert(
      fc.property(fc.string(), (s) => void isLoopback(s)),
      { numRuns: 2000 },
    );
  });

  it('draftSoap never rejects whatever Ollama answers', async () => {
    const summaries = [
      summarizeTarget({ targetId: 't', targetLabel: 'x', trials: [{ correct: true, cue: 'min' }] }),
    ];
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.string(),
          fc.jsonValue().map((v) => JSON.stringify(v)),
        ),
        fc.integer({ min: 100, max: 599 }),
        async (content, status) => {
          const r = await draftSoap(
            summaries,
            '',
            { baseUrl: 'http://127.0.0.1:1', model: 'm', timeoutMs: 1000 },
            fakeFetch(
              () =>
                new Response(JSON.stringify({ message: { content } }), {
                  status: status < 200 ? 200 : status,
                }),
            ),
          );
          expect(r.note.objective).toContain('x: 1/1');
        },
      ),
      { numRuns: 500 },
    );
  });
});
