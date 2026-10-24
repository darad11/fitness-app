import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addBodyWeight } from '@/modules/body';
import { isPrivateMetaKey, type DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { SUPABASE_KEY, SUPABASE_URL } from '../config';
import { InvalidCredentialsError, SignUpError } from '../data/remote';
import { getAuth, getStatus, SYNC_KEYS } from '../data/syncState';
import {
  createRemote,
  OtherAccountError,
  SessionExpiredError,
  signIn,
  signOut,
  signUp,
  syncNow,
} from './syncService';

let rt: DbRuntime;
beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
});
afterEach(async () => {
  await rt.db.delete();
});

const USER = '11111111-1111-4111-8111-111111111111';
const urlOf = (input: RequestInfo | URL | undefined): string =>
  typeof input === 'string' ? input : input instanceof URL ? input.href : (input?.url ?? '');
const json = (status: number, body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));
const tokenBody = (n: number) => ({
  access_token: `access-${String(n)}`,
  refresh_token: `refresh-${String(n)}`,
  expires_in: 3600,
  user: { id: USER, email: 'ich@example.org' },
});

describe('Anmeldung und Server (D-269)', () => {
  it('meldet mit E-Mail und Passwort an und speichert den Zugang nur lokal', async () => {
    const fetchMock = vi.fn<typeof fetch>(() => json(200, tokenBody(1)));
    const auth = await signIn(rt.db, ' ich@example.org ', 'geheim', fetchMock);
    expect(auth).toMatchObject({ userId: USER, email: 'ich@example.org', accessToken: 'access-1' });
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(`${SUPABASE_URL}/auth/v1/token?grant_type=password`);
    expect(init?.headers).toMatchObject({ apikey: SUPABASE_KEY });
    expect(JSON.parse(init?.body as string)).toEqual({
      email: 'ich@example.org',
      password: 'geheim',
    });
    expect(await getAuth(rt.db)).toMatchObject({ refreshToken: 'refresh-1' });

    await expect(
      signIn(rt.db, 'x@y.z', 'falsch', () => json(400, { message: 'Invalid login credentials' })),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);

    await signOut(rt.db, () => json(204, null));
    expect(await getAuth(rt.db)).toBeNull();
  });

  it('erneuert ein abgelaufenes Token und wiederholt nach 401 einmal', async () => {
    await signIn(rt.db, 'ich@example.org', 'geheim', () => json(200, tokenBody(1)));
    let pulls = 0;
    const fetchMock = vi.fn<typeof fetch>((input) => {
      const url = urlOf(input);
      if (url.includes('grant_type=refresh_token')) return json(200, tokenBody(2));
      pulls += 1;
      return pulls === 1 ? json(401, { message: 'JWT expired' }) : json(200, []);
    });
    const remote = createRemote(rt.db, fetchMock);
    expect(await remote.pull(0, 500)).toEqual([]);
    const pullCalls = fetchMock.mock.calls.filter(([u]) => urlOf(u).includes('sync_documents'));
    expect(pullCalls).toHaveLength(2);
    expect(pullCalls[0]?.[1]?.headers).toMatchObject({ Authorization: 'Bearer access-1' });
    expect(pullCalls[1]?.[1]?.headers).toMatchObject({ Authorization: 'Bearer access-2' });
    expect(urlOf(pullCalls[0]?.[0])).toContain('rev=gt.0&order=rev.asc&limit=500');
    expect((await getAuth(rt.db))?.accessToken).toBe('access-2');
  });

  it('meldet ab, wenn die Anmeldung nicht mehr erneuert werden kann', async () => {
    await signIn(rt.db, 'ich@example.org', 'geheim', () => json(200, tokenBody(1)));
    const fetchMock = vi.fn<typeof fetch>((input) =>
      urlOf(input).includes('refresh_token')
        ? json(400, { message: 'Invalid Refresh Token' })
        : json(401, { message: 'JWT expired' }),
    );
    await expect(syncNow(rt, { fetchImpl: fetchMock })).rejects.toBeInstanceOf(SessionExpiredError);
    expect(await getAuth(rt.db)).toBeNull();
    expect((await getStatus(rt.db)).lastError).toBe('SessionExpiredError');
  });

  it('schreibt nach einem Abgleich Zeit und Zahlen in den Status', async () => {
    const remote = { pull: () => Promise.resolve([]), push: () => Promise.resolve([]) };
    expect(await syncNow(rt, { remote })).toEqual({ pulled: 0, pushed: 0, conflicts: 0 });
    expect(await getStatus(rt.db)).toMatchObject({ pulled: 0, pushed: 0, conflicts: 0 });
    expect((await getStatus(rt.db)).lastSyncAt).toBeDefined();
  });
});

describe('Registrierung (D-273)', () => {
  const BACK = 'https://fitness.example/mehr/synchronisierung';

  it('ist ohne Bestätigungsmail sofort angemeldet', async () => {
    const fetchMock = vi.fn<typeof fetch>(() => json(200, tokenBody(1)));
    const result = await signUp(rt.db, ' neu@example.org ', 'langesPasswort', BACK, fetchMock);
    expect(result.kind).toBe('signedIn');
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(urlOf(url)).toBe(
      `${SUPABASE_URL}/auth/v1/signup?redirect_to=${encodeURIComponent(BACK)}`,
    );
    expect(JSON.parse(init?.body as string)).toEqual({
      email: 'neu@example.org',
      password: 'langesPasswort',
    });
    expect((await getAuth(rt.db))?.userId).toBe(USER);
  });

  it('wartet bei Bestätigung per E-Mail und speichert noch keinen Zugang', async () => {
    const result = await signUp(rt.db, 'neu@example.org', 'langesPasswort', BACK, () =>
      json(200, { id: USER, email: 'neu@example.org', confirmation_sent_at: '2026-10-19' }),
    );
    expect(result).toEqual({ kind: 'confirmEmail' });
    expect(await getAuth(rt.db)).toBeNull();
  });

  it.each([
    [{ error_code: 'signup_disabled', msg: 'Signups not allowed for this instance' }, 'disabled'],
    [{ error_code: 'user_already_exists', msg: 'User already registered' }, 'exists'],
    [
      { error_code: 'weak_password', msg: 'Password should be at least 6 characters' },
      'weakPassword',
    ],
    [{ error_code: 'email_address_invalid', msg: 'Email address is invalid' }, 'invalidEmail'],
    [{ msg: 'Signups not allowed for this instance' }, 'disabled'],
  ])('meldet abgelehnte Registrierung verständlich: %o', async (body, problem) => {
    const error = await signUp(rt.db, 'neu@example.org', 'langesPasswort', BACK, () =>
      json(422, body),
    ).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(SignUpError);
    expect((error as SignUpError).problem).toBe(problem);
    expect(await getAuth(rt.db)).toBeNull();
  });
});

describe('Kontowechsel (A-08)', () => {
  const OTHER = '22222222-2222-4222-8222-222222222222';
  const otherBody = { ...tokenBody(2), user: { id: OTHER, email: 'test@example.org' } };

  async function syncedDevice() {
    await signIn(rt.db, 'ich@example.org', 'geheim', () => json(200, tokenBody(1)));
    await addBodyWeight(rt, { weightKg: 80.4, measuredAt: new Date('2026-10-20T07:00:00Z') });
    await signOut(rt.db, () => json(204, null));
  }

  it('bricht die Anmeldung mit einem anderen Konto ab, solange Daten auf dem Gerät liegen', async () => {
    await syncedDevice();
    const calls: string[] = [];
    const fetchMock = vi.fn<typeof fetch>((input) => {
      calls.push(urlOf(input));
      return urlOf(input).includes('/logout') ? json(204, null) : json(200, otherBody);
    });
    await expect(signIn(rt.db, 'test@example.org', 'geheim', fetchMock)).rejects.toBeInstanceOf(
      OtherAccountError,
    );
    expect(await getAuth(rt.db)).toBeNull();
    // Die eben erhaltene Anmeldung ist am Server wieder beendet.
    expect(calls.some((url) => url.includes('/logout'))).toBe(true);
    // Mit dem bisherigen Konto geht es weiter.
    await signIn(rt.db, 'ich@example.org', 'geheim', () => json(200, tokenBody(3)));
    expect(await getAuth(rt.db)).toMatchObject({ userId: USER });
  });

  it('auch beim Registrieren, wenn man danach gleich angemeldet ist', async () => {
    await syncedDevice();
    await expect(
      signUp(rt.db, 'test@example.org', 'geheim123', 'https://app.example', (input) =>
        urlOf(input).includes('/logout') ? json(204, null) : json(200, otherBody),
      ),
    ).rejects.toBeInstanceOf(OtherAccountError);
    expect(await getAuth(rt.db)).toBeNull();
  });

  it('ein Gerät ohne Daten darf das Konto wechseln', async () => {
    await signIn(rt.db, 'ich@example.org', 'geheim', () => json(200, tokenBody(1)));
    await signOut(rt.db, () => json(204, null));
    await signIn(rt.db, 'test@example.org', 'geheim', () => json(200, otherBody));
    expect(await getAuth(rt.db)).toMatchObject({ userId: OTHER });
  });
});

it('der Zugang gehört nicht in Snapshots, Cursor und Nutzer schon (D-02)', () => {
  expect(isPrivateMetaKey(SYNC_KEYS.auth)).toBe(true);
  expect([SYNC_KEYS.cursor, SYNC_KEYS.status, SYNC_KEYS.user].some(isPrivateMetaKey)).toBe(false);
});
