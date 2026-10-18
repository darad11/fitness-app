import type { HistoryRow } from '../model/history';
import { HISTORY_VERSION } from '../model/history';
import type { Session, SessionExercise, SetValues } from '../model/session';
import {
  bestOneRepMax,
  bestSet,
  exerciseReps,
  exerciseVolume,
  liveExercises,
  liveSets,
  setSlot,
} from './session';

/**
 * Zeilen der Projektion für eine abgeschlossene Einheit. Kommt eine Übung mehrfach vor, zählen
 * ihre Sätze zusammen, in der Reihenfolge der Einheit.
 */
export function buildHistoryRows(session: Session): HistoryRow[] {
  if (session.status !== 'completed' || !session.endedAt) return [];
  const groups = new Map<string, SessionExercise>();
  for (const exercise of liveExercises(session)) {
    const existing = groups.get(exercise.exerciseId);
    if (existing)
      existing.sets = [
        ...liveSets(existing),
        ...renumber(liveSets(exercise), existing.sets.length),
      ];
    else groups.set(exercise.exerciseId, { ...exercise, sets: liveSets(exercise) });
  }
  return [...groups.values()].map((exercise) => {
    const done = exercise.sets.filter((set) => set.status === 'done');
    const best = bestSet(exercise);
    return {
      id: `${session.id}:${exercise.exerciseId}`,
      version: HISTORY_VERSION,
      exerciseId: exercise.exerciseId,
      sessionId: session.id,
      completedAt: session.endedAt ?? session.startedAt,
      dayKey: session.dayKey,
      title: session.title,
      trackingMode: exercise.trackingMode,
      sets: done.map((set) => ({
        slot: setSlot(exercise, set.id) ?? '',
        type: set.type,
        values: set.actual,
      })),
      best: best ? best.actual : null,
      bestOneRepMax: bestOneRepMax(exercise),
      volumeKg: exerciseVolume(exercise),
      reps: exerciseReps(exercise),
      setCount: done.filter((set) => set.type !== 'warmup').length,
    };
  });
}

function renumber<T extends { position: number }>(sets: T[], offset: number): T[] {
  return sets.map((set, index) => ({ ...set, position: offset + index }));
}

/** Werte des passenden Satzes aus einer früheren Einheit (AK-TRN-05). */
export function previousValues(
  row: HistoryRow | undefined,
  slot: string | null,
): SetValues | undefined {
  if (!row || slot === null) return undefined;
  return row.sets.find((set) => set.slot === slot)?.values;
}
