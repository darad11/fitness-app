/**
 * Migrationstests (AK-DAT-07, data-model.md Abschnitt 13): Für jede Schemaversion liegt eine
 * Datenbank der Vorversion als Fixture vor; das Öffnen mit der aktuellen Version muss alle
 * Dokumente erhalten. v1 → v2 (Schritt F) fügt die Tabellen `habits` und `habitLogs` hinzu,
 * v2 → v3 (Schritt G) `foods`, `foodLog` und `nutritionTargets`, v3 → v4 (M7) `recipes`, v4 → v5
 * (NU-11) `mealTemplates`; vor dem Upgrade entsteht ein Snapshot (AK-DAT-06).
 */
import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { seedLegacyDatabase } from '../testing/legacyDb';
import { AppDb, DB_VERSION, STORES_V1, STORES_V2, STORES_V3, STORES_V4 } from './schema';
import { listSnapshots, snapshotBeforeUpgradeIfNeeded } from './snapshots';

const DB = 'fitness-migration-test';
const SNAPSHOTS = 'fitness-migration-test-snapshots';

const V1_ROWS = {
  sessions: [
    {
      id: '2fbd2e1c-8f6d-4f3e-9a8e-1f2a3b4c5d6e',
      type: 'session',
      schemaVersion: 1,
      createdAt: '2026-10-18T10:00:00.000Z',
      updatedAt: '2026-10-18T10:30:00.000Z',
      hlc: '00000000000000000000:00000000:a1b2c3d4',
      deletedAt: null,
      kind: 'strength',
      source: 'free',
      status: 'completed',
      title: 'Alt',
      dayKey: '2026-10-18',
      tz: 'Europe/Vienna',
      startedAt: '2026-10-18T10:00:00.000Z',
      endedAt: '2026-10-18T10:30:00.000Z',
      durationSec: 1800,
      pauses: [],
      exerciseIds: [],
      exercises: [],
    },
  ],
  meta: [{ key: 'deviceId', value: 'a1b2c3d4' }],
};

afterEach(async () => {
  await Dexie.delete(DB);
  await Dexie.delete(SNAPSHOTS);
});

describe('Migration auf Schemaversion ' + String(DB_VERSION), () => {
  it('sichert eine v4-Datenbank und öffnet sie als v5 verlustfrei', async () => {
    const recipe = {
      id: '9c0d2e1c-8f6d-4f3e-9a8e-1f2a3b4c5d6e',
      type: 'recipe',
      schemaVersion: 1,
      createdAt: '2026-10-19T10:00:00.000Z',
      hlc: '00000000000000000000:00000000:a1b2c3d4',
      deletedAt: null,
      name: 'Oats',
      nameNorm: 'oats',
      servings: 2,
      ingredients: [],
    };
    await seedLegacyDatabase(DB, 4, STORES_V4, { ...V1_ROWS, recipes: [recipe] });
    expect(await snapshotBeforeUpgradeIfNeeded(DB, DB_VERSION, { snapshotDbName: SNAPSHOTS })).toBe(
      'created',
    );
    expect((await listSnapshots({ snapshotDbName: SNAPSHOTS }))[0]).toMatchObject({
      reason: 'schema-upgrade',
      sourceVersion: 4,
      counts: { sessions: 1, recipes: 1, meta: 1 },
    });
    const db = new AppDb(DB);
    await db.open();
    try {
      expect(db.verno).toBe(DB_VERSION);
      expect(await db.mealTemplates.count()).toBe(0);
      expect((await db.recipes.get(recipe.id))?.name).toBe('Oats');
      expect(await db.sessions.count()).toBe(1);
    } finally {
      db.close();
    }
  });

  it('sichert eine v3-Datenbank und öffnet sie als aktuelle Version verlustfrei', async () => {
    const food = {
      id: '8c0d2e1c-8f6d-4f3e-9a8e-1f2a3b4c5d6e',
      type: 'food',
      schemaVersion: 1,
      createdAt: '2026-10-19T10:00:00.000Z',
      hlc: '00000000000000000000:00000000:a1b2c3d4',
      deletedAt: null,
      name: 'Skyr',
      nameNorm: 'skyr',
      barcode: '9001234567896',
      basis: 'g',
      per100: { kcal: 63, protein: 11, carbs: 4, fat: 0.2 },
      servings: [],
      source: 'off',
      quality: 'community',
    };
    await seedLegacyDatabase(DB, 3, STORES_V3, { ...V1_ROWS, foods: [food] });
    expect(await snapshotBeforeUpgradeIfNeeded(DB, DB_VERSION, { snapshotDbName: SNAPSHOTS })).toBe(
      'created',
    );
    expect((await listSnapshots({ snapshotDbName: SNAPSHOTS }))[0]).toMatchObject({
      reason: 'schema-upgrade',
      sourceVersion: 3,
      counts: { sessions: 1, foods: 1, meta: 1 },
    });
    const db = new AppDb(DB);
    await db.open();
    try {
      expect(db.verno).toBe(DB_VERSION);
      expect(await db.recipes.count()).toBe(0);
      expect((await db.foods.get(food.id))?.name).toBe('Skyr');
      expect(await db.foods.where('barcode').equals('9001234567896').count()).toBe(1);
      expect(await db.sessions.count()).toBe(1);
    } finally {
      db.close();
    }
  });

  it('sichert eine v2-Datenbank und öffnet sie als aktuelle Version verlustfrei', async () => {
    const habit = {
      id: '7c0d2e1c-8f6d-4f3e-9a8e-1f2a3b4c5d6e',
      type: 'habit',
      schemaVersion: 1,
      createdAt: '2026-10-18T10:00:00.000Z',
      hlc: '00000000000000000000:00000000:a1b2c3d4',
      deletedAt: null,
      name: 'Wasser trinken',
      position: 0,
      fromDayKey: '2026-10-18',
    };
    await seedLegacyDatabase(DB, 2, STORES_V2, { ...V1_ROWS, habits: [habit] });
    expect(await snapshotBeforeUpgradeIfNeeded(DB, DB_VERSION, { snapshotDbName: SNAPSHOTS })).toBe(
      'created',
    );
    expect((await listSnapshots({ snapshotDbName: SNAPSHOTS }))[0]).toMatchObject({
      reason: 'schema-upgrade',
      sourceVersion: 2,
      counts: { sessions: 1, habits: 1, meta: 1 },
    });
    const db = new AppDb(DB);
    await db.open();
    try {
      expect(db.verno).toBe(DB_VERSION);
      expect(await db.foods.count()).toBe(0);
      expect(await db.foodLog.count()).toBe(0);
      expect(await db.nutritionTargets.count()).toBe(0);
      expect((await db.habits.get(habit.id))?.name).toBe('Wasser trinken');
      expect(await db.sessions.count()).toBe(1);
    } finally {
      db.close();
    }
  });

  it('sichert eine v1-Datenbank und öffnet sie als aktuelle Version verlustfrei', async () => {
    await seedLegacyDatabase(DB, 1, STORES_V1, V1_ROWS);
    expect(await snapshotBeforeUpgradeIfNeeded(DB, DB_VERSION, { snapshotDbName: SNAPSHOTS })).toBe(
      'created',
    );
    expect((await listSnapshots({ snapshotDbName: SNAPSHOTS }))[0]).toMatchObject({
      reason: 'schema-upgrade',
      sourceVersion: 1,
    });
    const db = new AppDb(DB);
    await db.open();
    try {
      expect(db.verno).toBe(DB_VERSION);
      expect(await db.habits.count()).toBe(0);
      expect(await db.habitLogs.count()).toBe(0);
      expect(await db.sessions.count()).toBe(1);
      expect((await db.sessions.get(V1_ROWS.sessions[0]!.id))?.title).toBe('Alt');
      expect((await db.meta.get('deviceId'))?.value).toBe('a1b2c3d4');
    } finally {
      db.close();
    }
  });

  it('erstellt bei aktueller Version keinen Snapshot', async () => {
    const db = new AppDb(DB);
    await db.open();
    db.close();
    expect(await snapshotBeforeUpgradeIfNeeded(DB, DB_VERSION, { snapshotDbName: SNAPSHOTS })).toBe(
      'current',
    );
    expect(await listSnapshots({ snapshotDbName: SNAPSHOTS })).toHaveLength(0);
  });

  it('sichert vor einem Upgrade auf eine höhere Version einen Snapshot', async () => {
    await seedLegacyDatabase(DB, 1, STORES_V1, V1_ROWS);
    expect(
      await snapshotBeforeUpgradeIfNeeded(DB, DB_VERSION + 1, { snapshotDbName: SNAPSHOTS }),
    ).toBe('created');
    const snapshots = await listSnapshots({ snapshotDbName: SNAPSHOTS });
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]).toMatchObject({
      reason: 'schema-upgrade',
      sourceVersion: 1,
      counts: { sessions: 1, meta: 1 },
    });
  });
});
