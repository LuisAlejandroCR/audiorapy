<!-- verificacion.md: evidencia con fecha de lo que se comprobó en audiorapy y lo que sigue pendiente.
     Se distingue de memoria.md (decisiones) y de plan.md (alcance). Nada aquí sin fecha ni comando. -->

# Verificación

## Compuerta local

| Fecha | Comando | Resultado | Entorno |
|---|---|---|---|
| 2026-10-02 | `npm run verify` | PASS — 3 archivos, 6 tests | Linux, Node 22.22.0 |
| 2026-10-02 | `npm run verify` (B2) | PASS — 103 tests: unit 76, fuzz 10, invariant 17 | Linux, Node 22.22.0 |
| 2026-10-02 | `npm run verify` (B3) | PASS — 144 tests: unit 110, fuzz 14, invariant 20 | Linux, Node 22.22.0 |
| 2026-10-02 | `npm run smoke:api` | PASS 9/9 — proceso real: 401 sin firma, 200 sonda firmada, 403 token malo, reto devuelto, consentimiento → cupos → reserva, agenda, logs sin teléfono | Linux, Node 22.22.0 |
| 2026-10-02 | `npm run verify` (B4) | PASS — 157 tests: unit 119, fuzz 17, invariant 21; build web 385 kB JS (124 kB gzip) | Linux, Node 22.22.0 |
| 2026-10-02 | `npm run test:e2e` ×2 | PASS 20/20 las dos corridas (10 tests × móvil Pixel 7 y escritorio) | Chromium 141 (`PW_CHROMIUM_PATH`), Playwright 1.63 |
| 2026-10-02 | Paleta azul y blanco: `npm run verify` + `npm run test:e2e` | PASS — 157 tests; e2e 20/20; contraste texto ≥ 5,8:1 en claro y oscuro; `playwright-cli` a 360 px `{ overflow: false, h1: 1, small: 0 }`, 0 errores de consola | Chromium 141 |
| 2026-10-02 | `npm run eval:intent` (reglas) | 37/40 (93 %), preferencia 5/5, p95 1 ms. Fallas: "Mi niño amaneció enfermo, toca moverla" → `unknown`; "¿la corremos para la otra?" → `question`; "Quisiera saber si reciben la EPS" → `unknown` | Linux, Node 22.22.0 |
| 2026-10-02 | `eval:intent` códigos de salida | 0 con `--min-accuracy 0.9`; 1 con `0.95`; 2 con `--ollama` sin Ollama | Linux, Node 22.22.0 |
| 2026-10-02 | `npm run test:integration` contra Postgres 16.14 local | PASS 9/9 (contrato completo, incluido dedupe concurrente con pool de 10 conexiones); sin `DATABASE_URL` falla con mensaje explícito | Linux, Node 22.22.0 |
| 2026-10-02 | `DATABASE_URL=… npm run smoke:api` ×2 | PASS 12/12 las dos corridas: reserva y conversación sobreviven al reinicio del proceso; `/health/providers` dice `postgres` | Postgres 16.14 |
| 2026-10-02 | `npm run demo:degraded` | PASS 22/22: sin claves, Ollama caído, Meta inalcanzable, riesgo apagado, Ollama + riesgo apagados, base caída al arrancar | Linux, Node 22.22.0 |
| 2026-10-02 | API con `NODE_ENV=production` | `/health` 200, `/dev/simulate` 404, `POST /webhook` sin secreto 503 | Linux, Node 22.22.0 |
| 2026-10-02 | `pytest` en `services/risk` ×2 (y en un venv limpio) | PASS 12/12: unit, fuzz (Hypothesis, 600 cuerpos) e invariante (400 entradas válidas) | Python 3.11.15 |
| 2026-10-02 | `python -m risk.evaluate` | Logística 0,675 ROC-AUC (holdout 180, sintético, 22 % inasistencia); TabPFN-2 "unavailable: tabpfn is not installed" | Python 3.11.15 |
| 2026-10-02 | `npm run smoke:risk` ×2 | PASS 6/6: sidecar real + API real, la reserva se puntúa por el sidecar (`sidecar:logistic`) | Linux |
| 2026-10-02 | `npm run demo:degraded` | PASS 26/26 (nuevo escenario: sidecar de riesgo caído → heurística) | Linux |
| 2026-10-02 | Retención: contrato en memoria, PGlite y Postgres 16.14 real | PASS (integración 10/10); smoke con Postgres 12/12; la API registra `maintenance.purged` con conteos al arrancar | Linux, Node 22.22.0 |
| 2026-10-02 | Sin doble reserva: contrato en memoria, PGlite y Postgres 16.14 real ×3 | PASS 13/13 en Postgres real, incluidas 8 reservas concurrentes del mismo cupo con pool de 10 conexiones (gana exactamente una); smoke 12/12; la restricción `appointments_no_overlap` existe en la base | Linux, Node 22.22.0 |
| 2026-10-02 | Invariante diferencial memoria vs Postgres ×8 | PASS 8/8 tras dos correcciones: reactivar una cita sobre un cupo ya tomado divergía (ahora `SlotTakenError` en ambos) y el orden de empates por id aleatorio hacía el test intermitente | Linux |
| 2026-10-02 | `npm run test:invariant` ×3 | PASS las tres corridas (semillas aleatorias) | Linux, Node 22.22.0 |

## Mutaciones (la suite se pone roja cuando la promesa se rompe)

| Fecha | Mutación | Test que la atrapa |
|---|---|---|
| 2026-10-02 | `conversation.ts`: un texto "cancelar" cancela sin botón | `only the explicit cancel button cancels…` |
| 2026-10-02 | `conversation.ts`: un texto "sí" cuenta como consentimiento | `never offers slots before a consent:yes…` y `consent is recorded as accepted only…` |
| 2026-10-02 | `inbox.ts`: se desactiva el dedupe por `message.id` | `A2: redelivering any message…` |
| 2026-10-02 | `postgres-store.ts`: el dedupe hace `DO UPDATE` en vez de `DO NOTHING` | contrato `dedupes message ids` y `…concurrent deliveries…` |
| 2026-10-02 | `rules-intent.ts`: el respaldo devuelve `unknown` cuando Ollama falla | `demo:degraded` → "free text still understood by the rules" |
| 2026-10-02 | `risk/app.py`: el sidecar lanza error con `zone == 9` | `test_score_bounded_consistent_deterministic` (Hypothesis, 4 min encogiendo) |
| 2026-10-02 | `memory-store.ts`: la purga borra también recordatorios pendientes | invariante de retención |
| 2026-10-02 | `postgres-store.ts`: la purga ignora el estado del recordatorio | invariante diferencial memoria vs Postgres (2/2) |
| 2026-10-02 | `schema.ts`: sin la restricción de exclusión | contrato (3 casos fallan, incluido el de concurrencia) |
| 2026-10-02 | `memory-store.ts`: `book()` no revisa solapes | contrato + invariante diferencial (4 fallan) |
| 2026-10-02 | `inbox.ts`: ignorar el cupo perdido | `two families tap the same slot…` |
| 2026-10-02 | `postgres-store.ts`: cancelar no salta los recordatorios pendientes | invariante diferencial memoria vs Postgres (3/3 tras sesgar el generador) |

## Límites externos (ejercicio contra la cosa real)

| Límite | Estado | Nota |
|---|---|---|
| Meta WhatsApp Cloud API (envío y webhook) | ⏳ pendiente | Requiere la app y el número de prueba del autor. Probado solo contra un doble de la Graph API v25.0. Falta: `debug_token` = `SYSTEM_USER`, "Hola" real, mensaje con tildes real |
| Deploy en Render (`render.yaml`) | ⏳ pendiente | render.com bloqueado por la red de la sesión; el blueprint no se validó contra Render. Falta: crear el Blueprint, fijar `DASHBOARD_ORIGIN` y `VITE_API_ORIGIN` |
| TabPFN-2 (pesos V2) | ⏳ pendiente | Hugging Face bloqueado en la sesión. Correr el workflow `tabpfn-eval` (Actions → Run workflow) y copiar la tabla al README |
| Plantilla *utility* del recordatorio | ⏳ pendiente | Fuera de la ventana de 24 h un interactivo no basta; hay que registrar y aprobar la plantilla en Meta |
| Ollama + `gemma4:e4b` | ⏳ pendiente | No hay Ollama en la sesión en la nube. Probado contra un doble de `/api/chat` con `format` = JSON Schema. Falta: correr `npm run eval:intent -- --ollama` en la laptop de la terapeuta (precisión y latencia reales) |
| Dashboard en navegador real | ✅ 2026-10-02 | Ver la sección `playwright-cli` abajo |

## Pendientes conocidos

- CI en GitHub Actions: ⏳ se verifica en el primer PR.

## Navegador real con `playwright-cli` (2026-10-02)

Build de producción (`vite preview`, CSP activa) + proceso real de la API en canal consola.
Chromium 141, `--mobile` (360 px) y luego 1100 × 900.

| Paso | Observación |
|---|---|
| Carga inicial | 0 errores de consola; CSP presente |
| Crear bóveda | 24 palabras en español (con tildes: `tabú`, `líquido`, `vehículo`); "Continuar" deshabilitado hasta marcar la casilla |
| Hoy sin token | `Agenda no disponible: API no configurada` — el resto del dashboard sigue funcionando |
| Hoy con token | Visita agendada por el simulador aparece; teléfono como `••••2233`; aviso "Pregunta de la familia" |
| Progreso | 3 gráficos, etiqueta "datos sintéticos" |
| Medición a 360 px | `{ overflow: false, h1: 1, small: [] }` (objetivos táctiles ≥ 44 px) |
| SOAP con Ollama apagado | `IA no disponible (Failed to fetch)`; S/A/P = `[completar]`; O calculado; "Aprobar" deshabilitado |
| SOAP con Ollama simulado (`playwright-cli route`) | La oración "Logró 100 % hoy." se reemplaza por `[completar]`; aprobar exige completarla |
| Almacenamiento | 9 entradas; no contiene `sintético`, `práctica` ni `/s/ inicial` (solo texto cifrado) |
| Bloquear → clave de recuperación sin tildes y en mayúsculas | Desbloquea; la nota aprobada sigue ahí |
| Consola | Único error: `ERR_CONNECTION_REFUSED` a `127.0.0.1:11434` — es la ruta degradada esperada sin Ollama |

Capturas: `docs/screenshots/` (datos sintéticos; la respuesta de Ollama de la captura SOAP es simulada, por eso dice "0.0 s").
