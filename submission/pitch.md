<!-- pitch.md: guion del video pitch de audiorapy (≈90 s) y los prompts de video con personas para la
     landing y el pitch. Mezcla las dos referencias de knowni: escenas cinematográficas con personas
     (knowni-stellar-pitch) y pantallas reales con titular de dos líneas y barra de capítulos
     (knowni-demo). Se distingue de dev-post.md (el texto del post) y de pitch-timeline.json (los mismos
     cortes en el formato que lee el render). -->

# Pitch — audiorapy (≈ 90 s)

## Cómo se mezclan las referencias

| De `knowni-stellar-pitch` | De `knowni-demo` |
|---|---|
| Escenas generadas con **personas reales en contexto**, un color dominante de marca (aquí azul `#1d5fd1` sobre beige `#f5efe4`, acentos verdes `#256b4c`), subtítulos en inglés abajo, un objeto simbólico flotante (aquí: un candado de papel/burbuja de chat) | **Pantallas reales** del teléfono a la izquierda, titular de dos líneas en serif a la derecha, una frase corta de voz, **barra de capítulos** abajo (Agenda · Sesión · Nota · Ruta · Privacidad) |
| Cierre: logo + tagline + ruta geográfica | Nota de honestidad arriba a la izquierda: qué es real y qué falta |

Regla de montaje: **escena con personas → pantalla real que la cumple**. Nunca dos escenas generadas seguidas;
cada promesa aparece primero en la vida de alguien y luego en el producto.

Nota fija arriba a la izquierda durante las pantallas: *"Pantallas reales · datos sintéticos · WhatsApp
simulado en modo consola."* (honestidad, como en la referencia).

## Guion (mezcla técnico + pitch)

Dos capas, como en las referencias: **escenas de cine con personas** (`knowni-stellar-pitch`) y **grabaciones
reales de pantalla** con titular de dos líneas y barra de capítulos (`knowni-demo`). Alterna siempre:
promesa en la vida de alguien → la pantalla real que la cumple. Voz: ElevenLabs, voz *Ery* (español
latino, cálida), una sola pista con exactamente estas líneas.

Barra de capítulos (abajo, en las pantallas): **Agenda · Panel · Sesión · Nota · Ruta · Sin IA**.
Nota fija arriba a la izquierda en las pantallas: *Pantallas reales · datos sintéticos*.

| # | Tiempo | Capa | Imagen | Titular | Voz (es) | Subtítulo (en) |
|---|---|---|---|---|---|---|
| 1 | 0–4 s | Cine | **P1** puerta de la casa | — | Ella atiende a domicilio. Su consultorio es el carro. | Her clinic is her car. |
| 2 | 4–9 s | Cine | **P2** chats de noche | Cada visita,\nun chat distinto. | Cada visita se cuadra en un chat distinto, y las notas viven en papel. | Every visit, a different chat. Notes on paper. |
| 3 | 9–17 s | **Pantalla** | **G1** chat: Hola → Acepto → cupos → reservado | El cuidador agenda\ncon botones. | Con audiorapy, la familia agenda con botones: autoriza sus datos, elige un cupo y confirma. | Families book with buttons. |
| 4 | 17–23 s | Cine | **P3** abuela confirma | Si no responde,\nte avisamos. | Si nadie responde al recordatorio, la visita no se cancela sola. Ella recibe un aviso. | Silence is flagged, never acted on. |
| 5 | 23–30 s | **Pantalla** | **G2** web `/app/` Hoy: resumen ejecutivo, campana | Lo importante\nprimero. | En el panel, lo importante va primero: avisos, visitas por confirmar y notas pendientes. | What matters, first. |
| 6 | 30–37 s | **Pantalla** | **G3** web: ruta de inicio + celebración | Un comienzo\ncomo un juego. | La primera vez es como un juego: seis pasos con puntos, desde crear la bóveda hasta descargar un respaldo. | Onboarding as a quest. |
| 7 | 37–44 s | Cine | **P7** revisa la app, sesión con niño y con adulta mayor | — | En casa del paciente, un niño o una abuela, registra cada ensayo con una sola mano. | Any patient, one hand. |
| 8 | 44–52 s | **Pantalla** | **G4** móvil: modo sesión ✓/✗, racha, meta | Racha, meta\ny criterio. | Acierto o error, con su nivel de apoyo. El teléfono vibra con la racha, y avisa cuando se alcanza la meta. | Every try, with its support level. |
| 9 | 52–60 s | **Pantalla** | **G5** web: nota SOAP, "O" calculada, lista S/A/P, aprobar | La IA propone.\nTú apruebas. | Gemma, en su propio computador, propone la nota. El código calcula las cifras. Ella revisa y aprueba. | The model drafts. Code computes. She approves. |
| 10 | 60–66 s | Cine | **P5** laptop se cierra, sello azul | Ni el servidor\npuede leerla. | La nota se cifra en su navegador. Ni el servidor puede leerla. | Not even the server can read it. |
| 11 | 66–71 s | **Pantalla** | **G6** móvil: "Cómo llegar" → selector → mapa | Cómo llegar,\nen un toque. | Y a la siguiente casa, en un solo toque. | Directions in one tap. |
| 12 | 71–79 s | **Pantalla** | **G7** terminal `npm run demo:degraded` + chat que sigue reservando | Sin IA,\nsigue funcionando. | Apagamos la inteligencia artificial. La agenda sigue funcionando. | AI off. Booking still works. |
| 13 | 79–90 s | Cierre | Logo sobre beige + QR al panel; **P6** de fondo | Visitas confirmadas.\nNotas que no salen de tu equipo. | Visitas confirmadas. Notas que no salen de su equipo. Hecho para mi hermana; abierto para todas. | Built for my sister. Open for everyone. |

### Lo que debes grabar (G1–G7)

Graba a 60 fps, sin notificaciones del sistema, modo claro, datos sintéticos (botón "Cargar datos
sintéticos"). Móvil: 1080×1920 (app Expo en el teléfono, o `expo start --web` a 390 px). Web: 1920×1080
en <https://audiorapy.vercel.app/app/>. Cada clip 2 s más largo que su corte para tener margen.

| Clip | Dónde | Qué hacer, en orden | Duración |
|---|---|---|---|
| **G1** | Terminal + chat (Telegram si ya está, o `POST /dev/simulate` mostrado como chat) | "Hola" → botón *Acepto* → lista de cupos → tocar un cupo → "Listo, la visita quedó agendada…" | 10 s |
| **G2** | Web, pestaña **Hoy** | Desbloquear → el resumen ejecutivo entra (tarjetas en orden) → abrir la campana → "Marcar todo como leído" | 9 s |
| **G3** | Web, bóveda nueva | Crear bóveda → 24 palabras → comprobar 3 palabras → aparece "2 pasos completados" y el mapa de la ruta | 9 s |
| **G4** | Móvil, pestaña **Sesión** | Elegir "/s/ inicial" → nivel *mínimo* → ✓ ✓ ✓ (racha 3) ✗ ✓ … hasta "Meta alcanzada" → Terminar → resumen "O" | 10 s |
| **G5** | Web, pestaña **Sesión** | Abrir la sesión recién guardada → "Borrador con IA local" → escribir S/A/P → la lista pasa a ✓ ✓ ✓ → Aprobar → "registro inmodificable" | 10 s |
| **G6** | Móvil, pestaña **Hoy** | Escribir dirección → "Cómo llegar" → elegir Waze (o el selector de Android) | 7 s |
| **G7** | Terminal | `npm run demo:degraded` (las comprobaciones en verde) cortado con G1 repitiéndose con Ollama apagado | 10 s |

Montaje: titulares en serif sobre beige `#f5efe4`, texto azul `#14243b`, acento `#1d5fd1`; transición
de 8 frames entre cine y pantalla; música baja (−22 dB) que no compite con la voz.

## Prompts de video con personas

Formato común para todos: **16:9 para el pitch, 4:5 recortable para la landing**, 5–8 s, cámara
documental en mano suave, 35 mm, luz natural cálida de la tarde, gradación beige y blanca con acentos
azul `#1d5fd1` y verde `#256b4c` presentes en ropa u objetos. Personas latinoamericanas, diversas en
edad y tono de piel, con expresiones naturales. **Ningún video contiene texto**: ni subtítulos, ni letreros,
ni texto legible en pantallas, papeles o ropa (titulares y subtítulos se componen después en edición),
sin logotipos de marcas, sin uniforme médico de hospital. Manos y gestos creíbles.

### Pitch

**P1 — "Su consultorio es el carro"**
> A Colombian speech-language therapist in her early 30s, light-blue linen shirt and beige trousers,
> canvas tote with therapy cards over her shoulder, stands at the green metal gate of a modest
> two-story house in a Bogotá neighborhood in late-afternoon light. She checks her phone with one hand
> while the other rests on the gate latch, then looks up and smiles as the door opens off-camera.
> Medium shot, slight handheld push-in, shallow depth of field, bougainvillea on the wall, a small
> parked car behind her. Calm, warm, real.

**P2 — "Cada visita, un chat distinto"**
> Night, a small kitchen table lit by a warm pendant lamp. The same therapist, hair tied back, sits
> with a mug of tinto beside a paper agenda full of crossed-out times. She scrolls quickly through
> many chat threads on her phone, sighs, rubs her temple. The phone glow lights her face blue against
> the beige room. Close-up on her thumb hesitating between threads (screens blurred, no readable
> text). Slow rack focus from the agenda to her tired eyes. Quiet, empathetic, not dramatic.

**P3 — "Si no responde, te avisamos"**
> A grandmother in her late 60s with silver hair and reading glasses, cardigan in soft green, sits
> on a floral sofa in a sunlit living room with family photos on the wall. She holds a phone at arm's
> length, squints, then taps one large button with her index finger and nods with satisfaction. A
> grandchild's drawing is pinned behind her. Medium close-up, gentle handheld, warm window light,
> beige and white walls.

**P4 — "Cada ensayo, con su nivel de apoyo"**
> A home session at a dining table: an older man in his 70s recovering speech after a stroke, in a
> crisp white guayabera, practices words from picture cards while the therapist sits beside him at
> eye level. She models a sound, he repeats it, she smiles and taps a large green check on the phone
> resting on the table with her thumb, without looking away from him. His daughter watches
> encouragingly from the doorway. Over-the-shoulder shot that ends on his proud half-smile. Natural
> light, potted plants, respectful and dignified.

**P5 — "Ni el servidor puede leerla"**
> Evening, the therapist at a small desk by a window finishes typing on a laptop, reads once more, and
> gently closes the lid. As it closes, a soft blue light traces the seam like a seal and fades. Her
> hand rests on the closed laptop for a moment; she exhales, relieved, and turns off the desk lamp.
> Static medium shot, then slow push to her hand. Minimal, trustworthy, beige wall, one green plant.

**P6 — "Progreso que se ve"**
> Bright afternoon living room. A girl of about 7 in a blue school sweater says a difficult word
> clearly for the first time; her mother covers her mouth in happy surprise; the therapist laughs and
> offers a high-five. Cut-in: the therapist's phone on the coffee table shows a small gold trophy
> burst (no readable text). Alternate version with the same staging for an adult: a man in his 40s
> who stutters reads a full sentence to his partner, who squeezes his shoulder. Joyful, natural,
> handheld, warm.

**P7 — "Revisa la app y empieza la terapia" (puente para el minuto 0:21–0:35, o versión larga de 15 s)**
> Morning, the therapist sits in her parked car outside a patient's home, coffee in the cup holder, and
> checks her phone: her thumb scrolls a calm agenda screen (blurred, no readable text), she nods, taps
> once, and a soft vibration ripples through the phone in her hand. She gets out, takes her canvas bag
> and walks to the door. Match cut on the opening door to two short sessions:
> (1) a living room floor with a boy of about 6 in a green T-shirt; she kneels at his level with picture
> cards and a small mirror, models a sound with exaggerated lips, he imitates, laughs, and she taps the
> big green button on the phone resting on the rug;
> (2) the same day, a different home: a woman in her late 70s with short white hair and a lilac blouse,
> seated at a dining table by a window, practices naming objects from a photo album; the therapist
> sits beside her, patient and warm, offers a gentle cue with her hand, the woman finds the word and
> squeezes her arm, both smiling. End on the therapist's thumb tapping the green button again.
> Handheld 35 mm, natural daylight, beige and white interiors with blue and green accents, intimate and
> respectful, no readable text anywhere.

### Landing — "Pensado para cada visita" (un video por tarjeta)

**01 · Agenda — "El cuidador agenda con botones"**
> A father in his 30s in work clothes, standing at a bus stop in Medellín at morning rush, receives a
> message, reads it, and taps one button on his phone with his thumb; relief crosses his face and he
> pockets the phone as the bus arrives. Tight medium shot, city bokeh, blue bus, warm sunrise light.
> Loopable: starts and ends with the phone in his hand.

**02 · Sesión — "✓ / ✗ con nivel de apoyo"**
> A therapist and a teenage boy with headphones around his neck at a kitchen counter practicing
> sounds with word cards. Each time he gets one right, she taps a big green button on her phone with
> her thumb and the phone gives a tiny vibration (subtle ripple); after a miss she gives a gentle
> hand cue and he tries again and succeeds — they both grin. Top-down and side angles intercut, soft
> daylight. Loopable 6 s.

**03 · Nota — "SOAP con IA local, aprobada por ti"**
> Late afternoon in a home office: the therapist reviews a draft on her laptop, edits one line with a
> few keystrokes, nods, and presses a single key to approve; a calm blue glow briefly outlines the
> screen like a seal. Her reading glasses are pushed up on her head, a mug and a small succulent
> beside her. Over-the-shoulder, screen intentionally blurred, quiet confidence.

**04 · Ruta — "Cómo llegar en un toque"**
> Inside a small car parked on a hillside street in Bogotá, the therapist taps "directions" on her
> phone in a dashboard mount; a blue route line glows on the (blurred) map; she checks the mirror,
> smiles, and pulls out onto a street lined with colorful houses. Cut to her arriving at a door where
> an older woman waves from the window. Warm golden hour, handheld from the passenger seat.

### Otras secciones que pueden llevar video

| Sección | Video sugerido |
|---|---|
| **Hero** (fondo, sin sonido, 10 s en loop) | Una puerta de casa que se abre hacia luz cálida; la terapeuta entra y saluda a una familia (de espaldas a cámara), cámara lenta 50 %. Reemplaza las colinas en CSS |
| **Cero conocimiento del contenido clínico** | P5 recortado a 4:5, o un motion graphic: una nota se vuelve caracteres desordenados mientras viaja de la laptop a una nube, y llega como bloques azules |
| **También en tu teléfono** | Grabación de pantalla real de la app Expo (Hoy → Sesión → resumen) de 15 s junto a los QR, con un pulgar real tocando (filmado contra pantalla verde) |
| **Resumen ejecutivo del panel** (demo) | 8 s: el panel se abre y las tarjetas KPI entran en orden; la terapeuta toca "Resuelto" en un aviso y el contador baja a 0 |

Los videos de la landing deben vivir en `apps/web/public/` (la CSP no permite otro origen), en MP4 H.264
y WebM, ≤ 2 MB cada uno, con `muted`, `playsinline`, `loop` y un póster.
