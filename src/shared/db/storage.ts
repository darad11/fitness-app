/**
 * Dauerhafter Speicher (AK-PWA-05): Nach dem ersten gespeicherten Datensatz bittet die App den
 * Browser, die Daten nicht bei Speicherdruck zu löschen. Safari entscheidet selbst; in der
 * installierten App gilt der Speicher als dauerhaft. Das Ergebnis wird nur gemerkt, nie erzwungen.
 */

export type PersistResult = 'persisted' | 'denied' | 'unsupported';

let requested: Promise<PersistResult> | null = null;

interface StorageLike {
  persist?: () => Promise<boolean>;
  persisted?: () => Promise<boolean>;
}

function storageApi(): StorageLike | undefined {
  return (navigator as Navigator & { storage?: StorageLike }).storage;
}

/** Fordert dauerhaften Speicher einmal je App-Lauf an; weitere Aufrufe liefern dasselbe Ergebnis. */
export function requestPersistentStorage(): Promise<PersistResult> {
  requested ??= (async () => {
    const storage = storageApi();
    if (!storage?.persist) return 'unsupported';
    try {
      return (await storage.persist()) ? 'persisted' : 'denied';
    } catch {
      return 'denied';
    }
  })();
  return requested;
}

/** Aktueller Zustand ohne neue Anforderung, z. B. für „Mehr › Daten“. */
export async function persistentStorageStatus(): Promise<PersistResult> {
  const storage = storageApi();
  if (!storage?.persisted) return 'unsupported';
  try {
    return (await storage.persisted()) ? 'persisted' : 'denied';
  } catch {
    return 'denied';
  }
}

/** Nur für Tests. */
export function resetPersistentStorageForTests(): void {
  requested = null;
}
