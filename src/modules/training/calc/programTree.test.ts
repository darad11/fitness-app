import { describe, expect, it } from 'vitest';
import type { ProgramDoc, StoredWeek, Week } from '../model/program';
import { copyWeeks, mergeWeeks, toOwnProgram } from './programTree';

const H1 = '000001900000000-0000-a1b2c3d4';
const H2 = '000001900000001-0000-a1b2c3d4';

function plan(): Week[] {
  return [
    {
      id: 'w1',
      position: 0,
      name: 'Woche 1',
      days: [
        {
          id: 'd1',
          position: 0,
          name: 'Push',
          exercises: [
            {
              id: 'e1',
              position: 0,
              exerciseId: 'x1',
              nameSnapshot: 'Bankdrücken',
              sets: [
                { id: 's1', position: 0, type: 'working', repsMin: 6, repsMax: 8 },
                {
                  id: 's2',
                  position: 1,
                  type: 'drop',
                  parentSetId: 's1',
                  repsMin: 8,
                  repsMax: 12,
                  restSec: 0,
                },
              ],
            },
          ],
        },
        { id: 'd2', position: 1, name: 'Pull', exercises: [] },
      ],
    },
  ];
}

describe('Zusammenführen mit Änderungsstempeln (D-257)', () => {
  it('stempelt beim Anlegen jedes Element', () => {
    const stored = mergeWeeks([], plan(), H1);
    expect(stored[0]).toMatchObject({ hlc: H1, deletedAt: null });
    expect(stored[0]?.days[0]?.exercises[0]?.sets[1]).toMatchObject({
      hlc: H1,
      deletedAt: null,
      parentSetId: 's1',
    });
  });

  it('stempelt nur Geänderte neu und markiert Entferntes als gelöscht', () => {
    const stored = mergeWeeks([], plan(), H1);
    const next = plan();
    next[0]!.days[0]!.exercises[0]!.sets[0]!.repsMax = 10;
    next[0]!.days.splice(1, 1);
    const merged: StoredWeek[] = mergeWeeks(stored, next, H2);
    const week = merged[0]!;
    expect(week.hlc).toBe(H1);
    const [push, pull] = week.days;
    expect(push?.hlc).toBe(H1);
    expect(push?.exercises[0]?.hlc).toBe(H1);
    expect(push?.exercises[0]?.sets.map((s) => s.hlc)).toEqual([H2, H1]);
    expect(pull).toMatchObject({ id: 'd2', deletedAt: H2, hlc: H2 });
  });

  it('stempelt eine Verschiebung neu (Position geändert)', () => {
    const stored = mergeWeeks([], plan(), H1);
    const next = plan();
    next[0]!.days.reverse();
    const merged = mergeWeeks(stored, next, H2);
    expect(merged[0]?.days.map((d) => [d.id, d.position, d.hlc])).toEqual([
      ['d2', 0, H2],
      ['d1', 1, H2],
    ]);
  });

  it('liefert die Anzeigeform ohne Gelöschtes und nach Position sortiert', () => {
    const next = plan();
    next[0]!.days.splice(0, 1);
    const weeks = mergeWeeks(mergeWeeks([], plan(), H1), next, H2);
    const doc = {
      id: '0b4c3c47-6d3f-4f19-9a43-7f1c9e9b2a10',
      type: 'program',
      schemaVersion: 1,
      createdAt: '2026-10-19T08:00:00.000Z',
      hlc: H2,
      deletedAt: null,
      deviceId: 'a1b2c3d4',
      kind: 'program',
      name: 'Mein Plan',
      origin: 'user',
      repeat: true,
      weeks,
    } satisfies ProgramDoc;
    const view = toOwnProgram(doc);
    expect(view.weeks[0]?.days).toEqual([{ id: 'd2', position: 0, name: 'Pull', exercises: [] }]);
    expect(view).toMatchObject({ kind: 'program', origin: 'user', name: 'Mein Plan' });
  });
});

describe('Kopieren (AK-PRG-05)', () => {
  it('vergibt neue IDs und verknüpft Drops mit dem neuen Arbeitssatz', () => {
    let n = 0;
    const copy = copyWeeks(plan(), () => `neu-${String(++n)}`);
    const sets = copy[0]?.days[0]?.exercises[0]?.sets ?? [];
    expect(copy[0]?.id).not.toBe('w1');
    expect(sets[0]?.id).not.toBe('s1');
    expect(sets[1]?.parentSetId).toBe(sets[0]?.id);
    expect(new Set(JSON.stringify(copy).match(/neu-\d+/g)).size).toBe(n);
    // Inhalt bleibt gleich.
    expect(sets.map((s) => [s.type, s.repsMin, s.repsMax])).toEqual([
      ['working', 6, 8],
      ['drop', 8, 12],
    ]);
  });
});
