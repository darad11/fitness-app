/**
 * Registrierung des Service Workers (vite-plugin-pwa, `registerType: 'prompt'`).
 * Getrennt von state.ts, damit Tests den Zustand ohne virtuelles Modul nutzen können.
 *
 * Update-Strategie (E-16, D-343, architecture.md Abschnitt 9): Beim allerersten Start übernimmt der
 * Service Worker die offene Seite sofort (`clientsClaim`). Eine neue Version lädt im Hintergrund
 * vollständig in den Speicher und wartet; der Hinweis „Neue Version verfügbar“ erscheint, außer
 * während eines Trainings. Sie übernimmt nach „Jetzt aktualisieren“ oder beim nächsten Start der
 * App, wenn kein Fenster der alten Version mehr offen ist. Übernimmt sie, lädt die Seite neu, außer
 * während eines Trainings.
 */
import { registerSW } from 'virtual:pwa-register';
import {
  checkForUpdate,
  createControllerWatcher,
  setPwaState,
  setRegistration,
  setUpdateActivator,
} from './state';

/** Höchstens einmal pro Stunde bei Rückkehr in den Vordergrund nach Updates fragen. */
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

export interface ServiceWorkerOptions {
  onError?: (error: unknown) => void;
  /** Darf die Seite jetzt neu laden? Während eines Trainings nicht. */
  canReload?: () => Promise<boolean>;
}

export function startServiceWorker(options: ServiceWorkerOptions = {}): void {
  if (!('serviceWorker' in navigator)) return;
  const container = navigator.serviceWorker;
  if (container.controller) setPwaState({ offlineReady: true });

  // Eigene Behandlung des Wechsels statt `onNeedReload` von vite-plugin-pwa: Dort zählt nur als
  // Update, was die Seite schon beim Laden steuerte; nach der Übernahme beim ersten Start fehlte
  // sonst das Neuladen.
  const onControllerChange = createControllerWatcher(
    container.controller !== null,
    options.canReload ?? (() => Promise.resolve(true)),
  );
  container.addEventListener('controllerchange', () => {
    void onControllerChange();
  });

  let lastCheck = Date.now();
  const update = registerSW({
    onNeedRefresh() {
      setPwaState({ updateAvailable: true });
    },
    // Das Neuladen übernimmt `onControllerChange`.
    onNeedReload() {
      // bewusst leer
    },
    onOfflineReady() {
      setPwaState({ offlineReady: true });
    },
    onRegisteredSW(_url, registration) {
      setRegistration(registration ?? null);
    },
    onRegisterError(error: unknown) {
      options.onError?.(error);
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
