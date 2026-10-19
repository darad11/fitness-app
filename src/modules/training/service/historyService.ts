import { restoreDoc, softDeleteDoc, updateDoc, type DbRuntime } from '@/shared/db';
import { dayKey } from '@/shared/lib/time';
import {
  checkValue,
  liveExercises,
  liveSets,
  REQUIRED_FIELDS,
  type ValueField,
} from '../calc/session';
import { sessionDef, writeHistory } from '../data/sessionRepository';
import { LIMITS, type Session, type SetValues } from '../model/session';
import { InvalidValueError, ItemNotFoundError } from './sessionService';

/** Nur abgeschlossene Einheiten lassen sich im Verlauf bearbeiten (AK-HIS-03). */
export class NotCompletedError extends Error {
  override name = 'NotCompletedError';
}

/** Bearbeitung außerhalb der Grenzen: Zukunft, Dauer, fehlende Pflichtwerte. */
export class InvalidEditError extends Error {
  override name = 'InvalidEditError';
  constructor(readonly reason: 'future' | 'duration' | 'missing' | 'title') {
    super('Ungültige Änderung');
  }
}

export interface CompletedEdit {
  title?: string;
  startedAt?: Date;
  durationSec?: number;
  /** Leerer Text entfernt die Notiz. */
  notes?: string;
  /** Neue Werte erledigter Sätze, vollständig je Satz. */
  sets?: Readonly<Record<string, SetValues>>;
  /** Sätze, die entfernt werden (weich, mit Drop-Sätzen). */
  removeSetIds?: readonly string[];
}

const MAX_FUTURE_MS = 24 * 60 * 60 * 1000;

/**
 * Ändert eine abgeschlossene Einheit (AK-HIS-03): Titel, Beginn, Dauer, Notiz, Werte und Sätze.
 * Die Projektion `exerciseHistory` wird in derselben Transaktion neu geschrieben, damit Vorwerte,
 * Bestleistungen und Verläufe sofort stimmen.
 */
export async function editCompletedSession(
  rt: DbRuntime,
  sessionId: string,
  edit: CompletedEdit,
  clock: { now?: () => Date } = {},
): Promise<Session> {
  const now = (clock.now ?? (() => new Date()))();
  for (const values of Object.values(edit.sets ?? {})) {
    for (const [field, value] of Object.entries(values) as [ValueField, number][]) {
      const error = checkValue(field, value);
      if (error) throw new InvalidValueError(field, error);
    }
  }
  return rt.db.transaction('rw', rt.db.sessions, rt.db.meta, rt.db.exerciseHistory, async () => {
    const updated = await updateDoc(rt, sessionDef, sessionId, (current, hlc) => {
      if (current.status !== 'completed') throw new NotCompletedError('Training läuft noch');
      const draft = structuredClone(current);
      if (edit.title !== undefined) {
        const title = edit.title.trim();
        if (!title || title.length > 200) throw new InvalidEditError('title');
        draft.title = title;
      }
      if (edit.notes !== undefined) {
        const notes = edit.notes.trim();
        if (notes) draft.notes = notes;
        else delete draft.notes;
      }
      const startedAt = edit.startedAt ?? new Date(draft.startedAt);
      const durationSec = edit.durationSec ?? draft.durationSec ?? 0;
      if (
        Number.isNaN(startedAt.getTime()) ||
        startedAt.getTime() > now.getTime() + MAX_FUTURE_MS
      ) {
        throw new InvalidEditError('future');
      }
      if (
        !Number.isInteger(durationSec) ||
        durationSec < 60 ||
        durationSec > LIMITS.durationSec.max
      ) {
        throw new InvalidEditError('duration');
      }
      if (edit.startedAt !== undefined || edit.durationSec !== undefined) {
        draft.startedAt = startedAt.toISOString();
        draft.endedAt = new Date(startedAt.getTime() + durationSec * 1000).toISOString();
        draft.durationSec = durationSec;
        draft.dayKey = dayKey(startedAt, draft.tz);
        draft.pauses = [];
        if (draft.activity) draft.activity = { ...draft.activity, durationSec };
      }
      const remove = new Set(edit.removeSetIds ?? []);
      for (const exercise of liveExercises(draft)) {
        for (const set of liveSets(exercise)) {
          if (remove.has(set.id) || (set.parentSetId && remove.has(set.parentSetId))) {
            set.deletedAt = hlc;
            set.hlc = hlc;
            continue;
          }
          const values = edit.sets?.[set.id];
          if (!values) continue;
          if (set.status === 'done') {
            const missing = REQUIRED_FIELDS[exercise.trackingMode].filter(
              (f) => values[f] === undefined,
            );
            if (missing.length > 0) throw new InvalidEditError('missing');
          }
          set.actual = { ...values };
          set.hlc = hlc;
        }
      }
      const known = new Set(liveExercises(current).flatMap((e) => liveSets(e).map((s) => s.id)));
      for (const id of [...Object.keys(edit.sets ?? {}), ...remove]) {
        if (!known.has(id)) throw new ItemNotFoundError('Satz nicht gefunden');
      }
      return draft;
    });
    await writeHistory(rt.db, updated);
    return updated;
  });
}

/** Löscht eine abgeschlossene Einheit weich (AK-HIS-04); die Projektion verliert ihre Zeilen. */
export async function deleteCompletedSession(rt: DbRuntime, sessionId: string): Promise<void> {
  await rt.db.transaction('rw', rt.db.sessions, rt.db.meta, rt.db.exerciseHistory, async () => {
    await softDeleteDoc(rt, sessionDef, sessionId, 'completed');
    await rt.db.exerciseHistory.where('sessionId').equals(sessionId).delete();
  });
}

/** „Rückgängig“ nach dem Löschen: Einheit und Projektion kommen zurück. */
export async function restoreCompletedSession(rt: DbRuntime, sessionId: string): Promise<Session> {
  return rt.db.transaction('rw', rt.db.sessions, rt.db.meta, rt.db.exerciseHistory, async () => {
    const restored = await restoreDoc(rt, sessionDef, sessionId);
    await writeHistory(rt.db, restored);
    return restored;
  });
}
