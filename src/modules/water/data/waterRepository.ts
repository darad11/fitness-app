import { type AppDb, type DocDef, type StoredDoc } from '@/shared/db';
import type { DayKey } from '@/shared/lib/time';
import { WATER_SCHEMA_VERSION, waterEntrySchema, type WaterEntry } from '../model/waterEntry';

export const waterEntryDef: DocDef<WaterEntry> = {
  type: 'water_entry',
  schemaVersion: WATER_SCHEMA_VERSION,
  schema: waterEntrySchema,
  table: (db) => db.waterLog,
};

/** Nicht gelöschte Einträge ab einem Tag (oder alle), älteste zuerst. */
export async function listWaterEntries(db: AppDb, fromDay?: DayKey): Promise<WaterEntry[]> {
  const rows =
    fromDay === undefined
      ? await db.waterLog.toArray()
      : await db.waterLog.where('dayKey').aboveOrEqual(fromDay).toArray();
  return validEntries(rows);
}

/**
 * Nicht gelöschte Einträge genau eines Tages, älteste zuerst (C-04): Für einen früheren Tag lud
 * die Karte vorher alle Einträge ab diesem Tag.
 */
export async function listWaterDay(db: AppDb, day: DayKey): Promise<WaterEntry[]> {
  return validEntries(await db.waterLog.where('dayKey').equals(day).toArray());
}

function validEntries(rows: readonly StoredDoc[]): WaterEntry[] {
  const entries = rows.flatMap((row) => {
    if (row.type !== 'water_entry' || row.deletedAt !== null) return [];
    const parsed = waterEntrySchema.safeParse(row);
    return parsed.success ? [parsed.data] : [];
  });
  entries.sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
  return entries;
}
