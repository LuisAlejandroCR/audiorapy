// records.ts: clinical records as they exist in clear, only in memory after unlock, plus the
// synthetic demo data set. Every synthetic record is labeled as such.
import {
  append,
  decryptRecord,
  encryptRecord,
  type CueLevel,
  type LogEntry,
  type SoapNote,
  type TargetSession,
} from '@audiorapy/domain';

export interface Patient {
  kind: 'patient';
  id: string;
  alias: string;
  synthetic: boolean;
  targets: Array<{ id: string; label: string; criterionPercent: number }>;
}

export interface Session {
  kind: 'session';
  id: string;
  patientId: string;
  date: string; // YYYY-MM-DD
  targets: TargetSession[];
  therapistNotes: string;
}

export interface Note {
  kind: 'soap_note';
  id: string;
  sessionId: string;
  note: SoapNote;
  approvedAt: string;
}

export type ClinicalRecord = Patient | Session | Note;

export interface DecryptedLog {
  records: ClinicalRecord[];
  failed: number;
}

export function decryptLog(dek: Uint8Array, log: readonly LogEntry[]): DecryptedLog {
  const records: ClinicalRecord[] = [];
  let failed = 0;
  for (const entry of log) {
    const r = decryptRecord<ClinicalRecord>(dek, entry.record);
    if (r.ok) records.push(r.value);
    else failed++;
  }
  return { records, failed };
}

export function appendRecord(
  dek: Uint8Array,
  log: readonly LogEntry[],
  record: ClinicalRecord,
): LogEntry[] {
  return append(log, encryptRecord(dek, record.id, record.kind, record));
}

export function byKind<K extends ClinicalRecord['kind']>(records: ClinicalRecord[], kind: K) {
  return records.filter((r): r is Extract<ClinicalRecord, { kind: K }> => r.kind === kind);
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CUE_BY_PHASE: CueLevel[] = [
  'max',
  'mod',
  'mod',
  'min',
  'min',
  'min',
  'independent',
  'independent',
];

/** Deterministic synthetic caseload: one child, three targets, eight weekly sessions improving as cues fade. */
export function syntheticRecords(today: Date, seed = 7): ClinicalRecord[] {
  const rand = mulberry32(seed);
  const patient: Patient = {
    kind: 'patient',
    id: 'synthetic-patient-a',
    alias: 'Paciente sintético A',
    synthetic: true,
    targets: [
      { id: 't-s-initial', label: '/s/ inicial en palabras', criterionPercent: 80 },
      { id: 't-r-simple', label: '/r/ simple en sílabas', criterionPercent: 80 },
      { id: 't-phrases', label: 'Frases de 3 elementos', criterionPercent: 80 },
    ],
  };
  const sessions: Session[] = [];
  for (let i = 0; i < 8; i++) {
    const date = new Date(today.getTime() - (7 * (7 - i) + 1) * 86_400_000)
      .toISOString()
      .slice(0, 10);
    const targets = patient.targets.map((t, ti) => {
      const base = 0.35 + i * 0.07 - ti * 0.05;
      const trials = Array.from({ length: 10 }, () => ({
        correct: rand() < Math.min(0.95, base + (rand() - 0.5) * 0.15),
        cue: CUE_BY_PHASE[Math.min(7, Math.max(0, i - ti))]!,
      }));
      return { targetId: t.id, targetLabel: t.label, trials };
    });
    sessions.push({
      kind: 'session',
      id: `synthetic-session-${i + 1}`,
      patientId: patient.id,
      date,
      targets,
      therapistNotes: '',
    });
  }
  return [patient, ...sessions];
}
