import type { DbRuntime } from '@/shared/db';
import type { TrainingStateData } from '../model/trainingState';
import { changeTrainingState } from '../data/trainingStateRepository';
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
