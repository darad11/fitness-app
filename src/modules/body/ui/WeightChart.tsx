import { useFormatters } from '@/modules/settings';
import { ChartLegend, LineTimeChart } from '@/shared/charts/LineTimeChart';
import { t } from '@/shared/i18n/de';
import type { TrendPoint, WeightEntry } from '../calc/bodyWeight';

/** Diagramm C-01: Punkte je Messung, Linie für den 7-Tage-Durchschnitt. */
export function WeightChart({
  points,
  formatWeight,
  goalKg,
}: {
  points: readonly TrendPoint<WeightEntry>[];
  formatWeight: (value: number) => string;
  /** Zielgewicht als beschriftete Linie (AK-BW-05). */
  goalKg?: number;
}) {
  const fmt = useFormatters();
  const hasTrend = points.some((point) => point.avg7 !== undefined);
  return (
    <>
      <LineTimeChart
        data={points.map(({ entry, avg7 }) => ({
          time: Date.parse(entry.measuredAt),
          value: entry.weightKg,
          trend: avg7 ?? null,
        }))}
        ariaLabel={t.body.chartAria(points.length)}
        valueLabel={t.body.measurement}
        trendLabel={t.body.trend}
        formatValue={(value) => `${formatWeight(value)} kg`}
        formatAxis={formatWeight}
        formatDate={(time) => fmt.dayMonth(new Date(time))}
        formatDateTime={(time) => fmt.dateTimeShort(new Date(time))}
        connect={false}
        reference={
          goalKg === undefined
            ? undefined
            : { value: goalKg, label: t.goals.chartGoal(`${formatWeight(goalKg)} kg`) }
        }
      />
      <ChartLegend
        items={[
          { color: 'var(--chart-point)', label: t.body.measurement },
          ...(hasTrend ? [{ color: 'var(--data-1)', label: t.body.trend }] : []),
        ]}
      />
    </>
  );
}
