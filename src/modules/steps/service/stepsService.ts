import type { AppDb } from '@/shared/db';
import { yearConfigFrom } from '../calc/stepStats';
import {
  DashboardAuthError,
  DashboardOfflineError,
  fetchChallengeYears,
  fetchStepRows,
  refreshDashboard,
  signInDashboard,
  signOutDashboard,
} from '../data/dashboardRemote';
import {
  getDashboardAuth,
  setDashboardAuth,
  setStepsCache,
  setStepsStatus,
} from '../data/stepsState';
import { yearConfigSchema, type DashboardAuth } from '../model/steps';

/** Token rechtzeitig erneuern: eine Minute vor Ablauf. */
const REFRESH_MARGIN_MS = 60_000;

function parseYear(value: unknown) {
  const parsed = yearConfigSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/** Mit dem Dashboard verbinden und gleich die Schritte holen. */
export async function connectDashboard(
  db: AppDb,
  email: string,
  password: string,
  year: number,
  fetchImpl: typeof fetch = fetch,
  now = Date.now(),
): Promise<void> {
  const auth = await signInDashboard(email, password, fetchImpl, now);
  await setDashboardAuth(db, auth);
  await refreshSteps(db, year, fetchImpl, now);
}

/** Verbindung trennen: Anmeldung und gespeicherte Schritte auf diesem Gerät löschen. */
export async function disconnectDashboard(
  db: AppDb,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const auth = await getDashboardAuth(db);
  await setDashboardAuth(db, null);
  await setStepsCache(db, null);
  await setStepsStatus(db, {});
  if (auth) {
    try {
      await signOutDashboard(auth.accessToken, fetchImpl);
    } catch {
      // Offline oder abgelaufen: lokal ist die Verbindung trotzdem getrennt.
    }
  }
}

async function validAuth(
  db: AppDb,
  fetchImpl: typeof fetch,
  now: number,
): Promise<DashboardAuth | null> {
  const auth = await getDashboardAuth(db);
  if (!auth) return null;
  if (auth.expiresAt - REFRESH_MARGIN_MS > now) return auth;
  const next = await refreshDashboard(auth.refreshToken, fetchImpl, now);
  await setDashboardAuth(db, next);
  return next;
}

/**
 * Schritte des laufenden Jahres und die Einstellung der Step Challenge abholen und lokal
 * speichern. Fehler landen im Status; der letzte Stand bleibt sichtbar.
 */
export async function refreshSteps(
  db: AppDb,
  year: number,
  fetchImpl: typeof fetch = fetch,
  now = Date.now(),
): Promise<void> {
  try {
    const auth = await validAuth(db, fetchImpl, now);
    if (!auth) return;
    const years = await fetchChallengeYears(auth, fetchImpl);
    const config = years ? yearConfigFrom(years, year, parseYear) : null;
    // Der Stichtag kann der 31.12. des Vorjahres sein; ab dort reicht es.
    const rows = await fetchStepRows(auth, `${String(year - 1)}-12-31`, fetchImpl);
    const entries: Record<string, number> = {};
    for (const row of rows) {
      if (!row.deleted) entries[row.date] = row.steps;
    }
    await setStepsCache(db, { fetchedAt: now, year, config, entries });
    await setStepsStatus(db, { lastAttemptAt: now });
  } catch (error) {
    const lastError =
      error instanceof DashboardOfflineError
        ? 'offline'
        : error instanceof DashboardAuthError
          ? 'auth'
          : 'failed';
    await setStepsStatus(db, { lastError, lastAttemptAt: now });
  }
}
