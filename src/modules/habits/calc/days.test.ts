import { describe, expect, it } from 'vitest';
import { activeOn, dayStatus } from './days';

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
