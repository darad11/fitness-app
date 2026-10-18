import type { Day, PlannedSet } from '../model/program';

export interface DayEstimate {
  exercises: number;
  sets: number;
  /** Geschätzte Dauer in Sekunden. */
  seconds: number;
}

/** Aufbau und Vorbereitung je Satz; Wechsel zwischen zwei Übungen. */
const SETUP_SEC = 15;
const PER_REP_SEC = 3;
const TRANSITION_SEC = 60;

/** Arbeitszeit eines Satzes: Zielzeit, sonst Wiederholungen × 3 s (ohne Ziel 10). */
function workSec(set: PlannedSet): number {
  if (set.durationMaxSec !== undefined) return set.durationMaxSec;
  return (set.repsMax ?? 10) * PER_REP_SEC;
}

/**
 * Geschätzte Dauer eines Trainingstags (Tagesvorschau, Schritt D): je Satz Aufbau und Arbeit,
 * dazu die Pause nach jedem Satz außer dem letzten der Übung, zwischen Übungen ein Wechsel.
 * Drop-Sätze haben keine Pause. Grob gerundet erst in der Anzeige.
 */
export function estimateDay(day: Pick<Day, 'exercises'>, defaultRestSec: number): DayEstimate {
  let seconds = 0;
  let sets = 0;
  day.exercises.forEach((exercise, index) => {
    if (index > 0) seconds += TRANSITION_SEC;
    exercise.sets.forEach((set, position) => {
      sets += 1;
      seconds += SETUP_SEC + workSec(set);
      const last = position === exercise.sets.length - 1;
      if (!last) seconds += set.restSec ?? exercise.restSec ?? defaultRestSec;
    });
  });
  return { exercises: day.exercises.length, sets, seconds };
}

/** Minuten, auf 5 gerundet, mindestens 5. */
export function roundMinutes(seconds: number): number {
  return Math.max(5, Math.round(seconds / 60 / 5) * 5);
}
