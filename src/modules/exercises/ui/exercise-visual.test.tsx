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

  it('Animation als Video-Schleife: eine Datei, MP4 zuerst, Standbild als Poster und bei weniger Bewegung (D-403, D-497)', async () => {
    serve(media('loop'));
    reducedMotion(false);
    const props = { name: 'Kniebeuge', muscles: [] as const, variant: 'large' as const };
    const first = render(<ExerciseDemo exerciseId={SQUAT} {...props} />);
    const video = await waitFor(() => need(first.container.querySelector('video')));
    expect(video.getAttribute('src')).toBe('/uebungen/medien/back_squat_barbell.mp4');
    expect(video.querySelectorAll('source')).toHaveLength(0);
    expect(video.getAttribute('poster')).toBe('/uebungen/medien/back_squat_barbell-poster.webp');
    expect(video.muted).toBe(true);
    expect(video.hasAttribute('muted')).toBe(true);
    // Die App startet die Schleife selbst; `autoplay` startet Safari nur, wenn es das Video für
    // sichtbar hält (D-497). Auch außerhalb des Players wiederholt der Browser selbst (`loop`),
    // bis die gespielte Zeit für zwei Durchläufe reicht.
    expect(video.autoplay).toBe(false);
    await waitFor(() => {
      expect(video.loop).toBe(true);
    });
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

/**
 * Nachgestellte Wiedergabe: jsdom spielt keine Videos ab. `play` startet (oder lehnt ab wie iOS
 * ohne Geste im Stromsparmodus) und meldet danach `playing`, `pause` meldet `pause`; `paused`,
 * `currentTime` und `duration` (2,5 s wie die Schleifen) folgen dem.
 */
function fakeMedia(allow: () => boolean = () => true) {
  const playing = new WeakSet<HTMLMediaElement>();
  const time = new WeakMap<HTMLMediaElement, number>();
  const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    if (!allow()) return Promise.reject(new DOMException('Geste nötig', 'NotAllowedError'));
    if (!playing.has(this)) {
      playing.add(this);
      // Wie im Browser danach, nicht im Aufruf.
      queueMicrotask(() => {
        if (playing.has(this)) this.dispatchEvent(new Event('playing'));
      });
    }
    return Promise.resolve();
  });
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    if (!playing.has(this)) return;
    playing.delete(this);
    this.dispatchEvent(new Event('pause'));
  });
  vi.spyOn(HTMLMediaElement.prototype, 'paused', 'get').mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    return !playing.has(this);
  });
  vi.spyOn(HTMLMediaElement.prototype, 'duration', 'get').mockReturnValue(2.5);
  vi.spyOn(HTMLMediaElement.prototype, 'currentTime', 'get').mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    return time.get(this) ?? 0;
  });
  vi.spyOn(HTMLMediaElement.prototype, 'currentTime', 'set').mockImplementation(function (
    this: HTMLMediaElement,
    value: number,
  ) {
    time.set(this, value);
  });
  return {
    play,
    playing: (video: HTMLVideoElement) => playing.has(video),
    /** Die Wiedergabe erreicht `seconds`. */
    at(video: HTMLVideoElement, seconds: number) {
      time.set(video, seconds);
      fireEvent(video, new Event('timeupdate'));
    },
    /** Der Browser springt beim Wiederholen an den Anfang und meldet nur `seeking`. */
    seekToStart(video: HTMLVideoElement) {
      time.set(video, 0);
      fireEvent(video, new Event('seeking'));
    },
    /** Ende eines Durchlaufs: mit `loop` zurück an den Anfang, sonst Ende. */
    wrap(video: HTMLVideoElement) {
      this.at(video, 2.45);
      if (video.loop) {
        this.at(video, 0.02);
        return;
      }
      this.at(video, 2.5);
      playing.delete(video);
      fireEvent(video, new Event('pause'));
      fireEvent(video, new Event('ended'));
    },
  };
}

describe('Wiedergabe der Schleife (D-497)', () => {
  const props = { name: 'Kniebeuge', muscles: [] as const, variant: 'large' as const };

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('MP4 zuerst, wo der Browser H.264 kann; WebM nur ohne H.264', async () => {
    serve(media('loop'));
    reducedMotion(false);
    fakeMedia();
    const probe = vi.spyOn(HTMLMediaElement.prototype, 'canPlayType');
    probe.mockReturnValue('probably');
    const both = render(<ExerciseDemo exerciseId={SQUAT} {...props} />);
    const video = await waitFor(() => need(both.container.querySelector('video')));
    expect(video.getAttribute('src')).toBe('/uebungen/medien/back_squat_barbell.mp4');
    expect(probe).toHaveBeenCalledWith('video/mp4; codecs="avc1.64001E"');
    both.unmount();

    resetMediaCacheForTests();
    probe.mockImplementation((type: string) => (type.startsWith('video/webm') ? 'probably' : ''));
    const webmOnly = render(<ExerciseDemo exerciseId={SQUAT} {...props} />);
    const other = await waitFor(() => need(webmOnly.container.querySelector('video')));
    expect(other.getAttribute('src')).toBe('/uebungen/medien/back_squat_barbell.webm');
  });

  it('lädt die erste Fassung nicht, die andere; erst dann der Rückfall', async () => {
    serve(media('loop'));
    reducedMotion(false);
    fakeMedia();
    const { container } = render(<ExerciseDemo exerciseId={SQUAT} {...props} />);
    const video = await waitFor(() => need(container.querySelector('video')));
    fireEvent.error(video);
    expect(container.querySelector('video')?.getAttribute('src')).toBe(
      '/uebungen/medien/back_squat_barbell.webm',
    );
    fireEvent.error(need(container.querySelector('video')));
    expect(container.querySelector('video')).toBeNull();
    expect(container.querySelector('[data-demo="symbol"]')).not.toBeNull();
  });

  it('Player: startet von selbst, läuft ohne Ende, kein Knopf zum Wiederholen', async () => {
    serve(media('loop'));
    reducedMotion(false);
    const fake = fakeMedia();
    const { container } = render(
      <ExerciseDemo exerciseId={SQUAT} {...props} endless onOpen={() => undefined} />,
    );
    const video = await waitFor(() => need(container.querySelector('video')));
    // Der Effekt startet die Schleife nach dem Anlegen des Videos.
    await waitFor(() => {
      expect(fake.playing(video)).toBe(true);
    });
    expect(fake.play).toHaveBeenCalled();
    for (let run = 0; run < 4; run += 1) fake.wrap(video);
    expect(video.loop).toBe(true);
    expect(fake.playing(video)).toBe(true);
    expect(screen.queryByRole('button', { name: 'Animation wiederholen' })).toBeNull();
  });

  it('Übungsinfo und Details: zweimal, dann angehalten mit Symbol; Tippen spielt sie erneut zweimal ab', async () => {
    serve(media('loop'));
    reducedMotion(false);
    const fake = fakeMedia();
    const { container } = render(<ExerciseDemo exerciseId={SQUAT} {...props} />);
    const video = await waitFor(() => need(container.querySelector('video')));
    const replay = screen.getByRole('button', { name: 'Animation wiederholen' });
    await waitFor(() => {
      expect(fake.playing(video)).toBe(true);
    });
    expect(replay.hasAttribute('data-angehalten')).toBe(false);
    expect(replay.querySelector('svg')).toBeNull();

    // Der Browser wiederholt selbst (`loop`). Eine halbe Sekunde nach dem ersten Sprung an den
    // Anfang endet `loop` (im Sprung selbst blieb WebKit stehen): Der zweite Durchlauf läuft zu
    // Ende, dann steht das letzte Bild.
    expect(video.loop).toBe(true);
    fake.wrap(video);
    expect(video.loop).toBe(true);
    fake.at(video, 0.3);
    expect(video.loop).toBe(true);
    fake.at(video, 0.6);
    expect(video.loop).toBe(false);
    expect(fake.playing(video)).toBe(true);
    fake.wrap(video);
    expect(fake.playing(video)).toBe(false);
    await waitFor(() => {
      expect(replay.hasAttribute('data-angehalten')).toBe(true);
    });
    expect(replay.querySelector('svg')).not.toBeNull();
    // Angehalten bleibt angehalten, auch bei Gesten anderswo.
    const calls = fake.play.mock.calls.length;
    fireEvent.click(document.body);
    expect(fake.play.mock.calls.length).toBe(calls);

    fireEvent.click(replay);
    expect(fake.playing(video)).toBe(true);
    expect(video.currentTime).toBe(0);
    expect(video.loop).toBe(true);
    await waitFor(() => {
      expect(replay.hasAttribute('data-angehalten')).toBe(false);
    });
    fake.wrap(video);
    fake.at(video, 0.6);
    expect(video.loop).toBe(false);
    fake.wrap(video);
    await waitFor(() => {
      expect(replay.hasAttribute('data-angehalten')).toBe(true);
    });
  });

  it('zählt den Sprung an den Anfang auch ohne `timeupdate`; ein Ende mit `loop` hält sie nicht an; Tippen mitten im Durchlauf beginnt von vorn', async () => {
    serve(media('loop'));
    reducedMotion(false);
    const fake = fakeMedia();
    const { container } = render(<ExerciseDemo exerciseId={SQUAT} {...props} />);
    const video = await waitFor(() => need(container.querySelector('video')));
    const replay = screen.getByRole('button', { name: 'Animation wiederholen' });
    await waitFor(() => {
      expect(fake.playing(video)).toBe(true);
    });
    // Ein Ende, obwohl `loop` gilt (WebKit unter Linux): kein Durchlauf, sie läuft weiter.
    fireEvent(video, new Event('ended'));
    expect(fake.playing(video)).toBe(true);
    expect(video.loop).toBe(true);
    expect(replay.hasAttribute('data-angehalten')).toBe(false);
    // Kleine Sprünge zurück (Rauschen) zählen nicht.
    fake.at(video, 1.2);
    fake.at(video, 0.9);
    expect(video.loop).toBe(true);
    // Tippen mitten im ersten Durchlauf: angehalten an den Anfang, dann wieder zwei Durchläufe.
    fireEvent.click(replay);
    expect(video.currentTime).toBe(0);
    expect(fake.playing(video)).toBe(true);
    expect(video.loop).toBe(true);
    // Der Browser springt an den Anfang und meldet nur `seeking`: erster Durchlauf zu Ende.
    fake.at(video, 1.9);
    fake.seekToStart(video);
    expect(video.loop).toBe(true);
    fake.at(video, 0.6);
    expect(video.loop).toBe(false);
    fake.wrap(video);
    await waitFor(() => {
      expect(replay.hasAttribute('data-angehalten')).toBe(true);
    });
  });

  it('lehnt das System ab (Stromsparmodus), startet sie bei der nächsten Geste', async () => {
    serve(media('loop'));
    reducedMotion(false);
    let gesture = false;
    const fake = fakeMedia(() => gesture);
    const { container } = render(
      <ExerciseDemo exerciseId={SQUAT} {...props} endless onOpen={() => undefined} />,
    );
    const video = await waitFor(() => need(container.querySelector('video')));
    await waitFor(() => {
      expect(fake.play).toHaveBeenCalled();
    });
    expect(fake.playing(video)).toBe(false);
    gesture = true;
    fireEvent.pointerUp(document.body);
    expect(fake.playing(video)).toBe(true);
  });

  it('nur sichtbar: ausgeblendet startet sie nicht und hält an, sichtbar startet sie', async () => {
    serve(media('loop'));
    reducedMotion(false);
    const fake = fakeMedia();
    const observers: { callback: IntersectionObserverCallback; targets: Element[] }[] = [];
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        targets: Element[] = [];
        constructor(public callback: IntersectionObserverCallback) {
          observers.push(this);
        }
        observe(target: Element) {
          this.targets.push(target);
        }
        disconnect() {
          this.targets = [];
        }
      },
    );
    const show = (isIntersecting: boolean) => {
      for (const observer of observers) {
        observer.callback(
          observer.targets.map(
            (target) => ({ target, isIntersecting }) as unknown as IntersectionObserverEntry,
          ),
          observer as unknown as IntersectionObserver,
        );
      }
    };
    const { container } = render(
      <ExerciseDemo exerciseId={SQUAT} {...props} endless onOpen={() => undefined} />,
    );
    const video = await waitFor(() => need(container.querySelector('video')));
    await waitFor(() => {
      expect(observers.some((observer) => observer.targets.length > 0)).toBe(true);
    });
    expect(fake.play).not.toHaveBeenCalled();
    show(false);
    expect(fake.playing(video)).toBe(false);
    show(true);
    expect(fake.playing(video)).toBe(true);
    show(false);
    expect(fake.playing(video)).toBe(false);
  });
});

describe('Karte „Jetzt“ im schmalen Player (D-498)', () => {
  const props = { name: 'Kniebeuge', muscles: [] as const, variant: 'compact' as const };

  it('mit Schleife: läuft klein im Seitenverhältnis des Videos, Tippen öffnet die Übungsinfo', async () => {
    serve(media('loop'));
    reducedMotion(false);
    const fake = fakeMedia();
    const onOpen = vi.fn();
    const { container } = render(
      <ExerciseDemo exerciseId={SQUAT} {...props} endless onOpen={onOpen} />,
    );
    const video = await waitFor(() =>
      need(container.querySelector<HTMLVideoElement>('[data-demo-compact] video')),
    );
    expect(video.getAttribute('src')).toBe('/uebungen/medien/back_squat_barbell.mp4');
    await waitFor(() => {
      expect(fake.playing(video)).toBe(true);
    });
    expect(video.loop).toBe(true);
    const frame = need(container.querySelector<HTMLElement>('[data-demo-compact]'));
    expect(frame.style.aspectRatio).toBe('640 / 480');
    expect(frame.className).toContain('w-28');
    // Kein zweiter Knopf im Knopf: Tippen öffnet die Übungsinfo.
    expect(screen.queryByRole('button', { name: 'Animation wiederholen' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Kniebeuge: Ausführung und Angaben' }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('bei weniger Bewegung das Standbild im selben Rahmen, ohne Video', async () => {
    serve(media('loop'));
    reducedMotion(true);
    const { container } = render(<ExerciseDemo exerciseId={SQUAT} {...props} endless />);
    await waitFor(() => {
      expect(srcs(container)).toEqual(['/uebungen/medien/back_squat_barbell-poster.webp']);
    });
    expect(container.querySelector('[data-demo-compact]')).not.toBeNull();
    expect(container.querySelector('video')).toBeNull();
  });

  it('ohne Schleife wie bisher das Vorschaubild', async () => {
    serve(media('phases'));
    reducedMotion(false);
    const { container } = render(<ExerciseDemo exerciseId={SQUAT} {...props} />);
    await waitFor(() => {
      expect(srcs(container)).toEqual(['/uebungen/medien/back_squat_barbell-vorschau.webp']);
    });
    expect(container.querySelector('[data-demo-compact]')).toBeNull();
  });

  it('Vorschaubild neben „Danach:“ 32 px, stumm', async () => {
    serve(media('loop'));
    const { container } = render(<ExerciseThumb exerciseId={GOBLET} size="mini" />);
    const tile = await waitFor(() => need(container.querySelector('[data-visual="bild"]')));
    expect(tile.className).toContain('size-8');
    expect(tile.querySelector('img')?.getAttribute('alt')).toBe('');
    expect(tile.querySelector('img')?.getAttribute('src')).toBe(
      '/uebungen/medien/goblet_squat-vorschau.webp',
    );
  });
});
