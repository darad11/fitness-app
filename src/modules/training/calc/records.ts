import type { TrackingMode } from '@/modules/exercises';
import type { HistoryRow } from '../model/history';
import type { SetValues } from '../model/session';

const v = (values: SetValues, key: keyof SetValues) => values[key] ?? 0;

/** Positiv, wenn `a` besser ist als `b`; gleiche Regel wie der beste Satz (D-241, TH-05). */
export function compareBest(mode: TrackingMode, a: SetValues, b: SetValues): number {
  switch (mode) {
    case 'weight_reps':
    case 'weight_time':
      return (
        v(a, 'weightKg') - v(b, 'weightKg') ||
        v(a, 'reps') - v(b, 'reps') ||
        v(a, 'durationSec') - v(b, 'durationSec')
      );
    case 'reps':
      return v(a, 'reps') - v(b, 'reps');
    case 'time':
      return v(a, 'durationSec') - v(b, 'durationSec');
    case 'time_distance':
      return v(a, 'distanceM') - v(b, 'distanceM');
    case 'assisted_reps':
      return v(b, 'assistKg') - v(a, 'assistKg') || v(a, 'reps') - v(b, 'reps');
  }
}

/** Neue Bestleistung: besser als jede frühere Einheit dieser Übung; ohne frühere Einheit keine. */
export function isNewRecord(
  rows: readonly HistoryRow[],
  exerciseId: string,
  mode: TrackingMode,
  values: SetValues,
  excludeSessionId: string,
): boolean {
  const earlier = rows.filter(
    (row) => row.exerciseId === exerciseId && row.sessionId !== excludeSessionId && row.best,
  );
  if (earlier.length === 0) return false;
  return earlier.every((row) => compareBest(mode, values, row.best ?? {}) > 0);
}
