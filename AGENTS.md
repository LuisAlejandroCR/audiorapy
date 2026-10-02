<!-- AGENTS.md: constitución del agente para audiorapy — reglas obligatorias para cualquier agente.
     Adaptada de procedures/templates/AGENTS.md. Se distingue de CLAUDE.md (contexto, misión y stack)
     y de docs/plan.md (qué se construye y en qué orden). -->

# AGENTS.md — Constitución del proyecto

> **CONTRATO OBLIGATORIO DEL AGENTE.** Proyecto público. Optimizar para **65 % calidad de cara a la
> usuaria / 35 % experiencia de desarrollo**. Nunca saltarse la verificación ni inventar el estado del
> proyecto. Si un paso requerido no se puede ejecutar: `BLOCKED: <razón>`.

## Arranque

Antes de modificar cualquier archivo, leer en orden:

```text
AGENTS.md
CLAUDE.md
docs/memoria.md
docs/verificacion.md
git status
```

Antes de codear, escribir los criterios de aceptación del bloque en `docs/plan.md`.

## Bloques de trabajo — cada cambio no trivial se evalúa contra

1. **Seguridad.** Validar toda entrada no confiable (webhook, texto del cuidador, salida del LLM).
   Firma HMAC sobre los bytes crudos; fallar cerrado. Nunca hardcodear ni loguear secretos.
2. **Código limpio.** Identificadores y comentarios en inglés. Simple, sin duplicación.
3. **Código muerto.** Borrar solo lo verificado como sin uso.
4. **Arquitectura.** `packages/domain` no importa SDKs de terceros ni `node:*` (regla de ESLint).
   Los proveedores viven detrás de *ports* y devuelven `PortResult`; nunca lanzan.
5. **QA / CI-CD.** `Write → Test → Fix → Verify`. `npm run verify` es la compuerta.
6. **Observabilidad.** Timeouts en todo adapter externo, idempotencia por `message.id`,
   `/health/providers`. Nunca loguear contenido clínico ni texto del cuidador.
7. **Privacidad.** Por WhatsApp solo pasa logística. Nada clínico sale del dispositivo de la
   terapeuta sin cifrar. Solo datos sintéticos, etiquetados como tales, en demo y tests.
8. **UX / rendimiento.** Estados claros (cargando, vacío, degradado, error), accesible, móvil primero.

## Tests

```text
test/unit/       <name>.spec.ts            un comportamiento, entradas fijas
test/fuzz/       <name>.fuzz.spec.ts       entradas arbitrarias o malformadas (fast-check)
test/invariant/  <name>.invariant.spec.ts  propiedades que se cumplen para toda entrada (fast-check)
test/e2e/        <name>.e2e.ts             Playwright contra la app real
```

* Los tests viven en `test/`, nunca junto al código fuente.
* Todo módulo nuevo: **unit**. Si parsea algo de fuera del proceso: **fuzz**. Si hay una promesa a la
  usuaria o una garantía de privacidad: **invariant**.
* Nunca debilitar un test para que pase. Nunca recortar `numRuns` para que quepa en el timeout.
* Todo límite de proceso (Meta, Ollama) se ejercita contra la cosa real al menos una vez, con fecha
  en `docs/verificacion.md`. Mientras no se haya hecho, queda `⏳ pendiente`.

## IA — lo que el modelo puede y no puede hacer

* Gemma **clasifica y redacta**; el código **calcula y decide**. El modelo nunca escribe cifras.
* Ninguna salida del modelo se envía a un cuidador. El bot solo responde con plantillas y botones.
* Todo texto generado nace como `draft` y solo la terapeuta lo pasa a `approved`.
* Toda salida del modelo se valida con Zod; si no cumple, se descarta y se usa el fallback.
* Nunca cancelar una cita automáticamente por falta de respuesta: se alerta a la terapeuta.

## Git y PRs

* Ramas por bloque (`chore/…`, `feat/…`, `fix/…`, `docs/…`); nunca commitear directo a `main`.
* El agente commitea y abre PR **solo cuando el humano lo pide**. Nunca force-push, nunca reescribir
  historia compartida, nunca mergear.
* Commits en inglés, Conventional Commits.
* Todo commit posterior a **2026-10-05 06:59 UTC** se anota en la sección "Post-deadline commits"
  del `README.md`.
* El código portado de otro repo lleva cabecera de procedencia y entra en "Prior work" del README.

## Documentación

* Cabecera en cada archivo de código, 1–3 líneas: `// <filename>: <what this file does>`.
* Cabecera en cada `.md` (comentario HTML, español): nombre, qué contiene, de qué se distingue.
* `README.md` es público y en inglés (el reto lo exige). El resto de `docs/` va en español.
* Después de cualquier cambio, barrer todos los `.md` y actualizar los afectados en el mismo PR.

## Cierre de cada bloque

```text
VERIFICATION
- Build: PASS/FAIL
- Tests (unit / fuzz / invariant / e2e): PASS/FAIL
- Docs updated: YES/NO
- LEARNINGS.md updated: YES/NO
```
