import { useFormatters } from '@/modules/settings';
import { tNutrition } from '@/shared/i18n/de-nutrition';
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
 * Feste Breite der Wertespalten (D-364): „je 100 g“ braucht höchstens „je 100 ml“ oder
 * „899 kcal“, „für x g“ auch „für 1,5 Stück“ oder „3 735 kcal“. Köpfe und Werte brechen nie um;
 * ist ein Wert doch breiter, wird seine Spalte breiter. Die Namen bekommen den Rest der Breite,
 * bei 360 pt genug für „davon gesättigte“ in der ersten Zeile.
 */
function columnWidth(index: number): string {
  return index === 0 ? 'w-[4.25rem]' : 'w-[5.75rem]';
}

/**
 * Alle acht Nährwerte (NU-16) in der Reihenfolge des Etiketts, z. B. je 100 g und für die gewählte
 * Menge. Fehlende Werte erscheinen als „–“; abgeleitete (0 g nach Regel D-361) mit Sternchen.
 */
export function NutrientTable({
  caption,
  columns,
  derived = [],
  header = columns.length > 1,
  className,
}: {
  caption: string;
  columns: readonly NutrientColumn[];
  /** Nährwerte, deren 0 g abgeleitet ist; die Erklärung steht unter der Tabelle. */
  derived?: readonly Nutrient[];
  /** Spaltenköpfe zeigen, auch bei nur einer Spalte („je 100 g“). */
  header?: boolean;
  className?: string;
}) {
  const fmt = useFormatters();
  const show = (nutrient: Nutrient, value: number | undefined) => {
    if (value === undefined) return tNutrition.noValue;
    if (nutrient === 'kcal') return `${kcal(fmt, value)} ${tNutrition.units.kcal}`;
    // Salz meist unter 1 g, daher zwei Nachkommastellen.
    const shown =
      nutrient === 'salt' ? fmt.number(value, { maximumFractionDigits: 2 }) : grams(fmt, value);
    const text = `${shown} ${tNutrition.units.g}`;
    if (!derived.includes(nutrient)) return text;
    return (
      <>
        {text}
        <span aria-hidden="true">{tNutrition.basic.derivedMark}</span>
        <span className="sr-only"> ({tNutrition.basic.derivedLabel})</span>
      </>
    );
  };
  return (
    <table className={cn('w-full text-sm tabular-nums', className)}>
      <caption className="mb-1 text-left font-semibold text-muted">{caption}</caption>
      {header ? (
        <thead>
          <tr>
            <td />
            {columns.map((column, index) => (
              <th
                key={column.label}
                scope="col"
                className={cn(
                  'pb-1 text-right font-semibold whitespace-nowrap text-muted',
                  columnWidth(index),
                )}
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
                SUB.includes(nutrient) && 'pl-3 text-muted',
              )}
            >
              {tNutrition.nutrients[nutrient]}
            </th>
            {columns.map((column, index) => (
              <td
                key={column.label}
                className={cn('py-1.5 text-right whitespace-nowrap', columnWidth(index))}
              >
                {show(nutrient, column.values[nutrient])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
