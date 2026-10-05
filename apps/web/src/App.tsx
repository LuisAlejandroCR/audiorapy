// App.tsx: the dashboard shell — tabs, notification center and profile. Clinical records, the session in progress and SOAP drafts exist in clear
// only in this component's memory, after the vault is unlocked; locking drops them.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { verifyChain, type LogEntry, type SoapNote } from '@audiorapy/domain';
import { VaultGate } from './components/VaultGate.tsx';
import { TodayView } from './components/TodayView.tsx';
import { ProgressView } from './components/ProgressView.tsx';
import { SessionView, type SessionDraft } from './components/SessionView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { JourneyMap } from './components/JourneyMap.tsx';
import { Celebration, type Cheer } from './components/Celebration.tsx';
import { Icon } from './components/Icon.tsx';
import { NotificationCenter } from './components/NotificationCenter.tsx';
import { ProfileView } from './components/ProfileView.tsx';
import { fetchAgenda, type Agenda } from './lib/agenda.ts';
import { loadApiSettings } from './lib/settings.ts';
import {
  buildInbox,
  initials,
  loadProfile,
  loadRead,
  saveRead,
  type InboxItem,
} from './lib/inbox.ts';
import {
  notificationsOn,
  notificationsSupported,
  requestNotifications,
  setNotificationsOn,
} from './lib/notify.ts';
import {
  appendRecord,
  byKind,
  decryptLog,
  syntheticRecords,
  type ClinicalRecord,
} from './lib/records.ts';
import { loadVault, saveVault, type VaultFile } from './lib/storage.ts';
import {
  journey,
  JOURNEY_STEPS,
  loadFlags,
  saveFlags,
  type JourneyFlags,
  type StepId,
} from './lib/journey.ts';

export type Tab = 'today' | 'progress' | 'session' | 'settings' | 'profile';

const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'today', label: 'Hoy', icon: 'calendar' },
  { id: 'progress', label: 'Progreso', icon: 'trend' },
  { id: 'session', label: 'Sesión', icon: 'session' },
  { id: 'settings', label: 'Respaldo', icon: 'shield' },
];

/** Where each step of the start route is done. */
const STEP_TAB: Record<StepId, Tab> = {
  vault: 'today',
  recovery: 'settings',
  patient: 'progress',
  session: 'session',
  note: 'session',
  backup: 'settings',
};

export interface Unlocked {
  file: VaultFile;
  dek: Uint8Array;
  records: ClinicalRecord[];
  failed: number;
}

export function App() {
  const [stored, setStored] = useState<VaultFile | null>(() => loadVault());
  const [unlocked, setUnlocked] = useState<Unlocked | null>(null);
  const [tab, setTab] = useState<Tab>('today');
  const [saveWarning, setSaveWarning] = useState(false);
  const [flags, setFlags] = useState<JourneyFlags>({});
  const [sessionDraft, setSessionDraft] = useState<SessionDraft | null>(null);
  const [soapDrafts, setSoapDrafts] = useState<Record<string, SoapNote>>({});
  const [cheer, setCheer] = useState<Cheer | null>(null);
  /** True only when the open vault was created in this page: its first steps deserve a celebration. */
  const createdNow = useRef(false);
  const dismissCheer = useCallback(() => setCheer(null), []);
  const [agenda, setAgenda] = useState<Agenda | null>(null);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [read, setRead] = useState<Set<string>>(loadRead);
  const [profile, setProfile] = useState(loadProfile);
  const [notify, setNotify] = useState(notificationsOn);
  const toggleInbox = useCallback(() => setInboxOpen((o) => !o), []);

  const toggleNotify = useCallback(async () => {
    if (notify) {
      setNotificationsOn(false);
      setNotify(false);
    } else if (await requestNotifications()) {
      setNotificationsOn(true);
      setNotify(true);
    }
  }, [notify]);

  const open = useCallback((file: VaultFile, dek: Uint8Array, extra?: JourneyFlags) => {
    const { records, failed } = decryptLog(dek, file.log);
    setStored(file);
    setSaveWarning(!saveVault(file));
    setUnlocked({ file, dek, records, failed });
    const fp = file.header.fingerprint;
    const base = loadFlags(fp);
    const merged = extra ? { ...base, ...extra } : base;
    if (extra) saveFlags(fp, merged);
    setFlags(merged);
    createdNow.current = extra !== undefined;
  }, []);

  const fingerprint = unlocked?.file.header.fingerprint;
  const updateFlags = useCallback(
    (patch: JourneyFlags) => {
      if (!fingerprint) return;
      setFlags((f) => {
        const merged = { ...f, ...patch };
        saveFlags(fingerprint, merged);
        return merged;
      });
    },
    [fingerprint],
  );

  const addRecords = useCallback(
    (newRecords: ClinicalRecord[]) => {
      if (!unlocked) return;
      let log: LogEntry[] = unlocked.file.log;
      for (const r of newRecords) log = appendRecord(unlocked.dek, log, r);
      open({ ...unlocked.file, log }, unlocked.dek);
    },
    [open, unlocked],
  );

  const lock = useCallback(() => {
    const unsaved = sessionDraft !== null || Object.keys(soapDrafts).length > 0;
    if (
      unsaved &&
      !window.confirm(
        'Hay una sesión o una nota sin guardar. Si bloqueas ahora se pierden. ¿Bloquear?',
      )
    )
      return;
    unlocked?.dek.fill(0);
    setUnlocked(null);
    setSessionDraft(null);
    setSoapDrafts({});
    setFlags({});
    setTab('today');
  }, [unlocked, sessionDraft, soapDrafts]);

  // The bell needs the agenda on every tab, not only on "Hoy": read it once when the vault opens.
  const isOpen = unlocked !== null;
  useEffect(() => {
    if (!isOpen) return;
    let live = true;
    void fetchAgenda(loadApiSettings()).then((r) => live && r.available && setAgenda(r.data));
    return () => {
      live = false;
    };
  }, [isOpen]);

  const chainBreak = useMemo(() => (unlocked ? verifyChain(unlocked.file.log) : -1), [unlocked]);
  const records = useMemo(() => unlocked?.records ?? [], [unlocked]);
  const route = useMemo(() => journey(records, flags), [records, flags]);
  const patients = byKind(records, 'patient');
  const [now] = useState(() => new Date());
  const inbox = useMemo(() => buildInbox(agenda, route, read, now), [agenda, route, read, now]);
  const markRead = (ids: string[]) =>
    setRead((r) => {
      const next = new Set([...r, ...ids]);
      saveRead(next);
      return next;
    });
  const openItem = (item: InboxItem) => {
    markRead([item.id]);
    setInboxOpen(false);
    setTab('today');
    if (item.kind !== 'achievement')
      setTimeout(
        () =>
          document
            .getElementById(item.kind === 'alert' ? 'alerts' : 'upcoming-title')
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
        50,
      );
  };

  // Celebrate a step the moment it becomes done — never the ones already done when the vault opened.
  const seen = useRef<Set<StepId> | null>(null);
  useEffect(() => {
    if (!unlocked) {
      seen.current = null;
      return;
    }
    const done = new Set(route.steps.filter((s) => s.done).map((s) => s.id));
    // A brand-new vault celebrates its first steps; an existing one starts from what it has.
    if (seen.current === null && !createdNow.current) {
      seen.current = done;
      return;
    }
    const before = seen.current ?? new Set<StepId>();
    const fresh = JOURNEY_STEPS.filter((s) => done.has(s.id) && !before.has(s.id));
    seen.current = done;
    if (fresh.length === 0) return;
    const gained = fresh.reduce((sum, s) => sum + s.xp, 0);
    setCheer(
      route.next === null
        ? { title: '¡Ruta completada!', detail: `${route.xp} puntos · ${route.rank}`, big: true }
        : {
            title: fresh.length === 1 ? fresh[0]!.title : `${fresh.length} pasos completados`,
            detail: `+${gained} puntos · ${route.completed}/${route.total} pasos`,
          },
    );
  }, [route, unlocked]);

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            A
          </span>
          <div>
            <h1>Audiorapy</h1>
            <p>Consulta protegida</p>
          </div>
        </div>
        {unlocked && (
          <div className="topbar-actions">
            <button
              type="button"
              className="xp-chip"
              onClick={() => setTab('today')}
              aria-label={`Ruta de inicio: ${route.completed} de ${route.total} pasos, ${route.xp} puntos`}
            >
              <Icon name="star" />
              <span>{route.xp}</span>
            </button>
            <NotificationCenter
              items={inbox}
              open={inboxOpen}
              onToggle={toggleInbox}
              onReadAll={() => markRead(inbox.map((i) => i.id))}
              onOpenItem={openItem}
            />
            <button
              type="button"
              className="avatar-button"
              aria-current={tab === 'profile' ? 'page' : undefined}
              aria-label={`Perfil${profile.name ? `: ${profile.name}` : ''}`}
              onClick={() => setTab('profile')}
            >
              {initials(profile.name)}
            </button>
            <button type="button" className="ghost" onClick={lock}>
              <Icon name="lock" />
              Bloquear
            </button>
          </div>
        )}
      </header>

      {!unlocked ? (
        <VaultGate stored={stored} onOpen={open} onForget={() => setStored(null)} />
      ) : (
        <>
          <nav className="tabs" aria-label="Secciones">
            {TABS.map(({ id, label, icon }) => (
              <button
                key={id}
                type="button"
                aria-current={tab === id ? 'page' : undefined}
                aria-describedby={id === 'session' && sessionDraft ? 'session-live' : undefined}
                onClick={() => setTab(id)}
              >
                <Icon name={icon} />
                <span>{label}</span>
                {id === 'session' && sessionDraft && (
                  <span className="live-dot" aria-hidden="true" />
                )}
              </button>
            ))}
          </nav>
          {sessionDraft && (
            <span id="session-live" hidden>
              Sesión en curso sin guardar
            </span>
          )}
          {saveWarning && (
            <p role="alert" className="banner warn">
              Este navegador no permite guardar localmente. Descarga un respaldo antes de cerrar.
            </p>
          )}
          {chainBreak >= 0 && (
            <p role="alert" className="banner error">
              La bitácora clínica no verifica a partir del registro {chainBreak}. No la modifiques;
              restaura un respaldo.
            </p>
          )}
          {unlocked.failed > 0 && (
            <p role="alert" className="banner error">
              {unlocked.failed} registros no se pudieron descifrar.
            </p>
          )}
          {patients.length === 0 && (tab === 'progress' || tab === 'session') ? (
            <section className="card empty">
              <span className="empty-icon" aria-hidden="true">
                ✦
              </span>
              <h2>Sin pacientes todavía</h2>
              <p>
                Carga el caso de demostración para ver el progreso y probar el modo sesión. Son
                datos sintéticos.
              </p>
              <button type="button" onClick={() => addRecords(syntheticRecords(new Date()))}>
                Cargar datos sintéticos
              </button>
            </section>
          ) : (
            <main>
              {tab === 'today' && (
                <TodayView
                  records={records}
                  notify={notify}
                  onToggleNotify={() => void toggleNotify()}
                  onAgenda={setAgenda}
                  onConfigure={() => setTab('settings')}
                  onNext={(focus) => {
                    if (focus === 'notes' || focus === 'session') setTab('session');
                    else
                      document
                        .getElementById(focus === 'alerts' ? 'alerts' : 'upcoming-title')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                >
                  <JourneyMap route={route} onGo={(step) => setTab(STEP_TAB[step])} />
                </TodayView>
              )}
              {tab === 'progress' && <ProgressView records={records} />}
              {tab === 'session' && (
                <SessionView
                  records={records}
                  onAppend={addRecords}
                  draft={sessionDraft}
                  onDraft={setSessionDraft}
                  soapDrafts={soapDrafts}
                  onSoapDraft={(id, note) =>
                    setSoapDrafts((d) => {
                      const next = { ...d };
                      if (note) next[id] = note;
                      else delete next[id];
                      return next;
                    })
                  }
                />
              )}
              {tab === 'profile' && (
                <ProfileView
                  profile={profile}
                  onSave={setProfile}
                  route={route}
                  records={records}
                  notify={notify}
                  onToggleNotify={() => void toggleNotify()}
                  notifySupported={notificationsSupported()}
                />
              )}
              {tab === 'settings' && (
                <SettingsView
                  unlocked={unlocked}
                  chainOk={chainBreak < 0}
                  flags={flags}
                  onFlags={updateFlags}
                />
              )}
            </main>
          )}
        </>
      )}
      {cheer && <Celebration cheer={cheer} onDone={dismissCheer} />}
      <footer className="foot">
        <Icon name="shield" />
        <span>Cifrado en este navegador · El servidor solo ve la agenda</span>
      </footer>
    </div>
  );
}
