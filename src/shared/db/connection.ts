/**
 * Zustand der Datenbankverbindung für die Oberfläche.
 * `replaced`: Ein anderes Fenster hat die Datenbank auf eine neuere Version gebracht;
 * dieses Fenster muss neu laden (architecture.md Abschnitt 7).
 */
import { useSyncExternalStore } from 'react';

export type ConnectionState = 'ok' | 'replaced';

let state: ConnectionState = 'ok';
const listeners = new Set<() => void>();

export function setConnectionState(next: ConnectionState): void {
  if (state === next) return;
  state = next;
  listeners.forEach((listener) => {
    listener();
  });
}

export function getConnectionState(): ConnectionState {
  return state;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useConnectionState(): ConnectionState {
  return useSyncExternalStore(subscribe, getConnectionState, getConnectionState);
}
