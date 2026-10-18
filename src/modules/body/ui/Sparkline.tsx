/** Mini-Verlauf (C-03): Linie in `--chart-point`, letzter Punkt in `--data-1`; Text liefert der Aufrufer. */
export function Sparkline({
  values,
  className,
}: {
  values: readonly number[];
  className?: string;
}) {
  const width = 120;
  const height = 32;
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((value, index) => {
    const x = 4 + (index / (values.length - 1)) * (width - 8);
    const y = 4 + (1 - (value - min) / span) * (height - 8);
    return [x, y] as const;
  });
  const last = points[points.length - 1] ?? ([0, 0] as const);
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${String(width)} ${String(height)}`}
      width={width}
      height={height}
      className={className}
    >
      <polyline
        fill="none"
        stroke="var(--chart-point)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}
      />
      <circle cx={last[0]} cy={last[1]} r={3.5} fill="var(--data-1)" />
    </svg>
  );
}
