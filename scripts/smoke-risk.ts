// smoke-risk.ts: starts the real Python risk sidecar and the real API with RISK_PROVIDER=sidecar, books a
// visit, and checks the API scored it through the sidecar. RISK_PYTHON points at the sidecar's Python.
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { startApi, waitForHealth } from './lib/api-process.ts';

// A path (relative to the repo root) is resolved because the sidecar runs in services/risk; a bare
// command such as `python` is left for PATH lookup.
const pythonSetting = process.env.RISK_PYTHON ?? 'services/risk/.venv/bin/python';
const python = pythonSetting.includes('/') ? resolve(pythonSetting) : pythonSetting;
const RISK_PORT = 8097;
const sidecar = spawn(
  python,
  [
    '-m',
    'uvicorn',
    '--factory',
    'risk.app:build_app',
    '--port',
    String(RISK_PORT),
    '--log-level',
    'warning',
  ],
  {
    cwd: 'services/risk',
    env: { ...process.env, RISK_MODEL: process.env.RISK_MODEL ?? 'logistic' },
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);
let sidecarOutput = '';
sidecar.stdout.on('data', (d) => (sidecarOutput += d));
sidecar.stderr.on('data', (d) => (sidecarOutput += d));
const sidecarExited = new Promise((r) => {
  sidecar.once('exit', r);
  // A missing Python must not crash the script and leave the API running.
  sidecar.once('error', (error) => r((sidecarOutput += `spawn failed: ${error.message}`)));
});

// A fresh number per run, so a leftover process or database never changes the flow.
const PHONE = `5732${String(Date.now() % 1e7).padStart(7, '0')}`;
const checks: Array<[string, boolean]> = [];
const check = (name: string, pass: boolean) => checks.push([name, pass]);
const api = startApi(3996, { RISK_PROVIDER: 'sidecar', RISK_URL: `http://127.0.0.1:${RISK_PORT}` });

try {
  check('sidecar starts', await waitForHealth(`http://127.0.0.1:${RISK_PORT}`, sidecarExited));
  const health = (await (await fetch(`http://127.0.0.1:${RISK_PORT}/health`)).json()) as {
    model: string;
    trained_on: string;
  };
  check(`sidecar trained on synthetic data (${health.model})`, health.trained_on === 'synthetic');
  check('API starts', await waitForHealth(api.base, api.exited));
  const sim = async (body: object) =>
    (await (
      await fetch(`${api.base}/dev/simulate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ from: PHONE, ...body }),
      })
    ).json()) as {
      replies: Array<{ rows?: Array<{ id: string }> }>;
      state: { step: string };
    };
  await sim({ text: 'Hola' });
  const offer = await sim({ buttonId: 'consent:yes' });
  const booked = await sim({ buttonId: offer.replies[0]!.rows![1]!.id });
  check('booking works', booked.state.step === 'booked');
  const providers = (await (await fetch(`${api.base}/health/providers`)).json()) as {
    risk: { active: string; last: { available: boolean; source: string } | null };
  };
  check(
    'API scored the visit through the sidecar',
    providers.risk.active === 'sidecar' &&
      providers.risk.last?.available === true &&
      providers.risk.last.source.startsWith('sidecar:'),
  );
  // Logs are written asynchronously; give them a moment to reach stdout.
  const logged = () => /"event":"risk.scored".*"source":"sidecar:/.test(api.output());
  for (let i = 0; i < 30 && !logged(); i++) await new Promise((r) => setTimeout(r, 100));
  check('API logged the sidecar as the source', logged());
} catch (error) {
  check(`run: ${error instanceof Error ? error.message : 'unknown'}`, false);
} finally {
  await api.stop();
  sidecar.kill('SIGTERM');
  await sidecarExited;
}

for (const [name, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}`);
if (!checks.every(([, p]) => p)) console.log(sidecarOutput.slice(-2000));
process.exit(checks.every(([, p]) => p) ? 0 : 1);
