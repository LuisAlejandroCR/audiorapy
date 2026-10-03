---
title: My sister drives to her patients. Her notes about their kids stay on her laptop.
published: false
tags: devchallenge, weekendchallenge, hf26challenge
---

<!--
Draft of the DEV submission. Sections follow the official template. Every [[AUTHOR: …]] marker is
something only the author can supply (a quote, a link, a measured number); `npm run test:unit`
lists the ones still open. Delete this comment before publishing.
-->

*This is a submission for the [Hacktoberfest Weekend Challenge: Build for a Friend](https://dev.to/challenges/hacktoberfest-weekend-2026-10-01).*

## What I Built

My sister is a speech-language therapist (*fonoaudióloga*) in Colombia. She doesn't see children in a
clinic: she goes to their homes. Two parts of that job are what this project is about.

**Scheduling.** Every visit is arranged in WhatsApp chats with parents and grandparents: moving a visit
to another day, a child who is sick this week, a reminder nobody answers. When a confirmation slips
through, she finds out at the door.

**Session notes.** In a session she runs drills (say /r/ at the start of a word, ten tries) and for each
try she records whether the child got it and how much help it took: none, minimal, moderate or maximal
cueing. That *cue level* is the clinical signal: a child who goes from "needed a lot of help" to "got it
alone" is making progress even when the hit rate looks flat. Then each visit needs a SOAP note.

[[AUTHOR: replace or extend the two paragraphs above with how she actually works (how many families,
how she keeps the agenda today, what a bad week looks like). Only real details, with her permission.]]

**audiorapy** is a small assistant for exactly that slice:

- **Families book and confirm on WhatsApp with buttons.** "Hola" → a consent screen (Colombian data
  law requires explicit, optional authorization for health data) → open slots as a list → tap one →
  booked. Reminders go out at T−24 h with *Confirm / Reschedule / Cancel*.
- **Free text goes to an open-weight model.** When a grandmother types *"¿la corremos para la otra?"*
  ("can we push it to the next one?") instead of tapping, the message goes to Gemma 4 on Ollama to be
  classified. Plain Spanish rules handle the common phrasings (*"mejor el miércoles en la tarde"* gets
  Wednesday-afternoon slots) and take over whenever the model can't be reached. The model only
  classifies; the bot never sends text the model wrote.
- **Silence is escalated, never acted on.** If nobody answers a reminder, the visit is *not* cancelled.
  It lands in her agenda as an alert, because she knows that family and the bot doesn't.
- **A dashboard that decrypts in her browser.** Today's visits, progress by cue level per target sound,
  a session mode for logging tries, and a SOAP draft written by Gemma on `localhost`. The objective
  figures in the note are computed by code; the model is not allowed to write numbers.

[[AUTHOR: one or two sentences in your own words: how your sister reacted when you showed it to her,
quoted with her permission. The challenge gives bonus points for handing it over and saying what they said.]]

## Demo

[[AUTHOR: link to the 60-second video: book a visit with buttons, then unplug Ollama and book again.]]

[[AUTHOR: deployed dashboard URL on Render, or remove this line if it is not deployed.]]

| Today (phones masked) | SOAP draft (figures computed by code) | Progress by cue level |
|---|---|---|
| ![Today's agenda](https://raw.githubusercontent.com/LuisAlejandroCR/audiorapy/main/docs/screenshots/today-desktop.png) | ![SOAP draft](https://raw.githubusercontent.com/LuisAlejandroCR/audiorapy/main/docs/screenshots/soap-desktop.png) | ![Progress](https://raw.githubusercontent.com/LuisAlejandroCR/audiorapy/main/docs/screenshots/progress-mobile.png) |

Every name, phone number and session in these screenshots is synthetic. No real patient data exists
anywhere in the project.

You can run the whole booking flow on your machine without a WhatsApp account or a model:

```bash
git clone https://github.com/LuisAlejandroCR/audiorapy && cd audiorapy
npm ci && npm run dev:api
curl -s -X POST localhost:3000/dev/simulate -H 'content-type: application/json' \
  -d '{"from":"573001112233","text":"Hola"}'
```

## Code

{% github LuisAlejandroCR/audiorapy %}

## How I Built It

### The rule that shaped everything: the server must not be able to read a child's notes

Clinical records in Colombia are kept for 15 years, and these are notes about children's speech. So I
split the app into two planes:

| Plane | What it holds | Who can read it |
|---|---|---|
| **Scheduling** | phone number, appointment time and status, consent evidence, reminder jobs | the server and Meta (WhatsApp sees it anyway) |
| **Clinical** | session tries, cue levels, SOAP notes | only her browser, after she unlocks the vault |

"Zero-knowledge for clinical content, not for the calendar." Records are encrypted with
XChaCha20-Poly1305 under a random data key. That key is wrapped twice: by Argon2id from her passphrase,
and by a printed 24-word recovery phrase in Spanish, because losing the key would mean destroying a
legally required record. Backups are the same ciphertext.

### Where the open model sits

| Component | Runs on | Sees | Never sees | When it's off |
|---|---|---|---|---|
| Intent classifier — **Gemma 4 E4B on Ollama** | wherever the API can reach Ollama | the caregiver's free-text message (≤500 chars), which Meta already saw | child's name, any clinical data | deterministic Spanish rules |
| SOAP draft — **Gemma 4 E4B on Ollama**, called from the dashboard | her laptop, `localhost` | target labels, hit counts, dominant cue level, her own short notes | name, age, address, diagnosis | a template with `[completar]` blanks |
| No-show risk — **TabPFN-2** sidecar (logistic baseline today) | a private service | eight numeric attendance features | names, phones, anything clinical | a fixed heuristic |

One caveat about deployment: the classifier runs wherever the API can reach Ollama. When the API
runs on her laptop, that's `localhost`. The Render blueprint ships with the rules instead, until Ollama
sits behind an authenticated tunnel, so in the cloud deployment Gemma's job is the SOAP draft.

Three guardrails are enforced in code and tested, not just promised:

1. **Gemma's output is forced into a JSON Schema** (`format` in Ollama's `/api/chat`). A reply that
   doesn't validate is treated exactly like an outage.
2. **The model never writes a figure.** Any drafted sentence containing a digit becomes `[completar]`;
   the "O" (objective) of the SOAP note is computed from the logged tries.
3. **The model never talks to a family.** The bot only sends a fixed catalogue of messages and buttons.
   Meta's policy bans general-purpose AI chatbots on WhatsApp, and Colombian telehealth rules keep
   clinical content out of chat — and honestly, I wouldn't want a model improvising messages to a
   worried parent anyway.

### Every AI piece sits behind a port with a boring fallback

Each external piece — WhatsApp, Gemma, the risk model, the database — is an adapter behind a small
TypeScript interface that returns a typed result instead of throwing. If the model is down, the rules
answer. If the risk sidecar is down, the heuristic answers. `GET /health/providers` says which one
answered last.

`npm run demo:degraded` starts the real API once per outage — Ollama down, WhatsApp unreachable, risk
sidecar down, risk off, Ollama and risk down together, database down — and checks what must keep
working. It runs on every pull request: **26 checks**. Booking by buttons survives all of them; a
database that is configured but unreachable makes the API exit loudly instead of silently keeping
bookings in memory.

### How good is "good enough" without the model?

I wrote 40 caregiver replies the way Colombian families actually text, labeled them by hand, and score
every classifier against them:

| Classifier | Accuracy | Weekday / time-of-day preference |
|---|---|---|
| Rules only (the fallback) | **37/40 (93 %)** | 5/5 |
| Rules + Gemma 4 E4B | [[AUTHOR: run `npm run eval:intent -- --ollama` and paste the result]] | [[AUTHOR: same run]] |

The three messages the rules miss are idioms — *"toca moverla"*, *"¿la corremos para la otra?"*, *"quisiera
saber si reciben la EPS"*. I left them unfixed on purpose: they are what the model is for, and the CI
gate fails if the rules ever drop below 90 %.

For no-shows, a tiny Python service scores each new booking and only decides *how many* reminders to
send (an extra one at T−72 h for risky visits). Trained on 600 synthetic appointments:

| Model | ROC-AUC (synthetic holdout) |
|---|---|
| Logistic regression baseline | **0.675** |
| TabPFN-2 (Apache-2.0 V2 weights) | [[AUTHOR: run the `tabpfn-eval` workflow and paste the number]] |

These numbers say nothing about real families yet; they say the pipeline works end to end.

### Stack

- **Domain:** pure TypeScript with Zod, `@noble/ciphers`, `@noble/hashes`, `@scure/bip39`
- **API:** Fastify on Node 22 — signed Meta webhook (HMAC over the raw bytes, dedupe by message id),
  reminder cron, Postgres with an exclusion constraint so two families can never hold the same slot
- **Dashboard:** Vite + React with a strict CSP; everything decrypts client-side
- **AI:** Gemma 4 E4B on Ollama; TabPFN-2 / scikit-learn in a FastAPI sidecar
- **Deploy:** a Render Blueprint (API, static dashboard, Postgres, private risk service)
- **Tests:** Vitest + fast-check (unit, fuzz, invariant), PGlite and a real Postgres 16 in CI,
  Playwright end-to-end on mobile and desktop viewports, pytest + Hypothesis for the sidecar

The property tests earned their keep. One compares the in-memory store with Postgres over random
operation sequences and found that reactivating a cancelled visit onto a taken slot behaved differently
in each. Another, on the boundary between the API and the risk sidecar, found that a child's 501st
session would have produced a request the sidecar rejects. Both were fixed before anyone hit them.

## Why Does Open Innovation Matter?

For this project, it decided whether the thing could exist at all.

- **The data never has to leave her laptop.** The SOAP draft is written by a model running on
  `localhost`, from a note that was decrypted in that same browser. With a hosted API, "zero-knowledge
  for clinical content" would be false the moment she clicked *Draft*. With open weights, it's just a
  call to her own machine.
- **It doesn't depend on anyone else's server.** The model runs on her laptop, so drafting a note
  needs no API key, no account and no vendor uptime.
- **It costs nothing per note.** A solo practice shouldn't pay per-token pricing for paperwork.
- **The license lets me ship it.** Gemma 4 is the first Gemma generation under Apache 2.0, and TabPFN-2's
  V2 weights are Apache 2.0 too. I checked: newer TabPFN weights and some other Gemma variants have
  non-commercial or custom terms, and the code pins the versions that don't.
- **I can measure and swap it.** Because the model is a local port with an eval set, "is Gemma worth
  it over plain rules?" is a number I can produce on her hardware, not a vendor claim.

Where closed would have been "better": a frontier API would probably score higher on the three
idioms. But every one of those messages has a button-based path that works without any model, so the
open model only has to be *good*, not perfect — and being local is worth more than the last few points.

## My Agent Session

I built this over the weekend with Claude Code, one pull request per block, each with unit, fuzz and
invariant tests and a CI run before merging. The repo's [`docs/memoria.md`](https://github.com/LuisAlejandroCR/audiorapy/blob/main/docs/memoria.md)
logs every decision and why; [`docs/verificacion.md`](https://github.com/LuisAlejandroCR/audiorapy/blob/main/docs/verificacion.md)
separates what was actually verified from what is still pending.

[[AUTHOR: link to the saved agent session (DevRelay or Entire), or delete this line.]]

## Prize Categories

- **Best Use of Gemma** — Gemma 4 E4B on local Ollama is the intent classifier and the SOAP drafter.
- **Best Use of TabPFN** — the no-show risk sidecar. [[AUTHOR: keep only if the `tabpfn-eval` run produced a number.]]
- **Best Use of Render** — the Blueprint runs the API, dashboard, Postgres and the private risk service. [[AUTHOR: keep only if it is deployed.]]

## Prior work

The project and repository were started inside the challenge window. No code was copied from earlier
projects. The ports-and-adapters layout and the WhatsApp channel design follow my earlier project
[asegura](https://github.com/LuisAlejandroCR/asegura), re-implemented here from scratch (Fastify instead
of NestJS). The repo's agent rules and learnings log are adapted from my
[procedures](https://github.com/LuisAlejandroCR/procedures) templates.

---

*Resumen en español:* audiorapy ayuda a una fonoaudióloga que atiende niños a domicilio en Colombia: las
familias agendan y confirman por WhatsApp con botones, ella registra cada sesión con nivel de apoyo, y
las notas clínicas se cifran y descifran solo en su computador, con Gemma 4 corriendo localmente.
