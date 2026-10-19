import { useId } from 'react';

/**
 * Gewichtskurve für „Heute“ (D-272): Fläche mit Verlauf und Linie in `--data-1` über die volle
 * Kartenbreite, letzter Punkt hervorgehoben. Zahlen liefert der Aufrufer als Text daneben.
 */
export function WeightCurve({
  values,
  className,
}: {
  values: readonly number[];
  className?: string;
}) {
  const gradient = useId();
  if (values.length < 2) return null;
  const width = 300;
  const height = 64;
  const pad = 5;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((value, index) => {
    const x = pad + (index / (values.length - 1)) * (width - 2 * pad);
    const y = pad + (1 - (value - min) / span) * (height - 2 * pad);
    return [x, y] as const;
  });
  const line = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const first = points[0] ?? ([0, 0] as const);
  const last = points[points.length - 1] ?? ([0, 0] as const);
  const area = `M${first[0].toFixed(1)},${String(height)} L${line.replaceAll(' ', ' L')} L${last[0].toFixed(1)},${String(height)} Z`;
  return (
    <div aria-hidden="true" className={className} style={{ position: 'relative', height }}>
      <svg
        viewBox={`0 0 ${String(width)} ${String(height)}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height }}
      >
        <defs>
          <linearGradient id={gradient} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--data-1)" stopOpacity="0.35" />
            <stop offset="1" stopColor="var(--data-1)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradient})`} />
        <polyline
          fill="none"
          stroke="var(--data-1)"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          points={line}
        />
      </svg>
      {/* Punkt außerhalb der gestreckten Grafik, damit er rund bleibt. */}
      <span
        className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--data-1)] shadow-[0_0_0_3px_var(--surface)]"
        style={{ left: `${String((last[0] / width) * 100)}%`, top: last[1] }}
      />
    </div>
  );
}
