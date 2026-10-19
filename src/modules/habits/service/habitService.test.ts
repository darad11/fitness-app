import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { streak } from '../calc/streak';
import { habitLogId, listHabitLogs, listHabits } from '../data/habitRepository';
import {
  addHabit,
  deleteHabit,
  endHabit,
  InvalidNameError,
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
  it('schreibt genau ein Dokument je Aufgabe und Tag und zählt die Serie', async () => {
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
    expect(streak(await listHabits(rt.db), logs, '2026-10-17')).toEqual({
      days: 2,
      includesToday: true,
    });
    expect(await listHabitLogs(rt.db, '2026-10-17')).toHaveLength(1);
  });
});
