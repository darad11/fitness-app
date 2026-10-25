import { stableId } from '@/shared/lib/uuid';
import {
  BASIC_ORIGINS,
  PIECE_GRAMS_MAX,
  PIECE_UNITS,
  type BasicFoodInfo,
  type BasicOrigin,
  type PieceUnit,
} from '../model/basicFood';
import type { FoodItem } from '../model/foodItem';
import { NUTRIENT_LIMITS, NUTRIENTS, type Nutrient, type Nutrients } from '../model/nutrition';

/** Aufbau von `basicFoods.json`, wie ihn `tools/lebensmittel_auswahl.py --build` schreibt. */
export interface BasicFoodsFile {
  version: number;
  list: string;
  fields: readonly string[];
  foods: readonly (readonly unknown[])[];
}

const FIELDS = [
  'origin',
  'code',
  'sourceName',
  'name',
  'aliases',
  'unit',
  'pieceGrams',
  'pieceHint',
  'derived',
  ...NUTRIENTS,
] as const;

/**
 * ID eines Grundnahrungsmittels (D-207): aus Quelle und Code, auf allen Geräten gleich. BLS-Codes
 * ergeben dieselben IDs wie der frühere gebündelte BLS (D-301), ältere Einträge finden ihr
 * Lebensmittel also wieder.
 */
export function basicFoodId(origin: BasicOrigin, code: string): string {
  return stableId(`${origin}:${code}`);
}

const isString = (value: unknown): value is string => typeof value === 'string' && value !== '';
const isOrigin = (value: unknown): value is BasicOrigin =>
  (BASIC_ORIGINS as readonly unknown[]).includes(value);
const isUnit = (value: unknown): value is PieceUnit =>
  (PIECE_UNITS as readonly unknown[]).includes(value);
const isNutrient = (value: unknown): value is Nutrient =>
  (NUTRIENTS as readonly unknown[]).includes(value);

function invalid(row: number, what: string): never {
  throw new Error(`Grundauswahl, Zeile ${row + 1}: ${what}`);
}

/** Prüft die Datei und baut Lebensmittel in Anzeigeform; ein Fehler bricht alles ab. */
export function parseBasicFoods(file: BasicFoodsFile): FoodItem[] {
  if (file.version !== 1 || file.fields.join() !== FIELDS.join()) {
    throw new Error('Grundauswahl hat ein unbekanntes Format');
  }
  const ids = new Set<string>();
  return file.foods.map((row, i) => {
    if (row.length !== FIELDS.length) invalid(i, 'Anzahl der Felder');
    const [origin, code, sourceName, name, aliases, unit, pieceGrams, pieceHint, derived] = row;
    const values = row.slice(9);
    if (!isOrigin(origin) || !isString(code) || !isString(sourceName) || !isString(name)) {
      invalid(i, 'Quelle, Code oder Name');
    }
    if (!Array.isArray(aliases) || !aliases.every(isString)) invalid(i, 'Suchbegriffe');
    if (unit !== null && !isUnit(unit)) invalid(i, 'Einheit');
    // Einheit und Richtwert nur zusammen (D-365): ohne Richtwert nur Gramm.
    if (
      (unit === null) !== (pieceGrams === null) ||
      (pieceGrams !== null &&
        (typeof pieceGrams !== 'number' || !(pieceGrams > 0) || pieceGrams > PIECE_GRAMS_MAX))
    ) {
      invalid(i, 'Einheit und Richtwert');
    }
    if (pieceHint !== null && (!isString(pieceHint) || !unit)) invalid(i, 'Hinweis');
    if (!Array.isArray(derived) || !derived.every(isNutrient)) invalid(i, 'abgeleitete Werte');
    const per100: Nutrients = {};
    NUTRIENTS.forEach((nutrient, n) => {
      const value = values[n];
      if (value === null) return;
      if (typeof value !== 'number' || value < 0 || value > NUTRIENT_LIMITS[nutrient]) {
        invalid(i, `Wert ${nutrient}`);
      }
      per100[nutrient] = value;
    });
    if (per100.kcal === undefined) invalid(i, 'Energie fehlt');
    if (derived.some((nutrient: Nutrient) => per100[nutrient] !== 0)) {
      invalid(i, 'abgeleitete Werte müssen 0 sein');
    }
    const id = basicFoodId(origin, code);
    if (ids.has(id)) invalid(i, 'doppelt');
    ids.add(id);
    const basic: BasicFoodInfo = {
      origin,
      code,
      sourceName,
      ...(unit ? { unit } : {}),
      ...(typeof pieceGrams === 'number' ? { listPieceGrams: pieceGrams } : {}),
      ...(isString(pieceHint) ? { pieceHint } : {}),
      derived: Object.freeze([...derived]),
    };
    return {
      id,
      name,
      aliases: Object.freeze([...aliases]),
      basis: 'g' as const,
      per100,
      servings: [],
      source: origin,
      quality: 'verified' as const,
      sourceRef: code,
      basic,
    };
  });
}

let pending: Promise<readonly FoodItem[]> | undefined;

/**
 * Grundauswahl aus dem BLS 4.0 (und drei Lücken aus USDA SR28), erst im Ernährungsbereich geladen
 * und vom Service Worker vorab gespeichert, also auch offline da. Schlägt das Laden fehl, versucht
 * es der nächste Aufruf erneut.
 */
export function loadBasicFoods(): Promise<readonly FoodItem[]> {
  pending ??= import('./basicFoods.json').then(
    (module) => Object.freeze(parseBasicFoods(module.default as BasicFoodsFile)),
    (error: unknown) => {
      pending = undefined;
      throw error;
    },
  );
  return pending;
}
