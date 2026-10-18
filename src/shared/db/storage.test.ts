// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  persistentStorageStatus,
  requestPersistentStorage,
  resetPersistentStorageForTests,
} from './storage';

function installStorage(api: object | undefined) {
  Object.defineProperty(navigator, 'storage', { configurable: true, value: api });
}

afterEach(() => {
  resetPersistentStorageForTests();
  Reflect.deleteProperty(navigator, 'storage');
});

describe('Dauerhafter Speicher (AK-PWA-05)', () => {
  it('meldet fehlende Unterstützung', async () => {
    installStorage(undefined);
    expect(await requestPersistentStorage()).toBe('unsupported');
    expect(await persistentStorageStatus()).toBe('unsupported');
  });

  it('fordert nur einmal an und merkt sich das Ergebnis', async () => {
    const persist = vi.fn(() => Promise.resolve(true));
    installStorage({ persist, persisted: () => Promise.resolve(true) });
    expect(await requestPersistentStorage()).toBe('persisted');
    expect(await requestPersistentStorage()).toBe('persisted');
    expect(persist).toHaveBeenCalledTimes(1);
    expect(await persistentStorageStatus()).toBe('persisted');
  });

  it('meldet eine Ablehnung oder einen Fehler als „nicht garantiert"', async () => {
    installStorage({
      persist: () => Promise.resolve(false),
      persisted: () => Promise.resolve(false),
    });
    expect(await requestPersistentStorage()).toBe('denied');
    expect(await persistentStorageStatus()).toBe('denied');
    resetPersistentStorageForTests();
    installStorage({
      persist: () => Promise.reject(new Error('kaputt')),
      persisted: () => Promise.reject(new Error('kaputt')),
    });
    expect(await requestPersistentStorage()).toBe('denied');
    expect(await persistentStorageStatus()).toBe('denied');
  });
});
