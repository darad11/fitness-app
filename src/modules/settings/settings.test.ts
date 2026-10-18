import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { rootFieldsSchema, type DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { loadSettings, saveSettings, SETTINGS_ID } from './data/settingsRepository';
import { SETTINGS_DEFAULTS, type SettingsData } from './model/settings';

let rt: DbRuntime;

beforeEach(async () => {
  rt = await createTestRuntime();
});

afterEach(async () => {
  await rt.db.delete();
});

describe('Einstellungen', () => {
  it('haben die Standardwerte aus data-model.md 3.7', () => {
    expect(SETTINGS_DEFAULTS).toEqual({
      restDefaultSec: 90,
      weightStepKg: 2.5,
      autoStartRest: true,
      restSound: true,
      keepAwake: true,
      theme: 'light',
      locale: 'auto',
      backupReminderDays: 14,
    });
  });

  it('nutzen eine feste ID auf allen Geräten', () => {
    expect(SETTINGS_ID).toBe('3b4e83d2-1b96-5236-a5e7-cd8bc0fc9153');
  });

  it('liefern Standardwerte, ohne etwas zu speichern', async () => {
    expect(await loadSettings(rt.db)).toEqual(SETTINGS_DEFAULTS);
    expect(await rt.db.singletons.count()).toBe(0);
  });

  it('speichern einzelne Felder als Singleton-Dokument', async () => {
    const saved = await saveSettings(rt, { theme: 'dark' });
    expect(saved).toEqual({ ...SETTINGS_DEFAULTS, theme: 'dark' });
    const stored = await rt.db.singletons.get(SETTINGS_ID);
    expect(stored).toMatchObject({ type: 'settings', schemaVersion: 1, theme: 'dark' });
    expect(rootFieldsSchema.safeParse(stored).success).toBe(true);

    const again = await saveSettings(rt, { locale: 'de-AT' });
    expect(again).toMatchObject({ theme: 'dark', locale: 'de-AT' });
    const updated = await rt.db.singletons.get(SETTINGS_ID);
    expect(updated?.createdAt).toBe(stored?.createdAt);
    expect(updated && stored && updated.hlc > stored.hlc).toBe(true);
    expect(await loadSettings(rt.db)).toEqual(again);
  });

  it('lehnen ungültige Werte ab und speichern dann nichts', async () => {
    const invalid = { theme: 'pink' } as unknown as Partial<SettingsData>;
    await expect(saveSettings(rt, invalid)).rejects.toThrow(ZodError);
    expect(await rt.db.singletons.count()).toBe(0);
  });
});
