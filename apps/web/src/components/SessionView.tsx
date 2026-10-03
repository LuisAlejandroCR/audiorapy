// SessionView.tsx: session mode (✓/✗ per trial with cue level, undo) and the SOAP note for a session.
// "O" is computed from the trials; the local model may draft S/A/P, and nothing is saved until approved.
import { useMemo, useState } from 'react';
import {
  approve,
  CUE_LABEL_ES,
  CUE_LEVELS,
  objectiveText,
  summarizeTarget,
  templateNote,
  type CueLevel,
  type SoapNote,
  type Trial,
} from '@audiorapy/domain';
import { draftSoap, type DraftOutcome } from '../lib/ai.ts';
import { byKind, type ClinicalRecord, type Note, type Session } from '../lib/records.ts';
import { loadAiSettings } from '../lib/settings.ts';

interface Props {
  records: ClinicalRecord[];
  onAppend: (records: ClinicalRecord[]) => void;
}

export function SessionView({ records, onAppend }: Props) {
  const patient = byKind(records, 'patient')[0]!;
  const sessions = byKind(records, 'session')
    .filter((s) => s.patientId === patient.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const notes = byKind(records, 'soap_note');
  const [recording, setRecording] = useState(false);
  const [selected, setSelected] = useState(sessions[0]?.id ?? '');
  const session = sessions.find((s) => s.id === selected) ?? sessions[0];

  return (
    <>
      {recording ? (
        <SessionMode
          patientTargets={patient.targets}
          onCancel={() => setRecording(false)}
          onSave={(s) => {
            const created: Session = {
              ...s,
              kind: 'session',
              id: crypto.randomUUID(),
              patientId: patient.id,
            };
            onAppend([created]);
            setSelected(created.id);
            setRecording(false);
          }}
        />
      ) : (
        <section className="card session-toolbar">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Registro clínico</p>
              <h2>Sesiones</h2>
              <p className="muted">Registra ensayos y revisa tus notas.</p>
            </div>
            <button type="button" onClick={() => setRecording(true)}>
              Nueva sesión
            </button>
          </div>
          {sessions.length > 0 && (
            <label>
              Sesión
              <select value={session?.id} onChange={(e) => setSelected(e.target.value)}>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.date}
                    {notes.some((n) => n.sessionId === s.id) ? ' · nota aprobada' : ''}
                  </option>
                ))}
              </select>
            </label>
          )}
        </section>
      )}
      {!recording && session && (
        <SoapPanel
          key={session.id}
          session={session}
          approved={notes.filter((n) => n.sessionId === session.id).at(-1) ?? null}
          onApprove={(note) =>
            onAppend([
              {
                kind: 'soap_note',
                id: crypto.randomUUID(),
                sessionId: session.id,
                note,
                approvedAt: new Date().toISOString(),
              },
            ])
          }
        />
      )}
    </>
  );
}

function SessionMode({
  patientTargets,
  onSave,
  onCancel,
}: {
  patientTargets: Array<{ id: string; label: string }>;
  onSave: (s: Omit<Session, 'kind' | 'id' | 'patientId'>) => void;
  onCancel: () => void;
}) {
  const [targetId, setTargetId] = useState(patientTargets[0]!.id);
  const [cue, setCue] = useState<CueLevel>('min');
  const [trials, setTrials] = useState<Array<Trial & { targetId: string }>>([]);
  const [notes, setNotes] = useState('');
  const current = trials.filter((t) => t.targetId === targetId);
  const correct = current.filter((t) => t.correct).length;

  const add = (ok: boolean) => setTrials((ts) => [...ts, { targetId, correct: ok, cue }]);

  return (
    <section className="card" aria-labelledby="mode-title">
      <h2 id="mode-title">Modo sesión</h2>
      <div className="segmented wrap" role="group" aria-label="Objetivo">
        {patientTargets.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={t.id === targetId}
            onClick={() => setTargetId(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="segmented" role="group" aria-label="Nivel de apoyo">
        {CUE_LEVELS.map((c) => (
          <button key={c} type="button" aria-pressed={c === cue} onClick={() => setCue(c)}>
            {CUE_LABEL_ES[c]}
          </button>
        ))}
      </div>
      <div className="trial-buttons">
        <button type="button" className="ok" onClick={() => add(true)} aria-label="Acierto">
          ✓
        </button>
        <button type="button" className="ko" onClick={() => add(false)} aria-label="Error">
          ✗
        </button>
      </div>
      <p className="counter" aria-live="polite">
        {correct}/{current.length} en este objetivo · {trials.length} ensayos en total
      </p>
      <div className="row">
        <button
          type="button"
          className="ghost"
          disabled={trials.length === 0}
          onClick={() => setTrials((ts) => ts.slice(0, -1))}
        >
          Deshacer
        </button>
      </div>
      <label>
        Notas breves de la sesión (opcional)
        <textarea
          rows={3}
          value={notes}
          maxLength={2000}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      <div className="row">
        <button type="button" className="ghost" onClick={onCancel}>
          Descartar
        </button>
        <button
          type="button"
          disabled={trials.length === 0}
          onClick={() =>
            onSave({
              date: new Date().toISOString().slice(0, 10),
              therapistNotes: notes,
              targets: patientTargets
                .map((t) => ({
                  targetId: t.id,
                  targetLabel: t.label,
                  trials: trials
                    .filter((x) => x.targetId === t.id)
                    .map(({ correct: c, cue: q }) => ({ correct: c, cue: q })),
                }))
                .filter((b) => b.trials.length > 0),
            })
          }
        >
          Guardar sesión cifrada
        </button>
      </div>
    </section>
  );
}

function SoapPanel({
  session,
  approved,
  onApprove,
}: {
  session: Session;
  approved: Note | null;
  onApprove: (note: SoapNote) => void;
}) {
  const summaries = useMemo(() => session.targets.map(summarizeTarget), [session]);
  const [note, setNote] = useState<SoapNote>(() => templateNote(summaries));
  const [outcome, setOutcome] = useState<DraftOutcome | null>(null);
  const [busy, setBusy] = useState(false);

  if (approved) {
    return (
      <section className="card soap-card" aria-labelledby="soap-title">
        <h2 id="soap-title">Nota SOAP · {session.date}</h2>
        <p className="banner ok">
          Aprobada {approved.approvedAt.slice(0, 16).replace('T', ' ')} · registro inmodificable
        </p>
        <NoteBody note={approved.note} />
      </section>
    );
  }

  const draft = async () => {
    setBusy(true);
    const r = await draftSoap(summaries, session.therapistNotes, loadAiSettings());
    setOutcome(r);
    setNote(r.note);
    setBusy(false);
  };

  return (
    <section className="card soap-card" aria-labelledby="soap-title">
      <p className="eyebrow">Borrador privado</p>
      <h2 id="soap-title">Nota SOAP · {session.date}</h2>
      <div className="row">
        <button type="button" onClick={draft} disabled={busy}>
          {busy ? 'Redactando en tu equipo…' : 'Borrador con IA local'}
        </button>
      </div>
      {outcome && !outcome.aiAvailable && (
        <p role="status" className="banner warn">
          IA no disponible ({outcome.error}). Completa la plantilla; la sección O ya está calculada.
        </p>
      )}
      {outcome?.aiAvailable && (
        <p role="status" className="banner ai">
          Borrador de IA local ({note.aiModel}) en {(outcome.elapsedMs / 1000).toFixed(1)} s.
          Revísalo: nada se guarda hasta que lo apruebes.
          {note.redactedSentences > 0 &&
            (note.redactedSentences === 1
              ? ' Se quitó 1 frase con cifras.'
              : ` Se quitaron ${note.redactedSentences} frases con cifras.`)}
        </p>
      )}
      <label>
        S · Subjetivo
        <textarea
          rows={3}
          value={note.subjective}
          onChange={(e) => setNote({ ...note, subjective: e.target.value })}
        />
      </label>
      <div className="objective">
        <span className="label">O · Objetivo (calculado de los ensayos)</span>
        <pre>{objectiveText(summaries)}</pre>
      </div>
      <label>
        A · Análisis
        <textarea
          rows={3}
          value={note.assessment}
          onChange={(e) => setNote({ ...note, assessment: e.target.value })}
        />
      </label>
      <label>
        P · Plan
        <textarea
          rows={3}
          value={note.plan}
          onChange={(e) => setNote({ ...note, plan: e.target.value })}
        />
      </label>
      <button
        type="button"
        disabled={[note.subjective, note.assessment, note.plan].some(
          (s) => s.includes('[completar]') || s.trim() === '',
        )}
        onClick={() => onApprove(approve({ ...note, objective: objectiveText(summaries) }))}
      >
        Aprobar y guardar cifrada
      </button>
    </section>
  );
}

function NoteBody({ note }: { note: SoapNote }) {
  return (
    <dl className="note">
      <dt>S</dt>
      <dd>{note.subjective}</dd>
      <dt>O</dt>
      <dd>
        <pre>{note.objective}</pre>
      </dd>
      <dt>A</dt>
      <dd>{note.assessment}</dd>
      <dt>P</dt>
      <dd>{note.plan}</dd>
      {note.aiModel && (
        <>
          <dt>IA</dt>
          <dd>Borrador de {note.aiModel}, revisado y aprobado por la terapeuta</dd>
        </>
      )}
    </dl>
  );
}
