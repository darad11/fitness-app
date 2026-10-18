import { z } from 'zod';
import {
  defineDocSchema,
  isoDateTimeSchema,
  ROOT_FIELD_MASK,
  type DocData,
} from '@/shared/db/documents';

/**
 * Trainingszustand als Singleton (data-model.md Abschnitt 3.3, D-249): höchstens ein aktives
 * Programm, dazu die Folge der bisher aktiven Programme. Liegt in der Tabelle `singletons`
 * neben Einstellungen und Profil; keine neue Dexie-Version nötig.
 */
export const TRAINING_STATE_SCHEMA_VERSION = 1;

export const trainingStateSchema = defineDocSchema('training_state', {
  /** ID des aktiven Programms (gebündelt: UUID v5 aus dem Schlüssel; später auch eigene). */
  activeProgramId: z.uuid().optional(),
  activeSince: isoDateTimeSchema.optional(),
  history: z
    .array(
      z.strictObject({
        programId: z.uuid(),
        from: isoDateTimeSchema,
        to: isoDateTimeSchema.optional(),
      }),
    )
    .max(1000),
});

export type TrainingState = z.infer<typeof trainingStateSchema>;
export type TrainingStateData = DocData<TrainingState>;

export const trainingStateDataSchema = trainingStateSchema.omit(ROOT_FIELD_MASK);

export const TRAINING_STATE_DEFAULTS: TrainingStateData = { history: [] };
