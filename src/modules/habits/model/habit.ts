import { z } from 'zod';
import { defineDocSchema, isoDateTimeSchema, type DocData } from '@/shared/db/documents';
import { isValidDayKey } from '@/shared/lib/time';

/**
 * Tagesaufgaben (Schritt F, D-253; data-model.md Abschnitt 4 `habit`, `habit_log`): eigene,
 * frei angelegte Aufgaben, die jeden Tag gelten (Q-17). Ein Eintrag je Aufgabe und Tag mit
 * deterministischer ID, damit es nie zwei Einträge für denselben Tag gibt (K-20).
 */
export const HABIT_SCHEMA_VERSION = 1;
export const HABIT_NAME_MAX = 80;

const dayKeySchema = z.string().refine(isValidDayKey, 'Ungültiger Tag');

export const habitSchema = defineDocSchema('habit', {
  name: z.string().trim().min(1).max(HABIT_NAME_MAX),
  position: z.number().int().min(0),
  /** Erster Tag, an dem die Aufgabe zählt (Tag des Anlegens). */
  fromDayKey: dayKeySchema,
  /** Ab diesem Tag zählt sie nicht mehr (Tag des Beendens); fehlt, solange sie aktiv ist. */
  toDayKey: dayKeySchema.optional(),
  archivedAt: isoDateTimeSchema.optional(),
});

export const habitLogSchema = defineDocSchema('habit_log', {
  habitId: z.uuid(),
  dayKey: dayKeySchema,
  done: z.boolean(),
  doneAt: isoDateTimeSchema.optional(),
});

export type Habit = z.infer<typeof habitSchema>;
export type HabitData = DocData<Habit>;
export type HabitLog = z.infer<typeof habitLogSchema>;
export type HabitLogData = DocData<HabitLog>;
