<!-- plan.md: qué se construye en audiorapy — historia de usuario, criterios de aceptación y bloques.
     Se distingue de memoria.md (cómo y por qué se decidió) y de verificacion.md (qué se comprobó y
     cuándo). Fuente de alcance: research-report.md. -->

# Plan — audiorapy

## Historia de usuario (la rebanada que carga la tesis)

> **Como** fonoaudióloga que atiende niños a domicilio, **quiero** que el cuidador agende y confirme
> la visita por WhatsApp con botones y que yo registre la sesión con nivel de apoyo, **para** dejar
> de coordinar a mano sin que una nota clínica salga de mis equipos.

## Criterios de aceptación de la rebanada

| # | Criterio | Bloque |
|---|---|---|
| A1 | Un webhook sin firma HMAC válida sobre los bytes crudos se rechaza con 401 | B3 |
| A2 | El mismo `message.id` entregado dos veces se procesa una sola vez | B3 |
| A3 | El flujo no ofrece cupos hasta que el cuidador acepta la autorización (Ley 1581) | B2, B3 |
| A4 | Con Ollama apagado, la reserva sigue funcionando por botones y reglas | B2, B3 |
| A5 | Ningún mensaje saliente contiene texto generado por el modelo, ni el nombre del niño | B2, B3 |
| A6 | Una cita sin respuesta al recordatorio nunca se cancela sola: se alerta a la terapeuta | B2 |
| A7 | Un registro clínico cifrado se descifra con la frase de paso **y** con la clave de recuperación, y falla con cualquier otra | B2, B4 |
| A8 | La "O" del SOAP se calcula desde los ensayos; el borrador del modelo no puede alterar cifras | B2, B4 |
| A9 | El dashboard funciona sin Ollama y muestra "IA no disponible" sin bloquear | B4 |
| A10 | `/health/providers` muestra qué adapter está activo y su último `checked_at` | B3 |

## Bloques (del más fácil al más difícil)

| Bloque | Entregable | PR | Estado |
|---|---|---|---|
| B1 | Monorepo, contrato de agente, docs, `npm run verify`, CI | `chore/scaffold-ci` (#2) | ✅ local y CI |
| B2 | Dominio: ports, clasificador por reglas, `SlotFinder`, máquina de conversación, recordatorios, sobre cifrado, SOAP "O", riesgo heurístico | `feat/domain-core` (#3) | ✅ local y CI (A3, A5, A6, A7, A8 cubiertos por invariantes) |
| B3 | API: webhook Meta (HMAC, dedupe), canal Meta/consola, clasificador Ollama con fallback, scheduler en memoria, `/health/providers` | `feat/api-webhook` (#4) | ✅ verificado local con dobles y proceso real (`smoke:api`); Meta y Ollama reales ⏳ |
| B4 | Dashboard web: desbloqueo, Hoy, progreso por nivel de apoyo, modo sesión, borrador SOAP, respaldo/restauración, e2e Playwright | `feat/web-dashboard` (#5) | ✅ verificado en navegador real (`playwright-cli` + 20 e2e); Ollama real ⏳ |
| B5 | Postgres (Render Postgres) detrás del port de repositorio | `feat/postgres-store` (#8) | ✅ contrato en memoria, PGlite y Postgres 16 real; la agenda sobrevive un reinicio. Render Postgres real ⏳ |
| B6 | Expo dev build: modo sesión ✓/✗ + apoyo + deshacer, SQLCipher, outbox | — | ⏳ roadmap (el modo sesión ya existe en web como puente) |
| B7 | Sidecar TabPFN-2 + CSV sintético + baseline logístico | `feat/risk-sidecar` (#10) | ✅ sidecar + baseline (AUC 0,675) + adaptador con fallback, probados en vivo. Cifra de TabPFN-2 ⏳ (workflow manual) |
| B8 | Mini-eval de 40 mensajes: reglas vs reglas + Gemma | `feat/intent-eval` (#7) | ✅ arnés + set + compuerta en CI; reglas 37/40. Columna Gemma ⏳ requiere Ollama real |
| B9 | Despliegue (Render) y prueba "matar al proveedor" grabada | `feat/deploy-degraded` (#9), `feat/render-risk` (#14) | ✅ `render.yaml` (API, dashboard, Postgres, sidecar privado) + test de consistencia; `npm run demo:degraded` 26/26 en CI. Deploy real y video ⏳ |
| B10 | Retención: purga de ids procesados (14 d) y recordatorios terminados (30 d) | `feat/retention-purge` (#11) | ✅ memoria, PGlite y Postgres 16 real |
| B11 | Sin doble reserva: restricción de exclusión + `book()` atómico | `feat/no-double-booking` (#13) | ✅ memoria, PGlite y Postgres 16 real, incluidas reservas concurrentes |
| B12 | Borrador del post de DEV en inglés | `docs/dev-post` (#15) | ✅ borrador + test; marcas `[[AUTHOR: …]]` ⏳ (cita, video, URL, cifras de Gemma y TabPFN) |

## Fuera de alcance del fin de semana

Pagos, RIPS/RDA/FEV, multi-terapeuta, app del cuidador, Temporal, Mastra, `whisper.rn`, Gemma en el
teléfono. Ver la tabla MVP vs roadmap del reporte.
