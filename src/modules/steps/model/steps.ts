import { z } from 'zod';

const dayKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** Anmeldung beim Dashboard (nur auf diesem Gerät, Tabelle `meta`). */
export const dashboardAuthSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  /** Ablauf des Zugriffstokens in ms seit 1970. */
  expiresAt: z.number(),
  userId: z.string().min(1),
  email: z.string(),
});
export type DashboardAuth = z.infer<typeof dashboardAuthSchema>;

/**
 * Ein Jahr der Step Challenge, so wie das Dashboard es speichert: Schritte vom 1. Jänner bis
 * `baselineDate` einmal als Summe, danach Tageswerte.
 */
export const yearConfigSchema = z.object({
  goal: z.number().int().positive(),
  baselineSteps: z.number().int().min(0),
  baselineDate: dayKey,
  previousYearTotal: z.number().int().min(0).nullable().optional(),
});
export type YearConfig = z.infer<typeof yearConfigSchema>;

export const challengeSettingSchema = z.object({
  years: z.record(z.string(), z.unknown()),
});

/** Zeile der Tabelle `step_entries` im Dashboard. */
export const stepRowSchema = z.object({
  date: dayKey,
  steps: z.number().int().min(0),
  deleted: z.boolean(),
});
export type StepRow = z.infer<typeof stepRowSchema>;

/** Letzter abgeholter Stand, damit die Karte auch ohne Netz etwas zeigt. */
export const stepsCacheSchema = z.object({
  fetchedAt: z.number(),
  /** Jahr, für das `config` gilt; `null` = im Dashboard nicht eingerichtet. */
  year: z.number().int(),
  config: yearConfigSchema.nullable(),
  /** Schritte je Tag dieses Jahres (gelöschte Tage fehlen). */
  entries: z.record(dayKey, z.number().int().min(0)),
});
export type StepsCache = z.infer<typeof stepsCacheSchema>;

/** Zustand des letzten Abholens. */
export const stepsStatusSchema = z.object({
  lastError: z.enum(['offline', 'auth', 'failed']).optional(),
  lastAttemptAt: z.number().optional(),
});
export type StepsStatus = z.infer<typeof stepsStatusSchema>;
