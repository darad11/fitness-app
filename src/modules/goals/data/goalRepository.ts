import type { AppDb, DocDef } from '@/shared/db';
import { GOAL_SCHEMA_VERSION, goalSchema, type Goal } from '../model/goal';

export const goalDef: DocDef<Goal> = {
  type: 'goal',
  schemaVersion: GOAL_SCHEMA_VERSION,
  schema: goalSchema,
  table: (db) => db.goals,
};

/** Alle nicht gelöschten Ziele, neueste zuerst; die Historie bleibt erhalten (AK-SET-01). */
export async function listGoals(db: AppDb): Promise<Goal[]> {
  const rows = await db.goals.toArray();
  const goals = rows.flatMap((row) => {
    if (row.type !== 'goal' || row.deletedAt !== null) return [];
    const parsed = goalSchema.safeParse(row);
    return parsed.success ? [parsed.data] : [];
  });
  goals.sort(
    (a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom) || b.hlc.localeCompare(a.hlc),
  );
  return goals;
}
