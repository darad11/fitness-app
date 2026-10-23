/**
 * Fehlgeschlagener Import eines nachgeladenen Teils (E-16, D-343).
 *
 * Ursachen: Nach einem Deployment gibt es die gehashten Dateien der alten Version nicht mehr
 * (Vercel liefert für eine fehlende Datei `index.html`, der Browser lehnt sie als Modul ab), oder
 * die Seite läuft ohne Service Worker und ohne Netz. Der Browser merkt sich den Fehlschlag je Seite;
 * ein zweiter Import derselben Datei fragt nicht neu an. Deshalb hilft nur Neuladen.
 *
 * Regel: einmal mit der aktuellen Version neu laden. Nicht während eines laufenden Trainings, nicht
 * zweimal innerhalb von fünf Minuten (Schleifenschutz über `sessionStorage`) und nicht, wenn die
 * Seite ohne Service Worker offline ist (sonst erschiene die Fehlerseite des Browsers). In diesen
 * Fällen zeigt die Ansicht einen ruhigen Hinweis mit „Neu laden“. Gespeicherte Daten liegen in
 * IndexedDB und bleiben beim Neuladen erhalten.
 */
import { useEffect, useState } from 'react';

const CHUNK_ERROR =
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i;

/** Chromium, WebKit, Firefox und der Lade-Helfer von Vite melden den Fehlschlag verschieden. */
export function isChunkLoadError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const message = (error as { message?: unknown }).message;
  return typeof message === 'string' && CHUNK_ERROR.test(message);
}

export type ManualReason = 'training' | 'repeated' | 'offline';
export type RecoveryDecision = { action: 'reload' } | { action: 'manual'; reason: ManualReason };

/** Höchstens ein automatisches Neuladen in diesem Zeitraum (Schleifenschutz). */
export const RELOAD_GUARD_MS = 5 * 60_000;
export const RELOAD_MARKER_KEY = 'form.chunkReloadAt';

export interface RecoveryInput {
  now: number;
  /** Zeitpunkt des letzten automatischen Neuladens in diesem Tab, sonst `null`. */
  lastReloadAt: number | null;
  /** Ohne beschreibbaren Speicher gibt es keinen Schleifenschutz, also kein automatisches Neuladen. */
  markerWritable: boolean;
  trainingRunning: boolean;
  /** Die Seite lässt sich neu laden: vom Service Worker oder über das Netz. */
  canLoad: boolean;
}

export function decideRecovery(input: RecoveryInput): RecoveryDecision {
  if (input.trainingRunning) return { action: 'manual', reason: 'training' };
  const recent =
    input.lastReloadAt !== null &&
    input.now >= input.lastReloadAt &&
    input.now - input.lastReloadAt < RELOAD_GUARD_MS;
  if (!input.markerWritable || recent) return { action: 'manual', reason: 'repeated' };
  if (!input.canLoad) return { action: 'manual', reason: 'offline' };
  return { action: 'reload' };
}

export interface RecoveryEnv {
  trainingRunning: () => Promise<boolean>;
  storage: Pick<Storage, 'getItem' | 'setItem'> | null;
  /** Läuft die Seite unter einem Service Worker? Dann lädt sie auch offline neu. */
  controlled: () => boolean;
  /** Erreicht die Seite ihren Server? */
  reachable: () => Promise<boolean>;
  reload: () => void;
  now: () => number;
}

function sessionStore(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function browserEnv(trainingRunning: () => Promise<boolean>): RecoveryEnv {
  return {
    trainingRunning,
    storage: sessionStore(),
    // `serviceWorker` fehlt in manchen Umgebungen (z. B. ohne sicheren Kontext).
    controlled: () =>
      Boolean((navigator.serviceWorker as ServiceWorkerContainer | undefined)?.controller),
    reachable: async () => {
      try {
        const response = await fetch(window.location.href, { method: 'HEAD', cache: 'no-store' });
        return response.ok;
      } catch {
        return false;
      }
    },
    reload: () => {
      window.location.reload();
    },
    now: Date.now,
  };
}

let env: RecoveryEnv | null = null;
let unloading = false;
let pending: Promise<RecoveryDecision> | null = null;
let listening = false;

function readMarker(storage: RecoveryEnv['storage']): number | null {
  try {
    const value = Number(storage?.getItem(RELOAD_MARKER_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function writeMarker(storage: RecoveryEnv['storage'], value: number): boolean {
  if (!storage) return false;
  try {
    storage.setItem(RELOAD_MARKER_KEY, String(value));
    return storage.getItem(RELOAD_MARKER_KEY) === String(value);
  } catch {
    return false;
  }
}

async function decide(current: RecoveryEnv): Promise<RecoveryDecision> {
  let trainingRunning = true;
  try {
    trainingRunning = await current.trainingRunning();
  } catch {
    // Ohne Antwort der Datenbank lieber nicht automatisch neu laden.
  }
  const now = current.now();
  const decision = decideRecovery({
    now,
    lastReloadAt: readMarker(current.storage),
    markerWritable: current.storage !== null,
    trainingRunning,
    canLoad: current.controlled() || (await current.reachable()),
  });
  if (decision.action !== 'reload') return decision;
  if (unloading || !writeMarker(current.storage, now))
    return { action: 'manual', reason: 'repeated' };
  // Erst nach dem aktuellen Ereignis neu laden; verlässt die Seite sich gerade selbst, entfällt es.
  window.setTimeout(() => {
    if (!unloading) current.reload();
  }, 0);
  return decision;
}

/**
 * Entscheidet einmal je Fehlschlag, ob neu geladen wird. Ruft der Lade-Helfer und die Fehleransicht
 * beide auf, gilt dieselbe Entscheidung. Ohne `installChunkRecovery` (z. B. in Tests) wird nie
 * automatisch neu geladen.
 */
export function recoverFromChunkError(): Promise<RecoveryDecision> {
  if (!env) return Promise.resolve({ action: 'manual', reason: 'repeated' });
  const current = env;
  pending ??= decide(current).then((decision) => {
    // Ein Hinweis statt Neuladen gilt nur für diesen Fehlschlag; der nächste entscheidet neu.
    if (decision.action === 'manual') pending = null;
    return decision;
  });
  return pending;
}

/**
 * Hört auf `vite:preloadError`: Der Lade-Helfer von Vite meldet so jeden fehlgeschlagenen
 * dynamischen Import, auch außerhalb einer Ansicht (z. B. beim Start eines Trainings).
 */
export function installChunkRecovery(
  trainingRunning: () => Promise<boolean>,
  override: Partial<RecoveryEnv> = {},
): void {
  env = { ...browserEnv(trainingRunning), ...override };
  unloading = false;
  pending = null;
  if (listening) return;
  listening = true;
  window.addEventListener('pagehide', () => {
    unloading = true;
  });
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) unloading = false;
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') unloading = false;
  });
  window.addEventListener('vite:preloadError', () => {
    void recoverFromChunkError();
  });
}

/** Nur für Tests. */
export function resetChunkRecovery(): void {
  env = null;
  unloading = false;
  pending = null;
}

/** Für die Fehleransichten: `null` bei anderen Fehlern, `'pending'`, solange entschieden wird. */
export function useChunkRecovery(error: unknown): RecoveryDecision | 'pending' | null {
  const chunk = isChunkLoadError(error);
  const [decision, setDecision] = useState<RecoveryDecision | 'pending'>('pending');
  useEffect(() => {
    if (!chunk) return;
    let alive = true;
    void recoverFromChunkError().then((next) => {
      if (alive) setDecision(next);
    });
    return () => {
      alive = false;
    };
  }, [chunk, error]);
  return chunk ? decision : null;
}
