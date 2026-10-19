import { SUPABASE_KEY, SUPABASE_URL } from '../config';
import {
  authSessionSchema,
  pushResultSchema,
  remoteRowSchema,
  type AuthSession,
  type PushDoc,
  type PushResult,
  type RemoteRow,
} from '../model/sync';

/**
 * Zugriff auf Supabase über die REST-Schnittstellen (D-269), ohne zusätzliche Bibliothek:
 * Anmeldung (`/auth/v1`), Abholen (`/rest/v1/sync_documents`) und Senden
 * (`/rest/v1/rpc/push_documents`). Zeitlimit 20 s je Anfrage.
 */
const TIMEOUT_MS = 20_000;
const SELECT = 'doc_id,doc_table,doc_type,hlc,deleted,payload,rev';

export class SyncHttpError extends Error {
  override name = 'SyncHttpError';
  constructor(
    readonly status: number,
    message: string,
    /** Fehlercode von Supabase Auth, z. B. „signup_disabled“. */
    readonly code?: string,
  ) {
    super(message);
  }
}

/** Netz fehlt oder Server nicht erreichbar. */
export class SyncOfflineError extends Error {
  override name = 'SyncOfflineError';
}

export class InvalidCredentialsError extends Error {
  override name = 'InvalidCredentialsError';
}

/** Gründe, warum eine Registrierung abgelehnt wird (D-273). */
export type SignUpProblem = 'disabled' | 'exists' | 'weakPassword' | 'invalidEmail';

export class SignUpError extends Error {
  override name = 'SignUpError';
  constructor(
    readonly problem: SignUpProblem,
    message: string,
  ) {
    super(message);
  }
}

async function request(
  fetchImpl: typeof fetch,
  path: string,
  init: RequestInit & { token?: string },
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, TIMEOUT_MS);
  const { token, headers, ...rest } = init;
  let response: Response;
  try {
    response = await fetchImpl(`${SUPABASE_URL}${path}`, {
      ...rest,
      signal: controller.signal,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      headers: {
        apikey: SUPABASE_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers as Record<string, string> | undefined),
      },
    });
  } catch (error) {
    throw new SyncOfflineError(error instanceof Error ? error.message : 'Netzfehler');
  } finally {
    clearTimeout(timer);
  }
  const text = await response.text();
  const body: unknown = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const field = (key: string) =>
      typeof body === 'object' && body !== null && key in body
        ? String((body as Record<string, unknown>)[key])
        : undefined;
    const message = field('message') ?? field('msg') ?? `HTTP ${String(response.status)}`;
    throw new SyncHttpError(response.status, message, field('error_code'));
  }
  return body;
}

function toSession(body: unknown, now: number): AuthSession {
  const b = body as {
    access_token?: unknown;
    refresh_token?: unknown;
    expires_in?: unknown;
    user?: { id?: unknown; email?: unknown };
  };
  return authSessionSchema.parse({
    accessToken: b.access_token,
    refreshToken: b.refresh_token,
    expiresAt: now + Number(b.expires_in ?? 3600) * 1000,
    userId: b.user?.id,
    email: b.user?.email ?? '',
  });
}

export async function signInWithPassword(
  email: string,
  password: string,
  fetchImpl: typeof fetch = fetch,
  now = Date.now(),
): Promise<AuthSession> {
  try {
    const body = await request(fetchImpl, '/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), password }),
    });
    return toSession(body, now);
  } catch (error) {
    if (error instanceof SyncHttpError && (error.status === 400 || error.status === 401)) {
      throw new InvalidCredentialsError(error.message);
    }
    throw error;
  }
}

export type SignUpResult =
  | { kind: 'signedIn'; auth: AuthSession }
  /** Supabase verlangt eine Bestätigung per E-Mail; danach normal anmelden. */
  | { kind: 'confirmEmail' };

const SIGN_UP_PROBLEMS: Record<string, SignUpProblem> = {
  signup_disabled: 'disabled',
  email_provider_disabled: 'disabled',
  user_already_exists: 'exists',
  email_exists: 'exists',
  weak_password: 'weakPassword',
  email_address_invalid: 'invalidEmail',
  validation_failed: 'invalidEmail',
};

/**
 * Registrierung mit E-Mail und Passwort (D-273). Ist in Supabase die Bestätigung per E-Mail an,
 * kommt keine Sitzung zurück; der Link in der Mail führt zurück zu `redirectTo`.
 */
export async function signUpWithPassword(
  email: string,
  password: string,
  redirectTo: string,
  fetchImpl: typeof fetch = fetch,
  now = Date.now(),
): Promise<SignUpResult> {
  try {
    const body = await request(
      fetchImpl,
      `/auth/v1/signup?redirect_to=${encodeURIComponent(redirectTo)}`,
      { method: 'POST', body: JSON.stringify({ email: email.trim(), password }) },
    );
    const b = body as { access_token?: unknown };
    return typeof b.access_token === 'string'
      ? { kind: 'signedIn', auth: toSession(body, now) }
      : { kind: 'confirmEmail' };
  } catch (error) {
    if (error instanceof SyncHttpError && error.status >= 400 && error.status < 500) {
      const problem =
        (error.code ? SIGN_UP_PROBLEMS[error.code] : undefined) ??
        (/not allowed|disabled/i.test(error.message)
          ? 'disabled'
          : /already/i.test(error.message)
            ? 'exists'
            : /password/i.test(error.message)
              ? 'weakPassword'
              : 'invalidEmail');
      throw new SignUpError(problem, error.message);
    }
    throw error;
  }
}

export async function refreshSession(
  refreshToken: string,
  fetchImpl: typeof fetch = fetch,
  now = Date.now(),
): Promise<AuthSession> {
  const body = await request(fetchImpl, '/auth/v1/token?grant_type=refresh_token', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  return toSession(body, now);
}

export async function signOutRemote(
  accessToken: string,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  await request(fetchImpl, '/auth/v1/logout', { method: 'POST', token: accessToken });
}

export async function pullRows(
  accessToken: string,
  cursor: number,
  limit: number,
  fetchImpl: typeof fetch = fetch,
): Promise<RemoteRow[]> {
  const query = `select=${SELECT}&rev=gt.${String(cursor)}&order=rev.asc&limit=${String(limit)}`;
  const body = await request(fetchImpl, `/rest/v1/sync_documents?${query}`, {
    method: 'GET',
    token: accessToken,
  });
  if (!Array.isArray(body)) throw new SyncHttpError(500, 'Unerwartete Antwort');
  return body.map((row) => remoteRowSchema.parse(row));
}

export async function pushDocs(
  accessToken: string,
  docs: readonly PushDoc[],
  fetchImpl: typeof fetch = fetch,
): Promise<PushResult> {
  const body = await request(fetchImpl, '/rest/v1/rpc/push_documents', {
    method: 'POST',
    token: accessToken,
    body: JSON.stringify({ docs }),
  });
  return pushResultSchema.parse(body);
}
