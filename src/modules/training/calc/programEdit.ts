import type { TrackingMode } from '@/modules/exercises';
import {
  PLAN_LIMITS,
  type Day,
  type PlannedExercise,
  type PlannedSet,
  type Week,
  type Weekday,
} from '../model/program';
import { copyDay, copyWeek } from './programTree';

/**
 * Änderungen im Programm-Editor (AK-PRG-02 bis AK-PRG-04, D-257). Jede Funktion arbeitet auf
 * einer Kopie und gibt die neuen Wochen zurück; Positionen werden danach fortlaufend gezählt.
 * Texte wie „Woche 2" kommen von der Oberfläche.
 */
export class PlanEditError extends Error {
  override name = 'PlanEditError';
  constructor(readonly reason: 'limit' | 'last' | 'not_found' | 'invalid') {
    super(`Änderung nicht möglich: ${reason}`);
  }
}

export type Direction = -1 | 1;

export interface ExerciseChoice {
  id: string;
  name: string;
  trackingMode: TrackingMode;
}

/** Standard für neue Übungen (D-257): 3 Arbeitssätze, 8–12 Wdh. bzw. 30–45 s. */
const DEFAULT_REPS = { repsMin: 8, repsMax: 12 } as const;
const DEFAULT_DURATION = { durationMinSec: 30, durationMaxSec: 45 } as const;
const DEFAULT_WORKING_SETS = 3;

const usesReps = (mode: TrackingMode) =>
  mode === 'weight_reps' || mode === 'reps' || mode === 'assisted_reps';
const usesDuration = (mode: TrackingMode) => mode === 'time' || mode === 'weight_time';

function edit(weeks: readonly Week[], change: (draft: Week[]) => void): Week[] {
  const draft = structuredClone(weeks) as Week[];
  change(draft);
  renumber(draft);
  return draft;
}

function renumber(weeks: Week[]): void {
  weeks.forEach((week, w) => {
    week.position = w;
    week.days.forEach((day, d) => {
      day.position = d;
      day.exercises.forEach((exercise, e) => {
        exercise.position = e;
        exercise.sets.forEach((set, s) => {
          set.position = s;
        });
      });
    });
  });
}

function move(list: unknown[], index: number, direction: Direction): void {
  const target = index + direction;
  if (index < 0 || target < 0 || target >= list.length) return;
  const [item] = list.splice(index, 1);
  if (item !== undefined) list.splice(target, 0, item);
}

function findWeek(weeks: Week[], weekId: string): { week: Week; index: number } {
  const index = weeks.findIndex((week) => week.id === weekId);
  const week = weeks[index];
  if (!week) throw new PlanEditError('not_found');
  return { week, index };
}

function findDay(weeks: Week[], dayId: string): { week: Week; day: Day; index: number } {
  for (const week of weeks) {
    const index = week.days.findIndex((day) => day.id === dayId);
    const day = week.days[index];
    if (day) return { week, day, index };
  }
  throw new PlanEditError('not_found');
}

function findExercise(
  weeks: Week[],
  exerciseId: string,
): { day: Day; exercise: PlannedExercise; index: number } {
  for (const week of weeks) {
    for (const day of week.days) {
      const index = day.exercises.findIndex((exercise) => exercise.id === exerciseId);
      const exercise = day.exercises[index];
      if (exercise) return { day, exercise, index };
    }
  }
  throw new PlanEditError('not_found');
}

function findSet(
  weeks: Week[],
  setId: string,
): { exercise: PlannedExercise; set: PlannedSet; index: number } {
  for (const week of weeks) {
    for (const day of week.days) {
      for (const exercise of day.exercises) {
        const index = exercise.sets.findIndex((set) => set.id === setId);
        const set = exercise.sets[index];
        if (set) return { exercise, set, index };
      }
    }
  }
  throw new PlanEditError('not_found');
}

function emptyDay(id: string, name: string): Day {
  return { id, position: 0, name, exercises: [] };
}

// ---------------------------------------------------------------------------------------------
// Wochen

export function addWeek(
  weeks: readonly Week[],
  names: { week: string; day: string },
  newId: () => string,
): Week[] {
  return edit(weeks, (draft) => {
    if (draft.length >= PLAN_LIMITS.weeks) throw new PlanEditError('limit');
    draft.push({
      id: newId(),
      position: 0,
      name: names.week,
      days: [emptyDay(newId(), names.day)],
    });
  });
}

export function renameWeek(weeks: readonly Week[], weekId: string, name: string): Week[] {
  return edit(weeks, (draft) => {
    findWeek(draft, weekId).week.name = name;
  });
}

export function moveWeek(weeks: readonly Week[], weekId: string, direction: Direction): Week[] {
  return edit(weeks, (draft) => {
    move(draft, findWeek(draft, weekId).index, direction);
  });
}

/** Kopie direkt hinter dem Original, mit neuen IDs. */
export function duplicateWeek(
  weeks: readonly Week[],
  weekId: string,
  name: string,
  newId: () => string,
): Week[] {
  return edit(weeks, (draft) => {
    if (draft.length >= PLAN_LIMITS.weeks) throw new PlanEditError('limit');
    const { week, index } = findWeek(draft, weekId);
    draft.splice(index + 1, 0, { ...copyWeek(week, newId), name });
  });
}

/** Die letzte Woche bleibt; ein Programm hat mindestens eine Woche (AK-PRG-01). */
export function removeWeek(weeks: readonly Week[], weekId: string): Week[] {
  return edit(weeks, (draft) => {
    const { index } = findWeek(draft, weekId);
    if (draft.length <= 1) throw new PlanEditError('last');
    draft.splice(index, 1);
  });
}

// ---------------------------------------------------------------------------------------------
// Tage

export function addDay(
  weeks: readonly Week[],
  weekId: string,
  name: string,
  newId: () => string,
): Week[] {
  return edit(weeks, (draft) => {
    const { week } = findWeek(draft, weekId);
    if (week.days.length >= PLAN_LIMITS.daysPerWeek) throw new PlanEditError('limit');
    week.days.push(emptyDay(newId(), name));
  });
}

export interface DayPatch {
  name?: string;
  /** `null` entfernt den Hinweis. */
  weekdayHint?: Weekday | null;
  /** Leerer Text entfernt die Notiz. */
  notes?: string;
}

export function updateDay(weeks: readonly Week[], dayId: string, patch: DayPatch): Week[] {
  return edit(weeks, (draft) => {
    const { day } = findDay(draft, dayId);
    if (patch.name !== undefined) day.name = patch.name;
    if (patch.weekdayHint === null) delete day.weekdayHint;
    else if (patch.weekdayHint !== undefined) day.weekdayHint = patch.weekdayHint;
    if (patch.notes !== undefined) {
      const notes = patch.notes.trim();
      if (notes) day.notes = notes;
      else delete day.notes;
    }
  });
}

/** Innerhalb der Woche; über Wochengrenzen hinweg verschiebt die Oberfläche nicht. */
export function moveDay(weeks: readonly Week[], dayId: string, direction: Direction): Week[] {
  return edit(weeks, (draft) => {
    const { week, index } = findDay(draft, dayId);
    move(week.days, index, direction);
  });
}

export function duplicateDay(
  weeks: readonly Week[],
  dayId: string,
  name: string,
  newId: () => string,
): Week[] {
  return edit(weeks, (draft) => {
    const { week, day, index } = findDay(draft, dayId);
    if (week.days.length >= PLAN_LIMITS.daysPerWeek) throw new PlanEditError('limit');
    week.days.splice(index + 1, 0, { ...copyDay(day, newId), name });
  });
}

/** Jede Woche behält mindestens einen Tag; sonst die ganze Woche löschen. */
export function removeDay(weeks: readonly Week[], dayId: string): Week[] {
  return edit(weeks, (draft) => {
    const { week, index } = findDay(draft, dayId);
    if (week.days.length <= 1) throw new PlanEditError('last');
    week.days.splice(index, 1);
  });
}

// ---------------------------------------------------------------------------------------------
// Übungen

function defaultSets(mode: TrackingMode, newId: () => string): PlannedSet[] {
  const target = usesReps(mode) ? DEFAULT_REPS : usesDuration(mode) ? DEFAULT_DURATION : {};
  const count = mode === 'time_distance' ? 1 : DEFAULT_WORKING_SETS;
  return Array.from({ length: count }, (_, position) => ({
    id: newId(),
    position,
    type: 'working' as const,
    ...target,
  }));
}

export function addExercise(
  weeks: readonly Week[],
  dayId: string,
  choice: ExerciseChoice,
  newId: () => string,
): Week[] {
  return edit(weeks, (draft) => {
    const { day } = findDay(draft, dayId);
    if (day.exercises.length >= PLAN_LIMITS.exercisesPerDay) throw new PlanEditError('limit');
    day.exercises.push({
      id: newId(),
      position: 0,
      exerciseId: choice.id,
      nameSnapshot: choice.name,
      sets: defaultSets(choice.trackingMode, newId),
    });
  });
}

export interface ExercisePatch {
  /** `null` heißt: Pause aus den Einstellungen. */
  restSec?: number | null;
  notes?: string;
}

export function updateExercise(
  weeks: readonly Week[],
  exerciseId: string,
  patch: ExercisePatch,
): Week[] {
  return edit(weeks, (draft) => {
    const { exercise } = findExercise(draft, exerciseId);
    if (patch.restSec === null) delete exercise.restSec;
    else if (patch.restSec !== undefined) exercise.restSec = clampSeconds(patch.restSec);
    if (patch.notes !== undefined) {
      const notes = patch.notes.trim();
      if (notes) exercise.notes = notes;
      else delete exercise.notes;
    }
  });
}

export function moveExercise(
  weeks: readonly Week[],
  exerciseId: string,
  direction: Direction,
): Week[] {
  return edit(weeks, (draft) => {
    const { day, index } = findExercise(draft, exerciseId);
    move(day.exercises, index, direction);
  });
}

/**
 * Ersetzt die Übung im Plan (AK-PRG-03). Sätze bleiben; Ziele, die zur neuen Erfassungsart
 * nicht passen, fallen weg, fehlende bekommen den Standard.
 */
export function replaceExercise(
  weeks: readonly Week[],
  exerciseId: string,
  choice: ExerciseChoice,
): Week[] {
  return edit(weeks, (draft) => {
    const { exercise } = findExercise(draft, exerciseId);
    exercise.exerciseId = choice.id;
    exercise.nameSnapshot = choice.name;
    delete exercise.originalName;
    exercise.sets = exercise.sets.map((set) => adaptSet(set, choice.trackingMode));
  });
}

function adaptSet(set: PlannedSet, mode: TrackingMode): PlannedSet {
  const next: PlannedSet = { id: set.id, position: set.position, type: set.type };
  if (set.parentSetId) next.parentSetId = set.parentSetId;
  if (set.restSec !== undefined) next.restSec = set.restSec;
  if (usesReps(mode)) {
    next.repsMin = set.repsMin ?? DEFAULT_REPS.repsMin;
    next.repsMax = set.repsMax ?? DEFAULT_REPS.repsMax;
  }
  if (usesDuration(mode)) {
    next.durationMinSec = set.durationMinSec ?? DEFAULT_DURATION.durationMinSec;
    next.durationMaxSec = set.durationMaxSec ?? DEFAULT_DURATION.durationMaxSec;
  }
  if (mode === 'time_distance') {
    if (set.durationMinSec !== undefined && set.durationMaxSec !== undefined) {
      next.durationMinSec = set.durationMinSec;
      next.durationMaxSec = set.durationMaxSec;
    }
    if (set.distanceM !== undefined) next.distanceM = set.distanceM;
  }
  if ((mode === 'weight_reps' || mode === 'weight_time') && set.weightKg !== undefined) {
    next.weightKg = set.weightKg;
  }
  if (mode === 'assisted_reps' && set.assistKg !== undefined) next.assistKg = set.assistKg;
  return next;
}

export function removeExercise(weeks: readonly Week[], exerciseId: string): Week[] {
  return edit(weeks, (draft) => {
    const { day, index } = findExercise(draft, exerciseId);
    day.exercises.splice(index, 1);
  });
}

// ---------------------------------------------------------------------------------------------
// Sätze

/** Ziele eines Satzes ohne ID, Position, Typ und Verweis; Vorlage für neue Sätze. */
function targetOf(set: PlannedSet | undefined): Partial<PlannedSet> {
  if (!set) return {};
  const { id: _id, position: _position, type: _type, parentSetId: _parent, ...target } = set;
  return target;
}

/**
 * Neuer Aufwärm- oder Arbeitssatz (AK-PRG-04). Aufwärmsätze stehen vor dem ersten Arbeitssatz,
 * Arbeitssätze am Ende; das Ziel stammt vom letzten Satz desselben Typs.
 */
export function addSet(
  weeks: readonly Week[],
  exerciseId: string,
  type: 'warmup' | 'working',
  newId: () => string,
): Week[] {
  return edit(weeks, (draft) => {
    const { exercise } = findExercise(draft, exerciseId);
    if (exercise.sets.length >= PLAN_LIMITS.setsPerExercise) throw new PlanEditError('limit');
    const sameType = exercise.sets.filter((set) => set.type === type);
    const template = sameType.at(-1) ?? exercise.sets.find((set) => set.type === 'working');
    const set: PlannedSet = { ...targetOf(template), id: newId(), position: 0, type };
    if (type === 'warmup') {
      const firstOther = exercise.sets.findIndex((candidate) => candidate.type !== 'warmup');
      exercise.sets.splice(firstOther < 0 ? exercise.sets.length : firstOther, 0, set);
    } else {
      exercise.sets.push(set);
    }
  });
}

/** Drop-Satz hinter einem Arbeitssatz und seinen bisherigen Drops, ohne Pause davor. */
export function addDropSet(
  weeks: readonly Week[],
  parentSetId: string,
  newId: () => string,
): Week[] {
  return edit(weeks, (draft) => {
    const { exercise, set: parent, index } = findSet(draft, parentSetId);
    if (parent.type !== 'working') throw new PlanEditError('invalid');
    if (exercise.sets.length >= PLAN_LIMITS.setsPerExercise) throw new PlanEditError('limit');
    let insertAt = index + 1;
    while (exercise.sets[insertAt]?.parentSetId === parent.id) insertAt += 1;
    const previousDrop = exercise.sets[insertAt - 1];
    const template = previousDrop?.parentSetId === parent.id ? previousDrop : parent;
    exercise.sets.splice(insertAt, 0, {
      ...targetOf(template),
      id: newId(),
      position: 0,
      type: 'drop',
      parentSetId: parent.id,
      restSec: 0,
    });
  });
}

export interface Range {
  min: number;
  max: number;
}

export interface SetPatch {
  /** Nur zwischen Aufwärm- und Arbeitssatz; Drop-Sätze bleiben Drop-Sätze. */
  type?: 'warmup' | 'working';
  /** `null` entfernt das Ziel. Ein fester Wert ist ein Bereich mit min = max. */
  reps?: Range | null;
  duration?: Range | null;
  weightKg?: number | null;
  distanceM?: number | null;
  assistKg?: number | null;
  restSec?: number | null;
}

const clampSeconds = (value: number) => Math.min(24 * 60 * 60, Math.max(0, Math.round(value)));
const clampReps = (value: number) => Math.min(200, Math.max(0, Math.round(value)));
const clampKg = (value: number) => Math.min(500, Math.max(0, value));

function ordered(range: Range, clamp: (value: number) => number): [number, number] {
  const a = clamp(range.min);
  const b = clamp(range.max);
  return a <= b ? [a, b] : [b, a];
}

export function updateSet(weeks: readonly Week[], setId: string, patch: SetPatch): Week[] {
  return edit(weeks, (draft) => {
    const { exercise, set } = findSet(draft, setId);
    if (patch.type !== undefined && patch.type !== set.type) {
      if (set.type === 'drop') throw new PlanEditError('invalid');
      if (exercise.sets.some((candidate) => candidate.parentSetId === set.id)) {
        throw new PlanEditError('invalid');
      }
      set.type = patch.type;
    }
    if (patch.reps === null) {
      delete set.repsMin;
      delete set.repsMax;
    } else if (patch.reps) {
      [set.repsMin, set.repsMax] = ordered(patch.reps, clampReps);
    }
    if (patch.duration === null) {
      delete set.durationMinSec;
      delete set.durationMaxSec;
    } else if (patch.duration) {
      [set.durationMinSec, set.durationMaxSec] = ordered(patch.duration, clampSeconds);
    }
    if (patch.weightKg === null) delete set.weightKg;
    else if (patch.weightKg !== undefined) set.weightKg = clampKg(patch.weightKg);
    if (patch.assistKg === null) delete set.assistKg;
    else if (patch.assistKg !== undefined) set.assistKg = clampKg(patch.assistKg);
    if (patch.distanceM === null) delete set.distanceM;
    else if (patch.distanceM !== undefined) {
      set.distanceM = Math.min(1_000_000, Math.max(0, patch.distanceM));
    }
    if (patch.restSec === null) delete set.restSec;
    else if (patch.restSec !== undefined) set.restSec = clampSeconds(patch.restSec);
  });
}

/**
 * Entfernt einen Satz; mit einem Arbeitssatz gehen seine Drop-Sätze. Der letzte Arbeitssatz
 * einer Übung bleibt (sonst die Übung entfernen).
 */
export function removeSet(weeks: readonly Week[], setId: string): Week[] {
  return edit(weeks, (draft) => {
    const { exercise, set } = findSet(draft, setId);
    const working = exercise.sets.filter((candidate) => candidate.type === 'working');
    if (set.type === 'working' && working.length <= 1) throw new PlanEditError('last');
    exercise.sets = exercise.sets.filter(
      (candidate) => candidate.id !== set.id && candidate.parentSetId !== set.id,
    );
  });
}
