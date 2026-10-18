import { useMemo } from 'react';
import { createFormatters, resolveLocale, type Formatters } from '@/shared/lib/format';
import { useSettings } from '../data/useSettings';

/** Formatierer nach Einstellung „Datum und Zahlen" bzw. Gerätesprache (AK-SET-04). */
export function useFormatters(): Formatters {
  const preference = useSettings()?.locale ?? 'auto';
  return useMemo(
    () => createFormatters(resolveLocale(preference, navigator.languages)),
    [preference],
  );
}
