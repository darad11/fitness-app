import { describe, expect, it } from 'vitest';
import type { Week } from '../model/program';
import {
  addDay,
  addDropSet,
  addExercise,
  addSet,
  addWeek,
  duplicateDay,
  duplicateWeek,
  moveDay,
  moveExercise,
  moveWeek,
  PlanEditError,
  removeDay,
  removeExercise,
  removeSet,
  removeWeek,
  renameWeek,
  replaceExercise,
  updateDay,
  updateExercise,
  updateSet,
} from './programEdit';

// Fortlaufend über alle Aufrufe, damit keine ID doppelt vorkommt.
let counter = 0;
function ids() {
  return () => `id-${String(++counter)}`;
}

const squat = { id: 'ex-squat', name: 'Kniebeuge', trackingMode: 'weight_reps' as const };
const plank = { id: 'ex-plank', name: 'Plank', trackingMode: 'time' as const };
const run = { id: 'ex-run', name: 'Laufband', trackingMode: 'time_distance' as const };

function base(): Week[] {
  return [
    {
      id: 'w1',
      position: 0,
      name: 'Woche 1',
      days: [
        { id: 'd1', position: 0, name: 'Tag 1', exercises: [] },
        { id: 'd2', position: 1, name: 'Tag 2', exercises: [] },
      ],
    },
  ];
}

function withSquat(): Week[] {
  return addExercise(base(), 'd1', squat, ids());
}

const reason = (fn: () => unknown) => {
  try {
    fn();
  } catch (error) {
    return error instanceof PlanEditError ? error.reason : 'other';
  }
  return 'none';
};

describe('Wochen und Tage (AK-PRG-02)', () => {
  it('fügt hinzu, benennt um, verschiebt, dupliziert und löscht Wochen', () => {
    let weeks = addWeek(base(), { week: 'Woche 2', day: 'Tag 1' }, ids());
    expect(weeks.map((w) => [w.name, w.position, w.days.length])).toEqual([
      ['Woche 1', 0, 2],
      ['Woche 2', 1, 1],
    ]);
    weeks = renameWeek(weeks, 'w1', 'Einstieg');
    weeks = moveWeek(weeks, 'w1', 1);
    expect(weeks.map((w) => w.name)).toEqual(['Woche 2', 'Einstieg']);
    expect(weeks.map((w) => w.position)).toEqual([0, 1]);
    // Grenzen: nach unten am Ende ändert nichts.
    expect(moveWeek(weeks, 'w1', 1).map((w) => w.name)).toEqual(['Woche 2', 'Einstieg']);
    weeks = duplicateWeek(weeks, 'w1', 'Einstieg (Kopie)', ids());
    expect(weeks.map((w) => w.name)).toEqual(['Woche 2', 'Einstieg', 'Einstieg (Kopie)']);
    expect(weeks[2]?.days.map((d) => d.name)).toEqual(['Tag 1', 'Tag 2']);
    expect(weeks[2]?.days[0]?.id).not.toBe('d1');
    weeks = removeWeek(weeks, 'w1');
    expect(weeks.map((w) => w.name)).toEqual(['Woche 2', 'Einstieg (Kopie)']);
  });

  it('behält mindestens eine Woche und je Woche mindestens einen Tag (AK-PRG-01)', () => {
    expect(reason(() => removeWeek(base(), 'w1'))).toBe('last');
    const one = removeDay(base(), 'd2');
    expect(reason(() => removeDay(one, 'd1'))).toBe('last');
    expect(reason(() => removeDay(base(), 'gibt-es-nicht'))).toBe('not_found');
  });

  it('ändert Tage: Name, Wochentag-Hinweis, Notiz, Reihenfolge, Kopie (AK-PRG-09)', () => {
    let weeks = addDay(base(), 'w1', 'Tag 3', ids());
    weeks = updateDay(weeks, 'd1', { name: 'Push', weekdayHint: 1, notes: '  locker  ' });
    expect(weeks[0]?.days[0]).toMatchObject({ name: 'Push', weekdayHint: 1, notes: 'locker' });
    weeks = updateDay(weeks, 'd1', { weekdayHint: null, notes: ' ' });
    expect(weeks[0]?.days[0]).not.toHaveProperty('weekdayHint');
    expect(weeks[0]?.days[0]).not.toHaveProperty('notes');
    weeks = moveDay(weeks, 'd1', 1);
    expect(weeks[0]?.days.map((d) => d.name)).toEqual(['Tag 2', 'Push', 'Tag 3']);
    weeks = duplicateDay(weeks, 'd2', 'Tag 2 (Kopie)', ids());
    expect(weeks[0]?.days.map((d) => [d.name, d.position])).toEqual([
      ['Tag 2', 0],
      ['Tag 2 (Kopie)', 1],
      ['Push', 2],
      ['Tag 3', 3],
    ]);
  });

  it('meldet die Grenze bei zu vielen Tagen', () => {
    let weeks = base();
    const next = ids();
    for (let i = 0; i < 12; i++) weeks = addDay(weeks, 'w1', `T${String(i)}`, next);
    expect(reason(() => addDay(weeks, 'w1', 'zu viel', next))).toBe('limit');
  });
});

describe('Übungen (AK-PRG-03)', () => {
  it('legt neue Übungen mit Standardsätzen je Erfassungsart an', () => {
    let weeks = withSquat();
    weeks = addExercise(weeks, 'd1', plank, ids());
    weeks = addExercise(weeks, 'd1', run, ids());
    const [s, p, r] = weeks[0]?.days[0]?.exercises ?? [];
    expect(s?.sets.map((set) => [set.type, set.repsMin, set.repsMax])).toEqual([
      ['working', 8, 12],
      ['working', 8, 12],
      ['working', 8, 12],
    ]);
    expect(p?.sets[0]).toMatchObject({ durationMinSec: 30, durationMaxSec: 45 });
    expect(r?.sets).toHaveLength(1);
    expect(r?.sets[0]).not.toHaveProperty('repsMin');
  });

  it('verschiebt, ändert Pause und Hinweis, ersetzt und entfernt', () => {
    let weeks = addExercise(withSquat(), 'd1', plank, ids());
    const [squatId, plankId] = (weeks[0]?.days[0]?.exercises ?? []).map((e) => e.id);
    weeks = moveExercise(weeks, plankId!, -1);
    expect(weeks[0]?.days[0]?.exercises.map((e) => e.nameSnapshot)).toEqual(['Plank', 'Kniebeuge']);
    weeks = updateExercise(weeks, squatId!, { restSec: 150, notes: 'tief' });
    expect(weeks[0]?.days[0]?.exercises[1]).toMatchObject({ restSec: 150, notes: 'tief' });
    weeks = updateExercise(weeks, squatId!, { restSec: null, notes: '' });
    expect(weeks[0]?.days[0]?.exercises[1]).not.toHaveProperty('restSec');
    expect(weeks[0]?.days[0]?.exercises[1]).not.toHaveProperty('notes');
    // Ersetzen: Kniebeuge (Wdh.) durch Plank (Zeit) – Zeitziele statt Wiederholungen.
    weeks = replaceExercise(weeks, squatId!, plank);
    const replaced = weeks[0]?.days[0]?.exercises[1];
    expect(replaced).toMatchObject({ exerciseId: 'ex-plank', nameSnapshot: 'Plank' });
    expect(replaced?.sets[0]).toEqual({
      id: replaced?.sets[0]?.id,
      position: 0,
      type: 'working',
      durationMinSec: 30,
      durationMaxSec: 45,
    });
    weeks = removeExercise(weeks, plankId!);
    expect(weeks[0]?.days[0]?.exercises.map((e) => [e.nameSnapshot, e.position])).toEqual([
      ['Plank', 0],
    ]);
  });
});

describe('Sätze (AK-PRG-04)', () => {
  it('fügt Aufwärm-, Arbeits- und Drop-Sätze an der richtigen Stelle ein', () => {
    const next = ids();
    let weeks = withSquat();
    const exercise = () => weeks[0]!.days[0]!.exercises[0]!;
    weeks = addSet(weeks, exercise().id, 'warmup', next);
    weeks = addSet(weeks, exercise().id, 'working', next);
    expect(exercise().sets.map((s) => s.type)).toEqual([
      'warmup',
      'working',
      'working',
      'working',
      'working',
    ]);
    const lastWorking = exercise().sets[4]!;
    weeks = addDropSet(weeks, lastWorking.id, next);
    weeks = addDropSet(weeks, lastWorking.id, next);
    const sets = exercise().sets;
    expect(sets.map((s) => s.type)).toEqual([
      'warmup',
      'working',
      'working',
      'working',
      'working',
      'drop',
      'drop',
    ]);
    expect(sets[5]).toMatchObject({ parentSetId: lastWorking.id, restSec: 0, repsMin: 8 });
    expect(sets.map((s) => s.position)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    // Drop nur an Arbeitssätzen.
    expect(reason(() => addDropSet(weeks, sets[0]!.id, next))).toBe('invalid');
  });

  it('setzt Bereiche, feste Werte, Zielgewicht und Pause; dreht verkehrte Bereiche', () => {
    let weeks = withSquat();
    const set = () => weeks[0]!.days[0]!.exercises[0]!.sets[0]!;
    weeks = updateSet(weeks, set().id, { reps: { min: 10, max: 6 }, weightKg: 62.5, restSec: 120 });
    expect(set()).toMatchObject({ repsMin: 6, repsMax: 10, weightKg: 62.5, restSec: 120 });
    weeks = updateSet(weeks, set().id, { reps: { min: 5, max: 5 }, weightKg: null });
    expect(set()).toMatchObject({ repsMin: 5, repsMax: 5 });
    expect(set()).not.toHaveProperty('weightKg');
    weeks = updateSet(weeks, set().id, { reps: null, weightKg: 9999 });
    expect(set()).not.toHaveProperty('repsMin');
    expect(set().weightKg).toBe(500);
  });

  it('wechselt den Typ nur zwischen Aufwärm- und Arbeitssatz', () => {
    const next = ids();
    let weeks = withSquat();
    const sets = () => weeks[0]!.days[0]!.exercises[0]!.sets;
    weeks = updateSet(weeks, sets()[0]!.id, { type: 'warmup' });
    expect(sets()[0]?.type).toBe('warmup');
    weeks = addDropSet(weeks, sets()[2]!.id, next);
    expect(reason(() => updateSet(weeks, sets()[2]!.id, { type: 'warmup' }))).toBe('invalid');
  });

  it('entfernt Arbeitssätze mit ihren Drops; der letzte Arbeitssatz bleibt', () => {
    const next = ids();
    let weeks = withSquat();
    const sets = () => weeks[0]!.days[0]!.exercises[0]!.sets;
    weeks = addDropSet(weeks, sets()[0]!.id, next);
    weeks = removeSet(weeks, sets()[0]!.id);
    expect(sets().map((s) => s.type)).toEqual(['working', 'working']);
    weeks = removeSet(weeks, sets()[0]!.id);
    expect(reason(() => removeSet(weeks, sets()[0]!.id))).toBe('last');
  });

  it('ändert das Original nicht', () => {
    const original = withSquat();
    const snapshot = structuredClone(original);
    addSet(original, original[0]!.days[0]!.exercises[0]!.id, 'working', ids());
    renameWeek(original, 'w1', 'Neu');
    expect(original).toEqual(snapshot);
  });
});
