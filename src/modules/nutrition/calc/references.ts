import type { Nutrients } from '../model/nutrition';

/** Nährwerte mit Tagesreferenz in der Übersicht, in dieser Reihenfolge (Phase Ernährung §3, D-359). */
export const REFERENCE_NUTRIENTS = ['salt', 'sugar', 'saturatedFat', 'fiber'] as const;
export type ReferenceNutrient = (typeof REFERENCE_NUTRIENTS)[number];

export interface DailyReference {
  /** Gramm am Tag. */
  grams: number;
  /** „höchstens“ für Salz, Zucker und gesättigte Fettsäuren, „mindestens“ für Ballaststoffe. */
  bound: 'atMost' | 'atLeast';
  /**
   * EU-Lebensmittelinformationsverordnung (Salz), Deutsche Gesellschaft für Ernährung
   * (Ballaststoffe) oder ein Anteil der Energie nach WHO und DGE (Zucker, gesättigte Fettsäuren).
   */
  source: 'lmiv' | 'dge' | 'energyShare';
  /** Nur beim Anteil der Energie: die kcal, aus denen gerechnet ist, und ob aus dem Tagesziel. */
  basis?: { kcal: number; fromTarget: boolean };
}

/** Anteil der Energie für Zucker und gesättigte Fettsäuren: WHO und DGE, unter 10 % (D-369). */
export const ENERGY_SHARE = 0.1;
/** Ohne Tagesziel: Referenzmenge für Energie nach LMIV Anhang XIII Teil B. */
export const DEFAULT_REFERENCE_KCAL = 2000;
/** Energie je Gramm nach LMIV Anhang XIV: Zucker als Kohlenhydrat 4 kcal, Fett 9 kcal. */
const KCAL_PER_GRAM = { sugar: 4, saturatedFat: 9 } as const;

/**
 * Tagesreferenzen, keine Ziele (D-359, Zucker und gesättigte Fettsäuren seit D-369):
 * - Salz höchstens 6 g: Referenzmenge nach VO (EU) Nr. 1169/2011 (LMIV), Anhang XIII Teil B.
 * - Zucker und gesättigte Fettsäuren höchstens 10 % der Energie aus dem Tagesziel (WHO und DGE),
 *   mit 4 bzw. 9 kcal je g, auf ganze Gramm gerundet; ohne Tagesziel aus 2.000 kcal, also 50 g
 *   und 22 g. WHO und DGE meinen beim Zucker freien Zucker; die Nährwertangaben trennen ihn nicht
 *   vom Zucker aus Obst und Milch, deshalb ist die Referenz hier eine strenge Orientierung.
 * - Ballaststoffe mindestens 30 g: Richtwert der DGE.
 */
export function dailyReferences(
  kcalTarget?: number | null,
): Readonly<Record<ReferenceNutrient, DailyReference>> {
  const fromTarget =
    typeof kcalTarget === 'number' && Number.isFinite(kcalTarget) && kcalTarget > 0;
  const kcal = fromTarget ? kcalTarget : DEFAULT_REFERENCE_KCAL;
  const share = (nutrient: keyof typeof KCAL_PER_GRAM): DailyReference => ({
    grams: Math.round((kcal * ENERGY_SHARE) / KCAL_PER_GRAM[nutrient]),
    bound: 'atMost',
    source: 'energyShare',
    basis: { kcal, fromTarget },
  });
  return {
    salt: { grams: 6, bound: 'atMost', source: 'lmiv' },
    sugar: share('sugar'),
    saturatedFat: share('saturatedFat'),
    fiber: { grams: 30, bound: 'atLeast', source: 'dge' },
  };
}

export interface ReferenceLine {
  nutrient: ReferenceNutrient;
  reference: DailyReference;
  /**
   * Summe der Einträge mit Angabe, auf 0,1 g gerundet; `null`, wenn kein Eintrag des Tages eine
   * Angabe hat (dann zeigt die Übersicht keine Zahl).
   */
  total: number | null;
  /** Namen der Einträge ohne Angabe, ohne Wiederholung; sie zählen nicht als 0. */
  missingNames: readonly string[];
  /** Anzahl der Einträge ohne Angabe. */
  missingCount: number;
}

/**
 * Fehlen dieselben Einträge bei allen Werten (typisch: Schnelleinträge nur mit kcal), genügt ein
 * Hinweis für alle statt vier gleicher Zeilen. Liefert dann deren Namen, sonst `null`.
 */
export function sharedMissing(lines: readonly ReferenceLine[]): readonly string[] | null {
  const first = lines[0];
  if (!first || first.missingCount === 0) return null;
  const key = first.missingNames.join('\u0000');
  const same = lines.every(
    (line) => line.missingCount === first.missingCount && line.missingNames.join('\u0000') === key,
  );
  return same ? first.missingNames : null;
}

/**
 * Ist und Referenz je Nährwert für einen Tag; `kcalTarget` ist das Kalorien-Tagesziel dieses Tages
 * (ohne Ziel gelten 2.000 kcal). Fehlt einem Eintrag ein Wert, wird er nicht als 0 gezählt,
 * sondern genannt: Die Summe gilt dann nur für die Einträge mit Angabe.
 */
export function referenceLines(
  entries: readonly { nutrients: Nutrients; name: string }[],
  kcalTarget?: number | null,
): ReferenceLine[] {
  const references = dailyReferences(kcalTarget);
  return REFERENCE_NUTRIENTS.map((nutrient) => {
    let total = 0;
    let known = 0;
    const missing: string[] = [];
    for (const entry of entries) {
      const value = entry.nutrients[nutrient];
      if (value === undefined) missing.push(entry.name);
      else {
        total += value;
        known++;
      }
    }
    return {
      nutrient,
      reference: references[nutrient],
      total: known === 0 && entries.length > 0 ? null : Math.round(total * 10) / 10,
      missingNames: [...new Set(missing)],
      missingCount: missing.length,
    };
  });
}
