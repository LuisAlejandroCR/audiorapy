// App.tsx: the dashboard shell. Clinical records exist in clear only in this component's memory,
// after the vault is unlocked; locking drops them.
import { useCallback, useMemo, useState } from 'react';
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

const TABS: Array<[Tab, string]> = [
  ['today', 'Hoy'],
  ['progress', 'Progreso'],
  ['session', 'Sesión'],
  ['settings', 'Respaldo'],
];

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
        <h1>Audiorapy</h1>
        {unlocked && (
          <button type="button" className="ghost" onClick={lock}>
            Bloquear
          </button>
        )}
      </header>

      {!unlocked ? (
        <VaultGate stored={stored} onOpen={open} onForget={() => setStored(null)} />
      ) : (
        <>
          <nav className="tabs" aria-label="Secciones">
            {TABS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-current={tab === id ? 'page' : undefined}
                onClick={() => setTab(id)}
              >
                {label}
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
      <footer className="foot">Cifrado en este navegador · El servidor solo ve la agenda</footer>
    </div>
  );
}
