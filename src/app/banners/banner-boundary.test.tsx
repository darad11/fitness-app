// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { DbProvider, listErrorLog, type DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { GlobalBanners } from './GlobalBanners';

// Eine Leiste, die beim Zeichnen wirft (wie früher „Training läuft“ bei einem ungültigen Training).
vi.mock('@/modules/training', async (original) => ({
  ...(await original<typeof import('@/modules/training')>()),
  SessionBanner: () => {
    throw new Error('Leiste kaputt');
  },
}));

let rt: DbRuntime;

beforeEach(async () => {
  rt = await createTestRuntime();
});

afterEach(async () => {
  cleanup();
  vi.restoreAllMocks();
  await rt.db.delete();
});

it('ein Fehler in einer Leiste nimmt nur diese Leiste weg und landet im Protokoll (B-04)', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const router = createMemoryRouter(
    [
      {
        path: '*',
        element: (
          <>
            <GlobalBanners />
            <h1>Seite</h1>
          </>
        ),
      },
    ],
    { initialEntries: ['/heute'] },
  );
  render(
    <DbProvider runtime={rt}>
      <RouterProvider router={router} />
    </DbProvider>,
  );
  expect(await screen.findByRole('heading', { level: 1, name: 'Seite' })).toBeInTheDocument();
  await waitFor(async () => {
    const entries = await listErrorLog(rt.db);
    expect(entries.some((e) => e.area === 'banner:session')).toBe(true);
  });
});
