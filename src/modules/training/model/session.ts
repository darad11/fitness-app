import { z } from 'zod';
import { distanceUnitSchema, trackingModeSchema } from '@/modules/exercises';
import {
  childFieldsSchema,
  defineDocSchema,
  isoDateTimeSchema,
  type DocData,
} from '@/shared/db/documents';
import { isValidDayKey, isValidTimeZone } from '@/shared/lib/time';
import { setTypeSchema } from './program';

/** Trainingseinheit als Aggregat mit Übungen und Sätzen (data-model.md Abschnitt 3.1). */
export const SESSION_SCHEMA_VERSION = 1;

/** Länge einer eigenen Notiz je Übung (AK-TRN-24, D-260). */
export const NOTE_MAX = 2000;
/** Länge der Notiz zur ganzen Einheit. */
export const SESSION_NOTE_MAX = 5000;

/** Grenzen der Eingaben (AK-TRN-04, D-241). */
export const LIMITS = {
  weightKg: { min: 0, max: 500 },
  reps: { min: 0, max: 200 },
  durationSec: { min: 0, max: 24 * 60 * 60 },
  distanceM: { min: 0, max: 1_000_000 },
  assistKg: { min: 0, max: 500 },
} as const;

const range = (key: keyof typeof LIMITS) => z.number().min(LIMITS[key].min).max(LIMITS[key].max);
const whole = (key: keyof typeof LIMITS) => range(key).int();

export const setValuesSchema = z.strictObject({
  weightKg: range('weightKg').optional(),
  reps: whole('reps').optional(),
  durationSec: whole('durationSec').optional(),
  distanceM: range('distanceM').optional(),
  assistKg: range('assistKg').optional(),
});
export type SetValues = z.infer<typeof setValuesSchema>;

export const sessionSetTargetSchema = z.strictObject({
  repsMin: whole('reps').optional(),
  repsMax: whole('reps').optional(),
  weightKg: range('weightKg').optional(),
  durationMinSec: whole('durationSec').optional(),
  durationMaxSec: whole('durationSec').optional(),
  distanceM: range('distanceM').optional(),
  assistKg: range('assistKg').optional(),
});
export type SessionSetTarget = z.infer<typeof sessionSetTargetSchema>;

export const SET_STATUSES = ['planned', 'done', 'skipped'] as const;

export const sessionSetSchema = childFieldsSchema.extend({
  type: setTypeSchema,
  parentSetId: z.uuid().optional(),
  target: sessionSetTargetSchema.optional(),
  actual: setValuesSchema,
  status: z.enum(SET_STATUSES),
  completedAt: isoDateTimeSchema.optional(),
  restSec: whole('durationSec').optional(),
});
export type SessionSet = z.infer<typeof sessionSetSchema>;

export const sessionExerciseSchema = childFieldsSchema.extend({
  exerciseId: z.uuid(),
  nameSnapshot: z.string().min(1),
  trackingMode: trackingModeSchema,
  /** Snapshot für die Anzeige (D-241, D-243). */
  distanceUnit: distanceUnitSchema.optional(),
  perSide: z.literal(true).optional(),
  restSec: whole('durationSec').optional(),
  notes: z.string().max(2000).optional(),
  /** Eigene Notiz zu dieser Übung in dieser Einheit (AK-TRN-24); `notes` ist der Hinweis aus dem Plan. */
  note: z.string().max(NOTE_MAX).optional(),
  replacedFromExerciseId: z.uuid().optional(),
  sets: z.array(sessionSetSchema),
});
export type SessionExercise = z.infer<typeof sessionExerciseSchema>;

export const SESSION_SOURCES = ['program', 'template', 'free', 'manual'] as const;
export const ACTIVITY_TYPES = ['run', 'walk', 'cycle', 'swim', 'row', 'hike', 'other'] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

/** Aktivität mit Dauer und optionaler Distanz (AK-TRN-23); nur bei `kind = 'activity'`. */
export const activitySchema = z.strictObject({
  type: z.enum(ACTIVITY_TYPES),
  label: z.string().trim().min(1).max(60).optional(),
  durationSec: whole('durationSec').min(1),
  distanceM: range('distanceM').optional(),
});
export type Activity = z.infer<typeof activitySchema>;
export const SESSION_STATUSES = ['in_progress', 'completed'] as const;

export const sessionSchema = defineDocSchema('session', {
  kind: z.enum(['strength', 'activity']),
  source: z.enum(SESSION_SOURCES),
  status: z.enum(SESSION_STATUSES),
  title: z.string().min(1).max(200),
  program: z
    .strictObject({
      programId: z.uuid(),
      programName: z.string().min(1),
      sampleKey: z.string().min(1).optional(),
      weekId: z.uuid(),
      weekIndex: z.number().int().min(0),
      weekName: z.string().min(1),
      dayId: z.uuid(),
      dayIndex: z.number().int().min(0),
      dayName: z.string().min(1),
    })
    .optional(),
  dayKey: z.string().refine(isValidDayKey, 'Ungültiger Tag'),
  tz: z.string().refine(isValidTimeZone, 'Ungültige Zeitzone'),
  startedAt: isoDateTimeSchema,
  endedAt: isoDateTimeSchema.optional(),
  pauses: z.array(z.strictObject({ start: isoDateTimeSchema, end: isoDateTimeSchema.optional() })),
  durationSec: whole('durationSec').optional(),
  activity: activitySchema.optional(),
  notes: z.string().max(SESSION_NOTE_MAX).optional(),
  restTimer: z
    .strictObject({
      afterSetId: z.uuid(),
      startedAt: isoDateTimeSchema,
      endsAt: isoDateTimeSchema,
      durationSec: whole('durationSec'),
    })
    .nullable()
    .optional(),
  /** Laufender Übungstimer eines Zeitsatzes (AK-TRN-14); übersteht einen Reload. */
  setTimer: z.strictObject({ setId: z.uuid(), startedAt: isoDateTimeSchema }).nullable().optional(),
  exerciseIds: z.array(z.uuid()),
  exercises: z.array(sessionExerciseSchema),
})
  .refine(
    (s) => s.status !== 'completed' || (s.endedAt !== undefined && s.durationSec !== undefined),
    { message: 'Abgeschlossene Einheit ohne Ende oder Dauer', path: ['endedAt'] },
  )
  .refine((s) => (s.kind === 'activity') === (s.activity !== undefined), {
    message: 'Aktivität nur mit Aktivitätsdaten',
    path: ['activity'],
  })
  .refine(
    (s) =>
      s.exercises.every((exercise) =>
        exercise.sets.every(
          (set) =>
            (set.type === 'drop') === (set.parentSetId !== undefined) &&
            (set.parentSetId === undefined ||
              exercise.sets.some((p) => p.id === set.parentSetId && p.type === 'working')),
        ),
      ),
    { message: 'Drop-Satz ohne Arbeitssatz derselben Übung', path: ['exercises'] },
  );

export type Session = z.infer<typeof sessionSchema>;
export type SessionData = DocData<Session>;
