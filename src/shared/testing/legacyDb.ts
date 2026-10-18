import Dexie from 'dexie';

/**
 * Legt für Migrationstests eine Datenbank in einer älteren Schemaversion an (AK-DAT-07):
 * genau die damaligen Tabellen und Indizes, gefüllt mit den übergebenen Zeilen. Die Datenbank
 * wird danach geschlossen, damit der Test sie mit der aktuellen Version öffnen kann.
 */
export async function seedLegacyDatabase(
  name: string,
  version: number,
  stores: Record<string, string>,
  rows: Record<string, readonly object[]>,
): Promise<void> {
  const db = new Dexie(name);
  db.version(version).stores(stores);
  await db.open();
  try {
    await db.transaction(
      'rw',
      Object.keys(rows).map((table) => db.table(table)),
      async () => {
        for (const [table, items] of Object.entries(rows)) {
          await db.table(table).bulkAdd(items);
        }
      },
    );
  } finally {
    db.close();
  }
}
