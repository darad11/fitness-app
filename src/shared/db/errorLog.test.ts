import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestRuntime } from '../testing/db';
import {
  describeError,
  listErrorLog,
  logError,
  recentErrors,
  sanitizeMessage,
  sanitizeRoute,
} from './errorLog';
import type { DbRuntime } from './runtime';

let rt: DbRuntime;

beforeEach(async () => {
  rt = await createTestRuntime();
});

afterEach(async () => {
  await rt.db.delete();
});

describe('Bereinigung ohne Nutzdaten', () => {
  it('entfernt Zahlen, Text in Anführungszeichen und IDs', () => {
    expect(sanitizeMessage('Gewicht "82,5" ungültig für 3 Sätze')).toBe(
      'Gewicht "…" ungültig für # Sätze',
    );
    expect(sanitizeMessage('Notiz „Knie schmerzt" fehlt')).toBe('Notiz "…" fehlt');
    expect(sanitizeMessage('Notiz „Knie schmerzt“ fehlt')).toBe('Notiz "…" fehlt');
    expect(sanitizeMessage("Name 'Max' «Test»")).toBe('Name "…" "…"');
    expect(sanitizeMessage('Key 2ed6657d-e927-568b-95e1-2665a8aea6a2 not found')).toBe(
      'Key :id not found',
    );
  });

  it('kürzt Routen auf den Pfad und ersetzt IDs und Zahlen', () => {
    expect(sanitizeRoute('/training/einheit/2ed6657d-e927-568b-95e1-2665a8aea6a2?tab=2#satz')).toBe(
      '/training/einheit/:id',
    );
    expect(sanitizeRoute('/ernaehrung/2026-10-18')).toBe('/ernaehrung/#-#-#');
  });

  it('protokolliert bei Werten, die kein Error sind, nur deren Art', () => {
    const description = describeError('Maximal 82 kg bei Max Mustermann');
    expect(description.message).toBe('Kein Error-Objekt (string)');
    const fromError = describeError(new TypeError('x is 5'));
    expect(fromError.message).toBe('TypeError: x is #');
    expect(fromError.stackHash).toMatch(/^[0-9a-f]{8}$/);
  });
});

describe('logError', () => {
  it('speichert bereinigte Einträge mit App-Version', async () => {
    await logError(rt.db, { area: 'test', error: new Error('Wert 42'), route: '/heute?x=1' });
    const [entry] = await listErrorLog(rt.db);
    expect(entry).toMatchObject({
      level: 'error',
      area: 'test',
      message: 'Error: Wert #',
      route: '/heute',
    });
    expect(entry?.appVersion).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('hält den Ringpuffer auf der Höchstzahl', async () => {
    for (let i = 0; i < 8; i++) {
      await logError(rt.db, { area: `bereich-${'x'.repeat(i)}`, error: new Error('f') }, 5);
    }
    const entries = await listErrorLog(rt.db);
    expect(entries).toHaveLength(5);
    expect(entries.map((e) => e.area.length)).toEqual([11, 12, 13, 14, 15]);
  });

  it('wirft nie, auch ohne oder mit geschlossener Datenbank', async () => {
    await expect(
      logError(null, { area: 'ohne-db', error: new Error('a') }),
    ).resolves.toBeUndefined();
    expect(recentErrors().at(-1)?.area).toBe('ohne-db');
    rt.db.close();
    await expect(logError(rt.db, { area: 'zu', error: new Error('b') })).resolves.toBeUndefined();
  });
});
