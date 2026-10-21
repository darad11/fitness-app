/**
 * Entscheidung je abgeholtem Dokument (D-269, data-model.md Abschnitt 7): Basis ist der zuletzt
 * abgeglichene HLC. Ohne lokale Änderung seit der Basis gilt die Serverfassung. Bei Änderungen auf
 * beiden Seiten:
 * - Trainingseinheit: „abgeschlossen“ schlägt „laufend“ (K-01); das Verwerfen einer laufenden
 *   Kopie löscht keine abgeschlossene Einheit (K-03, D-293); sonst der jüngere HLC;
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
  /** Status vor dem Löschen (`softDeleteDoc`), beim Verwerfen einer Einheit `in_progress`. */
  deletedFrom?: unknown;
}

/** Löschmarke einer laufenden Einheit („Verwerfen“), nicht einer abgeschlossenen. */
function discarded(doc: MergeDoc): boolean {
  return doc.deletedAt !== null && doc.deletedFrom === 'in_progress';
}

function completedAlive(doc: MergeDoc): boolean {
  return doc.deletedAt === null && doc.status === 'completed';
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
  if (table === 'sessions') {
    if (bothAlive) {
      if (local.status === 'completed' && remote.status === 'in_progress') {
        return { kind: 'restamp' };
      }
      if (remote.status === 'completed' && local.status === 'in_progress') return { kind: 'take' };
    }
    // K-03: Wer eine veraltete laufende Kopie verwirft, löscht die abgeschlossene Einheit nicht.
    if (discarded(local) && completedAlive(remote)) return { kind: 'take' };
    if (discarded(remote) && completedAlive(local)) return { kind: 'restamp' };
  }
  if (CONFLICT_COPY_TABLES.has(table) && bothAlive) return { kind: 'conflict' };
  return remote.hlc > local.hlc ? { kind: 'take' } : { kind: 'keep' };
}
