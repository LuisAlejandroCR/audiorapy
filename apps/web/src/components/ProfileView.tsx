// ProfileView.tsx: the therapist's profile — who she is (name, profession, practice, city; kept only in
// this browser), her progress (rank, points, achievements) and her activity counts, plus notification
// preferences. Nothing here is clinical.
import { useState, type FormEvent } from 'react';
import { initials, saveProfile, type Profile } from '../lib/inbox.ts';
import type { Journey } from '../lib/journey.ts';
import { MAX_XP } from '../lib/journey.ts';
import { byKind, type ClinicalRecord } from '../lib/records.ts';
import { SYNTHETIC_PREFIX } from '../lib/journey.ts';
import { Icon } from './Icon.tsx';

export function ProfileView({
  profile,
  onSave,
  route,
  records,
  notify,
  onToggleNotify,
  notifySupported,
}: {
  profile: Profile;
  onSave: (p: Profile) => void;
  route: Journey;
  records: ClinicalRecord[];
  notify: boolean;
  onToggleNotify: () => void;
  notifySupported: boolean;
}) {
  const [draft, setDraft] = useState(profile);
  const [saved, setSaved] = useState(false);
  const sessions = byKind(records, 'session').filter((s) => !s.id.startsWith(SYNTHETIC_PREFIX));
  const notes = byKind(records, 'soap_note');
  const set = (k: keyof Profile) => (e: { target: { value: string } }) => {
    setDraft({ ...draft, [k]: e.target.value });
    setSaved(false);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSave(saveProfile(draft));
    setSaved(true);
  };

  return (
    <>
      <section className="card profile-hero reveal" aria-labelledby="profile-title">
        <span className="profile-avatar" aria-hidden="true">
          {initials(profile.name)}
        </span>
        <div>
          <p className="eyebrow">Perfil</p>
          <h2 id="profile-title">{profile.name || 'Tu perfil'}</h2>
          <p className="muted">
            {[profile.profession, profile.practice, profile.city].filter(Boolean).join(' · ') ||
              'Completa tus datos para personalizar el panel.'}
          </p>
        </div>
        <div className="profile-rank">
          <Icon name="star" />
          <strong>{route.xp}</strong>
          <span>
            {route.rank} · {Math.round((route.xp / MAX_XP) * 100)} %
          </span>
        </div>
      </section>

      <section className="card" aria-labelledby="stats-title">
        <h2 id="stats-title">Tu actividad</h2>
        <ul className="exec-tiles">
          <li>
            <Icon name="session" />
            <strong>{sessions.length}</strong>
            <span>Sesiones registradas</span>
          </li>
          <li>
            <Icon name="note" />
            <strong>{notes.length}</strong>
            <span>Notas aprobadas</span>
          </li>
          <li>
            <Icon name="flag" />
            <strong>
              {route.completed}/{route.total}
            </strong>
            <span>Pasos de la ruta</span>
          </li>
          <li>
            <Icon name="trophy" />
            <strong>{route.steps.filter((s) => s.done && s.id !== 'vault').length}</strong>
            <span>Logros</span>
          </li>
        </ul>
        <ul className="achievements" aria-label="Logros">
          {route.steps.map((s) => (
            <li key={s.id} className={s.done ? 'done' : undefined}>
              <span aria-hidden="true">{s.done ? '🏅' : '○'}</span>
              {s.title}
              <span className="sr-only">{s.done ? ' (logrado)' : ' (pendiente)'}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card" aria-labelledby="me-title">
        <h2 id="me-title">Tus datos</h2>
        <p className="muted">Se guardan solo en este navegador. No son datos clínicos.</p>
        <form className="stack" onSubmit={submit}>
          <label>
            Nombre
            <input value={draft.name} maxLength={80} autoComplete="name" onChange={set('name')} />
          </label>
          <label>
            Profesión
            <input value={draft.profession} maxLength={80} onChange={set('profession')} />
          </label>
          <label>
            Consultorio o marca
            <input value={draft.practice} maxLength={80} onChange={set('practice')} />
          </label>
          <label>
            Ciudad
            <input
              value={draft.city}
              maxLength={80}
              autoComplete="address-level2"
              onChange={set('city')}
            />
          </label>
          <button type="submit">Guardar perfil</button>
          {saved && <p role="status">Perfil guardado.</p>}
        </form>
      </section>

      {notifySupported && (
        <section className="card" aria-labelledby="prefs-title">
          <h2 id="prefs-title">Notificaciones</h2>
          <p className="muted">
            Avisos del navegador cuando una familia escribe o pide cambiar la visita. Solo llevan el
            motivo y el teléfono enmascarado.
          </p>
          <button type="button" className="ghost" aria-pressed={notify} onClick={onToggleNotify}>
            <Icon name="bell" />
            {notify ? 'Avisos activos · desactivar' : 'Activar avisos'}
          </button>
        </section>
      )}
    </>
  );
}
