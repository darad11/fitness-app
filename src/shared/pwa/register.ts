/**
 * Registrierung des Service Workers (vite-plugin-pwa, `registerType: 'prompt'`).
 * Getrennt von state.ts, damit Tests den Zustand ohne virtuelles Modul nutzen können.
 */
import { registerSW } from 'virtual:pwa-register';
import { checkForUpdate, setPwaState, setRegistration, setUpdateActivator } from './state';

/** Höchstens einmal pro Stunde bei Rückkehr in den Vordergrund nach Updates fragen. */
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

export function startServiceWorker(onError?: (error: unknown) => void): void {
  if (!('serviceWorker' in navigator)) return;
  if (navigator.serviceWorker.controller) setPwaState({ offlineReady: true });

  let lastCheck = Date.now();
  const update = registerSW({
    onNeedRefresh() {
      setPwaState({ updateAvailable: true });
    },
    onOfflineReady() {
      setPwaState({ offlineReady: true });
    },
    onRegisteredSW(_url, registration) {
      setRegistration(registration ?? null);
    },
    onRegisterError(error: unknown) {
      onError?.(error);
    },
  });
  setUpdateActivator(() => update(true));

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (Date.now() - lastCheck < UPDATE_CHECK_INTERVAL_MS) return;
    lastCheck = Date.now();
    void checkForUpdate();
  });
}
