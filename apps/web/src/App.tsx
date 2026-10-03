// App.tsx: the dashboard shell. Clinical records exist in clear only in this component's memory,
// after the vault is unlocked; locking drops them.
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { verifyChain, type LogEntry } from '@audiorapy/domain';
import { VaultGate } from './components/VaultGate.tsx';
import { TodayView } from './components/TodayView.tsx';
import { ProgressView } from './components/ProgressView.tsx';
import { SessionView } from './components/SessionView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import {
  appendRecord,
  byKind,
  decryptLog,
  syntheticRecords,
  type ClinicalRecord,
} from './lib/records.ts';
import { loadVault, saveVault, type VaultFile } from './lib/storage.ts';

type Tab = 'today' | 'progress' | 'session' | 'settings';

const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'today', label: 'Hoy', icon: 'calendar' },
  { id: 'progress', label: 'Progreso', icon: 'trend' },
  { id: 'session', label: 'Sesión', icon: 'session' },
  { id: 'settings', label: 'Respaldo', icon: 'shield' },
];

function Icon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    calendar: (
      <path d="M5 3v3m14-3v3M4 9h16M5 5h14a2 2 0 0 1 2 2v13H3V7a2 2 0 0 1 2-2Zm3 8h3v3H8v-3Z" />
    ),
    trend: <path d="m4 17 5-5 4 3 7-8m-5 0h5v5" />,
    session: (
      <path d="M9 4h6m-7 3h8m-9 13h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Zm1-8 2 2 4-4" />
    ),
    shield: <path d="M12 3 5 6v5c0 4.5 2.8 7.6 7 10 4.2-2.4 7-5.5 7-10V6l-7-3Zm-3 9 2 2 4-4" />,
    lock: <path d="M7 10V7a5 5 0 0 1 10 0v3m-11 0h12v10H6V10Z" />,
  };
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

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

  const open = useCallback((file: VaultFile, dek: Uint8Array) => {
    const { records, failed } = decryptLog(dek, file.log);
    setStored(file);
    setSaveWarning(!saveVault(file));
    setUnlocked({ file, dek, records, failed });
  }, []);

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
    unlocked?.dek.fill(0);
    setUnlocked(null);
    setTab('today');
  }, [unlocked]);

  const chainBreak = useMemo(() => (unlocked ? verifyChain(unlocked.file.log) : -1), [unlocked]);
  const patients = unlocked ? byKind(unlocked.records, 'patient') : [];

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
          <button type="button" className="ghost" onClick={lock}>
            <Icon name="lock" />
            Bloquear
          </button>
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
                onClick={() => setTab(id)}
              >
                <Icon name={icon} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
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
          {patients.length === 0 && tab !== 'today' && tab !== 'settings' ? (
            <section className="card empty">
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
              {tab === 'today' && <TodayView />}
              {tab === 'progress' && <ProgressView records={unlocked.records} />}
              {tab === 'session' && (
                <SessionView records={unlocked.records} onAppend={addRecords} />
              )}
              {tab === 'settings' && <SettingsView unlocked={unlocked} chainOk={chainBreak < 0} />}
            </main>
          )}
        </>
      )}
      <footer className="foot">
        <Icon name="shield" />
        <span>Cifrado en este navegador · El servidor solo ve la agenda</span>
      </footer>
    </div>
  );
}
