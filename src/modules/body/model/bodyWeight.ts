import { z } from 'zod';
import { defineDocSchema, isoDateTimeSchema, type DocData } from '@/shared/db/documents';
import { isValidDayKey, isValidTimeZone } from '@/shared/lib/time';

/** Körpergewicht (data-model.md Abschnitt 3.5, AK-BW-01). */
export const BODY_WEIGHT_SCHEMA_VERSION = 1;

export const BODY_WEIGHT_LIMITS = { min: 20, max: 400 } as const;
/** Höchstens so weit in der Zukunft darf ein Zeitpunkt liegen (AK-BW-01). */
export const MAX_FUTURE_MS = 24 * 60 * 60 * 1000;
/** Sprung, ab dem „Bitte prüfen“ erscheint, und das Zeitfenster dafür (AK-BW-02). */
export const PLAUSIBILITY = { jumpKg: 3, windowDays: 3 } as const;

export const BODY_WEIGHT_SOURCES = ['manual', 'import'] as const;

export const bodyWeightSchema = defineDocSchema('body_weight', {
  measuredAt: isoDateTimeSchema,
  dayKey: z.string().refine(isValidDayKey, 'Ungültiger Tag'),
  tz: z.string().refine(isValidTimeZone, 'Ungültige Zeitzone'),
  weightKg: z
    .number()
    .min(BODY_WEIGHT_LIMITS.min)
    .max(BODY_WEIGHT_LIMITS.max)
    .refine(
      (value) => Math.abs(value * 10 - Math.round(value * 10)) < 1e-6,
      'Eine Nachkommastelle',
    ),
  note: z.string().max(500).optional(),
  source: z.enum(BODY_WEIGHT_SOURCES),
});

export type BodyWeight = z.infer<typeof bodyWeightSchema>;
export type BodyWeightData = DocData<BodyWeight>;
