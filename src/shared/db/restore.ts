/**
 * Ersetzen aller Dokumente durch eine geprüfte Sicherung (Wiederherstellen aus dem Export, A-14,
 * D-345). Alles oder nichts: eine Transaktion über alle Dokumenttabellen, die Uhr und die
 * Projektion der Trainings. Geprüft wird vorher im Modul `backup` (Zod je Dokumentart); hier
 * prüft das Repository nur noch die Basisfelder.
 *
 * Regeln (data-model.md Abschnitt 7.5):
 * - Jedes Dokument der Sicherung erhält einen neuen Stempel dieses Geräts; der eingespielte Stand
 *   ist damit die jüngste Änderung, auch für die Synchronisierung. Löschmarken der Datei bleiben
 *   Löschmarken.
 * - Was nur lokal liegt, bekommt eine Löschmarke (nicht physisch gelöscht), bei Trainings mit dem
 *   Status davor (`deletedFrom`, Konfliktregeln K-03 und K-04).
 * - `keep` lässt einzelne lokale Dokumente stehen (beim Training K-01 und K-03).
 * - Bereiche außerhalb der Dokumente (Fehlerprotokoll, Anmeldungen, Basis der Synchronisierung,
 *   importierte Lebensmitteldaten) bleiben unberührt.
 */
import type { Hlc } from '../lib/hlc';
import { rootFieldsSchema } from './documents';
import { META_KEYS } from './meta';
import type { DbRuntime } from './runtime';
import { DOCUMENT_TABLES, type AppDb, type DocumentTableName, type StoredDoc } from './schema';

export interface ReplaceCounts {
  /** Dokumente der Sicherung, die jetzt gelten (ohne Löschmarken der Datei). */
  written: number;
  /** Löschmarken aus der Datei. */
  deletedInFile: number;
  /** Lokale Dokumente, die nicht in der Sicherung stehen und eine Löschmarke bekamen. */
  removed: number;
  /** Lokale Dokumente, die nach `keep` stehen blieben. */
  kept: number;
}

export interface ReplaceOptions {
  /** Läuft zuerst in der Transaktion; wirft sie, wird nichts geschrieben. */
  guard?: (db: AppDb) => Promise<void>;
  /** Soll die lokale Fassung statt der aus der Sicherung bleiben? */
  keep?: (table: DocumentTableName, local: StoredDoc, incoming: StoredDoc) => boolean;
  /** Projektion einer Trainingseinheit neu aufbauen (`exerciseHistory`), in derselben Transaktion. */
  onSessionChanged?: (db: AppDb, sessionId: string) => Promise<void>;
}

/** Status vor dem Löschen, wie `softDeleteDoc` ihn für Trainings setzt (K-03, K-04). */
function deletedFromOf(table: DocumentTableName, row: StoredDoc): string | undefined {
  return table === 'sessions' && typeof row.status === 'string' ? row.status : undefined;
}

export async function replaceDocuments(
  rt: DbRuntime,
  docs: ReadonlyMap<DocumentTableName, readonly StoredDoc[]>,
  options: ReplaceOptions = {},
): Promise<ReplaceCounts> {
  const { db } = rt;
  const counts: ReplaceCounts = { written: 0, deletedInFile: 0, removed: 0, kept: 0 };
  await db.transaction(
    'rw',
    [...DOCUMENT_TABLES.map((name) => db.table(name)), db.meta, db.exerciseHistory],
    async () => {
      await options.guard?.(db);
      const stored = await db.meta.get(META_KEYS.hlc);
      rt.clock.observe(stored?.value);
      const stamp = (): Hlc => rt.clock.tick();
      const sessions = new Set<string>();
      for (const name of DOCUMENT_TABLES) {
        const table = db.table<StoredDoc, string>(name);
        const incoming = docs.get(name) ?? [];
        const ids = new Set(incoming.map((doc) => doc.id));
        const local = new Map<string, StoredDoc>();
        for (const row of await table.toArray()) {
          local.set(row.id, row);
          if (ids.has(row.id) || row.deletedAt !== null) continue;
          const hlc = stamp();
          const tombstone: StoredDoc = { ...row, hlc, deletedAt: hlc, deviceId: rt.deviceId };
          const from = deletedFromOf(name, row);
          if (from) tombstone.deletedFrom = from;
          else delete tombstone.deletedFrom;
          await table.put(rootChecked(tombstone));
          counts.removed += 1;
          if (name === 'sessions') sessions.add(row.id);
        }
        for (const doc of incoming) {
          const mine = local.get(doc.id);
          if (mine && options.keep?.(name, mine, doc)) {
            counts.kept += 1;
            continue;
          }
          const hlc = stamp();
          const deleted = doc.deletedAt !== null;
          await table.put(
            rootChecked({ ...doc, hlc, deletedAt: deleted ? hlc : null, deviceId: rt.deviceId }),
          );
          if (deleted) counts.deletedInFile += 1;
          else counts.written += 1;
          if (name === 'sessions') sessions.add(doc.id);
        }
      }
      await db.meta.put({ key: META_KEYS.hlc, value: rt.clock.snapshot });
      for (const id of sessions) await options.onSessionChanged?.(db, id);
    },
  );
  return counts;
}

/** Basisfelder prüfen und unbekannte Felder behalten (wie das Basis-Repository). */
function rootChecked(doc: StoredDoc): StoredDoc {
  return { ...doc, ...rootFieldsSchema.parse(doc) };
}
