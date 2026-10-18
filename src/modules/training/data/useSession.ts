import { useLiveQuery } from 'dexie-react-hooks';
import { useDb } from '@/shared/db';
import type { HistoryRow } from '../model/history';
import type { Session } from '../model/session';
import {
  findActiveSession,
  getSession,
  latestHistory,
  listCompletedSessions,
} from './sessionRepository';

/** Einheit, reaktiv: `undefined` beim Laden, `null`, wenn es sie nicht (mehr) gibt. */
export function useSession(id: string): Session | null | undefined {
  const { db } = useDb();
  return useLiveQuery(async () => (await getSession(db, id)) ?? null, [db, id]);
}

/** Laufende Einheit dieses Geräts: `undefined` beim Laden, `null`, wenn keine läuft. */
export function useActiveSession(): Session | null | undefined {
  const { db } = useDb();
  return useLiveQuery(async () => (await findActiveSession(db)) ?? null, [db]);
}

/** Abgeschlossene Einheiten, neueste zuerst; `undefined` beim Laden. */
export function useCompletedSessions(): Session[] | undefined {
  const { db } = useDb();
  return useLiveQuery(() => listCompletedSessions(db), [db]);
}

/** Letzte abgeschlossene Einheit je Übung, ohne die laufende (AK-TRN-05). */
export function usePreviousHistory(
  session: Session | null | undefined,
): ReadonlyMap<string, HistoryRow> | undefined {
  const { db } = useDb();
  const key = session ? `${session.id}|${session.exerciseIds.join(',')}` : '';
  return useLiveQuery(async () => {
    const map = new Map<string, HistoryRow>();
    if (!session) return map;
    for (const exerciseId of session.exerciseIds) {
      const row = await latestHistory(db, exerciseId, session.id);
      if (row) map.set(exerciseId, row);
    }
    return map;
  }, [db, key]); // `key` fasst die relevanten Felder der Einheit zusammen
}
