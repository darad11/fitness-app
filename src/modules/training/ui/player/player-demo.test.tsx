// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadCoreExercises, resetExerciseMediaForTests } from '@/modules/exercises';
import { DbProvider, type DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { loadSampleTemplate } from '../../data/sampleTemplates';
import { trainingRoutes } from '../../routes';
import {
  completeSet,
  planFromTemplateDay,
  setValues,
  startSession,
} from '../../service/sessionService';

/**
 * Demonstration im Player (Phase Übungen, D-397, Leitlinien Kapitel 3 und 10): gehört zur
 * aktuellen Übung, wechselt mit ihr ohne falsches Bild, bleibt beim Abhaken und lädt die aktuelle
 * und die nächste Übung vor. Visuals hier nur als Testliste, keine echten Dateien.
 */

vi.mock('@/shared/lib/sound', () => ({
  playRestEndSound: vi.fn(() => true),
  unlockSound: vi.fn(),
}));

const KEYS = ['back_squat_barbell', 'bench_press_barbell', 'seated_cable_row'];

function serveVisuals() {
  const file = (name: string) => ({ src: `medien/${name}.webp`, width: 640, height: 480 });
  vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
    Promise.resolve(
      new Response(
        JSON.stringify({
          version: 1,
          sources: {
            test: {
              name: 'Test',
              url: 'https://example.org/',
              license: 'CC0 1.0',
              commercialUse: true,
            },
          },
          visuals: Object.fromEntries(
            KEYS.map((key) => [
              key,
              {
                preview: file(`${key}-vorschau`),
                demo: { kind: 'image', file: file(`${key}-bild`) },
                alt: `Bild zu ${key}`,
                source: 'test',
              },
            ]),
          ),
        }),
      ),
    ),
  );
}

let rt: DbRuntime;
let preloaded: string[];
beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
  await resetExerciseMediaForTests();
  preloaded = [];
  vi.stubGlobal(
    'Image',
    class {
      decoding = '';
      set src(value: string) {
        preloaded.push(value);
      }
    },
  );
});
afterEach(async () => {
  cleanup();
  vi.unstubAllGlobals();
  await resetExerciseMediaForTests();
  await rt.db.delete();
});

async function startTemplate() {
  const exercises = await loadCoreExercises();
  const template = (await loadSampleTemplate('full_body_ab'))!;
  return startSession(
    rt,
    planFromTemplateDay(template, 0, 0, (id) => exercises.find((e) => e.id === id)),
  );
}

function renderAt(path: string) {
  const router = createMemoryRouter(trainingRoutes, { initialEntries: [path] });
  render(
    <DbProvider runtime={rt}>
      <RouterProvider router={router} />
    </DbProvider>,
  );
  return router;
}

/** Bildquellen im Bereich der großen Demonstration; der Knopf darin nennt die Übung. */
function demoSources(name: string): string[] {
  const region = screen.getByRole('region', { name: 'Ausführung der aktuellen Übung' });
  within(region).getByRole('button', { name: `${name}: Ausführung und Angaben` });
  return [...region.querySelectorAll('img')].map((img) => img.getAttribute('src') ?? '');
}

describe('Demonstration im Player (D-397)', () => {
  it('folgt der aktuellen Übung, nie mit dem Bild einer anderen; Abhaken ändert nichts', async () => {
    serveVisuals();
    const user = userEvent.setup();
    const session = await startTemplate();
    renderAt(`/training/einheit/${session.id}`);
    await screen.findByRole('heading', { level: 1 });
    await waitFor(() => {
      expect(demoSources('Kniebeuge mit Langhantel')).toEqual([
        '/uebungen/medien/back_squat_barbell-bild.webp',
      ]);
    });
    // Kompakt in „Jetzt“: das Vorschaubild derselben Übung.
    const now = screen.getByRole('region', { name: 'Jetzt' });
    expect(within(now).getByRole('img').getAttribute('src')).toBe(
      '/uebungen/medien/back_squat_barbell-vorschau.webp',
    );
    // Aktuelle und nächste Übung vorgeladen, nicht die ganze Bibliothek.
    await waitFor(() => {
      expect(preloaded.sort()).toEqual([
        '/uebungen/medien/back_squat_barbell-bild.webp',
        '/uebungen/medien/bench_press_barbell-bild.webp',
      ]);
    });

    // Kniebeuge nach unten: Bankdrücken wird aktuell, sofort mit seinem Bild.
    await user.click(
      screen.getByRole('button', { name: 'Weitere Aktionen, Kniebeuge mit Langhantel' }),
    );
    await user.click(screen.getByRole('button', { name: 'Nach unten' }));
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: 'Kniebeuge mit Langhantel: Ausführung und Angaben' }),
      ).toBeNull();
    });
    expect(demoSources('Bankdrücken mit Langhantel')).toEqual([
      '/uebungen/medien/bench_press_barbell-bild.webp',
    ]);

    // Einen Satz abhaken, die Pause startet: Bankdrücken bleibt.
    const setId = session.exercises[1]!.sets[0]!.id;
    await setValues(rt, session.id, setId, { weightKg: 40, reps: 8 });
    await completeSet(rt, session.id, setId, { restDefaultSec: 90, autoStartRest: true });
    await waitFor(() => {
      expect(screen.getAllByText(/1 von 17 Sätzen/).length).toBeGreaterThan(0);
    });
    expect(demoSources('Bankdrücken mit Langhantel')).toEqual([
      '/uebungen/medien/bench_press_barbell-bild.webp',
    ]);
  }, 20_000);

  it('ohne Visual das Symbol mit Muskel-Etiketten; Antippen öffnet Info mit Ausführung', async () => {
    const user = userEvent.setup();
    const session = await startTemplate();
    renderAt(`/training/einheit/${session.id}`);
    await screen.findByRole('heading', { level: 1 });
    const region = screen.getByRole('region', { name: 'Ausführung der aktuellen Übung' });
    await waitFor(() => {
      expect(region.querySelector('[data-demo="symbol"]')).not.toBeNull();
    });
    expect(region.querySelector('img')).toBeNull();
    await user.click(
      within(region).getByRole('button', {
        name: 'Kniebeuge mit Langhantel: Ausführung und Angaben',
      }),
    );
    const dialog = await screen.findByRole('dialog', { name: 'Kniebeuge mit Langhantel' });
    expect(await within(dialog).findByText('Schritt für Schritt')).toBeVisible();
    expect(within(dialog).getByRole('link', { name: 'Alle Angaben zur Übung' })).toHaveAttribute(
      'href',
      expect.stringMatching(/^\/uebungen\/[0-9a-f-]{36}$/),
    );
  }, 20_000);
});
