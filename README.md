# audiorapy

A privacy-first assistant for a home-visit speech-language therapist (fonoaudióloga) in Colombia:
WhatsApp scheduling and reminders, session tracking with cue levels, and a web dashboard — with an
open-weight model (Gemma 4 via Ollama) doing the AI work on hardware she controls, so clinical notes
about children never leave her devices.

Built for the [DEV Hacktoberfest Weekend Challenge: Build for a Friend](https://dev.to/challenges/hacktoberfest-weekend-2026-10-01)
(window: 2026-10-02 02:00 UTC → 2026-10-05 06:59 UTC).

> Status: research and architecture. No application code yet.

## Docs

| File | What it answers |
|---|---|
| [docs/research-report.md](docs/research-report.md) | The full report (Spanish): weekend MVP vs roadmap, architecture, clinical data model and dashboards, zero-knowledge encryption under Colombian law, open-source AI core, sponsor categories with fallbacks, reuse from prior work, weekend plan |
| [docs/research/](docs/research/) | The seven sourced research notes behind the report, including the official challenge page as primary source |

## Prior work

Code ported from the author's earlier project [asegura](https://github.com/LuisAlejandroCR/asegura)
(WhatsApp channel adapter, webhook signature verification, conversation state machine) will be
credited here file by file, with the source commit and what changed.

## Post-deadline commits

None yet. Any commit after 2026-10-05 06:59 UTC will be listed here.
