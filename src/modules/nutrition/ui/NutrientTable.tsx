import { useFormatters } from '@/modules/settings';
import { t } from '@/shared/i18n/de';
import { cn } from '@/shared/lib/cn';
import type { Nutrient, Nutrients } from '../model/nutrition';
import { grams, kcal } from './format';

/** Unterzeilen wie auf dem Etikett (LMIV): „davon …“ eingerückt. */
const SUB: readonly Nutrient[] = ['sugar', 'saturatedFat'];
/** Reihenfolge wie auf der Nährwerttabelle einer Verpackung. */
const ORDER: readonly Nutrient[] = [
  'kcal',
  'fat',
  'saturatedFat',
  'carbs',
  'sugar',
  'fiber',
  'protein',
  'salt',
];

export interface NutrientColumn {
  label: string;
  values: Nutrients;
}

/**
 * Alle acht Nährwerte (NU-16) in der Reihenfolge des Etiketts, z. B. je 100 g und für die gewählte
 * Menge. Fehlende Werte erscheinen als „–“.
 */
export function NutrientTable({
  caption,
  columns,
  className,
}: {
  caption: string;
  columns: readonly NutrientColumn[];
  className?: string;
}) {
  const fmt = useFormatters();
  const show = (nutrient: Nutrient, value: number | undefined) => {
    if (value === undefined) return t.nutrition.noValue;
    if (nutrient === 'kcal') return `${kcal(fmt, value)} ${t.nutrition.units.kcal}`;
    // Salz meist unter 1 g, daher zwei Nachkommastellen.
    const shown =
      nutrient === 'salt' ? fmt.number(value, { maximumFractionDigits: 2 }) : grams(fmt, value);
    return `${shown} ${t.nutrition.units.g}`;
  };
  return (
    <table className={cn('w-full text-sm tabular-nums', className)}>
      <caption className="mb-1 text-left font-semibold text-muted">{caption}</caption>
      {columns.length > 1 ? (
        <thead>
          <tr>
            <td />
            {columns.map((column) => (
              <th
                key={column.label}
                scope="col"
                className="pb-1 text-right font-semibold text-muted"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
      ) : null}
      <tbody className="divide-y divide-line">
        {ORDER.map((nutrient) => (
          <tr key={nutrient}>
            <th
              scope="row"
              className={cn(
                'py-1.5 text-left font-normal',
                SUB.includes(nutrient) && 'pl-4 text-muted',
              )}
            >
              {t.nutrition.nutrients[nutrient]}
            </th>
            {columns.map((column) => (
              <td key={column.label} className="py-1.5 text-right">
                {show(nutrient, column.values[nutrient])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
