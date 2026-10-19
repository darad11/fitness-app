import { useLiveQuery } from 'dexie-react-hooks';
import { getMetaValue, setMetaValue, useDb, type AppDb } from '@/shared/db';
import {
  authSessionSchema,
  syncStatusSchema,
  type AuthSession,
  type SyncStatus,
} from '../model/sync';

/** Lokale Schlüssel in `meta` (nicht synchronisiert, nicht exportiert). */
export const SYNC_KEYS = {
  auth: 'sync.auth',
  cursor: 'sync.cursor',
  status: 'sync.status',
  /** Nutzer, zu dem Cursor und Basis gehören; ein anderer Nutzer setzt beides zurück. */
  user: 'sync.user',
} as const;

export async function getAuth(db: AppDb): Promise<AuthSession | null> {
  const parsed = authSessionSchema.safeParse(await getMetaValue(db, SYNC_KEYS.auth));
  return parsed.success ? parsed.data : null;
}

export async function setAuth(db: AppDb, auth: AuthSession | null): Promise<void> {
  await setMetaValue(db, SYNC_KEYS.auth, auth);
}

export async function getCursor(db: AppDb): Promise<number> {
  const value = await getMetaValue(db, SYNC_KEYS.cursor);
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export async function getStatus(db: AppDb): Promise<SyncStatus> {
  const parsed = syncStatusSchema.safeParse(await getMetaValue(db, SYNC_KEYS.status));
  return parsed.success ? parsed.data : {};
}

export async function setStatus(db: AppDb, status: SyncStatus): Promise<void> {
  await setMetaValue(db, SYNC_KEYS.status, status);
}

export interface SyncView {
  auth: AuthSession | null;
  status: SyncStatus;
}

/** Anmeldung und letzter Stand (reaktiv); `undefined` beim Laden. */
export function useSyncView(): SyncView | undefined {
  const { db } = useDb();
  return useLiveQuery(async () => ({ auth: await getAuth(db), status: await getStatus(db) }), [db]);
}
