// @vitest-environment jsdom
// Teile der Datenbasis, die Browser-Ereignisse brauchen.
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestRuntime } from '../testing/db';
import { setConnectionState, useConnectionState } from './connection';
import { installGlobalErrorHandlers, listErrorLog } from './errorLog';
import { watchDatabaseHealth } from './health';
import type { DbRuntime } from './runtime';

let rt: DbRuntime;

beforeEach(async () => {
  rt = await createTestRuntime();
});

afterEach(async () => {
  cleanup();
  vi.restoreAllMocks();
  setConnectionState('ok');
  await rt.db.delete();
});

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: state });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('watchDatabaseHealth', () => {
  it('prüft bei Rückkehr in den Vordergrund und meldet einen Ausfall', async () => {
    vi.spyOn(rt.db.meta, 'get').mockImplementation(
      () => Promise.reject(new Error('Connection lost')) as never,
    );
    const onFailed = vi.fn();
    const stop = watchDatabaseHealth(rt.db, { onFailed }, 20);
    setVisibility('hidden');
    expect(onFailed).not.toHaveBeenCalled();
    setVisibility('visible');
    await vi.waitFor(() => {
      expect(onFailed).toHaveBeenCalledOnce();
    });
    stop();
  });

  it('meldet ein erfolgreiches Neuöffnen nach pageshow aus dem Zwischenspeicher', async () => {
    vi.spyOn(rt.db.meta, 'get').mockImplementationOnce(
      () => Promise.reject(new Error('Connection lost')) as never,
    );
    const onFailed = vi.fn();
    const onReopened = vi.fn();
    const stop = watchDatabaseHealth(rt.db, { onFailed, onReopened });
    const event = new Event('pageshow') as PageTransitionEvent;
    Object.defineProperty(event, 'persisted', { value: true });
    window.dispatchEvent(event);
    await vi.waitFor(() => {
      expect(onReopened).toHaveBeenCalledOnce();
    });
    expect(onFailed).not.toHaveBeenCalled();
    stop();
  });
});

describe('Verbindungszustand', () => {
  it('meldet, wenn ein anderes Fenster die Datenbank übernommen hat', () => {
    const { result } = renderHook(() => useConnectionState());
    expect(result.current).toBe('ok');
    act(() => {
      setConnectionState('replaced');
    });
    expect(result.current).toBe('replaced');
  });
});

describe('installGlobalErrorHandlers', () => {
  it('protokolliert unbehandelte Fehler und abgelehnte Promises', async () => {
    const remove = installGlobalErrorHandlers(() => rt.db);
    window.dispatchEvent(new ErrorEvent('error', { error: new Error('Absturz 7') }));
    const rejection = new Event('unhandledrejection') as PromiseRejectionEvent;
    Object.defineProperty(rejection, 'reason', { value: new TypeError('kaputt') });
    window.dispatchEvent(rejection);
    await vi.waitFor(async () => {
      const entries = await listErrorLog(rt.db);
      expect(entries.map((e) => [e.area, e.message])).toEqual([
        ['window', 'Error: Absturz #'],
        ['promise', 'TypeError: kaputt'],
      ]);
    });
    remove();
  });
});
