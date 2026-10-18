import { startOfWeek, type DayKey } from '@/shared/lib/time';
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
  sessionProgress,
  sessionVolume,
  setSlot,
} from './session';

export interface SessionSummary {
  durationSec: number;
  exercises: number;
  doneSets: number;
  volumeKg: number;
}

/** Kennzahlen einer abgeschlossenen Einheit für Verlauf und Zusammenfassung (AK-HIS-01). */
export function summarizeSession(session: Session): SessionSummary {
  return {
    durationSec: session.durationSec ?? 0,
    exercises: liveExercises(session).length,
    doneSets: sessionProgress(session).done,
    volumeKg: Math.round(sessionVolume(session)),
  };
}

export interface WeekGroup<T> {
  /** Montag der Woche als `dayKey`. */
  weekStart: DayKey;
  items: T[];
}

/** Gruppiert nach Kalenderwoche (Montag bis Sonntag) in der Reihenfolge der Eingabe. */
export function groupByWeek<T extends { dayKey: string }>(items: readonly T[]): WeekGroup<T>[] {
  const groups: WeekGroup<T>[] = [];
  for (const item of items) {
    const weekStart = startOfWeek(item.dayKey);
    const last = groups.at(-1);
    if (last?.weekStart === weekStart) last.items.push(item);
    else groups.push({ weekStart, items: [item] });
  }
  return groups;
}

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
