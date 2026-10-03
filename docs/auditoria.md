<!-- auditoria.md: auditoría completa del proyecto contra los ocho bloques de AGENTS.md — qué se revisó,
     qué se encontró y qué se corrigió. Se distingue de verificacion.md (evidencia de cada comando) y de
     memoria.md (decisiones): aquí está el informe de una revisión puntual, con fecha. -->

# Auditoría — 2026-10-02 (PR #17)

Alcance: todo el repo en `main` tras el PR #16 — `packages/domain`, `apps/api`, `apps/web`,
`services/risk`, `scripts/`, `render.yaml`, CI y todos los `.md`. Método: lectura del código que toca
entrada no confiable o servicios externos, `knip` para código muerto, scripts de cabeceras, y cada
hallazgo reproducido con un test **antes** de corregirlo (y la corrección probada con una mutación).

## Hallazgos corregidos

| # | Bloque | Hallazgo | Impacto | Corrección | Test que lo fija |
|---|---|---|---|---|---|
| 1 | Seguridad / UX | `Inbox.enqueue` procesaba en paralelo los mensajes de un mismo contacto. Dos mensajes en el mismo webhook (Meta los agrupa) o dos toques rápidos leían el mismo estado de conversación y el último en escribir ganaba | Reproducido: "Hola" + "Sí, acepto" + "el miércoles en la tarde" en un lote dejaban a la familia otra vez en `awaiting_consent`, con la autorización pedida dos veces y la preferencia perdida | Cola por contacto: cada mensaje espera al anterior del mismo contacto; contactos distintos siguen en paralelo | `inbox-order.invariant.spec.ts` (300 corridas): un lote termina igual que procesar uno a uno. Sin la corrección, contraejemplo mínimo: dos `consent:yes` seguidos |
| 2 | Observabilidad | El cron de recordatorios (cada minuto) y el tick manual del dashboard podían correr a la vez; con Meta lento, un tick dura más de un minuto | El mismo recordatorio enviado dos veces | `singleFlight`: las llamadas que se solapan comparten la corrida en curso; el timer y la ruta usan la misma instancia (`app.tickReminders`) | `reminders.spec.ts`: dos ticks con un canal lento intentan un solo envío; sin la corrección, dos |
| 3 | UX | Un recordatorio que falló (Meta caído) quedaba pendiente y se reintentaba cada minuto **sin límite**, incluso después de la visita | "Tienes una visita mañana" llegando cuando la visita ya pasó | Al empezar la visita, los recordatorios pendientes se marcan `skipped`; el chequeo de silencio sigue alertando a la terapeuta | `reminders.spec.ts`: con el canal caído y luego de vuelta tras la hora de la visita, no se envía nada y llega la alerta |
| 4 | Observabilidad | El pool de Postgres no tenía timeout de consulta | Con `max: 5`, cinco consultas colgadas bloquean toda la API | `statement_timeout` 10 s (servidor) y `query_timeout` 15 s (cliente) | Probado contra Postgres 16 real: `pg_sleep(12)` se cancela a los 10 002 ms con `57014` |
| 5 | Escritura / honestidad | El post y el manifiesto del README decían que el clasificador de intención corre en "la máquina de la terapeuta"; en el blueprint de Render la API está en la nube y usa `rules` | El post prometía algo que el despliegue no hace | El README y el post dicen dónde corre de verdad y qué hace Gemma en el despliegue en la nube (el borrador SOAP). El ejemplo del post pasa a un modismo que las reglas no entienden | `submission.spec.ts` sigue verde |
| 6 | Documentación | Las siete notas de `docs/research/` no tenían la cabecera HTML que exige AGENTS.md | — | Cabecera agregada | Script de cabeceras: 0 faltantes |

## Revisado sin hallazgos

| Bloque | Qué se revisó |
|---|---|
| Seguridad | HMAC sobre bytes crudos con `timingSafeEqual`, falla cerrado (503 sin secreto, 401 sin firma). `parseWebhook` con Zod y límites de longitud. Token del dashboard comparado en tiempo constante y guardado en `sessionStorage`. CSP estricta en el build. SQL 100 % parametrizado (`APPT_COLUMNS` es constante). `/dev/simulate` solo fuera de producción y con canal consola. El sidecar no expone `/docs` ni OpenAPI y valida cada campo con límites |
| Código muerto | `knip`: sin archivos ni dependencias sin uso. Diez exports solo se usan dentro de su propio archivo; se dejan (no es código muerto) |
| Arquitectura | `packages/domain` sin SDKs ni `node:*` (regla de ESLint). Los adapters devuelven `PortResult` vía `guard` y nunca lanzan. El store sí lanza `SlotTakenError`: está documentado en el contrato |
| Observabilidad | Timeouts: Meta 8 s, Ollama y sidecar configurables, conexión a Postgres 5 s. Dedupe por `message.id`. `/health/providers` |
| Privacidad | El catálogo de mensajes no incluye el nombre del niño ni datos clínicos. Los logs no llevan texto del cuidador ni teléfono (invariante existente). El borrador SOAP solo va a `localhost` (`isLoopback`) |
| QA | `verify` 223, e2e 20/20, integración 13/13 en Postgres real, `smoke:api` con Postgres 12/12 ×2, `demo:degraded` 26/26, `smoke:risk`, pytest 12/12, invariantes ×3 |

## Límites conocidos (no se corrigen aquí)

- **Un solo proceso.** La cola por contacto y el `singleFlight` viven en memoria: con dos instancias de
  la API, dos mensajes del mismo contacto podrían procesarse a la vez. El blueprint despliega una sola
  instancia; escalar exigiría un candado en Postgres (`pg_advisory_xact_lock` por contacto).
- **Acuse antes de procesar.** El webhook responde 200 y luego procesa; el `message.id` se marca al
  empezar. Si el proceso muere a mitad de un mensaje, ese mensaje no se reintenta. Se eligió así para
  que Meta no reenvíe por lentitud; queda el log `inbox.error`.
- **Orden entre entregas.** Dentro de un webhook el orden se respeta; entre webhooks distintos, Meta no
  garantiza orden.
- `knip` marca `@audiorapy/domain` como dependencia no listada en la raíz: los tests la resuelven por el
  workspace. Funciona; no se toca el lockfile por esto.
