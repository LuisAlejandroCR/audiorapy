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
| A11 | La navegación identifica cada sección con icono y texto, conserva objetivos táctiles de 44 px y se adapta sin desbordamiento entre 360 px y escritorio | B15 |
| A12 | La agenda permite distinguir de un vistazo avisos, próxima visita y estado de confirmación, con estados de carga, error y vacío claramente diferenciados | B15 |
| A13 | Las superficies clínicas comunican privacidad local, procedencia sintética y siguiente acción sin depender solo del color | B15 |
| A14 | Una ruta de inicio guiada (bóveda → comprobar clave → caso → sesión → nota → respaldo) muestra paso actual, progreso y puntos; cada paso se marca solo cuando la acción real ocurrió (derivado de los registros, no de clics) | B16 |
| A15 | La clave de recuperación se comprueba pidiendo 3 palabras al azar (sin tildes ni mayúsculas) antes de continuar | B16 |
| A16 | Ninguna acción deja perder trabajo en silencio: cambiar de pestaña conserva la sesión en curso y los borradores SOAP; descartar, bloquear o "usar otra bóveda" piden confirmación | B16 |
| A17 | El modo sesión muestra racha, meta de ensayos por objetivo y si se alcanzó el criterio; el progreso marca dominio (≥ criterio en las 3 últimas sesiones) | B16 |
| A18 | Fechas en hora local de Colombia (no UTC); avisos se pueden marcar como resueltos; ningún mensaje al cuidador tiene doble punto | B16 |
| A19 | La ruta se dibuja como mapa de misiones (nodos hechos, actual y bloqueados); Hoy y Progreso abren con tarjetas KPI calculadas por código (visitas, confirmación, avisos; sesiones, acierto, objetivos dominados) | B16 |
| A20 | Web y app usan la paleta "Terracota" (oliva, crema, terracota, vino) con todo par de texto ≥ 4,5:1 en claro y oscuro | B17 |
| A21 | La landing pública (`/`) carga solo recursos propios bajo la misma CSP, no desborda a 390 px y lleva al panel (`/app/`) | B17 |
| A22 | La app Expo muestra agenda con KPIs y "Cómo llegar", y modo sesión con racha y meta, reutilizando el dominio sin copiarlo; no guarda contenido clínico en el teléfono | B17 |

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
| B13 | Auditoría completa contra AGENTS.md | `chore/audit` (#17) | ✅ 6 hallazgos corregidos, cada uno con test; informe en `docs/auditoria.md` |
| B14 | Verificación reproducible en Windows con `core.autocrlf=true` | `fix/windows-verify` (#18) | ✅ `.gitattributes` fija LF en el working tree; el test del post normaliza LF/CRLF; `npm run verify` pasa completo en Windows |
| B17 | Paleta "Terracota", landing pública en `/` + panel en `/app/` para Vercel, y app móvil Expo (vista previa) | `feat/landing-mobile` | ✅ A20–A22; 267 tests; e2e 34/34; job `mobile` en CI; deploy a Vercel ⏳ (requiere la cuenta del autor) |
| B16 | Auditoría UI/UX + ruta de inicio gamificada, corrección de bugs de pérdida de datos y fechas | `feat/guided-flow` (#20) | ✅ A14–A19; 261 tests (37 nuevos: unit, fuzz, invariante); e2e 30/30 móvil + escritorio; capturas claro/oscuro |
| B15 | Pulido UI/UX del dashboard: jerarquía visual, navegación con iconos, agenda escaneable y estados accesibles; capturas móvil/escritorio | `feat/ui-ux-polish` (#19) | ✅ A11–A13; e2e 20/20 móvil + escritorio; capturas regeneradas con datos sintéticos |

## Fuera de alcance del fin de semana

Pagos, RIPS/RDA/FEV, multi-terapeuta, app del cuidador, Temporal, Mastra, `whisper.rn`, Gemma en el
teléfono. Ver la tabla MVP vs roadmap del reporte.
