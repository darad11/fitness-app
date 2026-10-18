import { useLiveQuery } from 'dexie-react-hooks';
import { useDb } from '@/shared/db';
import type { ProfileData } from '../model/profile';
import { loadProfile } from './profileRepository';

/** Profil, reaktiv; `undefined`, solange es geladen wird. */
export function useProfile(): ProfileData | undefined {
  const { db } = useDb();
  return useLiveQuery(() => loadProfile(db), [db]);
}
