/**
 * Prüfung einer Sicherung vor dem Wiederherstellen (D-345, AK-DAT-05): Format, Version, Aufbau und
 * Plausibilität, danach jedes Dokument mit dem Schema seiner Art. Alles oder nichts: Schon ein
 * ungültiges Dokument lehnt die ganze Datei ab, ohne dass sich etwas ändert.
 */
import { rootFieldsSchema } from '@/shared/db/documents';
import {
  backupEnvelopeSchema,
  type CheckResult,
  type DocKind,
  type Rejection,
} from '../model/backup';
import { migrateDoc, migrateEnvelope } from './migrate';

export interface CheckContext {
  /** Kennung und Version des Formats, die diese App schreibt. */
  readonly format: string;
  readonly formatVersion: number;
  /** Version der Datenbank dieser App; eine Sicherung einer neueren gilt als „neuer“. */
  readonly dbVersion: number;
  readonly kinds: ReadonlyMap<string, DocKind>;
  readonly now: Date;
  /** Für Tests; sonst `MAX_DOCS`. */
  readonly maxDocs?: number;
}

/** Eine Sicherung aus der Zukunft ist nicht plausibel; ein Tag Spielraum für falsche Uhren. */
const FUTURE_SLACK_MS = 24 * 60 * 60 * 1000;
/** Mehr Dokumente sind für ein Gerät nicht plausibel (auch nicht nach Jahren). */
export const MAX_DOCS = 500_000;

function push<T>(map: Map<string, T[]>, key: string, value: T) {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

function reject(reason: Rejection['reason'], type?: string): CheckResult {
  return { ok: false, rejection: type ? { reason, type } : { reason } };
}

export function checkBackup(raw: unknown, ctx: CheckContext): CheckResult {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return reject('foreign');
  if ((raw as { format?: unknown }).format !== ctx.format) return reject('foreign');
  const envelope = backupEnvelopeSchema.safeParse(raw);
  if (!envelope.success) return reject('damaged');
  if (envelope.data.formatVersion > ctx.formatVersion) return reject('newer');
  if (envelope.data.schemaVersion > ctx.dbVersion) return reject('newer');
  if (Date.parse(envelope.data.exportedAt) > ctx.now.getTime() + FUTURE_SLACK_MS) {
    return reject('damaged');
  }
  let current;
  try {
    current = migrateEnvelope(envelope.data, ctx.formatVersion);
  } catch {
    return reject('damaged');
  }

  const tables = new Map<string, Record<string, unknown>[]>();
  const byType = new Map<string, Record<string, unknown>[]>();
  const seen = new Map<string, Set<string>>();
  let total = 0;
  for (const [type, list] of Object.entries(current.data)) {
    const kind = ctx.kinds.get(type);
    // Eine unbekannte Art stammt von einer neueren App-Version.
    if (!kind) return reject('newer');
    total += list.length;
    if (total > (ctx.maxDocs ?? MAX_DOCS)) return reject('damaged');
    const ids = seen.get(kind.table) ?? new Set<string>();
    seen.set(kind.table, ids);
    for (const item of list) {
      const root = rootFieldsSchema.safeParse(item);
      if (!root.success || root.data.type !== type) return reject('invalid', type);
      if (root.data.schemaVersion > kind.schemaVersion) return reject('newer');
      if (ids.has(root.data.id)) return reject('invalid', type);
      ids.add(root.data.id);
      let migrated: Record<string, unknown>;
      try {
        migrated = migrateDoc(type, item as Record<string, unknown>, kind.schemaVersion);
      } catch {
        return reject('invalid', type);
      }
      const parsed = kind.schema.safeParse(migrated);
      if (!parsed.success) return reject('invalid', type);
      // Wie das Basis-Repository: geprüfte Felder, unbekannte bleiben erhalten.
      const doc = { ...migrated, ...(parsed.data as Record<string, unknown>) };
      push(tables, kind.table, doc);
      push(byType, type, doc);
    }
  }
  return {
    ok: true,
    backup: {
      exportedAt: current.exportedAt,
      appVersion: current.appVersion ?? null,
      tables,
      byType,
    },
  };
}
