import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface StatTileProps {
  label: string;
  value: string;
  /** Einheit oder Zusatz hinter der Zahl, z. B. „kg“ oder „Sätze“. */
  unit?: string;
  hint?: string;
  /** `surface`: eigene Karte; `soft`: Kachel card-2 auf einer Karte oder Bühne; `plain`: ohne Fläche. */
  tone?: 'surface' | 'soft' | 'plain';
  className?: string;
}

/** Kennzahl mit Label (D-314): Label 13 px in Versalien, Wert 28/600; nur mit gespeicherten Daten (AK-DSH-07). */
export function StatTile({ label, value, unit, hint, tone = 'surface', className }: StatTileProps) {
  return (
    <div
      className={cn(
        'min-w-0',
        tone === 'surface' && 'rounded-card bg-surface p-card shadow-card',
        tone === 'soft' && 'rounded-card bg-surface-2 p-card',
        className,
      )}
    >
      <dt className="eyebrow text-muted">{label}</dt>
      {/* Der Hinweis steht im `dd`: In einer Gruppe von `dl` sind nur `dt` und `dd` erlaubt (axe). */}
      <dd className="mt-1">
        <span className="flex items-baseline gap-1">
          <span className="text-2xl font-semibold tabular-nums">{value}</span>
          {unit ? <span className="text-sm font-medium text-muted">{` ${unit}`}</span> : null}
        </span>
        {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
      </dd>
    </div>
  );
}

export interface MeterProps {
  /** 0 bis 1. */
  value: number;
  /** Name für Screenreader; `null`, wenn der Wert daneben schon als Text steht (rein grafisch). */
  label: string | null;
  className?: string;
  /** Farbe der Füllung, Standard Lime; z. B. `var(--macro-carbs)` für einen Makro-Balken. */
  color?: string;
}

/** Balken der Marke FORM (D-314): 6 px hoch, rund, Spur card-2 (`--meter-track`), Füllung Lime. */
export function Meter({ value, label, className, color }: MeterProps) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      {...(label === null
        ? { 'aria-hidden': true }
        : {
            role: 'progressbar',
            'aria-label': label,
            'aria-valuemin': 0,
            'aria-valuemax': 100,
            'aria-valuenow': percent,
          })}
      className={cn('h-1.5 w-full overflow-hidden rounded-pill bg-meter-track', className)}
    >
      <div
        className={cn('h-full rounded-pill transition-[width] duration-240', !color && 'bg-accent')}
        style={{ width: `${String(percent)}%`, ...(color ? { background: color } : {}) }}
      />
    </div>
  );
}

export interface ProgressRingProps {
  /** 0 bis 1; über 1 bleibt der Ring voll. */
  value: number;
  /** Name für Screenreader; `null`, wenn ein umgebendes Element den Wert schon nennt. */
  label: string | null;
  /** Durchmesser in rem; der Ring wächst nicht mit der Breite (D-313). */
  size?: number;
  /** Strichbreite in px, Standard 10 (FORM). */
  stroke?: number;
  children?: ReactNode;
  className?: string;
}

/**
 * Ring der Marke FORM (D-314): SVG, Strich 10 px, Fortschritt Lime auf Spur card-2, runde Enden;
 * in der Mitte Zahl 28/600 und Einheit 12 (als `children`).
 */
export function ProgressRing({
  value,
  label,
  size = 6,
  stroke = 10,
  children,
  className,
}: ProgressRingProps) {
  const clamped = Math.min(1, Math.max(0, value));
  // Rechnen in einem festen Koordinatensystem (100 Einheiten), dargestellt in `size` rem.
  const box = 100;
  const px = size * 16;
  const strokeUnits = (stroke / px) * box;
  const radius = (box - strokeUnits) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.round(clamped * 100);
  return (
    <div
      {...(label === null
        ? { 'aria-hidden': true }
        : {
            role: 'progressbar',
            'aria-label': label,
            'aria-valuemin': 0,
            'aria-valuemax': 100,
            'aria-valuenow': percent,
          })}
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: `${String(size)}rem`, height: `${String(size)}rem` }}
    >
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${String(box)} ${String(box)}`}
        className="absolute inset-0 size-full -rotate-90"
      >
        <circle
          cx={box / 2}
          cy={box / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeUnits}
          className="stroke-meter-track"
        />
        {clamped > 0 ? (
          <circle
            cx={box / 2}
            cy={box / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeUnits}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - clamped)}
            className="stroke-accent transition-[stroke-dashoffset] duration-240"
          />
        ) : null}
      </svg>
      {children ? (
        <div className="relative flex flex-col items-center text-center leading-tight">
          {children}
        </div>
      ) : null}
    </div>
  );
}
