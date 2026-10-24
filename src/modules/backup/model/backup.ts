/**
 * Hülle einer Sicherung (data-model.md Abschnitt 11, D-345). Die Dokumente darin prüft
 * `calc/check.ts` je Dokumentart mit dem Schema des zuständigen Moduls.
 */
import { z } from 'zod';

export const backupEnvelopeSchema = z.object({
  format: z.string(),
  formatVersion: z.number().int().min(1),
  appVersion: z.string().max(40).optional(),
  schemaVersion: z.number().int().min(1),
  bundleVersions: z.record(z.string(), z.number()).optional(),
  exportedAt: z.iso.datetime(),
  deviceId: z.string().optional(),
  data: z.record(z.string(), z.array(z.unknown())),
});
export type BackupEnvelope = z.infer<typeof backupEnvelopeSchema>;

/** Was die Prüfung je Dokumentart braucht (aus dem `DocDef` des Moduls). */
export interface DocKind {
  readonly type: string;
  /** Name der Tabelle in der Datenbank. */
  readonly table: string;
  readonly schemaVersion: number;
  readonly schema: z.ZodType;
}

/** Gründe, eine Datei abzulehnen; die Datenbank bleibt dann unverändert. */
export type RejectReason = 'notJson' | 'tooLarge' | 'foreign' | 'damaged' | 'newer' | 'invalid';

export interface Rejection {
  readonly reason: RejectReason;
  /** Dokumentart beim Grund `invalid` (ohne Nutzdaten). */
  readonly type?: string;
}

/** Geprüfte und auf den aktuellen Stand gebrachte Sicherung. */
export interface CheckedBackup {
  readonly exportedAt: string;
  readonly appVersion: string | null;
  /** Dokumente je Tabelle, inklusive Löschmarken. */
  readonly tables: ReadonlyMap<string, readonly Record<string, unknown>[]>;
  /** Dokumente je Art, für die Zusammenfassung. */
  readonly byType: ReadonlyMap<string, readonly Record<string, unknown>[]>;
}

export type CheckResult =
  | { readonly ok: true; readonly backup: CheckedBackup }
  | { readonly ok: false; readonly rejection: Rejection };

export interface BackupSummary {
  readonly exportedAt: string;
  readonly appVersion: string | null;
  /** Frühester und spätester Tag mit Einträgen; `null` ohne Einträge. */
  readonly from: string | null;
  readonly to: string | null;
  readonly trainings: number;
  readonly foodEntries: number;
  readonly tasks: number;
}
