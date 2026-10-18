import { useEffect } from 'react';
import { applyTheme } from '@/shared/ui/theme';
import { useSettings } from '../data/useSettings';

/** Wendet die gespeicherte Darstellung an und folgt bei „System" der Geräteeinstellung. */
export function ThemeSync() {
  const theme = useSettings()?.theme;

  useEffect(() => {
    if (!theme) return undefined;
    applyTheme(theme);
    if (theme !== 'system' || typeof window.matchMedia !== 'function') return undefined;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      applyTheme('system', query.matches);
    };
    query.addEventListener('change', onChange);
    return () => {
      query.removeEventListener('change', onChange);
    };
  }, [theme]);

  return null;
}
