import { insertDoc, type DbRuntime } from '@/shared/db';
import { dayKey, localTimeZone } from '@/shared/lib/time';
import { resolveCompletion, suggestValues } from '../calc/session';
import { sessionDef, writeHistory } from '../data/sessionRepository';
import { LIMITS, type Activity, type Session, type SetValues } from '../model/session';
import { buildExercise, type Clock, type ExerciseInput } from './sessionService';

/** Nachtrag außerhalb der Grenzen: Zukunft, Dauer, Werte (AK-TRN-23). */
export class InvalidLogError extends Error {
  override name = 'InvalidLogError';
  constructor(readonly reason: 'future' | 'duration' | 'values' | 'exercises') {
    super('Ungültiger Nachtrag');
  }
}

const MAX_FUTURE_MS = 24 * 60 * 60 * 1000;
const iso = (date: Date) => date.toISOString();

function checkTime(startedAt: Date, durationSec: number, now: Date): void {
  if (Number.isNaN(startedAt.getTime()) || startedAt.getTime() > now.getTime() + MAX_FUTURE_MS) {
    throw new InvalidLogError('future');
  }
  if (!Number.isInteger(durationSec) || durationSec < 60 || durationSec > LIMITS.durationSec.max) {
    throw new InvalidLogError('duration');
  }
}

function base(startedAt: Date, durationSec: number, notes: string | undefined) {
  const tz = localTimeZone();
  const note = notes?.trim();
  return {
    status: 'completed' as const,
    source: 'manual' as const,
    dayKey: dayKey(startedAt, tz),
    tz,
    startedAt: iso(startedAt),
    endedAt: iso(new Date(startedAt.getTime() + durationSec * 1000)),
    durationSec,
    pauses: [],
    restTimer: null,
    ...(note ? { notes: note } : {}),
  };
}

export interface ActivityInput {
  type: Activity['type'];
  label?: string;
  startedAt: Date;
  durationSec: number;
  distanceM?: number;
  notes?: string;
}

/** Aktivität mit Dauer und optionaler Distanz nachtragen; zählt zum Wochenziel (D-220). */
export async function logActivity(
  rt: DbRuntime,
  input: ActivityInput,
  title: string,
  clock: Clock = {},
): Promise<Session> {
  const now = (clock.now ?? (() => new Date()))();
  checkTime(input.startedAt, input.durationSec, now);
  if (
    input.distanceM !== undefined &&
    (input.distanceM < 0 || input.distanceM > LIMITS.distanceM.max)
  ) {
    throw new InvalidLogError('values');
  }
  const label = input.label?.trim();
  return insertDoc(rt, sessionDef, {
    kind: 'activity',
    title,
    ...base(input.startedAt, input.durationSec, input.notes),
    activity: {
      type: input.type,
      ...(label ? { label } : {}),
      durationSec: input.durationSec,
      ...(input.distanceM !== undefined ? { distanceM: input.distanceM } : {}),
    },
    exerciseIds: [],
    exercises: [],
  });
}

export interface LoggedExerciseInput extends Omit<ExerciseInput, 'sets'> {
  sets: readonly { type: 'warmup' | 'working'; values: SetValues }[];
}

export interface StrengthInput {
  title: string;
  startedAt: Date;
  durationSec: number;
  notes?: string;
  exercises: readonly LoggedExerciseInput[];
}

/**
 * Krafttraining ohne Timer nachtragen (AK-TRN-23): alle Sätze gelten als erledigt zum Ende der
 * Einheit; die Projektion entsteht in derselben Transaktion wie beim Abschluss im Player.
 */
export async function logStrength(
  rt: DbRuntime,
  input: StrengthInput,
  clock: Clock = {},
): Promise<Session> {
  const now = (clock.now ?? (() => new Date()))();
  checkTime(input.startedAt, input.durationSec, now);
  if (input.exercises.length === 0 || input.exercises.some((e) => e.sets.length === 0)) {
    throw new InvalidLogError('exercises');
  }
  const endedAt = new Date(input.startedAt.getTime() + input.durationSec * 1000);
  return rt.db.transaction('rw', rt.db.sessions, rt.db.meta, rt.db.exerciseHistory, async () => {
    const session = await insertDoc(rt, sessionDef, (hlc) => {
      const exercises = input.exercises.map((exercise, index) => {
        const built = buildExercise(
          { ...exercise, sets: exercise.sets.map((set) => ({ type: set.type })) },
          index,
          hlc,
        );
        built.sets = built.sets.map((set, position) => {
          const given = exercise.sets[position]?.values ?? {};
          const { values, missing } = resolveCompletion(
            exercise.trackingMode,
            given,
            suggestValues(set, undefined),
          );
          if (missing.length > 0) throw new InvalidLogError('values');
          return { ...set, actual: values, status: 'done' as const, completedAt: iso(endedAt) };
        });
        return built;
      });
      return {
        kind: 'strength' as const,
        title: input.title.trim() || 'Training',
        ...base(input.startedAt, input.durationSec, input.notes),
        exerciseIds: [...new Set(exercises.map((e) => e.exerciseId))],
        exercises,
      };
    });
    await writeHistory(rt.db, session);
    return session;
  });
}
