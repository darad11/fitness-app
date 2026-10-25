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

/**
 * Tagesreferenz unter „Weitere Nährwerte“ (D-359, kompakt seit D-363): „höchstens“ und
 * „mindestens“ stehen nur noch im Info-Blatt, ebenso die Einträge ohne Angabe und die Quellen.
 */
describe('Info-Blatt zu „Weitere Nährwerte“', () => {
  it('sagt „höchstens“ und „mindestens“ ohne Lob', () => {
    expect(tNutrition.reference.atMost('6')).toBe('höchstens 6 g');
    expect(tNutrition.reference.atLeast('30')).toBe('mindestens 30 g');
  });

  it('nennt höchstens drei Einträge ohne Angabe, dann die Anzahl der übrigen', () => {
    expect(tNutrition.reference.missingNames(['Apfel'])).toBe('Apfel');
    expect(tNutrition.reference.missingNames(['Apfel', 'Müsli', 'Brot'])).toBe(
      'Apfel, Müsli und Brot',
    );
    expect(tNutrition.reference.missingNames(['Apfel', 'Müsli', 'Brot', 'Topfen', 'Kaffee'])).toBe(
      'Apfel, Müsli, Brot und 2 weitere',
    );
  });

  it('erklärt das Sternchen und nennt die Quellen und die Grenze beim freien Zucker', () => {
    expect(tNutrition.reference.asterisk).toMatch(/^\* Bei mindestens einem Eintrag fehlt/);
    expect(tNutrition.reference.asterisk).toContain('zählt nicht als 0');
    expect(tNutrition.reference.sources).toContain('VO (EU) Nr. 1169/2011, Anhang XIII');
    expect(tNutrition.reference.sources).toContain('Deutschen Gesellschaft für Ernährung (DGE)');
    expect(tNutrition.reference.sources).toContain('freien Zucker unter 10 % der Energie');
    expect(tNutrition.reference.sheetIntro).toContain('keine medizinische Empfehlung');
    for (const text of [
      tNutrition.reference.sources,
      tNutrition.reference.asterisk,
      tNutrition.reference.sheetIntro,
    ]) {
      expect(text).not.toMatch(/!/);
    }
  });
});

/** Spaltenkopf und Anzeige bei Stück und Scheibe (D-364): Einzahl nur bei genau 1. */
describe('Anzahl mit Einheit', () => {
  it('setzt die Mehrzahl, „Stück“ bleibt gleich', () => {
    expect(tNutrition.basic.pieces(1, '1', 'Scheibe')).toBe('1 Scheibe');
    expect(tNutrition.basic.pieces(2, '2', 'Scheibe')).toBe('2 Scheiben');
    expect(tNutrition.basic.pieces(1.5, '1,5', 'Scheibe')).toBe('1,5 Scheiben');
    expect(tNutrition.basic.pieces(0.5, '0,5', 'Scheibe')).toBe('0,5 Scheiben');
    expect(tNutrition.basic.pieces(2, '2', 'Stück')).toBe('2 Stück');
    expect(tNutrition.basic.pieces(3, '3', 'Zehe')).toBe('3 Zehen');
    expect(tNutrition.forAmount(tNutrition.basic.pieces(2, '2', 'Stück'))).toBe('für 2 Stück');
  });
});

/** Quellenzeile unter der Nährwerttabelle (D-362, D-366). */
describe('Quelle unter der Nährwerttabelle', () => {
  it('nennt BLS mit Code und Bezeichnung; Zahl und Prozentzeichen brechen nicht um', () => {
    expect(tNutrition.basic.source.bls('E111100', 'Hühnerei roh')).toBe(
      'Quelle: BLS 4.0, E111100 „Hühnerei roh“',
    );
    expect(tNutrition.basic.source.bls('M012200', 'Feta mind. 45 % Fett i. Tr.')).toBe(
      'Quelle: BLS 4.0, M012200 „Feta mind. 45\u00a0% Fett i. Tr.“',
    );
    expect(tNutrition.basic.source.usda('11670', 'Peppers, hot chili, green, raw')).toBe(
      'Quelle: USDA SR28, 11670 „Peppers, hot chili, green, raw“, umgerechnet nach EU-Regeln',
    );
  });
});
