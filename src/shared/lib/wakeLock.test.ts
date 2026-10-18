// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  isWakeLockSupported,
  keepScreenAwake,
  resetWakeLockForTests,
  subscribeWakeLockStatus,
  wakeLockStatus,
  type WakeLockStatus,
} from './wakeLock';

interface FakeSentinel {
  released: boolean;
  release: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
  fireRelease: () => void;
}

function fakeSentinel(): FakeSentinel {
  const listeners: (() => void)[] = [];
  const sentinel: FakeSentinel = {
    released: false,
    release: vi.fn(() => {
      sentinel.released = true;
      return Promise.resolve();
    }),
    addEventListener: vi.fn((_type: string, listener: () => void) => listeners.push(listener)),
    fireRelease: () => {
      sentinel.released = true;
      for (const listener of listeners) listener();
    },
  };
  return sentinel;
}

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: state });
}

function installWakeLock(request: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request } });
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

let statuses: WakeLockStatus[];
beforeEach(() => {
  statuses = [];
  setVisibility('visible');
  subscribeWakeLockStatus((status) => statuses.push(status));
});
afterEach(() => {
  resetWakeLockForTests();
  Reflect.deleteProperty(navigator, 'wakeLock');
});

describe('Bildschirm aktiv halten (AK-TRN-13)', () => {
  it('meldet fehlende Unterstützung', () => {
    expect(isWakeLockSupported()).toBe(false);
    const stop = keepScreenAwake();
    expect(statuses).toEqual(['unsupported']);
    stop();
    expect(wakeLockStatus()).toBe('unsupported');
  });

  it('fordert den Wake Lock an, gibt ihn beim Beenden frei und meldet jeden Schritt', async () => {
    const sentinel = fakeSentinel();
    const request = vi.fn(() => Promise.resolve(sentinel));
    installWakeLock(request);
    const stop = keepScreenAwake();
    await flush();
    expect(request).toHaveBeenCalledWith('screen');
    expect(statuses).toEqual(['active']);
    stop();
    expect(sentinel.release).toHaveBeenCalledTimes(1);
    expect(statuses).toEqual(['active', 'off']);
  });

  it('fordert nach einer Freigabe durch das System bei Rückkehr neu an', async () => {
    const first = fakeSentinel();
    const second = fakeSentinel();
    const request = vi.fn().mockResolvedValueOnce(first).mockResolvedValueOnce(second);
    installWakeLock(request);
    const stop = keepScreenAwake();
    await flush();
    setVisibility('hidden');
    first.fireRelease();
    expect(statuses).toEqual(['active', 'released']);
    // Verborgen: keine Anforderung.
    document.dispatchEvent(new Event('visibilitychange'));
    await flush();
    expect(request).toHaveBeenCalledTimes(1);
    setVisibility('visible');
    document.dispatchEvent(new Event('visibilitychange'));
    await flush();
    expect(request).toHaveBeenCalledTimes(2);
    expect(statuses).toEqual(['active', 'released', 'active']);
    // Solange der Lock gehalten wird, keine weitere Anforderung.
    document.dispatchEvent(new Event('visibilitychange'));
    await flush();
    expect(request).toHaveBeenCalledTimes(2);
    stop();
    expect(second.release).toHaveBeenCalledTimes(1);
  });

  it('meldet eine Ablehnung, z. B. im Stromsparmodus', async () => {
    installWakeLock(vi.fn(() => Promise.reject(new Error('NotAllowedError'))));
    const stop = keepScreenAwake();
    await flush();
    expect(statuses).toEqual(['denied']);
    stop();
  });

  it('gibt einen Lock frei, der erst nach dem Beenden ankommt', async () => {
    const sentinel = fakeSentinel();
    let resolve: (value: FakeSentinel) => void = () => undefined;
    installWakeLock(
      vi.fn(
        () =>
          new Promise<FakeSentinel>((r) => {
            resolve = r;
          }),
      ),
    );
    const stop = keepScreenAwake();
    stop();
    resolve(sentinel);
    await flush();
    expect(sentinel.release).toHaveBeenCalledTimes(1);
    expect(statuses).toEqual(['off']);
  });
});
