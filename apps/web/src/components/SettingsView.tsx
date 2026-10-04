// SettingsView.tsx: encrypted backup export/import, chain status, and connection settings
// (scheduling API and local Ollama). Exports contain ciphertext only.
import { useState, type FormEvent } from 'react';
import { unlockWithRecovery } from '@audiorapy/domain';
import { isLoopback } from '../lib/ai.ts';
import type { JourneyFlags } from '../lib/journey.ts';
import { formatStampEs, localDate } from '../lib/stats.ts';
import {
  loadAiSettings,
  loadApiSettings,
  saveAiSettings,
  saveApiSettings,
} from '../lib/settings.ts';
import { clearVault } from '../lib/storage.ts';
import type { Unlocked } from '../App.tsx';

export function SettingsView({
  unlocked,
  chainOk,
  flags,
  onFlags,
}: {
  unlocked: Unlocked;
  chainOk: boolean;
  flags: JourneyFlags;
  onFlags: (patch: JourneyFlags) => void;
}) {
  const [api, setApi] = useState(loadApiSettings);
  const [ai, setAi] = useState(loadAiSettings);
  const [saved, setSaved] = useState(false);

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(unlocked.file, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `audiorapy-respaldo-${localDate(new Date())}.json`;
    // Firefox needs the link in the document; revoking at once can cancel the download in Safari.
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
    onFlags({ backupAt: new Date().toISOString() });
  };

  return (
    <>
      <section className="card" aria-labelledby="backup-title">
        <h2 id="backup-title">Respaldo</h2>
        <p>
          {unlocked.file.log.length} registros cifrados · bitácora{' '}
          {chainOk ? 'íntegra' : 'con errores'} · bóveda {unlocked.file.header.fingerprint}
        </p>
        <p className="muted">
          El archivo solo contiene texto cifrado. Para restaurarlo en otro equipo necesitas tu frase
          de paso o la clave de recuperación.
        </p>
        <div className="row">
          <button type="button" onClick={exportBackup}>
            Descargar respaldo cifrado
          </button>
          {flags.backupAt && (
            <span className="muted">Último respaldo: {formatStampEs(flags.backupAt)}</span>
          )}
        </div>
      </section>

      <RecoveryCheck
        verified={flags.recoveryVerified === true}
        check={(phrase) => {
          const dek = unlockWithRecovery(unlocked.file.header, phrase);
          dek?.fill(0);
          return dek !== null;
        }}
        onVerified={() => onFlags({ recoveryVerified: true })}
      />

      <section className="card" aria-labelledby="conn-title">
        <h2 id="conn-title">Conexiones</h2>
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            saveApiSettings(api);
            saveAiSettings(ai);
            setSaved(true);
          }}
        >
          <label>
            Dirección de la API de agenda
            <input
              value={api.baseUrl}
              onChange={(e) => (setApi({ ...api, baseUrl: e.target.value }), setSaved(false))}
            />
          </label>
          <label>
            Token del dashboard (se borra al cerrar la pestaña)
            <input
              type="password"
              value={api.token}
              onChange={(e) => (setApi({ ...api, token: e.target.value }), setSaved(false))}
            />
          </label>
          <label>
            Ollama local
            <input
              value={ai.baseUrl}
              onChange={(e) => (setAi({ ...ai, baseUrl: e.target.value }), setSaved(false))}
            />
          </label>
          {!isLoopback(ai.baseUrl) && (
            <p role="alert" className="error-text">
              Solo se permite un Ollama en este mismo equipo (localhost): las notas clínicas no
              salen de tu computador.
            </p>
          )}
          <label>
            Modelo
            <input
              value={ai.model}
              onChange={(e) => (setAi({ ...ai, model: e.target.value }), setSaved(false))}
            />
          </label>
          <button type="submit">Guardar</button>
          {saved && <p role="status">Guardado.</p>}
        </form>
      </section>

      <section className="card" aria-labelledby="danger-title">
        <h2 id="danger-title">Este navegador</h2>
        <p className="muted">
          Borra la copia cifrada de este navegador. Descarga antes un respaldo.
        </p>
        <button
          type="button"
          className="danger"
          onClick={() => {
            if (
              window.confirm(
                '¿Borrar la bóveda de este navegador? Sin respaldo no se puede recuperar.',
              )
            ) {
              clearVault();
              window.location.reload();
            }
          }}
        >
          Borrar de este navegador
        </button>
      </section>
    </>
  );
}

function RecoveryCheck({
  verified,
  check,
  onVerified,
}: {
  verified: boolean;
  check: (phrase: string) => boolean;
  onVerified: () => void;
}) {
  const [phrase, setPhrase] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    await new Promise((r) => setTimeout(r, 30));
    const ok = check(phrase);
    setBusy(false);
    if (ok) {
      setPhrase('');
      onVerified();
    } else setError('Esa no es la clave de esta bóveda. Revisa el orden de las palabras.');
  };

  return (
    <section className="card" aria-labelledby="recovery-title">
      <h2 id="recovery-title">Clave de recuperación</h2>
      {verified ? (
        <p className="banner ok">Comprobada: tu papel abre esta bóveda.</p>
      ) : (
        <form className="stack" onSubmit={submit}>
          <p className="muted">
            Escribe las 24 palabras de tu papel para comprobar que abren esta bóveda. No se guardan.
          </p>
          <label>
            Las 24 palabras de tu clave
            <textarea
              rows={3}
              autoComplete="off"
              spellCheck={false}
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
            />
          </label>
          {error && (
            <p role="alert" className="error-text">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy || phrase.trim() === ''}>
            {busy ? 'Comprobando…' : 'Comprobar mi clave'}
          </button>
        </form>
      )}
    </section>
  );
}
