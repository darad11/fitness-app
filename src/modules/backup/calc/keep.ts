/**
 * Konfliktregeln K-01 und K-03 beim Wiederherstellen (D-345): Ein abgeschlossenes, nicht
 * gelöschtes Training dieses Geräts bleibt, wenn die Sicherung dieselbe Einheit noch laufend oder
 * als verworfene laufende Kopie enthält. Die Datei stammt dann von vor dem Abschluss; ihr Stand
 * würde das abgeschlossene Training sonst auf allen Geräten ersetzen. In allen anderen Fällen gilt
 * die Fassung der Sicherung.
 */
type Doc = Record<string, unknown>;

export function keepLocalSession(local: Doc, incoming: Doc): boolean {
  if (local.deletedAt !== null || local.status !== 'completed') return false;
  const running = incoming.deletedAt === null && incoming.status === 'in_progress';
  const discarded = incoming.deletedAt !== null && incoming.deletedFrom === 'in_progress';
  return running || discarded;
}
