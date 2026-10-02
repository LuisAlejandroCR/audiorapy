// port-result.ts: the typed result every external adapter returns, including when it fails.
// No adapter throws across a port; a failure is data the caller can render.

export type PortResult<T> =
  | { available: true; source: string; checked_at: string; data: T; error?: never }
  | { available: false; source: string; checked_at: string; data: null; error: string };

export function ok<T>(source: string, data: T, now: Date = new Date()): PortResult<T> {
  return { available: true, source, checked_at: now.toISOString(), data };
}

export function degraded<T = never>(
  source: string,
  error: unknown,
  now: Date = new Date(),
): PortResult<T> {
  return {
    available: false,
    source,
    checked_at: now.toISOString(),
    data: null,
    error: describe(error),
  };
}

/** Runs an adapter call and converts any throw or timeout into a degraded result. */
export async function guard<T>(
  source: string,
  call: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
): Promise<PortResult<T>> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error(`timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  try {
    return ok(source, await Promise.race([call(controller.signal), timeout]));
  } catch (error) {
    return degraded<T>(source, error);
  } finally {
    clearTimeout(timer);
  }
}

function describe(error: unknown): string {
  if (error instanceof Error) return error.message || error.name;
  if (typeof error === 'string') return error || 'unknown error';
  return 'unknown error';
}
