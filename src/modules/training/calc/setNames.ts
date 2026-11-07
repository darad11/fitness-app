import { tSession } from '@/shared/i18n/de-session';
import type { SetType } from '../model/program';

/** Stelle eines Satzes unter den Sätzen seines Typs in derselben Übung, ab 1. */
export interface SetPosition {
  type: SetType;
  n: number;
  total: number;
}

/**
 * Zählt die Sätze einer Übung je Typ, in der Reihenfolge der Liste (D-537): Aufwärm-, Arbeits- und
 * Drop-Sätze getrennt. Die Arbeitssätze zählen so wie die Ziffern in der Satzliste (A, 1, 2, 3).
 */
export function setPositions<T extends { type: SetType }>(
  sets: readonly T[],
): { set: T; position: SetPosition }[] {
  const totals: Record<SetType, number> = { warmup: 0, working: 0, drop: 0 };
  for (const set of sets) totals[set.type] += 1;
  const seen: Record<SetType, number> = { warmup: 0, working: 0, drop: 0 };
  return sets.map((set) => {
    seen[set.type] += 1;
    return { set, position: { type: set.type, n: seen[set.type], total: totals[set.type] } };
  });
}

/**
 * Name eines Satzes, überall gleich (Entscheidung des Produktinhabers, D-537): „Aufwärmsatz“, danach
 * „Arbeitssatz 1 von 3“, „Arbeitssatz 2 von 3“ … Ein Satz, der als einziger seines Typs in der
 * Übung steht, heißt ohne Zahl („Aufwärmsatz“, „Arbeitssatz“); mehrere werden gezählt, damit jeder
 * Name eindeutig bleibt, auch für Screenreader („Aufwärmsatz 1 von 2“).
 */
export function setName(position: SetPosition): string {
  return tSession.setName(tSession.setTypeLabel[position.type], position.n, position.total);
}

/** Namen aller Sätze einer Übung in der Reihenfolge der Liste. */
export function setNamesOf(sets: readonly { type: SetType }[]): string[] {
  return setPositions(sets).map(({ position }) => setName(position));
}
