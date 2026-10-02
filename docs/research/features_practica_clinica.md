<!-- features_practica_clinica.md: nota de investigación — funciones, flujos, modelo de datos clínico y visualizaciones de una práctica fonoaudiológica a domicilio. Foto del 2026-10-02; se distingue del reporte
     (docs/research-report.md), que sintetiza las siete notas. -->

# Funcionalidades, flujos, modelo de datos clínico y visualizaciones para software de práctica fonoaudiológica (fonoaudióloga independiente, atención domiciliaria, Colombia) — estado a octubre de 2026

> Nota metodológica (2026-10-02): en esta sesión el proxy bloqueó `WebFetch` para casi todos los dominios (simplepractice.com, jane.app, theraplatform.com, slptoolkit.com, asha.org, pubmed, ncbi, imsalud.gov.co). Todo lo que sigue sale de **resúmenes del buscador web** sobre las URL citadas, no de una lectura completa de cada página. Los precios de proveedores salen en su mayoría de **agregadores** (schedulingkit, costbench, softwarefinder, pricingsaas) y no de la página oficial de precios: hay que tratarlos como **no verificados** y volver a confirmarlos en la web del proveedor antes de usarlos en un informe final. Las cifras de estudios (RR, g, n) coinciden con abstracts conocidos, pero también conviene verificarlas contra el texto completo.

---

## 1. Herramientas comerciales internacionales (SimplePractice, Jane, TheraPlatform, Ensora/Fusion/TheraNest, Practice Better, SLP Toolkit, WebPT): qué incluyen, precios 2026 y quejas

### Takeaway
Las suites de EE. UU. y Canadá cobran entre ~USD 29 y 155 al mes por profesional y empaquetan siempre lo mismo: agenda con reserva online, recordatorios por SMS o email, portal del cliente, notas y plantillas, cobros, telesalud y, desde 2025-2026, un escriba de IA como complemento pago (USD 15–35 al mes). Solo las especializadas en rehabilitación o fonoaudiología (Ensora Rehab/Fusion y SLP Toolkit) traen objetivos, recolección de datos por ensayo, gráficas de progreso y plantillas por área (articulación, lenguaje, fluidez, alimentación). Las quejas se repiten en todas: subidas de precio, cobro aparte de cada función, soporte lento y facturación torpe. Ninguna está pensada para visitas a domicilio en Latinoamérica: no usan WhatsApp, no manejan COP, no conocen Bre-B ni RIPS.

### Cited Findings
**SimplePractice**
- Precios 2026 según agregador: Starter USD 29/mes (agenda, sincronización de calendario, plantillas básicas, portal limitado, app móvil, cobros), Essential USD 69/mes (añade telesalud, reclamaciones a aseguradoras, formularios de ingreso a medida, mensajería segura y recordatorios por email y texto) y Plus USD 99/mes (grupo, reportes avanzados, roles). Cada clínico adicional cuesta USD 39/mes. No hay plan gratis y la prueba dura 30 días. **Hay discrepancia**: otra fuente da Starter a USD 49/mes a mediados de 2026 — [schedulingkit](https://schedulingkit.com/pricing-guides/simplepractice-pricing); [costbench](https://www.costbench.com/software/telehealth/simplepractice/)
- El escriba "Note Taker" cuesta USD 35 al mes por clínico (según fuentes secundarias). Transcribe el audio en tiempo real para redactar un borrador de nota de progreso. Según el resumen de búsqueda, no crea ni guarda una grabación de la sesión — [Commure blog](https://www.commure.com/blog-scribe/simplepractice-ai-notes); [SimplePractice support, "Preparing to use Note Taker"](https://support.simplepractice.com/hc/en-us/articles/42030829462413-Preparing-to-use-Note-Taker)
- Tiene 4,6/5 en Capterra con 2.819 reseñas. Las quejas de 2025-2026 son sobre todo de precio (subidas y cobro por reclamación), soporte sin teléfono, libro de facturación con fallos y falta de roles no clínicos. Se valora como intuitivo para quien trabaja solo — [Capterra](https://capterra.com/p/130710/SimplePractice/reviews/); [ehrsource](https://ehrsource.com/articles/simplepractice-problems-2026/)

**Jane App (Canadá)**
- Tres planes para un profesional: Balance CAD 54/mes (según el agregador, con tope de unas 20 citas al mes, reserva básica y recordatorios por email), Practice CAD 79/mes (citas ilimitadas, reserva con marca propia, recordatorios por SMS) y Thrive CAD 99/mes (agenda de salas y equipos, **lista de espera** y **membresías**). Complementos: AI Scribe USD 15 por profesional al mes, telesalud grupal USD 15 y facturación a aseguradoras desde USD 20 — [costbench](https://costbench.com/software/mental-health-practice-management/jane-app/); [pabau](https://pabau.com/blog/jane-app-pricing/)
- El AI Scribe se declara conforme a HIPAA, PIPEDA y PHIPA y no usa datos para entrenar modelos. El consentimiento se pide con un formulario antes de cada uso, nunca se presume y aceptar una vez no cubre sesiones futuras. Un resumen menciona que las grabaciones se borran a los 7 días (**no está claro si se refiere a Jane; sin verificar**) — [Shift Collab sobre Jane AI Scribe](https://support.shiftcollab.com/what-is-the-ai-scribe-feature-in-jane-and-how-does-it-work); [Jane guide AI scribe](https://jane.app/guide/ai-scribe)
- No encontré documentación de funciones para profesionales que se desplazan (tiempo de viaje entre citas). Jane anuncia que todas sus funciones están disponibles desde el smartphone — [softwareconnect](https://softwareconnect.com/reviews/jane-app-clinic-management/)

**TheraPlatform**
- Planes: Basic USD 39/mes, Pro USD 69/mes (+USD 39 por proveedor adicional) y Pro Plus USD 79/mes (+USD 49). Todos incluyen clientes ilimitados, telesalud, documentación y facturación. Complementos: notas con IA USD 30/mes, SMS de recordatorio a USD 0,02 cada uno, reclamación electrónica a USD 0,25 y fax. Prueba de 30 días sin contrato. Datos de enero de 2026 — [softwarefinder](https://softwarefinder.com/theraplatform-software)

**Ensora Health (antes Therapy Brands; incluye Fusion Web Clinic y TheraNest)**
- "Therapy Brands is now Ensora Health" — [ensorahealth.com](https://ensorahealth.com/product/aba-suite)
- Ensora Rehab Therapy Suite (antes Fusion Web Clinic) es un EMR para PT, OT y fonoaudiología. Trae plantillas de fonoaudiología para **articulación, lenguaje, fluidez y alimentación**, flujos para evaluación y notas de progreso, seguimiento de objetivos, **gráficas visuales de progreso** y **grabación de audio para comunicarse con cuidadores**, y genera reportes automáticos — [Ensora Rehab Therapy Suite](https://www.ensorahealth.com/product/rehab-therapy-suite); [ASHA partner page](https://www.asha.org/about/marketing/partners/fusion-by-ensora-health/)
- Fusion tiene 4,3/5 en Capterra con 708 reseñas. Las quejas: no sincroniza con Google Calendar, cobra aparte cada cosa (por ejemplo los formularios de ingreso), no deja filtrar facturas pagadas o impagas, la interfaz es lenta y llena de pop-ups, y hay subidas de precio frecuentes — [Capterra Fusion](https://www.capterra.com/p/136876/Pediatric-Therapy-EMR/reviews/)
- TheraNest (hoy "Ensora Mental Health") tiene tres planes por terapeuta: Essentials USD 29/mes, Advanced USD 59 y Premier USD 89, con descuento anual. Antes cobraba por cliente activo. Datos de febrero de 2026 — [softwarefinder](https://softwarefinder.com/emr-software/theranest/pricing); [G2](https://g2.com/products/ensora-mental-health-formerly-theranest/pricing)

**Practice Better**
- Planes: Sprout gratis (3 clientes), Starter USD 35 (10 clientes), Professional USD 69 (300 clientes), Plus USD 99 (ilimitado) y Team USD 155. El pago anual descuenta un 20 %. SMS de recordatorio a USD 0,05, IA de telesalud a USD 0,60 por hora tras 600 minutos gratis. Subió todos los precios el 9-jul-2025 — [PricingSaaS](https://pricingsaas.com/companies/practicebetter); [Practice Better help center](https://help.practicebetter.io/hc/en-us/articles/41860197371291-Practice-Better-Pricing-Plans-and-Features-Comparison)

**SLP Toolkit (fonoaudiología escolar, EE. UU.)**
- USD 24/mes o USD 215/año. **Discrepancia**: otra fuente da USD 18/mes con pago anual — [SLP Toolkit pricing](https://slptoolkit.com/pricing)
- Funciones: perfiles de fortalezas y necesidades (present levels), informes de progreso con pruebas y rúbricas integradas, banco de objetivos medibles y **gráficas de datos para ver tendencias** — [SLP Toolkit features](https://slptoolkit.com/features)

**WebPT (referencia, sobre todo fisioterapia)**
- Tiene tres niveles (Starter, Enhanced, Ultimate), todos con precio solo por cotización. Starter ya trae EMR, ingreso digital, recordatorios automáticos, **programa de ejercicios en casa (HEP) con portal del paciente**, reserva online y reportes de pago — [toolradar](https://toolradar.com/tools/webpt/pricing)
- Un competidor (Physitrack, con sesgo evidente) describe el HEP de WebPT como un complemento secundario. Lo que distingue a un HEP dedicado: biblioteca de foto y video, planes con marca, acceso móvil, seguimiento de progreso y mensajería bidireccional — [Physitrack](https://www.physitrack.com/insights/webpt-reviews)

### Inferences
- Lo mínimo que esperan los usuarios (agenda, recordatorios, notas, cobros, portal) ya es commodity. Los diferenciadores en fonoaudiología son: datos por objetivo con nivel de apoyo, gráficas de progreso, plantillas por área y comunicación con el cuidador mediante audio o video. Estos son los mismos elementos que pide la app objetivo.
- Las quejas sobre "cobrar aparte cada función" y "subidas de precio" dan argumento a una alternativa open source y autoalojada para profesionales independientes de LatAm.
- Todos los proveedores convergen en ofrecer el escriba de IA como complemento con consentimiento por sesión. Es un patrón que vale la pena copiar en el flujo de consentimiento, aunque la transcripción se haga en el dispositivo.

### Gaps
- No pude abrir las páginas oficiales de precios (egress bloqueado), así que todos los precios vienen de agregadores. ClinicNote no apareció en las búsquedas: no se sabe si sigue como producto aparte dentro de Ensora.
- No encontré evidencia de que alguna de estas suites tenga planificación de rutas, buffers de viaje o check-in geolocalizado para fonoaudiólogos a domicilio.

---

## 2. Herramientas latinoamericanas e hispanohablantes (AgendaPro, Doctoralia, Medilink, Nubimed, Clinic Cloud, VirtuaClinic, Evolua) y software específico de fonoaudiología

### Takeaway
En LatAm dominan las herramientas **genéricas** de salud o bienestar. AgendaPro es la más relevante: confirmación doble por WhatsApp, ficha clínica personalizable y certificación CENS en Chile. Doctoralia funciona como marketplace con agenda y recordatorios por SMS. No encontré software colombiano específico de fonoaudiología. El ejemplo más cercano a la visión del proyecto es **Evolua** (Brasil), un CRM para fonoaudiólogas que convierte audios de WhatsApp en informes para los padres.

### Cited Findings
- **AgendaPro**: envía recordatorios por WhatsApp, SMS o email 1, 2 o 3 días antes. Tiene **doble confirmación**: si el paciente no confirma, sale un segundo mensaje automático para que confirme o cancele. Ficha clínica personalizable y cifrada con adjuntos, agenda 24/7. Dice tener más de 135.000 profesionales (dato del proveedor) — [AgendaPro blog](https://agendapro.com/blog/mejores-software-para-terapeutas/); [AgendaPro kinesiólogos CO](https://agendapro.com/co/kinesiologos/software-para-kinesiologos)
- AgendaPro está certificado por **CENS** (estándar de calidad de sistemas de salud digital del Minsal de Chile) y está integrado con FONASA. Afirma que más de 20.000 negocios en LatAm lo usan — [AgendaPro ficha clínica](https://agendapro.com/blog/ficha-clinica-de-agendapro/)
- AgendaPro Colombia vende los planes Individual, Básico, Premium y Pro. El Individual incluye sitio de reservas, citas online ilimitadas, presencia en marketplace, email marketing y reportes. **No pude obtener los precios en COP de 2026** — [AgendaPro planes CO](https://agendapro.com/co/planes)
- **Doctoralia** llegó a Colombia en 2019 y tiene oferta en 50 municipios. Ofrece agenda en la nube, citas presenciales u online, telemedicina y **recordatorios automáticos por SMS** — [Portafolio](https://www.portafolio.co/negocios/emprendimiento/doctoralia-llego-a-colombia-para-duplicar-su-oferta-527206). **No encontré el precio de sus planes profesionales en Colombia para 2026.**
- Los listados de Doctoralia Colombia muestran precios de mercado: visita domiciliaria de fonoaudiología desde ~COP 72.000 hasta ~COP 150.000 y terapia de lenguaje particular entre ~COP 60.000 y 120.000 por sesión, sobre todo en Bogotá y la Sabana (según resumen del buscador; sin verificar caso por caso) — [Doctoralia visita domiciliaria Chía](https://www.doctoralia.co/tratamientos-servicios/visita-domiciliaria-fonoaudiologia/chia); [Doctoralia visita fonoaudiología Zipaquirá](https://www.doctoralia.co/tratamientos-servicios/visita-fonoaudiologia/zipaquira)
- **Medilink** (Chile/LatAm) está orientado a clínicas: ficha digital, agenda online, telemedicina, pagos online, boletas electrónicas, inventario y analítica. Entre sus segmentos incluye rehabilitación y kinesiología — [Capterra Medilink](https://www.capterra.com/p/129543/Medilink/). Precio en Colombia no encontrado.
- **Nubimed** (España) ofrece historia clínica personalizable, agenda por profesional y sala, y firma electrónica avanzada — [TrustRadius](https://www.trustradius.com/products/nubimed/details). **Clinic Cloud** (España) es multiespecialidad: agenda, finanzas e historia clínica — [Capterra ES](https://www.capterra.es/software/207032/clinic-cloud)
- **VirtuaClinic** (Chile) apunta a profesionales independientes y clínicas pequeñas: pacientes, consultas, historia clínica y agenda, cumpliendo la normativa chilena sobre datos sensibles — [comparasoftware](https://www.comparasoftware.com/virtuaclinic)
- **Evolua** (Brasil) es un "CRM para fonos" con gestión de pacientes, finanzas, comunicación con responsables e informes estructurados. Su diferenciador: la fonoaudióloga graba un audio por WhatsApp o micrófono y el sistema lo convierte en un **informe estructurado que se envía a los padres** por email o WhatsApp. Incluye confirmación automática de citas y envío de actividades por WhatsApp. Stack: Next.js, Node, Supabase, AWS y un pipeline de transcripción. Es un pitch del propio autor, no verificado — [TabNews](https://www.tabnews.com.br/matfalvesdev/pitch-criei-um-saas-para-fonos-e-olha-no-que-deu)
- En Colombia hay incluso entidades públicas, como el IMSALUD de Cúcuta, que usan flujos de recordatorio y confirmación por WhatsApp. Un problema reportado: **cancelaciones automáticas a usuarios que no respondían** el mensaje (lección aprendida, según resumen del buscador) — [IMSALUD Lecciones aprendidas TIC, dic-2025](https://www.imsalud.gov.co/web/wp-content/uploads/2025/12/LECCIONES-APRENDIDAS-TICS.pdf)

### Inferences
- El nicho "fonoaudióloga independiente, a domicilio, Colombia" no tiene una herramienta dedicada. Hoy lo cubren AgendaPro o Doctoralia para la agenda más papel, Word o WhatsApp para lo clínico.
- La "doble confirmación" de AgendaPro y la lección del IMSALUD llevan a una regla de diseño: **no cancelar automáticamente por falta de respuesta**. Conviene escalar (segundo mensaje y luego aviso a la terapeuta para que llame) en vez de liberar el cupo en silencio.
- El patrón de Evolua (audio de la terapeuta, luego informe estructurado, luego WhatsApp al cuidador) es exactamente la clase de función de IA que valoran las fonoaudiólogas. Se puede replicar con transcripción en el dispositivo (ver sección 10).

### Gaps
- No hallé software colombiano específico de fonoaudiología ni formatos oficiales del Colegio Colombiano de Fonoaudiólogos o de ASOFONO. Tampoco encontré información de **Reservo**.
- No obtuve los precios en COP de AgendaPro, Doctoralia ni Medilink para 2026. No hay reseñas en español de quejas de usuarios fonoaudiólogos.

---

## 3. Documentación clínica en fonoaudiología: tipos de documento, objetivos, recolección de datos, instrumentos en español

### Takeaway
La documentación se organiza en **evaluación, plan de tratamiento con objetivos funcionales de largo y corto plazo, notas de sesión (SOAP), informes de progreso y resumen de alta** (ASHA). El dato clínico mínimo útil es el **% de acierto por objetivo o estímulo emparejado con el nivel de apoyo** (independiente, mínimo, moderado, máximo), complementado con escalas validadas por área: FOIS, EAT-10 (y Pedi-EAT-10) y MECV-V en disfagia, VHI-10 en voz, y TEPROSIF-R, PLON-R, ELCE o CELF-5 en lenguaje infantil. Los objetivos SMART se pueden ordenar con la CIF (función/estructura → actividad/participación) y medir con Goal Attainment Scaling (-2 a +2).

### Cited Findings
**Tipos de documento (ASHA)**
- En consulta externa los documentos básicos son: informe de evaluación, plan de tratamiento o plan de cuidado con certificación, notas de progreso y resumen de alta — [ASHA Module Three](https://www.asha.org/Practice/reimbursement/Module-Three/)
- Lo esencial del plan de tratamiento: datos de identificación, diagnóstico(s), **objetivos de largo plazo en términos funcionales**, **objetivos de corto plazo en términos funcionales**, tipo y cantidad de servicio, y firma, fecha e identidad profesional de quien lo establece — [ASHA Module Three](https://www.asha.org/Practice/reimbursement/Module-Three/)
- El resumen de alta recoge todo el servicio: progreso logrado, resultados de las pruebas finales y recomendaciones — [ASHA Module Three](https://www.asha.org/Practice/reimbursement/Module-Three/)

**Recolección de datos por ensayo y niveles de apoyo**
- Jerarquía estándar de apoyo: **Independiente** (sin claves), **Mínimo** (1–2 claves), **Moderado** (2–3 claves) y **Máximo** (3 o más). La definición puede variar entre terapeutas, pero debe ser consistente para cada paciente — [Speechy Musings, cheat sheet](https://speechymusings.com/speech-language-therapy-data-collection-cheat-sheet/)
- "Un porcentaje sin nivel de apoyo no es un dato": 75 % con apoyo máximo y 75 % independiente describen cuadros clínicos distintos, así que cada % debe ir con su nivel de apoyo — [Speechy Musings](https://speechymusings.com/speech-language-therapy-data-collection-cheat-sheet/) (fuente de blog profesional, no académica)
- Las apps de datos para fonoaudiología registran número de ensayos, nivel de prompting, conteo de aciertos y errores **por target**, tendencias de % de acierto, % de disfluencias (%SLD) y LME/MLU en el tiempo, y exportan un resumen para la nota — [AbleSpace blog](https://www.ablespace.io/blog/how-to-track-speech-therapy-data-free-sheets-examples-and-digital-tools/)

**Objetivos: SMART, CIF y GAS**
- La Revista Chilena de Fonoaudiología propone organizar contenidos terapéuticos con criterios de jerarquía, formular objetivos en formato **SMART** y usar actividades de generalización o transferencia como puente entre el nivel "Función/Estructura" y el de "Actividad/Participación" de la CIF — [Rev. Chil. Fonoaudiología](https://cyberhumanitatis.uchile.cl/index.php/RCDF/article/download/58315/68438/235012)
- Hay una propuesta teórica de planificación de terapia vocal basada en la CIF — [Revistas Chilenas UChile](https://revistaschilenas.uchile.cl/handle/2250/170325?show=full). En afasia, la CIF se propone como guía para orientar la terapia hacia la participación y el regreso a la vida productiva — [Redalyc](https://www.redalyc.org/pdf/562/56242524014.pdf)
- **Goal Attainment Scaling (GAS)** es una medida individualizada con escala de 5 puntos: +2 (mucho mejor de lo esperado), 0 (resultado esperado en el plazo fijado) y -2 (mucho peor de lo esperado). Se usa en terapia pediátrica, incluida fonoaudiología — [GAS manual, Rehab Care Ontario](https://mississaugahalton.rehabcareontario.ca/uploads/contentdocuments/gasmanual_.pdf)

**Instrumentos en español por área**
- *Fonología infantil*: **TEPROSIF-R** (Chile) identifica procesos de simplificación fonológica entre 3 y 6 años. Trae manual, láminas, dos formatos de registro y normas por edad — [Rev. Chil. Fonoaudiología](https://cyberhumanitatis.uchile.cl/index.php/RCDF/article/download/59250/68682/236217)
- *Lenguaje infantil*: **PLON-R** (3–6 años) evalúa fonología, morfosintaxis, contenido y uso — [Logopedicum](https://logopedicum.com/producto/plon-r-prueba-de-lenguaje-oral-navarra-revisada). **ELCE** cubre comprensión y expresión entre 2;6 y 9 años — [Elsevier Rev. Logopedia](https://www.elsevier.es/es-revista-revista-logopedia-foniatria-audiologia-309-articulo-elce-evaluacion-del-lenguaje-comprensivo-S0214460397756687). **CELF-5** en español cubre de 5 a 15;11 años — [COP CELF-5](https://www3.cop.es/uploads/PDF/2019/CELF-5.pdf)
- En el Atlántico (Colombia) falta una prueba tamiz de lenguaje para 2–3 años, y los fonoaudiólogos recurren a menudo a **evaluaciones no formales** — [Rev. Colombiana de Rehabilitación](https://revistas.ecr.edu.co/index.php/RCR/article/download/48/53)
- *Disfagia*: el **EAT-10** tiene versión española (Burgos et al., 2012, *Nutrición Hospitalaria*, validada en 65 pacientes) — [cita en validación polaca, PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12029939/). El **Pedi-EAT-10** español tiene α de Cronbach 0,87 y se aplica en ~2 minutos — [Anales de Pediatría](https://www.analesdepediatria.org/en-translation-validation-spanish-version-pedi-eat-10-articulo-S2341287923000662). El **MECV-V** (Clavé) usa bolos de 5, 10 y 20 ml en tres viscosidades (néctar, líquido, pudding) y observa signos de seguridad y eficacia — [Nestlé Health Science, MECV-V](https://www.clickcumple.nestlehealthscience.es/sites/default/files/2024-04/Evaluacio%CC%81n%20MECV-V.pdf). La **FOIS** tiene buena concordancia interobservador (0,78) en su versión portuguesa — [tesis U. Aveiro](https://ria.ua.pt/bitstream/10773/9728/1/tese_sonia%20moreira.pdf)
- *Voz*: VHI-30 y **VHI-10** tienen versiones españolas válidas y fiables — [Neurología (Elsevier)](https://www.elsevier.es/es-revista-neurologia-english-edition--495-articulo-adaptation-validation-spanish-voice-handicap-S2173573507703769)

**Marco legal colombiano de la historia clínica (afecta al modelo de datos)**
- La Ley 376 de 1997 reglamenta la fonoaudiología como profesión autónoma — [Función Pública](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=66195)
- La historia clínica se rige por la Res. 1995/1999, modificada por la **Res. 839/2017** (custodia, retención y disposición final); la **Ley 2015/2020** crea la Historia Clínica Electrónica Interoperable (IHCE); la **Res. 866/2021** define los elementos de datos para interoperabilidad; y la **Res. 1888/2025** adopta el Resumen Digital de Atención (RDA) — [Minsalud, memoria justificativa proyecto HC, 22-jul-2026](https://www.minsalud.gov.co/Normativa/anexosproyectos/ANEXO2MEMJUSTIFICATIVAHISTORIA%20CLINICA%2022%20JUL%2026_20260722151201.pdf); [Res. 839/2017](https://www.saludcapital.gov.co/DDS/Documentos_I/Res_839_2017.pdf)
- **Minsalud publicó el 22-jul-2026 un proyecto de resolución** que unifica y actualiza el régimen de historia clínica. Busca reemplazar la base de 1999 e integrar la Ley 1581/2012, la IHCE y el RDA. A la fecha de esta nota es un **proyecto, no una norma vigente** — [Proyecto de resolución HC](https://minsalud.gov.co/Normativa/proyactadm/PR%20HISTORIA%20CLINICAAJUSTADO22072026_20260722151143.pdf)

### Inferences
- **Modelo de datos clínico recomendado** (inferencia de diseño a partir de lo anterior):
  - `Patient` (persona atendida) ↔ `Caregiver`/`Acudiente` (N:M, con parentesco, WhatsApp, rol de decisor o pagador, consentimientos propios).
  - `CareEpisode` (episodio de atención): motivo de consulta, remitente (pediatra, neurólogo, colegio), pagador (particular, EPS, prepagada), diagnóstico(s) CIE-10/CIE-11, población (`pediatric_language`, `ssd`, `dysphagia`, `aphasia`, `voice`, `fluency`), fechas de inicio y alta.
  - `Assessment` → `AssessmentResult`: instrumento (catálogo con `name`, `version`, `domain`, `age_range`, `score_type`: bruto, estándar, percentil, nivel ordinal), puntaje e interpretación. El catálogo semilla puede incluir TEPROSIF-R, PLON-R, ELCE, CELF-5, EAT-10, Pedi-EAT-10, FOIS, MECV-V, VHI-10 y GRBAS, más "evaluación informal" con texto libre, porque en Colombia se usa mucho.
  - `TreatmentPlan` (frecuencia, duración, modalidad domiciliaria) → `LongTermGoal` (texto SMART, dominio CIF `body_function|activity|participation`, fecha meta, escala GAS -2..+2 opcional) → `ShortTermGoal` (criterio de dominio, p. ej. "80 % en 3 sesiones consecutivas con apoyo mínimo") → `Target` (p. ej. "/s/ inicial en palabras", "deglución de néctar 10 ml").
  - `Visit` (cita o visita): estado (`scheduled`, `confirmed`, `attended`, `late_cancel`, `no_show`, `cancelled_by_therapist`), check-in y check-out con hora y geolocalización, duración real.
  - `SessionNote` (SOAP: S, O, A, P) ligada a `Visit`.
  - `TrialData`: `target_id`, `trials`, `correct`, `cue_level` (`independent|min|mod|max`), `context` (sílaba, palabra, frase, conversación) y opcionalmente `trial_sequence` (+/−) para registro ensayo a ensayo.
  - `ScaleObservation`: observación tipada (p. ej. FOIS=5) para medidas que no son %. Es parecido a FHIR `Observation`, lo que facilita mapear a la IHCE (Res. 866/2021) más adelante.
  - `HomeProgram` → `HomeTask` (instrucción, video o audio modelo, frecuencia prescrita) → `HomePracticeLog` (fecha, hecho o no, minutos, fuente `whatsapp|app`, dificultad percibida).
  - `Report` (tipo `evaluation|progress|discharge|school|pediatrician|eps`; PDF firmado inmutable con hash y versión).
  - `Consent` (tratamiento de datos según Ley 1581, autorización del representante legal de menores, grabación de audio, uso de IA, opt-in de WhatsApp).
  - Lo administrativo va en la sección 7.
- Las notas SOAP deben **generarse en buena parte a partir de los datos estructurados** (TrialData más observaciones). Así se evita escribir dos veces y la sección "O" queda alimentada sola.
- Conviene que el catálogo de instrumentos y la jerarquía de apoyos sean **configurables por paciente**, porque la definición de los niveles varía entre terapeutas.
- El proyecto de resolución de julio de 2026 y la IHCE hacen recomendable un **almacenamiento con auditoría** (append-only o versionado de notas firmadas), firma con identidad profesional y exportación estructurada.

### Gaps
- No pude confirmar el plazo exacto de retención de la Res. 839/2017 (comúnmente citado como 15 años desde la última atención; **sin verificar en esta sesión**) ni qué cambia el proyecto de 2026.
- No verifiqué versiones en español ni el uso en Colombia de PEFF (Susanibar), Test de Boston o Barcelona para afasia, ni GRBAS. No hallé una guía colombiana oficial con la estructura de la historia clínica fonoaudiológica.
- No encontré evidencia formal (estudios) sobre cuánto tiempo ahorra la recolección digital de datos por ensayo frente al papel.

---

## 4. Necesidades específicas de la atención domiciliaria (rutas, buffers, check-in geolocalizado, modo offline, políticas de cancelación, paquetes, lista de espera, franjas recurrentes)

### Takeaway
Los patrones de domicilio ya existen en el software de *home care* y *home health* de EE. UU., que en parte los adoptó por la verificación electrónica de visitas (EVV) que exige la ley de ese país: **check-in y check-out con GPS o geocerca, notas offline, kilometraje y optimización de rutas**. Las suites de terapia ambulatoria no los traen. Las funciones de negocio (paquetes o membresías, lista de espera, recurrencia) sí aparecen en Jane (plan Thrive) y en las herramientas de LatAm.

### Cited Findings
- La 21st Century Cures Act de EE. UU. obligó a usar EVV en servicios de cuidado personal de Medicaid (2020) y en *home health* (2023). Cada visita registra seis datos: tipo de servicio, persona atendida, fecha, **ubicación**, persona que presta el servicio y **hora de inicio y fin** — [RaftLabs EVV](https://www.raftlabs.com/industries/senior-care/evv-software)
- AlayaCare ofrece **optimización de visitas y rutas con IA** para reducir el kilometraje, check-in y check-out restringidos por **geocerca y GPS**, notas de cuidado, firma electrónica de la visita, registro de **kilometraje y gastos**, y funciona **offline** — [AlayaCare](https://alayacare.com/?p=5138)
- Jane, en su plan Thrive, incluye **lista de espera** y **membresías** — [costbench Jane](https://costbench.com/software/mental-health-practice-management/jane-app/)
- La práctica profesional sugiere que el problema central del domicilio es la variabilidad en asistencia: el 67 % de fonoaudiólogos diría que la asistencia irregular es la mayor barrera al progreso (**fuente de baja calidad**: agregador de estadísticas sin metodología visible) — [schedulingkit stats](https://schedulingkit.com/statistics/speech-therapy-statistics)

### Inferences
- En Colombia no hay un mandato tipo EVV para particulares. Aun así, el **check-in y check-out geolocalizado** tiene valor como prueba de atención frente a EPS, prepagadas o disputas de cobro, y para medir la duración real. Debe ser **opcional y transparente** con la familia, porque la ubicación del domicilio de un menor es un dato sensible.
- Funciones de domicilio a priorizar:
  1. **Buffers de traslado** calculados entre direcciones (tiempo estimado más un margen fijo) al ofrecer cupos por WhatsApp.
  2. **Agrupación por zonas o barrios** (por ejemplo, días por zona) antes que optimización completa de rutas (TSP).
  3. **Notas de acceso** por dirección: portería, parqueadero, mascotas, piso, persona que recibe.
  4. **Modo offline** con cola de sincronización para registrar datos de sesión sin señal.
  5. **Temporizador de sesión** ligado al check-in.
  6. **Franjas semanales recurrentes** con excepciones (festivos colombianos).
  7. **Paquetes o bonos prepagados** con saldo de sesiones.
  8. **Lista de espera** con zona y franjas preferidas, para ofrecer automáticamente los cupos liberados.
  9. **Política de cancelación** configurable (ventana de horas y si consume sesión del paquete).
- Optimizar la ruta de forma real (vehículo, tráfico) es una función "posterior". Con 4–8 visitas al día, ordenar por zona y mostrar el mapa del día probablemente basta.

### Gaps
- No encontré estudios sobre necesidades de fonoaudiólogos a domicilio en LatAm, ni funciones de "travel time" documentadas en Jane o SimplePractice.
- No hay datos sobre la conectividad móvil en las zonas de atención de la usuaria; la necesidad de modo offline queda **inferida**.

---

## 5. Participación del cuidador y práctica en casa: evidencia y funcionalidades

### Takeaway
La evidencia es sólida en pediatría. La intervención aplicada por padres o cuidadores **mejora el lenguaje frente a no intervenir** (evidencia de alta calidad) y, en trastornos de los sonidos del habla, **no es inferior** a la terapia que da solo el fonoaudiólogo (evidencia moderada). También funciona en familias hispanohablantes. La práctica en casa permite llegar a las dosis recomendadas (por ejemplo 3 veces por semana) cuando la terapeuta va una vez por semana. En adultos, la práctica autogestionada en casa mejora objetivos específicos (encontrar palabras en afasia) y en disfagia oncológica la adherencia se asocia a mejores resultados, aunque suele ser baja.

### Cited Findings
- **Lawler, Taylor y Shields (2013, Arch Phys Med Rehabil)**: revisión de 29 ensayos con 1.196 participantes, 19 de ellos de fonoaudiología. Hay **evidencia de alta calidad** de que la terapia de lenguaje administrada por cuidadores mejora el lenguaje infantil frente a no intervenir, y **evidencia moderada** de que la terapia del fonoaudiólogo **no es superior** a la del cuidador en niños con alteraciones del habla — [PEDro](https://search.pedro.org.au/search-results/record-detail/34147); [UTAS figshare](https://figshare.utas.edu.au/articles/journal_contribution/Outcomes_after_caregiver-provided_speech_and_language_or_other_allied_health_therapy_A_systematic_review/22979723)
- **Roberts y Kaiser (2011, meta-análisis)**: 18 estudios con niños de 18 a 60 meses con trastornos del lenguaje. Frente a control o tratamiento habitual, g = 0,35–0,81 (6 de 7 efectos significativos). Frente a terapia aplicada por el terapeuta, g = −0,15 a 0,42 (solo 2 significativos). Hubo efectos positivos en lenguaje receptivo y expresivo — [Northwestern EI](https://ei.northwestern.edu/?p=836)
- **Heidlage et al. (2019)**: meta-análisis de intervenciones aplicadas por padres. Encontró efectos positivos en comunicación social y lenguaje, sobre todo expresivo, en niños en riesgo o con trastorno. Los detalles cuantitativos no se pudieron leer — [Heidlage et al. 2019 PDF](https://ei.northwestern.edu/files/2023/04/Heidlage-et-al-2019-The-effects-of-parent-implemented-interventions.pdf)
- **AJSLP 2026**: revisión de 8 intervenciones tempranas de lenguaje aplicadas por cuidadores en niños latinos de 18 a 47 meses de familias hispanohablantes con retraso del lenguaje. **Todas** mostraron mejoras en lenguaje receptivo, expresivo o ambos — [AJSLP 2026](https://pubs.asha.org/doi/epdf/10.1044/2026_AJSLP-25-00400)
- **Dosis en trastorno de los sonidos del habla (TSH)**: los resultados óptimos en TSH fonológico se logran con alta frecuencia (unas 3 veces por semana). Combinar sesiones del fonoaudiólogo y de los padres (1 sesión clínica semanal más 2 sesiones en casa durante 9 semanas, en niños de 3 a 6 años) permitió alcanzar esa dosis. Los resultados dependieron de la dosis, la fidelidad y el tipo de TSH — [Sugden et al. 2018, Strathprints](https://strathprints.strath.ac.uk/64411)
- En una encuesta a 288 fonoaudiólogos australianos, el **96,4 %** involucra a los padres, sobre todo con práctica en casa, recomendada en promedio **5 veces por semana durante 10 minutos** — [SCU research portal](https://researchportal.scu.edu.au/esploro/outputs/journalArticle/An-Australian-survey-of-parent-involvement/991013169710502368)
- Un estudio cualitativo con 6 padres (Sugden et al. 2019) identificó cuatro temas sobre la práctica en casa: evolución en el tiempo, roles distintos, importancia y **gestión de lo práctico**. Concluye que hay que colaborar con las familias — [Strathprints](https://strathprints.strath.ac.uk/64851)
- **Afasia, Big CACTUS (Palmer et al., Lancet Neurol 2019;18:821-33)**: ensayo con 278 adultos. Seis meses de práctica diaria autogestionada en casa con software de búsqueda de palabras, más atención habitual, **mejoraron la búsqueda de palabras entrenadas**, pero no la conversación ni la calidad de vida. El costo principal fue el tiempo del terapeuta en configurar y dar soporte — [NIHR Evidence](https://evidence.nihr.ac.uk/alert/computerised-speech-and-language-therapy-can-help-people-with-aphasia-find-words-following-a-stroke)
- **Disfagia tras cáncer de cabeza y cuello**: la baja adherencia a los ejercicios deglutorios es frecuente. Govender et al. (2017) codificaron técnicas de cambio de conducta para mejorarla — [BMC Cancer](https://bmccancer.biomedcentral.com/articles/10.1186/s12885-016-2990-x). Una revisión de 2024 halló **dos estudios con asociación positiva entre adherencia y mejores resultados deglutorios**. Facilitadores: citas regulares, información individualizada y clara, y apoyo social — [ASHA Evidence Maps](https://apps.asha.org/EvidenceMaps/Articles/ArticleSummary/4b2b32e8-7c40-ef11-8151-005056834e2b)
- En Ensora, la grabación de audio se usa como herramienta para comunicarse con los cuidadores — [Ensora](https://www.ensorahealth.com/product/rehab-therapy-suite). En HEP dedicados, el estándar incluye video, acceso móvil, seguimiento del progreso y mensajería bidireccional — [Physitrack](https://www.physitrack.com/insights/webpt-reviews)

### Inferences
- Lo que pide la evidencia: (a) **tareas en casa cortas y frecuentes** (~10 minutos, ~5 días por semana) con **video o audio modelo** grabado por la terapeuta en la sesión; (b) **registro de práctica de mínima fricción** por WhatsApp (botones "Hecho / No pudimos / Difícil", o un emoji o audio corto); (c) **retroalimentación visible**: racha semanal y progreso del objetivo en lenguaje llano; (d) ajuste en la siguiente sesión según la adherencia registrada.
- La adherencia en casa debe ser un **dato de primera clase**, cruzable en el dashboard con la curva de progreso (por ejemplo, % de días practicados frente a pendiente de mejora). En TSH y disfagia esa relación es plausible y está respaldada por evidencia.
- En adultos (afasia, disfagia, voz) el "cuidador" puede ser el propio paciente o un familiar. El modelo debe permitir que el responsable de la práctica sea el paciente.

### Gaps
- No encontré datos cuantitativos sobre **qué porcentaje de las tareas asignadas completan realmente los padres**, ni ensayos que comparen registro de práctica por WhatsApp contra app o papel.
- No hallé evidencia específica de que el video modelo mejore la fidelidad de los padres frente a instrucciones escritas. Es una inferencia razonable, pero no está verificada aquí.

---

## 6. Evidencia sobre recordatorios (SMS/WhatsApp) y reducción de inasistencias

### Takeaway
Los recordatorios por mensaje de texto suben la asistencia de forma modesta pero consistente. Cochrane (2013) reporta RR 1,14, con asistencia de 67,8 % sin recordatorio frente a 78,6 % con él, un efecto parecido al de la llamada telefónica. Una revisión sistemática estima que la inasistencia baja a cerca de un tercio de la basal. Mandar **dos recordatorios** en vez de uno reduce un poco más las inasistencias. Buena parte del valor está en **facilitar la cancelación anticipada** para reasignar el cupo. En LatAm hay evidencia en Brasil (SMS) y un estudio de 2026 en Buenos Aires (WhatsApp, 72 h y 24 h) con resultados aún no verificados. Las cifras "WhatsApp reduce 30–50 %" vienen de marketing.

### Cited Findings
- **Cochrane, Gurol-Urganci et al. (2013)**: 7 estudios con 5.841 participantes. Los SMS frente a ningún recordatorio dan **RR 1,14 (IC95 % 1,03–1,26)**, con certeza moderada. Asistencia: **67,8 % sin recordatorio, 78,6 % con SMS y 80,3 % con llamada**. SMS frente a llamada da RR 0,99 (0,95–1,02), es decir, efecto similar. SMS más carta frente a solo carta da RR 1,10 (1,02–1,19), con certeza baja — [Cochrane CD007458](https://www.cochrane.org/evidence/CD007458_mobile-phone-messaging-reminders-attendance-healthcare-appointments)
- **Hasvold y Wootton (2011, revisión sistemática)**: la inasistencia bajó en promedio a un **34 % de la tasa basal**. Los recordatorios automáticos rindieron menos que los manuales (29 % frente a 39 %). No hubo diferencia entre enviar el recordatorio el día anterior o la semana anterior. Costo promedio de unos €0,41 por recordatorio. Se sugiere que el valor principal del SMS está en ser una vía cómoda para **cancelar** y así reofertar el cupo — [PMC3188816](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3188816/)
- Un meta-análisis más reciente sobre asistencia hospitalaria encontró SMS con RR 1,14 (0,99–1,31, 4 estudios, n=4.636; **no significativo**) y llamada telefónica con RR 1,11 (1,04–1,19, 5 estudios) — [JHMHP](https://jhmhp.amegroups.org/article/view/10215/html)
- **Kaiser Permanente Washington** (aleatorizado, mejora de calidad): se aleatorizaron 125.076 visitas de atención primaria y 33.593 de salud mental a recibir 1 SMS (2 días hábiles antes) o 2 SMS (3 y 2 días antes). En atención primaria, el segundo SMS redujo la probabilidad de inasistencia un **7 %** y las cancelaciones del mismo día un **6 %** — [PubMed 35609163](https://www.pubmed.ncbi.nlm.nih.gov/35609163/)
- **Brasil**: en 4 ambulatorios de São Paulo los recordatorios por SMS redujeron la inasistencia entre 0,82 y 14,49 puntos — [PMC4659257](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4659257/). Otro estudio brasileño reporta reducciones del ausentismo del **20,5 %** en el primer año y **23,0 %** en el segundo (abstract de congreso) — [Diabetology & Metabolic Syndrome 7(S1):A258](https://0-dmsjournal-biomedcentral-com.brum.beds.ac.uk/counter/pdf/10.1186/1758-5996-7-S1-A258.pdf)
- **Buenos Aires (IECS; preprint de agosto de 2026)**: emulación de ensayo objetivo con datos de jun-2023 a may-2024 del sistema público de CABA. Compara 4 estrategias por **WhatsApp**: dos recordatorios (~72 h y ~24 h), uno a ~72 h, uno a ~24 h y ninguno. Resultados medidos: inasistencia, cancelaciones iniciadas por el paciente (incluidas las de menos de 12 h) y reagendamiento. **No pude leer los resultados numéricos** — [IECS](https://iecs.org.ar/en/portfolio/evaluacion-del-impacto-de-una-estrategia-de-recordatorios-sobre-el-ausentismo-a-citas-de-atencion-ambulatoria-en-ciudad-de-buenos-aires/); [Sciety/medRxiv 10.64898/2026.08.17.26360609](https://sciety.org/articles/activity/10.64898/2026.08.17.26360609)
- **Pediatría ambulatoria**: inasistencia del 9 % en primeras citas y 15 % en controles. Predictores: tipo de proveedor, tipo de cita, horario vespertino, esperas de más de 60 días y faltas previas — [Nemours](https://nemours.elsevierpure.com/en/publications/determinants-of-appointment-absenteeism-at-an-outpatient-pediatri/). En fonoaudiología pediátrica, las **cancelaciones y faltas previas predicen faltas futuras** — [AJSLP 2022](https://pubs.asha.org/doi/10.1044/2022_AJSLP-22-00113)
- Cifras de marketing **no verificadas**: "WhatsApp reduce la inasistencia 30–50 %", "más de 90 % de apertura" y "15–30 % de inasistencia en consultorios de México, Colombia y Perú" — [Aurora Inbox](https://www.aurorainbox.com/2026/03/08/configurar-recordatorios-citas-whatsapp/); [AgendaPro blog](https://agendapro.com/blog/confirmaciones-automaticas-por-whatsapp/). La "tasa media de no-show de 19 % en terapia del lenguaje" también viene de un agregador sin metodología — [schedulingkit](https://schedulingkit.com/statistics/speech-therapy-statistics)
- Diseño bidireccional ("responde C para confirmar, R para reprogramar") es una práctica recomendada por proveedores. La cifra de "8–12 % adicional" frente a recordatorios unidireccionales es de marketing y no está verificada — [Curogram](https://curogram.com/blog/best-practices/patient-communication/reduce-patient-no-shows-text-messaging)

### Inferences
- Flujo recomendado:
  1. Recordatorio por WhatsApp a ~72 h y otro a ~24 h, con plantillas *utility* (ver costos en la sección 7).
  2. Botones **Confirmar / Reprogramar / Cancelar**.
  3. Si no hay respuesta, segundo mensaje y luego **alerta a la terapeuta**, sin cancelación automática (lección del IMSALUD).
  4. La cancelación libera el cupo y lo ofrece a la **lista de espera** de la misma zona.
- Hay que registrar el **historial de asistencia** por paciente (asistió, canceló tarde, no asistió), porque predice las faltas futuras. Con él se pueden marcar pacientes de riesgo para pedirles una confirmación más temprana o aplicar la política de paquete o prepago.
- Esperar un efecto modesto (unos 10 puntos de asistencia) y medirlo dentro de la propia app (inasistencia antes y después) es más honesto que prometer "−50 %".

### Gaps
- No encontré estudios **colombianos** con resultados cuantitativos de recordatorios por WhatsApp, ni estudios específicos de **terapia a domicilio** (donde la falta implica un traslado perdido).
- No hay evidencia revisada sobre depósitos o prepago como medida contra la inasistencia en fonoaudiología.

---

## 7. Pagos y administración en Colombia 2026 (Bre-B, Nequi, Daviplata, Wompi, Bold, facturación electrónica y RIPS, WhatsApp API)

### Takeaway
**Bre-B**, el sistema de pagos inmediatos del Banco de la República que opera desde 2025, se volvió masivo: 34 millones de usuarios y más de 670 millones de transacciones en sus primeros seis meses. Permite cobrar con una **llave** (celular, cédula, correo o alfanumérica) sin pasarela y en principio sin costo. Wompi y Bold sirven para links de pago con tarjeta, PSE o Nequi, con comisiones de ~1,5–3 % más un fijo. Para el profesional independiente de salud rige la factura electrónica, y cuando hay pagador del sistema de salud se exige el **RIPS en JSON** como soporte (Res. 2275/2023). El modelo administrativo debe contemplar conciliación de pagos por paciente o paquete y no solo "registrar cobros".

### Cited Findings
- **Bre-B**: pagos inmediatos e interoperables 24/7 entre entidades distintas mediante **llaves**: cédula, correo, celular o llave alfanumérica — [Blu Radio](https://www.bluradio.com/economia/banco-de-la-republica-confirma-la-llegada-de-nuevo-sistema-de-pago-todos-los-colombianos-lo-usaran-so35); [Noticias Caracol](https://www.noticiascaracol.com/economia/una-misma-llave-de-bre-b-puede-usarse-para-dos-cuentas-distintas-como-nequi-o-bancolombia-ex40). El registro de llaves arrancó a mediados de 2025 y la operación general en septiembre de 2025 — [Portafolio](https://www.portafolio.co/economia/bre-b-esta-es-la-fecha-oficial-en-que-comienzan-los-pagos-inmediatos-634750). Nequi y Daviplata están integrados — [Noticias RCN](https://www.noticiasrcn.com/economia/bre-b-se-integrara-a-nequi-y-daviplata-para-el-2025-784579)
- Cifras de los primeros seis meses (abril de 2026): **más de 34 millones de usuarios**, **más de 670 millones de transacciones** y **más de COP 105 billones** movidos, con predominio de micropagos — [Forbes Colombia](https://forbes.co/2026/04/13/economia-y-finanzas/bre-b-supero-670-millones-de-transacciones-y-105-billones-en-sus-primeros-seis-meses/); [Portafolio](https://www.portafolio.co/tecnologia/tras-seis-meses-de-operacion-bre-b-acumula-mas-de-34-millones-de-usuarios-registrados-491906); [Valora Analitik](https://www.valoraanalitik.com/colombianos-han-movido-mas-de-100-billones-por-bre-b-en-sus-primeros-seis-meses-micropagos-lideran/)
- Bre-B unifica los **QR interoperables** para comercios. Según el resumen del buscador, las personas naturales podrían generar sus propios QR durante 2026. Existen "llaves para negocios". Un resumen afirma que **no tiene costo adicional** para personas ni negocios y que el tope por transacción es de 1.000 UVB. **Sin verificar**: el resumen da una cifra en COP incoherente y no confirmé la política de costos para comercios — [BanRep](https://banrep.gov.co/es/print/pdf/node/65830); [La República](https://www.larepublica.co/finanzas/llaves-para-negocios-de-bre-b-4241983)
- **Wompi** (Grupo Cibest/Bancolombia), según agregadores, cobra: tarjetas 2,99 % + IVA + COP 600; PSE ~1,49 % + COP 1.200; Nequi ~1,79 %. Liquidación en 1–2 días hábiles si la cuenta es Bancolombia y 2–3 en otros bancos. Ofrece links de pago para vender por WhatsApp. **Bold**, según agregadores: tarjetas nacionales 2,80 % + IVA + COP 500 (internacionales 3,5 %), PSE 1,79 % y Nequi 1,79 %. **Sin verificar** en las páginas oficiales — [guiadesoftware](https://www.guiadesoftware.com/blog/mejor-pasarela-pago-colombia); [hacecuentas](https://hacecuentas.com/co/calculadora-costo-vender-online-colombia-2026)
- **Factura electrónica y RIPS**: la Res. 2275/2023 hace del RIPS en **JSON** el soporte obligatorio de la Factura Electrónica de Venta (FEV) en salud. Los prestadores, **incluidos los profesionales independientes**, deben facturar electrónicamente. Los plazos de implementación se escalonaron hasta 2025 — [Cerlatam Res. 2275/2023](https://www.cerlatam.com/normatividad/minsalud-resolucion-2275-de-2023/); [Consultorsalud](https://consultorsalud.com/analisis-detallado-de-las-transformaciones-en-la-factura-electronica-de-venta-reportes-rips-json-y-dian-en-las-ese/); [Res. 2275/2023 texto](https://www.saludcapital.gov.co/DPYS/Normatividad/Resoluciones/Res_2275-2023.pdf)
- **WhatsApp Business Platform**: desde el 1-jul-2025 Meta cobra **por mensaje de plantilla entregado** y no por conversación. Las plantillas *utility* son **gratis dentro de la ventana de servicio de 24 h**. Tarifas reportadas para Colombia: *utility* ~USD 0,0008 por mensaje y *marketing* ~USD 0,0125. **Hay conflicto**: otra fuente da tarifas por conversación de *utility* USD 0,0049 y *marketing* USD 0,0236, probablemente desactualizadas — [Leadsales](https://leadsales.io/blog/whatsapp-business-api-cuanto-cuesta/); [ChatDaddy](https://chatdaddy.tech/blog/whatsapp-business-api-pricing-calculator); [Meta changelog](https://developers.facebook.com/documentation/business-messaging/whatsapp/changelog/)
- Otras suites cobran el SMS de recordatorio aparte: USD 0,02 en TheraPlatform y USD 0,05 en Practice Better — [softwarefinder](https://softwarefinder.com/theraplatform-software); [PricingSaaS](https://pricingsaas.com/companies/practicebetter)

### Inferences
- Modelo administrativo sugerido:
  - `ServiceRate` (tarifa por tipo: evaluación, sesión o informe, con recargo domiciliario o por zona).
  - `Package` (N sesiones, precio, vencimiento, sesiones consumidas o pendientes, regla de cancelación tardía).
  - `Charge` (cargo por visita o paquete).
  - `Payment` (método `breb|nequi|daviplata|wompi_link|bold_link|cash|transfer`, referencia o comprobante como foto, fecha, conciliado sí/no).
  - `Invoice` (FEV vía proveedor tecnológico DIAN: CUFE, PDF y XML, RIPS JSON cuando aplique).
  - `Expense` (transporte o materiales, para conocer el ingreso neto por visita domiciliaria).
- Para la MVP, lo más barato es **cobrar por Bre-B o Nequi con la llave de la terapeuta y conciliar a mano** (adjuntar el comprobante que el cuidador manda por WhatsApp). Los links de Wompi o Bold quedan para pagos con tarjeta o paquetes. La factura electrónica conviene integrarla con un proveedor tecnológico o la facturación gratuita de la DIAN en lugar de construirla.
- Con recordatorios *utility* dentro de una conversación iniciada por el paciente, o a unos USD 0,001 por plantilla, el costo de mensajería en Colombia es despreciable frente a una sesión de COP 60.000–150.000.

### Gaps
- No confirmé si una persona natural recibiendo pagos por Bre-B paga comisión, ni el estado real del QR para personas naturales en oct-2026.
- No confirmé si el **RIPS JSON es obligatorio para pacientes particulares** (sin EPS) o solo cuando se factura a un pagador del sistema. Tampoco revisé el régimen tributario (no responsable de IVA, régimen simple) del fonoaudiólogo independiente.
- Precios de Wompi y Bold sin confirmar en sus páginas oficiales.

---

## 8. Visualizaciones y dashboards útiles (terapeuta y cuidador)

### Takeaway
Los productos de fonoaudiología convergen en **gráficas de tendencia por objetivo**: % de acierto por sesión, %SLD y LME en el tiempo, con datos por target y nivel de apoyo. Además ofrecen reportes automáticos y comunicación visual o auditiva con el cuidador. La literatura pediátrica respalda escalas individualizadas (GAS) que sirven como vista simple para la familia. Sobre vistas de agenda, caseload, mapa o ingresos no encontré evidencia formal; son patrones de producto inferidos.

### Cited Findings
- Ensora resalta **gráficas visuales de progreso** y grabaciones de audio para comunicarse con los cuidadores y construir planes individualizados — [Ensora](https://www.ensorahealth.com/product/rehab-therapy-suite)
- SLP Toolkit permite "**graficar datos para ver tendencias**" y generar informes de progreso con pruebas y rúbricas — [SLP Toolkit features](https://slptoolkit.com/features)
- Las apps de datos para fonoaudiología muestran tendencias de **% de acierto, %SLD y LME/MLU en el tiempo** en una sola vista por cliente, conteos de aciertos y errores **por target** y nivel de prompting, y exportan un resumen para la nota — [AbleSpace](https://www.ablespace.io/blog/how-to-track-speech-therapy-data-free-sheets-examples-and-digital-tools/)
- La GAS (-2..+2) da retroalimentación continua a profesionales **y a padres** sobre objetivos individualizados — [GAS manual](https://mississaugahalton.rehabcareontario.ca/uploads/contentdocuments/gasmanual_.pdf); [Rehab Care Ontario / revisión GAS pediatría](https://works.bepress.com/janette-mcdougall/56)
- Emparejar % y nivel de apoyo es esencial para interpretar el dato — [Speechy Musings](https://speechymusings.com/speech-language-therapy-data-collection-cheat-sheet/)

### Inferences
- **Vistas para la terapeuta (web y móvil)**:
  1. **"Hoy"**: lista o mapa de las visitas del día con orden sugerido, estado de confirmación (confirmado, pendiente, sin respuesta), notas de acceso y botón de check-in.
  2. **Ficha del objetivo**: línea de % de acierto por sesión, con **color o forma del punto según el nivel de apoyo** (o barras apiladas por nivel), línea de criterio de dominio (p. ej. 80 %) y marcas de cambio de fase o target. Es el estándar de gráfica de caso único.
  3. **Progreso por target** (*small multiples*): un sparkline por fonema o estructura, útil en TSH.
  4. **Escalas en el tiempo**: FOIS como escalones (ordinal 1–7), EAT-10 o VHI-10 como puntos con umbral clínico.
  5. **Adherencia en casa**: heatmap semanal de práctica (días por semana) junto a la curva de progreso.
  6. **Asistencia**: calendario o heatmap por paciente (asistió, canceló tarde, no asistió) y tasa mensual global.
  7. **Caseload**: tabla por paciente con población, objetivos activos, última sesión, próxima reevaluación o informe pendiente, sesiones restantes del paquete y saldo.
  8. **Finanzas**: ingresos por mes (barras) e ingreso por paciente; por cobrar frente a cobrado; sesiones vendidas frente a consumidas; costo de traslado.
- **Vista del cuidador** (link de solo lectura o resumen mensual por WhatsApp): lenguaje llano, 1–3 objetivos con icono de progreso o escala GAS, racha de práctica en casa, la tarea de esta semana con su video modelo y la próxima cita. **Sin** datos crudos de ensayos ni jerga.
- Dar prioridad a vistas **legibles en el teléfono** (columnas simples, sparklines) sobre dashboards densos de escritorio. El escritorio queda para informes y finanzas.

### Gaps
- No encontré estudios de usabilidad sobre qué gráficas prefieren los fonoaudiólogos, ni evidencia de que una vista de progreso para padres mejore la adherencia. Estas vistas son **diseño inferido**.

---

## 9. UX y accesibilidad: captura rápida en el teléfono, dictado, localización en español

### Takeaway
La recolección de datos en fonoaudiología es por naturaleza **conteo por ensayo con nivel de apoyo**, así que la interfaz natural son **botones grandes de "+ / − / nivel de apoyo" por target**, con cálculo automático de % y paso de la nota de la sesión a SOAP. El dictado de la nota debería ser **local**. La documentación revisada viene casi toda en inglés: la localización requiere el vocabulario clínico hispano (Independiente, Apoyo mínimo, moderado y máximo; TSH, TEL o TDL; disfagia orofaríngea, etc.).

### Cited Findings
- Las apps de datos para fonoaudiología permiten **tally** de correctas e incorrectas por target, registran el nivel de prompting y calculan solas, "ahorrando tiempo y reduciendo errores" — [AbleSpace](https://www.ablespace.io/blog/how-to-track-speech-therapy-data-free-sheets-examples-and-digital-tools/)
- Jane promueve que toda su funcionalidad sirva desde el smartphone, y SimplePractice incluye app móvil desde el plan Starter — [softwareconnect](https://softwareconnect.com/reviews/jane-app-clinic-management/); [schedulingkit](https://schedulingkit.com/pricing-guides/simplepractice-pricing)
- Existe transcripción **local** en móviles con Whisper (whisper.cpp) mediante bindings de React Native (`whisper.rn`), con transcripción en tiempo real por fragmentos y sin red — [Off Grid docs](https://www.mintlify.com/alichherawalla/off-grid-mobile-ai/features/voice-transcription). Hay apps iOS que transcriben español sin conexión en el Neural Engine — [TranscriAI App Store](https://apps.apple.com/us/app/-/id6748940555)

### Inferences
- Patrones de UX recomendados:
  1. **Modo sesión** en pantalla completa con temporizador.
  2. Una tarjeta por target activo con botones ✓ / ✗ y un selector de apoyo persistente (I/Min/Mod/Máx) que se recuerda entre ensayos.
  3. **Deshacer** el último ensayo.
  4. Uso con una mano y alto contraste: la terapeuta sostiene materiales y está en el suelo con niños.
  5. Al cerrar, una **nota SOAP prellenada** (O = datos; P = tarea en casa asignada) que se completa con **dictado local**.
  6. Envío de la tarea de casa al cuidador por WhatsApp con un toque.
- Localización: formatos de fecha `dd/mm/aaaa`, moneda COP sin decimales, festivos colombianos en la recurrencia, terminología CIF en español y plantillas de informe dirigidas a colegio, pediatra o EPS.
- Accesibilidad para cuidadores: mensajes cortos, **audio o video en lugar de texto largo** (alfabetización variable) y botones de respuesta rápida de WhatsApp.

### Gaps
- No encontré estudios sobre tiempos de documentación de fonoaudiólogos en el móvil ni comparaciones de interfaces de captura. Tampoco evaluaciones del rendimiento de Whisper en español colombiano clínico con vocabulario técnico.

---

## 10. Funciones de IA realistas y respetuosas de la privacidad

### Takeaway
Hoy son realistas: (a) **transcripción local** del dictado de la terapeuta (Whisper en el dispositivo) para notas SOAP; (b) **borradores de informes** de progreso o alta a partir de datos estructurados más el dictado, siempre revisados y firmados por la terapeuta; (c) **resúmenes para la familia** en lenguaje llano. El análisis automático de muestras de habla infantil todavía **no es fiable** justo donde importa (palabras con errores: menos de 80 % de acuerdo con humanos). Además, enviar audio de niños a la nube choca con la Ley 1581/2012, que prohíbe tratar datos de menores salvo excepciones, considera sensibles los datos de salud y restringe la transferencia internacional.

### Cited Findings
- **Revisión sistemática McKechnie et al. (2018, IJSLP)** de 18 herramientas de análisis automático de habla infantil: alcanzaban el umbral clínico de **80 % de acuerdo** con el juicio humano para predecir inteligibilidad, severidad o categoría de error, pero **en palabras con errores de pronunciación la precisión solía ser menor al 80 %** — [IJSLP](https://www.informahealthcare.com/doi/full/10.1080/17549507.2018.1477991); [Canberra repo](https://researchprofiles.canberra.edu.au/en/publications/automated-speech-analysis-tools-for-childrens-speech-production-a/)
- **JMIR 2025** (Corea): un wav2vec 2.0 XLS-R preentrenado con 436.000 h de voz adulta en 128 idiomas se ajustó con solo **93,6 minutos** de habla infantil con errores. Se comparó con fonoaudiólogos en dos pruebas estandarizadas con 30 niños de 3 a 7 años. Muestra viabilidad, pero la base de datos infantil es muy pequeña y el idioma es otro — [JMIR 2025;27:e60520](https://www.jmir.org/2025/1/e60520)
- Los escribas comerciales funcionan con **consentimiento explícito por sesión**: en Jane no se presume ni se extiende a sesiones futuras y los datos no se usan para entrenar. En SimplePractice el Note Taker transcribe en tiempo real y, según el resumen, no guarda la grabación — [Shift Collab sobre Jane](https://support.shiftcollab.com/what-is-the-ai-scribe-feature-in-jane-and-how-does-it-work); [SimplePractice support](https://support.simplepractice.com/hc/en-us/articles/42030829462413-Preparing-to-use-Note-Taker)
- **Ley 1581/2012 (Colombia)**: prohíbe tratar datos de niños, niñas y adolescentes salvo los de naturaleza pública y siempre que se respete su **interés superior**. Define como sensibles los datos que afectan la intimidad (incluida la salud) y regula la **transferencia internacional** a responsables fuera de Colombia — [Ley 1581/2012, Secretaría de Salud Bogotá](https://www.saludcapital.gov.co/Normo/gsp/ley_1581_de_2012.pdf). La Ley 1751/2015 consagra la intimidad como derecho en salud — [Minsalud memoria HC 2026](https://www.minsalud.gov.co/Normativa/anexosproyectos/ANEXO2MEMJUSTIFICATIVAHISTORIA%20CLINICA%2022%20JUL%2026_20260722151201.pdf)
- La transcripción local con `whisper.rn`/whisper.cpp ya funciona en React Native en tiempo real y sin red — [Off Grid docs](https://www.mintlify.com/alichherawalla/off-grid-mobile-ai/features/voice-transcription)
- Evolua (Brasil) ya ofrece "audio → informe estructurado → WhatsApp a los padres", con un pipeline de transcripción en la nube sobre AWS — [TabNews](https://www.tabnews.com.br/matfalvesdev/pitch-criei-um-saas-para-fonos-e-olha-no-que-deu)

### Inferences
- Por qué el audio infantil en la nube es un riesgo:
  1. Es dato sensible de salud **de un menor**, con prohibición por defecto en la Ley 1581.
  2. La voz es un identificador biométrico potencial y no se puede "anonimizar" quitando el nombre.
  3. Mandarlo a APIs de EE. UU. es una transferencia internacional que exige garantías y autorización expresa del representante legal.
  4. Los proveedores pueden retener el audio para abuso o entrenamiento según sus términos.
  5. Una brecha de datos de este tipo no se puede revertir.
- Recomendaciones:
  - **IA de la MVP**: solo dictado local de la voz de la terapeuta, nunca grabación del niño.
  - **Después**: borradores de informe con un LLM **sin datos identificables** (seudónimos y datos agregados) o con un modelo local.
  - El análisis automático de muestras de habla (PCC, LME) queda como herramienta **asistida** y opcional, con procesamiento local y **consentimiento específico**.
  - En cualquier caso: consentimiento granular (datos, audio, IA y WhatsApp) **por representante legal**, revocable y registrado en `Consent`.

### Gaps
- No encontré evaluaciones de ASR para **habla infantil en español** ni de Whisper con habla disártrica o afásica en español. Tampoco hallé pronunciamientos de la SIC (Superintendencia de Industria y Comercio) sobre IA y datos de salud de menores en 2025-2026.

---

## 11. Inventario priorizado de funcionalidades (MVP frente a posteriores)

### Takeaway
La MVP debería cubrir el ciclo **contacto por WhatsApp → agenda con confirmación → visita (check-in, datos por ensayo, nota) → tarea en casa → cobro**, con un dashboard mínimo de "hoy", caseload y progreso por objetivo. Rutas optimizadas, factura electrónica integrada, IA de informes, análisis de habla y portal completo del cuidador quedan para después.

### Cited Findings
- Lo mínimo común de las suites del mercado es agenda, recordatorios, notas o plantillas, cobros y portal — [schedulingkit SimplePractice](https://schedulingkit.com/pricing-guides/simplepractice-pricing); [softwarefinder TheraPlatform](https://softwarefinder.com/theraplatform-software)
- Los diferenciadores en fonoaudiología son objetivos, datos, gráficas, plantillas por área y audio para cuidadores — [Ensora](https://www.ensorahealth.com/product/rehab-therapy-suite); [SLP Toolkit](https://slptoolkit.com/features)
- En LatAm se espera confirmación doble por WhatsApp y ficha personalizable — [AgendaPro](https://agendapro.com/blog/mejores-software-para-terapeutas/)
- Los recordatorios suben la asistencia (RR 1,14) y facilitan cancelar a tiempo — [Cochrane](https://www.cochrane.org/evidence/CD007458_mobile-phone-messaging-reminders-attendance-healthcare-appointments); [Hasvold y Wootton](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3188816/)
- La práctica de los cuidadores es eficaz y permite alcanzar la dosis recomendada — [Lawler et al.](https://search.pedro.org.au/search-results/record-detail/34147); [Sugden et al.](https://strathprints.strath.ac.uk/64411)

### Inferences
**MVP (P0)**
1. Contacto inicial y agendamiento por WhatsApp. El cuidador elige entre cupos que ya incluyen el buffer de traslado y la zona.
2. Recordatorios a 72 h y 24 h con Confirmar, Reprogramar o Cancelar; escalamiento a la terapeuta sin cancelación automática.
3. Pacientes y acudientes, con dirección, geolocalización y notas de acceso.
4. Franjas semanales recurrentes con excepciones y festivos colombianos.
5. Estados de asistencia (asistió, canceló tarde, no asistió) e historial.
6. Episodio de atención con plan, objetivos de largo y corto plazo (SMART, dominio CIF) y targets.
7. **Modo sesión** en el móvil: check-in, temporizador, conteo por ensayo con nivel de apoyo y escalas (FOIS, EAT-10, VHI-10).
8. Nota SOAP prellenada y **dictado local**.
9. Tarea en casa con video o audio modelo enviada por WhatsApp, y registro de práctica con botones.
10. Pagos: registro manual por Bre-B, Nequi o efectivo con comprobante; paquetes con saldo de sesiones.
11. Dashboard "Hoy", caseload y gráfica de progreso por objetivo coloreada por nivel de apoyo.
12. Consentimientos (Ley 1581, representante legal, WhatsApp), auditoría y respaldo.
13. Modo offline básico en la app móvil.

**P1 (siguiente)**
1. Lista de espera con oferta automática de cupos liberados por zona.
2. Mapa del día con orden sugerido.
3. Informes en PDF (evaluación, progreso, alta, colegio, pediatra o EPS) desde plantillas y datos.
4. Resumen mensual para la familia (vista o link de solo lectura).
5. Heatmaps de asistencia y adherencia.
6. Finanzas: ingresos por mes, por cobrar, ingreso neto con traslados.
7. Links de pago Wompi o Bold.
8. Catálogo de instrumentos con puntajes.
9. Escala GAS.

**P2 (posterior)**
1. Factura electrónica DIAN y RIPS JSON vía proveedor tecnológico.
2. Interoperabilidad IHCE/RDA (Res. 866/2021, 1888/2025).
3. Optimización real de rutas.
4. Borradores de informe con LLM seudonimizado o local.
5. Análisis asistido de muestras de habla en el dispositivo.
6. Portal o app del cuidador.
7. Telepráctica.
8. Multi-terapeuta.

### Gaps
- No validé la priorización con fonoaudiólogas colombianas reales (no hay entrevistas ni encuestas). No encontré cuánto tiempo dedica una fonoaudióloga a domicilio a tareas administrativas, que es la base para estimar el ROI de cada función.
