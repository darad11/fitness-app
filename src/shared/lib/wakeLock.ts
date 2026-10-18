/**
 * Bildschirm aktiv halten (architecture.md Abschnitt 6.4, AK-TRN-13). Das System gibt den
 * Wake Lock frei, sobald die Seite verborgen ist; bei Rückkehr wird er neu angefordert.
 * In installierten Web-Apps unter iOS erst ab 18.4; im Stromsparmodus kann iOS ablehnen.
 */

export type WakeLockStatus = 'off' | 'active' | 'released' | 'unsupported' | 'denied';

export function isWakeLockSupported(): boolean {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
}

/**
 * Hält den Bildschirm aktiv, bis `stop` aufgerufen wird. Meldet Statuswechsel über `onStatus`.
 */
export function keepScreenAwake(onStatus: (status: WakeLockStatus) => void): () => void {
  if (!isWakeLockSupported()) {
    onStatus('unsupported');
    return () => undefined;
  }
  let sentinel: WakeLockSentinel | null = null;
  const state = { stopped: false };

  const request = async () => {
    if (state.stopped || document.visibilityState !== 'visible' || (sentinel && !sentinel.released))
      return;
    try {
      const lock = await navigator.wakeLock.request('screen');
      if (state.stopped) {
        void lock.release();
        return;
      }
      sentinel = lock;
      onStatus('active');
      lock.addEventListener('release', () => {
        if (!state.stopped) onStatus('released');
      });
    } catch {
      onStatus('denied');
    }
  };
  const onVisibility = () => {
    if (document.visibilityState === 'visible') void request();
  };

  document.addEventListener('visibilitychange', onVisibility);
  void request();
  return () => {
    state.stopped = true;
    document.removeEventListener('visibilitychange', onVisibility);
    if (sentinel && !sentinel.released) void sentinel.release();
    onStatus('off');
  };
}
