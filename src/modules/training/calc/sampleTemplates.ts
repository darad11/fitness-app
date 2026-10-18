import { stableId } from '@/shared/lib/uuid';
import type {
  Day,
  PlannedExercise,
  PlannedSet,
  SampleTemplate,
  SampleTemplateSourceEntry,
  SetTarget,
} from '../model/program';

/** Wiederholungen der Aufwärmsätze: zwei Sätze 10 und 5, ein Satz 5 (sample-templates.md, D-243). */
const WARMUP_REPS: Record<number, readonly number[]> = { 1: [5], 2: [10, 5] };

export interface ExerciseRef {
  id: string;
  name: string;
}

/**
 * Baut aus der Quelle eine Vorlage mit stabilen IDs (UUID v5 aus Schlüssel und Position, D-207).
 * Wiederholte Tage (z. B. Woche 1: A, B, A) werden je Position eigenständig angelegt.
 * Wirft, wenn eine Übung nicht in der Bibliothek steht.
 */
export function expandSampleTemplate(
  source: SampleTemplateSourceEntry,
  findExercise: (key: string) => ExerciseRef | undefined,
): SampleTemplate {
  const base = `sample-template:${source.key}`;
  return {
    id: stableId(base),
    key: source.key,
    name: source.name,
    ...(source.description ? { description: source.description } : {}),
    ...(source.program ? { program: true } : {}),
    ...(source.source ? { source: source.source } : {}),
    level: source.level,
    location: source.location,
    daysPerWeek: source.daysPerWeek,
    repeat: source.repeat,
    weeks: source.weeks.map((dayNames, w) => ({
      id: stableId(`${base}:w${String(w)}`),
      position: w,
      name: `Woche ${String(w + 1)}`,
      days: dayNames.map((dayName, d): Day => {
        const dayBase = `${base}:w${String(w)}:d${String(d)}`;
        const day = source.days.find((candidate) => candidate.name === dayName);
        if (!day) throw new Error(`Unbekannter Tag in ${source.key}: ${dayName}`);
        return {
          id: stableId(dayBase),
          position: d,
          name: day.name,
          exercises: day.exercises.map((entry, e): PlannedExercise => {
            const exercise = findExercise(entry.exercise);
            if (!exercise) throw new Error(`Unbekannte Übung in ${source.key}: ${entry.exercise}`);
            const exerciseBase = `${dayBase}:e${String(e)}`;
            return {
              id: stableId(exerciseBase),
              position: e,
              exerciseId: exercise.id,
              nameSnapshot: exercise.name,
              restSec: entry.restSec,
              ...(entry.note ? { notes: entry.note } : {}),
              ...(entry.originalName ? { originalName: entry.originalName } : {}),
              sets: buildSets(exerciseBase, entry),
            };
          }),
        };
      }),
    })),
  };
}

function buildSets(
  exerciseBase: string,
  entry: SampleTemplateSourceEntry['days'][number]['exercises'][number],
): PlannedSet[] {
  const sets: PlannedSet[] = [];
  const add = (type: PlannedSet['type'], target: SetTarget, extra: Partial<PlannedSet> = {}) => {
    const position = sets.length;
    const set: PlannedSet = {
      id: stableId(`${exerciseBase}:s${String(position)}`),
      position,
      type,
      ...target,
      ...extra,
    };
    sets.push(set);
    return set;
  };
  for (const reps of WARMUP_REPS[entry.warmup] ?? []) {
    add('warmup', { repsMin: reps, repsMax: reps });
  }
  let last: PlannedSet | undefined;
  for (let i = 0; i < entry.working; i++) last = add('working', entry.target);
  if (entry.drop && entry.dropTarget && last) {
    // Drop-Sätze gehören zum letzten Arbeitssatz und folgen ohne Pause (sample-templates.md).
    for (let i = 0; i < entry.drop; i++) {
      add('drop', entry.dropTarget, { parentSetId: last.id, restSec: 0 });
    }
  }
  return sets;
}

/** Tage einer Vorlage ohne Wiederholungen, in der Reihenfolge ihres ersten Auftretens. */
export function distinctDays(template: SampleTemplate): Day[] {
  const seen = new Map<string, Day>();
  for (const week of template.weeks) {
    for (const day of week.days) if (!seen.has(day.name)) seen.set(day.name, day);
  }
  return [...seen.values()];
}

export interface SetSummary {
  warmup: number;
  working: number;
  drop: number;
  /** Zielbereich der Arbeitssätze. */
  target: SetTarget;
  dropTarget?: SetTarget;
}

/** Fasst das Satzschema einer geplanten Übung zusammen, z. B. für „2 Aufwärmen + 3". */
export function summarizeSets(exercise: PlannedExercise): SetSummary {
  const of = (type: PlannedSet['type']) => exercise.sets.filter((set) => set.type === type);
  const working = of('working');
  const drop = of('drop');
  return {
    warmup: of('warmup').length,
    working: working.length,
    drop: drop.length,
    target: pickTarget(working[0]),
    ...(drop[0] ? { dropTarget: pickTarget(drop[0]) } : {}),
  };
}

function pickTarget(set: PlannedSet | undefined): SetTarget {
  if (!set) return {};
  const { repsMin, repsMax, durationMinSec, durationMaxSec } = set;
  return Object.fromEntries(
    Object.entries({ repsMin, repsMax, durationMinSec, durationMaxSec }).filter(
      ([, value]) => value !== undefined,
    ),
  );
}
