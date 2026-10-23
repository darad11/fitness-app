import { insertDoc, restoreDoc, softDeleteDoc, updateDoc, type DbRuntime } from '@/shared/db';
import { uuidv4 } from '@/shared/lib/uuid';
import { copyWeeks, mergeWeeks, toOwnProgram } from '../calc/programTree';
import { programDef } from '../data/programRepository';
import { changeTrainingState, loadTrainingState } from '../data/trainingStateRepository';
import {
  PLAN_LIMITS,
  type OwnProgram,
  type PlanTree,
  type ProgramKind,
  type ProgramPlan,
  type Week,
} from '../model/program';
import type { TrainingStateData } from '../model/trainingState';
import type { Clock } from './sessionService';

const iso = (date: Date) => date.toISOString();

function closeOpenEntries(state: TrainingStateData, at: string): void {
  for (const entry of state.history) entry.to ??= at;
}

/**
 * Aktiviert ein Programm (AK-PRG-07, TP-19). Ein anderes aktives Programm wird dabei beendet;
 * die Folge bleibt in `history`. Dasselbe Programm erneut zu aktivieren ändert nichts.
 */
export function activateProgram(
  rt: DbRuntime,
  programId: string,
  clock: Clock = {},
): Promise<TrainingStateData> {
  const now = iso((clock.now ?? (() => new Date()))());
  return changeTrainingState(rt, (state) => {
    if (state.activeProgramId === programId) return state;
    closeOpenEntries(state, now);
    state.history.push({ programId, from: now });
    return { ...state, activeProgramId: programId, activeSince: now };
  });
}

/** Beendet das aktive Programm; abgeschlossene Einheiten bleiben im Verlauf. */
export function deactivateProgram(rt: DbRuntime, clock: Clock = {}): Promise<TrainingStateData> {
  const now = iso((clock.now ?? (() => new Date()))());
  return changeTrainingState(rt, (state) => {
    if (state.activeProgramId === undefined) return state;
    closeOpenEntries(state, now);
    return { history: state.history };
  });
}

// ---------------------------------------------------------------------------------------------
// Eigene Programme und Vorlagen (AK-PRG-01 bis AK-PRG-06, AK-PRG-11, D-257)

export class InvalidProgramError extends Error {
  override name = 'InvalidProgramError';
  constructor(readonly reason: 'name' | 'structure') {
    super(`Ungültiges Programm: ${reason}`);
  }
}

function cleanName(name: string): string {
  const cleaned = name.trim();
  if (cleaned.length === 0 || cleaned.length > PLAN_LIMITS.nameLength) {
    throw new InvalidProgramError('name');
  }
  return cleaned;
}

function cleanDescription(description: string | undefined): { description?: string } {
  const cleaned = description?.trim();
  if (!cleaned) return {};
  if (cleaned.length > PLAN_LIMITS.descriptionLength) throw new InvalidProgramError('name');
  return { description: cleaned };
}

/** Mindestens eine Woche, jede mit mindestens einem Tag (AK-PRG-01). */
function checkStructure(weeks: readonly Week[]): void {
  if (weeks.length === 0 || weeks.some((week) => week.days.length === 0)) {
    throw new InvalidProgramError('structure');
  }
}

export interface NewProgramInput {
  name: string;
  description?: string;
  kind?: ProgramKind;
  /** Name der ersten Woche und des ersten Tags, z. B. „Woche 1" und „Tag 1". */
  firstWeek: string;
  firstDay: string;
}

/** Neues, leeres Programm mit einer Woche und einem Tag. */
export async function createProgram(rt: DbRuntime, input: NewProgramInput): Promise<OwnProgram> {
  const name = cleanName(input.name);
  const weeks: Week[] = [
    {
      id: uuidv4(),
      position: 0,
      name: input.firstWeek,
      days: [{ id: uuidv4(), position: 0, name: input.firstDay, exercises: [] }],
    },
  ];
  const doc = await insertDoc(rt, programDef, (hlc) => ({
    kind: input.kind ?? 'program',
    name,
    ...cleanDescription(input.description),
    origin: 'user' as const,
    repeat: true,
    weeks: mergeWeeks([], weeks, hlc),
  }));
  return toOwnProgram(doc);
}

/** Quelle einer Kopie: gebündelte Vorlage oder eigenes Programm. */
export type CopySource = PlanTree &
  Partial<Pick<OwnProgram, 'level' | 'location' | 'sampleKey' | 'origin'>> & { key?: string };

/**
 * Kopie mit neuen IDs (AK-PRG-05, AK-PRG-06): „Vorlage verwenden", „Duplizieren", „Als Vorlage
 * speichern" und „Übernehmen und anpassen" bei gebündelten Programmen. Die Kopie ist
 * unabhängig vom Original.
 */
export async function copyProgram(
  rt: DbRuntime,
  source: CopySource,
  options: { name: string; kind: ProgramKind },
): Promise<OwnProgram> {
  const name = cleanName(options.name);
  const bundled = source.key !== undefined;
  const sampleKey = source.key ?? source.sampleKey;
  const weeks = copyWeeks(source.weeks, uuidv4);
  checkStructure(weeks);
  const doc = await insertDoc(rt, programDef, (hlc) => ({
    kind: options.kind,
    name,
    ...cleanDescription(source.description),
    origin: bundled ? ('sample-copy' as const) : (source.origin ?? 'user'),
    ...(sampleKey ? { sampleKey } : {}),
    ...(source.level ? { level: source.level } : {}),
    ...(source.location ? { location: source.location } : {}),
    repeat: source.repeat,
    weeks: mergeWeeks([], weeks, hlc),
  }));
  return toOwnProgram(doc);
}

/**
 * Ändert ein eigenes Programm (Editor). `change` erhält die Anzeigeform; geänderte Elemente
 * bekommen den neuen Stempel, entfernte eine Löschmarkierung. Laufende und abgeschlossene
 * Einheiten bleiben unberührt, weil sie eine eigene Kopie tragen (AK-PRG-10).
 */
export async function editProgram(
  rt: DbRuntime,
  id: string,
  change: (plan: ProgramPlan) => ProgramPlan,
): Promise<OwnProgram> {
  const doc = await updateDoc(rt, programDef, id, (current, hlc) => {
    const view = toOwnProgram(current);
    const next = change({
      name: view.name,
      ...(view.description ? { description: view.description } : {}),
      repeat: view.repeat,
      weeks: view.weeks,
    });
    checkStructure(next.weeks);
    const { description: _old, ...rest } = current;
    return {
      ...rest,
      name: cleanName(next.name),
      ...cleanDescription(next.description),
      repeat: next.repeat,
      weeks: mergeWeeks(current.weeks, next.weeks, hlc),
    };
  });
  return toOwnProgram(doc);
}

/** Archiviert oder holt zurück; ein aktives Programm wird dabei beendet. */
export async function setArchived(
  rt: DbRuntime,
  id: string,
  archived: boolean,
  clock: Clock = {},
): Promise<void> {
  const now = iso((clock.now ?? (() => new Date()))());
  await rt.db.transaction('rw', rt.db.programs, rt.db.singletons, rt.db.meta, async () => {
    await updateDoc(rt, programDef, id, (current) => {
      const { archivedAt: _old, ...rest } = current;
      return archived ? { ...rest, archivedAt: now } : rest;
    });
    if (archived) await deactivateIfActive(rt, id, clock);
  });
}

async function deactivateIfActive(rt: DbRuntime, id: string, clock: Clock): Promise<boolean> {
  const state = await loadTrainingState(rt.db);
  if (state.activeProgramId !== id) return false;
  await deactivateProgram(rt, clock);
  return true;
}

/**
 * Löscht weich (AK-PRG-11); Einheiten daraus behalten ihren Programmnamen im Verlauf. War das
 * Programm aktiv, wird es beendet; „Rückgängig" holt das Programm zurück, aktiviert es aber
 * nicht erneut.
 */
export async function deleteProgram(
  rt: DbRuntime,
  id: string,
  clock: Clock = {},
): Promise<{ wasActive: boolean }> {
  return rt.db.transaction('rw', rt.db.programs, rt.db.singletons, rt.db.meta, async () => {
    await softDeleteDoc(rt, programDef, id);
    return { wasActive: await deactivateIfActive(rt, id, clock) };
  });
}

export async function restoreProgram(rt: DbRuntime, id: string): Promise<void> {
  await restoreDoc(rt, programDef, id);
}
