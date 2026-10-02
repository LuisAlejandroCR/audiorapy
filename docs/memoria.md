<!-- memoria.md: cómo se construye audiorapy y por qué — decisiones de arquitectura y bitácora.
     Se distingue de plan.md (qué y en qué orden) y de verificacion.md (evidencia con fecha). -->

# Memoria del proyecto

## Decisiones

| Fecha | Decisión | Por qué | Alternativa descartada |
|---|---|---|---|
| 2026-10-02 | Monorepo con npm workspaces: `packages/domain`, `apps/api`, `apps/web` | Un solo formato de datos y de cifrado en todas las superficies (reporte §arquitectura) | Repos separados |
| 2026-10-02 | `packages/domain` exporta fuentes `.ts` sin paso de build | Vitest, Vite y `tsx` consumen TS directo; menos piezas que se pueden romper en 68 h | Build con `tsc -b` y referencias de proyecto |
| 2026-10-02 | Vitest + fast-check en lugar de Jest | ESM y TS nativos sin config de transformadores; `--project` cumple "cada carpeta corre sola" | Jest con `ts-jest` |
| 2026-10-02 | API en **Fastify**, no NestJS | El código de Asegura no está en este entorno; Fastify da `inject()` para tests sin red y acceso a los bytes crudos para HMAC. El diseño de ports se mantiene igual, así que portar a NestJS después es mecánico | NestJS portado de Asegura |
| 2026-10-02 | Dashboard en **Vite + React (SPA)**, no Next.js | Todo se descifra en el navegador; no hay SSR que aprovechar y una SPA estática admite una CSP estricta sin excepciones | Next.js |
| 2026-10-02 | Repositorio de citas **en memoria** detrás de un port en esta etapa | La rebanada se demuestra sin credenciales; Postgres entra como adapter (B5) sin tocar el dominio | Postgres desde el día uno |
| 2026-10-02 | `AGENTS.md`, `CLAUDE.md` y `docs/` **se commitean** | Las sesiones en la nube clonan el repo limpio: lo gitignored se pierde. `docs/research` ya era público | Gitignorarlos como dice la plantilla |
| 2026-10-02 | Licencia MIT | El reporte pide MIT o Apache-2.0 para el embed del post; MIT es la más corta. Cambiable antes de publicar | Apache-2.0 |
| 2026-10-02 | El consentimiento por chat **solo** cuenta con el botón "Acepto", nunca con texto libre | La autorización debe ser explícita; un "sí" interpretado no lo es | Aceptar `affirm` del clasificador |
| 2026-10-02 | Un texto interpretado como "cancelar" pide confirmación con botones; solo el botón cancela | El LLM clasifica pero no decide; un falso positivo no puede borrar una visita | Cancelar por intención |
| 2026-10-02 | La clave de recuperación es una frase BIP-39 de 24 palabras en **español**, aceptada con o sin tildes | La usuaria la escribe a mano desde papel; las tildes son la primera fuente de error | Lista en inglés; hex |
| 2026-10-02 | Argon2id con parámetros OWASP (19 MiB, t=2) guardados en la cabecera de la bóveda | Se pueden subir sin migrar registros: solo se re-envuelve la DEK | Parámetros fijos en código |
| 2026-10-02 | El borrador SOAP del modelo pierde toda oración que tenga un dígito (`[completar]`) | "El modelo nunca escribe cifras": las cifras salen de `TrialData` | Validar cifras contra los datos |
| 2026-10-02 | El webhook responde 200 y procesa en cola (`Inbox.enqueue`); dedupe por `message.id` antes de cualquier efecto | Meta reintenta lo que no ve confirmado; clasificar con Gemma puede tardar hasta 8 s | Procesar en línea |
| 2026-10-02 | Sin `META_APP_SECRET` el webhook responde **503**, no 401 | Una guarda que falla cerrado sin secreto se ve igual que una integración muerta; 503 lo hace visible (`whatsapp_cloud_api.md`) | 401 genérico |
| 2026-10-02 | Un 400 de Meta a un mensaje interactivo se reintenta una vez como texto numerado | Un 400 significa que el cuidador no recibe nada | Fallar el envío |
| 2026-10-02 | Circuit breaker en Ollama: 3 fallos → 60 s sin llamar | Un Ollama caído no debe sumar 8 s a cada mensaje | Reintentar siempre |
| 2026-10-02 | `/api/agenda` enmascara el teléfono (`••••2233`) | El dashboard distingue familias; no necesita leer números | Teléfono completo |
| 2026-10-02 | `/dev/simulate` solo existe con canal consola y fuera de producción | Demo y e2e sin Meta, sin abrir una puerta en producción | Simulador siempre activo |
| 2026-10-02 | La bóveda cifrada vive en `localStorage` **más** respaldo descargable; restaurar en un navegador limpio es un test e2e | Safari puede borrar el almacenamiento; perder la llave o el archivo es perder una historia que se conserva 15 años | Solo almacenamiento del navegador |
| 2026-10-02 | El dashboard solo llama a Ollama en `localhost`/`127.0.0.1` (`isLoopback`), y la CSP del build solo permite conectar a sí mismo, loopback y `VITE_API_ORIGIN` | Dos capas: el código rechaza un modelo remoto y el navegador bloquea cualquier otro destino | Confiar solo en la configuración |
| 2026-10-02 | "Aprobar" queda deshabilitado mientras S, A o P contengan `[completar]` | La IA apoya, no decide: la terapeuta completa lo que el código quitó | Aprobar con marcadores |
| 2026-10-02 | El token del dashboard en `sessionStorage`; direcciones en `localStorage` | El token se va al cerrar la pestaña | Todo en `localStorage` |
| 2026-10-02 | Modo sesión también en web | La app Expo (B6) no cabe verificada hoy; el dashboard ya puede registrar ensayos con nivel de apoyo | Esperar a Expo |
| 2026-10-02 | Paleta **azul y blanco** (pedido del autor): acento `#1d5fd1`, fondo `#f4f8fd`; modo oscuro azul marino. El nivel de apoyo "mínimo" pasa de azul a turquesa `#0e9aa7` para no confundirse con el acento | Todos los pares de texto ≥ 5,8:1 (WCAG AA); puntos del gráfico ≥ 3:1 | Verde original |

## Bitácora

- **2026-10-02** — B1: scaffold, contrato, CI. `npm run verify` verde en local (Node 22.22).
- **2026-10-02** — B2: dominio completo. 17 archivos de test. Dos mutaciones a mano (cancelar por texto; consentir por texto) **no** ponían rojo el primer invariante porque las secuencias aleatorias casi nunca llegaban a `booked`; se reescribió para partir de estados e intenciones arbitrarias y ahora ambas mutaciones fallan.
- **2026-10-02** — B3: API. Primer e2e falló porque el primer cupo quedaba a 24 h exactas y el recordatorio "día anterior" ya era pasado: comportamiento correcto, supuesto del test equivocado. Mutación: quitar el dedupe pone rojo el invariante A2.
- **2026-10-02** — B4: dashboard. Recorrido completo con `playwright-cli` (Chromium 141, emulación móvil 360 px y escritorio 1100 px). Un e2e falló porque `allTextContents()` no espera: leía la lista de palabras antes de que terminara Argon2id; se espera `toHaveCount(24)`.
