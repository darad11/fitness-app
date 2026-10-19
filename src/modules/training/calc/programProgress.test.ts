import { describe, expect, it } from 'vitest';
import type { SampleTemplate } from '../model/program';
import {
  dayNumber,
  flattenDays,
  isoWeekday,
  plannedFor,
  programProgress,
  type ProgramSessionLike,
} from './programProgress';

function template(weeks: string[][], repeat: boolean): SampleTemplate {
  return {
    id: 'p1',
    key: 'p1',
    name: 'P1',
    level: 'beginner',
    location: 'gym',
    daysPerWeek: '2',
    repeat,
    weeks: weeks.map((names, w) => ({
      id: `w${String(w)}`,
      position: w,
      name: `Woche ${String(w + 1)}`,
      days: names.map((name, d) => ({
        id: `w${String(w)}d${String(d)}`,
        position: d,
        name,
        exercises: [],
      })),
    })),
  };
}

const AB = template(
  [
    ['A', 'B'],
    ['A', 'B'],
  ],
  true,
);

function done(
  weekIndex: number,
  dayIndex: number,
  endedAt: string,
  programId = 'p1',
): ProgramSessionLike {
  return { status: 'completed', endedAt, program: { programId, weekIndex, dayIndex } };
}

describe('Folge der Trainingstage (D-214, D-249)', () => {
  it('zählt Woche für Woche durch', () => {
    expect(flattenDays(AB).map((d) => [d.index, d.weekName, d.name])).toEqual([
      [0, 'Woche 1', 'A'],
      [1, 'Woche 1', 'B'],
      [2, 'Woche 2', 'A'],
      [3, 'Woche 2', 'B'],
    ]);
    expect(dayNumber(AB, 1, 0)).toBe(3);
    expect(dayNumber(AB, 5, 0)).toBeUndefined();
  });

  it('beginnt ohne Einheiten beim ersten Tag', () => {
    const progress = programProgress(AB, []);
    expect(progress).toMatchObject({ total: 4, completed: 0, round: 1, finished: false });
    expect(progress.next?.index).toBe(0);
    expect([...progress.doneInRound]).toEqual([]);
  });

  it('schlägt den Tag nach dem zuletzt abgeschlossenen vor, unabhängig von der Reihenfolge der Liste', () => {
    const progress = programProgress(AB, [
      done(0, 1, '2026-10-20T10:00:00.000Z'),
      done(0, 0, '2026-10-18T10:00:00.000Z'),
    ]);
    expect(progress.next?.index).toBe(2);
    expect(progress.completed).toBe(2);
    expect([...progress.doneInRound]).toEqual([0, 1]);
  });

  it('zählt nur abgeschlossene Einheiten dieses Programms seit der Aktivierung', () => {
    const progress = programProgress(
      AB,
      [
        done(0, 0, '2026-10-10T10:00:00.000Z'), // vor der Aktivierung
        done(0, 0, '2026-10-18T10:00:00.000Z', 'anderes'),
        { status: 'in_progress', program: { programId: 'p1', weekIndex: 0, dayIndex: 1 } },
        { status: 'completed', endedAt: '2026-10-19T10:00:00.000Z' }, // frei
        done(0, 0, '2026-10-18T12:00:00.000Z'),
        done(7, 7, '2026-10-18T13:00:00.000Z'), // Tag gibt es nicht
      ],
      '2026-10-18T00:00:00.000Z',
    );
    expect(progress.completed).toBe(1);
    expect(progress.next?.index).toBe(1);
  });

  it('beginnt mit Wiederholung nach dem letzten Tag von vorn und zählt Durchläufe', () => {
    const sessions = [0, 1, 2, 3].map((i) =>
      done(Math.floor(i / 2), i % 2, `2026-10-2${String(i)}T10:00:00.000Z`),
    );
    const afterRound = programProgress(AB, sessions);
    expect(afterRound.next?.index).toBe(0);
    expect(afterRound.round).toBe(1);
    expect(afterRound.finished).toBe(false);
    const second = programProgress(AB, [...sessions, done(0, 0, '2026-10-24T10:00:00.000Z')]);
    expect(second).toMatchObject({ round: 2, completed: 5 });
    expect(second.next?.index).toBe(1);
    expect([...second.doneInRound]).toEqual([0]);
  });

  it('ist ohne Wiederholung nach dem letzten Tag abgeschlossen', () => {
    const once = template([['A', 'B']], false);
    const progress = programProgress(once, [
      done(0, 0, '2026-10-18T10:00:00.000Z'),
      done(0, 1, '2026-10-19T10:00:00.000Z'),
    ]);
    expect(progress.finished).toBe(true);
    expect(progress.next).toBeUndefined();
  });

  it('wertet einen frei gewählten früheren Tag als neuen Durchlauf', () => {
    const progress = programProgress(AB, [
      done(0, 0, '2026-10-18T10:00:00.000Z'),
      done(1, 0, '2026-10-19T10:00:00.000Z'),
      done(0, 1, '2026-10-20T10:00:00.000Z'),
    ]);
    expect(progress.round).toBe(2);
    expect([...progress.doneInRound]).toEqual([1]);
    expect(progress.next?.index).toBe(2);
  });

  it('kommt mit einem Programm ohne Tage zurecht', () => {
    expect(programProgress(template([], true), [])).toMatchObject({ total: 0, finished: false });
  });
});

describe('Wochentag-Hinweis (AK-PRG-09)', () => {
  const plan = {
    id: 'p',
    name: 'Plan',
    repeat: true,
    weeks: [
      {
        id: 'w',
        position: 0,
        name: 'Woche 1',
        days: [
          { id: 'a', position: 0, name: 'A', weekdayHint: 1 as const, exercises: [] },
          { id: 'b', position: 1, name: 'B', exercises: [] },
        ],
      },
    ],
  };
  // 19.10.2026 ist ein Montag, 22.10.2026 ein Donnerstag.
  const monday = new Date(2026, 9, 19, 12);
  const thursday = new Date(2026, 9, 22, 12);

  it('zählt Wochentage nach ISO', () => {
    expect(isoWeekday(monday)).toBe(1);
    expect(isoWeekday(new Date(2026, 9, 25, 12))).toBe(7);
  });

  it('ist heute geplant ohne Hinweis oder bei passendem Wochentag, sonst für den Wochentag', () => {
    expect(plannedFor(plan, { weekIndex: 0, dayIndex: 0 }, monday)).toEqual({ kind: 'today' });
    expect(plannedFor(plan, { weekIndex: 0, dayIndex: 0 }, thursday)).toEqual({
      kind: 'weekday',
      weekday: 1,
    });
    expect(plannedFor(plan, { weekIndex: 0, dayIndex: 1 }, thursday)).toEqual({ kind: 'today' });
  });
});
