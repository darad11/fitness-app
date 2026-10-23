import { isPause } from '@/shared/lib/pause';
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
 * Liegt zwischen dieser Woche und der nächstälteren eine Pause von mindestens 14 Tagen ohne
 * Training? Der Verlauf beschriftet sie mit „Pause“ statt einer leeren Strecke (D-319).
 * Erwartet die Gruppen wie `groupByWeek` aus einer Liste, die mit dem neuesten Eintrag beginnt.
 */
export function pauseAfterGroup<T extends { dayKey: string }>(
  groups: readonly WeekGroup<T>[],
  index: number,
): boolean {
  const oldestHere = groups[index]?.items.at(-1);
  const newestOlder = groups[index + 1]?.items[0];
  return (
    oldestHere !== undefined &&
    newestOlder !== undefined &&
    isPause(newestOlder.dayKey, oldestHere.dayKey)
  );
}

/**
 * Zeilen der Projektion für eine abgeschlossene Einheit. Kommt eine Übung mehrfach vor, zählen
 * ihre Sätze zusammen, in der Reihenfolge der Einheit.
 */
export function buildHistoryRows(session: Session): HistoryRow[] {
  if (session.status !== 'completed' || !session.endedAt) return [];
  const groups = new Map<string, SessionExercise>();
  const notes = new Map<string, string[]>();
  for (const exercise of liveExercises(session)) {
    const existing = groups.get(exercise.exerciseId);
    if (existing)
      existing.sets = [
        ...liveSets(existing),
        ...renumber(liveSets(exercise), existing.sets.length),
      ];
    else groups.set(exercise.exerciseId, { ...exercise, sets: liveSets(exercise) });
    if (exercise.note) {
      const list = notes.get(exercise.exerciseId) ?? [];
      list.push(exercise.note);
      notes.set(exercise.exerciseId, list);
    }
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
      ...(notes.has(exercise.exerciseId)
        ? { note: (notes.get(exercise.exerciseId) ?? []).join(' · ') }
        : {}),
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

export interface SessionComparison {
  previous: Session;
  volumeDiffKg: number;
  doneSetsDiff: number;
}

/**
 * Vergleich mit der letzten abgeschlossenen Einheit desselben Programmtags (gleiche `dayId`),
 * nur wenn es eine gibt (AK-TRN-20, data-model.md Abschnitt 9).
 */
export function compareWithPrevious(
  session: Session,
  sessions: readonly Session[],
): SessionComparison | null {
  const dayId = session.program?.dayId;
  if (!dayId || !session.endedAt) return null;
  const previous = sessions
    .filter(
      (candidate) =>
        candidate.id !== session.id &&
        candidate.status === 'completed' &&
        candidate.program?.dayId === dayId &&
        candidate.endedAt !== undefined &&
        candidate.endedAt < (session.endedAt ?? ''),
    )
    .sort((a, b) => (b.endedAt ?? '').localeCompare(a.endedAt ?? ''))[0];
  if (!previous) return null;
  const current = summarizeSession(session);
  const before = summarizeSession(previous);
  return {
    previous,
    volumeDiffKg: current.volumeKg - before.volumeKg,
    doneSetsDiff: current.doneSets - before.doneSets,
  };
}
