import type { Food, FoodBasis, Nutrients, Serving } from './nutrition';

/** Lebensmittel in Anzeigeform, egal ob eigenes oder aus dem BLS (später Open Food Facts). */
export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  /** Zusätzliche Suchbegriffe, z. B. österreichische Bezeichnungen. */
  aliases: readonly string[];
  basis: FoodBasis;
  per100: Nutrients;
  servings: readonly Serving[];
  source: Food['source'];
  quality: Food['quality'];
  favorite?: boolean;
  archivedAt?: string;
  /** BLS-Code bzw. Barcode. */
  sourceRef?: string;
}
