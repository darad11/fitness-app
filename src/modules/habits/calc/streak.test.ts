import { describe, expect, it } from 'vitest';
import { activeOn, dayStatus, pickDaily, recentDays, streak } from './streak';

const habits = [
  { id: 'a', fromDayKey: '2026-10-10' },
  { id: 'b', fromDayKey: '2026-10-14' },
  { id: 'c', fromDayKey: '2026-10-01', toDayKey: '2026-10-12' },
];
const log = (habitId: string, dayKey: string, done = true) => ({ habitId, dayKey, done });

describe('Geltende Aufgaben und Tagesstatus', () => {
  it('zählt Aufgaben ab dem Tag des Anlegens bis vor den Tag des Beendens', () => {
    expect(activeOn(habits, '2026-10-09').map((h) => h.id)).toEqual(['c']);
    expect(activeOn(habits, '2026-10-11').map((h) => h.id)).toEqual(['a', 'c']);
    expect(activeOn(habits, '2026-10-12').map((h) => h.id)).toEqual(['a']);
    expect(activeOn(habits, '2026-10-14').map((h) => h.id)).toEqual(['a', 'b']);
  });
  it('ist nur mit mindestens einer Aufgabe und allen erledigt vollständig', () => {
    expect(dayStatus(habits, [log('a', '2026-10-14')], '2026-10-14')).toEqual({
      total: 2,
      done: 1,
      complete: false,
    });
    expect(
      dayStatus(habits, [log('a', '2026-10-14'), log('b', '2026-10-14')], '2026-10-14').complete,
    ).toBe(true);
    expect(dayStatus([], [], '2026-10-14')).toEqual({ total: 0, done: 0, complete: false });
    // Ein wieder abgehakter Eintrag (done: false) zählt nicht.
    expect(dayStatus(habits, [log('a', '2026-10-13', false)], '2026-10-13').done).toBe(0);
  });
});

describe('Serie (TH-04, AH-05)', () => {
  const full = (day: string) => [log('a', day), log('b', day)];
  it('zählt Tage in Folge bis heute', () => {
    const logs = [...full('2026-10-14'), ...full('2026-10-15'), ...full('2026-10-16')];
    expect(streak(habits, logs, '2026-10-16')).toEqual({ days: 3, includesToday: true });
  });
  it('endet gestern, solange heute noch offen ist', () => {
    const logs = [...full('2026-10-14'), ...full('2026-10-15'), log('a', '2026-10-16')];
    expect(streak(habits, logs, '2026-10-16')).toEqual({ days: 2, includesToday: false });
  });
  it('bricht bei einem unvollständigen Tag ab', () => {
    const logs = [
      ...full('2026-10-13'),
      log('a', '2026-10-14'),
      ...full('2026-10-15'),
      ...full('2026-10-16'),
    ];
    // Am 13. gilt nur a (b ab 14.), am 14. fehlt b.
    expect(streak(habits, logs, '2026-10-16').days).toBe(2);
    expect(streak(habits, [], '2026-10-16')).toEqual({ days: 0, includesToday: false });
  });
  it('liefert die letzten Tage mit Status, ältester zuerst', () => {
    const days = recentDays(habits, full('2026-10-16'), '2026-10-16', 3);
    expect(days.map((d) => [d.dayKey, d.status.complete])).toEqual([
      ['2026-10-14', false],
      ['2026-10-15', false],
      ['2026-10-16', true],
    ]);
  });
  it('wählt je Tag denselben Satz', () => {
    const items = ['eins', 'zwei', 'drei'];
    expect(pickDaily(items, '2026-10-16')).toBe(pickDaily(items, '2026-10-16'));
    expect(items).toContain(pickDaily(items, '2026-10-17'));
    expect(pickDaily<string>([], '2026-10-16')).toBeUndefined();
  });
});
