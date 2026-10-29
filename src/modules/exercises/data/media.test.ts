// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import mediaFile from '../../../../public/uebungen/medien.json';
import guidesFile from './exercise-guides.v1.json';
import coreFile from './core-exercises.v1.json';
import { exerciseGuidesSchema, exerciseMediaSchema, type ExerciseMedia } from '../model/media';
import { coreExerciseId } from './coreLibrary';
import {
  demoFiles,
  loadGuides,
  loadVisualIndex,
  mediaUrl,
  preloadVisual,
  resetMediaCacheForTests,
  useGuide,
  useVisualIndex,
} from './media';

const CORE_KEYS = coreFile.exercises.map((exercise) => exercise.key);

/** Visual im Format des Manifests, für Tests (keine echte Datei). */
function visual(key: string) {
  return {
    preview: { src: `medien/${key}-vorschau.webp`, width: 240, height: 240 },
    demo: {
      kind: 'phases' as const,
      start: { src: `medien/${key}-start.webp`, width: 640, height: 480 },
      end: { src: `medien/${key}-ende.webp`, width: 640, height: 480 },
    },
    alt: `Testbild ${key}`,
    source: 'test',
  };
}

function manifest(keys: string[]): ExerciseMedia {
  return {
    version: 1,
    sources: {
      test: {
        name: 'Testquelle',
        url: 'https://example.org/',
        license: 'CC0 1.0',
        commercialUse: true,
      },
    },
    visuals: Object.fromEntries(keys.map((key) => [key, visual(key)])),
  };
}

function serve(body: unknown, status = 200) {
  return vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

beforeEach(() => {
  resetMediaCacheForTests();
});
afterEach(() => {
  resetMediaCacheForTests();
});

describe('Liste der Visuals (D-397)', () => {
  it('die ausgelieferte Liste ist gültig und nennt nur Basisübungen mit bekannter Quelle', () => {
    const media = exerciseMediaSchema.parse(mediaFile);
    for (const key of Object.keys(media.visuals)) expect(CORE_KEYS).toContain(key);
  });

  it('IDs wie in der Bestandsaufnahme (tools/exercise_inventory.py rechnet sie in Python)', () => {
    expect(coreExerciseId('bench_press_barbell')).toBe('d9e18691-fe6c-5885-8a52-a9004e985f9a');
    expect(coreExerciseId('back_squat_barbell')).toBe('572e6fea-7c72-5622-a62c-c844a1eb72ce');
  });

  it('ordnet Visuals der Übungs-ID aus dem Schlüssel zu, nicht dem Namen', async () => {
    serve(manifest(['back_squat_barbell', 'goblet_squat']));
    const index = await loadVisualIndex();
    expect([...index.keys()].sort()).toEqual(
      [coreExerciseId('back_squat_barbell'), coreExerciseId('goblet_squat')].sort(),
    );
    const squat = index.get(coreExerciseId('back_squat_barbell'));
    expect(squat?.visual.alt).toBe('Testbild back_squat_barbell');
    expect(squat?.source.license).toBe('CC0 1.0');
    // Unbekannte Schlüssel ordnen nichts zu; kein Visual für eine andere Übung.
    expect(index.get(coreExerciseId('front_squat_barbell'))).toBeUndefined();
  });

  it('ein Schlüssel ohne Basisübung bleibt ohne Zuordnung', async () => {
    serve(manifest(['gibt_es_nicht']));
    const index = await loadVisualIndex();
    expect(index.size).toBe(0);
  });

  it('lehnt Visuals ohne Quelle und Dateien außerhalb des Ordners ab', () => {
    const missingSource = manifest(['goblet_squat']);
    missingSource.sources = {};
    expect(exerciseMediaSchema.safeParse(missingSource).success).toBe(false);
    const outside = manifest(['goblet_squat']);
    const entry = outside.visuals.goblet_squat;
    if (entry) entry.preview.src = '../geheim.webp';
    expect(exerciseMediaSchema.safeParse(outside).success).toBe(false);
  });

  it('fehlt die Liste (offline, Fehler), gibt es keine Visuals; der nächste Aufruf lädt neu', async () => {
    const fetch = serve({}, 503);
    expect((await loadVisualIndex()).size).toBe(0);
    fetch.mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify(manifest(['goblet_squat'])))),
    );
    expect((await loadVisualIndex()).size).toBe(1);
  });

  it('eine ungültige Liste zählt wie keine', async () => {
    serve({ version: 2, visuals: [] });
    expect((await loadVisualIndex()).size).toBe(0);
  });

  it('useVisualIndex lädt einmal und liefert danach sofort', async () => {
    const fetch = serve(manifest(['goblet_squat']));
    const first = renderHook(() => useVisualIndex());
    expect(first.result.current).toBeUndefined();
    await waitFor(() => {
      expect(first.result.current?.size).toBe(1);
    });
    const second = renderHook(() => useVisualIndex());
    expect(second.result.current?.size).toBe(1);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('Adressen und Dateien der Demonstration', () => {
    const entry = visual('goblet_squat');
    expect(mediaUrl(entry.preview)).toBe('/uebungen/medien/goblet_squat-vorschau.webp');
    expect(demoFiles(entry).map(mediaUrl)).toEqual([
      '/uebungen/medien/goblet_squat-start.webp',
      '/uebungen/medien/goblet_squat-ende.webp',
    ]);
    expect(demoFiles({ ...entry, demo: undefined })).toEqual([entry.preview]);
    const video = {
      ...entry,
      demo: {
        kind: 'video' as const,
        file: { src: 'medien/a.mp4', width: 1, height: 1 },
        poster: { src: 'medien/a.webp', width: 1, height: 1 },
      },
    };
    expect(demoFiles(video)).toEqual([video.demo.poster]);
  });

  it('lädt jede Datei höchstens einmal vor', () => {
    const created: string[] = [];
    vi.stubGlobal(
      'Image',
      class {
        decoding = '';
        set src(value: string) {
          created.push(value);
        }
      },
    );
    preloadVisual(visual('goblet_squat'));
    preloadVisual(visual('goblet_squat'));
    expect(created).toEqual([
      '/uebungen/medien/goblet_squat-start.webp',
      '/uebungen/medien/goblet_squat-ende.webp',
    ]);
    vi.unstubAllGlobals();
  });
});

describe('Ausführungstexte (D-398)', () => {
  const guides = exerciseGuidesSchema.parse(guidesFile);
  const ALLOWED = ['exrx.net', 'acefitness.org', 'nasm.org', 'humankinetics.com', 'mayoclinic.org'];

  it('jede Basisübung hat genau einen Eintrag: Text oder offen mit Grund', () => {
    const written = Object.keys(guides.guides);
    const open = guides.open.map((entry) => entry.key);
    expect(new Set([...written, ...open]).size).toBe(written.length + open.length);
    expect([...written, ...open].sort()).toEqual([...CORE_KEYS].sort());
    for (const entry of guides.open) expect(entry.reason.length).toBeGreaterThan(20);
  });

  it('jeder Text hat eine Quelle aus den zugelassenen Fachseiten, nur https', () => {
    for (const [key, guide] of Object.entries(guides.guides)) {
      for (const source of guide.sources) {
        const host = new URL(source.url).hostname.replace(/^www\./, '');
        expect(
          ALLOWED.some((domain) => host === domain || host.endsWith(`.${domain}`)),
          key,
        ).toBe(true);
      }
    }
  });

  it('je Übung eigens: keine zwei gleichen Beschreibungen', () => {
    const summaries = Object.values(guides.guides).map((guide) => guide.summary);
    expect(new Set(summaries).size).toBe(summaries.length);
  });

  it('nach den Leitplanken: keine Ausrufezeichen, keine Emojis, Du-Form statt „man“ und „Sie“', () => {
    for (const [key, guide] of Object.entries(guides.guides)) {
      const text = [
        guide.summary,
        ...guide.setup,
        ...guide.steps,
        ...guide.cues,
        ...(guide.mistakes ?? []),
        ...(guide.safety ?? []),
      ].join(' ');
      expect(text, key).not.toMatch(/!/);
      expect(text, key).not.toMatch(/\p{Extended_Pictographic}/u);
      expect(text, key).not.toMatch(/\b(man|Sie|Ihre?n?)\b/);
      expect(text, key).not.toMatch(/verbrenn|Bestform|Challenge|Grind|Beast/i);
    }
  });

  it('useGuide zeigt beim Wechsel nie den Text der vorigen Übung', async () => {
    const { result, rerender } = renderHook<ReturnType<typeof useGuide>, { key?: string }>(
      ({ key }) => useGuide(key),
      { initialProps: { key: 'goblet_squat' } },
    );
    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });
    const goblet = guides.guides.goblet_squat;
    expect(result.current).toMatchObject({ status: 'ready', guide: goblet });
    rerender({ key: 'plank' });
    // Im ersten Bild nach dem Wechsel: laden oder schon der neue Text, nie der alte.
    expect(result.current.status === 'loading' || result.current).not.toMatchObject({
      guide: goblet,
    });
    await waitFor(() => {
      expect(result.current).toMatchObject({ status: 'ready', guide: guides.guides.plank });
    });
    rerender({ key: 'heel_tap' });
    await waitFor(() => {
      expect(result.current).toMatchObject({ status: 'ready', guide: null });
    });
    rerender({});
    expect(result.current).toMatchObject({ status: 'ready', guide: null });
    await act(async () => {
      await loadGuides();
    });
  });
});
