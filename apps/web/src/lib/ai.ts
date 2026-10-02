// ai.ts: local Gemma 4 (Ollama on the therapist's own machine) drafts S/A/P of a SOAP note. Sees only
// soapModelInput(); the decrypted note never leaves this browser except to localhost.
import { z } from 'zod';
import {
  guard,
  mergeDraft,
  SOAP_SYSTEM_PROMPT,
  SoapDraftSchema,
  soapModelInput,
  templateNote,
  type SoapNote,
  type TargetSummary,
} from '@audiorapy/domain';

export interface AiSettings {
  baseUrl: string;
  model: string;
  timeoutMs: number;
}

export const DEFAULT_AI: AiSettings = {
  baseUrl: 'http://127.0.0.1:11434',
  model: 'gemma4:e4b',
  timeoutMs: 60_000,
};

const draftJsonSchema = z.toJSONSchema(SoapDraftSchema);

export interface DraftOutcome {
  note: SoapNote;
  aiAvailable: boolean;
  error: string | null;
  elapsedMs: number;
}

/** Only loopback hosts are allowed: clinical data must not go to a remote model. */
export function isLoopback(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
  } catch {
    return false;
  }
}

export async function draftSoap(
  summaries: TargetSummary[],
  therapistNotes: string,
  settings: AiSettings,
  fetchImpl: typeof fetch = fetch,
): Promise<DraftOutcome> {
  const started = performance.now();
  if (!isLoopback(settings.baseUrl)) {
    return {
      note: templateNote(summaries),
      aiAvailable: false,
      error: 'solo se permite Ollama local',
      elapsedMs: 0,
    };
  }
  const r = await guard(
    `ollama:${settings.model}`,
    async (signal) => {
      const res = await fetchImpl(`${settings.baseUrl.replace(/\/$/, '')}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal,
        body: JSON.stringify({
          model: settings.model,
          stream: false,
          format: draftJsonSchema,
          options: { temperature: 0.2 },
          messages: [
            { role: 'system', content: SOAP_SYSTEM_PROMPT },
            { role: 'user', content: JSON.stringify(soapModelInput(summaries, therapistNotes)) },
          ],
        }),
      });
      if (!res.ok) throw new Error(`ollama respondió ${res.status}`);
      const json = (await res.json()) as { message?: { content?: unknown } };
      if (typeof json.message?.content !== 'string') throw new Error('respuesta sin contenido');
      return JSON.parse(json.message.content) as unknown;
    },
    settings.timeoutMs,
  );
  const elapsedMs = Math.round(performance.now() - started);
  if (!r.available)
    return { note: templateNote(summaries), aiAvailable: false, error: r.error, elapsedMs };
  const note = mergeDraft(summaries, r.data, settings.model);
  return {
    note,
    aiAvailable: note.source === 'model',
    error: note.source === 'model' ? null : 'la salida no cumplió el esquema',
    elapsedMs,
  };
}
