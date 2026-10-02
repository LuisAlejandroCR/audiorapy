# audiorapy

A privacy-first assistant for a home-visit speech-language therapist (fonoaudióloga) in Colombia:
WhatsApp scheduling and reminders, session tracking with cue levels, and a web dashboard — with an
open-weight model (Gemma 4 via Ollama) doing the AI work on hardware she controls, so clinical notes
about children never leave her devices.

Built for the [DEV Hacktoberfest Weekend Challenge: Build for a Friend](https://dev.to/challenges/hacktoberfest-weekend-2026-10-01)
(window: 2026-10-02 02:00 UTC → 2026-10-05 06:59 UTC).

> Status: building. Weekend MVP in progress — see [docs/plan.md](docs/plan.md) for what is done and what is pending.

## Quick start

```bash
npm ci
npm run verify        # typecheck, lint, format, unit + fuzz + invariant tests, build
npm run test:unit     # each test folder also runs on its own
npm run test:fuzz
npm run test:invariant
```

Requires Node 22+. Copy `.env.example` to `.env` only when wiring real providers; everything runs
without it.

## Layout

| Path | What lives there |
|---|---|
| `packages/domain` | Pure TypeScript domain: ports, typed `PortResult`, no third-party SDKs |
| `apps/api` | WhatsApp webhook and scheduling API |
| `apps/web` | Therapist dashboard that decrypts clinical records in the browser |
| `test/` | `unit/`, `fuzz/`, `invariant/` (Vitest + fast-check) and `e2e/` (Playwright) |

## Docs

| File | What it answers |
|---|---|
| [docs/research-report.md](docs/research-report.md) | The full report (Spanish): weekend MVP vs roadmap, architecture, clinical data model and dashboards, zero-knowledge encryption under Colombian law, open-source AI core, sponsor categories with fallbacks, reuse from prior work, weekend plan |
| [docs/plan.md](docs/plan.md) | User story, acceptance criteria and build blocks with status (Spanish) |
| [docs/memoria.md](docs/memoria.md) | Architecture decisions and why (Spanish) |
| [docs/verificacion.md](docs/verificacion.md) | Dated evidence of what was verified and what is pending (Spanish) |
| [AGENTS.md](AGENTS.md) · [CLAUDE.md](CLAUDE.md) | Rules for coding agents working in this repo (Spanish) |
| [docs/research/](docs/research/) | The seven sourced research notes behind the report, including the official challenge page as primary source |

## Model input manifest

What each AI component sees — nothing else is sent to it.

| Component | Runs on | Sees | Never sees | Fallback |
|---|---|---|---|---|
| Intent classifier (Gemma 4 via Ollama) | Therapist's machine | The caregiver's free-text WhatsApp message (≤500 chars), which Meta already sees | Child name, clinical data | Deterministic Spanish rules (`classifyByRules`) |
| SOAP draft (Gemma 4 via Ollama, called from the dashboard) | Therapist's laptop, `localhost` | Target labels, correct/total counts, dominant cue level, the therapist's own short notes | Child name, age, address, diagnosis | Template note with `[completar]` |

The model never writes figures (any drafted sentence with a digit is replaced by `[completar]`), never
messages a caregiver (the bot only sends a fixed catalogue of templates and buttons), and every draft
stays `draft` until the therapist approves it.

## Prior work

Code ported from the author's earlier project [asegura](https://github.com/LuisAlejandroCR/asegura)
(WhatsApp channel adapter, webhook signature verification, conversation state machine) will be
credited here file by file, with the source commit and what changed.

## Post-deadline commits

None yet. Any commit after 2026-10-05 06:59 UTC will be listed here.

## License

[MIT](LICENSE)
