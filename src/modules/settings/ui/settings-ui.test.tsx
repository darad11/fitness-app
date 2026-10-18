// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DbProvider, dismissHint, META_KEYS, type DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { loadSettings, saveSettings } from '../data/settingsRepository';
import { InstallPage } from './InstallPage';
import { SettingsPage } from './SettingsPage';
import { ThemeSync } from './ThemeSync';

const IPAD_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Safari/605.1.15';

let rt: DbRuntime;

beforeEach(async () => {
  rt = await createTestRuntime();
});

afterEach(async () => {
  cleanup();
  vi.restoreAllMocks();
  await rt.db.delete();
});

function renderPage(element: React.ReactNode) {
  const router = createMemoryRouter([{ path: '*', element }], { initialEntries: ['/'] });
  render(
    <DbProvider runtime={rt}>
      <RouterProvider router={router} />
    </DbProvider>,
  );
}

describe('Mehr › Installieren (AK-SET-06)', () => {
  it('zeigt Startart, Datentrennung und die Anleitungen für iPhone, iPad und Mac', async () => {
    renderPage(<InstallPage />);
    expect(await screen.findByText('Die App läuft gerade im Browser.')).toBeInTheDocument();
    expect(screen.getByText(/getrennt gespeichert/)).toBeInTheDocument();
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(['iPhone', 'iPad', 'Mac']);
    expect(screen.getAllByText(/Zum Home-Bildschirm/, { selector: 'li' })).toHaveLength(2);
  });

  it('stellt auf dem iPad dessen Anleitung nach oben und holt einen ausgeblendeten Hinweis zurück', async () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(IPAD_UA);
    // jsdom kennt maxTouchPoints nicht; für diesen Test wie auf dem iPad setzen.
    Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, get: () => 5 });
    await dismissHint(rt.db, 'ios-install');
    renderPage(<InstallPage />);
    const button = await screen.findByRole('button', { name: 'Hinweis wieder anzeigen' });
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'iPad',
      'iPhone',
      'Mac',
    ]);
    await userEvent.setup().click(button);
    await waitFor(async () => {
      expect((await rt.db.meta.get(META_KEYS.dismissedHints))?.value).toEqual([]);
    });
    Reflect.deleteProperty(navigator, 'maxTouchPoints');
  });

  it('erkennt die installierte App', async () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query) =>
        ({
          matches: query === '(display-mode: standalone)',
          media: query,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
        }) as unknown as MediaQueryList,
    );
    renderPage(<InstallPage />);
    expect(await screen.findByText('Die App läuft als installierte App.')).toBeInTheDocument();
    expect(screen.queryByText(/getrennt gespeichert/)).not.toBeInTheDocument();
  });
});

describe('Mehr › Einstellungen (AK-SET-02, AK-SET-04)', () => {
  it('zeigt beim Laden nur einen Platzhalter und danach gleich die gespeicherte Auswahl', async () => {
    await saveSettings(rt, { theme: 'dark', locale: 'de-DE' });
    renderPage(<SettingsPage />);
    // Erstes Bild: Die Einstellungen sind noch nicht gelesen, also auch keine Auswahl sichtbar.
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();

    expect(await screen.findByRole('radio', { name: 'Dunkel' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Hell' })).not.toBeChecked();
    expect(screen.getByRole('combobox', { name: 'Datum und Zahlen' })).toHaveValue('de-DE');
    expect(screen.getByText(/^Beispiel: 17\. Januar 2026 · 21:05/)).toBeInTheDocument();
    expect(document.querySelector('[aria-busy="true"]')).toBeNull();
  });
});

describe('Mehr › Einstellungen › Training (AK-SET-02)', () => {
  it('zeigt die gespeicherten Trainingswerte und speichert Änderungen sofort', async () => {
    await saveSettings(rt, { restDefaultSec: 120, weightStepKg: 1.25, restSound: false });
    const user = userEvent.setup();
    renderPage(<SettingsPage />);
    expect(await screen.findByRole('combobox', { name: 'Standardpause' })).toHaveValue('120');
    expect(screen.getByRole('combobox', { name: 'Gewichtsschritt' })).toHaveValue('1.25');
    expect(screen.getByRole('switch', { name: 'Ton bei Pausenende' })).not.toBeChecked();
    expect(
      screen.getByRole('switch', { name: 'Pause nach „erledigt“ automatisch starten' }),
    ).toBeChecked();
    // jsdom kennt keinen Wake Lock: Erklärung statt stiller Schalter.
    expect(screen.getByText(/Dein Browser unterstützt das nicht/)).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Standardpause' }), '60');
    await user.click(screen.getByRole('switch', { name: 'Ton bei Pausenende' }));
    await waitFor(async () => {
      const stored = await loadSettings(rt.db);
      expect(stored.restDefaultSec).toBe(60);
      expect(stored.restSound).toBe(true);
    });
  });
});

describe('ThemeSync', () => {
  it('folgt bei „System" Änderungen der Geräteeinstellung', async () => {
    let listener: (() => void) | undefined;
    let systemDark = false;
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query) =>
        ({
          get matches() {
            return query === '(prefers-color-scheme: dark)' && systemDark;
          },
          media: query,
          addEventListener: (_type: string, fn: () => void) => {
            listener = fn;
          },
          removeEventListener: () => undefined,
        }) as unknown as MediaQueryList,
    );
    document.head.innerHTML = '<meta name="theme-color" content="#f3f4f7" />';
    document.documentElement.setAttribute('data-theme', 'light');
    await saveSettings(rt, { theme: 'system' });
    renderPage(<ThemeSync />);
    await waitFor(() => {
      expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    });
    systemDark = true;
    act(() => {
      listener?.();
    });
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe(
      '#0d1016',
    );
  });
});
