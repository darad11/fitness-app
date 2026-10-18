import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface StatTileProps {
  label: string;
  value: string;
  /** Einheit oder Zusatz hinter der Zahl, z. B. „kg“ oder „Sätze“. */
  unit?: string;
  hint?: string;
  tone?: 'surface' | 'ink' | 'plain';
  className?: string;
}

/** Kennzahl mit Vorzeile (ux-audit.md Abschnitt 2); nur mit gespeicherten Daten (AK-DSH-07). */
export function StatTile({ label, value, unit, hint, tone = 'surface', className }: StatTileProps) {
  const onInk = tone === 'ink';
  return (
    <div
      className={cn(
        'min-w-0',
        tone === 'surface' && 'rounded-card bg-surface p-4 shadow-card',
        tone === 'ink' && 'rounded-card bg-ink-2 p-4 text-on-ink',
        className,
      )}
    >
      <dt className={cn('eyebrow', onInk ? 'text-on-ink-muted' : 'text-muted')}>{label}</dt>
      <dd className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-bold tabular-nums">{value}</span>
        {unit ? (
          <span className={cn('text-sm font-medium', onInk ? 'text-on-ink-muted' : 'text-muted')}>
            {` ${unit}`}
          </span>
        ) : null}
      </dd>
      {hint ? (
        <p className={cn('mt-1 text-xs', onInk ? 'text-on-ink-muted' : 'text-muted')}>{hint}</p>
      ) : null}
    </div>
  );
}

export interface MeterProps {
  /** 0 bis 1. */
  value: number;
  label: string;
  tone?: 'default' | 'onInk';
  className?: string;
}

/** Fortschrittsbalken (design-system.md Abschnitt 8.3); Spur `--meter-track`, Füllung Akzent. */
export function Meter({ value, label, tone = 'default', className }: MeterProps) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={cn(
        'h-2 w-full overflow-hidden rounded-pill',
        tone === 'onInk' ? 'bg-ink-2' : 'bg-meter-track',
        className,
      )}
    >
      <div
        className={cn(
          'h-full rounded-pill transition-[width] duration-240',
          tone === 'onInk' ? 'bg-on-ink' : 'bg-accent',
        )}
        style={{ width: `${String(percent)}%` }}
      />
    </div>
  );
}

export interface ProgressRingProps {
  /** 0 bis 1. */
  value: number;
  label: string;
  size?: number;
  stroke?: number;
  tone?: 'default' | 'onInk';
  children?: ReactNode;
  className?: string;
}

/** Fortschrittskreis mit Inhalt in der Mitte, z. B. „3 / 16“. */
export function ProgressRing({
  value,
  label,
  size = 96,
  stroke = 8,
  tone = 'default',
  children,
  className,
}: ProgressRingProps) {
  const clamped = Math.min(1, Math.max(0, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.round(clamped * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg aria-hidden="true" width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className={tone === 'onInk' ? 'stroke-ink-2' : 'stroke-meter-track'}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
          className={cn(
            'transition-[stroke-dashoffset] duration-240',
            tone === 'onInk' ? 'stroke-on-ink' : 'stroke-accent',
          )}
        />
      </svg>
      {children ? (
        <div className="absolute inset-0 flex items-center justify-center">{children}</div>
      ) : null}
    </div>
  );
}
