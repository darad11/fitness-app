import { useLiveQuery } from 'dexie-react-hooks';
import { getMetaValue, setMetaValue, useDb, type AppDb } from '@/shared/db';
import {
  dashboardAuthSchema,
  stepsCacheSchema,
  stepsStatusSchema,
  type DashboardAuth,
  type StepsCache,
  type StepsStatus,
} from '../model/steps';

/** Lokale Schlüssel in `meta` (nicht synchronisiert, nicht exportiert). */
export const STEPS_KEYS = {
  auth: 'steps.dashboardAuth',
  cache: 'steps.cache',
  status: 'steps.status',
} as const;

export async function getDashboardAuth(db: AppDb): Promise<DashboardAuth | null> {
  const parsed = dashboardAuthSchema.safeParse(await getMetaValue(db, STEPS_KEYS.auth));
  return parsed.success ? parsed.data : null;
}

export async function setDashboardAuth(db: AppDb, auth: DashboardAuth | null): Promise<void> {
  await setMetaValue(db, STEPS_KEYS.auth, auth);
}

export async function getStepsCache(db: AppDb): Promise<StepsCache | null> {
  const parsed = stepsCacheSchema.safeParse(await getMetaValue(db, STEPS_KEYS.cache));
  return parsed.success ? parsed.data : null;
}

export async function setStepsCache(db: AppDb, cache: StepsCache | null): Promise<void> {
  await setMetaValue(db, STEPS_KEYS.cache, cache);
}

export async function getStepsStatus(db: AppDb): Promise<StepsStatus> {
  const parsed = stepsStatusSchema.safeParse(await getMetaValue(db, STEPS_KEYS.status));
  return parsed.success ? parsed.data : {};
}

export async function setStepsStatus(db: AppDb, status: StepsStatus): Promise<void> {
  await setMetaValue(db, STEPS_KEYS.status, status);
}

export interface StepsView {
  /** E-Mail der Dashboard-Anmeldung; `null` = nicht verbunden. */
  email: string | null;
  cache: StepsCache | null;
  status: StepsStatus;
}

/** Verbindung, letzter Stand und Fehler (reaktiv); `undefined` beim Laden. */
export function useStepsView(): StepsView | undefined {
  const { db } = useDb();
  return useLiveQuery(
    async () => ({
      email: (await getDashboardAuth(db))?.email ?? null,
      cache: await getStepsCache(db),
      status: await getStepsStatus(db),
    }),
    [db],
  );
}
