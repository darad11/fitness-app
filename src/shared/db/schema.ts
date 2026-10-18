/**
 * Dexie-Schema v1 für den MVP (data-model.md Abschnitt 6).
 *
 * Die Tabellen speichern Dokumente generisch; die genauen Typen und Zod-Schemas liegen in den
 * Fachmodulen und werden beim Lesen geprüft. Neue Indizes oder Tabellen erhöhen die Version
 * (additiv, vorher Snapshot, Migrationstest).
 */
import Dexie, { type Table } from 'dexie';
import type { RootFields } from './documents';

export const DB_NAME = 'fitness';
export const DB_VERSION = 1;

export const STORES_V1 = {
  sessions: 'id, status, dayKey, startedAt, endedAt, *exerciseIds, [program.programId+endedAt]',
  programs: 'id, kind, archivedAt',
  exercises: 'id, nameNorm, *primaryMuscles, *equipment',
  exercisePrefs: 'id, exerciseId',
  bodyWeights: 'id, measuredAt, dayKey',
  goals: 'id, kind, effectiveFrom',
  singletons: 'id',
  exerciseHistory: 'id, [exerciseId+completedAt], sessionId',
  sessionUi: 'sessionId',
  meta: 'key',
  errorLog: '++seq, at',
} as const;

/** Tabellen mit synchronisierbaren Dokumenten (Aggregatwurzeln). */
export const DOCUMENT_TABLES = [
  'sessions',
  'programs',
  'exercises',
  'exercisePrefs',
  'bodyWeights',
  'goals',
  'singletons',
] as const;
export type DocumentTableName = (typeof DOCUMENT_TABLES)[number];

export type StoredDoc = RootFields & Record<string, unknown>;

export interface MetaEntry {
  key: string;
  value: unknown;
}

export interface ErrorLogEntry {
  seq?: number;
  at: string;
  level: 'error' | 'warn';
  area: string;
  /** Bereinigte Meldung ohne Nutzdaten */
  message: string;
  stackHash?: string;
  route?: string;
  appVersion: string;
}

export interface ExerciseHistoryRow {
  id: string;
  exerciseId: string;
  sessionId: string;
  completedAt: string;
  [field: string]: unknown;
}

export interface SessionUiRow {
  sessionId: string;
  [field: string]: unknown;
}

export class AppDb extends Dexie {
  declare sessions: Table<StoredDoc, string>;
  declare programs: Table<StoredDoc, string>;
  declare exercises: Table<StoredDoc, string>;
  declare exercisePrefs: Table<StoredDoc, string>;
  declare bodyWeights: Table<StoredDoc, string>;
  declare goals: Table<StoredDoc, string>;
  declare singletons: Table<StoredDoc, string>;
  declare exerciseHistory: Table<ExerciseHistoryRow, string>;
  declare sessionUi: Table<SessionUiRow, string>;
  declare meta: Table<MetaEntry, string>;
  declare errorLog: Table<ErrorLogEntry, number>;

  constructor(name: string = DB_NAME) {
    super(name);
    this.version(DB_VERSION).stores(STORES_V1);
  }
}
