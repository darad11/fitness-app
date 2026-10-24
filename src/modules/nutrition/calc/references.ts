import type { Nutrients } from '../model/nutrition';

/** Nährwerte mit Tagesreferenz in der Übersicht, in dieser Reihenfolge (Phase Ernährung §3, D-359). */
export const REFERENCE_NUTRIENTS = ['salt', 'sugar', 'saturatedFat', 'fiber'] as const;
export type ReferenceNutrient = (typeof REFERENCE_NUTRIENTS)[number];

export interface DailyReference {
  /** Gramm am Tag für Erwachsene. */
  grams: number;
  /** „höchstens“ für Salz, Zucker und gesättigte Fettsäuren, „mindestens“ für Ballaststoffe. */
  bound: 'atMost' | 'atLeast';
  /** EU-Lebensmittelinformationsverordnung (LMIV) oder Deutsche Gesellschaft für Ernährung. */
  source: 'lmiv' | 'dge';
}

/**
 * Tagesreferenzen für Erwachsene, keine Ziele (D-359):
 * - Zucker 90 g (Gesamtzucker), gesättigte Fettsäuren 20 g, Salz 6 g: Referenzmengen nach
 *   VO (EU) Nr. 1169/2011 (LMIV), Anhang XIII Teil B.
 * - Ballaststoffe mindestens 30 g: Richtwert der DGE.
 * Freien bzw. zugesetzten Zucker (WHO, DGE: unter 10 % der Energie) gibt es hier nicht, weil die
 * Nährwertangaben ihn nicht vom enthaltenen Zucker trennen.
 */
export const DAILY_REFERENCES: Readonly<Record<ReferenceNutrient, DailyReference>> = {
  salt: { grams: 6, bound: 'atMost', source: 'lmiv' },
  sugar: { grams: 90, bound: 'atMost', source: 'lmiv' },
  saturatedFat: { grams: 20, bound: 'atMost', source: 'lmiv' },
  fiber: { grams: 30, bound: 'atLeast', source: 'dge' },
};

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
 * Ist und Referenz je Nährwert für einen Tag. Fehlt einem Eintrag ein Wert, wird er nicht als 0
 * gezählt, sondern genannt: Die Summe gilt dann nur für die Einträge mit Angabe.
 */
export function referenceLines(
  entries: readonly { nutrients: Nutrients; name: string }[],
): ReferenceLine[] {
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
      reference: DAILY_REFERENCES[nutrient],
      total: known === 0 && entries.length > 0 ? null : Math.round(total * 10) / 10,
      missingNames: [...new Set(missing)],
      missingCount: missing.length,
    };
  });
}
