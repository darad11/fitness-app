// Öffentliche Schnittstelle des Moduls „settings".
export { settingsRoutes } from './routes';
export { ThemeSync } from './ui/ThemeSync';
export { useSettings } from './data/useSettings';
export { useFormatters } from './service/formatting';
export { loadSettings, saveSettings, SETTINGS_ID, settingsDef } from './data/settingsRepository';
export {
  SETTINGS_DEFAULTS,
  settingsSchema,
  type Settings,
  type SettingsData,
} from './model/settings';
