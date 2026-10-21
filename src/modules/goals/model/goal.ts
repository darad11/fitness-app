import { z } from 'zod';
import { defineDocSchema, isoDateTimeSchema, type DocData } from '@/shared/db/documents';
import { isValidDayKey } from '@/shared/lib/time';

/**
 * Ziele (data-model.md Abschnitt 3.6, AK-SET-01): Zielgewicht, Trainings pro Woche und Wasser
 * pro Tag in ml (D-289), datiert.
 */
export const GOAL_SCHEMA_VERSION = 1;
export const GOAL_KINDS = ['body_weight', 'weekly_sessions', 'water_daily'] as const;
export type GoalKind = (typeof GOAL_KINDS)[number];

export const GOAL_LIMITS = {
  body_weight: { min: 30, max: 300 },
  weekly_sessions: { min: 1, max: 7 },
  water_daily: { min: 250, max: 8000 },
} as const;

export const goalSchema = defineDocSchema('goal', {
  kind: z.enum(GOAL_KINDS),
  value: z.number(),
  effectiveFrom: z.string().refine(isValidDayKey, 'Ungültiger Tag'),
  endedAt: isoDateTimeSchema.optional(),
}).refine(
  (goal) =>
    goal.kind === 'body_weight'
      ? goal.value >= GOAL_LIMITS.body_weight.min &&
        goal.value <= GOAL_LIMITS.body_weight.max &&
        Math.abs(goal.value * 10 - Math.round(goal.value * 10)) < 1e-6
      : Number.isInteger(goal.value) &&
        goal.value >= GOAL_LIMITS[goal.kind].min &&
        goal.value <= GOAL_LIMITS[goal.kind].max,
  { message: 'Wert außerhalb des Bereichs', path: ['value'] },
);

export type Goal = z.infer<typeof goalSchema>;
export type GoalData = DocData<Goal>;
