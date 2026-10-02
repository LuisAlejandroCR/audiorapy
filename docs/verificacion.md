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
| Dashboard en navegador real | ⏳ pendiente | B4 |

## Pendientes conocidos

- CI en GitHub Actions: ⏳ se verifica en el primer PR.
