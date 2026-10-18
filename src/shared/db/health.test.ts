import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestRuntime } from '../testing/db';
import { checkDatabaseHealth, controlledRestart } from './health';
import type { DbRuntime } from './runtime';

let rt: DbRuntime;

beforeEach(async () => {
  rt = await createTestRuntime();
});

afterEach(async () => {
  vi.restoreAllMocks();
  await rt.db.delete();
});

describe('checkDatabaseHealth (D-216)', () => {
  it('meldet eine funktionierende Verbindung', async () => {
    expect(await checkDatabaseHealth(rt.db)).toBe('ok');
  });

  it('öffnet nach einem fehlgeschlagenen Lesezugriff einmal neu', async () => {
    // Erster Lesezugriff scheitert, danach greift wieder die echte Methode.
    const spy = vi
      .spyOn(rt.db.meta, 'get')
      .mockImplementationOnce(() => Promise.reject(new Error('Connection lost')) as never);
    expect(await checkDatabaseHealth(rt.db)).toBe('reopened');
    expect(spy).toHaveBeenCalledTimes(2);
    expect(rt.db.isOpen()).toBe(true);
  });

  it('meldet einen Fehler, wenn auch das Neuöffnen nicht hilft', async () => {
    vi.spyOn(rt.db.meta, 'get').mockImplementation(
      () => Promise.reject(new Error('Connection lost')) as never,
    );
    expect(await checkDatabaseHealth(rt.db)).toBe('failed');
  });

  it('wertet einen hängenden Lesezugriff nach Zeitüberschreitung als Fehler', async () => {
    vi.spyOn(rt.db.meta, 'get').mockImplementation(() => new Promise(() => undefined) as never);
    expect(await checkDatabaseHealth(rt.db, 20)).toBe('failed');
  });
});

describe('controlledRestart', () => {
  function memoryStorage() {
    const data = new Map<string, string>();
    return {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => {
        data.set(key, value);
      },
    };
  }

  it('lädt neu, verhindert aber eine Schleife innerhalb einer Minute', () => {
    const storage = memoryStorage();
    const reload = vi.fn();
    let now = 1_000_000;
    const clock = () => now;
    expect(controlledRestart(storage, reload, clock)).toBe('reloading');
    now += 5_000;
    expect(controlledRestart(storage, reload, clock)).toBe('reloading');
    now += 5_000;
    expect(controlledRestart(storage, reload, clock)).toBe('loop-detected');
    expect(reload).toHaveBeenCalledTimes(2);
    now += 61_000;
    expect(controlledRestart(storage, reload, clock)).toBe('reloading');
    expect(reload).toHaveBeenCalledTimes(3);
  });

  it('übersteht beschädigte Einträge im Speicher', () => {
    const storage = memoryStorage();
    storage.setItem('fitness.restarts', '{kaputt');
    const reload = vi.fn();
    expect(controlledRestart(storage, reload)).toBe('reloading');
    expect(reload).toHaveBeenCalledOnce();
  });
});
