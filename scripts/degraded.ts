// degraded.ts: "kill the provider" — starts the real API once per scenario with an external service
// configured but unreachable, and checks what must keep working. Never touches the real Meta or Ollama.
import { createHmac } from 'node:crypto';
import { startApi, waitForHealth, type ApiProcess } from './lib/api-process.ts';

const DEAD = 'http://127.0.0.1:9'; // discard port: connections are refused immediately
const SECRET = 'degraded-secret';
const TOKEN = 'degraded-dash';
const results: Array<{ scenario: string; check: string; pass: boolean }> = [];
let port = 3990;

type Reply = { key: string; rows?: Array<{ id: string; title: string }> };
type Sim = { replies: Reply[]; state: { step: string } };
type Providers = {
  channel: { active: string };
  intent: { active: string; last: { available: boolean; error: string | null } | null };
  risk: { active: string };
  store: { active: string };
};

async function scenario(
  name: string,
  env: Record<string, string>,
  body: (api: ApiProcess) => Promise<void>,
) {
  const api = startApi(port++, { DASHBOARD_TOKEN: TOKEN, META_APP_SECRET: SECRET, ...env });
  const check = (label: string, pass: boolean) =>
    results.push({ scenario: name, check: label, pass });
  try {
    check('process starts and /health answers', await waitForHealth(api.base, api.exited));
    await body(api);
  } catch (error) {
    check(`run: ${error instanceof Error ? error.message : 'unknown'}`, false);
  } finally {
    await api.stop();
  }
  return check;
}

const sim = async (api: ApiProcess, from: string, input: { text: string } | { buttonId: string }) =>
  (await (
    await fetch(`${api.base}/dev/simulate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ from, ...input }),
    })
  ).json()) as Sim;
const providers = async (api: ApiProcess) =>
  (await (await fetch(`${api.base}/health/providers`)).json()) as Providers;
const agenda = async (api: ApiProcess) =>
  (await (
    await fetch(`${api.base}/api/agenda`, { headers: { authorization: `Bearer ${TOKEN}` } })
  ).json()) as {
    appointments: unknown[];
    alerts: Array<{ reason: string }>;
  };

/** Hola → consent button → free-text preference → first offered slot. Returns the last step. */
async function bookByButtons(api: ApiProcess, from: string) {
  await sim(api, from, { text: 'Hola' });
  const offer = await sim(api, from, { buttonId: 'consent:yes' });
  const pref = await sim(api, from, { text: 'mejor el miércoles en la tarde' });
  const row = pref.replies[0]?.rows?.[0] ?? offer.replies[0]?.rows?.[0];
  const booked = await sim(api, from, { buttonId: row!.id });
  return { pref, booked };
}

const record = (name: string) => (label: string, pass: boolean) =>
  results.push({ scenario: name, check: label, pass });

await scenario('everything local (no keys)', {}, async (api) => {
  const c = record('everything local (no keys)');
  const p = await providers(api);
  c(
    'providers: console, rules, heuristic, memory',
    p.channel.active === 'console' &&
      p.intent.active === 'rules' &&
      p.risk.active === 'heuristic' &&
      p.store.active === 'memory',
  );
  c(
    'booking by buttons',
    (await bookByButtons(api, '573100000001')).booked.state.step === 'booked',
  );
});

await scenario(
  'Ollama down',
  { AI_INTENT_PROVIDER: 'ollama', OLLAMA_BASE_URL: DEAD, OLLAMA_TIMEOUT_MS: '1000' },
  async (api) => {
    const c = record('Ollama down');
    const { pref, booked } = await bookByButtons(api, '573100000002');
    c(
      'free text still understood by the rules (Wednesday afternoon offered)',
      pref.replies[0]?.rows?.[0]?.title.startsWith('mié') === true,
    );
    c('booking by buttons', booked.state.step === 'booked');
    const p = await providers(api);
    c(
      '/health/providers reports the model as unavailable',
      p.intent.active.startsWith('ollama:') && p.intent.last?.available === false,
    );
    c('caregiver text never logged', !api.output().includes('miércoles'));
  },
);

await scenario(
  'WhatsApp (Meta) unreachable',
  {
    META_ACCESS_TOKEN: 'not-a-real-token',
    META_PHONE_NUMBER_ID: '000000',
    META_GRAPH_BASE_URL: DEAD,
  },
  async (api) => {
    const c = record('WhatsApp (Meta) unreachable');
    const post = async (messages: unknown[]) => {
      const body = JSON.stringify({
        object: 'whatsapp_business_account',
        entry: [{ changes: [{ field: 'messages', value: { messages } }] }],
      });
      const sig = `sha256=${createHmac('sha256', SECRET).update(body).digest('hex')}`;
      return (
        await fetch(`${api.base}/webhook`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-hub-signature-256': sig },
          body,
        })
      ).status;
    };
    const from = '573100000003';
    const statuses = [
      await post([{ id: 'd1', from, type: 'text', text: { body: 'Hola' } }]),
      await post([
        {
          id: 'd2',
          from,
          type: 'interactive',
          interactive: { type: 'button_reply', button_reply: { id: 'consent:yes' } },
        },
      ]),
      await post([{ id: 'd3', from, type: 'text', text: { body: '¿Cuánto cuesta la visita?' } }]),
    ];
    await new Promise((r) => setTimeout(r, 1500));
    c(
      'webhook keeps answering 200',
      statuses.every((s) => s === 200),
    );
    c('failed sends are counted, not thrown', /"failed_sends":1/.test(api.output()));
    c(
      'the therapist still sees the question in the agenda',
      (await agenda(api)).alerts.some((a) => a.reason === 'question'),
    );
    c('/health still answers', (await fetch(`${api.base}/health`)).ok);
  },
);

await scenario('No-show risk off', { RISK_PROVIDER: 'off' }, async (api) => {
  const c = record('No-show risk off');
  c('/health/providers says off', (await providers(api)).risk.active === 'off');
  c(
    'booking by buttons',
    (await bookByButtons(api, '573100000004')).booked.state.step === 'booked',
  );
});

await scenario(
  'Ollama down + risk off at once',
  {
    AI_INTENT_PROVIDER: 'ollama',
    OLLAMA_BASE_URL: DEAD,
    OLLAMA_TIMEOUT_MS: '1000',
    RISK_PROVIDER: 'off',
  },
  async (api) => {
    const c = record('Ollama down + risk off at once');
    c(
      'booking by buttons',
      (await bookByButtons(api, '573100000005')).booked.state.step === 'booked',
    );
    c('agenda lists it', (await agenda(api)).appointments.length === 1);
  },
);

{
  const name = 'Database configured but down';
  const api = startApi(port++, {
    DATABASE_URL: 'postgres://audiorapy:s3cretpw@127.0.0.1:9/audiorapy',
  });
  const code = await Promise.race([
    api.exited,
    new Promise<'timeout'>((r) => setTimeout(() => r('timeout'), 20_000)),
  ]);
  if (code === 'timeout') await api.stop();
  record(name)('exits with code 1 instead of silently using memory', code === 1);
  record(name)(
    'says why (startup.store_unreachable)',
    api.output().includes('startup.store_unreachable'),
  );
  record(name)('never prints the database password', !api.output().includes('s3cretpw'));
}

let current = '';
for (const r of results) {
  if (r.scenario !== current) console.log(`\n${(current = r.scenario)}`);
  console.log(`  ${r.pass ? 'PASS' : 'FAIL'}  ${r.check}`);
}
const failed = results.filter((r) => !r.pass).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed === 0 ? 0 : 1);
