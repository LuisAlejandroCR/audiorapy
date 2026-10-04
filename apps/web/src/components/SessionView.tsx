// SessionView.tsx: session mode (✓/✗ per trial with cue level, undo, live streak and trial goal) and the
// SOAP note for a session. "O" is computed from the trials; the local model may draft S/A/P, and nothing
// is saved until approved. Drafts live in the shell so switching tabs never loses them.
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
import { formatDayEs, formatStampEs, liveStats, localDate, TRIAL_GOAL } from '../lib/stats.ts';
import { Icon } from './Icon.tsx';

export interface SessionDraft {
  targetId: string;
  cue: CueLevel;
  trials: Array<Trial & { targetId: string }>;
  notes: string;
}

interface Props {
  records: ClinicalRecord[];
  onAppend: (records: ClinicalRecord[]) => void;
  draft: SessionDraft | null;
  onDraft: (draft: SessionDraft | null) => void;
  soapDrafts: Record<string, SoapNote>;
  onSoapDraft: (sessionId: string, note: SoapNote | null) => void;
}

export function SessionView({ records, onAppend, draft, onDraft, soapDrafts, onSoapDraft }: Props) {
  const patient = byKind(records, 'patient')[0]!;
  const sessions = byKind(records, 'session')
    .filter((s) => s.patientId === patient.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const notes = byKind(records, 'soap_note');
  const [selected, setSelected] = useState(sessions[0]?.id ?? '');
  const session = sessions.find((s) => s.id === selected) ?? sessions[0];

  if (draft) {
    return (
      <SessionMode
        patient={patient}
        draft={draft}
        onDraft={onDraft}
        onSave={(s) => {
          const created: Session = {
            ...s,
            kind: 'session',
            id: crypto.randomUUID(),
            patientId: patient.id,
          };
          onAppend([created]);
          setSelected(created.id);
          onDraft(null);
        }}
      />
    );
  }

  return (
    <>
      <section className="card session-toolbar">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Registro clínico</p>
            <h2>Sesiones</h2>
            <p className="muted">{patient.alias} · registra ensayos y revisa tus notas.</p>
          </div>
          <button
            type="button"
            onClick={() =>
              onDraft({ targetId: patient.targets[0]!.id, cue: 'min', trials: [], notes: '' })
            }
          >
            Nueva sesión
          </button>
        </div>
        {sessions.length > 0 && (
          <label>
            Sesión
            <select value={session?.id} onChange={(e) => setSelected(e.target.value)}>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {formatDayEs(s.date)}
                  {notes.some((n) => n.sessionId === s.id) ? ' · nota aprobada' : ' · sin nota'}
                </option>
              ))}
            </select>
          </label>
        )}
      </section>
      {session && (
        <SoapPanel
          key={session.id}
          session={session}
          approved={notes.filter((n) => n.sessionId === session.id).at(-1) ?? null}
          draft={soapDrafts[session.id] ?? null}
          onDraft={(note) => onSoapDraft(session.id, note)}
          onApprove={(note) => {
            onSoapDraft(session.id, null);
            onAppend([
              {
                kind: 'soap_note',
                id: crypto.randomUUID(),
                sessionId: session.id,
                note,
                approvedAt: new Date().toISOString(),
              },
            ]);
          }}
        />
      )}
    </>
  );
}

function SessionMode({
  patient,
  draft,
  onDraft,
  onSave,
}: {
  patient: {
    alias: string;
    targets: Array<{ id: string; label: string; criterionPercent: number }>;
  };
  draft: SessionDraft;
  onDraft: (d: SessionDraft | null) => void;
  onSave: (s: Omit<Session, 'kind' | 'id' | 'patientId'>) => void;
}) {
  const { targetId, cue, trials, notes } = draft;
  const target = patient.targets.find((t) => t.id === targetId) ?? patient.targets[0]!;
  const current = trials.filter((t) => t.targetId === target.id);
  const stats = liveStats(
    current.map((t) => t.correct),
    target.criterionPercent,
  );
  const set = (patch: Partial<SessionDraft>) => onDraft({ ...draft, ...patch });
  const add = (ok: boolean) =>
    set({ trials: [...trials, { targetId: target.id, correct: ok, cue }] });

  const discard = () => {
    if (
      trials.length === 0 ||
      window.confirm(`¿Descartar ${trials.length} ensayos sin guardar? No se pueden recuperar.`)
    )
      onDraft(null);
  };

  return (
    <section className="card session-mode" aria-labelledby="mode-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">En curso · {patient.alias}</p>
          <h2 id="mode-title">Modo sesión</h2>
        </div>
        <span className="tag live">
          <span className="live-dot static" aria-hidden="true" />
          {trials.length} ensayos
        </span>
      </div>
      <div className="segmented wrap target-picker" role="group" aria-label="Objetivo">
        {patient.targets.map((t) => {
          const n = trials.filter((x) => x.targetId === t.id).length;
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={t.id === target.id}
              onClick={() => set({ targetId: t.id })}
            >
              {t.label}
              {n > 0 && <span className="count">{n}</span>}
            </button>
          );
        })}
      </div>
      <div className="segmented cue-grid" role="group" aria-label="Nivel de apoyo">
        {CUE_LEVELS.map((c) => (
          <button key={c} type="button" aria-pressed={c === cue} onClick={() => set({ cue: c })}>
            <span className={`dot cue-${c}`} aria-hidden="true" />
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
      <div className="live-stats">
        <p className="counter" aria-live="polite">
          {stats.correct}/{stats.count} en este objetivo · {trials.length} ensayos en total
        </p>
        <div className="goal">
          <div
            className="goal-bar"
            role="progressbar"
            aria-label={`Meta de ${TRIAL_GOAL} ensayos`}
            aria-valuemin={0}
            aria-valuemax={TRIAL_GOAL}
            aria-valuenow={Math.min(TRIAL_GOAL, stats.count)}
          >
            <span style={{ width: `${Math.round(stats.goal * 100)}%` }} />
          </div>
          <span className="muted">
            {Math.min(TRIAL_GOAL, stats.count)}/{TRIAL_GOAL} ensayos · meta{' '}
            {target.criterionPercent} %
          </span>
        </div>
        <div className="chips">
          <span className={`badge${stats.streak >= 3 ? ' hot' : ''}`}>
            <Icon name="flame" /> Racha {stats.streak}
          </span>
          <span className="badge">Mejor {stats.bestStreak}</span>
          {stats.criterionMet && (
            <span className="badge ok">
              <Icon name="trophy" /> Meta alcanzada · {stats.percent} %
            </span>
          )}
        </div>
      </div>
      <div className="row">
        <button
          type="button"
          className="ghost"
          disabled={trials.length === 0}
          onClick={() => set({ trials: trials.slice(0, -1) })}
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
          onChange={(e) => set({ notes: e.target.value })}
        />
      </label>
      <div className="row">
        <button type="button" className="ghost" onClick={discard}>
          Descartar
        </button>
        <button
          type="button"
          disabled={trials.length === 0}
          onClick={() =>
            onSave({
              date: localDate(new Date()),
              therapistNotes: notes,
              targets: patient.targets
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

const PLACEHOLDER = '[completar]';

function SoapPanel({
  session,
  approved,
  draft,
  onDraft,
  onApprove,
}: {
  session: Session;
  approved: Note | null;
  draft: SoapNote | null;
  onDraft: (note: SoapNote) => void;
  onApprove: (note: SoapNote) => void;
}) {
  const summaries = useMemo(() => session.targets.map(summarizeTarget), [session]);
  const note = draft ?? templateNote(summaries);
  const setNote = onDraft;
  const [outcome, setOutcome] = useState<DraftOutcome | null>(null);
  const [busy, setBusy] = useState(false);

  if (approved) {
    return (
      <section className="card soap-card" aria-labelledby="soap-title">
        <h2 id="soap-title">Nota SOAP · {formatDayEs(session.date)}</h2>
        <p className="banner ok">
          Aprobada {formatStampEs(approved.approvedAt)} · registro inmodificable
        </p>
        <NoteBody note={approved.note} />
      </section>
    );
  }

  const draftWithAi = async () => {
    setBusy(true);
    const r = await draftSoap(summaries, session.therapistNotes, loadAiSettings());
    setOutcome(r);
    // Keep anything the therapist already wrote; the model only fills what is still empty.
    const keep = (mine: string, model: string) =>
      mine.trim() === '' || mine.includes(PLACEHOLDER) ? model : mine;
    setNote({
      ...r.note,
      subjective: keep(note.subjective, r.note.subjective),
      assessment: keep(note.assessment, r.note.assessment),
      plan: keep(note.plan, r.note.plan),
    });
    setBusy(false);
  };

  const sections = [
    { key: 'subjective', label: 'S', value: note.subjective },
    { key: 'assessment', label: 'A', value: note.assessment },
    { key: 'plan', label: 'P', value: note.plan },
  ] as const;
  const ready = sections.filter((s) => s.value.trim() !== '' && !s.value.includes(PLACEHOLDER));

  return (
    <section className="card soap-card" aria-labelledby="soap-title">
      <p className="eyebrow">Borrador privado</p>
      <h2 id="soap-title">Nota SOAP · {formatDayEs(session.date)}</h2>
      <div className="row">
        <button type="button" onClick={draftWithAi} disabled={busy}>
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
      <ul className="checklist" aria-label="Lista para aprobar">
        {sections.map((s) => {
          const ok = ready.some((r) => r.key === s.key);
          return (
            <li key={s.key} className={ok ? 'ok' : undefined}>
              <span aria-hidden="true">{ok ? '✓' : '○'}</span>
              {s.label}{' '}
              {ok
                ? 'completa'
                : `pendiente${s.value.includes(PLACEHOLDER) ? ` (quita ${PLACEHOLDER})` : ''}`}
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        disabled={ready.length < sections.length}
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
