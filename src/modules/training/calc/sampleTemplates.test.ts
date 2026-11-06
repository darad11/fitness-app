import { describe, expect, it } from 'vitest';
import { loadCoreExercises } from '@/modules/exercises';
import { stableId } from '@/shared/lib/uuid';
import raw from '../data/sample-templates.v1.json';
import { parseSampleTemplates } from '../data/sampleTemplates';
import { sampleTemplateSourceSchema } from '../model/program';
import { distinctDays, expandSampleTemplate, summarizeSets } from './sampleTemplates';

const exercises = await loadCoreExercises();
const templates = parseSampleTemplates(raw, exercises);
const byKey = (key: string) => templates.find((template) => template.key === key)!;
const exercise = (templateKey: string, dayName: string, name: string) =>
  distinctDays(byKey(templateKey))
    .find((day) => day.name === dayName)!
    .exercises.find((e) => e.nameSnapshot === name)!;

describe('Beispielvorlagen aus sample-templates.md', () => {
  it('enthält die vier Vorlagen mit ihrem Wochenablauf', () => {
    expect(templates.map((t) => t.name)).toEqual([
      'Ganzkörper A/B',
      'Oberkörper/Unterkörper',
      'Push/Pull/Beine',
      'Zuhause mit Kurzhanteln',
    ]);
    const fullBody = byKey('full_body_ab');
    expect(fullBody.weeks.map((w) => [w.name, w.days.map((d) => d.name)])).toEqual([
      ['Woche 1', ['Tag A', 'Tag B', 'Tag A']],
      ['Woche 2', ['Tag B', 'Tag A', 'Tag B']],
    ]);
    expect(distinctDays(fullBody).map((d) => d.name)).toEqual(['Tag A', 'Tag B']);
    expect(distinctDays(byKey('push_pull_legs')).map((d) => d.exercises.length)).toEqual([6, 6, 6]);
  });

  it('vergibt stabile, eindeutige IDs aus Schlüssel und Position (D-207)', () => {
    const fullBody = byKey('full_body_ab');
    expect(fullBody.id).toBe(stableId('sample-template:full_body_ab'));
    expect(fullBody.weeks[1]!.days[2]!.id).toBe(stableId('sample-template:full_body_ab:w1:d2'));
    const ids = templates.flatMap((t) => [
      t.id,
      ...t.weeks.flatMap((w) => [
        w.id,
        ...w.days.flatMap((d) => [
          d.id,
          ...d.exercises.flatMap((e) => [e.id, ...e.sets.map((s) => s.id)]),
        ]),
      ]),
    ]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(parseSampleTemplates(raw, exercises)).toEqual(templates);
  });

  it('verweist auf Übungen der Bibliothek mit Namen als Snapshot', () => {
    const squat = exercise('full_body_ab', 'Tag A', 'Kniebeuge mit Langhantel');
    expect(squat.exerciseId).toBe(exercises.find((e) => e.key === 'back_squat_barbell')!.id);
    const row = exercise('push_pull_legs', 'Pull', 'Rudern am Kabel, sitzend');
    expect(row.sets).toHaveLength(3);
  });

  it('baut Aufwärmsätze mit 10 und 5 bzw. 5 Wiederholungen, dann die Arbeitssätze', () => {
    const squat = exercise('full_body_ab', 'Tag A', 'Kniebeuge mit Langhantel');
    expect(squat.restSec).toBe(150);
    expect(squat.sets.map((s) => [s.type, s.repsMin, s.repsMax])).toEqual([
      ['warmup', 10, 10],
      ['warmup', 5, 5],
      ['working', 6, 8],
      ['working', 6, 8],
      ['working', 6, 8],
    ]);
    const bench = exercise('full_body_ab', 'Tag A', 'Bankdrücken mit Langhantel');
    expect(bench.sets.map((s) => s.type)).toEqual(['warmup', 'working', 'working', 'working']);
    expect(bench.sets[0]).toMatchObject({ repsMin: 5, repsMax: 5 });
  });

  it('hängt Drop-Sätze ohne Pause an den letzten Arbeitssatz', () => {
    const pushdown = exercise('upper_lower', 'Oberkörper 1', 'Trizepsdrücken am Kabel');
    const last = pushdown.sets[1]!;
    expect(pushdown.sets[2]).toMatchObject({
      type: 'drop',
      parentSetId: last.id,
      restSec: 0,
      repsMin: 8,
      repsMax: 12,
    });
    expect(summarizeSets(pushdown)).toEqual({
      warmup: 0,
      working: 2,
      drop: 1,
      target: { repsMin: 10, repsMax: 12 },
      dropTarget: { repsMin: 8, repsMax: 12 },
    });
  });

  it('übernimmt Zeitbereiche für Zeitübungen', () => {
    const plank = exercise('full_body_ab', 'Tag A', 'Unterarmstütz (Plank)');
    expect(summarizeSets(plank)).toEqual({
      warmup: 0,
      working: 3,
      drop: 0,
      target: { durationMinSec: 30, durationMaxSec: 45 },
    });
  });

  it('meldet unbekannte Übungen und Tage', () => {
    const source = sampleTemplateSourceSchema.parse(raw).templates[0]!;
    expect(() => expandSampleTemplate(source, () => undefined)).toThrow(/Unbekannte Übung/);
    const broken = structuredClone(raw);
    broken.templates[0]!.weeks = [['Tag X']];
    expect(() => parseSampleTemplates(broken, exercises)).toThrow(/unbekannten Tag/);
    expect(() =>
      expandSampleTemplate({ ...source, weeks: [['Tag X']] }, () => ({ id: 'x', name: 'x' })),
    ).toThrow(/Unbekannter Tag/);
  });

  it('Aufwärmsätze mit eigenem Ziel vor den Arbeitssätzen, nur mit Aufwärmsatz (D-531)', () => {
    const withTarget = (warmup: number) => {
      const changed = structuredClone(raw);
      Object.assign(changed.templates[0]!.days[0]!.exercises[0]!, {
        warmup,
        warmupTarget: { repsMin: 8, repsMax: 10 },
      });
      return () => parseSampleTemplates(changed, exercises);
    };
    const first = withTarget(1)()[0]!.weeks[0]!.days[0]!.exercises[0]!;
    expect(first.sets.map((set) => [set.type, set.repsMin, set.repsMax])).toEqual([
      ['warmup', 8, 10],
      ...first.sets.slice(1).map((set) => ['working', set.repsMin, set.repsMax]),
    ]);
    expect(summarizeSets(first).warmup).toBe(1);
    expect(withTarget(0)).toThrow(/Ziel ohne Aufwärmsatz/);
  });

  it('Wiederholung ab Woche n: nur mit `repeat` und nur ab einer Woche, die es gibt (D-505)', () => {
    const from = (repeat: boolean, repeatFromWeek: number) => {
      const changed = structuredClone(raw);
      Object.assign(changed.templates[0]!, { repeat, repeatFromWeek });
      return () => parseSampleTemplates(changed, exercises);
    };
    expect(from(true, 2)()[0]).toMatchObject({ repeat: true, repeatFromWeek: 2 });
    expect(from(true, 3)).toThrow(/Woche, die es nicht gibt/);
    expect(from(false, 1)).toThrow(/Woche, die es nicht gibt/);
    expect(from(true, 0)).toThrow();
  });

  it('lehnt unvollständige oder verkehrte Bereiche und doppelte Schlüssel ab', () => {
    const reversed = structuredClone(raw);
    reversed.templates[0]!.days[0]!.exercises[0]!.target = { repsMin: 8, repsMax: 6 };
    expect(() => parseSampleTemplates(reversed, exercises)).toThrow(/verkehrt/);
    const half = structuredClone(raw);
    half.templates[0]!.days[0]!.exercises[0]!.target = { repsMin: 8 } as never;
    expect(() => parseSampleTemplates(half, exercises)).toThrow(/unvollständig/);
    const dropless = structuredClone(raw);
    Object.assign(dropless.templates[0]!.days[0]!.exercises[0]!, { drop: 1 });
    expect(() => parseSampleTemplates(dropless, exercises)).toThrow(/Drop unvollständig/);
    const duplicate = structuredClone(raw);
    duplicate.templates.push(duplicate.templates[0]!);
    expect(() => parseSampleTemplates(duplicate, exercises)).toThrow(/Doppelter Schlüssel/);
  });
});
