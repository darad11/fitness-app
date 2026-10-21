import { z } from 'zod';
import { defineDocSchema, isoDateTimeSchema, type DocData } from '@/shared/db/documents';
import { isValidDayKey, isValidTimeZone } from '@/shared/lib/time';

/**
 * Wasser (D-289): ein Dokument je Trinkaktion, Menge in ml. Der Tag (`dayKey`) ist der lokale
 * Kalendertag, zu dem die Menge zählt; `loggedAt` ist der Zeitpunkt des Eintragens. Getrennt vom
 * Ernährungstagebuch: Wasser hat keine Nährwerte und zählt nie als Lebensmittel.
 */
export const WATER_SCHEMA_VERSION = 1;
/** Größte Menge je Eintrag, damit Tippfehler wie „25000“ nicht durchrutschen. */
export const WATER_ENTRY_MAX_ML = 5000;

export const waterEntrySchema = defineDocSchema('water_entry', {
  dayKey: z.string().refine(isValidDayKey, 'Ungültiger Tag'),
  tz: z.string().refine(isValidTimeZone, 'Ungültige Zeitzone'),
  loggedAt: isoDateTimeSchema,
  amountMl: z.number().int().min(1).max(WATER_ENTRY_MAX_ML),
});

export type WaterEntry = z.infer<typeof waterEntrySchema>;
export type WaterEntryData = DocData<WaterEntry>;
