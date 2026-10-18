/**
 * Bildschirm aktiv halten (architecture.md Abschnitt 6.4, AK-TRN-13). Das System gibt den
 * Wake Lock frei, sobald die Seite verborgen ist; bei Rückkehr wird er neu angefordert.
 * In installierten Web-Apps unter iOS erst ab 18.4; im Stromsparmodus kann iOS ablehnen.
 */

export type WakeLockStatus = 'off' | 'active' | 'released' | 'unsupported' | 'denied';

type Listener = (status: WakeLockStatus) => void;

let lastStatus: WakeLockStatus = 'off';
const listeners = new Set<Listener>();

function publish(status: WakeLockStatus): void {
  lastStatus = status;
  for (const listener of listeners) listener(status);
}

/** Letzter gemeldeter Zustand, z. B. für die Trainingseinstellungen. */
export function wakeLockStatus(): WakeLockStatus {
  return lastStatus;
}

/** Meldet jeden Statuswechsel; gibt die Abmeldefunktion zurück. */
export function subscribeWakeLockStatus(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isWakeLockSupported(): boolean {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
}

/**
 * Hält den Bildschirm aktiv, bis die zurückgegebene Funktion aufgerufen wird. Der Zustand ist
 * über `wakeLockStatus` und `subscribeWakeLockStatus` abfragbar.
 */
export function keepScreenAwake(): () => void {
  if (!isWakeLockSupported()) {
    publish('unsupported');
    return () => undefined;
  }
  const state: { stopped: boolean; sentinel: WakeLockSentinel | null } = {
    stopped: false,
    sentinel: null,
  };
  const stopped = () => state.stopped;
  const held = () => state.sentinel !== null && !state.sentinel.released;

  const request = async () => {
    if (stopped() || document.visibilityState !== 'visible' || held()) return;
    try {
      const lock = await navigator.wakeLock.request('screen');
      if (stopped()) {
        void lock.release();
        return;
      }
      state.sentinel = lock;
      publish('active');
      lock.addEventListener('release', () => {
        if (!stopped()) publish('released');
      });
    } catch {
      publish('denied');
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
    if (held()) void state.sentinel?.release();
    publish('off');
  };
}

/** Nur für Tests. */
export function resetWakeLockForTests(): void {
  lastStatus = 'off';
  listeners.clear();
}
