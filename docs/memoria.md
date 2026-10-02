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

## Bitácora

- **2026-10-02** — B1: scaffold, contrato, CI. `npm run verify` verde en local (Node 22.22).
- **2026-10-02** — B2: dominio completo. 17 archivos de test. Dos mutaciones a mano (cancelar por texto; consentir por texto) **no** ponían rojo el primer invariante porque las secuencias aleatorias casi nunca llegaban a `booked`; se reescribió para partir de estados e intenciones arbitrarias y ahora ambas mutaciones fallan.
