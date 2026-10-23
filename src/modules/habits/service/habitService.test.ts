import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { dayStatus } from '../calc/days';
import { habitLogId, listHabitLogs, listHabits } from '../data/habitRepository';
import {
  addHabit,
  deleteHabit,
  endHabit,
  InvalidNameError,
  InvalidWeekdaysError,
  applyAutoDone,
  applyWaterAutoDoneToday,
  setHabitAutoDone,
  setHabitWeekdays,
  removeHabit,
  undoHabitChange,
  moveHabit,
  renameHabit,
  reopenHabit,
  restoreHabit,
  setHabitDone,
} from './habitService';

let rt: DbRuntime;
const at = (iso: string) => ({ now: () => new Date(iso) });
beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
});
afterEach(async () => {
  await rt.db.delete();
});

describe('Tagesaufgaben anlegen, ordnen, beenden (AH-03, D-253)', () => {
  it('legt Aufgaben mit Position und Starttag an und bereinigt den Namen', async () => {
    const a = await addHabit(rt, '  30 min   Cardio ', at('2026-10-18T10:00:00.000Z'));
    const b = await addHabit(rt, 'Wasser', at('2026-10-18T10:00:00.000Z'));
    expect(a).toMatchObject({ type: 'habit', name: '30 min Cardio', position: 0 });
    expect(a.fromDayKey).toMatch(/^2026-10-1[78]$/);
    expect(b.position).toBe(1);
    await expect(addHabit(rt, '   ')).rejects.toBeInstanceOf(InvalidNameError);
    await expect(addHabit(rt, 'x'.repeat(81))).rejects.toBeInstanceOf(InvalidNameError);
    expect((await listHabits(rt.db)).map((h) => h.name)).toEqual(['30 min Cardio', 'Wasser']);
  });

  it('benennt um, verschiebt und bleibt am Rand stehen', async () => {
    const a = await addHabit(rt, 'A');
    const b = await addHabit(rt, 'B');
    await renameHabit(rt, a.id, 'A neu');
    await moveHabit(rt, b.id, -1);
    expect((await listHabits(rt.db)).map((h) => h.name)).toEqual(['B', 'A neu']);
    await moveHabit(rt, b.id, -1);
    expect((await listHabits(rt.db)).map((h) => h.name)).toEqual(['B', 'A neu']);
  });

  it('beendet ab heute, macht das rückgängig, löscht und stellt wieder her', async () => {
    const a = await addHabit(rt, 'A', at('2026-10-10T10:00:00.000Z'));
    const ended = await endHabit(rt, a.id, at('2026-10-18T10:00:00.000Z'));
    expect(ended.toDayKey).toMatch(/^2026-10-1[78]$/);
    expect(ended.archivedAt).toBe('2026-10-18T10:00:00.000Z');
    const reopened = await reopenHabit(rt, a.id);
    expect(reopened).not.toHaveProperty('toDayKey');
    await deleteHabit(rt, a.id);
    expect(await listHabits(rt.db)).toHaveLength(0);
    await restoreHabit(rt, a.id);
    expect(await listHabits(rt.db)).toHaveLength(1);
  });
});

describe('Abhaken je Tag', () => {
  it('schreibt genau ein Dokument je Aufgabe und Tag und zählt erledigte Tage', async () => {
    const a = await addHabit(rt, 'A', at('2026-10-15T10:00:00.000Z'));
    await setHabitDone(rt, a.id, '2026-10-16', true, at('2026-10-16T08:00:00.000Z'));
    await setHabitDone(rt, a.id, '2026-10-17', true, at('2026-10-17T08:00:00.000Z'));
    await setHabitDone(rt, a.id, '2026-10-17', false, at('2026-10-17T09:00:00.000Z'));
    await setHabitDone(rt, a.id, '2026-10-17', true, at('2026-10-17T10:00:00.000Z'));
    const logs = await listHabitLogs(rt.db);
    expect(logs).toHaveLength(2);
    expect(logs.find((l) => l.dayKey === '2026-10-17')).toMatchObject({
      id: habitLogId(a.id, '2026-10-17'),
      done: true,
      doneAt: '2026-10-17T10:00:00.000Z',
    });
    const habits = await listHabits(rt.db);
    expect(dayStatus(habits, logs, '2026-10-16').complete).toBe(true);
    expect(dayStatus(habits, logs, '2026-10-17')).toEqual({ total: 1, done: 1, complete: true });
    expect(await listHabitLogs(rt.db, '2026-10-17')).toHaveLength(1);
  });
});

describe('Pausieren, Wiederaufnehmen und Löschen erhalten die Vergangenheit (D-283)', () => {
  // Mittag UTC, damit der lokale Tag in jeder Zeitzone der Testumgebung gleich bleibt.
  const noon = (day: string) => at(`${day}T12:00:00.000Z`);

  it('Pausentage zählen nach dem Wiederaufnehmen nicht als offen', async () => {
    const a = await addHabit(rt, 'A', noon('2026-10-01'));
    await setHabitDone(rt, a.id, '2026-10-04', true, noon('2026-10-04'));
    await endHabit(rt, a.id, noon('2026-10-05'));
    const reopened = await reopenHabit(rt, a.id, noon('2026-10-08'));
    expect(reopened.pauses).toEqual([{ fromDayKey: '2026-10-05', toDayKey: '2026-10-08' }]);
    expect(reopened).not.toHaveProperty('toDayKey');
    const habits = await listHabits(rt.db);
    const logs = await listHabitLogs(rt.db);
    expect(dayStatus(habits, logs, '2026-10-04')).toEqual({ total: 1, done: 1, complete: true });
    expect(dayStatus(habits, logs, '2026-10-06').total).toBe(0);
    expect(dayStatus(habits, logs, '2026-10-08')).toEqual({
      total: 1,
      done: 0,
      complete: false,
    });
  });

  it('am selben Tag wieder aufgenommen entsteht keine Pause', async () => {
    const a = await addHabit(rt, 'A', noon('2026-10-01'));
    await endHabit(rt, a.id, noon('2026-10-05'));
    const reopened = await reopenHabit(rt, a.id, noon('2026-10-05'));
    expect(reopened).not.toHaveProperty('pauses');
  });

  it('Löschen nimmt die Aufgabe ab heute heraus, frühere Tage bleiben; Rückgängig stellt her', async () => {
    const a = await addHabit(rt, 'A', noon('2026-10-01'));
    await setHabitDone(rt, a.id, '2026-10-02', true, noon('2026-10-02'));
    const before = (await listHabits(rt.db))[0]!;
    const removed = await removeHabit(rt, a.id, noon('2026-10-03'));
    expect(removed.removedAt).toBe('2026-10-03T12:00:00.000Z');
    expect(removed.toDayKey).toBe('2026-10-03');
    const habits = await listHabits(rt.db);
    const logs = await listHabitLogs(rt.db);
    expect(dayStatus(habits, logs, '2026-10-02')).toEqual({ total: 1, done: 1, complete: true });
    expect(dayStatus(habits, logs, '2026-10-03').total).toBe(0);
    const undone = await undoHabitChange(rt, before);
    expect(undone).not.toHaveProperty('removedAt');
    expect(undone).not.toHaveProperty('toDayKey');
  });

  it('Rückgängig nach Löschen einer pausierten Aufgabe lässt sie pausiert', async () => {
    const a = await addHabit(rt, 'A', noon('2026-10-01'));
    const paused = await endHabit(rt, a.id, noon('2026-10-02'));
    await removeHabit(rt, a.id, noon('2026-10-03'));
    const undone = await undoHabitChange(rt, paused);
    expect(undone.toDayKey).toBe('2026-10-02');
    expect(undone).not.toHaveProperty('removedAt');
  });
});

describe('Wochentage und automatisch abhaken (D-285)', () => {
  const noon = (day: string) => at(`${day}T12:00:00.000Z`);

  it('Wochentage gelten ab heute; am selben Tag ersetzt, alle sieben heißt jeden Tag', async () => {
    const a = await addHabit(rt, 'Training', noon('2026-10-01'));
    const first = await setHabitWeekdays(rt, a.id, [5, 1, 3, 3], noon('2026-10-05'));
    expect(first.schedule).toEqual([{ fromDayKey: '2026-10-05', weekdays: [1, 3, 5] }]);
    const sameDay = await setHabitWeekdays(rt, a.id, [1, 3], noon('2026-10-05'));
    expect(sameDay.schedule).toEqual([{ fromDayKey: '2026-10-05', weekdays: [1, 3] }]);
    const later = await setHabitWeekdays(rt, a.id, [2, 4], noon('2026-10-12'));
    expect(later.schedule).toEqual([
      { fromDayKey: '2026-10-05', weekdays: [1, 3] },
      { fromDayKey: '2026-10-12', weekdays: [2, 4] },
    ]);
    const unchanged = await setHabitWeekdays(rt, a.id, [2, 4], noon('2026-10-14'));
    expect(unchanged.schedule).toHaveLength(2);
    const all = await setHabitWeekdays(rt, a.id, [1, 2, 3, 4, 5, 6, 7], noon('2026-10-15'));
    expect(all.schedule?.at(-1)).toEqual({
      fromDayKey: '2026-10-15',
      weekdays: [1, 2, 3, 4, 5, 6, 7],
    });
    await expect(setHabitWeekdays(rt, a.id, [])).rejects.toBeInstanceOf(InvalidWeekdaysError);
  });

  it('hakt mit Training ab, aber nie gegen einen eigenen Eintrag', async () => {
    const a = await addHabit(rt, 'Training');
    const b = await addHabit(rt, 'Wasser');
    await setHabitAutoDone(rt, a.id, 'training');
    const habits = await listHabits(rt.db);
    const day = '2026-10-20';
    expect(await applyAutoDone(rt, habits, day, () => false, false)).toBe(0);
    expect(await applyAutoDone(rt, habits, day, () => false, true)).toBe(1);
    expect((await listHabitLogs(rt.db)).map((l) => [l.habitId, l.done])).toEqual([[a.id, true]]);
    await setHabitDone(rt, a.id, day, false);
    expect(await applyAutoDone(rt, habits, day, (id) => id === a.id, true)).toBe(0);
    expect((await listHabitLogs(rt.db)).find((l) => l.habitId === a.id)?.done).toBe(false);
    expect((await listHabitLogs(rt.db)).some((l) => l.habitId === b.id)).toBe(false);
    const off = await setHabitAutoDone(rt, a.id, null);
    expect(off).not.toHaveProperty('autoDone');
  });
});

describe('Mit Wasserziel abhaken (D-289)', () => {
  it('hakt nur Aufgaben mit dieser Regel ab, die heute fällig sind und offen', async () => {
    const day = '2026-10-20'; // Dienstag
    const clock = at('2026-10-18T10:00:00');
    const water = await addHabit(rt, '2 l Wasser', clock);
    const training = await addHabit(rt, 'Training', clock);
    const notToday = await addHabit(rt, 'Nur Montag', clock);
    await setHabitAutoDone(rt, water.id, 'water');
    await setHabitAutoDone(rt, training.id, 'training');
    await setHabitAutoDone(rt, notToday.id, 'water');
    await setHabitWeekdays(rt, notToday.id, [1], clock);
    expect(await applyWaterAutoDoneToday(rt, day)).toBe(1);
    const logs = await listHabitLogs(rt.db);
    expect(logs.map((log) => [log.habitId, log.dayKey, log.done])).toEqual([[water.id, day, true]]);
    // Selbst zurückgenommen: kein erneutes Abhaken.
    await setHabitDone(rt, water.id, day, false);
    expect(await applyWaterAutoDoneToday(rt, day)).toBe(0);
    expect((await listHabitLogs(rt.db)).find((log) => log.habitId === water.id)?.done).toBe(false);
  });

  it('ohne Aufgabe mit dieser Regel passiert nichts', async () => {
    await addHabit(rt, 'Lesen', at('2026-10-18T10:00:00'));
    expect(await applyWaterAutoDoneToday(rt, '2026-10-20')).toBe(0);
    expect(await listHabitLogs(rt.db)).toEqual([]);
  });
});
