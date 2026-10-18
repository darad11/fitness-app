import { getDoc, upsertDoc, type AppDb, type DbRuntime, type DocDef } from '@/shared/db';
import { stableId } from '@/shared/lib/uuid';
import {
  TRAINING_STATE_DEFAULTS,
  TRAINING_STATE_SCHEMA_VERSION,
  trainingStateDataSchema,
  trainingStateSchema,
  type TrainingState,
  type TrainingStateData,
} from '../model/trainingState';

/** Feste ID (UUID v5), damit alle Geräte dasselbe Dokument meinen (data-model.md 3.3). */
export const TRAINING_STATE_ID = stableId('singleton:training_state');

export const trainingStateDef: DocDef<TrainingState> = {
  type: 'training_state',
  schemaVersion: TRAINING_STATE_SCHEMA_VERSION,
  schema: trainingStateSchema,
  table: (db) => db.singletons,
};

/** Gespeicherter Zustand oder der leere Anfangszustand (kein aktives Programm). */
export async function loadTrainingState(db: AppDb): Promise<TrainingStateData> {
  const doc = await getDoc(db, trainingStateDef, TRAINING_STATE_ID);
  return doc ? trainingStateDataSchema.parse(doc) : TRAINING_STATE_DEFAULTS;
}

/** Ändert den Zustand; `change` arbeitet auf einer Kopie, ungültige Ergebnisse werden nicht gespeichert. */
export async function changeTrainingState(
  rt: DbRuntime,
  change: (current: TrainingStateData) => TrainingStateData,
): Promise<TrainingStateData> {
  const doc = await upsertDoc(rt, trainingStateDef, TRAINING_STATE_ID, (current) =>
    change(
      structuredClone(current ? trainingStateDataSchema.parse(current) : TRAINING_STATE_DEFAULTS),
    ),
  );
  return trainingStateDataSchema.parse(doc);
}
