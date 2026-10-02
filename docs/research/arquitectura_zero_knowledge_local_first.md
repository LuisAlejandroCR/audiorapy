# Arquitectura "zero-knowledge" (cifrado de extremo a extremo) y local-first para la app de fonoaudiología a domicilio — estado a octubre de 2026

> Alcance y método: investigación hecha el 2026-10-02. Muchos sitios de documentación estaban bloqueados por el proxy de salida (evolu.dev, jazz.tools, supabase.com, docs.expo.dev, powersync.com, rxdb.info, corbado.com, etc.). Por eso las fuentes primarias se leyeron directamente de los repositorios GitHub de cada proyecto, en sus commits de HEAD de finales de sept./1-oct. 2026. Las versiones y fechas de publicación vienen del registro npm (consultado el 2026-10-02). Para cada afirmación se cita la URL pública equivalente: la del repo o la del sitio de documentación. Lo que solo se pudo confirmar por fragmentos de buscador se marca como tal.
>
> Terminología: aquí "zero-knowledge" significa **cifrado zero-knowledge / E2EE**, al estilo de Proton o Bitwarden: el servidor solo almacena texto cifrado y nunca tiene las claves. Las **pruebas de conocimiento cero (ZK-SNARKs)** se tratan aparte en una sección propia.

## 1. Motores de sincronización local-first: ¿cuáles dan E2EE real (el servidor no puede leer) y cuáles solo TLS o cifrado en reposo?

### Takeaway
A octubre de 2026, el único motor activo, maduro para RN/Expo y web, con licencia MIT y **E2EE por defecto e imposible de desactivar** es **Evolu**. Jazz abandonó el E2EE por defecto en su v2 (alfa) y la versión "classic" queda en mantenimiento. PowerSync, ElectricSQL, Zero, Instant, TinyBase, WatermelonDB y RxDB ofrecen como máximo TLS más cifrado del SQLite local en reposo. Con ellos, el E2EE hay que construirlo a mano cifrando campos en el cliente antes de sincronizar.

### Cited Findings
**Evolu (MIT): E2EE real**
- Versiones a 2026-10-02: `@evolu/common` 8.15.1 (2026-10-01), `@evolu/react-native` 16.1.1 (2026-10-01), `@evolu/web` 3.4.0, `@evolu/react-web` 3.2.0 y `@evolu/relay` 4.1.5, todas MIT. Las versiones salen muy seguidas: 8.13.0 → 8.14.0 → 8.15.0 → 8.15.1 entre el 30-sep y el 1-oct-2026 — [npm @evolu/common](https://www.npmjs.com/package/@evolu/common); [npm @evolu/react-native](https://www.npmjs.com/package/@evolu/react-native); [npm @evolu/relay](https://www.npmjs.com/package/@evolu/relay)
- La documentación dice textualmente: "Everything in Evolu is encrypted end-to-end… Data is stored in encrypted SQLite on the device… The Evolu Relay receives only encrypted data". La API no permite marcar datos como públicos ni desactivar el cifrado: "Developers cannot disable encryption" — [Evolu docs: Privacy (fuente en repo)](https://github.com/evoluhq/evolu/blob/main/apps/web/src/app/%28docs%29/docs/privacy/page.mdx)
- Lo que ve el relay: OwnerId, timestamps, blobs cifrados con padding PADMÉ y las IPs de los clientes. Evolu afirma que el relay es post-cuántico seguro porque solo maneja cifrado simétrico. La colaboración necesita criptografía asimétrica, y su documentación detallada "will be provided soon" — [Evolu Privacy](https://github.com/evoluhq/evolu/blob/main/apps/web/src/app/%28docs%29/docs/privacy/page.mdx)
- Primitivas: XChaCha20-Poly1305 de `@noble/ciphers`, derivación de claves SLIP-21 y padding PADMÉ — [Evolu Crypto.ts](https://github.com/evoluhq/evolu/blob/main/packages/common/src/Crypto.ts). Un `OwnerSecret` deriva por SLIP-21 la `OwnerEncryptionKey` y una `OwnerWriteKey` rotable. El paquete usa `@scure/bip39` (frase mnemónica) y ofrece `ShardOwner`, `SharedOwner` y `SharedReadonlyOwner` — [Evolu Owner.ts](https://github.com/evoluhq/evolu/blob/main/packages/common/src/local-first/Owner.ts)
- Soporte de plataformas: React, React Native y Expo (vía `expo-sqlite` + `react-native-quick-crypto`). **Expo Go no está soportado** y **tampoco Expo web** ("Metro can't bundle Evolu's web workers"). Para web se usa `@evolu/react-web` con Vite o Next.js, compartiendo esquema y consultas. El secreto del owner se persiste "in Expo SecureStore or WebAuthn-backed storage" — [Evolu docs: Local-first](https://www.evolu.dev/docs/local-first) (fuente en el repo evoluhq/evolu)
- Relay auto-hospedable: paquete npm `@evolu/relay` e imagen Docker `evoluhq/relay`. Solo necesita SQLite y WebSockets y admite cuota por owner (`EVOLU_RELAY_MAX_OWNER_BYTES`). Recomiendan usar dos relays, y el relay gratuito `free.evoluhq.com` es solo para pruebas ("data may be deleted") — [Evolu docs: Relay](https://www.evolu.dev/docs/relay)
- En web, Safari borra OPFS tras 7 días sin visita, salvo en PWA instalada en la pantalla de inicio. Evolu expone `evolu.devicePersistence` (`Persisted` / `NotPersisted` / `Unknown`) y pide `navigator.storage.persist()` — [Evolu docs: FAQ](https://www.evolu.dev/docs/faq)

**Jazz (MIT): classic tenía E2EE; la v2 ya no lo trae por defecto**
- npm `jazz-tools`: `latest` = 0.20.19 (2026-07-03, "classic") y `alpha` = 2.0.0-alpha.58 (2026-09-30) — [npm jazz-tools](https://www.npmjs.com/package/jazz-tools)
- README: "this is the Jazz 2.0 alpha with an entirely new API… (Looking for Classic Jazz?)". Expo aparece como "binding scaffold (persistent and device-supported memory runtimes are not available in this alpha)" — [Jazz README](https://github.com/garden-co/jazz/blob/main/README.md)
- Blog del 2026-04-18: "There will still be an end-to-end encryption story in Jazz v2, but… Jazz v2 treats the server as trusted for access control while still allowing especially sensitive fields to be hidden from it via encrypted columns". Promesa de migración: classic seguirá recibiendo parches de seguridad y Jazz Cloud classic seguirá funcionando "until everyone has had a fair chance to migrate" — [What we learned from classic Jazz](https://github.com/garden-co/jazz/blob/main/docs/content/blog/what-we-learned-from-classic-jazz.mdx)
- En la especificación v2 las columnas cifradas siguen siendo una pregunta abierta: "If encrypted columns are added, policy evaluation must define what can be evaluated server-side…" — [Jazz SPEC 7_authorization](https://github.com/garden-co/jazz/blob/main/crates/jazz/SPEC/7_authorization.md)
- Jazz classic usaba firma Ed25519 de cada transacción, una "read key" simétrica por grupo con rotación al quitar miembros, BLAKE3 y XSalsa20 (dato de fragmento de buscador) — [classic.jazz.tools encryption](https://classic.jazz.tools/docs/react/reference/encryption)

**PowerSync (SDK cliente Apache-2.0; servicio FSL-1.1-ALv2): sin E2EE**
- Cifra "in transit via TLS" y "at rest" la base local. En React Native/Expo usa OP-SQLite con SQLCipher; en web, SQLite3MultipleCiphers (ChaCha20 por defecto). La página de cifrado no menciona E2EE — [PowerSync docs: Data Encryption](https://github.com/powersync-ja/powersync-docs/blob/main/client-sdks/advanced/data-encryption.mdx)
- Versiones: `@powersync/react-native` 2.3.1 y `@powersync/web` 2.4.2 (ambas del 2026-10-01, Apache-2.0); `@powersync/service-core` 1.27.0 (2026-09-30) con licencia **FSL-1.1-ALv2** — [npm @powersync/service-core](https://www.npmjs.com/package/@powersync/service-core)
- El autohospedaje existe en "Open Edition" y en "Enterprise Self-Hosted Edition" (de pago) — [PowerSync docs: self-hosting](https://github.com/powersync-ja/powersync-docs/blob/main/intro/self-hosting.mdx)

**ElectricSQL (Apache-2.0): sin E2EE nativo, con ejemplo "hazlo tú mismo"**
- `@electric-sql/client` 1.5.28 (2026-09-09) — [npm](https://www.npmjs.com/package/@electric-sql/client)
- El ejemplo oficial `examples/encryption` cifra en el cliente "before sending to the API server", descifra al sincronizar y deja solo texto cifrado en Postgres — [Electric encryption example](https://github.com/electric-sql/electric/tree/main/examples/encryption)

**Zero / Replicache (Rocicorp)**
- `@rocicorp/zero` 1.9.0 (2026-08-14, Apache-2.0), con canary 1.11 publicada a diario. Replicache 15.3.0 (2025-07-02) tiene licencia según roci.dev/terms y no ha publicado versiones desde julio de 2025 — [npm @rocicorp/zero](https://www.npmjs.com/package/@rocicorp/zero); [npm replicache](https://www.npmjs.com/package/replicache)
- Al buscar "encrypt"/"end-to-end" en el repo de documentación de Zero (HEAD 2026-08-29) no aparece ninguna función de cifrado. `zero-cache` replica desde un Postgres "upstream" con permisos por app — [rocicorp/zero-docs](https://github.com/rocicorp/zero-docs)

**Instant (Apache-2.0)**
- `@instantdb/react-native` 1.0.67 (2026-08-31). Es "fully open source" y auto-hospedable: guía VPS desde unos US$30/mes y guía AWS desde unos US$600/mes — [Instant self-hosting docs](https://github.com/instantdb/instant/blob/main/client/www/app/docs/self-hosting/page.md)
- En la documentación, "encryption" solo aparece para secretos del servidor (configuración de self-hosting), no para E2EE de datos — [Instant AWS self-hosting](https://github.com/instantdb/instant/blob/main/client/www/app/docs/self-hosting/aws/page.md)

**Triplit (cliente AGPL-3.0): de facto descontinuado como producto**
- La última versión de `@triplit/client` es la 1.0.50, del 2025-07-31 — [npm @triplit/client](https://www.npmjs.com/package/@triplit/client)
- En octubre de 2025 el cofundador Matt Linkous se unió a Supabase. Triplit no se integra en Supabase; él trabajará en integraciones con ElectricSQL, Zero y PowerSync — [Supabase blog: Triplit joins Supabase](https://supabase.com/blog/triplit-joins-supabase)

**RxDB (Apache-2.0 core + plugins premium de pago)**
- `rxdb` 17.5.0 (2026-08-20) — [npm rxdb](https://www.npmjs.com/package/rxdb)
- El plugin de cifrado es **por campo y con contraseña**. La variante gratuita es `encryption-crypto-js` (AES de crypto-js); la de WebCrypto (unas 10 veces más rápida) es **premium**. Los campos cifrados "cannot be used as operators in queries". Está pensado para robo del dispositivo, es decir, cifrado local en reposo — [RxDB docs: Encryption](https://rxdb.info/encryption.html) ([fuente](https://github.com/pubkey/rxdb/blob/master/docs-src/docs/encryption.md))

**WatermelonDB, TinyBase, LiveStore, CRDT (Automerge/Yjs)**
- `@nozbe/watermelondb` 0.28.0 es del 2025-04-07 (MIT) y no ha tenido versiones en unos 18 meses — [npm](https://www.npmjs.com/package/@nozbe/watermelondb)
- `tinybase` 10.0.1 (2026-09-24, MIT) trae un persister para `expo-sqlite` y sincronizadores (MergeableStore). No se encontró cifrado en sus guías — [TinyBase persister-expo-sqlite](https://tinybase.org/api/persister-expo-sqlite/); [npm tinybase](https://www.npmjs.com/package/tinybase)
- `@livestore/livestore` 0.4.0 (2026-06-02, Apache-2.0) tiene `@livestore/adapter-expo` — [npm](https://www.npmjs.com/package/@livestore/adapter-expo)
- `@automerge/automerge` 3.5.0 (2026-09-16) y `yjs` 13.6.33 (2026-09-23) son librerías CRDT sin E2EE incorporado — [npm automerge](https://www.npmjs.com/package/@automerge/automerge); [npm yjs](https://www.npmjs.com/package/yjs)
- Ink & Switch desarrolla **Keyhive/Beelay**, un sync E2EE para grupos sobre Automerge en el que el servidor "only [has] access to encrypted data". Es un proyecto de investigación (cuadernos de laboratorio, financiado por NLnet) — [Ink & Switch Keyhive notebook](https://www.inkandswitch.com/keyhive/notebook/01/); [NLnet Keyhive](https://nlnet.nl/project/Keyhive/)
- `secsync` (protocolo E2EE para CRDT de serenity-kit) tiene su última versión, la 0.5.0, de 2024-06-04 — [npm secsync](https://www.npmjs.com/package/secsync)

**Precedente de riesgo de proveedor**
- Notion compró Skiff (correo, docs y calendario E2EE) el 2024-02-10 y cerró sus servicios el 2024-08-09. Hubo reportes de exportaciones que fallaban — [AlternativeTo](https://alternativeto.net/news/2024/2/notion-acquires-the-privacy-focused-platform-skiff-ending-its-services-within-6-months/)

### Inferences
- **Clasificación práctica, oct-2026:**
  - E2EE real, mantenido y con RN+web: **Evolu**.
  - E2EE real pero en mantenimiento: **Jazz classic**.
  - E2EE de investigación o abandonado: **Keyhive, secsync**.
  - Solo TLS + SQLite cifrado en el dispositivo: **PowerSync, RxDB (local), op-sqlite/expo-sqlite**.
  - Servidor confiable que lee todo: **Zero, Instant, Electric, Triplit, TinyBase sync, WatermelonDB sync**.
  - En todo este último grupo, el E2EE solo es posible cifrando campos en la app (patrón del ejemplo de Electric). Se pierde el filtrado y las consultas del lado servidor sobre esos campos.
- Para **una sola fonoaudióloga** (un único "owner" y varios dispositivos propios) el modelo de Evolu encaja casi perfecto: un secreto o mnemónico por cuenta y relay ciego. Su punto débil para colaboración (asimetría "coming soon") no afecta al caso de uso actual.
- Riesgos de Evolu:
  - API muy volátil: `@evolu/react-native` va por la versión mayor 16.
  - Proyecto pequeño y sin auditoría pública encontrada.
  - El relay no está pensado para blobs grandes (tiene cuotas por owner).
  - El dashboard tendría que ser Next.js/Vite con `@evolu/react-web`, no Expo web. Eso coincide con el stack del desarrollador (Next.js/Vercel).
- **Alternativa con su stack actual:** Supabase/Postgres + PowerSync (o un sync propio) + "sobres" cifrados por fila en el cliente. Es más trabajo de criptografía propia, pero da un motor de sync maduro, SQLite en el teléfono y alineación con Supabase.
- Que Jazz haya dado marcha atrás con el E2EE criptográfico ("adopters… did not love the public-key complexity") es una señal relevante: el E2EE completo tiene un costo de producto real.
- El caso Skiff respalda una exigencia de diseño: con un horizonte legal de 15 años, la app debe tener **exportación en formato abierto** que no dependa de un proveedor de sync.

### Gaps
- No pude leer el sitio jazz.tools (bloqueado) para confirmar si la v2 ya publica columnas cifradas. Lo encontrado es la especificación de 2026, que las marca como pregunta abierta.
- No encontré auditoría de seguridad externa publicada de Evolu.
- No verifiqué cómo cifra Evolu el SQLite local en RN; su documentación dice "encrypted SQLite on the device" sin precisar el mecanismo.
- No verifiqué si RxDB replica los campos cifrados como texto cifrado o descifrados hacia el backend.
- LiveStore: no encontré documentación de cifrado.

## 2. Almacenamiento local cifrado en el dispositivo y en el navegador

### Takeaway
En el teléfono hay dos opciones: **SQLCipher** (con `expo-sqlite` y `useSQLCipher`, o con `op-sqlite`) más la clave de la base en **Keychain/Keystore** vía `expo-secure-store`. Las dos funcionan con Expo SDK 57 en builds de desarrollo o producción, no en Expo Go. En la web no hay equivalente robusto: lo razonable es guardar en IndexedDB/OPFS solo texto cifrado (o un SQLite-WASM cifrado) y mantener la clave como `CryptoKey` **no extraíble**. Hay que asumir que Safari puede borrar los datos si no es una PWA instalada.

### Cited Findings
- `expo-sqlite` 57.0.3 (2026-09-11) soporta SQLCipher en Android, iOS y macOS con `"useSQLCipher": true` en app.json más `npx expo prebuild`. Hay que ejecutar `PRAGMA key = '...'` justo después de abrir la base, y no funciona en Expo Go. Para web necesita wasm y las cabeceras COOP/COEP (SharedArrayBuffer). Incluye además la opción de config `enableFTS` — [Expo docs: SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) ([fuente](https://github.com/expo/expo/blob/main/docs/pages/versions/unversioned/sdk/sqlite.mdx)); [npm expo-sqlite](https://www.npmjs.com/package/expo-sqlite)
- `@op-engineering/op-sqlite` 18.2.5 (2026-09-20, MIT) admite "SQLCipher… as a compilation target" (y también libsql y sqlite-vec). Es la base que usa PowerSync en RN — [op-sqlite README](https://github.com/OP-Engineering/op-sqlite); [PowerSync Data Encryption](https://github.com/powersync-ja/powersync-docs/blob/main/client-sdks/advanced/data-encryption.mdx)
- `expo-secure-store` 57.0.4:
  - Android guarda en SharedPreferences cifradas con Android Keystore; iOS usa Keychain (`kSecClassGenericPassword`).
  - En iOS los datos pueden persistir tras desinstalar la app, sin garantía; en Android no.
  - Con `requireAuthentication` el valor queda inaccesible si cambian las biometrías.
  - Algunos iOS rechazaban valores de más de unos 2048 bytes.
  - Las entradas deben excluirse del Auto Backup de Android porque no se pueden descifrar tras restaurar.
  - Fuente: [Expo docs: SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/) ([fuente](https://github.com/expo/expo/blob/main/docs/pages/versions/unversioned/sdk/securestore.mdx))
- `react-native-mmkv` 4.3.2 (2026-06-22) cifra opcionalmente con `encryptionKey`, con AES-128 por defecto o `encryptionType: 'AES-256'`. Sin clave, "MMKV stores all key-values in plain text on file" y depende del sandbox del sistema operativo — [react-native-mmkv README](https://github.com/mrousavy/react-native-mmkv)
- PowerSync en web usa SQLite3MultipleCiphers (ChaCha20) para cifrar la base WASM — [PowerSync Data Encryption](https://github.com/powersync-ja/powersync-docs/blob/main/client-sdks/advanced/data-encryption.mdx)
- WebCrypto: un `CryptoKey` se puede clonar estructuralmente en IndexedDB **conservando la no-extraibilidad**, de modo que el JS no puede sacar los bytes. La fuente es de la lista W3C public-webcrypto, de 2012-2013 — [W3C public-webcrypto (Sleevi)](https://lists.w3.org/Archives/Public/public-webcrypto/2012Dec/0025.html)
- Persistencia web: Safari borra todo el almacenamiento del sitio (OPFS incluido) tras 7 días de uso de Safari sin interacción, salvo en web apps añadidas a la pantalla de inicio. Chrome, Firefox y Safari desalojan por falta de espacio salvo que se haya concedido `persist()` — [Evolu FAQ](https://www.evolu.dev/docs/faq)

### Inferences
- **Teléfono:** SQLCipher con una clave aleatoria de 256 bits (no una contraseña humana) guardada en SecureStore (Keychain/Keystore). Opcionalmente con `requireAuthentication` para exigir biometría al abrir la app. Hay que recordar que un cambio de huellas invalida la clave, así que siempre hace falta una ruta de recuperación (ver sección 4).
- **Doble capa recomendada:**
  1. Cifrado de la base completa (SQLCipher) contra robo del teléfono.
  2. Cifrado por registro con la clave de datos (DEK) antes de sincronizar, contra fuga del servidor.
- MMKV solo sirve para preferencias no sensibles o cachés. No conviene guardar ahí la clave maestra; para eso está SecureStore.
- **Web (dashboard del portátil):** la clave no extraíble protege contra la exfiltración de los bytes de la clave, pero no contra un XSS que use la clave en caliente para descifrar. Por eso hacen falta una CSP estricta, sin scripts de terceros en el dashboard, y bloqueo por inactividad.
- Recomendado: dashboard como **PWA instalada** con `persist()`, o bien sin caché persistente: descargar el texto cifrado y descifrarlo en memoria en cada sesión. Esto evita la purga de 7 días de Safari.

### Gaps
- No pude verificar la versión exacta de SQLCipher que empaquetan expo-sqlite 57 y op-sqlite 18 (en op-sqlite está en `cpp/sqlcipher/`).
- No confirmé si `useSQLCipher` funciona también en el target web de expo-sqlite; la documentación dice "Android, iOS, and macOS".
- No obtuve una fuente de 2026 (MDN/W3C actual) para la semántica de `extractable: false` + IndexedDB. La citada es antigua, aunque el comportamiento es estándar.

## 3. Librerías criptográficas para RN/Expo + web y primitivas recomendadas

### Takeaway
Hay tres capas posibles: (a) **`react-native-quick-crypto`** (JSI/C++, API Node + WebCrypto, con Argon2id, XChaCha20-Poly1305, X25519, HKDF y AES-GCM); (b) **`@noble/ciphers` + `@noble/hashes`** (JS puro, idéntico en RN y web; lo usa Evolu); (c) **`react-native-libsodium`** (subconjunto de libsodium, **sin secretstream**). Primitivas: XChaCha20-Poly1305 para registros, Argon2id para frases de paso, X25519 (sealed box) para inscribir dispositivos y para la custodia (escrow), y HKDF/KDF para subclaves.

### Cited Findings
- `react-native-quick-crypto` 1.1.7 (2026-08-15, MIT):
  - Su tabla de cobertura marca ✅ `crypto.argon2`/`argon2Sync`, `createCipheriv`, `hkdf`, `pbkdf2`, `scrypt`, `getRandomValues`, X25519/Ed25519 y el cifrado `xchacha20-poly1305` ("AEAD with extended nonce").
  - En `subtle`: AES-GCM, ChaCha20-Poly1305, Argon2id, X25519, HKDF, PBKDF2, `wrapKey`/`unwrapKey`.
  - Fuentes: [quick-crypto implementation coverage](https://github.com/margelo/react-native-quick-crypto/blob/main/.docs/implementation-coverage.md); [crypto.margelo.com coverage](https://crypto.margelo.com/docs/introduction/coverage)
- Margelo (blog del 2026-06-11): RNQC creció hasta ser "a full Node crypto implementation on mobile, with WebCrypto, post-quantum signatures, six phases of security audit" — [Margelo blog](https://margelo.com/blog/four-years-of-react-native-quick-crypto) (vía fragmento de buscador)
- `react-native-libsodium` 1.7.0 (2026-02-09, MIT) soporta iOS, Android y web (con libsodium-wrappers). "Currently only a subset… is implemented":
  - Incluye: `crypto_aead_xchacha20poly1305_ietf_*`, `crypto_box_easy`/`crypto_box_seal`, `crypto_kdf_derive_from_key`, `crypto_pwhash` (en web solo con `loadSumoVersion`), `crypto_generichash`, `crypto_secretbox`, `crypto_sign_*` y HKDF-SHA256 inestable.
  - **No incluye `crypto_secretstream_*`.**
  - Fuente: [react-native-libsodium README](https://github.com/serenity-kit/react-native-libsodium)
- `libsodium-wrappers-sumo` 0.8.4 (2026-04-19, ISC) — [npm](https://www.npmjs.com/package/libsodium-wrappers-sumo)
- `@noble/ciphers` 2.4.0 y `@noble/hashes` 2.4.0 (2026-08-27, MIT) — [npm @noble/ciphers](https://www.npmjs.com/package/@noble/ciphers). Evolu cifra con `xchacha20poly1305` de `@noble/ciphers/chacha.js` — [Evolu Crypto.ts](https://github.com/evoluhq/evolu/blob/main/packages/common/src/Crypto.ts)
- `expo-crypto` (SDK 57) añade cifrado AES (`AESEncryptionKey.generate()`, `aesEncryptAsync`, `aesDecryptAsync`) en Android, iOS, tvOS, web y Expo Go. En web exige un origen seguro (`ERR_CRYPTO_UNAVAILABLE`) — [Expo docs: Crypto](https://docs.expo.dev/versions/latest/sdk/crypto/) ([fuente](https://github.com/expo/expo/blob/main/docs/pages/versions/unversioned/sdk/crypto.mdx))
- Referentes de producto:
  - Standard Notes (protocolo 004): XChaCha20-Poly1305, Argon2id para la clave raíz, "items keys" cifradas con la raíz y X25519 para bóvedas compartidas — [Standard Notes help](https://standardnotes.com/help/3/how-does-standard-notes-secure-my-notes) (resumen de buscador).
  - Bitwarden: PBKDF2 600.000 iteraciones por defecto, Argon2id opcional desde 2023.2.0, clave maestra estirada con HKDF y "protected symmetric key" de 512 bits envuelta con AES-256 — [Bitwarden Security Whitepaper](https://bitwarden.com/help/bitwarden-security-white-paper/)

### Inferences
- **Elección práctica para el stack Expo 57 / RN 0.86:**
  - `react-native-quick-crypto` como motor nativo. Evolu ya lo exige, así que no añade dependencia nueva si se usa Evolu.
  - `@noble/ciphers` como implementación de referencia idéntica en Next.js, para que el formato del sobre cifrado sea byte a byte el mismo en las dos plataformas.
  - libsodium solo si se necesita `crypto_box_seal` con compatibilidad exacta. En ese caso, en web usar `libsodium-wrappers(-sumo)` y en RN la versión de serenity-kit.
- **Formato de sobre sugerido** (inferencia de diseño): `version | key_id | nonce(24) | ciphertext+tag`, con XChaCha20-Poly1305 y AAD = `table|row_id|field|schema_version`. El AAD evita que un servidor malicioso intercambie textos cifrados entre filas o campos.
- **Argon2id solo para la frase de paso y la de recuperación.** Las claves de datos deben ser aleatorias (CSPRNG) y envolverse con la clave derivada (modelo de Bitwarden y Standard Notes).
- AES-256-GCM es la alternativa si se quiere usar `CryptoKey` no extraíbles de WebCrypto en el navegador, porque WebCrypto estándar no ofrece XChaCha. Implica nonces de 96 bits: conviene una clave por objeto o un contador, no nonces aleatorios masivos con la misma clave (conocimiento general, no verificado aquí).

### Gaps
- No encontré una fuente de 2026 que confirme si Hermes (RN 0.86/0.87) expone `crypto.subtle` o `crypto.getRandomValues` de forma nativa. Las fuentes apuntan a quick-crypto como polyfill.
- No verifiqué el modo AES de `expo-crypto` (¿GCM?) ni si su `AESEncryptionKey` puede ser no extraíble.
- No verifiqué los informes de auditoría de `@noble/*` ni de quick-crypto: los "six phases" se citan del blog vía buscador.

## 4. Gestión de claves, recuperación, passkeys con PRF, multidispositivo, pérdida del teléfono y custodia de 15 años

### Takeaway
La jerarquía de claves debe tener una **DEK aleatoria** (clave de la bóveda clínica) envuelta varias veces: por dispositivo (Keychain/Keystore), por frase de paso (Argon2id), por **clave de recuperación impresa** (estilo Emergency Kit / BIP39) y por una **clave pública de custodia** cuya privada está offline en manos de un tercero de confianza. **Passkeys con PRF solo como desbloqueo cómodo, nunca como única envoltura.** Hay tres motivos: el soporte desigual (fallo de Safari en flujo híbrido), el riesgo de que la usuaria borre el passkey (advertencia del coeditor de WebAuthn, feb-2026) y la obligación colombiana de conservar la historia clínica 15 años.

### Cited Findings
**WebAuthn PRF**
- Especificación W3C: PRF mapea entradas a salidas de 32 bytes asociadas a la credencial; "PRF outputs could be used as symmetric keys to encrypt user data". Se integra con `hmac-secret` de CTAP2 y en `create()` devuelve `prf.enabled` — [W3C WebAuthn: prf extension](https://w3c.github.io/webauthn/#prf-extension) (repo w3c/webauthn, HEAD 2026-09-25)
- MDN browser-compat-data (commit del 2026-10-02):
  - `create()` + prf: Chrome/Edge 116+, Firefox 139+ (135–138 parcial, sin macOS), Firefox Android 149+, Safari 18+ (incluido iOS). Android WebView: no.
  - `get()` + prf: Chrome 116+, Firefox 139+; **Safari "false"** (impl_url webkit.org/b/259934); Firefox Android: no.
  - Fuente: [MDN BCD CredentialsContainer.json](https://github.com/mdn/browser-compat-data/blob/main/api/CredentialsContainer.json)
  - **Contradice** a Corbado, que afirma: "macOS 15 enabled PRF via iCloud Keychain across Safari 18+, Chrome 132+ and Firefox 139; iOS 18.4+ fixed earlier data-loss bugs"; además Windows 11 25H2 devuelve PRF y Chrome 147 añade PRF-on-create en Windows — [Corbado: Passkeys & PRF](https://www.corbado.com/blog/passkeys-prf-webauthn) (fragmento de buscador)
- Apple Developer Forums (feb–abr 2025): PRF en el flujo **cross-device/híbrido (QR)** de Safari estaba roto. Apple dijo que estaba "partially fixed in Safari 18.2… but it's returning a **different value over hybrid** than when invoked on-device". Seguía reportado en Safari 18.4 beta — [Apple Forums thread 774112](https://developer.apple.com/forums/thread/774112)
- Android: los passkeys de Google Password Manager incluyen PRF por defecto (Chrome, Edge, Samsung Internet), y Credential Manager lo soporta en API 28+ — [Corbado](https://www.corbado.com/blog/passkeys-prf-webauthn); [lilting.ch](https://lilting.ch/en/articles/passkeys-prf-extension-encryption-risk) (fragmentos de buscador)
- Librerías RN:
  - `react-native-passkey` 3.6.2 (2026-09-08): "As of version 3.3 the PRF extension will work for Android and iOS 18+" — [react-native-passkey README](https://github.com/f-23/react-native-passkey)
  - `react-native-passkeys` 0.4.2 (módulo Expo, iOS/Android/web) define entradas PRF en su código Android — [react-native-passkeys (PasskeyOptions.kt)](https://github.com/peterferguson/react-native-passkeys)
- Advertencia de Tim Cappalli (coeditor de WebAuthn L3), difundida el 2026-02-27: usar PRF para derivar claves de cifrado multiplica el riesgo de pérdida permanente de datos. La usuaria puede borrar el passkey sin que la interfaz le avise de que protegía datos cifrados. Recomienda dejar los passkeys para autenticación — [Simon Willison, 2026-02-27](https://simonwillison.net/2026/feb/27/passkeys); [resumen lilting.ch](https://lilting.ch/en/articles/passkeys-prf-extension-encryption-risk)
- Supabase Auth: passkeys en estado **"experimental"**, que requiere `@supabase/supabase-js` ≥ 2.105.0. Usa credenciales descubribles, y cambiar el RP ID invalida todos los passkeys. La documentación no menciona PRF — [Supabase docs: Passkeys](https://supabase.com/docs/guides/auth/passkeys) ([fuente](https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/auth/passkeys.mdx)). `@supabase/supabase-js` va por la 2.117.2 (2026-09-25) — [npm](https://www.npmjs.com/package/@supabase/supabase-js)

**Patrones de recuperación en productos reales**
- 1Password usa 2SKD: la contraseña maestra se combina con una Secret Key de 128 bits que nunca va al servidor (Emergency Kit), y los Owners de equipo pueden tener copias de ciertas claves para recuperación — [1Password Security Design White Paper](https://1password.com/files/1password-white-paper.pdf) (resumen de buscador)
- Bitwarden: la clave maestra y la estirada "are never stored or transmitted to Bitwarden servers" — [Bitwarden Whitepaper](https://bitwarden.com/help/bitwarden-security-white-paper/)
- Evolu: el owner se deriva de un secreto o mnemónico BIP39, que es lo que se usa para restaurar en otro dispositivo — [Evolu Owner.ts](https://github.com/evoluhq/evolu/blob/main/packages/common/src/local-first/Owner.ts)

**Obligación legal colombiana**
- La Resolución 839 de 2017 (MinSalud, modifica la 1995/1999) exige conservar la historia clínica **mínimo 15 años desde la última atención**: 5 años en archivo de gestión y 10 en archivo central. Los plazos se duplican para víctimas de violaciones de DD. HH. o DIH. **Aplica también a profesionales independientes** que dejan de prestar servicios — [ConsultorSalud](https://consultorsalud.com/tiempo-de-retencion-y-conservacion-de-la-historia-clinica-resolucion-839-de-2017/); [Normograma Supersalud](https://normograma.supersalud.gov.co/compilacion/docs/resolucion_minsaludps_0839_2017.htm)

### Inferences
- **Jerarquía propuesta** (diseño, inferido de Bitwarden, 1Password y Standard Notes):
  - `DEK_clinica` (aleatoria, 256 bits) cifra los registros o las claves por registro.
  - `DEK_clinica` se guarda envuelta (wrapped) por:
    - (a) `K_dispositivo` en Keychain/Keystore (teléfono) o como CryptoKey no extraíble (navegador);
    - (b) `Argon2id(frase de paso)`;
    - (c) `K_recuperación`: 24 palabras o código impreso, guardado en caja fuerte;
    - (d) `X25519 sealed box` hacia la clave pública de custodia;
    - (e) opcional: salida PRF de un passkey, solo como atajo de desbloqueo.
  - El servidor guarda únicamente los blobs envueltos.
- **Inscribir un nuevo dispositivo:** el nuevo genera un par X25519 y muestra un QR con su clave pública. El dispositivo ya autorizado hace `crypto_box_seal(DEK, pk_nuevo)` y lo sube. Alternativa: escribir la frase de recuperación.
- **Pérdida o robo del teléfono:**
  1. El ladrón tiene SQLCipher más el cifrado del sistema operativo; sin desbloqueo ni biometría no hay acceso a la clave del Keystore.
  2. La terapeuta revoca la sesión y el dispositivo desde el portátil (borra el refresh token y la envoltura (a) de ese dispositivo).
  3. Los datos siguen disponibles en el relay o servidor como texto cifrado y se recuperan con la frase o clave de recuperación.
  4. Rotar la DEK solo es imprescindible si se sospecha que el teléfono estaba desbloqueado. Para que sea barato, conviene versionar claves (`key_id`) y cifrar los blobs grandes con claves por archivo envueltas por la DEK: rotar implica reenvolver claves, no recifrar vídeos.
- **"Romper el vidrio" / custodia legal:** dada la obligación de 15 años y que aplica a profesionales independientes, perder la clave equivale a **perder la historia clínica**, lo que sería un incumplimiento normativo. Opciones:
  - (i) Envoltura sellada hacia la clave de un tercero (colega fonoaudióloga, abogado o notaría). La clave privada se imprime o se guarda en llave hardware y se custodia en sobre sellado.
  - (ii) Shamir 2-de-3 entre la terapeuta, un familiar y un colega.
  - (iii) Exportaciones periódicas cifradas a un medio offline.
  - Cualquiera de estas debe documentarse en la política de tratamiento de datos. Es inferencia: no encontré norma que regule específicamente la custodia de claves.
- **PRF en el dashboard web** (llave en el iPhone usada desde el portátil por QR/híbrido) es justo el flujo con fallos documentados de valores distintos. Por eso: PRF solo envuelve una copia de la DEK; si falla, se cae a la frase de paso; y antes de confiar en un PRF hay que verificar que descifra un "canario".
- **Supabase Auth con passkeys** (experimental) sirve para autenticar, pero no expone PRF. Si se quiere PRF, habría que hacer una ceremonia WebAuthn propia (con `react-native-passkey` o `navigator.credentials`) con el mismo RP ID. Más simple: usar Supabase Auth solo para la sesión y la frase de paso más el Keystore para las claves.

### Gaps
- No pude resolver la contradicción sobre `get()`+PRF en Safari (MDN BCD dice no soportado; Corbado y Apple dicen soportado con iCloud Keychain desde 18). Tampoco confirmé si el fallo del flujo híbrido está totalmente corregido en iOS/macOS 26.
- No encontré la tabla de passkeys.dev ni la de caniuse (sitios bloqueados).
- No encontré norma colombiana que regule la custodia o depósito de claves de historias clínicas electrónicas cifradas, ni qué debe hacer exactamente una profesional independiente con las historias al cesar (la Res. 839 la incluye en su ámbito, pero no leí el artículo completo).

## 5. Cifrado de archivos grandes (audio/vídeo de las sesiones) y fuga de metadatos

### Takeaway
Hay que cifrar **en el teléfono, por fragmentos y con una clave por archivo**: en web con libsodium `secretstream` (XChaCha20-Poly1305) y en RN con XChaCha20-Poly1305 o AES-GCM por fragmentos de quick-crypto (react-native-libsodium no tiene secretstream). Después se sube el texto cifrado a Supabase Storage o R2 con nombres aleatorios. El tamaño, la hora y la cantidad de archivos siguen filtrándose salvo que se añada padding.

### Cited Findings
- libsodium `crypto_secretstream_xchacha20poly1305`:
  - `init_push` genera una cabecera de 24 bytes y `push` cifra cada fragmento.
  - La etiqueta `TAG_FINAL` marca el último fragmento, lo que detecta truncamiento.
  - Admite re-keying y procesa el archivo sin cargarlo entero en memoria.
  - Fuente: [libsodium docs: secretstream](https://doc.libsodium.org/secret-key_cryptography/secretstream) (vía buscador)
- `react-native-libsodium` no implementa `crypto_secretstream_*` (lista de funciones del README) — [react-native-libsodium](https://github.com/serenity-kit/react-native-libsodium)
- `react-native-quick-crypto` ofrece `createCipheriv` (incluido `xchacha20-poly1305`) y AES-GCM — [quick-crypto coverage](https://github.com/margelo/react-native-quick-crypto/blob/main/.docs/implementation-coverage.md)
- Evolu aplica padding PADMÉ "to obscure their actual size" contra el análisis de tráfico — [Evolu Privacy](https://github.com/evoluhq/evolu/blob/main/apps/web/src/app/%28docs%29/docs/privacy/page.mdx)
- Bitwarden Send pone la clave en el fragmento `#` de la URL, que "is never sent to the server"; el servidor solo recibe el ID — [Bitwarden Send – How it works](https://bitwarden.com/blog/bitwarden-send-how-it-works/)

### Inferences
- **Diseño:**
  - Cada grabación tiene una `file_key` aleatoria, envuelta por la DEK y guardada en el registro clínico cifrado de la sesión.
  - El archivo se cifra en fragmentos de 64 KB a 1 MB con una construcción tipo STREAM: nonce = prefijo aleatorio ‖ contador ‖ bandera de último fragmento, AAD = `file_id`. En web se puede usar directamente secretstream.
  - Se sube con upload resumible (útil con mala conectividad) a un bucket privado, con ruta `blobs/<uuid-aleatorio>`, sin ID de paciente ni fecha en la ruta.
- **Metadatos que siguen expuestos:** tamaño (que permite estimar la duración), hora de subida, número de grabaciones por cuenta e IP. Mitigaciones:
  - Rellenar a cubetas de tamaño (PADMÉ o múltiplos de 1 MB).
  - Subir en lotes por Wi-Fi al volver a casa, lo que además ahorra datos móviles.
  - Generar miniaturas en el dispositivo y cifrarlas como blobs aparte.
  - Quitar el EXIF/GPS antes de cifrar.
- Las grabaciones de voz de menores son el dato más sensible del sistema: conviene política de retención y borrado propia, y consentimiento explícito del acudiente.
- Para no agotar la RAM con vídeos largos, leer el archivo por rangos (en vez de cargarlo entero en JS) y escribir el texto cifrado en un archivo temporal antes de subirlo.

### Gaps
- No verifiqué el rendimiento de quick-crypto ni de noble cifrando vídeo de cientos de MB en gama media Android.
- No verifiqué el límite de tamaño ni los uploads resumibles (TUS) de Supabase Storage en 2026 (sitio bloqueado).

## 6. Búsqueda y reportes sobre datos cifrados

### Takeaway
Con un solo usuario y volúmenes pequeños, **todo el cómputo (búsqueda, filtros, estadísticas, gráficas de progreso) debe hacerse en el cliente tras descifrar**: FTS5 en el SQLite local del teléfono y descifrado en memoria en el navegador para el dashboard. Los índices ciegos (HMAC) solo se justifican si el **servidor** necesita buscar por igualdad, y filtran igualdad y frecuencia.

### Cited Findings
- RxDB: los campos cifrados "cannot be used as operators in queries". Proponen replicar a un almacenamiento en memoria no cifrado y consultar ahí — [RxDB Encryption](https://rxdb.info/encryption.html)
- Índice ciego (CipherSweet): es un hash con clave del texto plano; "Blind indexing leaks that rows have the same value… frequency analysis". Tiene la misma fuga que el cifrado determinista. CipherSweet usa claves distintas por índice y campo, y Bloom filters para búsquedas difusas — [CipherSweet security](https://ciphersweet.paragonie.com/security); [CipherSweet blind index](https://ciphersweet.paragonie.com/internals/blind-index); [ankane/blind_index](https://github.com/ankane/blind_index)
- expo-sqlite expone la opción de configuración `enableFTS` — [Expo SQLite docs](https://github.com/expo/expo/blob/main/docs/pages/versions/unversioned/sdk/sqlite.mdx)
- Las bases locales de Evolu y PowerSync son SQLite completas en el cliente, consultables con SQL (Kysely en Evolu) — [Evolu FAQ](https://www.evolu.dev/docs/faq); [PowerSync Data Encryption](https://github.com/powersync-ja/powersync-docs/blob/main/client-sdks/advanced/data-encryption.mdx)

### Inferences
- Una fonoaudióloga a domicilio maneja del orden de decenas a cientos de pacientes activos y miles de sesiones o ensayos (estimación, no fuente). Eso cabe sin problema en el SQLite local (teléfono) o en memoria del navegador (dashboard) para hacer agregaciones: porcentaje de aciertos por objetivo y por sesión, asistencia, ingresos.
- Con E2EE, el servidor **no puede** calcular reportes ni alertas clínicas ("paciente sin progreso"). Cualquier automatización del servidor sobre contenido clínico rompe el modelo. Las alertas se calculan en el cliente y se muestran localmente.
- **Índice ciego útil y acotado:** `HMAC(K_idx, telefono_E164)` para deduplicar pacientes o enlazar los webhooks entrantes de WhatsApp con un registro sin guardar el teléfono en claro en la tabla clínica. Pero el teléfono ya es visible en la tabla de recordatorios (sección 7), así que el beneficio es menor. No usar índices ciegos sobre diagnósticos ni sobre otros campos de baja cardinalidad, porque el análisis de frecuencia los revela.

### Gaps
- No medí el rendimiento de FTS5 sobre SQLCipher en RN ni de un SQLite-WASM cifrado en Safari.

## 7. Patrón de conocimiento dividido (split-knowledge): qué debe ver el servidor para WhatsApp y qué queda E2EE

### Takeaway
Hay que adoptar el modelo de **Proton Calendar**, no el de Tuta: el contenido es E2EE y el servidor ve solo los metadatos mínimos para notificar. Para WhatsApp el servidor necesita en claro: **teléfono E.164 del acudiente, nombre de pila para la plantilla, fecha y hora con zona horaria, estado de la cita, ID de plantilla y registro de consentimiento (opt-in)**. Todo lo demás (identidad completa del niño, dirección, diagnóstico, notas, puntajes, grabaciones) queda E2EE. Meta retiene los mensajes hasta 30 días con claves que gestiona Meta, así que el contenido de las plantillas debe ser mínimo y no clínico.

### Cited Findings
- **Proton Calendar:** cifra E2EE el título, la descripción, la ubicación y los asistentes. Para enviar notificaciones y alarmas, el servidor accede a inicio y fin con zona horaria, reglas de repetición, fechas de creación y actualización y estado (p. ej. cancelado) — [Proton Calendar Privacy Policy](https://proton.me/calendar/privacy-policy)
- **Tuta Calendar:** cifra también las alarmas y notificaciones, de modo que el servidor no conoce la hora de los eventos (según Tuta) — [Tuta blog](https://tuta.com/blog/free-encrypted-calendar)
- **WhatsApp Cloud API:** los mensajes tienen "maximum retention period of 30 days"; están cifrados en reposo, pero "Cloud API manages the encryption/decryption keys on behalf of the business". Meta afirma que no usa esos mensajes para anuncios. Existe la opción "Local Storage" para fijar el país de los datos en reposo — [Meta for Developers: Data Privacy & Security](https://developers.facebook.com/documentation/business-messaging/whatsapp/data-privacy-and-security)
- **Evolu** separa datos locales y sincronizados (tablas con prefijo `_`, instancias con `transports: []`). Sirve de modelo de datos que nunca salen del dispositivo — [Evolu FAQ](https://www.evolu.dev/docs/faq)

### Inferences
- **Tabla server-visible `reminder_jobs`** (Supabase/Postgres, acceso solo desde NestJS):

  | Campo | Motivo |
  |---|---|
  | `job_id` (UUID aleatorio) | identificador |
  | `contact_ref` (UUID aleatorio, sin relación derivable con el ID clínico) | enlazar con el contacto |
  | `phone_e164` | entrega por WhatsApp |
  | `display_name` (nombre de pila del acudiente, no del niño) | plantilla |
  | `starts_at` + `tz` | plantilla y programación |
  | `template` (código) | plantilla |
  | `status` (programado/enviado/confirmado/cancelado) | estado |
  | `consent_at` | evidencia de opt-in |
  | `purge_after` | TTL de borrado |

  - **No incluir** dirección, nombre ni apellidos del niño, diagnóstico, tipo de terapia ni notas.
  - La dirección no hace falta para WhatsApp. Si se quiere ruta o mapa, se calcula en el teléfono.
- **Flujo:**
  1. Al agendar, el **cliente** (teléfono o dashboard), que tiene los datos en claro, genera la "proyección de mensajería" y la envía a NestJS.
  2. El servidor programa y envía con la plantilla de Meta.
  3. Las respuestas del webhook (confirmar o cancelar) actualizan `status` y el cliente las sincroniza a la cita cifrada.
  4. Al dar de alta al paciente, el cliente ordena borrar `reminder_jobs` y `contact_ref`. Además, un trabajo de purga en el servidor borra todo con `purge_after` vencido (p. ej. 30 a 90 días después de la última cita).
- **Plantillas neutras:** "Hola {{1}}, le recordamos la cita del {{2}} a las {{3}}. Responda 1 para confirmar". Hay que evitar "terapia de lenguaje", "fonoaudiología" o el nombre del niño. El propio perfil de WhatsApp Business ya revela que es un servicio de salud, así que no añadir más.
- **Primer contacto:** el servidor necesita el teléfono antes de que exista el paciente. Puede ser un "lead" efímero con TTL corto y solo teléfono y nombre.
- **Corolario honesto para comunicar al desarrollador:** la app será "zero-knowledge" **para el contenido clínico**, no para la agenda. El servidor sabrá que el número X tiene cita el día Y a la hora Z con esta profesional. Es el mismo compromiso que Proton Calendar documenta públicamente.

### Gaps
- No verifiqué si la opción "Local Storage" de Cloud API incluye algún país de Latinoamérica ni si aplica a Colombia.
- No verifiqué los requisitos de Meta 2026 sobre plantillas "utility" con contenido de salud. Otra nota del equipo cubre WhatsApp en detalle: `whatsapp_cloud_api_2026.md`.

## 8. Modelo de amenazas: qué protege y qué no protege el E2EE en este contexto

### Takeaway
El E2EE protege muy bien contra **fuga o filtración de la base de datos, un administrador o proveedor curioso (Supabase, Vercel, el propio desarrollador) y solicitudes legales dirigidas al operador**. **No** protege contra un dispositivo desbloqueado comprometido, malware o XSS en el cliente, la pérdida de claves (riesgo de **disponibilidad**, crítico por los 15 años), los metadatos de la agenda ni lo que se envía a Meta.

### Cited Findings
- El relay de Evolu ve OwnerId, timestamps, blobs cifrados e IP. Los timestamps revelan actividad, y la mitigación propuesta es una cola local con vaciado aleatorio, a costa de perder el tiempo real — [Evolu Privacy](https://github.com/evoluhq/evolu/blob/main/apps/web/src/app/%28docs%29/docs/privacy/page.mdx)
- 2SKD de 1Password: protege "from Master Password cracking attempts in the event that data is captured from their servers" — [1Password White Paper](https://1password.com/files/1password-white-paper.pdf) (resumen de buscador)
- WhatsApp Cloud API: Meta gestiona las claves y retiene hasta 30 días — [Meta Data Privacy & Security](https://developers.facebook.com/documentation/business-messaging/whatsapp/data-privacy-and-security)
- SecureStore + `requireAuthentication`: la clave se pierde si cambian las biometrías; en Android los datos se pierden al desinstalar la app — [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)
- La Ley 1581 de 2012 clasifica los datos de salud como **sensibles** y regula las transferencias y transmisiones, incluidas las internacionales — [Medesk: protección de datos de pacientes en Colombia](https://www.medesk.net/es/blog/proteccion-datos-pacientes-colombia/) (fuente secundaria); [Concepto Supersalud 149773/2020](https://normograma.supersalud.gov.co/compilacion/docs/concepto_supersalud_0149773_2020.htm)

### Inferences
| Amenaza | ¿Protege E2EE + SQLCipher? | Medidas adicionales |
|---|---|---|
| Robo o pérdida del teléfono bloqueado | Sí (SQLCipher + clave en Keystore + cifrado del SO) | Bloqueo biométrico de la app, borrado remoto de la sesión, revocar la envoltura del dispositivo |
| Robo del teléfono desbloqueado o con la app abierta | Parcial | Auto-bloqueo por inactividad; no cachear grabaciones descifradas |
| Fuga o volcado de la BD (Supabase o relay), backup filtrado | **Sí**, solo texto cifrado | Se filtra la tabla `reminder_jobs` (teléfonos y horas): minimizarla y purgarla |
| Insider o desarrollador malicioso con acceso al servidor | Sí para el contenido; **no** si puede publicar código malicioso en el cliente web | Builds reproducibles o firmados, CSP, SRI; la app móvil firmada en tiendas reduce el riesgo |
| Servidor web comprometido que sirve JS malicioso al dashboard | **No** (problema clásico del E2EE en web) | Considerar el dashboard como PWA con actualización controlada |
| Meta ve el contenido de los mensajes | No aplica: Meta gestiona las claves de Cloud API | Plantillas neutras y mínimas |
| Requerimiento legal al operador o proveedor | Sí: solo puede entregar texto cifrado y metadatos | La terapeuta, como custodia, sigue obligada a entregar la historia cuando la ley lo exija |
| Pérdida de claves o muerte de la profesional | **El E2EE empeora este riesgo** | Recuperación impresa + custodia sellada + exportaciones (sección 4) |
| Análisis de tráfico o metadatos | Parcial | Padding, envío en lotes, IDs aleatorios |

- El riesgo dominante en una práctica unipersonal no es un atacante sofisticado sino el **teléfono perdido sin copia** o la **frase olvidada**. El diseño debe priorizar la recuperación tanto como la confidencialidad.

### Gaps
- No revisé jurisprudencia ni conceptos de la SIC sobre si un proveedor que solo guarda texto cifrado es "encargado del tratamiento" bajo la Ley 1581, ni cómo encaja esto con la transferencia internacional (servidores fuera de Colombia).

## 9. Especificidades de Supabase: RLS, Vault/pgsodium, columnas solo-cifradas, Auth con passkeys

### Takeaway
Supabase sirve como **almacén de texto cifrado + Auth + Storage**: RLS es defensa en profundidad (aísla entre cuentas), pero no aporta confidencialidad frente a Supabase. **Vault** es cifrado del lado servidor con una clave que gestiona Supabase, útil para el token de Meta y no para datos clínicos. **pgsodium está en "pending deprecation"**. Los passkeys de Auth son **experimentales** y sin PRF documentado.

### Cited Findings
- pgsodium: "Supabase **does not recommend** the usage of pgsodium as it will be deprecated. Use Supabase Vault instead". Tampoco recomiendan su Transparent Column Encryption "due to their high level of operational complexity and misconfiguration risk". Los proyectos están "encrypted at rest by default" — [Supabase docs: pgsodium (pending deprecation)](https://supabase.com/docs/guides/database/extensions/pgsodium)
- Vault: AEAD (basado en libsodium) en disco y la vista `vault.decrypted_secrets` que descifra al vuelo. La clave raíz "is never stored in the database". Supabase "creates and manages a unique encryption key for each project in our secured backend systems", y al migrar con pg_dump hay que copiar la clave raíz. No depende de pgsodium — [Supabase docs: Vault](https://supabase.com/docs/guides/database/vault)
- Passkeys en Supabase Auth: "experimental", `supabase-js` ≥ 2.105.0, RP ID y orígenes configurables (incluido `android:apk-key-hash:` para apps Android), y cambiar el RP ID invalida los passkeys — [Supabase docs: Passkeys](https://supabase.com/docs/guides/auth/passkeys)
- Triplit se unió a Supabase para mejorar las integraciones con ElectricSQL, Zero y PowerSync. Supabase no tiene sync engine propio con E2EE — [Supabase blog](https://supabase.com/blog/triplit-joins-supabase)

### Inferences
- **Esquema sugerido:**
  - `records(id uuid, owner uuid, kind text, key_id int, ciphertext bytea, updated_at timestamptz, deleted bool)`, con `kind` genérico ("item") para no revelar si es una evaluación, una nota o un puntaje.
  - RLS `owner = auth.uid()`.
  - Bucket privado de Storage para blobs.
  - `reminder_jobs` sin acceso desde el cliente anónimo, solo con service role desde NestJS.
  - El token de Meta se guarda en Vault o en variables de entorno de NestJS.
- Si se usa Evolu, Supabase quedaría solo para Auth, `reminder_jobs` y Storage de blobs; el relay de Evolu sería otro servicio (Docker), autohospedado o en un VPS.
- Si se usa PowerSync, las Sync Rules solo pueden filtrar por columnas en claro (`owner`), lo que basta para un usuario único.

### Gaps
- No pude abrir supabase.com para confirmar el cronograma de deprecación de pgsodium en 2026; la documentación (HEAD 2026-10-02) sigue diciendo "pending deprecation".
- No verifiqué la región de alojamiento de Supabase más cercana a Colombia ni sus implicaciones legales.

## 10. Pruebas de conocimiento cero (ZK-SNARKs): ¿tienen uso realista aquí?

### Takeaway
Prácticamente no, por ahora. Los casos imaginables (probar ante un pagador que hubo una sesión sin revelar datos clínicos, o asistencia verificable) **no tienen un verificador que las acepte**: ni EPS, ni aseguradoras, ni RIPS en Colombia consumen pruebas ZK. Además, añaden complejidad, costo de prueba y, si se anclan en blockchain, metadatos permanentes. Para el problema real basta con firmas digitales y un registro de auditoría con cadena de hashes.

### Cited Findings
- Usos propuestos de ZKP en salud: confirmar elegibilidad, consentimiento o un puntaje sin revelar la historia completa; protocolos académicos sobre Hyperledger Fabric. Límites: "Proving complex analytics at scale remains computationally intensive"; recomiendan pilotos acotados — [Meegle: ZKP for healthcare data](https://www.meegle.com/en_us/topics/zero-knowledge-proofs/zero-knowledge-proof-for-healthcare-data); [IJEECS: ZKP authentication on Hyperledger Fabric](https://ijeecs.iaescore.com/index.php/IJEECS/article/view/38398); [StarkWare: ZK use cases](https://starkware.co/blog/scaling-blockchains-with-zero-knowledge-proofs/zk-proofs-applications-and-use-cases/) (resúmenes de buscador; fuentes de calidad desigual)
- Proton, Bitwarden, Standard Notes y Evolu llaman "zero-knowledge" a una arquitectura de **cifrado** (el servidor no tiene claves) y no usan SNARKs para eso — [Bitwarden Whitepaper](https://bitwarden.com/help/bitwarden-security-white-paper/); [Standard Notes](https://standardnotes.com/help/3/how-does-standard-notes-secure-my-notes); [Evolu Privacy](https://github.com/evoluhq/evolu/blob/main/apps/web/src/app/%28docs%29/docs/privacy/page.mdx)

### Inferences
- **"Sesión ocurrió" verificable:**
  - Alternativa simple: la confirmación por WhatsApp del acudiente, que ya queda registrada, más una firma en el teléfono al final de la visita. Se guarda dentro del registro cifrado con hash y sello de tiempo, opcionalmente con un sello de tiempo RFC 3161.
  - Un ZK solo aportaría algo si un tercero quisiera verificar *sin* ver la firma ni el registro, y ese tercero no existe hoy.
- **Integridad de la historia** (que no se alteró después): un log append-only con cadena de hashes y firmas Ed25519 por entrada, como hace Jazz classic, que firma cada transacción. Da evidencia de manipulación sin ZK.
- **Experiencia previa del desarrollador con Midnight/Compact:** podría tener sentido en un futuro con pagadores o aseguradoras que acepten credenciales verificables (p. ej. "este paciente completó N sesiones" para un reembolso) o en investigación con datos agregados. Para un MVP es sobreingeniería, y anclar eventos de pacientes (aunque sea con hashes) en una cadena pública crea metadatos irrevocables, en tensión con la supresión de datos y la minimización.

### Gaps
- No busqué si alguna EPS o aseguradora colombiana acepta credenciales verificables o pruebas ZK. Supongo que no; no está verificado.

## 11. Recomendación de patrón de arquitectura (síntesis con trade-offs)

### Takeaway
La recomendación es un **"E2EE local-first con proyección mínima de mensajería"** con una sola DEK por cuenta y envolturas múltiples (dispositivo, frase, recuperación impresa, custodia sellada y PRF opcional), y blobs cifrados por fragmentos en Storage. Para el sync hay dos variantes: **(A) Evolu** para el contenido clínico, que da E2EE listo y relay ciego, si se acepta su volatilidad; **(B) Supabase + PowerSync** (o un sync propio) con sobres cifrados por fila, si se prioriza la madurez y la alineación con el stack. En las dos, NestJS solo ve `reminder_jobs`.

### Cited Findings
- Evolu: E2EE obligatorio, RN/Expo con expo-sqlite + quick-crypto, web con `@evolu/react-web` (no Expo web) y relay MIT autohospedable — [Evolu Privacy](https://github.com/evoluhq/evolu/blob/main/apps/web/src/app/%28docs%29/docs/privacy/page.mdx); [Evolu Local-first](https://www.evolu.dev/docs/local-first); [Evolu Relay](https://www.evolu.dev/docs/relay)
- PowerSync: SQLCipher en RN (op-sqlite) y SQLite3MultipleCiphers en web, sin E2EE incorporado; el servicio tiene licencia FSL — [PowerSync Data Encryption](https://github.com/powersync-ja/powersync-docs/blob/main/client-sdks/advanced/data-encryption.mdx); [npm @powersync/service-core](https://www.npmjs.com/package/@powersync/service-core)
- Jazz v2 hace el servidor confiable y deja las columnas cifradas como pregunta abierta; classic está en mantenimiento — [Jazz blog](https://github.com/garden-co/jazz/blob/main/docs/content/blog/what-we-learned-from-classic-jazz.mdx); [Jazz SPEC](https://github.com/garden-co/jazz/blob/main/crates/jazz/SPEC/7_authorization.md)
- Proton Calendar como precedente de contenido E2EE con metadatos de agenda visibles — [Proton Calendar Privacy Policy](https://proton.me/calendar/privacy-policy)
- La obligación de conservar 15 años aplica a profesionales independientes — [Res. 839/2017 (ConsultorSalud)](https://consultorsalud.com/tiempo-de-retencion-y-conservacion-de-la-historia-clinica-resolucion-839-de-2017/)
- Advertencia sobre PRF como única clave — [Simon Willison / Cappalli](https://simonwillison.net/2026/feb/27/passkeys)

### Inferences
- **Componentes:**
  1. **Teléfono (Expo 57, build de desarrollo, no Expo Go):** SQLite cifrado (SQLCipher) como fuente de verdad offline; cifrado de registros con XChaCha20-Poly1305 (quick-crypto o noble); grabaciones cifradas por fragmentos y encoladas para subir por Wi-Fi.
  2. **Sync del contenido clínico:**
     - (A) Relay de Evolu autohospedado más un segundo relay de respaldo.
     - (B) Tabla `records(ciphertext)` en Supabase sincronizada con PowerSync (o un sync propio "outbox + pull por `updated_at`", suficiente para un usuario único con LWW por registro).
  3. **Dashboard Next.js (Vercel):** descifra en el navegador. Clave no extraíble en sesión, PWA opcional, CSP estricta y sin analítica de terceros en las rutas clínicas.
  4. **NestJS + Supabase:** Auth, `reminder_jobs` (en claro, mínimo y con TTL), webhooks de Meta, Vault para los secretos de Meta y Storage para los blobs cifrados.
  5. **Claves:** DEK con envolturas por dispositivo, frase Argon2id, clave de recuperación impresa, custodia X25519 sellada y PRF opcional; inscripción de dispositivos por QR con sealed box.
  6. **Exportación** anual o periódica en formato abierto (SQLite/JSON + medios), cifrada con la clave de recuperación, a un disco offline. Responde a los 15 años de retención y al riesgo de proveedor (caso Skiff).
- **Trade-offs explícitos:**
  - (a) Sin búsquedas ni reportes en el servidor.
  - (b) Más complejidad de onboarding: hay que imprimir el kit de recuperación.
  - (c) Riesgo de pérdida irreversible si fallan todas las envolturas.
  - (d) Se filtran metadatos de agenda al servidor y a Meta.
  - (e) Evolu: API inestable, proyecto pequeño y relay como servicio adicional.
  - (f) PowerSync o sync propio: criptografía y formato a mantener por el desarrollador, y licencia FSL del servicio si se autohospeda.
  - (g) Cualquier E2EE web depende de la integridad del JS servido.
- **Orden de implementación sugerido:**
  1. Proyección de mensajería y `reminder_jobs` (no depende del E2EE).
  2. Formato de sobre y jerarquía de claves con pruebas de recuperación.
  3. Sync.
  4. Blobs.
  5. PRF opcional.

### Gaps
- No hice pruebas empíricas (benchmarks ni prototipo) de Evolu frente a PowerSync en Expo SDK 57 / RN 0.86. En npm, `react-native` latest es la 0.87.1 (2026-08-26) y `expo` la 57.0.26 (2026-09-29) — [npm react-native](https://www.npmjs.com/package/react-native); [npm expo](https://www.npmjs.com/package/expo). No verifiqué la compatibilidad declarada de cada librería con exactamente RN 0.86.
- No hay una revisión jurídica de si el esquema de custodia propuesto satisface la normativa colombiana sobre la custodia de historias clínicas.
