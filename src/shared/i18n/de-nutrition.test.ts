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

/** Ist und Tagesreferenz (D-359): „höchstens“, „mindestens“ und Einträge ohne Angabe. */
describe('Tagesreferenz unter „Weitere Nährwerte“', () => {
  it('sagt „höchstens“ und „mindestens“ ohne Lob', () => {
    expect(tNutrition.reference.atMost('6')).toBe('von höchstens 6 g');
    expect(tNutrition.reference.atLeast('30')).toBe('von mindestens 30 g');
  });

  it('nennt höchstens drei Einträge ohne Angabe, dann die Anzahl der übrigen', () => {
    expect(tNutrition.reference.missing(['Apfel'])).toBe('Ohne Angabe, nicht mitgezählt: Apfel.');
    expect(tNutrition.reference.missing(['Apfel', 'Müsli', 'Brot'])).toBe(
      'Ohne Angabe, nicht mitgezählt: Apfel, Müsli und Brot.',
    );
    expect(tNutrition.reference.missing(['Apfel', 'Müsli', 'Brot', 'Topfen', 'Kaffee'])).toBe(
      'Ohne Angabe, nicht mitgezählt: Apfel, Müsli, Brot und 2 weitere.',
    );
  });

  it('sagt es einmal, wenn dieselben Einträge bei allen vier Werten fehlen', () => {
    expect(tNutrition.reference.missingAll(['Schnelleintrag'])).toBe(
      'Ohne Angabe bei allen vier Werten, nicht mitgezählt: Schnelleintrag.',
    );
  });

  it('nennt die Quellen und die Grenze beim freien Zucker', () => {
    expect(tNutrition.reference.sources).toContain('VO (EU) Nr. 1169/2011, Anhang XIII');
    expect(tNutrition.reference.sources).toContain('Deutschen Gesellschaft für Ernährung (DGE)');
    expect(tNutrition.reference.sources).toContain('freien Zucker unter 10 % der Energie');
    expect(tNutrition.reference.sources).not.toMatch(/!/);
  });
});
