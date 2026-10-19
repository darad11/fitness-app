import { z } from 'zod';

/** Angemeldeter Zugang (lokal in `meta`, nicht synchronisiert). */
export const authSessionSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  /** Ablauf des Zugriffstokens in ms seit 1970. */
  expiresAt: z.number(),
  userId: z.uuid(),
  email: z.string(),
});
export type AuthSession = z.infer<typeof authSessionSchema>;

/** Zeile der Servertabelle `sync_documents` beim Abholen. */
export const remoteRowSchema = z.object({
  doc_id: z.uuid(),
  doc_table: z.string(),
  doc_type: z.string(),
  hlc: z.string(),
  deleted: z.boolean(),
  payload: z.record(z.string(), z.unknown()),
  rev: z.number(),
});
export type RemoteRow = z.infer<typeof remoteRowSchema>;

/** Dokument beim Senden an `push_documents`. */
export interface PushDoc {
  doc_id: string;
  doc_table: string;
  doc_type: string;
  hlc: string;
  deleted: boolean;
  schema_version: number;
  payload: Record<string, unknown>;
  device_id: string;
}

export const pushResultSchema = z.array(
  z.object({
    doc_id: z.uuid(),
    status: z.enum(['accepted', 'stale']),
    rev: z.number().nullable(),
  }),
);
export type PushResult = z.infer<typeof pushResultSchema>;

export const syncStatusSchema = z.object({
  lastSyncAt: z.string().optional(),
  lastError: z.string().optional(),
  pulled: z.number().optional(),
  pushed: z.number().optional(),
  conflicts: z.number().optional(),
});
export type SyncStatus = z.infer<typeof syncStatusSchema>;

export interface SyncResult {
  pulled: number;
  pushed: number;
  conflicts: number;
}
