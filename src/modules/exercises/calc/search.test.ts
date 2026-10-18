import { describe, expect, it } from 'vitest';
import { loadCoreExercises } from '../data/coreLibrary';
import type { Equipment, Muscle } from '../model/exercise';
import { buildSearchIndex, compareExerciseNames, searchExercises } from './search';

const core = await loadCoreExercises();
const index = buildSearchIndex(core);
const names = (query: string, muscle?: Muscle, equipment?: Equipment) =>
  searchExercises(index, { query, muscle, equipment }).map((exercise) => exercise.name);

describe('Übungssuche (AK-EXL-02)', () => {
  it('findet unabhängig von Groß- und Kleinschreibung', () => {
    expect(names('LATZIEHEN')).toEqual(['Latziehen', 'Latziehen, enger Griff']);
  });

  it('findet Umlaute in jeder Schreibweise (ä, ae, a)', () => {
    for (const query of ['schrägbank', 'schraegbank', 'schragbank']) {
      expect(names(query)).toEqual([
        'Schrägbank-Curls mit Kurzhanteln',
        'Schrägbankdrücken mit Kurzhanteln',
        'Schrägbankdrücken mit Langhantel',
      ]);
    }
    expect(names('Hüftheben')).toEqual(['Hüftheben am Boden (Glute Bridge)']);
    expect(names('Hueftheben')).toEqual(['Hüftheben am Boden (Glute Bridge)']);
  });

  it('ignoriert Bindestriche und Leerzeichen', () => {
    expect(names('t bar')).toEqual(['T-Bar-Rudern']);
    expect(names('tbar')).toEqual(['T-Bar-Rudern']);
    expect(names('step ups')).toEqual(['Step-ups mit Kurzhanteln']);
    expect(names('kh bankdrücken')).toEqual(['Bankdrücken mit Kurzhanteln']);
  });

  it('findet englische und deutsche Alias-Namen', () => {
    expect(names('bench press')).toEqual(
      expect.arrayContaining(['Bankdrücken mit Langhantel', 'Enges Bankdrücken']),
    );
    expect(names('deadlift')[0]).toBe('Kreuzheben mit Langhantel');
    expect(names('RDL')).toEqual([
      'Einbeiniges Rumänisches Kreuzheben mit Kurzhantel',
      'Rumänisches Kreuzheben mit Kurzhanteln',
      'Rumänisches Kreuzheben mit Langhantel',
    ]);
    expect(names('enger griff')).toContain('Rudern am Kabel, sitzend');
  });

  it('verlangt alle Wörter in einem Namen oder Alias, in beliebiger Reihenfolge', () => {
    expect(names('kurzhanteln rudern')).toEqual(['Rudern mit Kurzhanteln, vorgebeugt']);
    expect(names('bankdrücken xyz')).toEqual([]);
  });

  it('stellt Namen, die mit der Suche beginnen, vor Treffer im Namen und im Alias', () => {
    const result = names('kniebeuge');
    expect(result.slice(0, 2)).toEqual([
      'Kniebeuge an der Multipresse',
      'Kniebeuge mit Langhantel',
    ]);
    expect(result).toContain('Bulgarische Kniebeuge mit Kurzhanteln');
    expect(result.at(-1)).toBe('Goblet Squat');
  });

  it('filtert nach Hauptmuskel und Gerät, auch kombiniert mit der Suche', () => {
    const calves = names('', 'calves');
    expect(calves).toEqual(
      [
        'Wadenheben an der Beinpresse',
        'Wadenheben sitzend',
        'Wadenheben stehend',
        'Seilspringen',
      ].sort((a, b) => compareExerciseNames({ name: a }, { name: b })),
    );
    expect(names('', 'chest', 'machine')).toEqual([
      'Brustpresse an der Maschine',
      'Butterfly an der Maschine',
      'Dips mit Unterstützung',
    ]);
    expect(names('dips', undefined, 'machine')).toEqual(['Dips mit Unterstützung']);
    expect(names('', 'full_body', 'cardio_machine')).toEqual([
      'Crosstrainer',
      'Laufband',
      'Rudergerät',
    ]);
  });

  it('liefert ohne Suche und Filter alle Übungen alphabetisch', () => {
    const all = names('');
    expect(all).toHaveLength(105);
    expect(all[0]).toBe('Abduktorenmaschine');
    expect(names('   ')).toEqual(all);
  });

  it('antwortet bei 500 Übungen in unter 100 ms', () => {
    const base = core;
    const many = Array.from({ length: 500 }, (_, i) => {
      const exercise = base[i % base.length]!;
      return { ...exercise, name: `${exercise.name} ${String(i)}` };
    });
    const bigIndex = buildSearchIndex(many);
    const start = performance.now();
    for (const query of ['b', 'bank', 'schraegbank kurz', 'deadlift', 'zzz']) {
      searchExercises(bigIndex, { query });
    }
    searchExercises(bigIndex, { query: 'rudern', muscle: 'lats', equipment: 'cable' });
    const perQuery = (performance.now() - start) / 6;
    expect(perQuery).toBeLessThan(100);
  });
});
