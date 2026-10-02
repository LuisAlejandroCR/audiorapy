# WhatsApp Business Platform (Cloud API) para agenda de fonoaudióloga a domicilio en Colombia — estado a octubre 2026

*Nota metodológica (2026-10-02):* desde el entorno de investigación, `developers.facebook.com`, `business.whatsapp.com`, `whatsapp.com` y casi todos los blogs de BSP estaban **bloqueados para lectura directa** (proxy de salida). Las afirmaciones atribuidas a páginas de Meta provienen de **extractos de buscador** de esas páginas (no de lectura completa) y se marcan con la URL de Meta; donde fue posible se contrastaron con 2+ fuentes independientes. La única fuente primaria leída íntegramente fue el repositorio oficial de Meta en GitHub `WhatsApp/WhatsApp-Flows-Tools` (código de cifrado de Flows). Antes de usar cifras en producción, validar contra el rate card CSV oficial descargado desde la cuenta de Meta.

---

## 1. Precios 2026 para Colombia (modelo por mensaje) y estimación de costo mensual

### Takeaway
Desde el **2026-10-01** Meta cobra en Colombia **US$0,0008 por mensaje utility/authentication** y **US$0,0125 por marketing**; los mensajes de **servicio** (texto libre dentro de la ventana de 24 h) dejaron de ser gratis ese mismo día, pero cada número tiene **1.000 mensajes de servicio gratis/mes**, y los **utility templates dentro de la ventana ya NO son gratis**. Para 30 pacientes × 8 sesiones/mes el costo de Meta es del orden de **US$0,20–0,60/mes** (peor caso, si todo se recategoriza a marketing: ~US$8/mes); el costo real lo dominan las tarifas del BSP/hosting, no Meta.

### Cited Findings
**Modelo de precios y cambios de fechas**
- Meta cobra por mensaje entregado (no por conversación), con tarifa según el país del destinatario y la categoría (marketing, utility, authentication, service); el modelo por conversación quedó "Deprecated" — [Meta: Pricing](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing); [Meta: Conversation-based pricing (Deprecated)](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/conversation-based-pricing)
- (Histórico, julio 2025 – 30 sep 2026) "As of July 1, 2025 – Meta does not charge for utility templates in response to users (delivered within an open customer service window)"; y desde 2024-11-01 no se cobraban los mensajes no-template (`"type":"text"`, `"type":"image"`, etc.) — [Meta: Upcoming pricing updates…](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/non-template-messages) (extracto de buscador)
- **Vigente desde 2026-10-01:** "Meta will charge on a per-message basis for utility messages sent in response to users (within an open 24-hour customer service window)" y "Meta will charge on a per-message basis for all service messages"; las tarifas de servicio "are the same as those of utility and authentication, by market" — [Meta: Upcoming pricing updates for Meta Business Agent, service and utility messages](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/non-template-messages)
- **Free tier de servicio (desde 2026-10-01):** "Each business phone number has one shared free tier of 1,000 delivered service messages per month" — [Meta (misma página)](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/non-template-messages); 360dialog confirma: se cobra desde el mensaje 1.001, sin acumulación (no rollover), reinicio mensual; el mensaje de servicio sigue siendo entregable solo dentro de la ventana de 24 h que abre/reinicia cada mensaje entrante del usuario — [360dialog: Service Message Charging Starts October 1, 2026](https://360dialog.com/blog/whatsapp-service-message-charging-october-2026/)
- 360dialog (2026-10): "Utility templates are no longer free inside the service window: since 1 October 2026 they bill like any other utility message" — [360dialog](https://360dialog.com/blog/whatsapp-service-message-charging-october-2026/)
- Meta Business Agent (IA propia de Meta): desde **2026-08-01** se cobra por token, tarifa global **US$2,00 por 1.000.000 tokens**, un mensaje típico consume 20.000–25.000 tokens (≈ US$0,04–0,05/mensaje) — [Meta: Upcoming pricing updates](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/non-template-messages); [TechTimes, 2026-07-16](https://www.techtimes.com/articles/320787/20260716/meta-business-agent-billing-starts-aug-1-free-test-window-ends-days.htm)
- Las tarifas de marketing/utility/authentication se actualizan trimestralmente; rate cards en múltiples monedas, incluida **COP** (USD, AED, ARS, AUD, BRL, CLP, COP, EUR, GBP, IDR, INR, MXN, MYR…) — [Meta: Pricing](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing); COP como moneda de facturación efectiva desde **2026-04-01** — extracto de buscador sobre [Meta: Pricing](https://developers.facebook.com/docs/whatsapp/pricing)

**Tarifas Colombia (USD por mensaje entregado)**

| Categoría | Tarifa CO | Fecha | Fuente |
|---|---|---|---|
| Marketing | US$0,0125 | rate card 2026-10-01 | [Ominiflow Colombia](https://ominiflow.com/whatsapp-api-pricing/colombia); [Flowcall (Oct 2026)](https://www.flowcall.co/blog/whatsapp-business-api-pricing); [EngageLab](https://www.engagelab.com/blog/whatsapp-business-api-pricing) |
| Utility | US$0,0008 | 2026-10-01 | mismas fuentes ("Rates range from $0.0008 (Colombia utility) to $0.1597 (Netherlands marketing)") |
| Authentication | US$0,0008 | 2026-10-01 | mismas fuentes |
| Service (nuevo) | US$0,0008 tras los primeros 1.000/mes/número | 2026-10-01 | [búsqueda agregada sobre 360dialog/whautomate](https://360dialog.com/blog/whatsapp-service-message-charging-october-2026/) + regla de Meta "same as utility by market" |

- Tarifas en **COP** (rate card abril 2026): Marketing **46,0227 COP**, Utility **2,9455 COP**, Authentication **2,9455 COP** — extracto de buscador atribuido a la documentación de precios de Meta ([Meta: Pricing](https://developers.facebook.com/docs/whatsapp/pricing)); confianza media (no se pudo abrir el CSV).
- Colombia tuvo **aumento de tarifas utility y authentication efectivo 2025-10-01** — [Meta: Pricing](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing) (extracto); el valor previo exacto no se pudo confirmar. Una fuente menciona variantes de US$0,00092 según periodo/estructura — [resumen de buscador sobre Spur/whatsetter](https://www.spurnow.com/en/blogs/whatsapp-business-api-pricing-explained) (no verificado; probablemente tarifa de reseller o de otro trimestre).

**Mensajes gratuitos**
- Free entry point (FEP): si el usuario escribe desde un anuncio Click-to-WhatsApp o un botón CTA de una Página de Facebook y la empresa responde en ≤24 h, se abre una ventana de **72 h** en la que **todos** los mensajes (incluidos templates) son gratis — [360dialog: The 72-Hour Click-to-WhatsApp Ad Window](https://360dialog.com/blog/?p=621); [BSG glossary](https://bsg.world/glossary/free-entry-point). Conflicto: un extracto de la página de precios de Meta dice que la ventana FEP "may extend up to 7 days" — [Meta: Pricing](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing) (no se pudo leer el contexto; tratar 72 h como valor seguro).
- Desde 2026-10-01 los únicos mensajes exentos son: los de la ventana FEP y los primeros 1.000 mensajes de servicio/mes por número — [360dialog](https://360dialog.com/blog/whatsapp-service-message-charging-october-2026/)

**Volume tiers**
- Los volume tiers son específicos por mercado y categoría, y aplican a utility y authentication (no a marketing) — [Meta: Pricing](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing) (extracto).

**Referencia de reseller**
- 360dialog cobra una tarifa fija por número (búsqueda muestra "€49–€249 per Number" en 2026) — [Chatmitra vs 360dialog](https://chatmitra.com/chatmitra-vs-360dialog/) (solo título de resultado; no verificado).

### Inferences
- **Tipo de cambio implícito de Meta:** 46,0227/0,0125 ≈ 2,9455/0,0008 ≈ **3.682 COP/USD**, lo que hace consistentes las cifras COP (abril 2026) y USD (octubre 2026); sugiere que la tarifa CO no cambió entre abril y octubre 2026.
- **Estimación mensual (30 pacientes × 8 sesiones = 240 sesiones/mes), tarifas 2026-10-01:**

| Escenario | Mensajes facturables | Costo Meta |
|---|---|---|
| A. 1 utility template por sesión (recordatorio con botones "Confirmo/Reprogramar"); confirmación y reagendamiento como mensajes de servicio dentro de la ventana | 240 utility × 0,0008 | **US$0,19** (servicio ≤1.000/mes → US$0) |
| B. 2 utility templates por sesión (recordatorio + confirmación enviada fuera de ventana) | 480 × 0,0008 | **US$0,38** |
| B + seguimiento semanal de ejercicios (≈130 utility templates/mes) + ~10 primeros contactos | ≈620 × 0,0008 | **≈US$0,50** |
| Peor caso: todos los templates recategorizados a marketing | ≈620 × 0,0125 | **≈US$7,75** |
| Si los mensajes de servicio superan 1.000/mes | cada excedente × 0,0008 | marginal (p. ej. 500 extra = US$0,40) |

- Conclusión de arquitectura: el costo de Meta es irrelevante frente a hosting/BSP; lo que sí importa es (1) mantener los templates en **utility** (diferencia ~15×), y (2) ir directo a Cloud API (sin markup) si el arquitecto puede operar el número; un BSP con cuota fija mensual (decenas de €) puede costar 100× más que el tráfico.
- Probablemente aplique IVA colombiano (19%) a servicios digitales del exterior sobre la factura de Meta; no verificado (ver Gaps).

### Gaps
- No se pudo descargar el CSV oficial del rate card 2026-10-01 ni la tabla de volume tiers de Colombia (umbrales); irrelevante a este volumen pero debe confirmarse.
- No se confirmó la tarifa utility/authentication de Colombia anterior a 2025-10-01 ni si hubo cambio en los trimestres ene/abr/jul 2026 en USD.
- No se encontró fuente sobre tratamiento de IVA/retenciones para facturación directa de Meta a una persona natural en Colombia.

---

## 2. Categorías de templates: ¿recordatorio/confirmación de cita es "utility"? Reglas de recategorización, aprobación, variables e idioma

### Takeaway
Un recordatorio o confirmación de cita **sin contenido promocional** es el caso de libro de **utility**; cualquier elemento persuasivo (promos, "agenda otra terapia", saludo genérico sin contexto de la cita) lo convierte en **marketing**, y Meta recategoriza automáticamente (al aprobar y de forma recurrente). Aprobación típica: minutos a pocas horas, máximo 24 h. Idioma: `es` (y, según la lista actual de Meta, `es_CO`).

### Cited Findings
- Categorías: marketing (awareness/ventas), utility ("to follow up on user actions or requests"), authentication (verificación de identidad) — [Meta: Template categorization](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/template-categorization)
- Para ser utility, el template debe ser **no promocional** (sin intención promocional o persuasiva) y ser **específico de o solicitado por el usuario**, o **esencial/crítico** para el usuario — [Meta: Template categorization](https://developers.facebook.com/docs/whatsapp/updates-to-pricing/new-template-guidelines/) (extracto)
- Meta lista "appointment reminders" entre los usos de templates (junto a customer care, payment/shipping updates, alerts) — [Meta: Template fundamentals](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/overview) (extracto); BSPs clasifican los recordatorios de cita como utility — [Chatarmin: WhatsApp Appointment Reminders 2026](https://chatarmin.com/en/blog/appointment-reminder-whatsapp)
- **Desde 2025-04-09:** si se envía como UTILITY y WhatsApp determina que es MARKETING, el template se **aprueba como MARKETING** (sin rechazo previo); contenido mixto utility+marketing = marketing — [Meta: Template categorization](https://developers.facebook.com/docs/whatsapp/updates-to-pricing/new-template-guidelines) (extracto)
- Meta ejecuta recategorización automática recurrente desde 2024-07-01 (normalmente utility→marketing); el sistema marca upsells, cross-sells o saludos genéricos sin contexto transaccional — [Infiq: Template Categories 2026](https://www.infiq.in/blog/whatsapp-template-categories-guide); [SleekFlow](https://sleekflow.io/blog/whatsapp-business-template) (fuentes secundarias)
- Tiempo de aprobación: la mayoría se aprueba en minutos a un par de horas; Meta se reserva hasta 24 h; revisión automática primero y humana solo si se marca — [WABulkSend: template approval time 2026](https://wabulksend.com/blog/whatsapp-template-approval-time) (secundaria)
- Límites de componentes de template: body ≤1.024 caracteres; header ≤60 caracteres con 1 parámetro; footer ≤60; hasta 10 botones (quick reply, URL, llamada, copy code); **máximo 1 botón Flow por template** — [8x8: WhatsApp Template Components Reference](https://developer.8x8.com/connect/docs/whatsapp/template-components-reference/)
- Ejemplos públicos de recordatorio utility: "Hi {{1}}, this is a reminder for your appointment scheduled on {{2}} at {{3}}." — [resultados SleekFlow/AiSensy](https://sleekflow.io/blog/whatsapp-business-template)
- Idiomas: códigos `es` (Spanish), `es_AR`, `es_ES`, `es_MX` en listas históricas — [Gupshup](https://support.gupshup.io/hc/en-us/articles/360013321939-Which-languages-are-supported-for-message-templates); la página actual de Meta reportadamente incluye además `es_CO` (Spanish COL), `es_CL`, `es_PE`, etc. — [Meta: Supported Languages](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/supported-languages/) (extracto de buscador, no leído directamente)
- Si un template se recategoriza a marketing, también quedan sujetos a límites por usuario para templates de marketing — existe la página [Meta: Per-user marketing template message limits](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/marketing-templates/per-user-limits/) (solo título visto)

### Inferences
- Propuestas de templates utility (borradores, **no** aprobados; mantener cero contenido clínico y cero promoción):
  - `recordatorio_cita` (es_CO o es): "Hola {{1}}, le recordamos la sesión de fonoaudiología de {{2}} programada para el {{3}} a las {{4}} en su domicilio. ¿Nos confirma?" + quick replies `Confirmo` / `Reprogramar` / `Cancelar`.
  - `confirmacion_cita`: "Hola {{1}}, su cita quedó agendada para el {{2}} a las {{3}}. Si necesita cambiarla, responda a este mensaje."
  - `primer_contacto` (solo con opt-in previo): "Hola {{1}}, soy {{2}}, fonoaudióloga. Recibimos su solicitud para atender a {{3}}. ¿Desea agendar la primera visita?" + botón Flow `Elegir horario`.
  - `seguimiento_ejercicios`: "Hola {{1}}, ya está disponible el plan de ejercicios de esta semana. Puede verlo aquí: {{2}}" (link a portal propio; ver sección 6). Riesgo: si suena a "engagement" podría recategorizarse; vincularlo explícitamente a la sesión realizada.
- Evitar en utility: "¡Agenda ya!", descuentos, "¿sabías que también ofrecemos…?", felicitaciones, newsletters.
- Usar parámetros con ejemplos neutrales al enviar a revisión (los ejemplos de variables se revisan; no poner diagnósticos en ejemplos).

### Gaps
- No se pudo leer el texto íntegro de las guías de categorización 2026 ni confirmar si existe proceso de apelación vigente.
- `es_CO` como código soportado proviene de un extracto de buscador de Meta; listas de BSP más antiguas no lo incluyen. Usar `es` es la opción segura.
- No se confirmó en fuente primaria el soporte de "named parameters" (`{{nombre}}`) vs posicionales (`{{1}}`) en 2026.

---

## 3. Ventana de servicio al cliente de 24 h: qué se puede enviar y diseño de recordatorios

### Takeaway
Fuera de la ventana de 24 h solo se pueden enviar **templates aprobados**; dentro, cualquier mensaje (texto, interactivos, Flows). Desde 2026-10-01 dentro de la ventana los mensajes de servicio cuestan (tras 1.000 gratis/mes) y los utility templates también, así que la ventana ya no ahorra templates gratis, pero sigue siendo la **condición para enviar mensajes libres/interactivos**. El recordatorio 24 h antes debe ser siempre un utility template con botones que, al tocarse, reabren la ventana.

### Cited Findings
- Los mensajes no-template solo pueden enviarse dentro de una ventana de servicio abierta — [Meta: Pricing / Service messages](https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/send-messages) (extracto)
- La ventana de 24 h se abre y se **reinicia con cada mensaje entrante** del usuario — [360dialog](https://360dialog.com/blog/whatsapp-service-message-charging-october-2026/)
- Desde 2026-10-01 utility templates dentro de la ventana se cobran; mensajes de servicio se cobran a tarifa utility después de 1.000/mes/número — [Meta](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/non-template-messages); [360dialog](https://360dialog.com/blog/whatsapp-service-message-charging-october-2026/)
- Si no se responde dentro de 24 h a un usuario que llegó por anuncio CTWA, no se abre FEP y hay que usar template — [Agregado 360dialog/SleekFlow sobre CTWA](https://360dialog.com/blog/?p=621)

### Inferences
- **Patrón recomendado:**
  1. T-24/26 h: utility template `recordatorio_cita` con quick replies. (No depende de ventana.)
  2. Respuesta del cuidador (tap en botón) → abre ventana 24 h → respuestas del sistema como mensajes de servicio (lista de horarios ≤10 filas, botones ≤3, o Flow interactivo) — gratis dentro de los 1.000/mes.
  3. Enviar el recordatorio ~24–26 h antes hace que la ventana abierta por la confirmación cubra la mañana de la sesión ("voy en camino", cambios de última hora) sin necesitar otro template.
  4. Si no hay respuesta en X horas: segundo template (utility) o llamada; no insistir con muchos templates (riesgo de bloqueos → calidad).
- Las cancelaciones/reagendamientos iniciados por el paciente siempre llegan dentro de la ventana (el paciente escribe primero) → solo mensajes de servicio.
- Seguimiento entre sesiones (ejercicios): si el cuidador no ha escrito en 24 h, requiere template; agruparlo con la confirmación de la próxima cita reduce mensajes, pero mezclar propósitos puede afectar la categorización (mantener utility y sin persuasión).
- Mantener en BD el timestamp del último mensaje entrante por contacto (por `wa_id`/BSUID) para decidir automáticamente template vs mensaje libre.

### Gaps
- No se pudo verificar en el texto de Meta si un tap en un quick-reply de template cuenta formalmente como "mensaje entrante" para abrir la ventana (es la práctica común documentada por BSPs, pero no se leyó la frase en Meta).

---

## 4. WhatsApp Flows para agendamiento e intake: capacidades, cifrado del endpoint, disponibilidad y límites

### Takeaway
Sí: Meta publica un ejemplo oficial **"book-appointment"** con pantallas de fecha/hora/detalles/resumen y un endpoint que entrega horarios dinámicos. El canal de datos usa **RSA-2048 (OAEP-SHA256) para envolver una clave AES-128 por solicitud, y AES-128-GCM** con el **IV invertido bit a bit** para la respuesta; el endpoint debe responder en <10 s y verificar `X-Hub-Signature-256`. No se hallaron restricciones de país para Colombia.

### Cited Findings
**Ejemplo oficial de agenda (Meta, GitHub, leído directamente)**
- El repo oficial `WhatsApp/WhatsApp-Flows-Tools` incluye `examples/endpoint/nodejs/book-appointment` con pantallas `APPOINTMENT` (listas de `date` y `time` donde cada opción puede llevar `enabled: false` para slots ocupados), `DETAILS` (nombre, email, teléfono, detalles) y `SUMMARY` — [GitHub: book-appointment/src/flow.js](https://github.com/WhatsApp/WhatsApp-Flows-Tools/blob/main/examples/endpoint/nodejs/book-appointment/src/flow.js)
- El handler distingue `action === "ping"` (health check, responde `status: "active"`), `INIT`, `data_exchange`, y notificaciones de error del cliente (`data.error`) — [GitHub: flow.js](https://github.com/WhatsApp/WhatsApp-Flows-Tools/blob/main/examples/endpoint/nodejs/book-appointment/src/flow.js)

**Cifrado del canal de datos (código oficial de Meta)**
- Par de claves: `crypto.generateKeyPairSync("rsa", { modulusLength: 2048 })`, pública en `spki` PEM (se sube a la cuenta/número), privada en `pkcs1` PEM cifrada con passphrase (`des-ede3-cbc`) — [GitHub: keyGenerator.js](https://github.com/WhatsApp/WhatsApp-Flows-Tools/blob/main/examples/endpoint/nodejs/book-appointment/src/keyGenerator.js)
- La solicitud trae `encrypted_aes_key`, `encrypted_flow_data`, `initial_vector` (base64). La clave AES se descifra con `RSA_PKCS1_OAEP_PADDING` y `oaepHash: "sha256"`; `encrypted_flow_data` = ciphertext ‖ tag GCM de 16 bytes; se descifra con `aes-128-gcm` usando el IV recibido — [GitHub: encryption.js](https://github.com/WhatsApp/WhatsApp-Flows-Tools/blob/main/examples/endpoint/nodejs/basic/src/encryption.js)
- Respuesta: se **invierte el IV** (`~byte` para cada byte), se cifra el JSON con `aes-128-gcm` y la misma clave AES, y se devuelve en el cuerpo HTTP `base64(ciphertext ‖ authTag)` — [GitHub: encryption.js](https://github.com/WhatsApp/WhatsApp-Flows-Tools/blob/main/examples/endpoint/nodejs/basic/src/encryption.js); sin flip de IV WhatsApp devuelve error 421 — [resumen de buscador sobre Meta: Implement endpoints for Flows](https://developers.facebook.com/documentation/business-messaging/whatsapp/flows/guides/implementingyourflowendpoint)
- Códigos HTTP del endpoint: **421** si falla el descifrado (fuerza al cliente a refrescar la clave pública), **432** si la firma `x-hub-signature-256` (HMAC-SHA256 con App Secret sobre el raw body) no coincide, **427** si el `flow_token` es inválido (deshabilita el Flow y muestra `error_msg` cifrado) — [GitHub: server.js](https://github.com/WhatsApp/WhatsApp-Flows-Tools/blob/main/examples/endpoint/nodejs/book-appointment/src/server.js); [GitHub: encryption.js](https://github.com/WhatsApp/WhatsApp-Flows-Tools/blob/main/examples/endpoint/nodejs/basic/src/encryption.js)

**Límites y operación**
- El endpoint debe responder en **≤10 s** (recomendado <1 s); si Meta detecta el endpoint no saludable, el Flow pasa a **Throttled** (se puede enviar pero limitado a **10 mensajes/hora**); tamaño máximo del Flow JSON **10 MB**; versiones publicables 5.1, 6.0–6.3, 7.0–7.3 (recomendada 7.3) — [AWS End User Messaging Social: Flows limitations](https://docs.aws.amazon.com/social-messaging/latest/userguide/managing-flows-limitations.html)
- Componentes de entrada incluyen `DatePicker` y `CalendarPicker` (v6.1+, modos `single` o `range`) — [D7 Networks: Flow components](https://d7networks.com/blog/whatsapp-flow-components/)
- Existen Flows sin endpoint (estáticos) y con endpoint (dinámicos) — [pywa: Flow Types](https://pywa.readthedocs.io/en/latest/content/flows/flow_types.html); AWS anunció soporte de Dynamic Flows en 2026-09 — [AWS What's New 2026-09](https://aws.amazon.com/about-aws/whats-new/2026/09/aws-end-user-messaging-whatsapp-dynamic-flows/)
- Un template puede llevar **1 botón Flow** (para abrir el Flow fuera de la ventana de 24 h) — [8x8](https://developer.8x8.com/connect/docs/whatsapp/template-components-reference/)
- Disponibilidad: AWS indica que Flows están disponibles en todas las regiones donde opera su servicio de WhatsApp; no se hallaron restricciones por país del destinatario — [AWS: Flows limitations](https://docs.aws.amazon.com/social-messaging/latest/userguide/managing-flows-limitations.html)

### Inferences
- Arquitectura: el primer contacto (template utility con botón Flow `Elegir horario`) → Flow dinámico que en `INIT` consulta la agenda y devuelve fechas/horas con `enabled:false` en slots ocupados → `data_exchange` valida y bloquea tentativamente el slot → pantalla final envía respuesta (`nfm_reply`) al webhook → backend confirma con mensaje de servicio.
- Un Flow estático (sin endpoint) sirve para intake simple, pero no para disponibilidad en tiempo real; para agenda real se necesita endpoint (o generar el JSON del Flow con fechas por mensaje).
- Seguridad: la clave privada RSA debe vivir en un secret manager; la AES es efímera por request. El cifrado protege el tramo dispositivo↔endpoint del negocio, pero las respuestas finales del Flow que llegan por webhook pasan por Meta (ver sección 6) — inferencia; no recolectar diagnósticos en el Flow.
- Diseñar con fallback: si el endpoint cae y el Flow queda Throttled, ofrecer list message (≤10 filas) como plan B.

### Gaps
- No se pudo leer la página de Meta para confirmar: proceso exacto de subida/firma de la clave pública (`/whatsapp_business_encryption`), límites de pantallas por Flow, soporte en WhatsApp Web/Desktop y política de datos sensibles en Flows.
- No se encontró confirmación explícita "Flows disponible en Colombia" en fuente de Meta; solo ausencia de restricciones.

---

## 5. Políticas: IA, salud y menores, opt-in, calidad/límites, nombre visible y verificación de persona natural

### Takeaway
(a) La prohibición desde **2026-01-15** apunta a proveedores cuyo **producto principal** es un asistente de IA de propósito general; un bot de agendamiento de un negocio (aunque use un LLM) sigue permitido. (b) Servicios de salud están permitidos (vender productos médicos no), pero la política prohíbe enviar/solicitar información de salud cuando la ley exija sistemas con requisitos reforzados, y prohíbe pedir números de documento de identidad. (c) Opt-in obligatorio, con nombre del negocio, y la prueba es responsabilidad del negocio. (d) Un número nuevo arranca en 250 destinatarios únicos/24 h, más que suficiente. (e) Una persona natural con RUT puede verificarse como "sole proprietorship"; el nombre visible no puede ser solo su nombre propio: debe indicar la actividad (p. ej. "Fonoaudióloga Ana Pérez").

### Cited Findings
**(a) IA / chatbots**
- Cláusula "AI Providers" en los WhatsApp Business Solution Terms: proveedores de LLM, plataformas de IA generativa y asistentes de IA de propósito general están "strictly prohibited" de usar la plataforma cuando esas tecnologías son "the primary (rather than incidental or ancillary) functionality being made available for use, as determined by Meta in its sole discretion"; anunciada a mediados de octubre 2025, aplicable desde **2026-01-15** — [WhatsApp Business Solution Terms](https://www.whatsapp.com/legal/business-solution-terms); [TechCrunch, 2025-10-18](https://techcrunch.com/2025/10/18/whatssapp-changes-its-terms-to-bar-general-purpose-chatbots-from-its-platform/); [MediaNama, 2025-10](https://www.medianama.com/2025/10/223-whatsapp-bans-external-ai-providers-business-api/)
- Usos que siguen permitidos según análisis secundarios: bots de soporte del propio negocio, seguimiento de pedidos, **bots de reservas y citas**, FAQ con base de conocimiento definida — [Dataslayer](https://www.dataslayer.ai/blog/meta-bans-general-purpose-ai-chatbots-on-whatsapp-business); [Azguards](https://azguards.com/ai-ml/artificial-intelligence/what-metas-2026-whatsapp-chatbot-ban-means-for-businesses-explained/)
- Contexto UE (no aplica a Colombia, pero muestra que la cláusula sigue en disputa): marzo 2026 Meta ofreció acceso de chatbots rivales en Europa con tarifa (€0,0490–€0,1323/mensaje); junio 2026 la Comisión Europea impuso medidas cautelares considerando que la tarifa tiene el mismo efecto excluyente — [ETV Bharat, 2026-03](https://www.etvbharat.com/amp/en/technology/meta-opens-whatsapp-to-rival-ai-chatbots-in-europe-for-a-fee-enn26030701704); [NY1/AP, 2026-06-09](https://ny1.com/nyc/all-boroughs/ap-top-news/2026/06/09/eu-orders-meta-to-restore-whatsapp-access-for-rival-ai-chatbots)

**(b) Salud, información sanitaria y menores**
- WhatsApp Business Messaging Policy: "Don't use WhatsApp for telemedicine or to send or request any health related information, if applicable regulations prohibit distribution of such information to systems that do not meet heightened requirements to handle health related information" — [WhatsApp Business Messaging Policy](https://business.whatsapp.com/policy) (extracto); [tyntec: ¿telemedicina permitida?](https://www.tyntec.com/helpcenter/docs/faqs/whatsapp-business/whatsapp-commerce-policy/is-telemedicine-allowed-on-the-whatsapp-business-api/)
- La política prohíbe compartir o pedir "full-length individual payment card numbers, financial account numbers, personal ID card numbers, or other sensitive identifiers" — [WhatsApp Business Messaging Policy](https://business.whatsapp.com/policy) (extracto)
- Commerce Policy: productos médicos/sanitarios no pueden venderse ni promocionarse; negocios de salud sí pueden ofrecer **servicios** (consultas, procedimientos) — [tyntec: industrias de salud permitidas](https://www.tyntec.com/helpcenter/docs/faqs/whatsapp-business/whatsapp-commerce-policy/what-industries-in-the-health-sector-are-allowed-on-whatsapp/)
- Edad mínima para usar WhatsApp: 13 años (o más según país); menores de 18 requieren permiso de padre/tutor; existen cuentas gestionadas por padres donde estén disponibles — [ConductAtlas: WhatsApp Terms (age)](https://conductatlas.com/platform/whatsapp/whatsapp-terms-of-service/minimum-age-and-parent-managed-accounts/); en Colombia no hay legislación específica sobre edad mínima en apps; MinTIC recomienda "no redes sociales antes de 13" — [MinTIC](https://www.mintic.gov.co/portal/715/w3-article-72734.html)

**(c) Opt-in**
- Solo se puede contactar si (a) la persona dio su número y (b) se recibió **opt-in** confirmando que desea recibir mensajes posteriores; el opt-in puede ser general (no específico de WhatsApp) desde la actualización de noviembre 2024, siempre que cumpla la ley local — [Meta: Get opt-in for WhatsApp](https://developers.facebook.com/documentation/business-messaging/whatsapp/getting-opt-in); [Business Policy](https://business.whatsapp.com/policy)
- Al obtener el opt-in debe indicarse claramente que la persona acepta recibir comunicaciones y **el nombre del negocio**; el negocio es "solely responsible" del método y de cumplir la ley aplicable; buena práctica: opt-in por categoría de mensaje — [Meta: Get opt-in](https://developers.facebook.com/documentation/business-messaging/whatsapp/getting-opt-in)
- Ley 1581 de 2012 (Colombia): la autorización del titular debe ser previa, expresa e informada; el responsable debe **solicitar y conservar copia de la autorización** (art. 17 lit. b); datos sensibles (salud) requieren autorización explícita e informar que su entrega es facultativa (art. 6); régimen especial para datos de niños, niñas y adolescentes (art. 7) — [Ley 1581 de 2012, Secretaría del Senado](http://www.secretariasenado.gov.co/senado/basedoc/ley_1581_2012.html)

**(d) Calidad y límites de mensajería**
- Desde **2025-10-07** el límite se aplica a nivel de **business portfolio** (todos los números comparten límite) — [Gallabox](https://gallabox.com/whatsapp-business-pricing-october-2025-update); [Serri](https://www.serri.ai/whatsapp-messaging-limits-are-changing-from-october-7-2025-heres-what-you-need-to-know/); [Meta: Messaging limits](https://developers.facebook.com/documentation/business-messaging/whatsapp/messaging-limits)
- Escalones: **250** (inicial) → **2.000** (vía verificación del negocio, o 2.000 mensajes entregados a destinatarios únicos en 30 días con templates de alta calidad) → 10.000 → 100.000 → ilimitado, automático si se mantiene calidad y se usa ≥50% del límite en 7 días; reevaluación cada ~6 h — [Gallabox](https://gallabox.com/whatsapp-business-pricing-october-2025-update)
- Calidad: basada en señales de los últimos 7 días (bloqueos, reportes, silenciamientos, archivados, motivos de bloqueo), ponderada por recencia; si el número está "Flagged" 7 días, el límite baja un nivel; templates pueden quedar Active High/Medium/Low o **Paused** — [Meta: Messaging limits / Template fundamentals](https://developers.facebook.com/documentation/business-messaging/whatsapp/messaging-limits) (extractos)
- Desde 2023-11-01 la verificación del negocio no es obligatoria para subir de límite — [Wati](https://support.wati.io/en/articles/11463211-how-to-increase-your-whatsapp-messaging-limit-without-meta-business-verification)

**(e) Nombre visible y verificación de persona natural**
- Un nombre visible que incluye nombre de persona debe indicar la naturaleza del negocio (p. ej. "Tom Ford Chiropractor" aceptado; "Tom Ford" no); no se aceptan nombre completo de una persona, términos genéricos, ubicaciones o eslóganes — [respond.io](https://respond.io/blog/whatsapp-business-name); [360dialog: Display Names](https://docs.360dialog.com/docs/resources/phone-numbers/display-names); [Wati](https://support.wati.io/en/articles/11462959-guidelines-for-choosing-your-display-name)
- En cuentas no verificadas, el chat muestra el **número** en el encabezado y el nombre visible en letra pequeña; según Vonage, la visibilidad del nombre está ligada al límite (revisión al alcanzar ≥2.000) — [Vonage](https://api.support.vonage.com/hc/en-us/articles/28026107711516-Why-is-my-WhatsApp-Messaging-Limit-still-at-250-and-Display-Name-not-visible-after-Business-Verification); [Clickatell](https://www.clickatell.com/help-center/whatsapp/sending-receiving-messages/messaging-limits-whatsapp-business/)
- La verificación de Meta admite **sole proprietorship** (negocio de una persona); documentos válidos incluyen registro tributario, licencias, extractos bancarios o facturas de servicios con el nombre legal y dirección/teléfono; no se aceptan formularios autodiligenciados — [360dialog: Meta Business Verification](https://360dialog.com/blog/how-to-get-whatsapp-green-tick-verification/); [Memorly checklist](https://www.memorly.ai/blog/our-blog-1/documents-required-for-whatsapp-business-api-approval-60)
- En LatAm: para verificar se requiere estar registrado ante la autoridad tributaria con identificador vigente; incluye a personas que facturan de forma independiente; en Colombia el identificador es el NIT (persona natural en el RUT) — [Leadsales](https://leadsales.io/blog/verificar-negocio-meta-business-para-usar-api/); [Empleado.uno: no es obligatorio verificar](https://www.empleado.uno/blog/es-obligatorio-verificar-tu-negocio-en-meta)

### Inferences
- IA: usar un LLM propio para interpretar texto libre ("¿puede el jueves en la tarde?") dentro de un bot de agenda es "incidental" y permitido; **no** ofrecer un asistente conversacional abierto ni dar consejo clínico generado por IA (riesgo de política y de responsabilidad profesional). Si se usara Meta Business Agent, costaría ~US$0,04–0,05/mensaje (50× un utility).
- Salud: agendar visitas domiciliarias es un servicio permitido. El contenido de los mensajes debe ser logístico. Evitar pedir por WhatsApp (chat o Flow) **número de cédula/TI/registro civil** del niño o del acudiente: chocaría con la prohibición de "personal ID card numbers"; recolectarlos en un formulario web propio.
- Menores: el interlocutor debe ser el padre/madre/acudiente (titular de la cuenta WhatsApp); el niño no debe ser destinatario. Registrar en la autorización quién es el representante legal.
- Opt-in: una remisión de EPS/médico **no** es opt-in del cuidador. Para el "primer contacto automático" se requiere un opt-in previo (formulario web con checkbox no premarcado, nombre del negocio y canal WhatsApp, finalidades, y autorización explícita de datos sensibles); alternativamente, que el cuidador inicie la conversación vía enlace `wa.me`/QR (mensaje entrante = ventana abierta y consentimiento contextual). Guardar evidencia: timestamp, texto mostrado, versión de la política, IP/canal.
- Límites: con 30 pacientes el límite inicial de 250/24 h basta; la verificación del negocio no es necesaria para volumen, pero sí deseable para que se vea el nombre ("Fonoaudióloga …") en vez del número, lo que reduce bloqueos por desconfianza.
- Nombre visible sugerido: "Fonoaudiología [Nombre Apellido]" o "Fga. [Nombre] Terapia del Lenguaje"; debe coincidir con presencia externa (web/Instagram/Google Business) que muestre la actividad.

### Gaps
- No se pudo leer el texto íntegro de los Business Solution Terms ni de la Business Messaging Policy (bloqueados); citas literales vienen de extractos de buscador.
- No se encontró ningún caso documentado de verificación exitosa de una **persona natural colombiana** con RUT ante Meta; solo guías genéricas de BSP latinoamericanos.
- No se encontró política de Meta específica sobre mensajería a padres sobre menores pacientes; lo anterior es inferencia desde ToS + Ley 1581.
- No se verificó si existe regulación colombiana de telesalud (p. ej. Res. 2654 de 2019) que restrinja el uso de mensajería para teleorientación/seguimiento.

---

## 6. Manejo de datos: Cloud API alojada por Meta, retención, almacenamiento local, Meta como encargado e implicaciones clínicas

### Takeaway
En Cloud API, Meta **descifra** los mensajes en sus servidores (no es E2E hasta el negocio), los retiene **hasta 30 días**, actúa como **encargado (processor)** y almacena por defecto en EE. UU.; "Local Storage" existe solo para ciertos países (en LatAm únicamente **Brasil**; **no Colombia**). Por tanto, WhatsApp debe usarse solo para logística (citas, recordatorios, links), nunca para historia clínica, diagnósticos, informes ni identificadores.

### Cited Findings
- "Cloud API decrypts messages and forwards them to the business"; los mensajes se almacenan temporalmente solo para la funcionalidad base, con **retención máxima de 30 días** (p. ej. retransmisiones); los identificadores se borran dentro de 30 días desde el último cambio de estado del mensaje — [Meta: Data Privacy & Security](https://developers.facebook.com/documentation/business-messaging/whatsapp/data-privacy-and-security/) (extracto); [360dialog: Architecture and Security](https://docs.360dialog.com/docs/waba-basics/architecture-and-security)
- "Messages sent or received via Cloud API are only accessed by Cloud API, no other part of Meta can use this information" — [Meta: Data Privacy & Security](https://developers.facebook.com/documentation/business-messaging/whatsapp/data-privacy-and-security/) (extracto)
- Meta, al prestar Cloud API, actúa como **data processor/service provider** del negocio en la medida en que la ley aplicable reconozca esos conceptos — [Meta: Data Privacy & Security](https://developers.facebook.com/documentation/business-messaging/whatsapp/data-privacy-and-security/) (extracto)
- Mensajes en reposo cifrados — [Meta: Data Privacy & Security](https://developers.facebook.com/documentation/business-messaging/whatsapp/data-privacy-and-security/) (extracto)
- **Local Storage**: permite almacenar datos de mensajes en reposo en un país/región; regiones soportadas: APAC (India, Singapur, Indonesia, Corea del Sur, Japón, Australia), LATAM (**Brasil**), MEA (Sudáfrica, Baréin), Europa (UE en Alemania, Reino Unido, Suiza), NORAM (Canadá); sin él, el contenido se almacena en EE. UU. — [Meta Local Storage (copia en ChatArchitect)](https://support.chatarchitect.com/books/meta-whatsapp/page/local-storage-developer-documentation/revisions/505/changes); [Turn.io: implicaciones de Cloud API](https://learn.turn.io/l/en/article/dh2od9dbbg-migration-to-the-cloud-api-capi)
- **Conflicto**: un blog afirma que Meta no puede leer el contenido ni en sus servidores — [bitbybit](https://bitbybit.studio/guides/whatsapp-business-api-security/); **contradicho** por la propia documentación de Meta ("Cloud API decrypts messages") — [Meta](https://developers.facebook.com/documentation/business-messaging/whatsapp/data-privacy-and-security/). Prevalece Meta.
- **BSUID/usernames (cambio de identificador 2026):** BSUIDs en webhooks desde abril 2026; desde junio 2026 los campos `wa_id`/`from` pueden traer un BSUID (formato `CC.alfanumérico`, hasta 128 caracteres) en lugar del teléfono si el usuario adopta username; envío a BSUID soportado desde julio 2026; soporte obligatorio para todas las integraciones — [Meta: Business-scoped user IDs](https://developers.facebook.com/documentation/business-messaging/whatsapp/business-scoped-user-ids/); [Microsoft Azure ACS](https://learn.microsoft.com/en-us/azure/communication-services/concepts/advanced-messaging/whatsapp/whatsapp-username-support-overview)
- Colombia: datos clínicos (diagnósticos, tratamientos, resultados) son **datos sensibles** (Ley 1581/2012, reglamentada por Decreto 1377/2013, vigilada por la SIC) — [Saludtools](https://www.saludtools.com/articulo/proteccion-datos-pacientes-colombia-ley-1581); [Ley 1581](http://www.secretariasenado.gov.co/senado/basedoc/ley_1581_2012.html)
- La SIC sancionó a SOS EPS por divulgar sin autorización la historia clínica de un paciente (incluido diagnóstico de VIH) — [SIC](https://sedeelectronica.sic.gov.co/comunicado/la-sic-sanciona-sos-eps-por-divulgar-sin-autorizacion-ni-justificacion-legal-la-historia-clinica-de-un-paciente-incluido-su-diagnostico-de)
- La SIC ordenó a WhatsApp LLC ajustarse al estándar colombiano de protección de datos (política en español, etc.) — [Ámbito Jurídico](https://www.ambitojuridico.com/noticias/mercantil/superindustria-ordena-whatsapp-cumplir-con-el-estandar-nacional-de-proteccion-de) (fecha del caso no verificada)
- Ley 1581 regula la transferencia internacional de datos personales (art. 26) — [Ley 1581](http://www.secretariasenado.gov.co/senado/basedoc/ley_1581_2012.html)

### Inferences
- **No enviar por WhatsApp:** diagnósticos (p. ej. "TEA", "disfagia", "apraxia"), evolución/notas de sesión, informes o historia clínica en PDF, resultados de evaluaciones, fotos/videos del niño con fines clínicos, cédula/TI/registro civil, número de afiliación, datos de pago. Tampoco en variables de templates ni en ejemplos de templates (Meta los revisa).
- **Sí enviar:** nombre del cuidador, fecha/hora/dirección de la cita, confirmaciones, "su plan de ejercicios está disponible" + **enlace a portal propio autenticado** (token de un solo uso/expiración, login con OTP), material genérico no identificable.
- Los ejercicios en casa personalizados revelan la condición del paciente → tratarlos como dato sensible: entregarlos en el portal, no en el chat.
- La autorización de tratamiento de datos debe mencionar: uso de WhatsApp (Meta Platforms, EE. UU.) como encargado para comunicaciones logísticas, transferencia internacional, retención ≤30 días en Meta, y finalidades separadas (agenda vs seguimiento).
- Diseño de datos: clave primaria interna del paciente; guardar `phone_e164` y `bsuid` como identificadores de contacto (nullable ambos); no depender de que `from` sea teléfono.
- Medios entrantes (audios/fotos que envíe el cuidador, p. ej. un audio del niño hablando) llegan vía Meta: descargarlos al almacenamiento propio, y advertir en el onboarding que no se envíe información clínica por chat.

### Gaps
- No se pudo verificar la retención exacta de **medios** en Cloud API ni la caducidad de las URLs de media en 2026.
- No se encontró pronunciamiento de la SIC o MinSalud específico sobre uso de WhatsApp Business API por profesionales de salud.
- No se verificó si Meta publica un DPA/"WhatsApp Business Data Processing Terms" aplicable a Colombia con cláusulas para transferencia internacional.

---

## 7. Coexistence: usar la app WhatsApp Business en el teléfono y la API en el mismo número

### Takeaway
Sí: la fonoaudióloga puede seguir usando la app WhatsApp Business en su celular mientras la Cloud API automatiza, con el mismo número; Colombia **no** está en la lista de países excluidos (a 2026 solo Nigeria y Sudáfrica). Requiere onboarding vía Embedded Signup de un Tech Provider/Solution Partner, app ≥2.24.17, número activo en la app ≥7 días y abrir la app al menos cada 14 días; varias funciones de la app se desactivan.

### Cited Findings
- Coexistence permite que un número esté activo en la app WhatsApp Business y en Cloud API a la vez; los mensajes nuevos enviados/recibidos de cualquier lado se reflejan al otro vía webhooks en tiempo real — [YCloud](https://www.ycloud.com/blog/whatsapp-business-app-coexistence-meta-update); [Meta: Onboard WhatsApp Business app users](https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/onboarding-business-app-users/)
- Requisitos: app WhatsApp Business **≥ 2.24.17**; número usado activamente en la app al menos **7 días**; se pueden sincronizar contactos y los **últimos 6 meses** de historial; el onboarding lo hace un **Solution Partner o Tech Provider** vía Embedded Signup seleccionando que el número ya está en la app — [Meta: Onboard Business app users](https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/onboarding-business-app-users/) (extracto); [Infobip: coexistence](https://www.infobip.com/docs/whatsapp/manage-integration/coexistence); [SendSeven 2026](https://sendseven.com/en/blog/whatsapp-coexistence-guide-2026)
- Limitaciones: throughput limitado a **20 mensajes/s**; en la app se desactivan mensajes temporales, ver una vez, ubicación en tiempo real, **listas de difusión**, edición y eliminación para todos; hay que abrir la app al menos cada **14 días**; mensajes enviados desde dispositivos no soportados (WhatsApp para Windows, WearOS) no generan webhook — [Whautomate: Coexistence 2026](https://whautomate.com/whatsapp-coexistence)
- Países: a 2026 solo **Nigeria (+234) y Sudáfrica (+27)** no tienen soporte; las restricciones a UE, Australia y Japón se levantaron en noviembre 2025 — [Whautomate](https://whautomate.com/whatsapp-coexistence); [ChakraHQ: Coexistence live worldwide](https://chakrahq.com/article/whatsapp-coexistence-live-eu-uk-europe-whatsapp-business-for-api-live/)

### Inferences
- Encaja con el caso: la terapeuta conversa manualmente desde su celular (casos delicados, llamadas) y el backend envía recordatorios/Flows; el backend recibe eco de lo que ella escribe y puede registrar el estado de la conversación.
- Como el onboarding exige ser Tech Provider/Solution Partner, un desarrollador independiente probablemente necesite usar un BSP que ofrezca Coexistence (360dialog, YCloud, Infobip, etc.) o registrarse como Tech Provider; esto puede introducir una cuota mensual.
- Riesgo operativo: si ella no abre la app en 14 días (vacaciones), la sincronización puede romperse; agregar monitoreo/alerta.
- Lo que ella escriba manualmente desde la app también pasa a ser visible para el backend (y a Meta vía Cloud API); aplicar las mismas reglas de "no clínico" a su uso manual.

### Gaps
- No se encontró fuente que confirme cómo se factura en Coexistence lo enviado desde la app (se presume gratis como en la app normal, y lo enviado por API con tarifas de API) — sin verificar.
- No se confirmaron los nombres exactos de los campos webhook de eco/sincronización en 2026 ni si el límite de 250/24 h aplica distinto en Coexistence.

---

## 8. Alternativas y respaldos: SMS en Colombia, bot de Telegram, email; riesgo de librerías no oficiales

### Takeaway
SMS en Colombia cuesta ~**6–20 COP** por mensaje (≈US$0,0016–0,0054, 2–7× un utility de WhatsApp) y sirve como respaldo sin ventanas ni templates; Telegram es gratis pero **un bot no puede iniciar la conversación** (el cuidador debe escribir primero) y su adopción en Colombia es incierta; las librerías no oficiales (Baileys, whatsapp-web.js, Evolution API) implican alto riesgo de **baneo del número** de la terapeuta y de rupturas por cambios de protocolo.

### Cited Findings
- SMS masivo Colombia (precios 2026, IVA incluido salvo indicación): Inalambria desde **$6 COP** en alto volumen; paquetes pequeños (500–5.000) a **$19,99 COP/SMS**; 1,4 M SMS a $7,14 COP — [Inalambria: ¿Cuánto cuesta enviar SMS masivos en Colombia en 2026?](https://www.inalambria.express/post/cuanto-cuesta-enviar-sms-masivos-en-colombia); Onurix de **$14,32** a **$6,39 COP**/SMS según paquete, paquetes desde $42.000 COP sin vencimiento — [Onurix tarifas](https://www.onurix.com/portal/tarifas/sms-masivo-colombia); LabsMobile desde **COP 7,4** — [LabsMobile Colombia](https://www.labsmobile.com/en/bulk-sms-sending-platform/colombia); Correo Masivo desde $7 COP — [Correo Masivo](https://www.correomasivo.com.co/es/precios)
- Telegram: la Bot API es gratuita; ~30 mensajes/s de difusión sin costo; >1 msg/s por chat produce errores 429; difusión pagada hasta 1.000 msg/s con Stars — [Telegram Bots FAQ](https://core.telegram.org/bots/faq); [grammY: flood limits](https://grammy.dev/advanced/flood)
- Telegram: "Bots can't start conversations with users. A user must either add them to a group or send them a message first" — [Telegram: Bots, an introduction](https://core.telegram.org/bots)
- Librerías no oficiales: Evolution API es middleware REST sobre el protocolo de WhatsApp Web vía Baileys; Meta puede cambiar el protocolo en cualquier momento y romper el servicio — [GuruSup: Evolution API](https://gurusup.com/blog/evolution-api-whatsapp)
- Detección: fingerprinting del protocolo, patrones de velocidad y análisis de comportamiento; al detectarse, Meta banea el número; se citan vidas útiles de "2–8 semanas" — [SporeSec](https://sporesec.com/en/blog/whatsapp-unofficial-api-ban-risk); [AdviseAI](https://www.adviseai.in/blog/whatsapp-automation-ban-risk) (fuentes de baja calidad/comerciales; la cifra de semanas no es verificable)
- La única vía de automatización segura es la API oficial (directa o vía BSP) — [SporeSec](https://sporesec.com/en/blog/whatsapp-unofficial-api-ban-risk)

### Inferences
- Respaldo recomendado: SMS solo para (1) primer contacto cuando no hay WhatsApp o falla el envío (webhook `failed`), y (2) recordatorio crítico si el utility template no se entrega; costo para 30 pacientes despreciable (240 SMS × ~15 COP ≈ 3.600 COP/mes).
- Email: útil para enviar el enlace al portal y documentos (informes) con cifrado/links autenticados; costo prácticamente nulo con proveedores transaccionales (no verificado en esta investigación).
- Telegram como canal opcional para familias que lo prefieran (gratis, sin plantillas), pero no puede ser el canal de primer contacto.
- Librerías no oficiales: el número de la terapeuta es su activo de contacto con pacientes; un baneo interrumpe su práctica → descartarlas para producción, aunque Cloud API cueste centavos.

### Gaps
- No se encontraron datos fiables de penetración de Telegram en Colombia 2026 ni de preferencias de canal de cuidadores.
- No se verificaron precios de proveedores de email transaccional ni de SMS vía Twilio/Infobip para Colombia (sitios bloqueados).
- No se encontró texto oficial de Meta (Términos de WhatsApp) leído directamente que prohíba explícitamente clientes no autorizados; la afirmación de riesgo de baneo se apoya en fuentes secundarias.
