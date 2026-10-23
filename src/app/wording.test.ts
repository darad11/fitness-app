import { describe, expect, it } from 'vitest';
import coreExercises from '@/modules/exercises/data/core-exercises.v1.json';
import programs from '@/modules/training/data/programs.v1.json';
import sampleTemplates from '@/modules/training/data/sample-templates.v1.json';
import { de } from '@/shared/i18n/de';
import { tNutrition } from '@/shared/i18n/de-nutrition';
import { tProgramEditor } from '@/shared/i18n/de-program-editor';
import { tShopping } from '@/shared/i18n/de-shopping';
import { tSync } from '@/shared/i18n/de-sync';
import { tTaskStats } from '@/shared/i18n/de-task-stats';
import { tWater } from '@/shared/i18n/de-water';
import script from '../../public/theme-init.js?raw';

/**
 * Wortfeld-Prüfung (Rebranding F4, D-318) nach `form-markenleitplanken.md` Regel 2 und 4 und den
 * Prüffragen in Abschnitt 5: Produkttexte ohne Ausrufezeichen, ohne Emojis, ohne gestrichene
 * Wörter und ohne Serien- oder Challenge-Zähler. Geprüft werden alle Textkataloge (Funktionen
 * werden mit Zahlen und mit Text aufgerufen) und die Texte der gebündelten Programme, Vorlagen
 * und Übungen.
 */

type Entry = readonly [path: string, text: string];

const CATALOGS = {
  de,
  tNutrition,
  tProgramEditor,
  tShopping,
  tSync,
  tTaskStats,
  tWater,
};

/** Texte der Stammdaten, die die App anzeigt (der Teil der Adresse `slug` eingeschlossen). */
const DATA_TEXT_KEYS = new Set([
  'name',
  'description',
  'source',
  'note',
  'originalName',
  'aliases',
  'slug',
]);

function catalogTexts(value: unknown, path: string, out: Entry[] = []): Entry[] {
  if (typeof value === 'string') out.push([path, value]);
  else if (typeof value === 'function') {
    const fn = value as (...args: unknown[]) => unknown;
    for (const arg of [1, 2, 'X']) {
      let result: unknown;
      try {
        result = fn(...Array<unknown>(fn.length).fill(arg));
      } catch {
        continue; // Argument passt nicht zu dieser Funktion
      }
      catalogTexts(result, `${path}(${String(arg)})`, out);
    }
  } else if (Array.isArray(value)) {
    value.forEach((item: unknown, i) => catalogTexts(item, `${path}[${String(i)}]`, out));
  } else if (value !== null && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) catalogTexts(item, `${path}.${key}`, out);
  }
  return out;
}

function dataTexts(value: unknown, path: string, key = '', out: Entry[] = []): Entry[] {
  if (typeof value === 'string') {
    if (DATA_TEXT_KEYS.has(key)) out.push([path, value]);
  } else if (Array.isArray(value)) {
    value.forEach((item: unknown, i) => dataTexts(item, `${path}[${String(i)}]`, key, out));
  } else if (value !== null && typeof value === 'object') {
    for (const [k, item] of Object.entries(value)) dataTexts(item, `${path}.${k}`, k, out);
  }
  return out;
}

const ALL: Entry[] = [
  ...Object.entries(CATALOGS).flatMap(([name, catalog]) => catalogTexts(catalog, name)),
  ...dataTexts(programs, 'programs'),
  ...dataTexts(sampleTemplates, 'sampleTemplates'),
  ...dataTexts(coreExercises, 'coreExercises'),
];

/**
 * Eigennamen, die stehen bleiben: der Name der Schrittzählung im Dashboard des Produktinhabers
 * (Datenquelle, D-277). Programm C nennt keine Quelle mehr (F5, D-328).
 */
const PROPER_NAMES = ['Step Challenge'];

/** Regel und Beispiel aus den Leitplanken. */
const RULES: readonly (readonly [string, RegExp])[] = [
  ['Ausrufezeichen', /!/],
  ['Emoji', /\p{Extended_Pictographic}/u],
  ['Beast Mode', /beast\s*mode/i],
  ['Grind', /\bgrind/i],
  ['Winter Arc', /winter[\s_-]*arc/i],
  // Keine Hinweise auf die fremde App, deren Programm Vorlage für Programm C war (F5, D-328).
  ['Name der fremden App', /xeela/i],
  ['Nachbau', /nachbau/i],
  ['Challenge', /challenge/i],
  ['Bestform', /bestform/i],
  ['Cheat Day', /cheat\s*day/i],
  ['verbrennen', /verbrenn/i],
  ['Disziplin heute', /disziplin heute/i],
  ['Starke Leistung', /starke leistung/i],
  ['Streak', /streak/i],
  ['Serie', /\bserien?\b/i],
  ['in Folge', /\bin folge\b/i],
  ['Flamme', /flamme/i],
  ['Transformation', /transformation/i],
  ['durchstarten', /durchstarten/i],
  ['Push harder', /push harder/i],
  ['eine Maschine', /\beine maschine\b/i],
  ['Weiter so', /weiter so/i],
  ['Noch keine Daten', /noch keine daten/i],
  ['Kein Training geplant', /kein training geplant/i],
];

describe('Wortfeld-Prüfung der Produkttexte (F4, D-318)', () => {
  it('findet genug Texte, um aussagekräftig zu sein', () => {
    expect(ALL.length).toBeGreaterThan(1500);
  });

  it.each(RULES)('kein Text enthält „%s“', (_name, pattern) => {
    const hits = ALL.filter(([, text]) => {
      const cleaned = PROPER_NAMES.reduce((rest, name) => rest.split(name).join(''), text);
      return pattern.test(cleaned);
    });
    expect(hits).toEqual([]);
  });
});

describe('Mikrotexte aus den Leitplanken (Abschnitt 4)', () => {
  it('Training beendet: Minuten, Übungen, Sätze und „Das warst du.“', () => {
    expect(de.summary.doneLine(48, 5, 18)).toBe('48 Minuten, 5 Übungen, 18 Sätze. Das warst du.');
    expect(de.summary.doneLine(1, 1, 1)).toBe('1 Minute, 1 Übung, 1 Satz. Das warst du.');
    expect(de.summary.doneLine(0, 2, 3)).toBe(
      'Weniger als eine Minute, 2 Übungen, 3 Sätze. Das warst du.',
    );
  });

  it('Leerzustände, Ruhetag und Ziel erreicht', () => {
    expect(de.progress.emptyTitle).toBe('Fortschritt braucht ein paar Tage.');
    expect(de.progress.emptyText).toBe('Er zeigt dich gegen dich, nicht gegen andere.');
    expect(de.history.emptyTitle).toBe('Hier erscheint dein erstes Training.');
    expect(de.today.restPlanned).toBe('Heute ist Pause eingeplant.');
    expect(de.steps.targetReached).toBe('Ziel erreicht. Das warst du.');
  });
});

describe('Startwächter in public/theme-init.js (E-16, D-343)', () => {
  // Das Skript läuft vor dem Bündel und kann den Textkatalog nicht laden; die Texte stehen dort
  // gleich lautend und werden hier verglichen.
  const text = (name: string) => new RegExp(`var ${name} = '([^']*)';`).exec(script)?.[1];

  it('nutzt dieselben Texte wie die App', () => {
    expect(text('TITLE')).toBe(de.errors.startTitle);
    expect(text('TEXT')).toBe(de.errors.chunkText);
    expect(text('BUTTON')).toBe(de.common.reload);
  });

  it('hält die Leitplanken ein', () => {
    for (const value of [text('TITLE'), text('TEXT'), text('BUTTON')]) {
      expect(value).toBeDefined();
      expect(value).not.toMatch(/!|\p{Extended_Pictographic}/u);
    }
  });
});
