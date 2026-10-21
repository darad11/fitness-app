import {
  Bar,
  BarChart,
  CartesianGrid,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type RectangleProps,
} from 'recharts';
import { useFormatters } from '@/modules/settings';
import { tTaskStats } from '@/shared/i18n/de-task-stats';
import type { Bucket } from '../calc/insights';

const ts = tTaskStats;

interface Row {
  label: string;
  title: string;
  /** Tage: erledigte Aufgaben; Wochen: Prozent. */
  value: number;
  /** Tage: offene Rest bis „fällig“. */
  rest: number;
  complete: boolean;
  bucket: Bucket;
}

const dateOf = (day: string) => new Date(`${day}T12:00:00`);

/**
 * Verlauf der Tagesaufgaben (D-284): bis 31 Tage gestapelte Balken „erledigt“ und „offen“ je Tag
 * (grün: alles erledigt), darüber Prozent je Woche. Tage ohne Eintrag bleiben leer, nicht null.
 * Die Werte stehen zusätzlich als Liste für Screenreader darunter.
 */
export function ProgressChart({
  unit,
  buckets,
}: {
  unit: 'day' | 'week';
  buckets: readonly Bucket[];
}) {
  const fmt = useFormatters();
  const percent = (bucket: Bucket) =>
    bucket.due === 0 ? 0 : Math.round((bucket.done / bucket.due) * 100);
  const rows: Row[] = buckets.map((bucket) => {
    const date = dateOf(bucket.start);
    const label =
      unit === 'day' && buckets.length <= 7
        ? (ts.detail.weekdayNames[(date.getDay() + 6) % 7] ?? '')
        : fmt.dayMonth(date);
    const title =
      unit === 'day'
        ? bucket.noData
          ? `${fmt.dayMonth(date)}: ${ts.chartNoData}`
          : ts.chartDay(fmt.dayMonth(date), bucket.done, bucket.due) +
            (bucket.today ? ` (${ts.chartToday})` : '')
        : bucket.noData
          ? `${ts.chartWeek(fmt.dayMonth(date))}: ${ts.chartNoData}`
          : ts.chartWeekValue(
              fmt.dayMonth(date),
              `${fmt.number(percent(bucket))} %`,
              bucket.done,
              bucket.due,
            );
    return {
      label,
      title,
      value: bucket.noData ? 0 : unit === 'day' ? bucket.done : percent(bucket),
      rest: bucket.noData || unit === 'week' ? 0 : bucket.due - bucket.done,
      complete: bucket.complete,
      bucket,
    };
  });
  const maxDue = Math.max(1, ...buckets.map((bucket) => bucket.due));
  const axisTick = { fill: 'var(--chart-axis)', fontSize: 12 };
  return (
    <>
      <div role="img" aria-label={ts.chartAria(rows.length, unit)} className="w-full">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: -16 }}>
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
              domain={[0, unit === 'day' ? maxDue : 100]}
              allowDecimals={false}
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              width={40}
              tickFormatter={(value: number) => (unit === 'week' ? `${value} %` : String(value))}
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
            <Bar
              dataKey="value"
              stackId="a"
              isAnimationActive={false}
              shape={(props: unknown) => {
                const bar = props as RectangleProps & { payload: Row };
                return (
                  <Rectangle
                    {...bar}
                    fill={
                      bar.payload.complete && unit === 'day' ? 'var(--success)' : 'var(--data-1)'
                    }
                    fillOpacity={bar.payload.bucket.today ? 0.6 : 1}
                  />
                );
              }}
            />
            <Bar
              dataKey="rest"
              stackId="a"
              fill="var(--meter-track)"
              isAnimationActive={false}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="sr-only">
        {rows.map((row) => (
          <li key={row.bucket.start}>{row.title}</li>
        ))}
      </ul>
    </>
  );
}
