/**
 * Entscheidung je abgeholtem Dokument (D-269, data-model.md Abschnitt 7): Basis ist der zuletzt
 * abgeglichene HLC. Ohne lokale Änderung seit der Basis gilt die Serverfassung. Bei Änderungen auf
 * beiden Seiten:
 * - Trainingseinheit: „abgeschlossen“ schlägt „laufend“ (K-01), sonst der jüngere HLC;
 * - Programm und Rezept: Serverfassung übernehmen, lokale Fassung als Konfliktkopie (D-208, K-09,
 *   K-17), außer eine Seite ist gelöscht;
 * - alle anderen: der jüngere HLC (ganzes Dokument; feldweise Zusammenführung folgt später).
 */
export type Decision =
  | { kind: 'same' }
  | { kind: 'take' }
  | { kind: 'keep' }
  /** Lokale Fassung gewinnt, braucht aber einen jüngeren Stempel als die Serverfassung. */
  | { kind: 'restamp' }
  | { kind: 'conflict' };

export interface MergeDoc {
  hlc: string;
  deletedAt: string | null;
  status?: unknown;
}

export const CONFLICT_COPY_TABLES: ReadonlySet<string> = new Set(['programs', 'recipes']);

export function decide(
  table: string,
  local: MergeDoc | undefined,
  remote: MergeDoc,
  baseHlc: string | undefined,
): Decision {
  if (!local) return { kind: 'take' };
  if (local.hlc === remote.hlc) return { kind: 'same' };
  // Die Serverfassung ist genau die bekannte Basis (z. B. die eigene, schon gesendete): nichts Neues.
  if (remote.hlc === baseHlc) return { kind: 'keep' };
  const dirty = baseHlc !== local.hlc;
  if (!dirty) return { kind: 'take' };
  const bothAlive = local.deletedAt === null && remote.deletedAt === null;
  if (table === 'sessions' && bothAlive) {
    if (local.status === 'completed' && remote.status === 'in_progress') return { kind: 'restamp' };
    if (remote.status === 'completed' && local.status === 'in_progress') return { kind: 'take' };
  }
  if (CONFLICT_COPY_TABLES.has(table) && bothAlive) return { kind: 'conflict' };
  return remote.hlc > local.hlc ? { kind: 'take' } : { kind: 'keep' };
}
