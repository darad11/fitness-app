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
  /**
   * Frühere Pausen (D-283): an diesen Tagen galt die Aufgabe nicht, `toDayKey` ist der Tag der
   * Wiederaufnahme (ausschließlich). So bleibt die Vergangenheit nach „Wieder aufnehmen“ richtig.
   */
  pauses: z.array(z.object({ fromDayKey: dayKeySchema, toDayKey: dayKeySchema })).optional(),
  /** Gelöscht (D-283): erscheint nirgends mehr zum Abhaken; vergangene Tage bleiben erhalten. */
  removedAt: isoDateTimeSchema.optional(),
  /**
   * Wochentage (D-285): ab `fromDayKey` gilt die Aufgabe nur an diesen Tagen (Montag = 1).
   * Aufsteigend nach Tag; fehlt das Feld oder liegt der Tag vor dem ersten Eintrag, gilt jeder Tag.
   */
  schedule: z
    .array(
      z.object({
        fromDayKey: dayKeySchema,
        weekdays: z.array(z.number().int().min(1).max(7)).min(1).max(7),
      }),
    )
    .optional(),
  /** Automatisch abhaken (D-285): `training` hakt ab, sobald an dem Tag ein Training abgeschlossen ist. */
  autoDone: z.enum(['training']).optional(),
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
