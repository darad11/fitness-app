import { useEffect, useState } from 'react';

/** Unter dieser Fensterhöhe (45 rem) ist „Jetzt“ einspaltig kompakter (D-498, Nachtrag). */
const SHORT_PX = 720;

/**
 * Niedriges Fenster (Duo zugeklappt 382 × 678): gemessen beim Öffnen des Players und wieder, wenn
 * sich die Breite ändert (Drehen, Auf- und Zuklappen). Die Bildschirmtastatur ändert nur die Höhe
 * und bleibt ohne Wirkung; sonst spränge „Jetzt“ beim Tippen in ein Feld in die kompakte Form und
 * der Inhalt verschöbe sich (D-391).
 */
export function useShortWindow(): boolean {
  const [short, setShort] = useState(() => window.innerHeight < SHORT_PX);
  useEffect(() => {
    let width = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth === width) return;
      width = window.innerWidth;
      setShort(window.innerHeight < SHORT_PX);
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);
  return short;
}
