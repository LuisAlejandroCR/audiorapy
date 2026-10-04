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
import { quizMatches, quizPositions, type JourneyFlags } from '../lib/journey.ts';

interface Props {
  stored: VaultFile | null;
  onOpen: (file: VaultFile, dek: Uint8Array, flags?: JourneyFlags) => void;
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
      <RecoveryPhrase
        phrase={created.phrase}
        onDone={(verified) =>
          onOpen(created.file, created.dek, verified ? { recoveryVerified: true } : {})
        }
      />
    );
  }
  if (pending) {
    return (
      <Unlock
        file={pending}
        onOpen={onOpen}
        onForget={() => {
          if (
            stored &&
            !window.confirm(
              'Esto borra la bóveda guardada en este navegador. Sin un respaldo o tu clave no se puede recuperar. ¿Continuar?',
            )
          )
            return;
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
    try {
      const vault = createVault(pass);
      onCreated({ file: newVaultFile(vault.header), dek: vault.dek, phrase: vault.recoveryPhrase });
    } catch {
      setBusy(false);
      setError(
        'Este navegador no pudo crear la bóveda. Prueba con Chrome, Edge o Safari actualizados.',
      );
    }
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
      <p className="eyebrow">Paso 1 de 3 · Privacidad desde el inicio</p>
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
            aria-describedby="pass-hint"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
        </label>
        <span id="pass-hint" className={`hint${pass.length >= MIN_PASSPHRASE_LENGTH ? ' ok' : ''}`}>
          {pass.length >= MIN_PASSPHRASE_LENGTH ? '✓ ' : ''}
          Mínimo {MIN_PASSPHRASE_LENGTH} caracteres · {pass.length}/{MIN_PASSPHRASE_LENGTH}. Una
          frase de varias palabras es más fácil de recordar.
        </span>
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
        <span className="file-button" aria-hidden="true">
          Elegir archivo .json
        </span>
        <input
          type="file"
          accept="application/json,.json"
          onChange={(e) => {
            void restore(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </label>
    </section>
  );
}

function RecoveryPhrase({
  phrase,
  onDone,
}: {
  phrase: string;
  onDone: (verified: boolean) => void;
}) {
  const [written, setWritten] = useState(false);
  const [quiz, setQuiz] = useState(false);
  const words = phrase.split(' ');
  if (quiz) return <RecoveryQuiz words={words} onBack={() => setQuiz(false)} onDone={onDone} />;
  return (
    <section className="card narrow vault-card">
      <span className="vault-symbol" aria-hidden="true">
        ✓
      </span>
      <p className="eyebrow">Paso 2 de 3 · Clave de recuperación</p>
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
      <button type="button" disabled={!written} onClick={() => setQuiz(true)}>
        Continuar
      </button>
    </section>
  );
}

const QUIZ_SIZE = 3;

function RecoveryQuiz({
  words,
  onBack,
  onDone,
}: {
  words: string[];
  onBack: () => void;
  onDone: (verified: boolean) => void;
}) {
  const [positions] = useState(() => quizPositions(words.length, QUIZ_SIZE, Math.random));
  const [answers, setAnswers] = useState<string[]>(() => positions.map(() => ''));
  const [tried, setTried] = useState(false);
  const right = positions.map((p, i) => quizMatches(words[p]!, answers[i]!));
  const allRight = right.every(Boolean);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (allRight) onDone(true);
  };

  return (
    <section className="card narrow vault-card">
      <span className="vault-symbol" aria-hidden="true">
        ?
      </span>
      <p className="eyebrow">Paso 3 de 3 · Comprobación</p>
      <h2>Comprueba tu clave</h2>
      <p className="muted">
        Escribe estas palabras mirando tu papel. Sin tildes ni mayúsculas también vale.
      </p>
      <form className="stack" onSubmit={submit}>
        {positions.map((p, i) => (
          <label key={p}>
            Palabra n.º {p + 1}
            <input
              autoComplete="off"
              spellCheck={false}
              autoCapitalize="none"
              aria-invalid={tried && !right[i] ? true : undefined}
              value={answers[i]}
              onChange={(e) => setAnswers((a) => a.map((x, k) => (k === i ? e.target.value : x)))}
            />
          </label>
        ))}
        {tried && !allRight && (
          <p role="alert" className="error-text">
            {right.filter((r) => !r).length === 1
              ? 'Una palabra no coincide.'
              : `${right.filter((r) => !r).length} palabras no coinciden.`}{' '}
            Revisa tu papel.
          </p>
        )}
        <button type="submit">Comprobar y entrar</button>
      </form>
      <div className="row between">
        <button type="button" className="link" onClick={onBack}>
          Ver las palabras otra vez
        </button>
        <button type="button" className="link" onClick={() => onDone(false)}>
          Comprobar después
        </button>
      </div>
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
