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

describe('Programme Dali’s PPLC, A, B und C (evolution-plan.md Abschnitt 4, programs.md)', () => {
  it('enthält vier Programme mit 168 Trainingstagen, das eigene des Produktinhabers zuerst', () => {
    expect(programs.map((p) => [p.key, p.program, flattenDays(p).length, p.repeat])).toEqual([
      ['dali_pplc', true, 84, true],
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

describe('Dali’s PPLC (Plan des Produktinhabers, D-504, umgebaut in D-505)', () => {
  const pplc = () => byKey('dali_pplc');
  /** Tag `day` (0 = Push … 3 = Compound) in Woche `week` (ab 1). */
  const dayOf = (week: number, day: number) => pplc().weeks[week - 1]!.days[day]!;
  const sets = (week: number, day: number, exercise: number) =>
    summarizeSets(dayOf(week, day).exercises[exercise]!);

  it('Wochen 1 bis 21, danach ab Woche 8; der Infotext steht wörtlich da', () => {
    expect(pplc().weeks).toHaveLength(21);
    expect(pplc().repeat).toBe(true);
    expect(pplc().repeatFromWeek).toBe(8);
    expect(pplc().description).toBe(
      'So steigerst du: Jede Übung hat einen Wiederholungsbereich. Schaffst du in allen Sätzen das obere Ende sauber, erhöhst du beim nächsten Mal das Gewicht – Langhantel um 2,5 kg, Kurzhanteln und Maschinen um die nächste Stufe. Bei Dip und Pull-Up mit Unterstützung steigerst du, indem du die Unterstützung verringerst. Lass in jedem Satz ein bis drei Wiederholungen Reserve. Wochen 1–3: zwei bis drei Arbeitssätze je Übung. Ab Woche 4: drei bis vier Sätze bei den Grundübungen, zwei bis drei bei den übrigen. Alle sechs Wochen folgt eine leichtere Woche mit etwa der Hälfte der Sätze.',
    );
    const light = ['Push · leicht', 'Pull · leicht', 'Legs · leicht', 'Compound · leicht'];
    pplc().weeks.forEach((week, index) => {
      expect(
        week.days.map((d) => d.name),
        `Woche ${String(index + 1)}`,
      ).toEqual([7, 14, 21].includes(index + 1) ? light : ['Push', 'Pull', 'Legs', 'Compound']);
      expect(week.days.map((d) => d.weekdayHint)).toEqual([1, 2, 4, 6]);
    });
  });

  it('Satzzahl je Woche: Einstieg 2, 2, 3; Aufbau 4 und 3; leicht 2 und 1; neuer Block 3 und 2', () => {
    // Push: Bankdrücken (Grundübung) und Seitheben (übrige) je Woche.
    const push = (week: number) => [sets(week, 0, 0).working, sets(week, 0, 4).working];
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 13, 14, 15, 20, 21].map(push)).toEqual([
      [2, 2],
      [2, 2],
      [3, 3],
      [4, 3],
      [4, 3],
      [4, 3],
      [2, 1],
      [3, 2],
      [4, 3],
      [4, 3],
      [2, 1],
      [3, 2],
      [4, 3],
      [2, 1],
    ]);
    // Wadenheben am Compound-Tag fest mit zwei Sätzen, in der leichten Woche einer.
    expect([1, 3, 4, 7, 8].map((week) => sets(week, 3, 7).working)).toEqual([2, 2, 2, 1, 2]);
    // Aufwärmsätze: Kreuzheben 2, Kniebeuge an der Maschine 2, Beinpresse am Compound-Tag 2.
    expect([sets(4, 1, 0).warmup, sets(4, 2, 0).warmup, sets(4, 3, 4).warmup]).toEqual([2, 2, 2]);
  });

  it('Übungen, englische Namen, Bereiche und Pausen wie im Plan; Bench und Dip im Wochenwechsel', () => {
    const names = (week: number, day: number) =>
      dayOf(week, day).exercises.map((e) => e.originalName);
    expect([0, 1, 2, 3].map((day) => names(1, day))).toEqual([
      [
        'Dumbbell Bench Press',
        'Dumbbell Incline Bench Press',
        'Dumbbell Seated Shoulder Press',
        'Dip',
        'Dumbbell Lateral Raise',
        'Cable Fly',
        'Cable Tricep Pushdown',
      ],
      [
        'Barbell Deadlift',
        'Pull-Up',
        'Leverage Machine Iso Row',
        'Leverage Machine High Row',
        'Machine Reverse Fly',
        'Dumbbell Alternating Hammer Curl',
      ],
      [
        'Machine Squat',
        'Machine Leg Press',
        'Machine Leg Curl',
        'Machine Seated Leg Curl',
        'Machine Leg Extension',
        'Machine Calf Raise',
        'Machine Seated Calf Raise',
        'Plank',
      ],
      [
        'Pull-Up',
        'Barbell Military Press',
        'Barbell Bent-Over Row',
        'Dumbbell Bench Press',
        'Machine Leg Press',
        'Dumbbell Lateral Raise',
        'Dumbbell Curl',
        'Machine Calf Raise',
        'Cable Crunch',
      ],
    ]);
    // Wechsel Woche für Woche, auch über die Wiederholung: Woche 21 Bench, danach Woche 8 Dip.
    expect([1, 2, 3, 4, 7, 8, 14, 15, 21].map((week) => names(week, 3)[3])).toEqual([
      'Dumbbell Bench Press',
      'Dip',
      'Dumbbell Bench Press',
      'Dip',
      'Dumbbell Bench Press',
      'Dip',
      'Dip',
      'Dumbbell Bench Press',
      'Dumbbell Bench Press',
    ]);
    const plan = (week: number, day: number, exercise: number) => {
      const planned = dayOf(week, day).exercises[exercise]!;
      return [summarizeSets(planned).target, planned.restSec];
    };
    expect([
      plan(4, 1, 0),
      plan(4, 3, 1),
      plan(4, 0, 3),
      plan(4, 1, 2),
      plan(4, 0, 5),
      plan(4, 0, 4),
      plan(4, 2, 7),
      plan(4, 3, 8),
    ]).toEqual([
      [{ repsMin: 5, repsMax: 6 }, 180],
      [{ repsMin: 6, repsMax: 10 }, 150],
      [{ repsMin: 8, repsMax: 12 }, 120],
      [{ repsMin: 8, repsMax: 12 }, 90],
      [{ repsMin: 10, repsMax: 15 }, 75],
      [{ repsMin: 12, repsMax: 20 }, 60],
      [{ durationMinSec: 30, durationMaxSec: 45 }, 45],
      [{ repsMin: 12, repsMax: 15 }, 45],
    ]);
    // Iso Row und High Row sind zwei Übungen mit eigenem Vorwert, nicht zweimal dieselbe.
    const pull = dayOf(1, 1);
    expect(pull.exercises.map((e) => e.nameSnapshot).slice(2, 4)).toEqual([
      'Rudern an der Maschine',
      'High Row an der Maschine',
    ]);
    expect(new Set(pull.exercises.map((e) => e.exerciseId)).size).toBe(6);
  });

  it('Hinweise auf „Heute“: erster Tag von Woche 4, jeder leichten Woche und jedes neuen Blocks', () => {
    const notes = pplc().weeks.map((week) => week.days[0]!.notes ?? null);
    expect(notes[3]).toBe('Ab dieser Woche mehr Sätze: Grundübungen 4, übrige 3.');
    for (const week of [7, 14, 21]) {
      expect(notes[week - 1]).toBe('Diese Woche ist leichter: etwa die Hälfte der Sätze.');
    }
    for (const week of [8, 15]) {
      expect(notes[week - 1]).toBe(
        'Neuer Aufbaublock: Diese Woche steigst du mit etwas weniger Sätzen ein.',
      );
    }
    expect(notes.filter((note) => note !== null)).toHaveLength(6);
    for (const week of pplc().weeks) {
      for (const day of week.days.slice(1)) expect(day.notes).toBeUndefined();
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
