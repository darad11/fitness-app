import { useEffect, useRef, useState } from 'react';
import { tMore } from '@/shared/i18n/de-more';
import { currentPlatform } from '@/shared/lib/platform';
import {
  deviceRows,
  type DeviceSnapshot,
  type StartLog,
  type StartPlacement,
} from '../calc/deviceData';
import { useFormatters } from '../service/formatting';

/** Rechnung der Startfläche aus `public/startflaeche.js` (D-393, D-394), dieselbe wie beim Start. */
type StartLage = (messung: {
  fenster: { b: number; h: number };
  bildschirm: { b: number; h: number } | null;
  ausrichtung: 'hoch' | 'quer' | null;
}) => StartPlacement;

type StartWindow = Window & { __formStartLage?: StartLage; __formStartMessung?: StartLog };

/** Ausrichtung aus `screen.orientation`, wie beim Start; ohne sie keine (dann zählt nur das Fenster). */
function alignment(snapshot: Omit<DeviceSnapshot, 'start'>): 'hoch' | 'quer' | null {
  if (!snapshot.orientation) return null;
  return snapshot.orientation.type.startsWith('landscape') ? 'quer' : 'hoch';
}

/** Lage der Startfläche für die Werte jetzt; ohne das Skript `null`. */
function startPlacement(snapshot: Omit<DeviceSnapshot, 'start'>): StartPlacement | null {
  const startLage = (window as StartWindow).__formStartLage;
  if (typeof startLage !== 'function') return null;
  return startLage({
    fenster: { b: snapshot.layout.width, h: snapshot.layout.height },
    bildschirm: snapshot.screen ? { b: snapshot.screen.width, h: snapshot.screen.height } : null,
    ausrichtung: alignment(snapshot),
  });
}

/** Liest die Werte jetzt; die sicheren Bereiche aus dem Innenabstand des Messelements. */
function read(probe: HTMLElement | null): DeviceSnapshot {
  const viewport = window.visualViewport;
  const style = probe ? getComputedStyle(probe) : null;
  const px = (value: string | undefined) => parseFloat(value ?? '') || 0;
  const display = typeof screen === 'undefined' ? undefined : screen;
  const orientation = display?.orientation;
  const snapshot: Omit<DeviceSnapshot, 'start'> = {
    inner: { width: window.innerWidth, height: window.innerHeight },
    layout: {
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight,
    },
    screen: display
      ? {
          width: display.width,
          height: display.height,
          availWidth: display.availWidth,
          availHeight: display.availHeight,
        }
      : null,
    outer: { width: window.outerWidth, height: window.outerHeight },
    position: { x: window.screenX, y: window.screenY },
    viewport: viewport
      ? {
          width: viewport.width,
          height: viewport.height,
          offsetTop: viewport.offsetTop,
          pageTop: viewport.pageTop,
        }
      : null,
    safeArea: {
      top: px(style?.paddingTop),
      right: px(style?.paddingRight),
      bottom: px(style?.paddingBottom),
      left: px(style?.paddingLeft),
    },
    orientation: orientation ? { type: orientation.type, angle: orientation.angle } : null,
    pixelRatio: window.devicePixelRatio,
    standalone: currentPlatform().isStandalone,
    startLog: (window as StartWindow).__formStartMessung ?? null,
  };
  return { ...snapshot, start: startPlacement(snapshot) };
}

/**
 * Gerätedaten (D-388): Fenster, Layout, Bildschirm (`screen.*`, `outerWidth`, `screenX`; D-393),
 * `visualViewport`, sichere Bereiche, `screen.orientation`, `devicePixelRatio`, Anzeigemodus und
 * die Lage der Startfläche, wie `public/startflaeche.js` sie für diese Werte rechnet (`screenX`
 * und `screenY` zählen dort nicht, sie stehen nur zum Nachsehen da). Dazu das Protokoll des
 * Starts (D-394): die zuerst gemeldeten Maße, ihre Änderungen und wann das Logo erschien. Die
 * Werte folgen jeder Änderung (Drehen, Auf- und Zuklappen, Tastatur); nichts davon wird
 * gespeichert oder übertragen. Wird erst beim Aufklappen nachgeladen.
 */
export function DeviceData() {
  const fmt = useFormatters();
  const probe = useRef<HTMLSpanElement>(null);
  const [snapshot, setSnapshot] = useState<DeviceSnapshot | null>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setSnapshot(read(probe.current));
      });
    };
    update();
    const viewport = window.visualViewport;
    const orientation = typeof screen === 'undefined' ? undefined : screen.orientation;
    const display =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(display-mode: standalone)')
        : undefined;
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    viewport?.addEventListener('resize', update);
    viewport?.addEventListener('scroll', update);
    orientation?.addEventListener('change', update);
    display?.addEventListener('change', update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      viewport?.removeEventListener('resize', update);
      viewport?.removeEventListener('scroll', update);
      orientation?.removeEventListener('change', update);
      display?.removeEventListener('change', update);
    };
  }, []);

  const num = (value: number) =>
    fmt.number(value, { maximumFractionDigits: 2, useGrouping: false });
  const rows = snapshot ? deviceRows(snapshot, tMore.about.device, num) : [];
  return (
    <div className="mt-3">
      <p className="text-sm text-muted">{tMore.about.deviceHint}</p>
      {/* Misst die sicheren Bereiche: Innenabstand aus `env(safe-area-inset-*)`. */}
      <span
        ref={probe}
        aria-hidden="true"
        className="pointer-events-none invisible absolute size-0 pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]"
      />
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
