import { useEffect, useState } from 'react';
import { logWarning } from '@/shared/db';
import {
  exerciseGuidesSchema,
  parseExerciseMedia,
  type ExerciseGuide,
  type ExerciseGuides,
  type ExerciseMedia,
  type ExerciseVisual,
  type MediaFile,
  type MediaSource,
  type SkippedMediaEntry,
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
/** Speicher des Service Workers für die Bilddateien (`vite.config.ts`, `runtimeCaching`). */
export const MEDIA_CACHE = 'uebungen-medien';

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
  const { media, skipped } = parseExerciseMedia(await response.json());
  reportSkipped(skipped);
  return media;
}

/**
 * Meldet übersprungene Einträge (D-488) als Warnung in der Konsole des Browsers und im
 * Fehlerprotokoll der App; beides bleibt auf dem Gerät, nichts geht nach außen. Die Übung zeigt
 * dann ihr Symbol statt des Bilds, alle anderen bleiben. Der Schlüssel steht ohne
 * Anführungszeichen in der Meldung, weil das Protokoll Text in Anführungszeichen entfernt.
 */
function reportSkipped(skipped: readonly SkippedMediaEntry[]): void {
  for (const entry of skipped) {
    const what = entry.part === 'visuals' ? 'Eintrag' : 'Quelle';
    const message = `Übungsbilder: ${what} ${entry.key} übersprungen (${entry.reason})`;
    console.warn(message);
    void logWarning('uebungsbilder', message);
  }
}

/** Visuals nach Übungs-ID. Fehlt die Liste oder stimmt ihr Rahmen nicht, gibt es keine (Rückfall);
 *  ein einzelner ungültiger Eintrag fällt allein heraus (D-488). */
export function loadVisualIndex(): Promise<VisualIndex> {
  visualsPending ??= Promise.all([fetchMedia(), loadCoreExercises()])
    .then(([media, core]) => {
      // Aufräumen ist Nebensache: Ein Fehler dabei ändert nichts an der Anzeige.
      pruneMediaCache(media).catch(() => undefined);
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
 * Formate der Schleifen, wie `tools/uebungen-3d/render.py` (`kodiere`) sie schreibt: H.264 High
 * Profile Level 3.0 und VP9 ohne Alphakanal (D-497). Mit dem Codec antwortet der Browser genau.
 */
const LOOP_TYPES = {
  mp4: 'video/mp4; codecs="avc1.64001E"',
  webm: 'video/webm; codecs="vp9"',
} as const;

let playable: { mp4: boolean; webm: boolean } | undefined;

function playableFormats(): { mp4: boolean; webm: boolean } {
  if (playable) return playable;
  if (typeof document === 'undefined') return { mp4: true, webm: false };
  const probe = document.createElement('video');
  const can = (type: string) =>
    typeof probe.canPlayType === 'function' && probe.canPlayType(type) !== '';
  playable = { mp4: can(LOOP_TYPES.mp4), webm: can(LOOP_TYPES.webm) };
  return playable;
}

/**
 * Dateien einer Schleife in der Reihenfolge, in der die App sie versucht (D-497): MP4 (H.264)
 * zuerst, das spielt jedes iPhone in Hardware; WebM (VP9) nur, wo H.264 fehlt. Vorher stand WebM
 * vorn, Safari bekam so VP9 statt H.264.
 */
export function loopFiles(demo: { file: MediaFile; webm?: MediaFile }): MediaFile[] {
  if (!demo.webm) return [demo.file];
  const can = playableFormats();
  return can.mp4 || !can.webm ? [demo.file, demo.webm] : [demo.webm, demo.file];
}

/** Die Datei der Schleife, die zuerst läuft: Genau sie liegt nach dem Vorladen im Speicher. */
export function loopFile(demo: { file: MediaFile; webm?: MediaFile }): MediaFile {
  return loopFiles(demo)[0] ?? demo.file;
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

/** Alle Dateien eines Visuals: Vorschau und jede Datei der Demonstration. */
function visualFiles(visual: ExerciseVisual): MediaFile[] {
  const demo = visual.demo;
  if (!demo) return [visual.preview];
  switch (demo.kind) {
    case 'animation':
      return [visual.preview, demo.file, ...(demo.webm ? [demo.webm] : []), demo.still];
    case 'video':
      return [visual.preview, demo.file, demo.poster];
    case 'phases':
      return [visual.preview, demo.start, demo.end];
    case 'image':
      return [visual.preview, demo.file];
  }
}

/**
 * Räumt den Speicher der Bilddateien auf (D-494). Jede Datei trägt die Prüfsumme ihres Inhalts im
 * Namen; eine neu gerenderte Schleife hat also eine neue Adresse, und die alte Datei braucht die
 * App nie wieder. Gelöscht wird nur, was die aktuelle Liste nicht mehr nennt; alles, was sie
 * nennt, bleibt für unterwegs gespeichert (D-403). Ohne den Speicher des Service Workers
 * (Entwicklung, Tests, Browser ohne Cache API) geschieht nichts. Gibt die Zahl der gelöschten
 * Dateien zurück.
 */
export async function pruneMediaCache(media: ExerciseMedia): Promise<number> {
  if (typeof caches === 'undefined' || !(await caches.has(MEDIA_CACHE))) return 0;
  const current = new Set(Object.values(media.visuals).flatMap(visualFiles).map(mediaUrl));
  const cache = await caches.open(MEDIA_CACHE);
  let removed = 0;
  for (const request of await cache.keys()) {
    if (current.has(new URL(request.url).pathname)) continue;
    if (await cache.delete(request)) removed += 1;
  }
  return removed;
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
  playable = undefined;
  preloaded.clear();
}
