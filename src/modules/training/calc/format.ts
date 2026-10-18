import type { SetTarget } from '../model/program';

/** „6–8" oder „10"; bei Zeit „30–45 s". Leer, wenn kein Ziel gesetzt ist. */
export function formatTargetRange(
  target: SetTarget,
): { kind: 'reps' | 'time'; text: string } | null {
  const range = (min: number, max: number) =>
    min === max ? String(min) : `${String(min)}–${String(max)}`;
  if (target.repsMin !== undefined && target.repsMax !== undefined) {
    return { kind: 'reps', text: range(target.repsMin, target.repsMax) };
  }
  if (target.durationMinSec !== undefined && target.durationMaxSec !== undefined) {
    return { kind: 'time', text: `${range(target.durationMinSec, target.durationMaxSec)} s` };
  }
  return null;
}

/** Pausen ab einer Minute als „2:30 min", darunter als „45 s". */
export function formatRest(seconds: number): string {
  if (seconds < 60) return `${String(seconds)} s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes)}:${String(rest).padStart(2, '0')} min`;
}
