// settings.ts: per-browser conveniences (API and Ollama addresses). The API token lives in
// sessionStorage so it is gone when the tab closes. Storage may be unavailable; defaults apply.
import { DEFAULT_AI, type AiSettings } from './ai.ts';
import type { ApiSettings } from './agenda.ts';

const API_URL = 'audiorapy.api.url';
const API_TOKEN = 'audiorapy.api.token';
const AI = 'audiorapy.ai';

function read(storage: () => Storage, key: string): string | null {
  try {
    return storage().getItem(key);
  } catch {
    return null;
  }
}

function write(storage: () => Storage, key: string, value: string) {
  try {
    storage().setItem(key, value);
  } catch {
    /* storage unavailable: setting lasts for this page only */
  }
}

export function loadApiSettings(): ApiSettings {
  return {
    baseUrl: read(() => localStorage, API_URL) ?? 'http://127.0.0.1:3000',
    token: read(() => sessionStorage, API_TOKEN) ?? '',
  };
}

export function saveApiSettings(s: ApiSettings) {
  write(() => localStorage, API_URL, s.baseUrl);
  write(() => sessionStorage, API_TOKEN, s.token);
}

export function loadAiSettings(): AiSettings {
  try {
    const raw = read(() => localStorage, AI);
    return raw ? { ...DEFAULT_AI, ...(JSON.parse(raw) as Partial<AiSettings>) } : DEFAULT_AI;
  } catch {
    return DEFAULT_AI;
  }
}

export function saveAiSettings(s: AiSettings) {
  write(() => localStorage, AI, JSON.stringify(s));
}
