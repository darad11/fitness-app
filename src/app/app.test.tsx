// @vitest-environment jsdom
import {
  act,
  cleanup,
  getDefaultNormalizer,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, type RouteObject } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DbProvider, listErrorLog, META_KEYS, type DbRuntime } from '@/shared/db';
import type { PlatformInfo } from '@/shared/lib/platform';
import { resetPwaState, setUpdateActivator } from '@/shared/pwa/state';
import { createTestRuntime } from '@/shared/testing/db';
import { App } from './App';
import { InstallHintBanner, UpdateBanner } from './banners/GlobalBanners';
import { RouteErrorView } from './errors/ErrorViews';
import { AppLayout } from './layout/AppLayout';
import { recoveryCause, RecoveryScreen } from './RecoveryScreen';
import { routes } from './routes';

let rt: DbRuntime;

beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
  resetPwaState();
  document.documentElement.setAttribute('data-theme', 'dark');
});

afterEach(async () => {
  cleanup();
  await rt.db.delete();
});

function renderApp(path: string, routeObjects: RouteObject[] = routes) {
  const router = createMemoryRouter(routeObjects, { initialEntries: [path] });
  render(<App runtime={rt} router={router} />);
  return router;
}

function renderWithDb(element: React.ReactNode, path = '/') {
  const router = createMemoryRouter([{ path: '*', element }], { initialEntries: [path] });
  render(
    <DbProvider runtime={rt}>
      <RouterProvider router={router} />
    </DbProvider>,
  );
}

describe('App-Shell', () => {
  it('leitet die Startadresse auf „Heute" um und zeigt das Datum', async () => {
    const router = renderApp('/');
    expect(
      await screen.findByRole('heading', { level: 1, name: /^Heute:\s*Guten / }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/heute');
    expect(
      screen.getByText(/^(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag), /),
    ).toBeInTheDocument();
  });

  it('zeigt in der Navigation nur verfügbare Bereiche (AK-UX-01)', async () => {
    renderApp('/heute');
    await screen.findByRole('heading', { level: 1, name: /^Heute:\s*Guten / });
    const navs = screen.getAllByRole('navigation', { name: 'Hauptnavigation' });
    expect(navs.length).toBeGreaterThan(0);
    for (const nav of navs) {
      const labels = within(nav)
        .getAllByRole('link')
        .map((link) => link.textContent);
      expect(labels).toEqual(['Heute', 'Training', 'Ernährung', 'Fortschritt', 'Mehr']);
    }
  });

  it('führt über Training zu den Übungen; Training bleibt dort markiert', async () => {
    const user = userEvent.setup();
    const router = renderApp('/training');
    await screen.findByRole('heading', { level: 1, name: 'Training' });
    await user.click(screen.getByRole('link', { name: 'Übungen' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Übungen' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/uebungen');
    // Seitenleiste: Farbklasse; Tab-Leiste: Klasse „active“ (Farbe per CSS, wegen der Linse).
    const marked = (link: HTMLElement) =>
      link.classList.contains('text-accent-ink') || link.classList.contains('active');
    for (const nav of screen.getAllByRole('navigation', { name: 'Hauptnavigation' })) {
      expect(marked(within(nav).getByRole('link', { name: 'Training' }))).toBe(true);
      expect(marked(within(nav).getByRole('link', { name: 'Heute' }))).toBe(false);
    }
  });

  it('zeigt die Leiste „Training läuft" auf anderen Seiten und springt zurück; „Heute" hat die Karte (AK-TRN-17, AK-DSH-01)', async () => {
    const { startSession } = await import('@/modules/training/service/sessionService');
    const session = await startSession(rt, {
      source: 'free',
      title: 'Freies Training',
      exercises: [],
    });
    const persist = vi.fn(() => Promise.resolve(true));
    Object.defineProperty(navigator, 'storage', { configurable: true, value: { persist } });
    const user = userEvent.setup();
    const router = renderApp('/mehr');
    const banner = await screen.findByRole('status');
    expect(banner).toHaveTextContent(/Training läuft.*Freies Training · 0:0\d · 0 von 0 Sätzen/);
    await waitFor(() => {
      expect(persist).toHaveBeenCalledTimes(1);
    });
    await user.click(within(banner).getByRole('link', { name: 'Training fortsetzen' }));
    await screen.findByRole('heading', { level: 1, name: 'Freies Training' });
    expect(router.state.location.pathname).toBe(`/training/einheit/${session.id}`);
    // Im Player selbst keine Leiste.
    expect(screen.queryByRole('status')).toBeNull();

    await act(() => router.navigate('/heute'));
    const card = await screen.findByRole('region', { name: 'Freies Training' });
    expect(card).toHaveTextContent(/Seit 0:0\d · 0 von 0 Sätzen/);
    expect(within(card).getByRole('link', { name: 'Training fortsetzen' })).toBeInTheDocument();
    expect(screen.queryByRole('status')).toBeNull();
    Reflect.deleteProperty(navigator, 'storage');
  });

  it('listet unter „Mehr" nur fertige Seiten', async () => {
    renderApp('/mehr');
    await screen.findByRole('heading', { level: 1, name: 'Mehr' });
    const main = screen.getByRole('main');
    expect(
      within(main)
        .getAllByRole('link')
        .map((link) => link.textContent)
        // Ohne das Logo oben links (D-286, D-310); es hat keinen Text, nur ein Bild.
        .filter((text) => text !== ''),
    ).toEqual(['Profil und Ziele', 'Einstellungen', 'Synchronisierung', 'Über die App']);
  });

  it('bietet keine Darstellungswahl an; die App bleibt dunkel (D-308)', async () => {
    renderApp('/mehr/einstellungen');
    await screen.findByRole('heading', { level: 1, name: 'Einstellungen' });
    await waitFor(() => {
      expect(screen.getByLabelText('Datum und Zahlen')).toBeEnabled();
    });
    expect(screen.queryByRole('radio', { name: 'Dunkel' })).toBeNull();
    expect(screen.queryByText('Darstellung')).toBeNull();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('formatiert nach gewählter Region: Österreich „Jänner", Deutschland „Januar"', async () => {
    // Ohne Normalisierung, damit geschützte Leerzeichen nachweisbar bleiben.
    const exact = { normalizer: getDefaultNormalizer({ collapseWhitespace: false, trim: false }) };
    const user = userEvent.setup();
    renderApp('/mehr/einstellungen');
    const select = await screen.findByLabelText('Datum und Zahlen');
    await waitFor(() => {
      expect(select).toBeEnabled();
    });
    await user.selectOptions(select, 'de-AT');
    expect(
      await screen.findByText(/17\. Jänner 2026 · 21:05 · 1\s234,5 · 72,5\u00A0kg/, exact),
    ).toBeInTheDocument();
    await user.selectOptions(select, 'de-DE');
    expect(
      await screen.findByText(/17\. Januar 2026 · 21:05 · 1\.234,5 · 72,5\u00A0kg/, exact),
    ).toBeInTheDocument();
  });

  it('zeigt Version und Speicher-ID unter „Über die App"', async () => {
    renderApp('/mehr/ueber');
    await screen.findByRole('heading', { level: 1, name: 'Über die App' });
    expect(screen.getByText('a1b2c3d4')).toBeInTheDocument();
    expect(screen.getByText(/^\d+\.\d+\.\d+$/)).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Nach Update suchen' }));
    expect(
      await screen.findByText('In dieser Umgebung gibt es keine automatischen Updates.'),
    ).toBeInTheDocument();
  });

  it('meldet unbekannte Beispielvorlagen als nicht gefunden, ohne Fehlerprotokoll', async () => {
    renderApp('/training/vorlagen/gibt_es_nicht');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Seite nicht gefunden' }),
    ).toBeInTheDocument();
    expect(await listErrorLog(rt.db)).toEqual([]);
  });

  it('meldet unbekannte Adressen', async () => {
    renderApp('/gibt-es-nicht');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Seite nicht gefunden' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Zu Heute' })).toHaveAttribute('href', '/heute');
  });

  it('fängt den Absturz einer Ansicht ab; Navigation bleibt nutzbar (AK-DAT-09)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    function Broken(): never {
      throw new Error('Ansicht kaputt 42');
    }
    renderApp('/kaputt', [
      {
        path: '/',
        Component: AppLayout,
        children: [
          { ErrorBoundary: RouteErrorView, children: [{ path: 'kaputt', Component: Broken }] },
        ],
      },
    ]);
    expect(await screen.findByRole('alert')).toHaveTextContent('Diese Ansicht hat einen Fehler');
    expect(screen.getAllByRole('navigation', { name: 'Hauptnavigation' }).length).toBeGreaterThan(
      0,
    );
    await waitFor(async () => {
      const entries = await listErrorLog(rt.db);
      expect(
        entries.some((e) => e.area === 'route' && e.message === 'Error: Ansicht kaputt #'),
      ).toBe(true);
    });
  });
});

describe('Hinweisleisten', () => {
  const iphoneTab: PlatformInfo = {
    isIphone: true,
    isIpad: false,
    isIos: true,
    isMac: false,
    isStandalone: false,
    needsIosInstallHint: true,
  };

  it('zeigt im iOS-Safari-Tab den Installationshinweis; Ausblenden bleibt gespeichert (AK-PWA-04)', async () => {
    const user = userEvent.setup();
    renderWithDb(<InstallHintBanner platform={iphoneTab} />);
    expect(await screen.findByText(/Teilen › Zum Home-Bildschirm/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Anleitung' })).toHaveAttribute(
      'href',
      '/mehr/installieren',
    );
    await user.click(screen.getByRole('button', { name: 'Ausblenden' }));
    await waitFor(() => {
      expect(screen.queryByText(/Teilen › Zum Home-Bildschirm/)).not.toBeInTheDocument();
    });
    expect((await rt.db.meta.get(META_KEYS.dismissedHints))?.value).toEqual(['ios-install']);
  });

  it('zeigt den Hinweis nicht in der installierten App', async () => {
    renderWithDb(
      <>
        <InstallHintBanner
          platform={{ ...iphoneTab, isStandalone: true, needsIosInstallHint: false }}
        />
        <p>geladen</p>
      </>,
    );
    await screen.findByText('geladen');
    expect(screen.queryByText(/Teilen › Zum Home-Bildschirm/)).not.toBeInTheDocument();
  });

  it('aktiviert eine neue Version erst nach Bestätigung (AK-PWA-03)', async () => {
    const activate = vi.fn(() => Promise.resolve());
    setUpdateActivator(activate);
    render(<UpdateBanner />);
    expect(screen.queryByText('Neue Version verfügbar')).not.toBeInTheDocument();
    act(() => {
      resetPwaState({ updateAvailable: true });
      setUpdateActivator(activate);
    });
    expect(screen.getByText('Neue Version verfügbar')).toBeInTheDocument();
    expect(activate).not.toHaveBeenCalled();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Jetzt aktualisieren' }));
    expect(activate).toHaveBeenCalledOnce();
  });
});

describe('Wiederherstellungsbildschirm', () => {
  it.each([
    [Object.assign(new Error('blockiert'), { name: 'SecurityError' }), 'lokalen Speicher'],
    [Object.assign(new Error('fehlt'), { name: 'MissingAPIError' }), 'lokalen Speicher'],
    [Object.assign(new Error('neu'), { name: 'VersionError' }), 'neueren Version'],
    [Object.assign(new Error('weg'), { name: 'ConnectionLostError' }), 'wiederholt abgebrochen'],
    [new Error('anderes'), 'Unbekannte Ursache'],
  ])('nennt die Ursache verständlich', (error, expected) => {
    expect(recoveryCause(error)).toContain(expected);
  });

  it('erkennt die Ursache auch in von Dexie verpackten Fehlern', () => {
    const wrapped = Object.assign(new Error('OpenFailed'), {
      name: 'OpenFailedError',
      inner: Object.assign(new Error('x'), { name: 'SecurityError' }),
    });
    expect(recoveryCause(wrapped)).toContain('lokalen Speicher');
  });

  it('bietet „Erneut versuchen" an', () => {
    render(<RecoveryScreen error={new Error('x')} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('nicht öffnen');
    expect(screen.getByRole('button', { name: 'Erneut versuchen' })).toBeInTheDocument();
  });
});
