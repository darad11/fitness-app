import type { AppDb, DbRuntime } from '@/shared/db';
import { refreshSessionProjection } from '@/modules/training';
import {
  pullRows,
  pushDocs,
  refreshSession,
  signInWithPassword,
  signOutRemote,
  signUpWithPassword,
  SyncHttpError,
  type SignUpResult,
} from '../data/remote';
import { getAuth, getStatus, setAuth, setStatus } from '../data/syncState';
import type { AuthSession, SyncResult } from '../model/sync';
import { resetForUser, syncOnce, type Remote } from './syncEngine';

export class NotSignedInError extends Error {
  override name = 'NotSignedInError';
}

/** Anmeldung abgelaufen (Refresh-Token ungültig): erneut anmelden. */
export class SessionExpiredError extends Error {
  override name = 'SessionExpiredError';
}

export async function signIn(
  db: AppDb,
  email: string,
  password: string,
  fetchImpl: typeof fetch = fetch,
): Promise<AuthSession> {
  const auth = await signInWithPassword(email, password, fetchImpl);
  await resetForUser(db, auth.userId);
  await setAuth(db, auth);
  return auth;
}

/** Kürzeste Passwortlänge in der App (Supabase verlangt mindestens 6). */
export const PASSWORD_MIN = 8;

/**
 * Registrieren (D-273). Ohne Bestätigungsmail ist man danach angemeldet; sonst kommt eine Mail,
 * und die Anmeldung folgt nach dem Klick auf den Link.
 */
export async function signUp(
  db: AppDb,
  email: string,
  password: string,
  redirectTo: string,
  fetchImpl: typeof fetch = fetch,
): Promise<SignUpResult> {
  const result = await signUpWithPassword(email, password, redirectTo, fetchImpl);
  if (result.kind === 'signedIn') {
    await resetForUser(db, result.auth.userId);
    await setAuth(db, result.auth);
  }
  return result;
}

/** Abmelden: Zugang lokal entfernen; die Daten auf dem Gerät bleiben. */
export async function signOut(db: AppDb, fetchImpl: typeof fetch = fetch): Promise<void> {
  const auth = await getAuth(db);
  await setAuth(db, null);
  if (auth) await signOutRemote(auth.accessToken, fetchImpl).catch(() => undefined);
}

const REFRESH_MARGIN_MS = 60_000;

async function token(db: AppDb, fetchImpl: typeof fetch, force = false): Promise<string> {
  const auth = await getAuth(db);
  if (!auth) throw new NotSignedInError('Nicht angemeldet');
  if (!force && auth.expiresAt - Date.now() > REFRESH_MARGIN_MS) return auth.accessToken;
  try {
    const next = await refreshSession(auth.refreshToken, fetchImpl);
    await setAuth(db, next);
    return next.accessToken;
  } catch (error) {
    if (error instanceof SyncHttpError && error.status >= 400 && error.status < 500) {
      await setAuth(db, null);
      throw new SessionExpiredError(error.message);
    }
    throw error;
  }
}

/** Server über die angemeldete Sitzung; bei 401 einmal mit erneuertem Token wiederholen. */
export function createRemote(db: AppDb, fetchImpl: typeof fetch = fetch): Remote {
  const withToken = async <T>(call: (accessToken: string) => Promise<T>): Promise<T> => {
    try {
      return await call(await token(db, fetchImpl));
    } catch (error) {
      if (error instanceof SyncHttpError && error.status === 401) {
        return call(await token(db, fetchImpl, true));
      }
      throw error;
    }
  };
  return {
    pull: (cursor, limit) => withToken((t) => pullRows(t, cursor, limit, fetchImpl)),
    push: (docs) => withToken((t) => pushDocs(t, docs, fetchImpl)),
  };
}

let running: Promise<SyncResult> | null = null;

/** Läuft gerade ein Abgleich in diesem Tab? */
export function isSyncing(): boolean {
  return running !== null;
}

/**
 * Ein Abgleich, höchstens einer gleichzeitig (auch über Tabs hinweg, wenn der Browser
 * `navigator.locks` kennt). Ergebnis oder Fehler stehen danach im Status.
 */
export function syncNow(
  rt: DbRuntime,
  options: { fetchImpl?: typeof fetch; remote?: Remote } = {},
): Promise<SyncResult> {
  if (running) return running;
  const run = async (): Promise<SyncResult> => {
    const remote = options.remote ?? createRemote(rt.db, options.fetchImpl);
    const previous = await getStatus(rt.db);
    try {
      const result = await syncOnce(rt, remote, { onSessionChanged: refreshSessionProjection });
      await setStatus(rt.db, { lastSyncAt: new Date().toISOString(), ...result });
      return result;
    } catch (error) {
      await setStatus(rt.db, {
        ...previous,
        lastError: error instanceof Error ? error.name : 'Error',
      });
      throw error;
    }
  };
  // `navigator.locks` fehlt in älteren Browsern und in Tests.
  const locks = (globalThis.navigator as Partial<Navigator> | undefined)?.locks;
  running = (locks ? locks.request('fitness-sync', run) : run()).finally(() => {
    running = null;
  });
  return running;
}
