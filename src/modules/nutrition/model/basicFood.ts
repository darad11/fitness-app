import type { Nutrient } from './nutrition';

/**
 * Grundnahrungsmittel aus der freigegebenen Auswahlliste (Phase Ernährung §6, D-362):
 * `docs/lebensmittel-auswahl.csv` → `tools/lebensmittel_auswahl.py --build` → `data/basicFoods.json`.
 */

/** Herkunft der Nährwerte: Bundeslebensmittelschlüssel 4.0 oder, nur für Lücken, USDA SR28. */
export const BASIC_ORIGINS = ['bls', 'usda'] as const;
export type BasicOrigin = (typeof BASIC_ORIGINS)[number];

/**
 * Einheiten für Stückangaben, wie in der Spalte „Einheit“ der Liste: Stück oder Scheibe, beim
 * Knoblauch die Zehe (D-365). Eine Einheit gibt es nur mit Richtwert.
 */
export const PIECE_UNITS = ['Stück', 'Scheibe', 'Zehe'] as const;
export type PieceUnit = (typeof PIECE_UNITS)[number];

/** Größtes Stückgewicht in g, wie bei Portionen (`servingSchema`). */
export const PIECE_GRAMS_MAX = 5000;

export interface BasicFoodInfo {
  origin: BasicOrigin;
  /** BLS-Code bzw. USDA-Nummer. */
  code: string;
  /** Bezeichnung in der Quelle (BLS-Bezeichnung bzw. USDA-Beschreibung). */
  sourceName: string;
  /** Einheit für Stückangaben, nur zusammen mit einem Richtwert; ohne beides nur Gramm. */
  unit?: PieceUnit;
  /** Richtwert aus der Liste in g für 1 Stück bzw. 1 Scheibe, essbarer Anteil (z. B. Ei 51 g). */
  listPieceGrams?: number;
  /** Eigenes, gemerktes Stückgewicht in g (Einstellung `pieceWeights`), gilt vor dem Richtwert. */
  ownPieceGrams?: number;
  /** Kurzer Hinweis zum Richtwert, z. B. „Größe M“ oder „ohne Schale“. */
  pieceHint?: string;
  /** Nährwerte, die als 0 g abgeleitet sind (Regel D-361), z. B. Ballaststoffe im Feta. */
  derived: readonly Nutrient[];
}
