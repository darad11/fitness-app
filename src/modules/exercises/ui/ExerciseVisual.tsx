import { useEffect, useState, type ReactNode } from 'react';
import { t } from '@/shared/i18n/de';
import { tExerciseMedia } from '@/shared/i18n/de-exercise-media';
import { cn } from '@/shared/lib/cn';
import { tagClasses } from '@/shared/ui';
import {
  demoFiles,
  isVideo,
  loopFile,
  mediaUrl,
  preloadVisual,
  useVisualIndex,
  type VisualEntry,
} from '../data/media';
import type { Muscle } from '../model/exercise';
import type { ExerciseVisual as Visual, MediaFile } from '../model/media';
import { SymbolTile, type TileLook } from './SymbolTile';
import './exercise-media.css';

/**
 * Visuals einer Übung (Phase Übungen, D-397). Zugeordnet über die Übungs-ID (bei Basisübungen aus
 * dem dauerhaften Schlüssel), nie über den Namen. Fehlt ein Visual, lädt es nicht oder lädt die
 * Liste noch, steht das bisherige Symbol der App in der Kachel (Hantel, wie „Training“), nie ein
 * leerer Kasten und nie etwas, das wie eine Demonstration aussieht.
 */

function useReducedMotion(): boolean {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(
    () => typeof window.matchMedia === 'function' && window.matchMedia(query).matches,
  );
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const list = window.matchMedia(query);
    const change = () => {
      setReduced(list.matches);
    };
    list.addEventListener('change', change);
    return () => {
      list.removeEventListener('change', change);
    };
  }, []);
  return reduced;
}

/**
 * Ohne Netz nur Dateien anfragen, die der Service Worker schon gespeichert hat (D-403): Sonst
 * scheitert die Anfrage, und kurz stünde ein kaputtes Bild da. Gibt `true` zurück, solange offline
 * nicht feststeht, dass alle Dateien im Speicher liegen; dann zeigt die Kachel gleich das Symbol.
 */
function useMissingOffline(files: readonly MediaFile[]): boolean {
  const offline = typeof navigator !== 'undefined' && !navigator.onLine;
  const key = files.map((file) => file.src).join(' ');
  const [checked, setChecked] = useState<{ key: string; missing: boolean } | null>(null);
  useEffect(() => {
    if (!offline || key === '') return undefined;
    let alive = true;
    const urls = key.split(' ').map((src) => mediaUrl({ src, width: 1, height: 1 }));
    const check =
      typeof caches === 'undefined'
        ? Promise.resolve(false)
        : Promise.all(urls.map((url) => caches.match(url))).then((hits) => hits.every(Boolean));
    void check
      .catch(() => false)
      .then((all) => {
        if (alive) setChecked({ key, missing: !all });
      });
    return () => {
      alive = false;
    };
  }, [offline, key]);
  if (!offline) return false;
  return checked?.key !== key || checked.missing;
}

/** Dateien, die eine Ansicht sofort braucht. */
function neededFiles(
  visual: Visual | undefined,
  variant: 'large' | 'compact' | 'thumb',
): MediaFile[] {
  if (!visual) return [];
  if (variant !== 'large') return [visual.preview];
  const demo = visual.demo;
  if (demo?.kind === 'animation')
    return isVideo(demo.file) ? [demo.still, loopFile(demo)] : [demo.still, demo.file];
  return demoFiles(visual);
}

function Img({
  file,
  alt,
  className,
  eager,
  onError,
}: {
  file: MediaFile;
  alt: string;
  className?: string;
  eager?: boolean;
  onError: () => void;
}) {
  return (
    <img
      src={mediaUrl(file)}
      width={file.width}
      height={file.height}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={className}
      onError={onError}
    />
  );
}

/**
 * Vorschaubild links neben dem Namen in Übungslisten (Leitlinien Kapitel 2). Der Name steht
 * daneben, das Bild ist deshalb für Screenreader stumm (`alt=""`).
 */
export function ExerciseThumb({
  exerciseId,
  className,
  ...look
}: TileLook & {
  exerciseId: string;
  className?: string;
}) {
  const index = useVisualIndex();
  const entry = index?.get(exerciseId);
  return <Thumb key={exerciseId} entry={entry} className={className} {...look} />;
}

function Thumb({
  entry,
  className,
  size = 'list',
}: TileLook & { entry: VisualEntry | undefined; className?: string }) {
  const [failed, setFailed] = useState(false);
  const missing = useMissingOffline(neededFiles(entry?.visual, 'thumb'));
  if (!entry || failed || missing) return <SymbolTile className={className} size={size} />;
  // Bilder liegen auf der Fläche `card` mit Rand (Leitlinien, Vorbemerkung); als Kreis (Fotos auf
  // weißem Grund, Plan C) füllt das Bild den Kreis (D-403).
  const circle = entry.visual.previewShape === 'circle';
  return (
    <span
      data-visual="bild"
      data-shape={circle ? 'kreis' : 'quadrat'}
      className={cn(
        'block shrink-0 overflow-hidden bg-surface shadow-[inset_0_0_0_1px_var(--border)]',
        circle ? 'rounded-full' : 'rounded-tile',
        size === 'small' ? 'size-tile' : 'size-thumb',
        className,
      )}
    >
      <Img
        file={entry.visual.preview}
        alt=""
        className={circle ? 'size-full object-cover' : 'size-full object-contain'}
        onError={() => {
          setFailed(true);
        }}
      />
    </span>
  );
}

export interface ExerciseDemoProps {
  exerciseId: string;
  name: string;
  /** Hauptmuskeln für den Rückfall ohne Visual (Etiketten neben dem Symbol). */
  muscles: readonly Muscle[];
  /** `large`: Player aufgeklappt, Übungsdetails, Übungsinfo; `compact`: Karte „Jetzt“ schmal. */
  variant: 'large' | 'compact';
  /** Antippen öffnet die Übungsinfo (Player). Ohne: nur Anzeige. */
  onOpen?: () => void;
  /** Ohne Visual nichts zeigen, wo Muskeln und Gerät ohnehin daneben stehen (Übungsinfo). */
  onlyWithVisual?: boolean;
  className?: string;
}

/**
 * Demonstration der aktuellen Übung (Leitlinien Kapitel 3). Je Übungs-ID neu aufgebaut: Beim
 * Wechsel steht nie kurz das Bild der vorigen Übung da.
 */
export function ExerciseDemo(props: ExerciseDemoProps) {
  const index = useVisualIndex();
  const entry = index?.get(props.exerciseId);
  return <Demo key={props.exerciseId} {...props} entry={entry} />;
}

function Demo({
  name,
  muscles,
  variant,
  onOpen,
  onlyWithVisual,
  className,
  entry,
}: ExerciseDemoProps & { entry: VisualEntry | undefined }) {
  const [failed, setFailed] = useState(false);
  const fail = () => {
    setFailed(true);
  };
  const missing = useMissingOffline(neededFiles(entry?.visual, variant));
  const visual = entry && !failed && !missing ? entry.visual : undefined;
  if (!visual && onlyWithVisual) return null;

  let body: ReactNode;
  if (!visual) {
    // Rückfall: das bisherige Symbol in der Kachel, groß mit den Muskel-Etiketten daneben.
    body =
      variant === 'compact' ? (
        <SymbolTile />
      ) : (
        <span className="flex items-center gap-3">
          <SymbolTile />
          {muscles.length > 0 ? (
            // Wie `MuscleTags`: eine Zeile für Screenreader, die Etiketten selbst nur Bild.
            <span className="sr-only">{`${t.session.info.primary}: ${muscles
              .map((muscle) => t.exercises.muscles[muscle])
              .join(', ')}`}</span>
          ) : null}
          <span aria-hidden="true" className="flex min-w-0 flex-wrap gap-1.5">
            {muscles.map((muscle) => (
              <span key={muscle} className={tagClasses()}>
                {t.exercises.muscles[muscle]}
              </span>
            ))}
          </span>
        </span>
      );
  } else if (variant === 'compact') {
    body = (
      <span className="block size-thumb shrink-0 overflow-hidden rounded-tile bg-surface shadow-[inset_0_0_0_1px_var(--border)]">
        <Img
          file={visual.preview}
          alt={visual.alt}
          eager
          className="size-full object-contain"
          onError={fail}
        />
      </span>
    );
  } else {
    body = <LargeDemo visual={visual} name={name} onError={fail} />;
  }

  const data = visual ? 'bild' : 'symbol';
  if (onOpen) {
    return (
      <button
        type="button"
        data-demo={data}
        aria-label={tExerciseMedia.openInfo(name)}
        className={cn(
          'block rounded-card text-left focus-visible:outline-2 focus-visible:outline-offset-2',
          className,
        )}
        onClick={onOpen}
      >
        {body}
      </button>
    );
  }
  return (
    <div data-demo={data} className={className}>
      {body}
    </div>
  );
}

function LoopVideo({
  demo,
  alt,
  className,
  onError,
}: {
  demo: { file: MediaFile; webm?: MediaFile; still: MediaFile };
  alt: string;
  className: string;
  onError: () => void;
}) {
  return (
    <video
      className={className}
      poster={mediaUrl(demo.still)}
      width={demo.file.width}
      height={demo.file.height}
      muted
      loop
      playsInline
      autoPlay
      preload="auto"
      disablePictureInPicture
      aria-label={alt}
      onError={onError}
    >
      {demo.webm ? <source src={mediaUrl(demo.webm)} type="video/webm" /> : null}
      {/* Fehlt auch die letzte Quelle, meldet erst sie den Fehler. */}
      <source src={mediaUrl(demo.file)} type="video/mp4" onError={onError} />
    </video>
  );
}

function LargeDemo({
  visual,
  name,
  onError,
}: {
  visual: Visual;
  name: string;
  onError: () => void;
}) {
  const reduced = useReducedMotion();
  // Bei Bedarf zwischenspeichern (D-403): Was einmal gezeigt wurde, läuft danach auch offline.
  useEffect(() => {
    preloadVisual(visual);
  }, [visual]);
  const demo = visual.demo ?? { kind: 'image' as const, file: visual.preview };
  const frame =
    'relative block aspect-[4/3] max-h-[40dvh] w-full overflow-hidden rounded-tile bg-surface shadow-[inset_0_0_0_1px_var(--border)]';
  const media = 'absolute inset-0 size-full object-contain';
  switch (demo.kind) {
    case 'animation':
      // Animation nur ohne Wunsch nach weniger Bewegung, sonst das Standbild (Kapitel 9, D-403).
      if (reduced) {
        return (
          <span className={frame}>
            <Img file={demo.still} alt={visual.alt} eager className={media} onError={onError} />
          </span>
        );
      }
      if (isVideo(demo.file)) {
        // Stumme Schleife ohne Bedienelemente; das Standbild steht, bis das Video läuft.
        return (
          <span className={frame}>
            <LoopVideo demo={demo} alt={visual.alt} className={media} onError={onError} />
          </span>
        );
      }
      return (
        <span className={frame}>
          <Img file={demo.file} alt={visual.alt} eager className={media} onError={onError} />
        </span>
      );
    case 'video':
      // Stumm, ohne Ton und ohne Vollbild; bei weniger Bewegung erst auf Wunsch.
      return (
        <span className={frame}>
          <video
            className={media}
            src={mediaUrl(demo.file)}
            poster={mediaUrl(demo.poster)}
            width={demo.file.width}
            height={demo.file.height}
            muted
            loop
            playsInline
            autoPlay={!reduced}
            controls={reduced}
            preload="metadata"
            aria-label={visual.alt}
            onError={onError}
          />
        </span>
      );
    case 'phases':
      // Zwei Phasen im Wechsel; bei weniger Bewegung nebeneinander mit Beschriftung.
      return reduced ? (
        <span className="grid grid-cols-2 gap-2" role="group" aria-label={visual.alt}>
          {[
            { file: demo.start, label: tExerciseMedia.phaseStart },
            { file: demo.end, label: tExerciseMedia.phaseEnd },
          ].map(({ file, label }) => (
            <span key={label} className="grid gap-1">
              <span className={frame}>
                <Img
                  file={file}
                  alt={`${name}: ${label}`}
                  eager
                  className={media}
                  onError={onError}
                />
              </span>
              <span className="text-caption text-muted">{label}</span>
            </span>
          ))}
        </span>
      ) : (
        <span className={cn(frame, 'demo-phases')}>
          <Img
            file={demo.start}
            alt={tExerciseMedia.phasesAlt(visual.alt)}
            eager
            className={media}
            onError={onError}
          />
          <Img
            file={demo.end}
            alt=""
            eager
            className={cn(media, 'demo-phase-end')}
            onError={onError}
          />
        </span>
      );
    case 'image':
      return (
        <span className={frame}>
          <Img file={demo.file} alt={visual.alt} eager className={media} onError={onError} />
        </span>
      );
  }
}
