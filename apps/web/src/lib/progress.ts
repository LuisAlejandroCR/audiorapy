// progress.ts: single-case progress series per target — percent correct per session, colored by the
// dominant cue level, against the target's criterion line.
import { summarizeTarget, type CueLevel } from '@audiorapy/domain';
import type { Patient, Session } from './records.ts';

export interface ProgressPoint {
  sessionId: string;
  date: string;
  percent: number;
  total: number;
  dominantCue: CueLevel | null;
}

export interface ProgressSeries {
  targetId: string;
  label: string;
  criterionPercent: number;
  points: ProgressPoint[];
}

export function progressSeries(patient: Patient, sessions: Session[]): ProgressSeries[] {
  const ordered = sessions
    .filter((s) => s.patientId === patient.id)
    .sort((a, b) => a.date.localeCompare(b.date));
  return patient.targets.map((t) => ({
    targetId: t.id,
    label: t.label,
    criterionPercent: t.criterionPercent,
    points: ordered.flatMap((s) => {
      const block = s.targets.find((b) => b.targetId === t.id);
      if (!block || block.trials.length === 0) return [];
      const sum = summarizeTarget(block);
      return [
        {
          sessionId: s.id,
          date: s.date,
          percent: sum.percent,
          total: sum.total,
          dominantCue: sum.dominantCue,
        },
      ];
    }),
  }));
}
