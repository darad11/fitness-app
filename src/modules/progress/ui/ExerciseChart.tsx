import { useFormatters } from '@/modules/settings';
import type { HistoryRow } from '@/modules/training';
import { LineTimeChart } from '@/shared/charts/LineTimeChart';
import { t } from '@/shared/i18n/de';
import type { SeriesPoint } from '../calc/stats';

/** Diagramm C-02: eine Reihe, Linie ab drei Punkten, Tooltip mit Satz. */
export function ExerciseChart({
  points,
  name,
  metricLabel,
  formatValue,
  formatAxis,
  formatSet,
}: {
  points: readonly SeriesPoint[];
  name: string;
  metricLabel: string;
  formatValue: (value: number) => string;
  formatAxis: (value: number) => string;
  formatSet: (row: HistoryRow) => string;
}) {
  const fmt = useFormatters();
  return (
    <LineTimeChart
      data={points.map((point) => ({
        time: point.time,
        value: point.value,
        detail: formatSet(point.row),
      }))}
      ariaLabel={t.progress.exercise.chartAria(name, metricLabel, points.length)}
      valueLabel={metricLabel}
      formatValue={formatValue}
      formatAxis={formatAxis}
      formatDate={(time) => fmt.dayMonth(new Date(time))}
      formatDateTime={(time) => fmt.dayMonthYear(new Date(time))}
      connect={points.length >= 3}
    />
  );
}
