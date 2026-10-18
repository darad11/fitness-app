import { useMemo } from 'react';
import { createFormatters, resolveLocale, type Formatters } from '@/shared/lib/format';
import { useSettings } from '../data/useSettings';
import type { LocaleSetting } from '../model/settings';

/** Formatierer für eine Einstellung „Datum und Zahlen"; „auto" folgt der Gerätesprache. */
export function formattersFor(preference: LocaleSetting): Formatters {
  return createFormatters(resolveLocale(preference, navigator.languages));
}

/** Formatierer nach Einstellung „Datum und Zahlen" bzw. Gerätesprache (AK-SET-04). */
export function useFormatters(): Formatters {
  const preference = useSettings()?.locale ?? 'auto';
  return useMemo(() => formattersFor(preference), [preference]);
}
