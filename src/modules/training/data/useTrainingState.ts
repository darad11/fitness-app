import { useLiveQuery } from 'dexie-react-hooks';
import { useDb } from '@/shared/db';
import type { TrainingStateData } from '../model/trainingState';
import { loadTrainingState } from './trainingStateRepository';

/** Trainingszustand (aktives Programm), reaktiv; `undefined`, solange er geladen wird. */
export function useTrainingState(): TrainingStateData | undefined {
  const { db } = useDb();
  return useLiveQuery(() => loadTrainingState(db), [db]);
}
