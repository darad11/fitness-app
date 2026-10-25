// Öffentliche Schnittstelle des Moduls „settings".
import type { DocDef, RootFields } from '@/shared/db';
export { settingsRoutes } from './routes';
export { ThemeSync } from './ui/ThemeSync';
export { useSettings } from './data/useSettings';
export { useFormatters } from './service/formatting';
export { loadSettings, saveSettings, SETTINGS_ID, settingsDef } from './data/settingsRepository';
export {
  PIECE_WEIGHT_MAX,
  SETTINGS_DEFAULTS,
  settingsSchema,
  type Settings,
  type SettingsData,
} from './model/settings';
export { useProfile } from './data/useProfile';
export { loadProfile, PROFILE_ID, profileDef, saveProfile } from './data/profileRepository';
export { DISPLAY_NAME_MAX, profileSchema, type Profile, type ProfileData } from './model/profile';

/**
 * Dokumentarten für das Wiederherstellen aus dem Export (D-345): Einstellungen, Profil. Erst bei
 * Bedarf geladen, damit die Startansicht nicht wächst.
 */
export async function settingsDocDefs(): Promise<readonly DocDef<RootFields>[]> {
  const [m0, m1] = await Promise.all([
    import('./data/settingsRepository'),
    import('./data/profileRepository'),
  ]);
  return [m0.settingsDef, m1.profileDef];
}
