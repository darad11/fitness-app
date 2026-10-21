import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { useGoals } from '@/modules/goals';
import { useSettings } from '@/modules/settings';
import { useDb } from '@/shared/db';
import { dayKey, localTimeZone, type DayKey } from '@/shared/lib/time';
import { WATER_DEFAULT_GOAL_ML, WATER_QUICK_DEFAULT, waterGoalOn } from '../calc/water';
import type { WaterEntry } from '../model/waterEntry';
import { listWaterEntries } from './waterRepository';

/** Einträge ab einem Tag, reaktiv; `undefined` beim Laden. */
export function useWaterEntries(fromDay: DayKey): WaterEntry[] | undefined {
  const { db } = useDb();
  return useLiveQuery(() => listWaterEntries(db, fromDay), [db, fromDay]);
}

export interface WaterGoals {
  /** Ziel, das an einem Tag galt; ohne eigenes Ziel der Standardwert. */
  goalOn: (day: DayKey) => number;
  /** Ein eigenes Ziel ist gesetzt (sonst gilt der Standardwert). */
  custom: (day: DayKey) => boolean;
}

/** Wasserziele aus den datierten Zielen (D-289); `undefined` beim Laden. */
export function useWaterGoals(): WaterGoals | undefined {
  const goals = useGoals();
  return useMemo(() => {
    if (!goals) return undefined;
    const tz = localTimeZone();
    const find = (day: DayKey) => waterGoalOn(goals, day, (iso) => dayKey(new Date(iso), tz));
    return {
      goalOn: (day) => find(day)?.value ?? WATER_DEFAULT_GOAL_ML,
      custom: (day) => find(day) !== undefined,
    };
  }, [goals]);
}

/** Schnellmengen aus den Einstellungen oder die Standardwerte. */
export function useQuickAmounts(): readonly number[] {
  const settings = useSettings();
  return settings?.waterQuickMl ?? WATER_QUICK_DEFAULT;
}
