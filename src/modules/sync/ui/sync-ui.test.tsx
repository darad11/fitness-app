// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DbProvider, type DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { getAuth } from '../data/syncState';
import { syncRoutes } from '../routes';

let rt: DbRuntime;
beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
});
afterEach(async () => {
  cleanup();
  vi.unstubAllGlobals();
  await rt.db.delete();
});

const WAIT = { timeout: 10_000 };
const USER = '11111111-1111-4111-8111-111111111111';
const urlOf = (input: RequestInfo | URL): string =>
  typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

describe('Synchronisierung (D-269)', () => {
  it('meldet an, gleicht ab, zeigt den Stand und meldet ab', { timeout: 30_000 }, async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>((input, init) => {
        const url = urlOf(input);
        calls.push(`${init?.method ?? 'GET'} ${url.replace(/^https:\/\/[^/]+/, '')}`);
        const body = url.includes('grant_type=password')
          ? (init?.body as string).includes('falsch')
            ? { status: 400, json: { message: 'Invalid login credentials' } }
            : {
                status: 200,
                json: {
                  access_token: 'a',
                  refresh_token: 'r',
                  expires_in: 3600,
                  user: { id: USER, email: 'ich@example.org' },
                },
              }
          : url.includes('/rpc/push_documents')
            ? { status: 200, json: [] }
            : url.includes('/logout')
              ? { status: 204, json: null }
              : { status: 200, json: [] };
        return Promise.resolve(
          new Response(body.json === null ? null : JSON.stringify(body.json), {
            status: body.status,
          }),
        );
      }),
    );
    const user = userEvent.setup();
    const router = createMemoryRouter(syncRoutes, { initialEntries: ['/mehr/synchronisierung'] });
    render(
      <DbProvider runtime={rt}>
        <RouterProvider router={router} />
      </DbProvider>,
    );
    await screen.findByRole('heading', { level: 1, name: 'Synchronisierung' }, WAIT);
    await user.type(await screen.findByLabelText('E-Mail', {}, WAIT), 'ich@example.org');
    await user.type(screen.getByLabelText('Passwort'), 'falsch');
    await user.click(screen.getByRole('button', { name: 'Anmelden' }));
    expect(await screen.findByText('E-Mail oder Passwort stimmt nicht.', {}, WAIT)).toBeVisible();
    await user.clear(screen.getByLabelText('Passwort'));
    await user.type(screen.getByLabelText('Passwort'), 'richtig');
    await user.click(screen.getByRole('button', { name: 'Anmelden' }));
    expect(await screen.findByText('Angemeldet als ich@example.org', {}, WAIT)).toBeVisible();
    expect(await screen.findByText(/^Zuletzt abgeglichen:/, {}, WAIT)).toBeVisible();
    expect(calls.some((c) => c.startsWith('GET /rest/v1/sync_documents?'))).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Abmelden' }));
    expect(await screen.findByRole('button', { name: 'Anmelden' }, WAIT)).toBeVisible();
    expect(await getAuth(rt.db)).toBeNull();
  });

  it(
    'registriert mit Bestätigungsmail und prüft die Passwörter vorher (D-273)',
    { timeout: 30_000 },
    async () => {
      const signups: string[] = [];
      vi.stubGlobal(
        'fetch',
        vi.fn<typeof fetch>((input, init) => {
          const url = urlOf(input);
          if (url.includes('/auth/v1/signup')) signups.push(init?.body as string);
          return Promise.resolve(
            new Response(JSON.stringify({ id: USER, email: 'neu@example.org' }), { status: 200 }),
          );
        }),
      );
      const user = userEvent.setup();
      const router = createMemoryRouter(syncRoutes, { initialEntries: ['/mehr/synchronisierung'] });
      render(
        <DbProvider runtime={rt}>
          <RouterProvider router={router} />
        </DbProvider>,
      );
      await user.click(
        await screen.findByRole('button', { name: 'Noch kein Konto? Registrieren' }, WAIT),
      );
      await user.type(screen.getByLabelText('E-Mail'), 'neu@example.org');
      await user.type(screen.getByLabelText('Passwort'), 'kurz');
      await user.type(screen.getByLabelText('Passwort wiederholen'), 'kurz');
      await user.click(screen.getByRole('button', { name: 'Registrieren' }));
      expect(screen.getByRole('alert')).toHaveTextContent('mindestens 8 Zeichen');
      await user.clear(screen.getByLabelText('Passwort'));
      await user.type(screen.getByLabelText('Passwort'), 'langesPasswort');
      await user.click(screen.getByRole('button', { name: 'Registrieren' }));
      expect(screen.getByRole('alert')).toHaveTextContent('stimmen nicht überein');
      expect(signups).toEqual([]);
      await user.clear(screen.getByLabelText('Passwort wiederholen'));
      await user.type(screen.getByLabelText('Passwort wiederholen'), 'langesPasswort');
      await user.click(screen.getByRole('button', { name: 'Registrieren' }));
      expect(
        await screen.findByText(/Wir haben eine E-Mail an neu@example\.org geschickt/, {}, WAIT),
      ).toBeVisible();
      expect(signups).toHaveLength(1);
      // Zurück im Anmelden-Modus, noch kein Zugang gespeichert.
      expect(screen.getByRole('button', { name: 'Anmelden' })).toBeVisible();
      expect(await getAuth(rt.db)).toBeNull();
    },
  );
});
