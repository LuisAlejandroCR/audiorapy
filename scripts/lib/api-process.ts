// api-process.ts: starts and stops the real API process for scripts, capturing its output.
import { spawn, type ChildProcess } from 'node:child_process';

export interface ApiProcess {
  base: string;
  output: () => string;
  exited: Promise<number | null>;
  stop: () => Promise<void>;
}

export function startApi(port: number, env: Record<string, string>): ApiProcess {
  let output = '';
  const child: ChildProcess = spawn(
    process.execPath,
    ['--import', 'tsx', 'apps/api/src/server.ts'],
    {
      env: {
        PATH: process.env.PATH ?? '',
        HOME: process.env.HOME ?? '',
        NODE_ENV: 'development',
        PORT: String(port),
        ...env,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  child.stdout?.on('data', (d) => (output += d));
  child.stderr?.on('data', (d) => (output += d));
  const exited = new Promise<number | null>((resolve) =>
    child.once('exit', (code) => resolve(code)),
  );
  return {
    base: `http://127.0.0.1:${port}`,
    output: () => output,
    exited,
    stop: async () => {
      if (child.exitCode === null) child.kill('SIGTERM');
      await exited;
    },
  };
}

export async function waitForHealth(base: string, exited: Promise<unknown>): Promise<boolean> {
  let gone = false;
  void exited.then(() => (gone = true));
  for (let i = 0; i < 75 && !gone; i++) {
    try {
      if ((await fetch(`${base}/health`)).ok) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}
