import type { BasicFoodInfo } from './basicFood';
import type { CatalogSource, Food, FoodBasis, Nutrients, Serving } from './nutrition';

/**
 * Lebensmittel in Anzeigeform, egal ob eigenes, aus der Grundauswahl (BLS, USDA), importiert oder
 * aus Open Food Facts.
 */
export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  /** Zusätzliche Suchbegriffe, z. B. österreichische Bezeichnungen. */
  aliases: readonly string[];
  basis: FoodBasis;
  per100: Nutrients;
  servings: readonly Serving[];
  /**
   * 'recipe' für eigene Rezepte (D-267), die sich wie ein Lebensmittel eintragen lassen; 'usda' für
   * die drei Lücken der Grundauswahl (D-361). Nur 'recipe' und 'usda' gibt es nie als Dokument.
   */
  source: Food['source'] | 'recipe' | 'usda';
  /** Grundnahrungsmittel aus der freigegebenen Auswahl (D-362): Quelle, Einheit, Stückgewicht. */
  basic?: BasicFoodInfo;
  /** Bei importierten Daten (D-263): Österreichische Nährwerttabelle (ÖNWT). */
  catalog?: CatalogSource;
  quality: Food['quality'];
  favorite?: boolean;
  archivedAt?: string;
  /** BLS-Code bzw. Barcode. */
  sourceRef?: string;
  barcode?: string;
}
