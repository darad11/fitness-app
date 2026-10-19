import type { CSSProperties, ReactNode } from 'react';

export interface RingSegment {
  /** Gewicht des Abschnitts, z. B. kcal aus Eiweiß; die Abschnitte teilen die Füllung anteilig. */
  amount: number;
  /** CSS-Farbe, z. B. `var(--macro-protein)`. */
  color: string;
}

/**
 * Ein Ring (D-272): Die Füllung zeigt den Anteil am Kalorienziel und läuft in durchgehendem Verlauf
 * durch die Farben von Eiweiß, Kohlenhydraten und Fett, jeweils so lang wie ihr Anteil an den
 * Kalorien; runde Enden. Ohne Makro-Angaben (z. B. nur Schnelleinträge) einfarbig. Rein
 * grafisch; die Zahlen stehen daneben und im `label` für VoiceOver.
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
  const filled = Math.min(1, Math.max(0, value));
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.amount), 0);
  const parts =
    total > 0
      ? segments
          .filter((s) => s.amount > 0)
          .map((s) => ({ color: s.color, share: s.amount / total }))
      : [{ color: 'var(--on-ink)', share: 1 }];
  const end = filled * 360;
  // Farbstopps: jede Farbe in der Mitte ihres Abschnitts, dazwischen durchgehender Verlauf.
  const stops: string[] = [];
  let at = 0;
  parts.forEach((part, index) => {
    const length = part.share * end;
    if (index === 0) stops.push(`${part.color} 0deg`);
    stops.push(`${part.color} ${String(at + length / 2)}deg`);
    if (index === parts.length - 1) stops.push(`${part.color} ${String(end)}deg`);
    at += length;
  });
  stops.push(`transparent ${String(end)}deg`);
  const ring: CSSProperties = {
    background: `conic-gradient(${stops.join(', ')})`,
    mask: `radial-gradient(farthest-side, transparent calc(100% - ${String(stroke)}px), #000 calc(100% - ${String(stroke - 0.5)}px))`,
    WebkitMask: `radial-gradient(farthest-side, transparent calc(100% - ${String(stroke)}px), #000 calc(100% - ${String(stroke - 0.5)}px))`,
  };
  const track: CSSProperties = {
    ...ring,
    background: 'color-mix(in srgb, var(--on-ink) 15%, transparent)',
  };
  // Runde Enden: Punkte in Strichbreite am Anfang und am Ende der Füllung.
  const radius = size / 2 - stroke / 2;
  const cap = (deg: number, color: string): CSSProperties => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return {
      width: stroke,
      height: stroke,
      left: size / 2 + radius * Math.cos(rad) - stroke / 2,
      top: size / 2 + radius * Math.sin(rad) - stroke / 2,
      background: color,
    };
  };
  const first = parts[0]?.color ?? 'var(--on-ink)';
  const last = parts[parts.length - 1]?.color ?? first;
  return (
    <div
      role="img"
      aria-label={label}
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <div aria-hidden="true" className="absolute inset-0 rounded-full" style={track} />
      {filled > 0 ? (
        <>
          <div aria-hidden="true" className="absolute inset-0 rounded-full" style={ring} />
          <span aria-hidden="true" className="absolute rounded-full" style={cap(0, first)} />
          <span aria-hidden="true" className="absolute rounded-full" style={cap(end, last)} />
        </>
      ) : null}
      {children ? <div className="relative">{children}</div> : null}
    </div>
  );
}
