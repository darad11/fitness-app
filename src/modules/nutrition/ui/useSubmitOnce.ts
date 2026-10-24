import { useRef, useState } from 'react';

/**
 * Speichern höchstens einmal gleichzeitig (C-02): Ein zweiter Tipp oder ein zweites Enter, während
 * gespeichert wird, tut nichts. Vorher legte ein Doppeltipp Einträge und Vorlagen doppelt an.
 * `busy` sperrt zusätzlich den Knopf.
 */
export function useSubmitOnce() {
  const running = useRef(false);
  const [busy, setBusy] = useState(false);
  const run = (task: () => Promise<unknown>) => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    void task().finally(() => {
      running.current = false;
      setBusy(false);
    });
  };
  return { busy, run };
}
