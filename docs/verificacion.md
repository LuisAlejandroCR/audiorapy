<!-- verificacion.md: evidencia con fecha de lo que se comprobó en audiorapy y lo que sigue pendiente.
     Se distingue de memoria.md (decisiones) y de plan.md (alcance). Nada aquí sin fecha ni comando. -->

# Verificación

## Compuerta local

| Fecha | Comando | Resultado | Entorno |
|---|---|---|---|
| 2026-10-02 | `npm run verify` | PASS — 3 archivos, 6 tests | Linux, Node 22.22.0 |

## Límites externos (ejercicio contra la cosa real)

| Límite | Estado | Nota |
|---|---|---|
| Meta WhatsApp Cloud API (envío y webhook) | ⏳ pendiente | Requiere la app y el número de prueba del autor |
| Ollama + `gemma4:e4b` | ⏳ pendiente | No hay Ollama en el entorno de CI ni en la sesión en la nube |
| Dashboard en navegador real | ⏳ pendiente | B4 |

## Pendientes conocidos

- CI en GitHub Actions: ⏳ se verifica en el primer PR.
