import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestRuntime } from '../testing/db';
import { rootFieldsSchema } from './documents';
import type { DbRuntime } from './runtime';
import { DB_VERSION, STORES_CURRENT, STORES_V1 } from './schema';

let rt: DbRuntime;

beforeEach(async () => {
  rt = await createTestRuntime();
});

afterEach(async () => {
  await rt.db.delete();
});

const validRoot = {
  id: '2ed6657d-e927-568b-95e1-2665a8aea6a2',
  type: 'session',
  schemaVersion: 1,
  createdAt: '2026-10-18T09:15:02.123Z',
  hlc: '2026-10-18T09:15:02.123Z-0000-a1b2c3d4',
  deletedAt: null,
  deviceId: 'a1b2c3d4',
};

describe('Dexie-Schema v7 (data-model.md Abschnitt 6)', () => {
  it('enthält die Tabellen des MVP plus Tagesaufgaben, Ernährung, Rezepte, Vorlagen, Sync-Basis und Einkaufsliste', () => {
    expect(DB_VERSION).toBe(7);
    expect(rt.db.verno).toBe(7);
    expect(rt.db.tables.map((table) => table.name).sort()).toEqual(
      Object.keys(STORES_CURRENT).sort(),
    );
    expect(Object.keys(STORES_CURRENT).filter((name) => !(name in STORES_V1))).toEqual([
      'habits',
      'habitLogs',
      'foods',
      'foodLog',
      'nutritionTargets',
      'recipes',
      'mealTemplates',
      'syncBase',
      'shoppingItems',
    ]);
  });

  it('legt die dokumentierten Indizes an', () => {
    const indexes = (name: keyof typeof STORES_CURRENT) =>
      rt.db.table(name).schema.indexes.map((index) => index.name);
    expect(indexes('sessions')).toEqual(
      expect.arrayContaining([
        'status',
        'dayKey',
        'startedAt',
        'endedAt',
        'exerciseIds',
        '[program.programId+endedAt]',
      ]),
    );
    expect(indexes('exerciseHistory')).toEqual(
      expect.arrayContaining(['[exerciseId+completedAt]', 'sessionId']),
    );
    expect(indexes('habitLogs')).toEqual(expect.arrayContaining(['habitId', 'dayKey']));
    expect(indexes('foods')).toEqual(expect.arrayContaining(['nameNorm', 'barcode', 'archivedAt']));
    expect(indexes('foodLog')).toEqual(expect.arrayContaining(['dayKey', 'foodId']));
    expect(indexes('nutritionTargets')).toEqual(expect.arrayContaining(['effectiveFrom']));
    expect(indexes('recipes')).toEqual(expect.arrayContaining(['nameNorm', 'archivedAt']));
    expect(indexes('mealTemplates')).toEqual(expect.arrayContaining(['archivedAt']));
    expect(indexes('shoppingItems')).toEqual(expect.arrayContaining(['clearedAt']));
    expect(rt.db.errorLog.schema.primKey.auto).toBe(true);
  });

  it('findet Einheiten über Mehrfach- und zusammengesetzte Indizes', async () => {
    await rt.db.sessions.put({
      ...validRoot,
      status: 'completed',
      dayKey: '2026-10-18',
      startedAt: '2026-10-18T09:00:00.000Z',
      endedAt: '2026-10-18T10:00:00.000Z',
      exerciseIds: ['ex-1', 'ex-2'],
      program: { programId: 'prog-1' },
    });
    expect(await rt.db.sessions.where('exerciseIds').equals('ex-2').count()).toBe(1);
    expect(
      await rt.db.sessions
        .where('[program.programId+endedAt]')
        .between(['prog-1', ''], ['prog-1', '\uffff'])
        .count(),
    ).toBe(1);
  });
});

describe('Basisfelder (AK-DAT-11)', () => {
  it('akzeptiert ein vollständiges Dokument', () => {
    expect(rootFieldsSchema.safeParse(validRoot).success).toBe(true);
  });

  it.each([
    ['ID fehlt', { id: undefined }],
    ['Erstellzeit ohne Millisekunden', { createdAt: '2026-10-18T09:15:02Z' }],
    ['HLC ungültig', { hlc: '2026-10-18' }],
    ['Löschmarke fehlt', { deletedAt: undefined }],
    ['Löschmarke kein HLC', { deletedAt: 'ja' }],
    ['Schemaversion fehlt', { schemaVersion: undefined }],
    ['Geräte-ID ungültig', { deviceId: 'ABC' }],
  ])('lehnt ab: %s', (_label, patch) => {
    expect(rootFieldsSchema.safeParse({ ...validRoot, ...patch }).success).toBe(false);
  });
});
