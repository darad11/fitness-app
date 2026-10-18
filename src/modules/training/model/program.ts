import { z } from 'zod';

/**
 * Struktur von Programmen und Vorlagen (data-model.md Abschnitt 3.2). Hier ohne die
 * Sync-Felder der Dokumente: Beispielvorlagen sind gebündelte Stammdaten (D-230); eigene
 * Programme mit HLC und Löschmarkierung folgen in M2.
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
  restSec?: number;
}

export interface PlannedExercise {
  id: string;
  position: number;
  exerciseId: string;
  /** Anzeige, auch wenn die Übung später fehlt. */
  nameSnapshot: string;
  restSec?: number;
  sets: PlannedSet[];
}

export interface Day {
  id: string;
  position: number;
  name: string;
  exercises: PlannedExercise[];
}

export interface Week {
  id: string;
  position: number;
  name: string;
  days: Day[];
}

/** Gebündelte, schreibgeschützte Beispielvorlage (sample-templates.md). */
export interface SampleTemplate {
  id: string;
  key: string;
  name: string;
  level: Level;
  location: Location;
  /** Anzeige, z. B. „3" oder „3–6". */
  daysPerWeek: string;
  repeat: boolean;
  weeks: Week[];
}

/** Quelle `sample-templates.v1.json`, erzeugt aus sample-templates.md. */
const sourceExerciseSchema = z
  .strictObject({
    exercise: z.string().min(1),
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
            name: z.string().min(1),
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
