/**
 * Einstellungen als Singleton-Dokument (data-model.md Abschnitt 3.7).
 * Die Trainingswerte werden ab M1 in der Oberfläche bearbeitbar; sie sind schon jetzt Teil des
 * Schemas, damit keine Migration nötig wird.
 */
import { z } from 'zod';
import { defineDocSchema, ROOT_FIELD_MASK, type DocData } from '@/shared/db/documents';

export const THEME_PREFERENCES = ['light', 'dark', 'system'] as const;
export const LOCALE_PREFERENCES = ['auto', 'de-AT', 'de-CH', 'de-DE'] as const;

export const SETTINGS_SCHEMA_VERSION = 1;

export const settingsSchema = defineDocSchema('settings', {
  restDefaultSec: z.number().int().min(0).max(3600),
  weightStepKg: z.number().min(0.25).max(50),
  autoStartRest: z.boolean(),
  restSound: z.boolean(),
  keepAwake: z.boolean(),
  theme: z.enum(THEME_PREFERENCES),
  locale: z.enum(LOCALE_PREFERENCES),
  backupReminderDays: z.number().int().min(0).max(365),
  /** Eigene Schnellmengen für Wasser in ml (D-289); fehlt, gelten die Standardwerte. */
  waterQuickMl: z.array(z.number().int().min(10).max(2000)).length(4).optional(),
});

export type Settings = z.infer<typeof settingsSchema>;
export type SettingsData = DocData<Settings>;
export type ThemeSetting = Settings['theme'];
export type LocaleSetting = Settings['locale'];

export const settingsDataSchema = settingsSchema.omit(ROOT_FIELD_MASK);

export const SETTINGS_DEFAULTS: SettingsData = {
  restDefaultSec: 90,
  weightStepKg: 2.5,
  autoStartRest: true,
  restSound: true,
  keepAwake: true,
  theme: 'light',
  locale: 'auto',
  backupReminderDays: 14,
};
