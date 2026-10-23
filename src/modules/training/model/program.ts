import { z } from 'zod';
import {
  childFieldsSchema,
  defineDocSchema,
  isoDateTimeSchema,
  type DocData,
} from '@/shared/db/documents';

/**
 * Struktur von Programmen und Vorlagen (data-model.md Abschnitt 3.2). Die Anzeigeform
 * (`PlanTree`) kommt ohne Sync-Felder aus; sie gilt für gebündelte Beispielvorlagen (D-230)
 * und für eigene Programme. Eigene Programme speichert `programSchema` mit HLC und
 * Löschmarkierung je Kindelement (D-257).
 */
export const SET_TYPES = ['warmup', 'working', 'drop'] as const;
export const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export const LOCATIONS = ['gym', 'home', 'both'] as const;

export const setTypeSchema = z.enum(SET_TYPES);
export const levelSchema = z.enum(LEVELS);
export const locationSchema = z.enum(LOCATIONS);

const count = z.number().int().min(1).max(100);
const seconds = z
  .number()
  .int()
  .min(0)
  .max(24 * 60 * 60);

/** Zielbereich eines Satzes: Wiederholungen (z. B. 6–8) oder Dauer (z. B. 30–45 s). */
export const setTargetSchema = z
  .strictObject({
    repsMin: count.optional(),
    repsMax: count.optional(),
    durationMinSec: seconds.optional(),
    durationMaxSec: seconds.optional(),
  })
  .refine((t) => (t.repsMin === undefined) === (t.repsMax === undefined), 'Bereich unvollständig')
  .refine(
    (t) => (t.durationMinSec === undefined) === (t.durationMaxSec === undefined),
    'Bereich unvollständig',
  )
  .refine((t) => (t.repsMin ?? 0) <= (t.repsMax ?? 0), 'Bereich verkehrt herum')
  .refine((t) => (t.durationMinSec ?? 0) <= (t.durationMaxSec ?? 0), 'Bereich verkehrt herum');

export type SetTarget = z.infer<typeof setTargetSchema>;
export type SetType = z.infer<typeof setTypeSchema>;
export type Level = z.infer<typeof levelSchema>;
export type Location = z.infer<typeof locationSchema>;

export interface PlannedSet extends SetTarget {
  id: string;
  position: number;
  type: SetType;
  /** Pflicht bei Drop-Sätzen: der Arbeitssatz davor. */
  parentSetId?: string;
  /** Optionales Zielgewicht bzw. Zielvorgaben je Erfassungsart (AK-PRG-04, D-241). */
  weightKg?: number;
  distanceM?: number;
  assistKg?: number;
  restSec?: number;
}

export interface PlannedExercise {
  id: string;
  position: number;
  exerciseId: string;
  /** Anzeige, auch wenn die Übung später fehlt. */
  nameSnapshot: string;
  restSec?: number;
  /** Ausführungshinweis, z. B. „wechselseitig“ oder die Dropset-Regel. */
  notes?: string;
  /** Englischer Name der Übung in der Vorlage eines Programms, z. B. bei Programm C. */
  originalName?: string;
  sets: PlannedSet[];
}

/** Wochentag nach ISO: 1 = Montag … 7 = Sonntag. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface Day {
  id: string;
  position: number;
  name: string;
  /** Optionaler Wochentag-Hinweis für „Heute geplant" (AK-PRG-09). */
  weekdayHint?: Weekday;
  notes?: string;
  exercises: PlannedExercise[];
}

export interface Week {
  id: string;
  position: number;
  name: string;
  days: Day[];
}

/** Gemeinsame Form gebündelter und eigener Programme: alles, was Anzeige und Start brauchen. */
export interface PlanTree {
  id: string;
  name: string;
  description?: string;
  /** Nach der letzten Woche wieder bei Woche 1 beginnen. */
  repeat: boolean;
  weeks: Week[];
}

/** Gebündelte, schreibgeschützte Beispielvorlage (sample-templates.md). */
export interface SampleTemplate extends PlanTree {
  /** Fester Schlüssel; aus ihm entstehen die IDs der Vorlage, auch in gespeicherten Daten. */
  key: string;
  /** Teil der Adresse, wenn er vom Schlüssel abweichen soll (F5, D-328); sonst der Schlüssel. */
  slug?: string;
  /** Vollständiges Programm (A, B, C) statt kurzer Beispielvorlage. */
  program?: boolean;
  /** Herkunft als kurze Angabe, wenn es eine gibt. */
  source?: string;
  level: Level;
  location: Location;
  /** Anzeige, z. B. „3" oder „3–6". */
  daysPerWeek: string;
}

/** Quelle `sample-templates.v1.json`, erzeugt aus sample-templates.md. */
const sourceExerciseSchema = z
  .strictObject({
    exercise: z.string().min(1),
    note: z.string().min(1).max(300).optional(),
    originalName: z.string().min(1).optional(),
    warmup: z.number().int().min(0).max(2),
    working: z.number().int().min(1).max(10),
    target: setTargetSchema,
    restSec: seconds,
    drop: z.number().int().min(1).max(3).optional(),
    dropTarget: setTargetSchema.optional(),
  })
  .refine((e) => (e.drop === undefined) === (e.dropTarget === undefined), 'Drop unvollständig');

export const sampleTemplateSourceSchema = z
  .strictObject({
    version: z.literal(1),
    templates: z
      .array(
        z
          .strictObject({
            key: z.string().regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/),
            slug: z
              .string()
              .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
              .optional(),
            name: z.string().min(1),
            description: z.string().min(1).optional(),
            program: z.literal(true).optional(),
            source: z.string().min(1).optional(),
            level: levelSchema,
            location: locationSchema,
            daysPerWeek: z.string().min(1),
            repeat: z.boolean(),
            days: z
              .array(
                z.strictObject({
                  name: z.string().min(1),
                  exercises: z.array(sourceExerciseSchema).min(1),
                }),
              )
              .min(1),
            weeks: z.array(z.array(z.string()).min(1)).min(1),
          })
          .refine(
            (t) => t.weeks.flat().every((name) => t.days.some((day) => day.name === name)),
            'Woche verweist auf einen unbekannten Tag',
          ),
      )
      .min(1),
  })
  .refine(
    (s) => new Set(s.templates.map((t) => t.key)).size === s.templates.length,
    'Doppelter Schlüssel',
  );

export type SampleTemplateSource = z.infer<typeof sampleTemplateSourceSchema>;
export type SampleTemplateSourceEntry = SampleTemplateSource['templates'][number];

// ---------------------------------------------------------------------------------------------
// Eigene Programme und Vorlagen als Dokument (data-model.md 3.2, D-257)

export const PROGRAM_SCHEMA_VERSION = 1;
export const PROGRAM_KINDS = ['program', 'template'] as const;
export const PROGRAM_ORIGINS = ['user', 'sample-copy', 'import'] as const;

/** Grenzen des Editors (lebende Elemente, ohne Löschmarkierungen). */
export const PLAN_LIMITS = {
  nameLength: 80,
  descriptionLength: 2000,
  notesLength: 2000,
  weeks: 52,
  daysPerWeek: 14,
  exercisesPerDay: 40,
  setsPerExercise: 30,
} as const;

const reps = z.number().int().min(0).max(200);
const weight = z.number().min(0).max(500);
const name = z.string().trim().min(1).max(PLAN_LIMITS.nameLength);

export const plannedSetDocSchema = childFieldsSchema
  .extend({
    type: setTypeSchema,
    parentSetId: z.uuid().optional(),
    repsMin: reps.optional(),
    repsMax: reps.optional(),
    weightKg: weight.optional(),
    durationMinSec: seconds.optional(),
    durationMaxSec: seconds.optional(),
    distanceM: z.number().min(0).max(1_000_000).optional(),
    assistKg: weight.optional(),
    restSec: seconds.optional(),
  })
  .refine((t) => (t.repsMin === undefined) === (t.repsMax === undefined), 'Bereich unvollständig')
  .refine(
    (t) => (t.durationMinSec === undefined) === (t.durationMaxSec === undefined),
    'Bereich unvollständig',
  )
  .refine((t) => (t.repsMin ?? 0) <= (t.repsMax ?? 0), 'Bereich verkehrt herum')
  .refine((t) => (t.durationMinSec ?? 0) <= (t.durationMaxSec ?? 0), 'Bereich verkehrt herum')
  .refine((t) => (t.type === 'drop') === (t.parentSetId !== undefined), 'Drop ohne Arbeitssatz');

export const plannedExerciseDocSchema = childFieldsSchema.extend({
  exerciseId: z.uuid(),
  nameSnapshot: z.string().min(1).max(200),
  restSec: seconds.optional(),
  notes: z.string().max(PLAN_LIMITS.notesLength).optional(),
  originalName: z.string().min(1).max(200).optional(),
  sets: z.array(plannedSetDocSchema).max(1000),
});

export const dayDocSchema = childFieldsSchema.extend({
  name,
  weekdayHint: z.number().int().min(1).max(7).optional(),
  notes: z.string().max(PLAN_LIMITS.notesLength).optional(),
  exercises: z.array(plannedExerciseDocSchema).max(1000),
});

export const weekDocSchema = childFieldsSchema.extend({
  name,
  days: z.array(dayDocSchema).max(1000),
});

export const programSchema = defineDocSchema('program', {
  kind: z.enum(PROGRAM_KINDS),
  name,
  description: z.string().max(PLAN_LIMITS.descriptionLength).optional(),
  origin: z.enum(PROGRAM_ORIGINS),
  /** Herkunft aus einer Beispielvorlage oder einem gebündelten Programm. */
  sampleKey: z.string().min(1).optional(),
  level: levelSchema.optional(),
  location: locationSchema.optional(),
  repeat: z.boolean(),
  archivedAt: isoDateTimeSchema.optional(),
  weeks: z.array(weekDocSchema).max(1000),
});

export type ProgramDoc = z.infer<typeof programSchema>;
export type ProgramDocData = DocData<ProgramDoc>;
export type StoredWeek = z.infer<typeof weekDocSchema>;
export type StoredDay = z.infer<typeof dayDocSchema>;
export type StoredExercise = z.infer<typeof plannedExerciseDocSchema>;
export type StoredSet = z.infer<typeof plannedSetDocSchema>;
export type ProgramKind = (typeof PROGRAM_KINDS)[number];

/** Eigenes Programm oder eigene Vorlage in Anzeigeform (ohne gelöschte Elemente). */
export interface OwnProgram extends PlanTree {
  kind: ProgramKind;
  origin: ProgramDoc['origin'];
  sampleKey?: string;
  level?: Level;
  location?: Location;
  archivedAt?: string;
  createdAt: string;
}

/** Bearbeitbare Felder eines eigenen Programms. */
export type ProgramPlan = Pick<OwnProgram, 'name' | 'description' | 'repeat' | 'weeks'>;
