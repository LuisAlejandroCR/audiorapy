// VaultGate.tsx: create a vault (passphrase + printed recovery phrase), unlock it, or restore one
// from an encrypted backup file in a clean browser.
import { useState, type FormEvent } from 'react';
import {
  createVault,
  MIN_PASSPHRASE_LENGTH,
  unlockWithPassphrase,
  unlockWithRecovery,
} from '@audiorapy/domain';
import { clearVault, newVaultFile, parseVaultFile, type VaultFile } from '../lib/storage.ts';

interface Props {
  stored: VaultFile | null;
  onOpen: (file: VaultFile, dek: Uint8Array) => void;
  onForget: () => void;
}

/** Lets React paint the "working" state before the synchronous key derivation blocks the thread. */
const nextFrame = () => new Promise((r) => setTimeout(r, 30));

export function VaultGate({ stored, onOpen, onForget }: Props) {
  const [pending, setPending] = useState<VaultFile | null>(stored);
  const [created, setCreated] = useState<{
    file: VaultFile;
    dek: Uint8Array;
    phrase: string;
  } | null>(null);

  if (created) {
    return (
      <RecoveryPhrase phrase={created.phrase} onDone={() => onOpen(created.file, created.dek)} />
    );
  }
  if (pending) {
    return (
      <Unlock
        file={pending}
        onOpen={onOpen}
        onForget={() => {
          if (stored) clearVault();
          setPending(null);
          onForget();
        }}
      />
    );
  }
  return <Create onCreated={setCreated} onRestore={setPending} />;
}

function Create({
  onCreated,
  onRestore,
}: {
  onCreated: (v: { file: VaultFile; dek: Uint8Array; phrase: string }) => void;
  onRestore: (file: VaultFile) => void;
}) {
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (pass.length < MIN_PASSPHRASE_LENGTH)
      return setError(`Usa al menos ${MIN_PASSPHRASE_LENGTH} caracteres.`);
    if (pass !== confirm) return setError('Las dos frases no coinciden.');
    setBusy(true);
    setError(null);
    await nextFrame();
    const vault = createVault(pass);
    onCreated({ file: newVaultFile(vault.header), dek: vault.dek, phrase: vault.recoveryPhrase });
  };

  const restore = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = parseVaultFile(JSON.parse(await file.text()));
      if (!parsed) return setError('Ese archivo no es un respaldo de Audiorapy.');
      onRestore(parsed);
    } catch {
      setError('No se pudo leer el archivo.');
    }
  };

  return (
    <section className="card narrow vault-card">
      <span className="vault-symbol" aria-hidden="true">
        ◇
      </span>
      <p className="eyebrow">Privacidad desde el inicio</p>
      <h2>Crea tu bóveda</h2>
      <p className="muted">
        Las notas clínicas se cifran en este navegador con tu frase de paso. Nadie más —tampoco el
        servidor— puede leerlas.
      </p>
      <form onSubmit={submit} className="stack">
        <label>
          Frase de paso
          <input
            type="password"
            autoComplete="new-password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
        </label>
        <label>
          Repite la frase
          <input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </label>
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy}>
          {busy ? 'Creando…' : 'Crear bóveda'}
        </button>
      </form>
      <hr />
      <label className="file">
        Restaurar desde un respaldo
        <input
          type="file"
          accept="application/json,.json"
          onChange={(e) => restore(e.target.files?.[0])}
        />
      </label>
    </section>
  );
}

function RecoveryPhrase({ phrase, onDone }: { phrase: string; onDone: () => void }) {
  const [written, setWritten] = useState(false);
  const words = phrase.split(' ');
  return (
    <section className="card narrow vault-card">
      <span className="vault-symbol" aria-hidden="true">
        ✓
      </span>
      <p className="eyebrow">Paso final</p>
      <h2>Tu clave de recuperación</h2>
      <p>
        Escríbela en papel y guárdala lejos del computador. Si olvidas la frase de paso, es la{' '}
        <strong>única</strong> forma de recuperar las historias clínicas, que debes conservar 15
        años.
      </p>
      <ol className="words" aria-label="Clave de recuperación">
        {words.map((w, i) => (
          <li key={i}>{w}</li>
        ))}
      </ol>
      <div className="row">
        <button type="button" className="ghost" onClick={() => window.print()}>
          Imprimir
        </button>
      </div>
      <label className="check">
        <input type="checkbox" checked={written} onChange={(e) => setWritten(e.target.checked)} />
        La escribí y la guardé
      </label>
      <button type="button" disabled={!written} onClick={onDone}>
        Continuar
      </button>
    </section>
  );
}

function Unlock({
  file,
  onOpen,
  onForget,
}: {
  file: VaultFile;
  onOpen: Props['onOpen'];
  onForget: () => void;
}) {
  const [mode, setMode] = useState<'passphrase' | 'recovery'>('passphrase');
  const [secret, setSecret] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    await nextFrame();
    const dek =
      mode === 'passphrase'
        ? unlockWithPassphrase(file.header, secret)
        : unlockWithRecovery(file.header, secret);
    setBusy(false);
    if (!dek)
      return setError(
        mode === 'passphrase' ? 'Frase de paso incorrecta.' : 'Clave de recuperación incorrecta.',
      );
    onOpen(file, dek);
  };

  return (
    <section className="card narrow vault-card">
      <span className="vault-symbol" aria-hidden="true">
        ◇
      </span>
      <p className="eyebrow">Contenido protegido</p>
      <h2>Desbloquear</h2>
      <p className="muted">
        Bóveda {file.header.fingerprint} · {file.log.length} registros cifrados
      </p>
      <div className="segmented" role="group" aria-label="Método">
        <button
          type="button"
          aria-pressed={mode === 'passphrase'}
          onClick={() => (setMode('passphrase'), setSecret(''))}
        >
          Frase de paso
        </button>
        <button
          type="button"
          aria-pressed={mode === 'recovery'}
          onClick={() => (setMode('recovery'), setSecret(''))}
        >
          Clave de recuperación
        </button>
      </div>
      <form onSubmit={submit} className="stack">
        <label>
          {mode === 'passphrase' ? 'Frase de paso' : 'Las 24 palabras, separadas por espacios'}
          {mode === 'passphrase' ? (
            <input
              type="password"
              autoComplete="current-password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
            />
          ) : (
            <textarea
              rows={4}
              autoComplete="off"
              spellCheck={false}
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
            />
          )}
        </label>
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy || secret.length === 0}>
          {busy ? 'Desbloqueando…' : 'Desbloquear'}
        </button>
      </form>
      <button type="button" className="link" onClick={onForget}>
        Usar otra bóveda
      </button>
    </section>
  );
}
