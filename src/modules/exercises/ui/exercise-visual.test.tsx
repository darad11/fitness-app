// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { coreExerciseId } from '../data/coreLibrary';
import { resetMediaCacheForTests } from '../data/media';
import type { ExerciseMedia } from '../model/media';
import { ExerciseDemo, ExerciseThumb } from './ExerciseVisual';

const SQUAT = coreExerciseId('back_squat_barbell');
const GOBLET = coreExerciseId('goblet_squat');
const PLANK = coreExerciseId('plank');

function media(
  demoKind: 'phases' | 'video' | 'animation' | 'loop' | 'image' = 'phases',
  previewShape?: 'circle',
): ExerciseMedia {
  const file = (name: string, ext = 'webp') => ({
    src: `medien/${name}.${ext}`,
    width: 640,
    height: 480,
  });
  const demo = (key: string) =>
    demoKind === 'phases'
      ? { kind: 'phases' as const, start: file(`${key}-start`), end: file(`${key}-ende`) }
      : demoKind === 'video'
        ? { kind: 'video' as const, file: file(key, 'mp4'), poster: file(`${key}-poster`) }
        : demoKind === 'animation'
          ? { kind: 'animation' as const, file: file(`${key}-loop`), still: file(`${key}-still`) }
          : demoKind === 'loop'
            ? {
                kind: 'animation' as const,
                file: file(key, 'mp4'),
                webm: file(key, 'webm'),
                still: file(`${key}-poster`),
              }
            : { kind: 'image' as const, file: file(`${key}-bild`) };
  const visual = (key: string) => ({
    preview: { src: `medien/${key}-vorschau.webp`, width: 240, height: 240 },
    ...(previewShape ? { previewShape } : {}),
    demo: demo(key),
    alt: `Bild zu ${key}`,
    source: 'test',
  });
  return {
    version: 1,
    sources: {
      test: { name: 'Test', url: 'https://example.org/', license: 'CC0 1.0', commercialUse: true },
    },
    visuals: {
      back_squat_barbell: visual('back_squat_barbell'),
      goblet_squat: visual('goblet_squat'),
    },
  };
}

function serve(body: unknown) {
  vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
    Promise.resolve(new Response(JSON.stringify(body))),
  );
}

function reducedMotion(matches: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        matches: matches && query.includes('reduced-motion'),
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }) as unknown as MediaQueryList,
  );
}

/** Für `waitFor`: wirft, solange das Element fehlt. */
function need<T>(value: T | null): T {
  if (value === null) throw new Error('noch nicht da');
  return value;
}

const srcs = (container: HTMLElement) =>
  [...container.querySelectorAll('img')].map((img) => img.getAttribute('src'));

beforeEach(() => {
  resetMediaCacheForTests();
});
afterEach(() => {
  cleanup();
  resetMediaCacheForTests();
});

describe('Vorschaubild in Listen (D-397)', () => {
  it('ohne Visual das Symbol in der Kachel, nie ein leerer Kasten', async () => {
    serve(media());
    const { container } = render(<ExerciseThumb exerciseId={PLANK} />);
    await waitFor(() => {
      expect(container.querySelector('[data-visual="symbol"] svg')).not.toBeNull();
    });
    expect(container.querySelector('img')).toBeNull();
  });

  it('mit Visual das Bild der Übung, stumm neben dem Namen, lazy geladen', async () => {
    serve(media());
    const { container } = render(<ExerciseThumb exerciseId={SQUAT} />);
    const img = await waitFor(() => {
      const found = container.querySelector('img');
      expect(found).not.toBeNull();
      return found!;
    });
    expect(img.getAttribute('src')).toBe('/uebungen/medien/back_squat_barbell-vorschau.webp');
    expect(img.getAttribute('alt')).toBe('');
    expect(img.getAttribute('loading')).toBe('lazy');
  });

  it('lädt das Bild nicht, steht wieder das Symbol da', async () => {
    serve(media());
    const { container } = render(<ExerciseThumb exerciseId={SQUAT} />);
    const img = await waitFor(() => need(container.querySelector('img')));
    fireEvent.error(img);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('[data-visual="symbol"]')).not.toBeNull();
  });

  it('ohne Liste (offline, Fehler) das Symbol', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('offline'));
    const { container } = render(<ExerciseThumb exerciseId={SQUAT} />);
    await waitFor(() => {
      expect(container.querySelector('[data-visual="symbol"]')).not.toBeNull();
    });
    expect(container.querySelector('img')).toBeNull();
  });
});

describe('Demonstration (D-397)', () => {
  it('Wechsel der Übung: nie das Bild der vorigen Übung', async () => {
    serve(media('image'));
    reducedMotion(false);
    const props = { name: 'Kniebeuge', muscles: ['quads'] as const, variant: 'large' as const };
    const { container, rerender } = render(<ExerciseDemo exerciseId={SQUAT} {...props} />);
    await waitFor(() => {
      expect(srcs(container)).toEqual(['/uebungen/medien/back_squat_barbell-bild.webp']);
    });
    rerender(<ExerciseDemo exerciseId={GOBLET} {...props} name="Goblet" />);
    // Gleich im ersten Bild nach dem Wechsel das Bild der neuen Übung.
    expect(srcs(container)).toEqual(['/uebungen/medien/goblet_squat-bild.webp']);
    rerender(<ExerciseDemo exerciseId={PLANK} {...props} name="Plank" />);
    expect(srcs(container)).toEqual([]);
    expect(container.querySelector('[data-demo="symbol"]')).not.toBeNull();
    rerender(<ExerciseDemo exerciseId={SQUAT} {...props} />);
    expect(srcs(container)).toEqual(['/uebungen/medien/back_squat_barbell-bild.webp']);
  });

  it('ein Ladefehler bei einer Übung gilt nicht für die nächste', async () => {
    serve(media('image'));
    reducedMotion(false);
    const props = { name: 'X', muscles: [] as const, variant: 'large' as const };
    const { container, rerender } = render(<ExerciseDemo exerciseId={SQUAT} {...props} />);
    const img = await waitFor(() => need(container.querySelector('img')));
    fireEvent.error(img);
    expect(container.querySelector('img')).toBeNull();
    rerender(<ExerciseDemo exerciseId={GOBLET} {...props} />);
    expect(srcs(container)).toEqual(['/uebungen/medien/goblet_squat-bild.webp']);
  });

  it('Rückfall groß: Symbol mit Muskel-Etiketten und einer Zeile für Screenreader', async () => {
    serve(media());
    render(
      <ExerciseDemo
        exerciseId={PLANK}
        name="Plank"
        muscles={['abs', 'obliques']}
        variant="large"
      />,
    );
    expect(
      await screen.findByText('Hauptmuskeln: Bauch, Seitliche Bauchmuskeln'),
    ).toBeInTheDocument();
    expect(screen.getByText('Bauch').closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('zwei Phasen im Wechsel; bei weniger Bewegung nebeneinander mit Beschriftung', async () => {
    serve(media('phases'));
    reducedMotion(false);
    const props = { name: 'Kniebeuge', muscles: [] as const, variant: 'large' as const };
    const first = render(<ExerciseDemo exerciseId={SQUAT} {...props} />);
    await waitFor(() => {
      expect(first.container.querySelector('.demo-phases')).not.toBeNull();
    });
    expect(first.container.querySelector('.demo-phase-end')).not.toBeNull();
    expect(first.container.querySelector('img')?.getAttribute('alt')).toMatch(
      /Bild zu back_squat_barbell Zwei Bilder im Wechsel/,
    );
    first.unmount();

    reducedMotion(true);
    const second = render(<ExerciseDemo exerciseId={SQUAT} {...props} />);
    expect(second.container.querySelector('.demo-phases')).toBeNull();
    expect(screen.getByText('Ausgangsposition')).toBeVisible();
    expect(screen.getByText('Endposition')).toBeVisible();
    expect(srcs(second.container)).toEqual([
      '/uebungen/medien/back_squat_barbell-start.webp',
      '/uebungen/medien/back_squat_barbell-ende.webp',
    ]);
  });

  it('Video stumm und ohne Ton; bei weniger Bewegung kein Autoplay, dafür Steuerung', async () => {
    serve(media('video'));
    reducedMotion(false);
    const props = { name: 'Kniebeuge', muscles: [] as const, variant: 'large' as const };
    const first = render(<ExerciseDemo exerciseId={SQUAT} {...props} />);
    const video = await waitFor(() => need(first.container.querySelector('video')));
    expect(video.muted).toBe(true);
    expect(video.autoplay).toBe(true);
    expect(video.loop).toBe(true);
    expect(video.hasAttribute('playsinline')).toBe(true);
    first.unmount();
    reducedMotion(true);
    const second = render(<ExerciseDemo exerciseId={SQUAT} {...props} />);
    const still = await waitFor(() => need(second.container.querySelector('video')));
    expect(still.autoplay).toBe(false);
    expect(still.controls).toBe(true);
  });

  it('Animation als Bild: läuft, bei weniger Bewegung nur das Standbild (D-403)', async () => {
    serve(media('animation'));
    reducedMotion(false);
    const props = { name: 'Kniebeuge', muscles: [] as const, variant: 'large' as const };
    const first = render(<ExerciseDemo exerciseId={SQUAT} {...props} />);
    await waitFor(() => {
      expect(srcs(first.container)).toEqual(['/uebungen/medien/back_squat_barbell-loop.webp']);
    });
    first.unmount();
    reducedMotion(true);
    const second = render(<ExerciseDemo exerciseId={SQUAT} {...props} />);
    await waitFor(() => {
      expect(srcs(second.container)).toEqual(['/uebungen/medien/back_squat_barbell-still.webp']);
    });
  });

  it('Animation als Video-Schleife: WebM vor MP4, Standbild als Poster und bei weniger Bewegung (D-403)', async () => {
    serve(media('loop'));
    reducedMotion(false);
    const props = { name: 'Kniebeuge', muscles: [] as const, variant: 'large' as const };
    const first = render(<ExerciseDemo exerciseId={SQUAT} {...props} />);
    const video = await waitFor(() => need(first.container.querySelector('video')));
    expect([...video.querySelectorAll('source')].map((n) => n.getAttribute('src'))).toEqual([
      '/uebungen/medien/back_squat_barbell.webm',
      '/uebungen/medien/back_squat_barbell.mp4',
    ]);
    expect(video.getAttribute('poster')).toBe('/uebungen/medien/back_squat_barbell-poster.webp');
    expect(video.muted).toBe(true);
    expect(video.loop).toBe(true);
    expect(video.autoplay).toBe(true);
    expect(video.controls).toBe(false);
    expect(video.hasAttribute('playsinline')).toBe(true);
    expect(video.getAttribute('aria-label')).toBe('Bild zu back_squat_barbell');
    first.unmount();
    reducedMotion(true);
    const second = render(<ExerciseDemo exerciseId={SQUAT} {...props} />);
    await waitFor(() => {
      expect(srcs(second.container)).toEqual(['/uebungen/medien/back_squat_barbell-poster.webp']);
    });
    expect(second.container.querySelector('video')).toBeNull();
  });

  it('offline nur Gespeichertes: ohne Treffer im Speicher das Symbol, ohne Anfrage (D-403)', async () => {
    serve(media('loop'));
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const match = vi.fn((url: string) =>
      Promise.resolve(url.includes('goblet') ? new Response('x') : undefined),
    );
    vi.stubGlobal('caches', { match });
    const squat = render(<ExerciseThumb exerciseId={SQUAT} />);
    const goblet = render(<ExerciseThumb exerciseId={GOBLET} />);
    await waitFor(() => {
      expect(goblet.container.querySelector('img')).not.toBeNull();
    });
    expect(squat.container.querySelector('img')).toBeNull();
    expect(squat.container.querySelector('[data-visual="symbol"]')).not.toBeNull();
    expect(match).toHaveBeenCalledWith('/uebungen/medien/back_squat_barbell-vorschau.webp');
    vi.unstubAllGlobals();
  });

  it('Vorschaubild als Kreis, wenn das Visual es verlangt (D-403)', async () => {
    serve(media('loop', 'circle'));
    const { container } = render(<ExerciseThumb exerciseId={SQUAT} />);
    const tile = await waitFor(() => need(container.querySelector('[data-visual="bild"]')));
    expect(tile.getAttribute('data-shape')).toBe('kreis');
    expect(tile.className).toContain('rounded-full');
  });

  it('onlyWithVisual: ohne Visual nichts, mit Visual die Demonstration', async () => {
    serve(media('image'));
    reducedMotion(false);
    const props = { name: 'X', muscles: ['abs'] as const, variant: 'large' as const };
    const { container, rerender } = render(
      <ExerciseDemo exerciseId={PLANK} {...props} onlyWithVisual />,
    );
    await waitFor(() => {
      expect(container.innerHTML).toBe('');
    });
    rerender(<ExerciseDemo exerciseId={SQUAT} {...props} onlyWithVisual />);
    expect(srcs(container)).toEqual(['/uebungen/medien/back_squat_barbell-bild.webp']);
  });

  it('mit onOpen ein Knopf mit Namen, kompakt das Vorschaubild', async () => {
    serve(media());
    const onOpen = vi.fn();
    const { container } = render(
      <ExerciseDemo
        exerciseId={SQUAT}
        name="Kniebeuge mit Langhantel"
        muscles={[]}
        variant="compact"
        onOpen={onOpen}
      />,
    );
    const button = screen.getByRole('button', {
      name: 'Kniebeuge mit Langhantel: Ausführung und Angaben',
    });
    await waitFor(() => {
      expect(srcs(container)).toEqual(['/uebungen/medien/back_squat_barbell-vorschau.webp']);
    });
    expect(container.querySelector('img')?.getAttribute('alt')).toBe('Bild zu back_squat_barbell');
    fireEvent.click(button);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
