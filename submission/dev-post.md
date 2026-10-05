---
title: My sister drives to her patients. Her notes about them never leave her laptop.
published: true
tags: devchallenge, weekendchallenge, hf26challenge
---

*This is a submission for the [Hacktoberfest Weekend Challenge: Build for a Friend](https://dev.to/challenges/hacktoberfest-weekend-2026-10-01).*

## What I Built

My sister Andrea is a speech-language therapist in Colombia who treats patients at home: children
learning sounds, adults recovering speech after a stroke. Today she keeps her agenda in an Excel sheet,
calls each family one by one and confirms every visit on WhatsApp. (Named with her permission.)

**audiorapy** helps with that:

- **Families book with buttons.** "Hola" → consent → open slots → tap one → booked. Reminders go out
  24 h before with *Confirm / Reschedule / Cancel*.
- **Silence is flagged, never acted on.** If nobody answers, the visit is not cancelled; she gets an alert.
- **Session mode.** Every try is logged with its cue level (how much help it took), the real clinical signal.
- **SOAP notes drafted by Gemma on her own laptop.** Code computes the figures; she approves.
- **Notes are encrypted in her browser.** The server never sees clinical content.

## Demo

**Live:** [audiorapy.vercel.app](https://audiorapy.vercel.app) · dashboard at [/app/](https://audiorapy.vercel.app/app/)
(synthetic data, runs in your browser) · booking bot on Telegram: [@audiorapybot](https://t.me/audiorapybot), send "Hola".

| Landing | Phone app | SOAP draft |
|---|---|---|
| ![Landing](https://raw.githubusercontent.com/LuisAlejandroCR/audiorapy/main/docs/screenshots/landing-mobile.png) | ![Phone app](https://raw.githubusercontent.com/LuisAlejandroCR/audiorapy/main/docs/screenshots/mobile-app-today.png) | ![SOAP draft](https://raw.githubusercontent.com/LuisAlejandroCR/audiorapy/main/docs/screenshots/soap-desktop.png) |

All names and sessions are synthetic.

## Code

{% github LuisAlejandroCR/audiorapy %}

## How I Built It

- **Two planes.** Scheduling (phone, time, status) lives on the server. Clinical notes are encrypted with
  XChaCha20-Poly1305 in her browser; the key is wrapped by her passphrase (Argon2id) and a 24-word
  recovery phrase.
- **Gemma 4 E4B on Ollama** classifies free-text replies (*"¿la corremos para la otra?"*) and drafts SOAP
  notes on `localhost`. Its output is forced into a JSON Schema, it never writes a number, and it never
  talks to a family.
- **Every AI piece has a boring fallback.** Model down → Spanish rules (37/40 (93 %) on a hand-labeled set).
  Risk service down → heuristic. `npm run demo:degraded` checks 26 outage cases on every PR.
- **TabPFN-2** scores no-show risk to decide how many reminders to send: ROC-AUC **0.705** vs **0.675**
  for a logistic baseline (synthetic data).
- **Stack:** TypeScript, Fastify, Postgres, Vite + React, Expo, FastAPI. Deployed on Render and Vercel.
  Tested with Vitest + fast-check, Playwright and pytest + Hypothesis.

## Why Does Open Innovation Matter?

Because a closed API would break the promise. The note is decrypted in her browser and drafted by a
model on her own machine, so it never leaves her laptop. No API key, no per-note cost, no vendor uptime,
and Apache-2.0 licenses (Gemma 4, TabPFN-2 V2 weights) that let me ship it.

## My Agent Session

Built over the weekend with Claude Code, one pull request per block, each with tests and CI. Every
decision is logged in [`docs/memoria.md`](https://github.com/LuisAlejandroCR/audiorapy/blob/main/docs/memoria.md).

## Prize Categories

- **Best Use of Gemma** — intent classifier and SOAP drafter, running locally.
- **Best Use of TabPFN** — no-show risk sidecar.
- **Best Use of Render** — API, Postgres and the private risk service.
