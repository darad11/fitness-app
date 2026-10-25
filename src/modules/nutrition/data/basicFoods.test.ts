import { describe, expect, it } from 'vitest';
import { stableId } from '@/shared/lib/uuid';
import { tMore } from '@/shared/i18n/de-more';
import { buildFoodIndex, searchFoods } from '../calc/foodSearch';
import { BASIC_ORIGINS } from '../model/basicFood';
import type { FoodItem } from '../model/foodItem';
import file from './basicFoods.json';
import { basicFoodId, loadBasicFoods, parseBasicFoods, type BasicFoodsFile } from './basicFoods';

const data = file as BasicFoodsFile;
const foods = parseBasicFoods(data);
const byName = (name: string): FoodItem => {
  const food = foods.find((f) => f.name === name);
  if (!food) throw new Error(`fehlt: ${name}`);
  return food;
};
const index = buildFoodIndex(foods);
const first = (query: string) => searchFoods(index, query)[0]?.name;

describe('Grundauswahl (Phase Ernährung §6, D-362)', () => {
  it('enthält die freigegebene Liste ohne die Lücken für Open Food Facts', () => {
    expect(foods).toHaveLength(361);
    expect(foods.filter((f) => f.basic?.origin === 'usda').map((f) => f.name)).toEqual([
      'Butternusskürbis',
      'Pfefferoni',
      'Magermilch',
    ]);
    for (const missing of ['Käferbohnen', 'Knödelbrot', 'Sauerrahm 15 %', 'Rote Zwiebel']) {
      expect(foods.some((f) => f.name === missing)).toBe(false);
    }
  });

  it('bildet feste IDs aus Quelle und Code, beim BLS wie der frühere gebündelte BLS', () => {
    expect(new Set(foods.map((f) => f.id)).size).toBe(foods.length);
    const apfel = byName('Apfel');
    expect(apfel.id).toBe(stableId('bls:F110100'));
    expect(apfel.id).toBe(basicFoodId('bls', 'F110100'));
    expect(byName('Pfefferoni').id).toBe(stableId('usda:11670'));
  });

  it('übernimmt Richtwerte, Einheiten, Hinweise und Suchbegriffe aus der Liste (D-365)', () => {
    expect(byName('Ei').basic).toMatchObject({
      unit: 'Stück',
      listPieceGrams: 51,
      pieceHint: 'Größe M, ohne Schale',
    });
    expect(byName('Semmel').basic).toMatchObject({
      listPieceGrams: 46,
      pieceHint: 'Mindestgewicht laut Codex',
    });
    expect(byName('Apfel').basic).toMatchObject({
      unit: 'Stück',
      listPieceGrams: 158,
      pieceHint: 'ohne Kerngehäuse',
    });
    expect(byName('Banane').basic).toMatchObject({ listPieceGrams: 120, pieceHint: 'ohne Schale' });
    // Avocado nach DTU 2013 für die hier übliche Sorte Hass (D-368); Medjool ohne europäische Quelle.
    expect(byName('Avocado').basic).toMatchObject({
      listPieceGrams: 145,
      pieceHint: 'Hass, ohne Schale und Kern',
    });
    expect(foods.some((food) => /Medjool/i.test(food.name))).toBe(false);
    expect(byName('Knoblauch').basic).toMatchObject({ unit: 'Zehe', listPieceGrams: 2 });
    expect(byName('Schwarzbrot').basic).toMatchObject({ unit: 'Scheibe', listPieceGrams: 50 });
    expect(byName('Gouda').basic).toMatchObject({ unit: 'Scheibe', listPieceGrams: 20 });
    // Ohne Richtwert keine Einheit: nur Gramm, ohne Frage.
    for (const name of ['Kochschinken', 'Mandarine', 'Toastbrot', 'Brokkoli', 'Kürbis, Hokkaido']) {
      expect(byName(name).basic?.unit, name).toBeUndefined();
      expect(byName(name).basic?.listPieceGrams, name).toBeUndefined();
    }
    // Jede Einheit hat einen Richtwert und umgekehrt; 47 Richtwerte.
    const withUnit = foods.filter((food) => food.basic?.unit !== undefined);
    expect(withUnit.every((food) => (food.basic?.listPieceGrams ?? 0) > 0)).toBe(true);
    expect(foods.filter((food) => food.basic?.listPieceGrams !== undefined)).toHaveLength(47);
    expect(new Set(withUnit.map((food) => food.basic?.unit))).toEqual(
      new Set(['Stück', 'Scheibe', 'Zehe']),
    );
    expect(byName('Zwiebel').aliases).toContain('rote Zwiebel');
    expect(byName('Magermilch').aliases).toEqual(['Milch 0,5 %', 'entrahmte Milch']);
  });

  it('zeigt Werte des BLS unverändert und fehlende als fehlend, nicht als 0', () => {
    expect(byName('Ei').per100).toEqual({
      kcal: 135,
      protein: 13.18,
      carbs: 0.34,
      sugar: 0.34,
      fat: 9,
      saturatedFat: 2.44,
      fiber: 0,
      salt: 0.39,
    });
    expect(byName('Orangensaft').per100.fat).toBeUndefined();
    expect(byName('Honig').per100.fiber).toBeUndefined();
    expect(byName('Margarine').per100.fiber).toBeUndefined();
  });

  it('kennzeichnet abgeleitete 0 g nach der Regel D-361', () => {
    const derived = foods.filter((f) => (f.basic?.derived.length ?? 0) > 0);
    expect(derived.map((f) => f.name).sort()).toEqual(
      [
        'Butter',
        'Crème fraîche',
        'Feta',
        'Kokosöl',
        'Lachs, roh',
        'Mascarpone',
        'Mozzarella',
        'Pangasius',
        'Räuchermakrele',
        'Ricotta',
        'Schweineschmalz',
        'Seelachs',
        'Thunfisch im eigenen Saft',
      ].sort(),
    );
    expect(byName('Feta').basic?.derived).toEqual(['fiber']);
    expect(byName('Feta').per100.fiber).toBe(0);
    expect(byName('Kokosöl').basic?.derived).toEqual(['protein']);
    expect(byName('Kokosöl').per100.protein).toBe(0);
  });

  it('rechnet die USDA-Lücken nach den EU-Regeln um', () => {
    expect(byName('Pfefferoni').per100).toEqual({
      kcal: 45,
      protein: 2,
      carbs: 7.96,
      sugar: 5.1,
      fat: 0.2,
      saturatedFat: 0.02,
      fiber: 1.5,
      salt: 0.02,
    });
    expect(byName('Butternusskürbis').per100).toMatchObject({ kcal: 48, carbs: 9.69, salt: 0.01 });
    expect(byName('Magermilch').per100).toMatchObject({ kcal: 34, carbs: 4.96, salt: 0.11 });
    expect(byName('Pfefferoni').basic).toMatchObject({
      origin: 'usda',
      code: '11670',
      sourceName: 'Peppers, hot chili, green, raw',
    });
  });

  it('nennt für jede Quelle der Grundauswahl Herkunft und Lizenz unter „Über die App“', () => {
    for (const origin of BASIC_ORIGINS) {
      expect(tMore.about.dataSources[origin].text.length).toBeGreaterThan(40);
    }
    expect(tMore.about.dataSources.bls.text).toContain('DOI 10.25826/Data20251217-134202-0');
    expect(tMore.about.dataSources.usda.text).toContain('Release 28');
    expect(tMore.about.dataSources.off.text).toContain('ODbL');
  });

  it('lädt die Datei nachträglich und nur einmal', async () => {
    const [a, b] = await Promise.all([loadBasicFoods(), loadBasicFoods()]);
    expect(a).toBe(b);
    expect(a).toHaveLength(361);
  });

  it('lehnt eine Datei mit falschem Aufbau oder falschen Werten ab', () => {
    const row = data.foods[0] ?? [];
    const changed = (at: number, value: unknown): BasicFoodsFile => ({
      ...data,
      foods: [row.map((old, i) => (i === at ? value : old))],
    });
    expect(() => parseBasicFoods({ ...data, fields: data.fields.slice(1) })).toThrow();
    expect(() => parseBasicFoods({ ...data, version: 2 })).toThrow();
    expect(() => parseBasicFoods(changed(0, 'oenwt'))).toThrow();
    expect(() => parseBasicFoods(changed(5, 'Laib'))).toThrow();
    // Einheit und Richtwert nur zusammen (D-365); „Stange“ und „Kolben“ gibt es nicht mehr.
    expect(() => parseBasicFoods(changed(5, 'Stück'))).toThrow(/Einheit und Richtwert/);
    expect(() => parseBasicFoods(changed(6, 120))).toThrow(/Einheit und Richtwert/);
    const withUnit = (unit: string, grams: number): BasicFoodsFile => ({
      ...data,
      foods: [row.map((old, i) => (i === 5 ? unit : i === 6 ? grams : old))],
    });
    expect(parseBasicFoods(withUnit('Stück', 120))[0]?.basic?.listPieceGrams).toBe(120);
    expect(() => parseBasicFoods(withUnit('Stange', 120))).toThrow(/Einheit/);
    expect(() => parseBasicFoods(withUnit('Stück', 5001))).toThrow(/Einheit und Richtwert/);
    expect(() => parseBasicFoods(changed(8, ['fiber']))).toThrow(/0 sein/);
    expect(() => parseBasicFoods(changed(9, 1200))).toThrow();
    expect(() => parseBasicFoods({ ...data, foods: [row, row] })).toThrow(/doppelt/);
  });
});

describe('Suche in der Grundauswahl (Phase Ernährung §6)', () => {
  it.each([
    ['Apfel', 'Apfel'],
    ['Äpfel', 'Apfel'],
    ['Aepfel', 'Apfel'],
    ['apfel', 'Apfel'],
    ['Ei', 'Ei'],
    ['Eier', 'Ei'],
    ['Tomate', 'Paradeiser'],
    ['Tomaten', 'Paradeiser'],
    ['Paradeiser', 'Paradeiser'],
    ['Topfen', 'Topfen 10 %'],
  ])('„%s“ findet zuerst „%s“', (query, expected) => {
    expect(first(query)).toBe(expected);
  });

  it('„Erdäpfel“ findet die Erdäpfel und keine Äpfel', () => {
    const names = searchFoods(index, 'Erdäpfel').map((f) => f.name);
    expect(names.slice(0, 4)).toEqual([
      'Erdäpfel, roh',
      'Erdäpfel, gekocht',
      'Erdäpfel in der Schale, gekocht',
      'Ofenerdäpfel',
    ]);
    expect(names).not.toContain('Apfel');
  });

  it('findet schon beim Tippen, bevor das Wort fertig ist', () => {
    expect(first('Erdäp')).toBe('Erdäpfel, roh');
    expect(first('Parad')).toBe('Paradeiser');
    expect(first('Seel')).toBe('Seelachs');
    expect(first('Knob')).toBe('Knoblauch');
    // Ganze Wörter bleiben vor falschen Freunden geschützt.
    expect(searchFoods(index, 'Butter').map((f) => f.name)).not.toContain('Butternusskürbis');
    expect(searchFoods(index, 'Apfel').map((f) => f.name)).not.toContain('Granatapfel');
  });

  it('findet über die Suchbegriffe der Liste', () => {
    expect(first('Beinschinken')).toBe('Kochschinken');
    expect(first('Leichtmilch')).toBe('Milch 1,5 %');
    expect(first('Kale')).toBe('Grünkohl');
    expect(first('rote Zwiebel')).toBe('Zwiebel');
    expect(first('Würstel')).toBe('Frankfurter');
    expect(first('Konfitüre')).toBe('Marmelade');
  });
});
