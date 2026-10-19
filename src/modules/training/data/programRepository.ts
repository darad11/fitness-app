import { useLiveQuery } from 'dexie-react-hooks';
import { getDoc, useDb, type AppDb, type DocDef } from '@/shared/db';
import { toOwnProgram } from '../calc/programTree';
import {
  PROGRAM_SCHEMA_VERSION,
  programSchema,
  type OwnProgram,
  type ProgramDoc,
} from '../model/program';

export const programDef: DocDef<ProgramDoc> = {
  type: 'program',
  schemaVersion: PROGRAM_SCHEMA_VERSION,
  schema: programSchema,
  table: (db) => db.programs,
};

/** Alle nicht gelöschten eigenen Programme und Vorlagen, neueste zuerst; ungültige werden übersprungen. */
export async function listOwnPrograms(db: AppDb): Promise<OwnProgram[]> {
  const rows = await db.programs.toArray();
  return rows
    .flatMap((row) => {
      if (row.type !== 'program' || row.deletedAt !== null) return [];
      const parsed = programSchema.safeParse(row);
      return parsed.success ? [toOwnProgram(parsed.data)] : [];
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getOwnProgram(db: AppDb, id: string): Promise<OwnProgram | undefined> {
  const doc = await getDoc(db, programDef, id);
  return doc ? toOwnProgram(doc) : undefined;
}

/** Reaktiv; `undefined` beim Laden. */
export function useOwnPrograms(): OwnProgram[] | undefined {
  const { db } = useDb();
  return useLiveQuery(() => listOwnPrograms(db), [db]);
}

/** Reaktiv; `undefined` beim Laden, `null`, wenn es das Programm nicht (mehr) gibt. */
export function useOwnProgram(id: string | undefined): OwnProgram | null | undefined {
  const { db } = useDb();
  return useLiveQuery(async () => (id ? ((await getOwnProgram(db, id)) ?? null) : null), [db, id]);
}
