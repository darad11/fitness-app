import { describe, expect, it } from 'vitest';
import { austrianAliases } from './austrianTerms';
import { buildFoodIndex, searchFoods } from './foodSearch';
import { kcalMismatch, kjToKcal, missingCore, scaleNutrients, sumEntries } from './nutrients';
import { activeTarget, basalMetabolicRate, suggestTarget, targetOn } from './targets';

describe('Nährwerte (NU-05, NU-22)', () => {
  it('rechnet je Menge um und lässt fehlende Werte fehlen', () => {
    expect(scaleNutrients({ kcal: 343, protein: 11.38, fat: 7.09, carbs: 53.7 }, 50)).toEqual({
      kcal: 171.5,
      protein: 5.69,
      fat: 3.55,
      carbs: 26.85,
    });
  });

  it('summiert einen Tag wie per Hand und markiert Lücken und Schätzungen', () => {
    const totals = sumEntries([
      {
        nutrients: { kcal: 171.5, protein: 5.69, carbs: 26.85, fat: 3.55, sugar: 0.5 },
        isEstimated: false,
      },
      { nutrients: { kcal: 250.3, protein: 20, carbs: 1, fat: 18 }, isEstimated: false },
      { nutrients: { kcal: 400 }, isEstimated: true },
    ]);
    expect(totals.sums.kcal).toBe(821.8);
    expect(totals.sums.protein).toBe(25.7);
    expect(totals.incomplete).toEqual([
      'protein',
      'carbs',
      'sugar',
      'fat',
      'saturatedFat',
      'fiber',
      'salt',
    ]);
    expect(totals.estimated).toBe(true);
    expect(totals.count).toBe(3);
  });

  it('prüft Pflichtwerte und die Energie nach 4/4/9', () => {
    expect(missingCore({ kcal: 100, protein: 1 })).toEqual(['carbs', 'fat']);
    expect(kcalMismatch({ kcal: 343, protein: 11.4, carbs: 53.7, fat: 7.1 })).toBeNull();
    expect(kcalMismatch({ kcal: 100, protein: 20, carbs: 20, fat: 10 })).toBe(250);
    expect(kjToKcal(1443)).toBe(345);
  });
});

describe('Zielvorschlag (NU-01, D-262)', () => {
  const now = new Date(2026, 9, 19);
  const inputs = {
    sex: 'male' as const,
    birthYear: 1990,
    heightCm: 180,
    weightKg: 80,
    activity: 'moderate' as const,
    direction: 'maintain' as const,
  };

  it('rechnet den Grundumsatz nach Mifflin-St Jeor', () => {
    // 10 × 80 + 6,25 × 180 − 5 × 36 + 5 = 1750
    expect(basalMetabolicRate(inputs, now)).toBe(1750);
    expect(basalMetabolicRate({ ...inputs, sex: 'female' }, now)).toBe(1584);
  });

  it('schlägt Energie und Makros vor', () => {
    // 1750 × 1,55 = 2712,5 → 2710 kcal; Eiweiß 144 g; Fett 30 % = 90 g; Rest Kohlenhydrate.
    expect(suggestTarget(inputs, now)).toEqual({
      kcal: 2710,
      proteinG: 144,
      fatG: 90,
      carbsG: 331,
    });
    expect(suggestTarget({ ...inputs, direction: 'lose' }, now).kcal).toBe(2210);
    expect(suggestTarget({ ...inputs, direction: 'gain' }, now).kcal).toBe(3010);
  });

  it('findet das aktive und das an einem Tag gültige Ziel', () => {
    const a = { effectiveFrom: '2026-10-01', hlc: 'a', endedAt: '2026-10-10T08:00:00.000Z' };
    const b = { effectiveFrom: '2026-10-10', hlc: 'b' };
    expect(activeTarget([a, b])).toBe(b);
    expect(targetOn([a, b], '2026-10-05')).toBe(a);
    expect(targetOn([a, b], '2026-10-10')).toBe(b);
    expect(targetOn([a, b], '2026-09-30')).toBeUndefined();
  });
});

describe('Suche mit österreichischen Bezeichnungen (D-306)', () => {
  const items = [
    { id: '1', name: 'Speisequark mager', aliases: austrianAliases('Speisequark mager') },
    { id: '2', name: 'Kartoffel gekocht', aliases: austrianAliases('Kartoffel gekocht') },
    {
      id: '3',
      name: 'Kartoffelpüree mit Milch und Butter',
      aliases: austrianAliases('Kartoffelpüree'),
    },
    { id: '4', name: 'Tomate roh', aliases: austrianAliases('Tomate roh') },
    { id: '5', name: 'Haferflocken', aliases: [], brand: 'Spar' },
  ];
  const index = buildFoodIndex(items);

  it('findet über österreichische Begriffe', () => {
    expect(austrianAliases('Speisequark mager')).toEqual(['Topfen']);
    expect(searchFoods(index, 'topfen').map((f) => f.id)).toEqual(['1']);
    expect(searchFoods(index, 'paradeiser').map((f) => f.id)).toEqual(['4']);
    expect(searchFoods(index, 'erdäpfel').map((f) => f.id)).toEqual(['2', '3']);
  });

  it('sortiert Namenstreffer vor Alias und kurze Namen zuerst', () => {
    expect(searchFoods(index, 'kartoffel').map((f) => f.id)).toEqual(['2', '3']);
    expect(searchFoods(index, 'spar').map((f) => f.id)).toEqual(['5']);
    expect(searchFoods(index, '  ')).toEqual([]);
  });
});
