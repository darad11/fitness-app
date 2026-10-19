import type { ReactNode } from 'react';

export interface RingSegment {
  /** Gewicht des Abschnitts, z. B. kcal aus Eiweiß; die Abschnitte teilen die Füllung anteilig. */
  amount: number;
  /** CSS-Farbe, z. B. `var(--macro-protein)`. */
  color: string;
}

const GAP_DEG = 2.5;

/**
 * Ein Ring (D-272): Die Füllung zeigt den Anteil am Kalorienziel und ist nach den Kalorien aus
 * Eiweiß, Kohlenhydraten und Fett in deren Farben geteilt. Ohne Makro-Angaben (z. B. nur
 * Schnelleinträge) füllt er sich einfarbig. Rein grafisch; die Zahlen stehen daneben und im
 * `label` für VoiceOver.
 */
export function MacroRing({
  value,
  segments,
  label,
  size = 132,
  stroke = 12,
  children,
}: {
  /** Anteil am Ziel; über 1 bleibt der Ring voll. */
  value: number;
  segments: readonly RingSegment[];
  label: string;
  size?: number;
  stroke?: number;
  children?: ReactNode;
}) {
  const center = size / 2;
  const radius = center - stroke / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = Math.min(1, Math.max(0, value));
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.amount), 0);
  const parts =
    total > 0
      ? segments
          .filter((s) => s.amount > 0)
          .map((s) => ({ color: s.color, share: s.amount / total }))
      : [{ color: 'var(--on-ink)', share: 1 }];
  const gap = parts.length > 1 ? (GAP_DEG / 360) * circumference : 0;
  let offset = 0;
  return (
    <div
      role="img"
      aria-label={label}
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg aria-hidden="true" width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          stroke="var(--on-ink)"
          strokeOpacity={0.15}
        />
        {filled > 0
          ? parts.map((part) => {
              const length = part.share * filled * circumference;
              const visible = Math.max(0, length - gap);
              const dash = (
                <circle
                  key={part.color}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  strokeWidth={stroke}
                  stroke={part.color}
                  strokeDasharray={`${String(visible)} ${String(circumference)}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += length;
              return dash;
            })
          : null}
      </svg>
      {children ? (
        <div className="absolute inset-0 flex items-center justify-center">{children}</div>
      ) : null}
    </div>
  );
}
