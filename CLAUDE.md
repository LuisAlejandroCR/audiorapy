<!-- CLAUDE.md: capa específica de Claude Code para audiorapy — misión, contexto, stack y variables.
     No reemplaza a AGENTS.md (la constitución). Plantilla: procedures/templates/CLAUDE.md. -->

# CLAUDE.md — audiorapy

> Guía para Claude Code en este repositorio. **No reemplaza a [`AGENTS.md`](AGENTS.md).**

## Norte — la misión

> *Una fonoaudióloga que atiende niños a domicilio en Colombia confirma sus visitas por WhatsApp con
> botones y registra cada sesión con nivel de apoyo, sin que una nota clínica salga de sus equipos.*

Cosas que tienen que ser ciertas:

1. La reserva funciona por botones aunque la IA esté apagada.
2. El contenido clínico solo existe en claro en el dispositivo de la terapeuta; el servidor guarda
   texto cifrado. "Zero-knowledge for clinical content, not for the calendar."
3. La IA nunca decide ni escribe al cuidador: clasifica, redacta borradores y la terapeuta aprueba.

## Contexto

| Dato | Valor |
|---|---|
| Entrega | DEV Hacktoberfest Weekend Challenge — cierre **2026-10-05 06:59 UTC** (lun 01:59 COT) |
| Criterio | IA open-source en el núcleo; calidad del post en inglés pesa más que todo |
| Usuaria | La hermana del autor ("the friend") |
| Fuente de decisiones | [`docs/research-report.md`](docs/research-report.md) |

## Arranque de sesión

Leer `AGENTS.md`, `docs/memoria.md`, `docs/verificacion.md`, luego `git status`. Correr
`npm ci && npm run verify` antes de tocar código.

## Exclusiones no negociables

| Excluido | Razón |
|---|---|
| Audio del niño por IA | El ASR "corrige" la sustitución fonológica, que es la señal clínica |
| Texto generado enviado por WhatsApp | Política de Meta (sin chatbots de propósito general) y Res. 1644/2026 |
| Datos clínicos por WhatsApp | Solo logística; la tarea en casa va por enlace propio |
| Datos reales de pacientes | Demo y tests usan solo datos sintéticos etiquetados |
| Gemma 3n / FunctionGemma / TabPFN ≥2.5 | Licencias no Apache o no comerciales |
| Cancelación automática por silencio | Lección documentada (IMSALUD); se alerta a la terapeuta |

## Variables de entorno

Viven en `.env` (gitignored); nombres en [`.env.example`](.env.example). Nunca imprimir valores.

| Variable | Estado |
|---|---|
| `META_ACCESS_TOKEN`, `META_PHONE_NUMBER_ID`, `META_APP_SECRET`, `META_VERIFY_TOKEN` | ⏳ pendiente (requiere la app de Meta del autor) |
| `AI_INTENT_PROVIDER`, `OLLAMA_BASE_URL`, `OLLAMA_MODEL` | ⏳ pendiente de probar contra Ollama real |
| `RISK_PROVIDER` | ✅ `heuristic` funciona sin servicio externo |
| `DATABASE_URL` | ✅ opcional: vacío = memoria; probado con Postgres 16 local y PGlite; job `postgres` en CI. Render Postgres real ⏳ |

## Stack

| Capa | Tecnología |
|---|---|
| Dominio | `packages/domain` — TypeScript puro, Zod, `@noble/ciphers`/`@noble/hashes` |
| API / webhook | `apps/api` — Fastify sobre Node 22; agenda en Postgres (`DATABASE_URL`) o en memoria |
| Dashboard | `apps/web` — Vite + React, descifra en el navegador |
| Móvil | `apps/mobile` — Expo dev build (⏳ pendiente) |
| IA | Gemma 4 en Ollama (local) con fallback a reglas |
| Tests | Vitest + fast-check (unit/fuzz/invariant/integration), PGlite, Playwright (e2e), `playwright-cli` (verificación manual) |
| CI | GitHub Actions — `.github/workflows/ci.yml` |

## Idioma

| Qué | Idioma |
|---|---|
| Código, nombres de archivos, commits | Inglés |
| UI (lo que lee la terapeuta y el cuidador) | Español de Colombia |
| `README.md` | Inglés (el reto premia solo entregas en inglés) |
| `docs/`, `AGENTS.md`, `CLAUDE.md`, `LEARNINGS.md` | Español |

## Referencias

- Constitución → [`AGENTS.md`](AGENTS.md)
- Plan y criterios → [`docs/plan.md`](docs/plan.md)
- Decisiones y bitácora → [`docs/memoria.md`](docs/memoria.md)
- Verificado y pendiente → [`docs/verificacion.md`](docs/verificacion.md)
- Aprendizajes → [`LEARNINGS.md`](LEARNINGS.md)
- Procedimientos fuente → <https://github.com/LuisAlejandroCR/procedures>
