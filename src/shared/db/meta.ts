/**
 * Lokale Metadaten (Tabelle `meta`, data-model.md Abschnitt 5). Werte werden nicht synchronisiert.
 */
import type { AppDb } from './schema';

export const META_KEYS = {
  deviceId: 'deviceId',
  hlc: 'hlc',
  dismissedHints: 'hints.dismissed',
  lastExportAt: 'export.lastAt',
} as const;

export type HintId = 'ios-install';

export async function getMetaValue(db: AppDb, key: string): Promise<unknown> {
  return (await db.meta.get(key))?.value;
}

export async function setMetaValue(db: AppDb, key: string, value: unknown): Promise<void> {
  await db.meta.put({ key, value });
}

export function parseDismissedHints(value: unknown): HintId[] {
  return storedHintList(value).filter((entry): entry is HintId => entry === 'ios-install');
}

/** Gespeicherte Liste unverändert lesen; unbekannte Einträge (neuere Version) bleiben erhalten. */
function storedHintList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : [];
}

export async function dismissHint(db: AppDb, hint: HintId): Promise<void> {
  await db.transaction('rw', db.meta, async () => {
    const current = storedHintList(await getMetaValue(db, META_KEYS.dismissedHints));
    if (!current.includes(hint)) {
      await setMetaValue(db, META_KEYS.dismissedHints, [...current, hint]);
    }
  });
}

export async function restoreHint(db: AppDb, hint: HintId): Promise<void> {
  await db.transaction('rw', db.meta, async () => {
    const current = storedHintList(await getMetaValue(db, META_KEYS.dismissedHints));
    await setMetaValue(
      db,
      META_KEYS.dismissedHints,
      current.filter((entry) => entry !== hint),
    );
  });
}
