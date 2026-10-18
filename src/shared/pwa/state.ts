/**
 * Zustand des Service Workers für die Oberfläche (architecture.md Abschnitt 9):
 * Offline-Bereitschaft, wartende neue Version, Suche nach Updates.
 * Eine neue Version wird erst nach „Jetzt aktualisieren" aktiv (AK-PWA-03).
 */
import { useSyncExternalStore } from 'react';

export interface PwaState {
  /** Der Browser unterstützt Service Worker. */
  readonly supported: boolean;
  /** Alle Dateien sind für den Offline-Start gespeichert. */
  readonly offlineReady: boolean;
  /** Eine neue Version ist geladen und wartet auf Bestätigung. */
  readonly updateAvailable: boolean;
  readonly registered: boolean;
}

const initialState: PwaState = {
  supported: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
  offlineReady: false,
  updateAvailable: false,
  registered: false,
};

let state: PwaState = initialState;
let registration: ServiceWorkerRegistration | null = null;
let activateUpdate: (() => Promise<void>) | null = null;
const listeners = new Set<() => void>();

export function setPwaState(patch: Partial<PwaState>): void {
  const next = { ...state, ...patch };
  if (
    next.supported === state.supported &&
    next.offlineReady === state.offlineReady &&
    next.updateAvailable === state.updateAvailable &&
    next.registered === state.registered
  ) {
    return;
  }
  state = next;
  listeners.forEach((listener) => {
    listener();
  });
}

export function getPwaState(): PwaState {
  return state;
}

export function setRegistration(value: ServiceWorkerRegistration | null): void {
  registration = value;
  setPwaState({ registered: value !== null });
}

export function setUpdateActivator(fn: () => Promise<void>): void {
  activateUpdate = fn;
}

/** Aktiviert die wartende Version; die Seite lädt danach neu. */
export async function applyUpdate(): Promise<void> {
  await activateUpdate?.();
}

export type UpdateCheckResult = 'update-available' | 'up-to-date' | 'unavailable' | 'failed';

/** Fragt beim Server nach einer neuen Version (Mehr › Über, Rückkehr in den Vordergrund). */
export async function checkForUpdate(): Promise<UpdateCheckResult> {
  if (!registration) return 'unavailable';
  try {
    await registration.update();
  } catch {
    return 'failed';
  }
  if (state.updateAvailable || registration.waiting || registration.installing) {
    return 'update-available';
  }
  return 'up-to-date';
}

/** Nur für Tests. */
export function resetPwaState(patch: Partial<PwaState> = {}): void {
  state = { ...initialState, ...patch };
  registration = null;
  activateUpdate = null;
  listeners.forEach((listener) => {
    listener();
  });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePwaState(): PwaState {
  return useSyncExternalStore(subscribe, getPwaState, getPwaState);
}
