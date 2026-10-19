import { stableId } from '@/shared/lib/uuid';
import { austrianAliases } from '../calc/austrianTerms';
import type { FoodItem } from '../model/foodItem';
import { NUTRIENTS, type Nutrients } from '../model/nutrition';

interface BlsFile {
  version: 1;
  source: string;
  fields: string[];
  foods: (string | number | null)[][];
}

/** ID eines BLS-Lebensmittels aus seinem Code (D-207): auf allen Geräten dieselbe. */
export function blsFoodId(code: string): string {
  return stableId(`bls:${code}`);
}

/** Prüft die gebündelte Datei und baut Lebensmittel in Anzeigeform. */
export function parseBls(file: BlsFile): FoodItem[] {
  const expected = ['code', 'name', ...NUTRIENTS];
  if (file.fields.join() !== expected.join()) {
    throw new Error('BLS-Datei hat ein unbekanntes Format');
  }
  return file.foods.map((row) => {
    const [code, name, ...values] = row;
    if (typeof code !== 'string' || typeof name !== 'string') {
      throw new Error('BLS-Zeile ohne Code oder Namen');
    }
    const per100: Nutrients = {};
    NUTRIENTS.forEach((nutrient, i) => {
      const value = values[i];
      if (typeof value === 'number') per100[nutrient] = value;
    });
    return {
      id: blsFoodId(code),
      name,
      aliases: austrianAliases(name),
      basis: 'g' as const,
      per100,
      servings: [],
      source: 'bls' as const,
      quality: 'verified' as const,
      sourceRef: code,
    };
  });
}

let pending: Promise<readonly FoodItem[]> | undefined;

/**
 * Bundeslebensmittelschlüssel 4.0 (D-301): gebündelt, erst im Ernährungsbereich geladen und vom
 * Service Worker vorab gespeichert, also offline verfügbar.
 */
export function loadBls(): Promise<readonly FoodItem[]> {
  pending ??= import('./bls-4.0.json').then(
    (module) => Object.freeze(parseBls(module.default as BlsFile)),
    (error: unknown) => {
      pending = undefined;
      throw error;
    },
  );
  return pending;
}
