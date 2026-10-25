import {
  getDoc,
  unknownFields,
  upsertDoc,
  type AppDb,
  type DbRuntime,
  type DocDef,
} from '@/shared/db';
import { stableId } from '@/shared/lib/uuid';
import {
  SETTINGS_DEFAULTS,
  SETTINGS_SCHEMA_VERSION,
  settingsDataSchema,
  settingsSchema,
  type Settings,
  type SettingsData,
} from '../model/settings';

/** Feste ID (UUID v5), damit alle Geräte dasselbe Dokument meinen. */
export const SETTINGS_ID = stableId('singleton:settings');

export const settingsDef: DocDef<Settings> = {
  type: 'settings',
  schemaVersion: SETTINGS_SCHEMA_VERSION,
  schema: settingsSchema,
  table: (db) => db.singletons,
};

/** Gespeicherte Einstellungen oder die Standardwerte, solange nichts gespeichert ist. */
export async function loadSettings(db: AppDb): Promise<SettingsData> {
  const doc = await getDoc(db, settingsDef, SETTINGS_ID);
  return doc ? settingsDataSchema.parse(doc) : SETTINGS_DEFAULTS;
}

/**
 * Ändert einzelne Felder; ungültige Werte lehnt das Schema ab, ohne etwas zu speichern. Statt
 * fester Werte darf eine Funktion stehen: Sie erhält die gespeicherten Einstellungen in derselben
 * Transaktion, z. B. um ein einzelnes Stückgewicht zu ändern, ohne andere zu überschreiben.
 */
export async function saveSettings(
  rt: DbRuntime,
  patch: Partial<SettingsData> | ((current: SettingsData) => Partial<SettingsData>),
): Promise<SettingsData> {
  const doc = await upsertDoc(rt, settingsDef, SETTINGS_ID, (current) => {
    const stored = current ? settingsDataSchema.parse(current) : undefined;
    return {
      ...SETTINGS_DEFAULTS,
      // Felder einer neueren App-Version bleiben erhalten (A-03).
      ...(current && stored ? { ...unknownFields(current, settingsDataSchema), ...stored } : {}),
      ...(typeof patch === 'function' ? patch(stored ?? SETTINGS_DEFAULTS) : patch),
    };
  });
  return settingsDataSchema.parse(doc);
}
