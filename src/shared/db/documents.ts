/**
 * Basisfelder aller gespeicherten Dokumente (data-model.md Abschnitt 3, AK-DAT-11).
 *
 * Die Schemas sind streng typisiert. Unbekannte Felder eines gespeicherten Dokuments erhält das
 * Repository beim Lesen und Schreiben trotzdem, damit eine ältere App-Version Felder einer
 * neueren nicht still entfernt (repository.ts).
 */
import { z } from 'zod';
import { HLC_PATTERN, isHlc } from '../lib/hlc';

export const hlcSchema = z
  .string()
  .regex(HLC_PATTERN, 'Ungültiger Änderungsstempel')
  .refine(isHlc, 'Ungültiger Änderungsstempel');
export const deviceIdSchema = z.string().regex(/^[0-9a-f]{8}$/, 'Ungültige Geräte-ID');
export const isoDateTimeSchema = z.iso.datetime({ precision: 3 });

export const rootFieldsSchema = z.object({
  id: z.uuid(),
  type: z.string().min(1),
  schemaVersion: z.number().int().min(1),
  createdAt: isoDateTimeSchema,
  hlc: hlcSchema,
  deletedAt: hlcSchema.nullable(),
  deletedFrom: z.string().min(1).optional(),
  deviceId: deviceIdSchema,
});
export type RootFields = z.infer<typeof rootFieldsSchema>;

/** Maske für `schema.omit(ROOT_FIELD_MASK)`: nur die fachlichen Felder eines Dokuments. */
export const ROOT_FIELD_MASK = {
  id: true,
  type: true,
  schemaVersion: true,
  createdAt: true,
  hlc: true,
  deletedAt: true,
  deletedFrom: true,
  deviceId: true,
} as const satisfies Record<keyof RootFields, true>;

/**
 * Felder eines Dokuments, die weder Basisfeld sind noch im fachlichen Schema stehen, z. B. von
 * einer neueren App-Version (D-234). Wer ein Dokument aus seinen geprüften Feldern neu aufbaut,
 * hängt sie wieder an, damit sie nicht verloren gehen (A-03).
 */
export function unknownFields(
  doc: Record<string, unknown>,
  known: { readonly shape: Record<string, unknown> },
): Record<string, unknown> {
  const keys = new Set([...Object.keys(known.shape), ...Object.keys(ROOT_FIELD_MASK)]);
  return Object.fromEntries(Object.entries(doc).filter(([key]) => !keys.has(key)));
}

export const childFieldsSchema = z.object({
  id: z.uuid(),
  hlc: hlcSchema,
  deletedAt: hlcSchema.nullable(),
  deletedFrom: z.string().min(1).optional(),
  position: z.number().int().min(0),
});
export type ChildFields = z.infer<typeof childFieldsSchema>;

/** Fachliche Felder eines Dokuments; die Basisfelder setzt das Repository. */
export type DocData<T extends RootFields> = Omit<T, keyof RootFields>;

/** Schema eines Dokumenttyps: Basisfelder, fester Typname und die fachlichen Felder. */
export function defineDocSchema<const TType extends string, TShape extends z.ZodRawShape>(
  type: TType,
  shape: TShape,
) {
  return z.object({ ...rootFieldsSchema.shape, type: z.literal(type), ...shape });
}

/** Schema eines Kindelements (z. B. Satz einer Übung) mit eigener Identität. */
export function defineChildSchema<TShape extends z.ZodRawShape>(shape: TShape) {
  return z.object({ ...childFieldsSchema.shape, ...shape });
}
