// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  RELOAD_GUARD_MS,
  RELOAD_MARKER_KEY,
  decideRecovery,
  installChunkRecovery,
  isChunkLoadError,
  recoverFromChunkError,
  resetChunkRecovery,
  type RecoveryEnv,
  type RecoveryInput,
} from './chunkRecovery';

describe('isChunkLoadError', () => {
  it.each([
    'Failed to fetch dynamically imported module: https://x/assets/TodayPage-abc.js',
    'Importing a module script failed.',
    'error loading dynamically imported module: https://x/assets/a.js',
    'Unable to preload CSS for /assets/index-abc.css',
  ])('erkennt „%s“', (message) => {
    expect(isChunkLoadError(new TypeError(message))).toBe(true);
  });

  it.each([
    new TypeError('Load failed'),
    new Error('Ansicht kaputt'),
    'Importing a module script failed.',
    null,
  ])('lässt andere Fehler in Ruhe (%s)', (error) => {
    expect(isChunkLoadError(error)).toBe(false);
  });
});

describe('decideRecovery', () => {
  const base: RecoveryInput = {
    now: 10 * RELOAD_GUARD_MS,
    lastReloadAt: null,
    markerWritable: true,
    trainingRunning: false,
    canLoad: true,
  };

  it('lädt einmal neu, wenn nichts dagegen spricht', () => {
    expect(decideRecovery(base)).toEqual({ action: 'reload' });
  });

  it('nie während eines laufenden Trainings', () => {
    expect(decideRecovery({ ...base, trainingRunning: true })).toEqual({
      action: 'manual',
      reason: 'training',
    });
  });

  it('kein zweites Neuladen innerhalb von fünf Minuten (Schleifenschutz)', () => {
    expect(decideRecovery({ ...base, lastReloadAt: base.now - RELOAD_GUARD_MS + 1 })).toEqual({
      action: 'manual',
      reason: 'repeated',
    });
    expect(decideRecovery({ ...base, lastReloadAt: base.now - RELOAD_GUARD_MS })).toEqual({
      action: 'reload',
    });
  });

  it('ohne beschreibbaren Speicher kein automatisches Neuladen', () => {
    expect(decideRecovery({ ...base, markerWritable: false })).toEqual({
      action: 'manual',
      reason: 'repeated',
    });
  });

  it('ohne Service Worker und ohne Netz ein Hinweis statt der Fehlerseite des Browsers', () => {
    expect(decideRecovery({ ...base, canLoad: false })).toEqual({
      action: 'manual',
      reason: 'offline',
    });
  });
});

describe('recoverFromChunkError', () => {
  let store: Map<string, string>;
  let reload: ReturnType<typeof vi.fn<() => void>>;

  function install(patch: Partial<RecoveryEnv> = {}) {
    installChunkRecovery(() => Promise.resolve(false), {
      storage: {
        getItem: (key) => store.get(key) ?? null,
        setItem: (key, value) => {
          store.set(key, value);
        },
      },
      controlled: () => true,
      reachable: () => Promise.resolve(true),
      reload,
      now: () => 1_000_000,
      ...patch,
    });
  }

  beforeEach(() => {
    vi.useFakeTimers();
    store = new Map();
    reload = vi.fn<() => void>();
  });

  afterEach(() => {
    resetChunkRecovery();
    vi.useRealTimers();
  });

  it('ohne Einrichtung nie automatisch', async () => {
    expect(await recoverFromChunkError()).toEqual({ action: 'manual', reason: 'repeated' });
  });

  it('lädt genau einmal neu und merkt sich den Zeitpunkt', async () => {
    install();
    const [first, second] = await Promise.all([recoverFromChunkError(), recoverFromChunkError()]);
    expect(first).toEqual({ action: 'reload' });
    expect(second).toBe(first);
    expect(store.get(RELOAD_MARKER_KEY)).toBe('1000000');
    expect(reload).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(reload).toHaveBeenCalledOnce();
  });

  it('nach einem Neuladen vor weniger als fünf Minuten nur ein Hinweis', async () => {
    store.set(RELOAD_MARKER_KEY, String(1_000_000 - 60_000));
    install();
    expect(await recoverFromChunkError()).toEqual({ action: 'manual', reason: 'repeated' });
    vi.runAllTimers();
    expect(reload).not.toHaveBeenCalled();
  });

  it('während eines Trainings kein Neuladen; nach dem Training wieder', async () => {
    let running = true;
    install({ trainingRunning: () => Promise.resolve(running) });
    expect(await recoverFromChunkError()).toEqual({ action: 'manual', reason: 'training' });
    running = false;
    expect(await recoverFromChunkError()).toEqual({ action: 'reload' });
    vi.runAllTimers();
    expect(reload).toHaveBeenCalledOnce();
  });

  it('antwortet die Datenbank nicht, wird nicht neu geladen', async () => {
    install({ trainingRunning: () => Promise.reject(new Error('weg')) });
    expect(await recoverFromChunkError()).toEqual({ action: 'manual', reason: 'training' });
  });

  it('ohne Service Worker prüft es die Verbindung', async () => {
    install({ controlled: () => false, reachable: () => Promise.resolve(false) });
    expect(await recoverFromChunkError()).toEqual({ action: 'manual', reason: 'offline' });
  });

  it('verlässt die Seite sich gerade selbst, lädt es nicht neu', async () => {
    install();
    window.dispatchEvent(new Event('pagehide'));
    expect(await recoverFromChunkError()).toEqual({ action: 'manual', reason: 'repeated' });
    vi.runAllTimers();
    expect(reload).not.toHaveBeenCalled();
  });

  it('reagiert auf vite:preloadError', async () => {
    install();
    window.dispatchEvent(new Event('vite:preloadError'));
    await vi.waitFor(() => {
      expect(store.get(RELOAD_MARKER_KEY)).toBe('1000000');
    });
    vi.runAllTimers();
    expect(reload).toHaveBeenCalledOnce();
  });
});
