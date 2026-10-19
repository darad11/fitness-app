import { CHALLENGE_SETTING, DASHBOARD_KEY, DASHBOARD_URL } from '../config';
import {
  challengeSettingSchema,
  dashboardAuthSchema,
  stepRowSchema,
  type DashboardAuth,
  type StepRow,
} from '../model/steps';

/**
 * Lesender Zugriff auf das Dashboard über die REST-Schnittstellen von Supabase (D-277), ohne
 * zusätzliche Bibliothek: Anmeldung (`/auth/v1`), Einstellung `stepChallenge` und Tabelle
 * `step_entries` (`/rest/v1`). Es wird nie etwas geschrieben. Zeitlimit 20 s je Anfrage.
 */
const TIMEOUT_MS = 20_000;

export class DashboardOfflineError extends Error {
  override name = 'DashboardOfflineError';
}

/** Anmeldung abgelehnt oder abgelaufen (falsches Passwort, Token ungültig). */
export class DashboardAuthError extends Error {
  override name = 'DashboardAuthError';
}

export class DashboardHttpError extends Error {
  override name = 'DashboardHttpError';
  constructor(
    readonly status: number,
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
  const { token, ...rest } = init;
  let response: Response;
  try {
    response = await fetchImpl(`${DASHBOARD_URL}${path}`, {
      ...rest,
      signal: controller.signal,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      headers: {
        apikey: DASHBOARD_KEY,
        Authorization: `Bearer ${token ?? DASHBOARD_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  } catch (error) {
    throw new DashboardOfflineError(error instanceof Error ? error.message : 'Netzfehler');
  } finally {
    clearTimeout(timer);
  }
  const text = await response.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  if (!response.ok) {
    if (response.status === 400 || response.status === 401 || response.status === 403) {
      throw new DashboardAuthError(`HTTP ${String(response.status)}`);
    }
    throw new DashboardHttpError(response.status, `HTTP ${String(response.status)}`);
  }
  return body;
}

function toAuth(body: unknown, now: number): DashboardAuth {
  const b = body as {
    access_token?: unknown;
    refresh_token?: unknown;
    expires_in?: unknown;
    user?: { id?: unknown; email?: unknown };
  };
  return dashboardAuthSchema.parse({
    accessToken: b.access_token,
    refreshToken: b.refresh_token,
    expiresAt: now + Number(b.expires_in ?? 3600) * 1000,
    userId: b.user?.id,
    email: b.user?.email ?? '',
  });
}

export async function signInDashboard(
  email: string,
  password: string,
  fetchImpl: typeof fetch = fetch,
  now = Date.now(),
): Promise<DashboardAuth> {
  const body = await request(fetchImpl, '/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim(), password }),
  });
  return toAuth(body, now);
}

export async function refreshDashboard(
  refreshToken: string,
  fetchImpl: typeof fetch = fetch,
  now = Date.now(),
): Promise<DashboardAuth> {
  const body = await request(fetchImpl, '/auth/v1/token?grant_type=refresh_token', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  return toAuth(body, now);
}

/** Abmelden beim Dashboard; ein Fehler (z. B. offline) ändert nichts am lokalen Abmelden. */
export async function signOutDashboard(
  token: string,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  await request(fetchImpl, '/auth/v1/logout', { method: 'POST', token });
}

/** Jahre der Step Challenge (Rohwerte je Jahr) oder `null`, wenn nicht eingerichtet. */
export async function fetchChallengeYears(
  auth: DashboardAuth,
  fetchImpl: typeof fetch = fetch,
): Promise<Record<string, unknown> | null> {
  const query = `/rest/v1/settings?select=value&user_id=eq.${encodeURIComponent(auth.userId)}&key=eq.${CHALLENGE_SETTING}`;
  const body = await request(fetchImpl, query, { method: 'GET', token: auth.accessToken });
  const rows: unknown[] = Array.isArray(body) ? body : [];
  // Wie im Dashboard: bei doppelten Zeilen die letzte.
  const last = rows[rows.length - 1] as { value?: unknown } | undefined;
  const parsed = challengeSettingSchema.safeParse(last?.value);
  return parsed.success ? parsed.data.years : null;
}

/** Tageswerte ab `fromDay` (einschließlich), gelöschte inklusive. */
export async function fetchStepRows(
  auth: DashboardAuth,
  fromDay: string,
  fetchImpl: typeof fetch = fetch,
): Promise<StepRow[]> {
  const query = `/rest/v1/step_entries?select=date,steps,deleted&user_id=eq.${encodeURIComponent(auth.userId)}&date=gte.${fromDay}&order=date.asc`;
  const body = await request(fetchImpl, query, { method: 'GET', token: auth.accessToken });
  const rows: unknown[] = Array.isArray(body) ? body : [];
  return rows.flatMap((row) => {
    const parsed = stepRowSchema.safeParse(row);
    return parsed.success ? [parsed.data] : [];
  });
}
