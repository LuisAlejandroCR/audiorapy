// smoke-api.ts: starts the real API process and checks the webhook guards and the booking flow over HTTP.
// With DATABASE_URL it also restarts the process and checks that bookings and conversations persist.
import { spawn } from 'node:child_process';
import { createHmac } from 'node:crypto';

const PORT = process.env.SMOKE_PORT ?? '3987';
const BASE = `http://127.0.0.1:${PORT}`;
const env = {
  ...process.env,
  PORT,
  NODE_ENV: 'development',
  META_APP_SECRET: 'smoke-secret',
  META_VERIFY_TOKEN: 'smoke-verify',
  DASHBOARD_TOKEN: 'smoke-dash',
};
const persistent = Boolean(process.env.DATABASE_URL);
let output = '';

function start() {
  const child = spawn(process.execPath, ['--import', 'tsx', 'apps/api/src/server.ts'], {
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (d) => (output += d));
  child.stderr.on('data', (d) => (output += d));
  return child;
}

async function stop(child: ReturnType<typeof start>) {
  const exited = new Promise((r) => child.once('exit', r));
  child.kill('SIGTERM');
  await exited;
}

let server = start();

// A fresh number per run, so a persistent database from an earlier run does not change the flow.
const PHONE = `5730${String(Date.now() % 1e7).padStart(7, '0')}`;
const checks: Array<[string, boolean]> = [];
const check = (name: string, pass: boolean) => checks.push([name, pass]);

async function waitForHealth() {
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(`${BASE}/health`)).ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('server did not start');
}

const simulate = async (body: object) =>
  (await (
    await fetch(`${BASE}/dev/simulate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  ).json()) as {
    replies: Array<{ key: string; rows?: Array<{ id: string }> }>;
    state: { step: string };
  };

try {
  await waitForHealth();
  check(
    'unsigned webhook POST → 401',
    (
      await fetch(`${BASE}/webhook`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      })
    ).status === 401,
  );
  const probe = '{"object":"whatsapp_business_account","entry":[]}';
  const sig = `sha256=${createHmac('sha256', 'smoke-secret').update(probe).digest('hex')}`;
  check(
    'signed empty probe → 200',
    (
      await fetch(`${BASE}/webhook`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-hub-signature-256': sig },
        body: probe,
      })
    ).status === 200,
  );
  check(
    'wrong verify token → 403',
    (await fetch(`${BASE}/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=1`))
      .status === 403,
  );
  check(
    'right verify token echoes challenge',
    (await (
      await fetch(
        `${BASE}/webhook?hub.mode=subscribe&hub.verify_token=smoke-verify&hub.challenge=77`,
      )
    ).text()) === '77',
  );
  const a = await simulate({ from: PHONE, text: 'Hola' });
  check('first contact asks for consent', a.replies[0]?.key === 'consent_request');
  const b = await simulate({ from: PHONE, buttonId: 'consent:yes' });
  check('consent button offers slots', b.replies[0]?.key === 'slot_list');
  const c = await simulate({ from: PHONE, buttonId: b.replies[0]!.rows![0]!.id });
  check('choosing a slot books it', c.state.step === 'booked');
  const agenda = async () =>
    (
      (await (
        await fetch(`${BASE}/api/agenda`, { headers: { authorization: 'Bearer smoke-dash' } })
      ).json()) as { appointments: Array<{ id: string; contact: string }> }
    ).appointments.filter((x) => x.contact.endsWith(PHONE.slice(-4)));
  const booked = await agenda();
  check('agenda lists the booking', booked.length === 1);
  if (persistent) {
    await stop(server);
    server = start();
    await waitForHealth();
    const health = (await (await fetch(`${BASE}/health/providers`)).json()) as {
      store: { active: string };
    };
    check('store is postgres', health.store.active === 'postgres');
    check('booking survives a restart', (await agenda())[0]?.id === booked[0]?.id);
    const confirm = await simulate({ from: PHONE, buttonId: 'appt:confirm' });
    check(
      'conversation survives a restart',
      confirm.state.step === 'booked' && confirm.replies[0]?.key === 'confirmed_ack',
    );
  }
  check('logs never contain the phone number', !output.includes(PHONE));
} catch (error) {
  check(`smoke run: ${error instanceof Error ? error.message : 'unknown'}`, false);
} finally {
  server.kill('SIGTERM');
}

for (const [name, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}`);
process.exit(checks.every(([, pass]) => pass) ? 0 : 1);
