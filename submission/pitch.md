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

## Guion

| # | Tiempo | Tipo | Imagen | Titular en pantalla | Voz (es-CO) | Subtítulo (en) |
|---|---|---|---|---|---|---|
| 1 | 0–5 s | Cine | **P1** — la terapeuta en la puerta de una casa, maletín al hombro, mirando el teléfono | — | "Atiende a domicilio. Su consultorio es el carro." | "Her clinic is her car." |
| 2 | 5–10 s | Cine | **P2** — de noche, mesa de cocina, 14 chats de WhatsApp abiertos | "Cada visita,\nun chat distinto." | "Cada visita se cuadra en un chat distinto." | "Every visit lives in a different chat." |
| 3 | 10–16 s | Producto | Simulación del chat: Hola → *Acepto* → lista de cupos → reservado | "El cuidador agenda\ncon botones." | "Ahora la familia agenda con botones. Sin llamadas." | "Families book with buttons." |
| 4 | 16–21 s | Cine | **P3** — una abuela confirma desde su sala con un toque | "Si no responde,\nte avisamos." | "Y si nadie responde, la visita no se cancela sola: te avisa." | "Silence is flagged, never acted on." |
| 5 | 21–27 s | Producto | Panel `/app/`: resumen ejecutivo, KPIs, ruta de inicio | "Lo importante\nprimero." | "Abre el panel y ve primero lo que importa." | "What matters, first." |
| 6 | 27–35 s | Cine | **P4** — sesión con un adulto mayor (afasia) en su comedor; ella toca ✓ con el pulgar | "Cada ensayo,\ncon su nivel de apoyo." | "En la sesión, cada ensayo con su nivel de apoyo. Con una mano." | "Every try, with its level of support." |
| 7 | 35–42 s | Producto | App Expo: ✓/✗, racha, meta 10, vibración (icono de háptica) | "Racha, meta\ny criterio." | "La app cuenta la racha y avisa cuando se alcanza el criterio." | "Streak, goal and criterion, live." |
| 8 | 42–50 s | Producto | Nota SOAP: "O" calculada, IA local propone S/A/P, lista ✓ antes de aprobar | "La IA propone.\nTú apruebas." | "Gemma, en su propio equipo, propone. El código calcula. Ella aprueba." | "The model drafts. Code computes. She approves." |
| 9 | 50–57 s | Cine | **P5** — laptop cerrándose; la nota se vuelve texto ilegible y se guarda | "Ni el servidor\npuede leerla." | "La nota se cifra antes de salir de su navegador." | "Not even the server can read it." |
| 10 | 57–64 s | Producto | Tarjeta de visita → "Cómo llegar" → Waze | "Cómo llegar,\nen un toque." | "Y a la siguiente casa, en un toque." | "Directions in one tap." |
| 11 | 64–72 s | Cine | **P6** — la terapeuta y un paciente (niño o adulto) celebran un logro; en su teléfono, un trofeo | "Progreso que\nse ve." | "El progreso se ve. Y se celebra." | "Progress you can see." |
| 12 | 72–80 s | Producto | Prueba "matar al proveedor": IA apagada, la reserva sigue funcionando | "Sin IA,\nsigue funcionando." | "Apagamos la IA. La agenda sigue funcionando." | "AI off. Booking still works." |
| 13 | 80–90 s | Cierre | Logo AUDIORAPY sobre beige, línea azul; QR al panel | "Visitas confirmadas.\nNotas que no salen de tu equipo." | "Hecho para mi hermana. Abierto para todas." | "Built for my sister. Open for everyone." |

Pie del cierre: `COLOMBIA → LATAM` · *Código abierto (MIT) · audiorapy.vercel.app*

## Prompts de video con personas

Formato común para todos: **16:9 para el pitch, 4:5 recortable para la landing**, 5–8 s, cámara
documental en mano suave, 35 mm, luz natural cálida de la tarde, gradación beige y blanca con acentos
azul `#1d5fd1` y verde `#256b4c` presentes en ropa u objetos. Personas latinoamericanas, diversas en
edad y tono de piel, con expresiones naturales. **Sin texto legible en pantallas** (se compone después),
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
