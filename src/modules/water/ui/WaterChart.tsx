import {
  Bar,
  BarChart,
  CartesianGrid,
  Rectangle,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type RectangleProps,
} from 'recharts';
import { useFormatters } from '@/modules/settings';
import { tTaskStats } from '@/shared/i18n/de-task-stats';
import { tWater } from '@/shared/i18n/de-water';
import type { DayBar } from '../calc/water';
import { formatMl } from './format';

const tw = tWater;

interface Row {
  label: string;
  title: string;
  value: number;
  bar: DayBar;
}

const dateOf = (day: string) => new Date(`${day}T12:00:00`);

/**
 * Wasser je Tag als Balken (D-289): grün, wenn das Ziel des Tages erreicht war; Tage ohne
 * Eintrag bleiben leer statt 0 ml. Die Linie zeigt das aktuelle Ziel. Die Werte stehen
 * zusätzlich als Liste für Screenreader darunter.
 */
export function WaterChart({ bars, goalMl }: { bars: readonly DayBar[]; goalMl: number }) {
  const fmt = useFormatters();
  const rows: Row[] = bars.map((bar) => {
    const date = dateOf(bar.day);
    const label =
      bars.length <= 7
        ? (tTaskStats.detail.weekdayNames[(date.getDay() + 6) % 7] ?? '')
        : fmt.dayMonth(date);
    const title =
      bar.totalMl === null
        ? tw.chartNoData(fmt.dayMonth(date))
        : tw.chartDay(fmt.dayMonth(date), formatMl(fmt, bar.totalMl), formatMl(fmt, bar.goalMl)) +
          (bar.today ? ` (${tw.chartToday})` : '');
    return { label, title, value: bar.totalMl ?? 0, bar };
  });
  // Runde Achse: Schritte von 0,5 l (ab 4 l: 1 l) bis knapp über Ziel und höchstem Tag.
  const highest = Math.max(goalMl, ...rows.map((row) => row.value));
  const step = highest > 4000 ? 1000 : 500;
  const top = Math.ceil((highest * 1.05) / step) * step;
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);
  const axisTick = { fill: 'var(--chart-axis)', fontSize: 12 };
  return (
    <>
      <div role="img" aria-label={tw.chartAria(rows.length)} className="w-full">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: -8 }}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <XAxis
              dataKey="label"
              tick={axisTick}
              axisLine={{ stroke: 'var(--chart-grid)' }}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={8}
            />
            <YAxis
              domain={[0, top]}
              ticks={ticks}
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              width={48}
              tickFormatter={(value: number) =>
                `${fmt.number(value / 1000, { maximumFractionDigits: 1 })} l`
              }
            />
            <Tooltip
              cursor={{ fill: 'var(--chart-grid)', opacity: 0.4 }}
              isAnimationActive={false}
              content={({ active, payload }) => {
                const first = payload[0] as { payload?: Row } | undefined;
                const row = first?.payload;
                if (!active || !row) return null;
                return (
                  <div className="rounded-input bg-surface px-3 py-2 text-sm shadow-float">
                    {row.title}
                  </div>
                );
              }}
            />
            <ReferenceLine y={goalMl} stroke="var(--chart-axis)" strokeDasharray="4 4" />
            <Bar
              dataKey="value"
              isAnimationActive={false}
              radius={[4, 4, 0, 0]}
              shape={(props: unknown) => {
                const bar = props as RectangleProps & { payload: Row };
                const reached =
                  bar.payload.bar.totalMl !== null &&
                  bar.payload.bar.totalMl >= bar.payload.bar.goalMl;
                return (
                  <Rectangle
                    {...bar}
                    fill={reached ? 'var(--success)' : 'var(--data-1)'}
                    fillOpacity={bar.payload.bar.today ? 0.6 : 1}
                  />
                );
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="sr-only">
        {rows.map((row) => (
          <li key={row.bar.day}>{row.title}</li>
        ))}
      </ul>
    </>
  );
}
