import { bodyDocDefs } from '@/modules/body';
import { exerciseDocDefs } from '@/modules/exercises';
import { goalDocDefs } from '@/modules/goals';
import { habitDocDefs } from '@/modules/habits';
import { nutritionDocDefs } from '@/modules/nutrition';
import { settingsDocDefs } from '@/modules/settings';
import { shoppingDocDefs } from '@/modules/shopping';
import { trainingDocDefs } from '@/modules/training';
import { waterDocDefs } from '@/modules/water';
import type { AppDb } from '@/shared/db';
import type { DocKind } from '../model/backup';

/**
 * Alle Dokumentarten der App mit Tabelle, Schemaversion und Schema (D-345). Jedes Modul liefert
 * seine Arten selbst; `kinds.test.ts` prüft, dass sie genau den Arten des Exports entsprechen.
 */
export async function loadDocKinds(db: AppDb): Promise<Map<string, DocKind>> {
  const groups = await Promise.all([
    trainingDocDefs(),
    exerciseDocDefs(),
    bodyDocDefs(),
    goalDocDefs(),
    settingsDocDefs(),
    habitDocDefs(),
    nutritionDocDefs(),
    shoppingDocDefs(),
    waterDocDefs(),
  ]);
  const kinds = new Map<string, DocKind>();
  for (const def of groups.flat()) {
    kinds.set(def.type, {
      type: def.type,
      table: def.table(db).name,
      schemaVersion: def.schemaVersion,
      schema: def.schema,
    });
  }
  return kinds;
}
