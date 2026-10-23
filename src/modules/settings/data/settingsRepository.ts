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

/** Ändert einzelne Felder; ungültige Werte lehnt das Schema ab, ohne etwas zu speichern. */
export async function saveSettings(
  rt: DbRuntime,
  patch: Partial<SettingsData>,
): Promise<SettingsData> {
  const doc = await upsertDoc(rt, settingsDef, SETTINGS_ID, (current) => ({
    ...SETTINGS_DEFAULTS,
    // Felder einer neueren App-Version bleiben erhalten (A-03).
    ...(current
      ? { ...unknownFields(current, settingsDataSchema), ...settingsDataSchema.parse(current) }
      : {}),
    ...patch,
  }));
  return settingsDataSchema.parse(doc);
}
