<!-- README.md: public English entry point for audiorapy — what it is, how to run it, what is measured
     and what is pending. Spanish docs live in docs/; the DEV post draft in submission/. -->

# audiorapy

A privacy-first assistant for a home-visit speech-language therapist (fonoaudióloga) in Colombia:
WhatsApp scheduling and reminders, session tracking with cue levels, and a web dashboard — with an
open-weight model (Gemma 4 via Ollama) doing the AI work on hardware she controls, so clinical notes
about children never leave her devices.

Built for the [DEV Hacktoberfest Weekend Challenge: Build for a Friend](https://dev.to/challenges/hacktoberfest-weekend-2026-10-01)
(window: 2026-10-02 02:00 UTC → 2026-10-05 06:59 UTC).

> Status: the weekend slice works end to end locally and in CI (booking by buttons, reminders, encrypted
> dashboard, local Gemma drafts, no-show risk sidecar, Postgres). Not yet exercised against the real
> WhatsApp Cloud API, a real Ollama run, or a real Render deploy — see [docs/verificacion.md](docs/verificacion.md).

## Quick start

```bash
npm ci
npm run verify        # typecheck, lint, format, unit + fuzz + invariant tests, build
npm run test:unit     # each test folder also runs on its own
npm run test:fuzz
npm run test:invariant
npm run test:integration  # needs DATABASE_URL (a real Postgres)
npm run test:e2e      # Playwright, see below
```

Run the API locally (console channel: replies are kept in memory instead of sent to WhatsApp):

```bash
DASHBOARD_TOKEN=dev npm run dev:api
curl -s -X POST localhost:3000/dev/simulate -H 'content-type: application/json' \
  -d '{"from":"573001112233","text":"Hola"}'
npm run smoke:api     # starts the real process and checks webhook guards + booking over HTTP
```

| Endpoint | What it does |
|---|---|
| `GET /webhook` | Meta subscription handshake; 403 on a wrong verify token, 503 when none is configured |
| `POST /webhook` | Signed Meta deliveries: HMAC-SHA256 over the raw bytes, 401 when it does not match, dedupe by message id |
| `GET /health/providers` | Which channel, intent classifier, risk model and scheduler are active, and the last model result |
| `GET /api/agenda` | Appointments and therapist alerts (bearer `DASHBOARD_TOKEN`; phone numbers masked) |
| `POST /api/reminders/tick` | Runs the reminder cron once (it also runs every minute) |
| `POST /dev/simulate` | Development only, console channel only: feed a caregiver message through the real pipeline |

Run the therapist dashboard (decrypts in the browser; works without the API or Ollama):

```bash
npm run dev:web       # http://localhost:5173
npm run test:e2e      # Playwright: builds the dashboard, starts the real API, runs mobile + desktop
```

| Today (scheduling plane, phones masked) | Session note (figures computed by code) | Progress by cue level (synthetic data) |
|---|---|---|
| ![Today](docs/screenshots/today-desktop.png) | ![Session note](docs/screenshots/soap-desktop.png) | ![Progress](docs/screenshots/progress-mobile.png) |

The screenshots use synthetic data only; no real patient appears anywhere in this repo.

Persistence: without `DATABASE_URL` the API keeps the schedule in memory. Point it at Postgres (Render Postgres
in production; any Postgres 14+ works) and the schema is created at startup:

```bash
DATABASE_URL=postgres://user:pass@host:5432/db npm run dev:api
DATABASE_URL=... npm run test:integration   # store contract against that server
DATABASE_URL=... npm run smoke:api          # also restarts the process and checks nothing was lost
```

The database holds only the messaging plane — appointment time and status, consent evidence, reminder
jobs, alerts, processed message ids. Clinical records never reach it.

One visit at a time: Postgres refuses overlapping scheduled or confirmed appointments (an exclusion
constraint on the time range), so two families tapping the same slot at the same moment cannot both
get it — the second is told the slot was just taken and gets fresh options. Back-to-back visits are
fine; rescheduling cancels the old visit and books the new one in one transaction.

Reminders: messages from one family are handled one at a time, in arrival order, so a batched webhook
cannot make the bot lose track of a conversation. The reminder cron never runs twice at once, and a
reminder that could not be sent before the visit started is dropped instead of arriving late.

Retention: every 6 hours (and at startup) the API deletes processed message ids older than 14 days and
finished reminder jobs (sent or skipped) due more than 30 days ago. Appointments, consent evidence and
alerts are never deleted by this job.

Requires Node 22+. Copy `.env.example` to `.env` only when wiring real providers; everything runs
without it.

## Layout

| Path | What lives there |
|---|---|
| `packages/domain` | Pure TypeScript domain: ports, typed `PortResult`, no third-party SDKs |
| `apps/api` | WhatsApp webhook and scheduling API (Fastify): Meta and console channels, Gemma-on-Ollama intent with rules fallback, no-show risk adapter, reminder cron, memory or Postgres store with retention purge |
| `apps/web` | Therapist dashboard (Vite + React): vault with passphrase + 24-word recovery phrase, today's agenda, progress by cue level, session mode, SOAP drafts from local Ollama, encrypted backup/restore. Strict CSP in the build |
| `services/risk` | No-show risk sidecar (Python, FastAPI): logistic baseline, optional TabPFN-2; its pytest + Hypothesis tests live in `services/risk/tests` |
| `test/` | `unit/`, `fuzz/`, `invariant/` (Vitest + fast-check), `integration/` (real Postgres) and `e2e/` (Playwright) |
| `scripts/` | `smoke:api`, `smoke:risk`, `demo:degraded`, `eval:intent` — each starts real processes |
| `eval/` | The 40 labeled caregiver messages for the intent eval |
| `submission/` | Draft of the DEV post |

## Docs

| File | What it answers |
|---|---|
| [docs/research-report.md](docs/research-report.md) | The full report (Spanish): weekend MVP vs roadmap, architecture, clinical data model and dashboards, zero-knowledge encryption under Colombian law, open-source AI core, sponsor categories with fallbacks, reuse from prior work, weekend plan |
| [docs/plan.md](docs/plan.md) | User story, acceptance criteria and build blocks with status (Spanish) |
| [docs/memoria.md](docs/memoria.md) | Architecture decisions and why (Spanish) |
| [docs/auditoria.md](docs/auditoria.md) | Full audit against the rules in `AGENTS.md`: findings, fixes and the test behind each (Spanish) |
| [docs/verificacion.md](docs/verificacion.md) | Dated evidence of what was verified and what is pending (Spanish) |
| [AGENTS.md](AGENTS.md) · [CLAUDE.md](CLAUDE.md) | Rules for coding agents working in this repo (Spanish) |
| [submission/dev-post.md](submission/dev-post.md) | Draft of the DEV submission post; `[[AUTHOR: …]]` marks what only the author can fill in |
| [docs/research/](docs/research/) | The seven sourced research notes behind the report, including the official challenge page as primary source |

## Deploy (Render)

[`render.yaml`](render.yaml) is a Render Blueprint: the API as a Node web service, the dashboard as a static
site, Render Postgres for the schedule and the no-show risk sidecar as a private service (logistic baseline;
the API reaches it over Render's private network and falls back to the heuristic whenever it does not answer). Secrets are entered in the Render dashboard (`sync: false`);
`DASHBOARD_TOKEN` is generated. After the first deploy, set `DASHBOARD_ORIGIN` on the API and
`VITE_API_ORIGIN` on the dashboard to each other's URL. The blueprint has not been through a real Render
deploy yet.

If the database is configured but unreachable at startup, the API exits with
`startup.store_unreachable` instead of silently falling back to memory.

## What still works when a provider is down

`npm run demo:degraded` starts the real API once per scenario with one external service configured but
unreachable, and checks what must keep working (it also runs in CI):

| Scenario | What keeps working |
|---|---|
| Ollama down | Booking by buttons; free text still understood by the rules; `/health/providers` shows the model as unavailable |
| WhatsApp (Meta) unreachable | Webhook keeps answering 200; failed sends are counted, not thrown; the therapist still sees escalations in the agenda |
| Risk sidecar down | Booking by buttons; reminders planned with the heuristic; `/health/providers` shows the sidecar as unavailable |
| No-show risk off | Booking with the fixed reminder cadence |
| Ollama down + risk off | Booking by buttons, agenda |
| Database down at startup | Nothing pretends to work: exit code 1 with a clear reason, password never printed |

The dashboard's own degraded states (no API, no Ollama) are covered by the Playwright suite.

## No-show risk (TabPFN-2)

[`services/risk`](services/risk) is a small Python sidecar that scores each new visit's no-show risk; the
score only decides how many reminders to send (one more at T−72 h for medium or high risk). It sees
eight numeric attendance features — lead time, weekday, hour, zone, session number, prior visits, prior
no-shows, whether the last reminder was answered — and never a name, phone number or clinical data.

```bash
cd services/risk && python -m pip install '.[dev]'
python -m risk.evaluate                                   # ROC-AUC on a synthetic holdout
RISK_MODEL=logistic uvicorn --factory risk.app:build_app --port 8090
RISK_PROVIDER=sidecar npm run dev:api                     # the API scores through it, heuristic if it is down
```

| Model | ROC-AUC (synthetic holdout, 180 rows) | Measured |
|---|---|---|
| Logistic regression (baseline) | 0.675 | 2026-10-02, CI and local |
| TabPFN-2 (`ModelVersion.V2`, Apache-2.0 weights) | ⏳ pending | run the `tabpfn-eval` workflow from the Actions tab |

Both models are trained on **synthetic** data (600 invented appointments); the numbers say nothing about
real families until it is retrained on real attendance. `tabpfn` 9.x defaults to non-commercial weights,
so the code always asks for V2 explicitly; `tabpfn-client` (which sends data to Prior Labs) is not used.

## Intent eval

40 invented caregiver replies in Colombian Spanish, labeled by hand ([eval/intents.es-CO.json](eval/intents.es-CO.json)).
The rules classifier is scored on every CI run and may not drop below 90 %.

```bash
npm run eval:intent                    # rules only
npm run eval:intent -- --ollama        # rules and Gemma 4 on your local Ollama (OLLAMA_MODEL, OLLAMA_BASE_URL)
```

| Classifier | Accuracy | Weekday / time-of-day preference | Measured |
|---|---|---|---|
| Rules (deterministic fallback) | 37/40 (93 %) | 5/5 | 2026-10-02, CI and local |
| Rules + Gemma 4 E4B | ⏳ pending | ⏳ | needs a run on the therapist's laptop |

The three messages the rules miss are idiomatic ("toca moverla", "¿la corremos para la otra?", "Quisiera saber
si reciben la EPS"); they are left unfixed on purpose so the set keeps measuring what the model adds.

## Model input manifest

What each AI component sees — nothing else is sent to it.

| Component | Runs on | Sees | Never sees | Fallback |
|---|---|---|---|---|
| Intent classifier (Gemma 4 via Ollama) | Wherever the API can reach Ollama: the therapist's machine when the API runs there. The Render blueprint ships with `rules` until Ollama sits behind an authenticated tunnel | The caregiver's free-text WhatsApp message (≤500 chars), which Meta already sees | Child name, clinical data | Deterministic Spanish rules (`classifyByRules`) |
| SOAP draft (Gemma 4 via Ollama, called from the dashboard) | Therapist's laptop, `localhost` | Target labels, correct/total counts, dominant cue level, the therapist's own short notes | Child name, age, address, diagnosis | Template note with `[completar]` |

The model never writes figures (any drafted sentence with a digit is replaced by `[completar]`), never
messages a caregiver (the bot only sends a fixed catalogue of templates and buttons), and every draft
stays `draft` until the therapist approves it.

## Prior work

The project and this repository were started inside the challenge window. No code was copied from
earlier projects: the ports-and-adapters layout and the WhatsApp channel design follow the author's
earlier project [asegura](https://github.com/LuisAlejandroCR/asegura), re-implemented here from scratch
(Fastify instead of NestJS). `AGENTS.md` and `LEARNINGS.md` are adapted from the author's
[procedures](https://github.com/LuisAlejandroCR/procedures) templates.

## Post-deadline commits

None yet. Any commit after 2026-10-05 06:59 UTC will be listed here.

## License

[MIT](LICENSE)
