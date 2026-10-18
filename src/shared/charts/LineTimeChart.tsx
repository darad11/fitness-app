import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

/** Ein Punkt auf einer echten Zeitachse; `trend` ist die optionale geglättete Reihe. */
export interface TimePoint {
  time: number;
  value: number;
  trend?: number | null;
  /** Zusatz für den Tooltip, z. B. „80 kg × 6“. */
  detail?: string;
}

export interface LineTimeChartProps {
  data: readonly TimePoint[];
  /** Beschreibung für Screenreader; die Tabellenansicht liefert die Werte. */
  ariaLabel: string;
  valueLabel: string;
  trendLabel?: string;
  formatValue: (value: number) => string;
  /** Achsenbeschriftung ohne Einheit, damit sie in eine Zeile passt. */
  formatAxis: (value: number) => string;
  formatDate: (time: number) => string;
  formatDateTime: (time: number) => string;
  /** Linie nur verbinden, wenn genug Punkte da sind (design-system.md 8.1: unter drei keine Linie). */
  connect: boolean;
  reference?: { value: number; label: string };
  height?: number;
}

interface TipProps {
  active?: boolean;
  payload?: readonly { payload: TimePoint }[];
  valueLabel: string;
  trendLabel?: string;
  formatValue: (value: number) => string;
  formatDateTime: (time: number) => string;
}

/** Tooltip; Recharts reicht `active` und `payload` in das Element hinein. */
function ChartTip({
  active,
  payload,
  valueLabel,
  trendLabel,
  formatValue,
  formatDateTime,
}: TipProps) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="rounded-input bg-surface px-3 py-2 text-sm shadow-float">
      <p className="font-semibold tabular-nums">{formatDateTime(point.time)}</p>
      <p className="tabular-nums">
        {valueLabel}: {formatValue(point.value)}
        {point.detail ? ` (${point.detail})` : ''}
      </p>
      {point.trend !== undefined && point.trend !== null && trendLabel ? (
        <p className="text-muted tabular-nums">
          {trendLabel}: {formatValue(point.trend)}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Liniendiagramm auf Zeitachse nach design-system.md Abschnitt 8: Linie 2 px in `--data-1`,
 * Punkte in `--chart-point` mit Ring in Flächenfarbe, nur waagerechte Gitterlinien, Tooltip mit
 * Fadenkreuz. Farben kommen aus den Tokens, deshalb passt das Diagramm zu Hell und Dunkel.
 */
export function LineTimeChart(props: LineTimeChartProps) {
  const { data, formatValue, formatDate, formatDateTime } = props;
  const hasTrend = data.some((point) => point.trend !== undefined && point.trend !== null);
  const axisTick = { fill: 'var(--chart-axis)', fontSize: 12 };
  return (
    <div role="img" aria-label={props.ariaLabel} className="w-full">
      <ResponsiveContainer width="100%" height={props.height ?? 240}>
        <ComposedChart data={[...data]} margin={{ top: 12, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis
            dataKey="time"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={formatDate}
            tick={axisTick}
            axisLine={{ stroke: 'var(--chart-grid)' }}
            tickLine={false}
            minTickGap={32}
            padding={{ left: 12, right: 12 }}
          />
          <YAxis
            domain={['auto', 'auto']}
            width={40}
            tickFormatter={(value: number) => props.formatAxis(value)}
            tick={axisTick}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={
              <ChartTip
                valueLabel={props.valueLabel}
                trendLabel={props.trendLabel}
                formatValue={formatValue}
                formatDateTime={formatDateTime}
              />
            }
            cursor={{ stroke: 'var(--chart-axis)', strokeDasharray: '3 3' }}
            isAnimationActive={false}
          />
          {props.reference ? (
            <ReferenceLine
              y={props.reference.value}
              stroke="var(--chart-axis)"
              strokeWidth={1}
              label={{
                value: props.reference.label,
                fill: 'var(--chart-axis)',
                fontSize: 12,
                position: 'insideTopRight',
              }}
            />
          ) : null}
          {hasTrend ? (
            <Line
              type="linear"
              dataKey="trend"
              stroke="var(--data-1)"
              strokeWidth={2}
              dot={false}
              activeDot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
          ) : null}
          <Line
            type="linear"
            dataKey="value"
            stroke={props.connect && !hasTrend ? 'var(--data-1)' : 'transparent'}
            strokeWidth={2}
            dot={{ r: 4, fill: 'var(--chart-point)', stroke: 'var(--surface)', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: 'var(--data-1)', stroke: 'var(--surface)', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Legende unter dem Diagramm: Farbsymbol und Text (nie Text in Reihenfarbe). */
export function ChartLegend({ items }: { items: readonly { color: string; label: string }[] }) {
  return (
    <ul className="mt-2 flex flex-wrap gap-4 text-sm text-muted">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-3 rounded-pill"
            style={{ background: item.color }}
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
