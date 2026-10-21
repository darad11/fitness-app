import type { TrackingMode } from '@/modules/exercises';
import {
  LIMITS,
  type Session,
  type SessionExercise,
  type SessionSet,
  type SetValues,
} from '../model/session';

/** Nicht gelöschte Kinder in ihrer Reihenfolge. */
export function liveExercises(session: Pick<Session, 'exercises'>): SessionExercise[] {
  return session.exercises
    .filter((exercise) => exercise.deletedAt === null)
    .sort((a, b) => a.position - b.position);
}

export function liveSets(exercise: Pick<SessionExercise, 'sets'>): SessionSet[] {
  return exercise.sets
    .filter((set) => set.deletedAt === null)
    .sort((a, b) => a.position - b.position);
}

// ---------------------------------------------------------------------------------------------
// Eingaben und Pflichtfelder

export type ValueField = keyof SetValues;

/** Felder, die ein erledigter Satz je Erfassungsart braucht (D-241). */
export const REQUIRED_FIELDS: Record<TrackingMode, readonly ValueField[]> = {
  weight_reps: ['weightKg', 'reps'],
  reps: ['reps'],
  time: ['durationSec'],
  weight_time: ['weightKg', 'durationSec'],
  time_distance: ['durationSec', 'distanceM'],
  assisted_reps: ['assistKg', 'reps'],
};

export type ValueError = 'range' | 'whole';

/** Prüft einen einzelnen Wert gegen die Grenzen aus AK-TRN-04. */
export function checkValue(field: ValueField, value: number): ValueError | null {
  const limits = LIMITS[field];
  if (!Number.isFinite(value) || value < limits.min || value > limits.max) return 'range';
  if ((field === 'reps' || field === 'durationSec') && !Number.isInteger(value)) return 'whole';
  return null;
}

// ---------------------------------------------------------------------------------------------
// Vorschläge (AK-TRN-06, D-225)

/**
 * Vorschlag je Feld: der Vorwert des passenden Satzes, sonst ein fester Zielwert (Bereich mit
 * gleichem Minimum und Maximum, festes Gewicht). Bereiche wie 8–10 ergeben keinen Vorschlag.
 */
export function suggestValues(set: SessionSet, previous: SetValues | undefined): SetValues {
  const target = set.target ?? {};
  const fixed: SetValues = {};
  if (target.weightKg !== undefined) fixed.weightKg = target.weightKg;
  if (target.assistKg !== undefined) fixed.assistKg = target.assistKg;
  if (target.distanceM !== undefined) fixed.distanceM = target.distanceM;
  if (target.repsMin !== undefined && target.repsMin === target.repsMax)
    fixed.reps = target.repsMin;
  if (target.durationMinSec !== undefined && target.durationMinSec === target.durationMaxSec) {
    fixed.durationSec = target.durationMinSec;
  }
  return { ...fixed, ...previous };
}

/**
 * Werte für „erledigt": Eingaben gehen vor, leere Pflichtfelder übernehmen sichtbare Vorschläge.
 * Liefert die fehlenden Pflichtfelder, wenn es keinen Vorschlag gibt.
 */
export function resolveCompletion(
  mode: TrackingMode,
  actual: SetValues,
  suggestion: SetValues,
): { values: SetValues; missing: ValueField[] } {
  const values: SetValues = { ...actual };
  const missing: ValueField[] = [];
  for (const field of REQUIRED_FIELDS[mode]) {
    if (values[field] !== undefined) continue;
    const suggested = suggestion[field];
    if (suggested === undefined) missing.push(field);
    else values[field] = suggested;
  }
  return { values, missing };
}

// ---------------------------------------------------------------------------------------------
// Zuordnung zu Vorwerten (AK-TRN-05)

/**
 * Schlüssel eines Satzes für den Vergleich mit früheren Einheiten: Typ und Position innerhalb
 * des Typs; Drop-Sätze über die Position ihres Arbeitssatzes und ihre Stelle in der Kette.
 */
export function setSlot(exercise: Pick<SessionExercise, 'sets'>, setId: string): string | null {
  const sets = liveSets(exercise);
  const set = sets.find((candidate) => candidate.id === setId);
  if (!set) return null;
  if (set.type !== 'drop') {
    const index = sets.filter((s) => s.type === set.type).findIndex((s) => s.id === set.id);
    return `${set.type}:${String(index)}`;
  }
  const working = sets.filter((s) => s.type === 'working');
  const parentIndex = working.findIndex((s) => s.id === set.parentSetId);
  const chain = sets.filter((s) => s.type === 'drop' && s.parentSetId === set.parentSetId);
  return `drop:${String(parentIndex)}:${String(chain.findIndex((s) => s.id === set.id))}`;
}

// ---------------------------------------------------------------------------------------------
// Kennzahlen (data-model.md Abschnitt 9)

/** Geschätztes 1RM: bei 1 Wiederholung das Gewicht, 2 bis 10 nach Epley, darüber keins (D-224). */
export function estimateOneRepMax(weightKg: number, reps: number): number | null {
  if (!Number.isInteger(reps) || reps < 1 || reps > 10 || weightKg <= 0) return null;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

const countsForVolume = (set: SessionSet) =>
  set.status === 'done' && (set.type === 'working' || set.type === 'drop');

/** Volumen einer Übung: Σ Gewicht × Wiederholungen ohne Aufwärmsätze; nur bei `weight_reps`. */
export function exerciseVolume(exercise: SessionExercise): number {
  if (exercise.trackingMode !== 'weight_reps') return 0;
  return liveSets(exercise)
    .filter(countsForVolume)
    .reduce((sum, set) => sum + (set.actual.weightKg ?? 0) * (set.actual.reps ?? 0), 0);
}

/** Wiederholungen ohne Aufwärmsätze, für Übungen, die nur Wiederholungen erfassen. */
export function exerciseReps(exercise: SessionExercise): number {
  if (exercise.trackingMode !== 'reps') return 0;
  return liveSets(exercise)
    .filter(countsForVolume)
    .reduce((sum, set) => sum + (set.actual.reps ?? 0), 0);
}

export function sessionVolume(session: Pick<Session, 'exercises'>): number {
  return liveExercises(session).reduce((sum, exercise) => sum + exerciseVolume(exercise), 0);
}

/**
 * Bester erledigter Satz ohne Aufwärmsätze: höchstes Gewicht, bei Gleichstand mehr
 * Wiederholungen; bei Wiederholungen die meisten; bei Zeit die längste Dauer; bei Distanz die
 * größte Distanz; bei Entlastung die geringste, bei Gleichstand mehr Wiederholungen (D-241).
 */
export function bestSet(exercise: SessionExercise): SessionSet | null {
  const done = liveSets(exercise).filter(countsForVolume);
  const v = (set: SessionSet, field: ValueField) => set.actual[field] ?? 0;
  const better: Record<TrackingMode, (a: SessionSet, b: SessionSet) => boolean> = {
    weight_reps: (a, b) =>
      v(a, 'weightKg') > v(b, 'weightKg') ||
      (v(a, 'weightKg') === v(b, 'weightKg') && v(a, 'reps') > v(b, 'reps')),
    reps: (a, b) => v(a, 'reps') > v(b, 'reps'),
    time: (a, b) => v(a, 'durationSec') > v(b, 'durationSec'),
    weight_time: (a, b) =>
      v(a, 'weightKg') > v(b, 'weightKg') ||
      (v(a, 'weightKg') === v(b, 'weightKg') && v(a, 'durationSec') > v(b, 'durationSec')),
    time_distance: (a, b) => v(a, 'distanceM') > v(b, 'distanceM'),
    assisted_reps: (a, b) =>
      v(a, 'assistKg') < v(b, 'assistKg') ||
      (v(a, 'assistKg') === v(b, 'assistKg') && v(a, 'reps') > v(b, 'reps')),
  };
  const isBetter = better[exercise.trackingMode];
  return done.reduce<SessionSet | null>(
    (best, set) => (best === null || isBetter(set, best) ? set : best),
    null,
  );
}

/** Höchstes geschätztes 1RM der erledigten Arbeits- und Drop-Sätze; nur bei `weight_reps`. */
export function bestOneRepMax(exercise: SessionExercise): number | null {
  if (exercise.trackingMode !== 'weight_reps') return null;
  let best: number | null = null;
  for (const set of liveSets(exercise).filter(countsForVolume)) {
    const estimate = estimateOneRepMax(set.actual.weightKg ?? 0, set.actual.reps ?? 0);
    if (estimate !== null && (best === null || estimate > best)) best = estimate;
  }
  return best;
}

/** Dauer in Sekunden: (Ende oder jetzt) − Start − Pausen. */
export function sessionDurationSec(
  session: Pick<Session, 'startedAt' | 'endedAt' | 'pauses'>,
  now: Date,
): number {
  const end = session.endedAt ? Date.parse(session.endedAt) : now.getTime();
  const paused = session.pauses.reduce((sum, pause) => {
    const pauseEnd = pause.end ? Date.parse(pause.end) : end;
    return sum + Math.max(0, pauseEnd - Date.parse(pause.start));
  }, 0);
  return Math.max(0, Math.floor((end - Date.parse(session.startedAt) - paused) / 1000));
}

export interface Progress {
  done: number;
  skipped: number;
  /** Alle Sätze außer übersprungenen. */
  total: number;
}

export function exerciseProgress(exercise: SessionExercise): Progress {
  const sets = liveSets(exercise);
  const done = sets.filter((set) => set.status === 'done').length;
  const skipped = sets.filter((set) => set.status === 'skipped').length;
  return { done, skipped, total: sets.length - skipped };
}

export function sessionProgress(session: Pick<Session, 'exercises'>): Progress {
  return liveExercises(session)
    .map(exerciseProgress)
    .reduce(
      (sum, p) => ({
        done: sum.done + p.done,
        skipped: sum.skipped + p.skipped,
        total: sum.total + p.total,
      }),
      {
        done: 0,
        skipped: 0,
        total: 0,
      },
    );
}

/** Erster offener Satz nach dem angegebenen, über Übungsgrenzen hinweg (für den Pausentimer). */
export function nextOpenSet(
  session: Pick<Session, 'exercises'>,
  afterSetId?: string,
): { exercise: SessionExercise; set: SessionSet } | null {
  const ordered = liveExercises(session).flatMap((exercise) =>
    liveSets(exercise).map((set) => ({ exercise, set })),
  );
  const start = afterSetId ? ordered.findIndex((entry) => entry.set.id === afterSetId) + 1 : 0;
  return (
    [...ordered.slice(start), ...ordered.slice(0, start)].find(
      (entry) => entry.set.status === 'planned',
    ) ?? null
  );
}

/** Zeitpunkt des zuletzt erledigten Satzes; `undefined`, wenn noch keiner erledigt ist. */
export function lastCompletedAt(session: Pick<Session, 'exercises'>): string | undefined {
  let last: string | undefined;
  for (const exercise of liveExercises(session)) {
    for (const set of liveSets(exercise)) {
      if (set.status === 'done' && set.completedAt && (!last || set.completedAt > last)) {
        last = set.completedAt;
      }
    }
  }
  return last;
}

/**
 * Ende beim Beenden (D-290): Blieb die Einheit länger als die Höchstdauer offen (Beenden
 * vergessen), endet sie mit dem letzten erledigten Satz; sonst, und ohne erledigten Satz, jetzt.
 */
export function finishEndedAt(
  session: Pick<Session, 'startedAt' | 'pauses' | 'exercises'>,
  now: Date,
  maxSec: number,
): string {
  const nowIso = now.toISOString();
  if (sessionDurationSec({ ...session, endedAt: nowIso }, now) <= maxSec) return nowIso;
  const last = lastCompletedAt(session);
  return last !== undefined && last > session.startedAt ? last : nowIso;
}

/** Hervorgehobener Satz: der nächste offene nach dem zuletzt erledigten (freie Reihenfolge). */
export function currentSet(session: Pick<Session, 'exercises'>): SessionSet | null {
  let last: SessionSet | undefined;
  for (const exercise of liveExercises(session)) {
    for (const set of liveSets(exercise)) {
      if (
        set.status === 'done' &&
        set.completedAt &&
        (!last?.completedAt || set.completedAt >= last.completedAt)
      ) {
        last = set;
      }
    }
  }
  return nextOpenSet(session, last?.id)?.set ?? null;
}
