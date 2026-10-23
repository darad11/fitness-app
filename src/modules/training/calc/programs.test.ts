import { describe, expect, it } from 'vitest';
import { loadCoreExercises } from '@/modules/exercises';
import raw from '../data/programs.v1.json';
import { loadSampleTemplate, parseSampleTemplates } from '../data/sampleTemplates';
import { flattenDays } from './programProgress';
import { distinctDays, summarizeSets } from './sampleTemplates';
import { PROGRAM_C_KEY, PROGRAM_C_SLUG } from '../data/programC';

const exercises = await loadCoreExercises();
const programs = parseSampleTemplates(raw, exercises);
const byKey = (key: string) => programs.find((p) => p.key === key)!;

describe('Programme A, B und C (evolution-plan.md Abschnitt 4, programs.md)', () => {
  it('enthält drei Programme mit 84 Trainingstagen', () => {
    expect(programs.map((p) => [p.key, p.program, flattenDays(p).length, p.repeat])).toEqual([
      ['compound_ab_4', true, 32, true],
      ['ppl_rotation_4', true, 12, true],
      [PROGRAM_C_KEY, true, 40, false],
    ]);
    for (const program of programs) expect(program.description).toBeTruthy();
  });

  it('A: zwei Tage im Wechsel, von Beginn an 3 Arbeitssätze, Beinpresse statt Kniebeuge (Q-14)', () => {
    const a = byKey('compound_ab_4');
    expect(a.weeks).toHaveLength(8);
    expect(a.weeks[0]!.days.map((d) => d.name)).toEqual(['Tag A', 'Tag B', 'Tag A', 'Tag B']);
    const first = distinctDays(a)[0]!.exercises[0]!;
    expect(first.nameSnapshot).toBe('Beinpresse');
    expect(summarizeSets(first)).toMatchObject({
      warmup: 2,
      working: 3,
      target: { repsMin: 8, repsMax: 12 },
    });
  });

  it('B: Rotation über drei Wochen ohne Rücksetzung, Klimmzüge an der Maschine (Q-15)', () => {
    const b = byKey('ppl_rotation_4');
    expect(b.weeks.map((w) => w.days.map((d) => d.name))).toEqual([
      ['Push', 'Pull', 'Beine', 'Push'],
      ['Pull', 'Beine', 'Push', 'Pull'],
      ['Beine', 'Push', 'Pull', 'Beine'],
    ]);
    const pull = distinctDays(b).find((d) => d.name === 'Pull')!;
    expect(pull.exercises[0]!.nameSnapshot).toBe('Klimmzüge mit Unterstützung');
  });

  it('C: 8 Wochen à 5 Tage, Laufband an Tag 14 einmal 30 min, Dropsets ohne Pause (Q-13)', () => {
    const c = byKey(PROGRAM_C_KEY);
    expect(c.weeks.map((w) => w.days.length)).toEqual([5, 5, 5, 5, 5, 5, 5, 5]);
    // Ohne Quellenangabe (F5, D-328).
    expect(c.source).toBeUndefined();
    const days = flattenDays(c);
    const day14 = c.weeks[days.find((d) => d.name.startsWith('Tag 14 '))!.weekIndex]!.days.find(
      (d) => d.name.startsWith('Tag 14 '),
    )!;
    const treadmill = day14.exercises.find((e) => e.originalName === 'Cardio Treadmill')!;
    expect(summarizeSets(treadmill)).toMatchObject({
      working: 1,
      target: { durationMinSec: 1800, durationMaxSec: 1800 },
    });
    const day17 = distinctDays(c).find((d) => d.name.startsWith('Tag 17 '))!;
    const dropset = day17.exercises[3]!;
    expect(summarizeSets(dropset)).toMatchObject({ working: 1, drop: 2 });
    expect(dropset.sets.filter((s) => s.type === 'drop').every((s) => s.restSec === 0)).toBe(true);
    expect(dropset.notes).toMatch(/^Dropset: schwer beginnen/);
    // Jede Übung trägt ihren englischen Namen aus der Vorlage, damit sie wiederzuerkennen ist.
    expect(days.length).toBe(40);
    for (const day of distinctDays(c)) {
      for (const exercise of day.exercises) expect(exercise.originalName).toBeTruthy();
    }
  });
});

describe('Adresse von Programm C (F5, D-328)', () => {
  it('ist unter dem neutralen Teil der Adresse und unter dem alten Schlüssel erreichbar', async () => {
    const bySlug = await loadSampleTemplate(PROGRAM_C_SLUG);
    const byKey = await loadSampleTemplate(PROGRAM_C_KEY);
    expect(bySlug?.key).toBe(PROGRAM_C_KEY);
    expect(byKey?.slug).toBe(PROGRAM_C_SLUG);
    expect(bySlug?.name).toBe('Winterprogramm 2026');
    expect(bySlug?.description).toMatch(
      /^8 Wochen, 40 Trainingstage, fünf Einheiten pro Woche im Studio/,
    );
    expect(bySlug && 'source' in bySlug).toBe(false);
  });
});
