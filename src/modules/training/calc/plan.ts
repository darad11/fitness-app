import type { DistanceUnit, TrackingMode } from '@/modules/exercises';
import type { PlanTree, SetType } from '../model/program';
import type { Session, SessionSetTarget } from '../model/session';

/**
 * Eingaben zum Start einer Einheit und die Planung aus einem Programmtag. Ohne Datenbank, damit
 * „Heute“ den Trainingsdienst erst beim Start lädt (D-307).
 */

export class ItemNotFoundError extends Error {
  override name = 'ItemNotFoundError';
}

export interface PlannedSetInput {
  type: SetType;
  /** Bei Drop-Sätzen: Index des Arbeitssatzes in dieser Liste. */
  parentIndex?: number;
  target?: SessionSetTarget;
  restSec?: number;
}

/** Übung, wie sie in eine Einheit übernommen wird (Snapshot von Name und Erfassungsart). */
export interface ExerciseInput {
  exerciseId: string;
  name: string;
  trackingMode: TrackingMode;
  distanceUnit?: DistanceUnit;
  perSide?: boolean;
  restSec?: number;
  /** Ausführungshinweis aus dem Programm, z. B. die Dropset-Regel. */
  notes?: string;
  sets: readonly PlannedSetInput[];
}

export interface StartInput {
  source: Session['source'];
  title: string;
  program?: Session['program'];
  exercises: readonly ExerciseInput[];
}

export interface ExerciseInfo {
  id: string;
  name: string;
  trackingMode: TrackingMode;
  distanceUnit?: DistanceUnit;
  isUnilateral?: boolean;
}

/**
 * Einheit aus einem Tag einer Vorlage, ohne Kopie der Vorlage (S-49, AK-PRG-06). Aus dem aktiven
 * Programm gestartet ist die Quelle `program`, sonst `template` (D-249).
 */
export function planFromTemplateDay(
  template: PlanTree & { key?: string; sampleKey?: string },
  weekIndex: number,
  dayIndex: number,
  lookup: (exerciseId: string) => ExerciseInfo | undefined,
  source: 'program' | 'template' = 'template',
): StartInput {
  const week = template.weeks[weekIndex];
  const day = week?.days[dayIndex];
  if (!week || !day) throw new ItemNotFoundError('Trainingstag nicht gefunden');
  return {
    source,
    title: `${day.name} · ${template.name}`,
    program: {
      programId: template.id,
      programName: template.name,
      ...((template.key ?? template.sampleKey)
        ? { sampleKey: template.key ?? template.sampleKey }
        : {}),
      weekId: week.id,
      weekIndex,
      weekName: week.name,
      dayId: day.id,
      dayIndex,
      dayName: day.name,
    },
    exercises: day.exercises.map((planned) => {
      const info = lookup(planned.exerciseId);
      if (!info) throw new ItemNotFoundError(`Übung fehlt: ${planned.nameSnapshot}`);
      return {
        exerciseId: info.id,
        name: info.name,
        trackingMode: info.trackingMode,
        ...(info.distanceUnit ? { distanceUnit: info.distanceUnit } : {}),
        ...(info.isUnilateral ? { perSide: true } : {}),
        ...(planned.restSec !== undefined ? { restSec: planned.restSec } : {}),
        ...(planned.notes ? { notes: planned.notes } : {}),
        sets: planned.sets.map((set) => {
          const parentIndex = set.parentSetId
            ? planned.sets.findIndex((candidate) => candidate.id === set.parentSetId)
            : -1;
          const target: SessionSetTarget = {};
          if (set.repsMin !== undefined) target.repsMin = set.repsMin;
          if (set.repsMax !== undefined) target.repsMax = set.repsMax;
          if (set.durationMinSec !== undefined) target.durationMinSec = set.durationMinSec;
          if (set.durationMaxSec !== undefined) target.durationMaxSec = set.durationMaxSec;
          if (set.weightKg !== undefined) target.weightKg = set.weightKg;
          if (set.distanceM !== undefined) target.distanceM = set.distanceM;
          if (set.assistKg !== undefined) target.assistKg = set.assistKg;
          return {
            type: set.type,
            ...(parentIndex >= 0 ? { parentIndex } : {}),
            target,
            ...(set.restSec !== undefined ? { restSec: set.restSec } : {}),
          };
        }),
      };
    }),
  };
}
