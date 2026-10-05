<!-- auditoria.md: auditoría completa del proyecto contra los ocho bloques de AGENTS.md — qué se revisó,
     qué se encontró y qué se corrigió. Se distingue de verificacion.md (evidencia de cada comando) y de
     memoria.md (decisiones): aquí está el informe de una revisión puntual, con fecha. -->

# Auditoría UI/UX — 2026-10-04 (B16, `feat/guided-flow`)

Alcance: el dashboard (`apps/web`) recorrido como diseñadora experta en un navegador real a 375 px y en
escritorio, claro y oscuro, con API real en canal consola y datos sintéticos; más los mensajes al
cuidador (`packages/domain/src/messages.ts`), que son la "app móvil" que el cuidador ve por WhatsApp.
No hay app nativa (B6 sigue en roadmap). Cada bug quedó cubierto por un test.

### Bugs corregidos

| # | Severidad | Dónde | Bug | Corrección | Test |
|---|---|---|---|---|---|
| U1 | Alta | `SessionView` | Cambiar de pestaña a mitad de sesión borraba todos los ensayos sin aviso | El borrador vive en `App` (solo en memoria); punto rojo en la pestaña Sesión; bloquear con borrador pide confirmación | e2e `journey` (cambio de pestaña conserva 3/3) |
| U2 | Alta | `VaultGate` | "Usar otra bóveda" borraba la bóveda guardada sin confirmar | `window.confirm` antes de `clearVault` | e2e `"Usar otra bóveda" asks…` |
| U3 | Alta | `SessionView` | La fecha de la sesión salía en UTC: después de las 7 p. m. en Colombia quedaba con la fecha de mañana | `localDate()` en la zona del dispositivo | unit + invariante `localDate` |
| U4 | Media | `TodayView` | Los avisos no se podían cerrar: la API tiene `/api/alerts/:id/resolve` y el dashboard nunca lo llamaba | Botón "Resuelto" | unit `resolveAlert` + e2e |
| U5 | Media | Modo sesión | El selector de nivel de apoyo desbordaba en el teléfono (441 px en 302): "máximo" quedaba oculto tras un scroll horizontal | Rejilla 2×2 en móvil | e2e `layout` |
| U6 | Media | `messages.ts` | WhatsApp decía "8:00 a. m.. Te enviaremos…" (doble punto) en reserva y recordatorio | `endSentence()` | unit + invariante para toda hora |
| U7 | Media | `styles.css` | Botón "Borrar de este navegador" en oscuro: blanco sobre `#ffb4a8` ≈ 1,6:1 | Tokens `--danger`/`--danger-text` por tema | revisión visual |
| U8 | Media | `SoapPanel` | Pedir el borrador IA sobrescribía lo que la terapeuta ya había escrito; el borrador se perdía al cambiar de pestaña | La IA solo llena lo vacío o `[completar]`; borradores en `App` | e2e `journey` |
| U9 | Baja | `SettingsView` | La descarga del respaldo revocaba el blob al instante y no adjuntaba el enlace (Safari/Firefox pueden cancelarla) | Enlace en el documento y `revokeObjectURL` diferido | e2e restauración |
| U10 | Baja | Varios | Fechas ISO crudas (`2026-10-03`) y sello de aprobación en UTC | `formatDayEs`, `formatStampEs` | unit |
| U11 | Baja | `VaultGate` | Mínimo de 10 caracteres oculto hasta fallar; selector de archivo en inglés ("Choose File") | Pista con contador; botón propio en español | e2e `vault` |
| U12 | Baja | Hoy | "Tu agenda de hoy" mostraba días futuros | "Tu agenda" | — |
| U13 | Media | `App` | Desbloquear una bóveda vacía repetía la celebración de los pasos ya hechos en cada entrada | Solo celebra desde cero la bóveda creada en esta página | e2e `does not replay the celebrations` (con mutación) |
| U14 | Media | `settings.ts` | Un token pegado con espacio o salto de línea se mostraba como "token rechazado" | `cleanApiSettings` recorta dirección y token, quita `/` final | unit + fuzz + invariante + e2e |
| U15 | Baja | `SettingsView` | El archivo de respaldo se nombraba con la fecha UTC | `localDate` | — |
| U16 | Baja | `SettingsView` | La clave derivada solo para comprobar la frase quedaba en memoria | Se pone en cero al comprobar | — |
| U17 | Baja | `VaultGate` | Si `createVault` falla (sin WebCrypto o memoria para Argon2id) el botón quedaba en "Creando…" para siempre | `try/catch` con mensaje | — |
| U18 | Baja | Modo sesión | Toques rápidos en ✓/✗ podían activar el zoom por doble toque en el teléfono | `touch-action: manipulation` | — |
| U19 | Baja | `JourneyMap` | El botón "Ir" no decía a dónde para un lector de pantalla | `aria-label="Ir a: <paso>"` | e2e |
| F1 | — | `quizPositions` | El fuzz encontró que una longitud enorme o no finita reservaba un arreglo de ese tamaño (proceso sin memoria) | Entradas acotadas a 48 palabras | fuzz `quiz … never throw` |

Límite conocido: las direcciones se guardan por contacto enmascarado (`••••2233`); dos familias con los
mismos 4 últimos dígitos compartirían dirección. Resolverlo pide que la API entregue un identificador
opaco y estable por contacto.

### Mejoras de experiencia (A14–A19)

Ruta de inicio gamificada como mapa de misiones (6 pasos, 800 puntos, rangos), cada paso derivado de
registros reales; comprobación de la clave con 3 palabras; celebración breve y anunciada (sin confeti con
`prefers-reduced-motion`); tarjetas KPI en Hoy y Progreso; racha, meta de 10 ensayos y criterio en el modo
sesión; insignia de dominio (3 sesiones seguidas ≥ criterio); lista S/A/P antes de aprobar; "Cómo llegar"
con Google Maps, Apple Maps y Waze (enlaces, sin mapa embebido: la CSP no admite teselas externas y la
dirección solo sale del equipo al tocar el enlace).

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
