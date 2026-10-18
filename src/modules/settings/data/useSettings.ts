import { useLiveQuery } from 'dexie-react-hooks';
import { useDb } from '@/shared/db';
import type { SettingsData } from '../model/settings';
import { loadSettings } from './settingsRepository';

/** Einstellungen, reaktiv; `undefined`, solange sie geladen werden. */
export function useSettings(): SettingsData | undefined {
  const { db } = useDb();
  return useLiveQuery(() => loadSettings(db), [db]);
}
