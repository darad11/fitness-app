import { useEffect, useState } from 'react';
import {
  exerciseGuidesSchema,
  exerciseMediaSchema,
  type ExerciseGuide,
  type ExerciseGuides,
  type ExerciseMedia,
  type ExerciseVisual,
  type MediaFile,
  type MediaSource,
} from '../model/media';
import { loadCoreExercises } from './coreLibrary';

/**
 * Visuals und Ausführungstexte der Basisübungen (D-397, D-398). Beides wird erst bei Bedarf
 * geladen und liegt nie in der Startansicht. Zugeordnet wird über die ID der Basisübung, die aus
 * ihrem dauerhaften Schlüssel entsteht (D-240); eigene Übungen haben nichts davon.
 */

/** Liste der Visuals; liegt in `public/`, damit Phase 2 Dateien ergänzen kann, ohne den Code. */
export const MEDIA_URL = '/uebungen/medien.json';
/** Ordner der Bilddateien, `src` im Manifest ist relativ dazu. */
const MEDIA_BASE = '/uebungen/';

export interface VisualEntry {
  visual: ExerciseVisual;
  source: MediaSource;
}

export type VisualIndex = ReadonlyMap<string, VisualEntry>;

const EMPTY: VisualIndex = new Map();
let visualsPending: Promise<VisualIndex> | undefined;
let visualsLoaded: VisualIndex | undefined;

async function fetchMedia(): Promise<ExerciseMedia> {
  const response = await fetch(MEDIA_URL, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Visuals nicht geladen: ${String(response.status)}`);
  return exerciseMediaSchema.parse(await response.json());
}

/** Visuals nach Übungs-ID. Fehlt die Liste oder ist sie ungültig, gibt es keine (Rückfall). */
export function loadVisualIndex(): Promise<VisualIndex> {
  visualsPending ??= Promise.all([fetchMedia(), loadCoreExercises()])
    .then(([media, core]) => {
      const index = new Map<string, VisualEntry>();
      for (const exercise of core) {
        const visual = media.visuals[exercise.key];
        const source = visual ? media.sources[visual.source] : undefined;
        if (visual && source) index.set(exercise.id, { visual, source });
      }
      return index;
    })
    .catch(() => {
      // Ohne Netz und ohne gespeicherte Liste: Symbol statt Bild, beim nächsten Aufruf erneut.
      visualsPending = undefined;
      return EMPTY;
    })
    .then((index) => {
      visualsLoaded = index;
      return index;
    });
  return visualsPending;
}

/** Visuals aller Übungen; `undefined`, solange sie laden. */
export function useVisualIndex(): VisualIndex | undefined {
  const [index, setIndex] = useState<VisualIndex | undefined>(visualsLoaded);
  useEffect(() => {
    if (index) return undefined;
    let active = true;
    void loadVisualIndex().then((loaded) => {
      if (active) setIndex(loaded);
    });
    return () => {
      active = false;
    };
  }, [index]);
  return index;
}

/** Adresse einer Bilddatei aus dem Manifest. */
export function mediaUrl(file: MediaFile): string {
  return `${MEDIA_BASE}${file.src}`;
}

/** Ist die Datei ein Video (MP4, WebM) und kein Bild? */
export function isVideo(file: MediaFile): boolean {
  return /\.(?:mp4|webm)$/.test(file.src);
}

/**
 * Die Datei der Schleife, die der Browser abspielen wird: dieselbe Wahl wie `<video>` mit WebM
 * zuerst, dann MP4. So liegt beim Vorladen genau die Datei im Speicher, die später läuft.
 */
export function loopFile(demo: { file: MediaFile; webm?: MediaFile }): MediaFile {
  if (demo.webm && typeof document !== 'undefined') {
    const probe = document.createElement('video');
    if (
      typeof probe.canPlayType === 'function' &&
      probe.canPlayType('video/webm; codecs="vp9"') !== ''
    ) {
      return demo.webm;
    }
  }
  return demo.file;
}

/** Dateien, die die Demonstration zuerst braucht (für das Vorausladen im Player). */
export function demoFiles(visual: ExerciseVisual): MediaFile[] {
  const demo = visual.demo;
  if (!demo) return [visual.preview];
  switch (demo.kind) {
    case 'animation':
      return [demo.still, loopFile(demo)];
    case 'video':
      return [demo.poster];
    case 'phases':
      return [demo.start, demo.end];
    case 'image':
      return [demo.file];
  }
}

const preloaded = new Set<string>();

/**
 * Lädt die Demonstration einer Übung im Hintergrund vor (aktuelle und nächste Übung im Player,
 * Leitlinien Kapitel 8; Übungsdetails bei Bedarf). Bilder über `Image`, Videos ganz über `fetch`:
 * Der Service Worker speichert die vollständige Antwort und bedient daraus später auch die
 * Teilanfragen von Safari (D-403). Was so geladen wurde, läuft auch offline.
 */
export function preloadVisual(visual: ExerciseVisual): void {
  if (typeof Image !== 'function') return;
  for (const file of demoFiles(visual)) {
    const url = mediaUrl(file);
    if (preloaded.has(url)) continue;
    preloaded.add(url);
    if (isVideo(file)) {
      if (typeof fetch === 'function') void fetch(url).catch(() => preloaded.delete(url));
      continue;
    }
    const image = new Image();
    image.decoding = 'async';
    image.src = url;
  }
}

// ---------------------------------------------------------------------------------------------
// Ausführungstexte

let guidesPending: Promise<ExerciseGuides> | undefined;

/** Alle Ausführungstexte (eigene Datei, nachgeladen und vom Service Worker vorab gespeichert). */
export function loadGuides(): Promise<ExerciseGuides> {
  guidesPending ??= import('./exercise-guides.v1.json').then(
    (module) => exerciseGuidesSchema.parse(module.default),
    (error: unknown) => {
      guidesPending = undefined;
      throw error;
    },
  );
  return guidesPending;
}

export type GuideState =
  | { status: 'loading' }
  | { status: 'ready'; guide: ExerciseGuide | null; checked: string }
  | { status: 'failed' };

/** Ausführung einer Basisübung über ihren Schlüssel; `null` heißt: kein belegter Text. */
export function useGuide(key: string | undefined): GuideState {
  const [state, setState] = useState<{ key: string | undefined; value: GuideState }>({
    key,
    value: { status: 'loading' },
  });
  useEffect(() => {
    if (!key) return undefined;
    let active = true;
    loadGuides().then(
      (guides) => {
        if (active) {
          setState({
            key,
            value: { status: 'ready', guide: guides.guides[key] ?? null, checked: guides.checked },
          });
        }
      },
      () => {
        if (active) setState({ key, value: { status: 'failed' } });
      },
    );
    return () => {
      active = false;
    };
  }, [key]);
  if (!key) return { status: 'ready', guide: null, checked: '' };
  // Nie den Text einer anderen Übung zeigen, solange der neue lädt.
  return state.key === key ? state.value : { status: 'loading' };
}

/** Nur für Tests: zwischengespeicherte Ladevorgänge vergessen. */
export function resetMediaCacheForTests(): void {
  visualsPending = undefined;
  visualsLoaded = undefined;
  guidesPending = undefined;
  preloaded.clear();
}
