import type { TrackingMode } from '@/modules/exercises';
import type { Session, SessionExercise } from '../model/session';
import { liveExercises, liveSets } from './session';

/**
 * MET-Werte nach dem Adult Compendium of Physical Activities 2024 (evolution-plan.md Abschnitt 7,
 * product-research.md Abschnitt 13): Krafttraining mit mehreren Übungen 8–15 Wdh. 3,5;
 * Körpergewichtsübungen allgemein 3,0. Laufband und Co. ohne Tempo bekommen keinen Wert (Q-16).
 */
export const MET = { strength: 3.5, bodyweight: 3.0 } as const;

const CARDIO_MODES: readonly TrackingMode[] = ['time_distance'];

/** MET einer Übung oder `null`, wenn sie keinen Kalorienwert bekommt. */
export function metFor(exercise: Pick<SessionExercise, 'trackingMode'>): number | null {
  if (CARDIO_MODES.includes(exercise.trackingMode)) return null;
  return exercise.trackingMode === 'reps' || exercise.trackingMode === 'time'
    ? MET.bodyweight
    : MET.strength;
}

export interface CalorieEstimate {
  kcal: number;
  /** Minuten mit Kalorienwert; Cardio ohne Tempo zählt nicht. */
  countedMinutes: number;
  /** Minuten von Übungen ohne Kalorienwert (nur Dauer). */
  uncountedMinutes: number;
}

/**
 * Kalorienschätzung einer Einheit: kcal pro Minute = MET × 3,5 × Körpergewicht ÷ 200. Die
 * Dauer der Einheit wird nach erledigten Sätzen auf die Übungen verteilt; Übungen ohne MET
 * (Cardio ohne Tempo) nehmen ihre gemessene Zeit aus der Rechnung. Ohne Körpergewicht `null`.
 */
export function estimateCalories(
  session: Pick<Session, 'exercises' | 'durationSec'>,
  bodyWeightKg: number | undefined,
): CalorieEstimate | null {
  if (bodyWeightKg === undefined || !session.durationSec) return null;
  const exercises = liveExercises(session).map((exercise) => ({
    met: metFor(exercise),
    doneSets: liveSets(exercise).filter((set) => set.status === 'done'),
  }));
  const uncountedSec = exercises
    .filter((e) => e.met === null)
    .reduce(
      (sum, e) => sum + e.doneSets.reduce((inner, set) => inner + (set.actual.durationSec ?? 0), 0),
      0,
    );
  const countedSec = Math.max(0, session.durationSec - uncountedSec);
  const counted = exercises.filter(
    (e): e is { met: number; doneSets: typeof e.doneSets } => e.met !== null,
  );
  const totalSets = counted.reduce((sum, e) => sum + e.doneSets.length, 0);
  let kcal = 0;
  if (totalSets > 0 && countedSec > 0) {
    for (const e of counted) {
      const minutes = (countedSec / 60) * (e.doneSets.length / totalSets);
      kcal += (e.met * 3.5 * bodyWeightKg * minutes) / 200;
    }
  }
  return {
    kcal: Math.round(kcal),
    countedMinutes: Math.round(countedSec / 60),
    uncountedMinutes: Math.round(uncountedSec / 60),
  };
}
