<!-- ui-brief-lovable.md: resumen de cómo están construidas la web (landing + panel) y la app móvil, para
     pegarlo en Lovable (u otra herramienta de diseño) y pedir mejoras de UI/UX sin romper las reglas de
     privacidad. Se distingue de plan.md (alcance y criterios) y de memoria.md (por qué se decidió cada
     cosa). Está en inglés porque Lovable responde mejor así; los textos de la interfaz siguen en español. -->

# Audiorapy — UI/UX brief for Lovable

Paste this whole file as the first prompt. Improve the visual design and the flow; **keep the
structure, the Spanish copy's meaning and every rule in "Do not change"**.

## Product in one paragraph

Audiorapy helps a Colombian speech-language therapist (*fonoaudióloga*) who treats patients of any age
at their homes (children learning sounds, adults recovering speech after a stroke). Families book and
confirm visits with chat buttons; she records each session trial by trial with the level of support it
needed; a local AI drafts the clinical note that she approves; clinical notes are encrypted in her
browser and the server never sees them. The first use is gamified as a "start route".

## Surfaces

| Surface | Stack | URL |
|---|---|---|
| Landing | Static HTML + CSS + a tiny TS module (QR codes, scroll reveal) | `/` |
| Dashboard (therapist) | React 19 + Vite SPA, plain CSS with tokens, no UI library | `/app/` |
| Phone app | Expo SDK 57, React Native, `StyleSheet`, no UI library | Expo Go / web preview |

## Design tokens (one light theme everywhere)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#f5efe4` beige | page background |
| `--surface` | `#ffffff` | cards |
| `--text` | `#14243b` navy ink | text |
| `--muted` | `#5a6472` | secondary text |
| `--line` | `#e3dacb` | borders |
| `--accent` | `#1d5fd1` blue | primary actions, links, active tab |
| green | `#256b4c` | progress, "independiente", success |
| gold | `#8a5a00` on `#f7e9c8` | points, achievements |
| warn | `#6b4c00` on `#f7e9c8` | alerts, pending |
| error | `#8a1f11` on `#f8e1dc` | errors, destructive |
| Support levels | independiente `#256b4c`, mínimo `#0e7c86`, moderado `#c98a2b`, máximo `#b5402f` | chart dots, legend, cue buttons |

Type: system UI sans for the app; landing headlines in a system serif (Iowan Old Style / Palatino /
Georgia). Radius 12–22 px, soft shadows, touch targets ≥ 44 px (48 dp in the app). Every text pair ≥ 4.5:1.

## Landing (`/`)

Order: nav (hidden on phones) → hero (serif headline "Visitas confirmadas por WhatsApp. Notas clínicas que
nunca salen de tu equipo.", two pill CTAs, CSS-drawn hillside with three floating product cards) → facts
strip (0 notas en el servidor · 100 % funciona sin IA · 24 palabras · 3 apps de mapas) → "Pensado para cada
visita" (4 colored cards: Agenda, Sesión, Nota, Ruta — each will get a 6 s silent people video) → "Cero
conocimiento del contenido clínico" (checklist + dashboard screenshot) → "También en tu teléfono" (phone
screenshot + QR codes: panel and Expo Go) → footer.

## Dashboard (`/app/`) — screens and components

1. **Vault gate** (before anything): *Crea tu bóveda* (passphrase + hint) → 24-word recovery phrase →
   quiz of 3 random words → unlock. Also *Desbloquear* (passphrase or recovery phrase) and *Restaurar
   desde un respaldo*.
2. **Top bar**: logo, points chip (star + XP), **bell** (unread badge → panel: family alerts, visits
   < 24 h, achievements; "Marcar todo como leído"), **avatar** (initials → Perfil), *Bloquear*.
3. **Tabs**: Hoy · Progreso · Sesión · Respaldo (bottom bar on phones, top on desktop).
4. **Hoy** (important first): *Resumen ejecutivo* (one sentence, 4 KPI tiles in urgency order, sparkline
   of accuracy, one "Siguiente paso" button) → *Ruta de inicio* quest map (6 nodes: done / current /
   locked, points, rank, celebration toast) → *Tu agenda* (next visit hero card, KPI cards, alerts with
   "Resuelto", upcoming visits with status pill, address and a single **Cómo llegar** button that opens a
   chooser: Google Maps / Apple Maps / Waze), "Activar avisos" (browser notifications).
5. **Progreso**: patient context, 4 KPI cards (sessions, current accuracy, mastered targets, pending
   notes), support-level legend, one line chart per target with a dashed "meta 80 %" line, mastery badge,
   accessible data table.
6. **Sesión**: list of sessions → *Modo sesión* (target chips with counts, 2×2 support-level buttons,
   big ✓/✗, live streak, 10-trial goal bar, criterion badge, undo, discard with confirm) → *Nota SOAP*
   (S/A/P textareas, computed "O", "Borrador con IA local", S/A/P checklist, *Aprobar y guardar cifrada*).
7. **Respaldo**: download encrypted backup, check recovery phrase, API/Ollama connections, delete from
   this browser.
8. **Perfil**: avatar, name/profession/practice/city, rank and points, activity tiles, achievements,
   notification preference.

## Phone app — screens

Bottom tabs **Hoy · Sesión · Avisos (badge) · Perfil**. Hoy: executive summary card (sentence, 4 tiles,
bar chart), next-visit hero, alerts, visit cards with *Recordarme 1 h antes* and **Cómo llegar** (system
chooser). Sesión: same session mode with haptics. Avisos: notification list. Perfil: identity card +
connection settings.

## What to improve (ask Lovable for)

1. Stronger hierarchy on **Hoy**: the executive summary and the agenda KPIs overlap — merge them into one
   clear top block; keep "Siguiente paso" as the single primary action.
2. A friendlier **quest map**: illustrated path, node micro-animations, clearer "current" step on phones.
3. Better **empty states** and **loading skeletons** (agenda, progress, notifications).
4. **Session mode** for one-handed use: thumb-zone layout, larger ✓/✗, visible streak flame.
5. Consistent **iconography** (currently simple stroke SVGs) and illustration style for the landing.
6. Motion that explains order; respect `prefers-reduced-motion`.

## Do not change

- **No third-party assets at runtime**: strict CSP (`default-src 'self'`). No Google Fonts, CDNs, analytics,
  embedded maps or tracking pixels. Fonts must be system stacks or self-hosted files.
- **No inline `<style>` blocks or `style=""` attributes in HTML** (CSP); React `style` props are fine.
- Clinical content never leaves the browser; never add features that send notes, names or trial data to
  a server or a model outside `localhost`.
- Phone numbers stay masked (`••••2233`); notifications carry logistics only.
- Approving a note stays disabled until S, A and P are complete; "O" is computed, never edited.
- Spanish (Colombia) copy; patients of any age (not only children).
- Accessibility: one `h1` per page, labels on every input, 44 px targets, focus outlines, text + color
  (never color alone), no horizontal scroll at 360 px.
- Demo data is synthetic and labeled as such.
