import { useEffect } from 'react';
import { applyTheme, SHIPPED_THEME } from '@/shared/ui/theme';
import { useSettings } from '../data/useSettings';

/**
 * Wendet die Darstellung an. Ausgeliefert wird nur Dunkel (D-308): Die gespeicherte Einstellung
 * `theme` bleibt erhalten, wirkt aber erst, wenn der Produktinhaber einen hellen Modus freigibt.
 */
export function ThemeSync() {
  const theme = useSettings()?.theme;

  useEffect(() => {
    if (!theme) return;
    applyTheme(SHIPPED_THEME);
  }, [theme]);

  return null;
}
