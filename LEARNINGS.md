<!-- LEARNINGS.md: la respuesta de este proyecto a una sola pregunta fija. -->
<!-- Plantilla: procedures/templates/LEARNINGS.md · Procedimiento: procedures/00_Files/project_learnings.md -->

# ¿Qué aprendí con este proyecto?

> Se llena mientras el proyecto vive. Lo que generalice sube anonimizado a `procedures/knowledge/`.

**Proyecto:** `audiorapy`
**Arrancó:** `2026-10-02` · **Última actividad:** `2026-10-02` · **Estado:** ⏳ activo
**Forma:** en curso
**Fecha límite:** `2026-10-05`
**Alias calendario:** Hacktoberfest weekend, audiorapy
**URL:** —
**Última actualización de este archivo:** `2026-10-02`

---

## 0. Qué es este proyecto

Asistente para una fonoaudióloga a domicilio en Colombia: agenda por WhatsApp con botones, sesiones
con nivel de apoyo y un dashboard que descifra en el navegador. La restricción que lo define: las
notas clínicas de niños no pueden salir de sus equipos, así que la IA tiene que ser abierta y local.

## 1. ¿Qué aprendí que no sabía antes de empezarlo?

- `2026-10-02` — La plantilla de contrato asume que `docs/` vive gitignored; en una sesión en la nube
  eso significa perderlo al reciclar el contenedor. Commitearlo fue la decisión práctica.

- `2026-10-02` — Un invariante sobre secuencias de eventos desde el estado inicial puede quedar verde
  sobre código roto: el generador casi nunca llega al estado profundo donde vive el bug. Partir de
  **estados arbitrarios** (un paso) además de secuencias, y probarlo con una mutación a mano.

## 2. ¿Qué costó más de lo esperado, y por qué?

- `2026-10-02` — `pkill -f "vite preview"` dentro de un comando que contiene ese mismo texto mata
  la propia shell (exit 144). Detener servidores por PID (`pgrep -af` y `kill <pid>`), nunca por
  patrón que aparezca en la línea de comandos actual.
- `2026-10-02` — `path.resolve('python')` convierte un comando en una ruta relativa al directorio
  actual que no existe: `smoke:risk` funcionó en local (con ruta al venv) y falló en CI (con
  `python` del PATH). Resolver solo los valores que contienen `/`.
- `2026-10-02` — Un servidor de una corrida anterior seguía en el puerto 3000: el nuevo no arrancó y
  las pruebas manuales hablaron con el estado viejo. Confirmar puertos libres antes y después.

## 3. ¿Qué haría distinto?

- `2026-10-02` — Al adaptar una plantilla, diffear contra el original antes de dar el contrato por
  bueno. La regla de commits de una línea sin trailers se perdió al adaptar `AGENTS.md`, y once PRs
  salieron con cuerpo y `Co-Authored-By` antes de notarlo.
- `2026-10-02` — No escribir en el README promesas de trabajo futuro ("se acreditará archivo por
  archivo"). La sección "Prior work" prometía acreditar código portado de Asegura que nunca se portó;
  solo se notó al redactar el post. Escribir lo que es cierto hoy, y lo pendiente en `verificacion.md`.
- `2026-10-02` — En un test diferencial, comparar solo lo que el contrato promete. Un empate en la
  hora de vencimiento se resolvía por un UUID aleatorio distinto en cada store, y el test falló en CI
  de forma intermitente (PR #12). Se arregló ordenando por hora + nombre normalizado (PR #13).
