import { z } from 'zod';
import { trackingModeSchema } from '@/modules/exercises';
import { isoDateTimeSchema } from '@/shared/db/documents';
import { setTypeSchema } from './program';
import { setValuesSchema } from './session';

/**
 * Projektion `exerciseHistory` (data-model.md Abschnitt 5): je abgeschlossener Einheit und Übung
 * eine Zeile. Lokal, nicht synchronisiert, jederzeit aus den Einheiten neu aufbaubar.
 */
export const HISTORY_VERSION = 1;

export const historyRowSchema = z.strictObject({
  id: z.string().min(1),
  version: z.literal(HISTORY_VERSION),
  exerciseId: z.uuid(),
  sessionId: z.uuid(),
  completedAt: isoDateTimeSchema,
  dayKey: z.string(),
  title: z.string(),
  trackingMode: trackingModeSchema,
  /** Erledigte Sätze mit ihrem Platz für den Vergleich (`setSlot`). */
  sets: z.array(z.strictObject({ slot: z.string(), type: setTypeSchema, values: setValuesSchema })),
  best: setValuesSchema.nullable(),
  bestOneRepMax: z.number().nullable(),
  volumeKg: z.number(),
  reps: z.number().int(),
  setCount: z.number().int(),
});
export type HistoryRow = z.infer<typeof historyRowSchema>;
