import { describe, expect, it } from 'vitest';
import { tNutrition } from './de-nutrition';

/**
 * Hinweis auf fehlende Nährwerte (D-326, D-341): „Werte für“ statt „Angaben zu“, weil „für“ mit
 * jeder Auswahl an Nährstoffen grammatisch stimmt („Angaben zu gesättigte Fettsäuren“ nicht).
 */
describe('Hinweis auf fehlende Nährwerte', () => {
  const names = ['Zucker', 'gesättigte Fettsäuren', 'Ballaststoffe', 'Salz'];

  it('Tagesübersicht: „Werte für“ und die Nährstoffe als Aufzählung', () => {
    expect(tNutrition.incomplete(names)).toBe(
      'Bei mindestens einem Eintrag fehlen Werte für Zucker, gesättigte Fettsäuren, Ballaststoffe und Salz.',
    );
    expect(tNutrition.incomplete(['gesättigte Fettsäuren'])).toBe(
      'Bei mindestens einem Eintrag fehlen Werte für gesättigte Fettsäuren.',
    );
  });

  it('Rezept: ebenso „Werte für“', () => {
    expect(tNutrition.recipes.missingHint(names)).toBe(
      'Bei mindestens einer Zutat fehlen Werte für Zucker, gesättigte Fettsäuren, Ballaststoffe und Salz. In der Summe fehlen sie deshalb.',
    );
  });
});
