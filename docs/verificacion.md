<!-- verificacion.md: evidencia con fecha de lo que se comprobó en audiorapy y lo que sigue pendiente.
     Se distingue de memoria.md (decisiones) y de plan.md (alcance). Nada aquí sin fecha ni comando. -->

# Verificación

## Compuerta local

| Fecha | Comando | Resultado | Entorno |
|---|---|---|---|
| 2026-10-02 | `npm run verify` | PASS — 3 archivos, 6 tests | Linux, Node 22.22.0 |
| 2026-10-02 | `npm run verify` (B2) | PASS — 103 tests: unit 76, fuzz 10, invariant 17 | Linux, Node 22.22.0 |
| 2026-10-02 | `npm run test:invariant` ×3 | PASS las tres corridas (semillas aleatorias) | Linux, Node 22.22.0 |

## Mutaciones (la suite se pone roja cuando la promesa se rompe)

| Fecha | Mutación en `conversation.ts` | Test que la atrapa |
|---|---|---|
| 2026-10-02 | Un texto "cancelar" cancela sin botón | `only the explicit cancel button cancels…` |
| 2026-10-02 | Un texto "sí" cuenta como consentimiento | `never offers slots before a consent:yes…` y `consent is recorded as accepted only…` |

## Límites externos (ejercicio contra la cosa real)

| Límite | Estado | Nota |
|---|---|---|
| Meta WhatsApp Cloud API (envío y webhook) | ⏳ pendiente | Requiere la app y el número de prueba del autor |
| Ollama + `gemma4:e4b` | ⏳ pendiente | No hay Ollama en el entorno de CI ni en la sesión en la nube |
| Dashboard en navegador real | ⏳ pendiente | B4 |

## Pendientes conocidos

- CI en GitHub Actions: ⏳ se verifica en el primer PR.
