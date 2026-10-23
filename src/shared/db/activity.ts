import type { AppDb, StoredDoc } from './schema';

/**
 * Letzter Tag mit irgendeinem Eintrag (Rückkehr-Flow, D-319): Training, Tagesaufgabe, Ernährung,
 * Wasser oder Körpergewicht. Gelöschte Einträge zählen nicht. Schritte liegen im Fachmodul
 * „Schritte“ (Zwischenspeicher aus dem Dashboard) und kommen dort dazu.
 *
 * Alle Tabellen haben einen Index `dayKey` (lokaler Kalendertag); gelesen wird vom neuesten Tag
 * rückwärts bis zum ersten nicht gelöschten Eintrag.
 */
export async function lastEntryDay(db: AppDb): Promise<string | null> {
  const tables = [db.sessions, db.habitLogs, db.foodLog, db.waterLog, db.bodyWeights];
  let latest: string | null = null;
  for (const table of tables) {
    const row: StoredDoc | undefined = await table
      .orderBy('dayKey')
      .reverse()
      .filter((doc) => doc.deletedAt === null)
      .first();
    const day = row?.dayKey;
    if (typeof day === 'string' && (latest === null || day > latest)) latest = day;
  }
  return latest;
}
