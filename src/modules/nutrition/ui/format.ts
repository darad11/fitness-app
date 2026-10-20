import type { Formatters } from '@/shared/lib/format';
import { t } from '@/shared/i18n/de';
import type { FoodLogEntry } from '../model/nutrition';

export const kcal = (fmt: Formatters, value: number) =>
  fmt.number(Math.round(value), { maximumFractionDigits: 0 });

export const grams = (fmt: Formatters, value: number) =>
  fmt.number(value, { maximumFractionDigits: value < 10 ? 1 : 0 });

/** Menge eines Eintrags, z. B. „150 g“ oder „½ Becher (225 g)“ bzw. „0,5 Becher (225 g)“. */
export function describeAmount(
  fmt: Formatters,
  entry: Pick<FoodLogEntry, 'amount' | 'basisSnapshot' | 'servingSnapshot'>,
): string {
  if (entry.amount === undefined) return t.nutrition.quick;
  const unit = t.nutrition.units[entry.basisSnapshot ?? 'g'];
  const amount = `${fmt.number(entry.amount, { maximumFractionDigits: 1 })} ${unit}`;
  if (!entry.servingSnapshot) return amount;
  const count = fmt.number(entry.servingSnapshot.count, { maximumFractionDigits: 2 });
  return `${count} × ${entry.servingSnapshot.name} (${amount})`;
}

/** Datum eines Tages für die Anzeige, mittags gelesen, damit Zeitzonen nicht verschieben. */
export function dayDate(dayKey: string): Date {
  return new Date(`${dayKey}T12:00:00`);
}

/**
 * Name und Marke eines Eintrags für die Anzeige (D-278). Neue Einträge haben die Marke eigens;
 * ältere hatten sie in Klammern am Namen („Hummus (Alnatura)“) oder gar nicht, dann hilft die
 * Marke des Lebensmittels aus den importierten Daten (`brandOf`).
 */
export function entryNameAndBrand(
  entry: { nameSnapshot: string; brandSnapshot?: string; foodId?: string },
  brandOf?: (foodId: string) => string | undefined,
): { name: string; brand?: string } {
  const brand = entry.brandSnapshot ?? (entry.foodId ? brandOf?.(entry.foodId) : undefined);
  if (!brand) return { name: entry.nameSnapshot };
  const suffix = ` (${brand})`;
  const name = entry.nameSnapshot.endsWith(suffix)
    ? entry.nameSnapshot.slice(0, -suffix.length)
    : entry.nameSnapshot;
  return { name, brand };
}

/** „Hummus, Alnatura“ für Vorleser und Hinweise. */
export function brandedName({ name, brand }: { name: string; brand?: string }): string {
  return brand ? `${name}, ${brand}` : name;
}
