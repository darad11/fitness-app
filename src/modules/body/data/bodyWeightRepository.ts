import { getDoc, type AppDb, type DocDef } from '@/shared/db';
import { BODY_WEIGHT_SCHEMA_VERSION, bodyWeightSchema, type BodyWeight } from '../model/bodyWeight';

export const bodyWeightDef: DocDef<BodyWeight> = {
  type: 'body_weight',
  schemaVersion: BODY_WEIGHT_SCHEMA_VERSION,
  schema: bodyWeightSchema,
  table: (db) => db.bodyWeights,
};

export function getBodyWeight(db: AppDb, id: string): Promise<BodyWeight | undefined> {
  return getDoc(db, bodyWeightDef, id);
}

/** Alle Einträge, neueste zuerst; ungültige Dokumente werden übergangen. */
export async function listBodyWeights(db: AppDb): Promise<BodyWeight[]> {
  const rows = await db.bodyWeights.orderBy('measuredAt').reverse().toArray();
  return rows.flatMap((row) => {
    if (row.type !== 'body_weight' || row.deletedAt !== null) return [];
    const parsed = bodyWeightSchema.safeParse(row);
    return parsed.success ? [parsed.data] : [];
  });
}
