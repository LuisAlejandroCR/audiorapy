// SettingsView.tsx: encrypted backup export/import, chain status, and connection settings
// (scheduling API and local Ollama). Exports contain ciphertext only.
import { useState } from 'react';
import { isLoopback } from '../lib/ai.ts';
import {
  loadAiSettings,
  loadApiSettings,
  saveAiSettings,
  saveApiSettings,
} from '../lib/settings.ts';
import { clearVault } from '../lib/storage.ts';
import type { Unlocked } from '../App.tsx';

export function SettingsView({ unlocked, chainOk }: { unlocked: Unlocked; chainOk: boolean }) {
  const [api, setApi] = useState(loadApiSettings);
  const [ai, setAi] = useState(loadAiSettings);
  const [saved, setSaved] = useState(false);

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(unlocked.file, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `audiorapy-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
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
        </div>
      </section>

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
