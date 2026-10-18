import type { DistanceUnit, TrackingMode } from '@/modules/exercises';
import {
  insertDoc,
  restoreDoc,
  softDeleteDoc,
  updateDoc,
  type DbRuntime,
  type DocData,
} from '@/shared/db';
import type { Hlc } from '@/shared/lib/hlc';
import { dayKey, localTimeZone } from '@/shared/lib/time';
import { uuidv4 } from '@/shared/lib/uuid';
import {
  checkValue,
  liveExercises,
  liveSets,
  resolveCompletion,
  sessionDurationSec,
  suggestValues,
  type ValueError,
  type ValueField,
} from '../calc/session';
import type { SampleTemplate, SetType } from '../model/program';
import type {
  Session,
  SessionExercise,
  SessionSet,
  SessionSetTarget,
  SetValues,
} from '../model/session';
import { findActiveSession, sessionDef, writeHistory } from '../data/sessionRepository';

// ---------------------------------------------------------------------------------------------
// Fehler

/** Es läuft schon eine Einheit (AK-TRN-22). */
export class ActiveSessionError extends Error {
  override name = 'ActiveSessionError';
  constructor(readonly sessionId: string) {
    super('Es läuft bereits ein Training');
  }
}

/** Abgeschlossene Einheiten ändern ihren Ablauf nicht mehr (Status ist monoton). */
export class SessionClosedError extends Error {
  override name = 'SessionClosedError';
}

export class ItemNotFoundError extends Error {
  override name = 'ItemNotFoundError';
}

/** „Erledigt" ohne Eingabe und ohne Vorschlag (AK-TRN-06). */
export class MissingValuesError extends Error {
  override name = 'MissingValuesError';
  constructor(readonly fields: readonly ValueField[]) {
    super('Werte fehlen');
  }
}

/** Ungültige Eingabe (AK-TRN-04); gespeicherte Werte bleiben unverändert. */
export class InvalidValueError extends Error {
  override name = 'InvalidValueError';
  constructor(
    readonly field: ValueField,
    readonly reason: ValueError,
  ) {
    super('Ungültiger Wert');
  }
}

/** Beenden mit offenen Sätzen ohne Zustimmung, sie zu überspringen (AK-TRN-19). */
export class OpenSetsError extends Error {
  override name = 'OpenSetsError';
  constructor(readonly count: number) {
    super('Offene Sätze');
  }
}

// ---------------------------------------------------------------------------------------------
// Bausteine

export interface PlannedSetInput {
  type: SetType;
  /** Bei Drop-Sätzen: Index des Arbeitssatzes in dieser Liste. */
  parentIndex?: number;
  target?: SessionSetTarget;
  restSec?: number;
}

/** Übung, wie sie in eine Einheit übernommen wird (Snapshot von Name und Erfassungsart). */
export interface ExerciseInput {
  exerciseId: string;
  name: string;
  trackingMode: TrackingMode;
  distanceUnit?: DistanceUnit;
  perSide?: boolean;
  restSec?: number;
  sets: readonly PlannedSetInput[];
}

export interface StartInput {
  source: Session['source'];
  title: string;
  program?: Session['program'];
  exercises: readonly ExerciseInput[];
}

export interface Clock {
  now?: () => Date;
}

const iso = (date: Date) => date.toISOString();

function child(hlc: Hlc, position: number) {
  return { id: uuidv4(), hlc, deletedAt: null, position };
}

function buildExercise(input: ExerciseInput, position: number, hlc: Hlc): SessionExercise {
  const sets: SessionSet[] = [];
  input.sets.forEach((planned, index) => {
    const parent = planned.parentIndex !== undefined ? sets[planned.parentIndex] : undefined;
    if (planned.type === 'drop' && parent?.type !== 'working') {
      throw new Error('Drop-Satz ohne Arbeitssatz');
    }
    sets.push({
      ...child(hlc, index),
      type: planned.type,
      ...(parent ? { parentSetId: parent.id } : {}),
      ...(planned.target ? { target: planned.target } : {}),
      actual: {},
      status: 'planned',
      ...(planned.restSec !== undefined ? { restSec: planned.restSec } : {}),
    });
  });
  return {
    ...child(hlc, position),
    exerciseId: input.exerciseId,
    nameSnapshot: input.name,
    trackingMode: input.trackingMode,
    ...(input.distanceUnit ? { distanceUnit: input.distanceUnit } : {}),
    ...(input.perSide ? { perSide: true as const } : {}),
    ...(input.restSec !== undefined ? { restSec: input.restSec } : {}),
    sets,
  };
}

function withIndex(session: DocData<Session>): DocData<Session> {
  return {
    ...session,
    exerciseIds: [...new Set(liveExercises(session).map((exercise) => exercise.exerciseId))],
  };
}

/** Ändert eine laufende Einheit; `change` arbeitet auf einer Kopie. */
function changeSession(
  rt: DbRuntime,
  sessionId: string,
  change: (session: Session, hlc: Hlc) => void,
): Promise<Session> {
  return updateDoc(rt, sessionDef, sessionId, (current, hlc) => {
    if (current.status !== 'in_progress') throw new SessionClosedError('Training ist beendet');
    const draft = structuredClone(current);
    change(draft, hlc);
    return withIndex(draft);
  });
}

function findExercise(session: Session, exerciseKey: string): SessionExercise {
  const exercise = liveExercises(session).find((candidate) => candidate.id === exerciseKey);
  if (!exercise) throw new ItemNotFoundError('Übung nicht gefunden');
  return exercise;
}

function findSet(session: Session, setId: string): { exercise: SessionExercise; set: SessionSet } {
  for (const exercise of liveExercises(session)) {
    const set = liveSets(exercise).find((candidate) => candidate.id === setId);
    if (set) return { exercise, set };
  }
  throw new ItemNotFoundError('Satz nicht gefunden');
}

// ---------------------------------------------------------------------------------------------
// Starten

/** Startet eine Einheit mit Snapshot aller Übungen und Sätze (AK-TRN-01, AK-TRN-22). */
export async function startSession(
  rt: DbRuntime,
  input: StartInput,
  clock: Clock = {},
): Promise<Session> {
  const now = (clock.now ?? (() => new Date()))();
  const tz = localTimeZone();
  return rt.db.transaction('rw', rt.db.sessions, rt.db.meta, async () => {
    const active = await findActiveSession(rt.db);
    if (active) throw new ActiveSessionError(active.id);
    return insertDoc(rt, sessionDef, (hlc) =>
      withIndex({
        kind: 'strength',
        source: input.source,
        status: 'in_progress',
        title: input.title,
        ...(input.program ? { program: input.program } : {}),
        dayKey: dayKey(now, tz),
        tz,
        startedAt: iso(now),
        pauses: [],
        restTimer: null,
        exerciseIds: [],
        exercises: input.exercises.map((exercise, index) => buildExercise(exercise, index, hlc)),
      }),
    );
  });
}

export interface ExerciseInfo {
  id: string;
  name: string;
  trackingMode: TrackingMode;
  distanceUnit?: DistanceUnit;
  isUnilateral?: boolean;
}

/**
 * Einheit aus einem Tag einer Vorlage, ohne Kopie der Vorlage (S-49, AK-PRG-06). Aus dem aktiven
 * Programm gestartet ist die Quelle `program`, sonst `template` (D-249).
 */
export function planFromTemplateDay(
  template: SampleTemplate,
  weekIndex: number,
  dayIndex: number,
  lookup: (exerciseId: string) => ExerciseInfo | undefined,
  source: 'program' | 'template' = 'template',
): StartInput {
  const week = template.weeks[weekIndex];
  const day = week?.days[dayIndex];
  if (!week || !day) throw new ItemNotFoundError('Trainingstag nicht gefunden');
  return {
    source,
    title: `${day.name} · ${template.name}`,
    program: {
      programId: template.id,
      programName: template.name,
      sampleKey: template.key,
      weekId: week.id,
      weekIndex,
      weekName: week.name,
      dayId: day.id,
      dayIndex,
      dayName: day.name,
    },
    exercises: day.exercises.map((planned) => {
      const info = lookup(planned.exerciseId);
      if (!info) throw new ItemNotFoundError(`Übung fehlt: ${planned.nameSnapshot}`);
      return {
        exerciseId: info.id,
        name: info.name,
        trackingMode: info.trackingMode,
        ...(info.distanceUnit ? { distanceUnit: info.distanceUnit } : {}),
        ...(info.isUnilateral ? { perSide: true } : {}),
        ...(planned.restSec !== undefined ? { restSec: planned.restSec } : {}),
        sets: planned.sets.map((set) => {
          const parentIndex = set.parentSetId
            ? planned.sets.findIndex((candidate) => candidate.id === set.parentSetId)
            : -1;
          const target: SessionSetTarget = {};
          if (set.repsMin !== undefined) target.repsMin = set.repsMin;
          if (set.repsMax !== undefined) target.repsMax = set.repsMax;
          if (set.durationMinSec !== undefined) target.durationMinSec = set.durationMinSec;
          if (set.durationMaxSec !== undefined) target.durationMaxSec = set.durationMaxSec;
          return {
            type: set.type,
            ...(parentIndex >= 0 ? { parentIndex } : {}),
            target,
            ...(set.restSec !== undefined ? { restSec: set.restSec } : {}),
          };
        }),
      };
    }),
  };
}

// ---------------------------------------------------------------------------------------------
// Übungen und Sätze (AK-TRN-09)

/** Neue Übung am Ende, mit einem leeren Arbeitssatz. */
export function addExercise(
  rt: DbRuntime,
  sessionId: string,
  input: Omit<ExerciseInput, 'sets'>,
): Promise<Session> {
  return changeSession(rt, sessionId, (session, hlc) => {
    const position = Math.max(-1, ...session.exercises.map((e) => e.position)) + 1;
    session.exercises.push(buildExercise({ ...input, sets: [{ type: 'working' }] }, position, hlc));
  });
}

/** Entfernt eine Übung weich; die Rückfrage bei erledigten Sätzen stellt die Oberfläche. */
export function removeExercise(
  rt: DbRuntime,
  sessionId: string,
  sessionExerciseId: string,
): Promise<Session> {
  return changeSession(rt, sessionId, (session, hlc) => {
    const exercise = findExercise(session, sessionExerciseId);
    exercise.deletedAt = hlc;
    exercise.hlc = hlc;
    if (
      session.restTimer &&
      exercise.sets.some((set) => set.id === session.restTimer?.afterSetId)
    ) {
      session.restTimer = null;
    }
  });
}

/** Neuer Satz am Ende der Übung; Ziel aus dem letzten erledigten Satz desselben Typs, sonst dem letzten. */
export function addSet(
  rt: DbRuntime,
  sessionId: string,
  sessionExerciseId: string,
  type: Exclude<SetType, 'drop'> = 'working',
): Promise<Session> {
  return changeSession(rt, sessionId, (session, hlc) => {
    const exercise = findExercise(session, sessionExerciseId);
    const sameType = liveSets(exercise).filter((set) => set.type === type);
    const last =
      sameType.filter((set) => set.status === 'done').at(-1) ??
      sameType.at(-1) ??
      liveSets(exercise).at(-1);
    const position = Math.max(-1, ...exercise.sets.map((s) => s.position)) + 1;
    const target = last ? targetFrom(last) : undefined;
    exercise.sets.push({
      ...child(hlc, position),
      type,
      ...(target ? { target } : {}),
      actual: {},
      status: 'planned',
      ...(last?.restSec !== undefined ? { restSec: last.restSec } : {}),
    });
    exercise.hlc = hlc;
  });
}

/** Ziel eines neuen Satzes: erledigte Werte als feste Ziele, sonst das bisherige Ziel. */
function targetFrom(set: SessionSet): SessionSetTarget | undefined {
  if (set.status !== 'done') return set.target;
  const { weightKg, reps, durationSec, distanceM, assistKg } = set.actual;
  const target: SessionSetTarget = {};
  if (weightKg !== undefined) target.weightKg = weightKg;
  if (assistKg !== undefined) target.assistKg = assistKg;
  if (distanceM !== undefined) target.distanceM = distanceM;
  if (reps !== undefined) target.repsMin = target.repsMax = reps;
  if (durationSec !== undefined) target.durationMinSec = target.durationMaxSec = durationSec;
  return target;
}

/** Entfernt einen Satz weich; an ihm hängende Drop-Sätze gehen mit. */
export function removeSet(rt: DbRuntime, sessionId: string, setId: string): Promise<Session> {
  return changeSession(rt, sessionId, (session, hlc) => {
    const { exercise, set } = findSet(session, setId);
    for (const candidate of exercise.sets) {
      if (candidate.id === set.id || candidate.parentSetId === set.id) {
        candidate.deletedAt = hlc;
        candidate.hlc = hlc;
      }
    }
    if (session.restTimer?.afterSetId === setId) session.restTimer = null;
  });
}

// ---------------------------------------------------------------------------------------------
// Werte und Status (AK-TRN-04, AK-TRN-06, AK-TRN-07)

/** Setzt oder leert (`null`) einzelne Werte. Ungültiges wird abgelehnt, nichts wird geschrieben. */
export function setValues(
  rt: DbRuntime,
  sessionId: string,
  setId: string,
  patch: { [K in keyof SetValues]?: number | null },
): Promise<Session> {
  for (const [field, value] of Object.entries(patch) as [ValueField, number | null][]) {
    if (value === null) continue;
    const error = checkValue(field, value);
    if (error) return Promise.reject(new InvalidValueError(field, error));
  }
  return changeSession(rt, sessionId, (session, hlc) => {
    const { set } = findSet(session, setId);
    const next: Record<string, number | null | undefined> = { ...set.actual, ...patch };
    set.actual = Object.fromEntries(
      Object.entries(next).filter(
        (entry): entry is [string, number] => typeof entry[1] === 'number',
      ),
    );
    set.hlc = hlc;
  });
}

export interface CompleteOptions extends Clock {
  /** Werte des passenden Satzes der letzten Einheit; mit festen Zielwerten der Vorschlag. */
  previous?: SetValues;
  /** Pause aus den Einstellungen, wenn Satz und Übung keine haben. */
  restDefaultSec: number;
  autoStartRest: boolean;
}

/**
 * Markiert einen Satz als erledigt und startet den Pausentimer mit gespeichertem Endzeitpunkt
 * (AK-TRN-10, AK-TRN-11). Folgen offene Drop-Sätze, startet der Timer erst nach dem letzten.
 */
export function completeSet(
  rt: DbRuntime,
  sessionId: string,
  setId: string,
  options: CompleteOptions,
): Promise<Session> {
  const now = (options.now ?? (() => new Date()))();
  return changeSession(rt, sessionId, (session, hlc) => {
    const { exercise, set } = findSet(session, setId);
    const { values, missing } = resolveCompletion(
      exercise.trackingMode,
      set.actual,
      suggestValues(set, options.previous),
    );
    if (missing.length > 0) throw new MissingValuesError(missing);
    set.actual = values;
    set.status = 'done';
    set.completedAt = iso(now);
    set.hlc = hlc;

    const chainParent = set.type === 'drop' ? set.parentSetId : set.id;
    const openDrops = liveSets(exercise).some(
      (candidate) =>
        candidate.type === 'drop' &&
        candidate.parentSetId === chainParent &&
        candidate.position > set.position &&
        candidate.status === 'planned',
    );
    // Nach einer Drop-Kette gilt die Pause des Arbeitssatzes, nicht die 0 s der Drop-Sätze.
    const restSource =
      set.type === 'drop' ? liveSets(exercise).find((s) => s.id === set.parentSetId) : set;
    const rest = restSource?.restSec ?? exercise.restSec ?? options.restDefaultSec;
    if (options.autoStartRest && !openDrops && rest > 0) {
      session.restTimer = {
        afterSetId: set.id,
        startedAt: iso(now),
        endsAt: iso(new Date(now.getTime() + rest * 1000)),
        durationSec: rest,
      };
    } else if (!openDrops) {
      session.restTimer = null;
    }
  });
}

/** Macht „erledigt" oder „übersprungen" rückgängig; die Werte bleiben erhalten (AK-TRN-07). */
export function reopenSet(rt: DbRuntime, sessionId: string, setId: string): Promise<Session> {
  return changeSession(rt, sessionId, (session, hlc) => {
    const { set } = findSet(session, setId);
    set.status = 'planned';
    delete set.completedAt;
    set.hlc = hlc;
    if (session.restTimer?.afterSetId === setId) session.restTimer = null;
  });
}

export function skipSet(rt: DbRuntime, sessionId: string, setId: string): Promise<Session> {
  return changeSession(rt, sessionId, (_session, hlc) => {
    const { set } = findSet(_session, setId);
    set.status = 'skipped';
    delete set.completedAt;
    set.hlc = hlc;
  });
}

// ---------------------------------------------------------------------------------------------
// Pausentimer (AK-TRN-10)

/** Verlängert oder verkürzt die laufende Pause, z. B. um ±15 s; nie vor ihren Start. */
export function adjustRest(rt: DbRuntime, sessionId: string, deltaSec: number): Promise<Session> {
  return changeSession(rt, sessionId, (session) => {
    const timer = session.restTimer;
    if (!timer) return;
    const endsAt = Math.max(
      Date.parse(timer.startedAt),
      Date.parse(timer.endsAt) + deltaSec * 1000,
    );
    session.restTimer = {
      ...timer,
      endsAt: iso(new Date(endsAt)),
      durationSec: Math.round((endsAt - Date.parse(timer.startedAt)) / 1000),
    };
  });
}

export function skipRest(rt: DbRuntime, sessionId: string): Promise<Session> {
  return changeSession(rt, sessionId, (session) => {
    session.restTimer = null;
  });
}

// ---------------------------------------------------------------------------------------------
// Beenden und Verwerfen (AK-TRN-19, AK-TRN-21)

export interface FinishOptions extends Clock {
  /** Zustimmung, offene Sätze als übersprungen zu speichern. */
  skipOpen: boolean;
}

/** Schließt die Einheit ab und schreibt die Projektion in derselben Transaktion. */
export async function finishSession(
  rt: DbRuntime,
  sessionId: string,
  options: FinishOptions,
): Promise<Session> {
  const now = (options.now ?? (() => new Date()))();
  return rt.db.transaction('rw', rt.db.sessions, rt.db.meta, rt.db.exerciseHistory, async () => {
    const finished = await updateDoc(rt, sessionDef, sessionId, (current, hlc) => {
      if (current.status !== 'in_progress') throw new SessionClosedError('Training ist beendet');
      const draft = structuredClone(current);
      const open = liveExercises(draft).flatMap((exercise) =>
        liveSets(exercise).filter((set) => set.status === 'planned'),
      );
      if (open.length > 0 && !options.skipOpen) throw new OpenSetsError(open.length);
      const ids = new Set(open.map((set) => set.id));
      for (const exercise of draft.exercises) {
        for (const set of exercise.sets) {
          if (ids.has(set.id)) {
            set.status = 'skipped';
            set.hlc = hlc;
          }
        }
      }
      const endedAt = iso(now);
      draft.pauses = draft.pauses.map((pause) => (pause.end ? pause : { ...pause, end: endedAt }));
      return withIndex({
        ...draft,
        status: 'completed',
        endedAt,
        durationSec: sessionDurationSec({ ...draft, endedAt }, now),
        restTimer: null,
      });
    });
    await writeHistory(rt.db, finished);
    return finished;
  });
}

/** Verwirft eine laufende Einheit (weich, mit `deletedFrom`), damit „Rückgängig" möglich ist. */
export async function discardSession(rt: DbRuntime, sessionId: string): Promise<void> {
  await softDeleteDoc(rt, sessionDef, sessionId, 'in_progress');
}

/** „Rückgängig" nach dem Verwerfen; nur, solange keine andere Einheit läuft. */
export async function restoreSession(rt: DbRuntime, sessionId: string): Promise<Session> {
  return rt.db.transaction('rw', rt.db.sessions, rt.db.meta, async () => {
    const active = await findActiveSession(rt.db);
    if (active && active.id !== sessionId) throw new ActiveSessionError(active.id);
    return restoreDoc(rt, sessionDef, sessionId);
  });
}
