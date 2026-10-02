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
| 2026-10-02 | `npm run test:invariant` ×3 | PASS las tres corridas (semillas aleatorias) | Linux, Node 22.22.0 |

## Mutaciones (la suite se pone roja cuando la promesa se rompe)

| Fecha | Mutación | Test que la atrapa |
|---|---|---|
| 2026-10-02 | `conversation.ts`: un texto "cancelar" cancela sin botón | `only the explicit cancel button cancels…` |
| 2026-10-02 | `conversation.ts`: un texto "sí" cuenta como consentimiento | `never offers slots before a consent:yes…` y `consent is recorded as accepted only…` |
| 2026-10-02 | `inbox.ts`: se desactiva el dedupe por `message.id` | `A2: redelivering any message…` |

## Límites externos (ejercicio contra la cosa real)

| Límite | Estado | Nota |
|---|---|---|
| Meta WhatsApp Cloud API (envío y webhook) | ⏳ pendiente | Requiere la app y el número de prueba del autor. Probado solo contra un doble de la Graph API v25.0. Falta: `debug_token` = `SYSTEM_USER`, "Hola" real, mensaje con tildes real |
| Plantilla *utility* del recordatorio | ⏳ pendiente | Fuera de la ventana de 24 h un interactivo no basta; hay que registrar y aprobar la plantilla en Meta |
| Ollama + `gemma4:e4b` | ⏳ pendiente | No hay Ollama en la sesión en la nube. Probado contra un doble de `/api/chat` con `format` = JSON Schema. Falta: latencia real y mini-eval (B8) |
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
