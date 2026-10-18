/**
 * Installationsdialog in Chromium-Browsern (`beforeinstallprompt`). Safari bietet keinen
 * solchen Dialog; dort hilft nur die Anleitung (AK-PWA-04, AK-SET-06).
 */
import { useSyncExternalStore } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
let installedNow = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => {
    listener();
  });
}

export function listenForInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    installedNow = true;
    notify();
  });
}

export type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable';

export async function promptInstall(): Promise<InstallOutcome> {
  const event = deferred;
  if (!event) return 'unavailable';
  deferred = null;
  notify();
  await event.prompt();
  const choice = await event.userChoice;
  return choice.outcome;
}

interface InstallPromptState {
  canPrompt: boolean;
  installedNow: boolean;
}

let snapshot: InstallPromptState = { canPrompt: false, installedNow: false };

function getSnapshot(): InstallPromptState {
  const canPrompt = deferred !== null;
  if (snapshot.canPrompt !== canPrompt || snapshot.installedNow !== installedNow) {
    snapshot = { canPrompt, installedNow };
  }
  return snapshot;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useInstallPrompt(): InstallPromptState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
