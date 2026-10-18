import { useLiveQuery } from 'dexie-react-hooks';
import { useDb } from '@/shared/db';
import type { BodyWeight } from '../model/bodyWeight';
import { listBodyWeights } from './bodyWeightRepository';

/** Körpergewicht, neueste zuerst, reaktiv; `undefined` beim Laden. */
export function useBodyWeights(): BodyWeight[] | undefined {
  const { db } = useDb();
  return useLiveQuery(() => listBodyWeights(db), [db]);
}
