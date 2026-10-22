import { useCallback, useEffect, useRef, useState } from 'react';
import { useDb } from './DbProvider';
import { getMetaValue, setMetaValue } from './meta';

/**
 * Gerätelokale Ja/Nein-Wahl in `meta` (nicht abgeglichen), z. B. „Als Tabelle“ (F5, D-322): sofort
 * sichtbar, nach Neuladen und Seitenwechsel unverändert. Bis der gespeicherte Wert gelesen ist,
 * gilt `false`; eine Bedienung in dieser Zeit gewinnt gegen den gelesenen Wert.
 */
export function useMetaFlag(key: string): [value: boolean, setValue: (next: boolean) => void] {
  const { db } = useDb();
  const [value, setValue] = useState(false);
  const touched = useRef(false);
  useEffect(() => {
    let alive = true;
    getMetaValue(db, key)
      .then((stored) => {
        if (alive && !touched.current) setValue(stored === true);
      })
      .catch(() => {
        // Ohne gespeicherten Wert bleibt die Grundeinstellung.
      });
    return () => {
      alive = false;
    };
  }, [db, key]);
  const update = useCallback(
    (next: boolean) => {
      touched.current = true;
      setValue(next);
      setMetaValue(db, key, next).catch(() => {
        // Nicht gespeichert: Die Wahl gilt bis zum Verlassen der Seite.
      });
    },
    [db, key],
  );
  return [value, update];
}
