/**
 * Dexie-Schema (data-model.md Abschnitt 6): v1 aus M0, v2 mit den Tabellen für Tagesaufgaben
 * (Schritt F, D-253), v3 mit den Tabellen für die Ernährung (Schritt G, D-261), v4 mit Rezepten
 * (M7, D-267), v5 mit Mahlzeit-Vorlagen (NU-11, D-268).
 *
 * Die Tabellen speichern Dokumente generisch; die genauen Typen und Zod-Schemas liegen in den
 * Fachmodulen und werden beim Lesen geprüft. Neue Indizes oder Tabellen erhöhen die Version
 * (additiv, vorher Snapshot, Migrationstest).
 */
import Dexie, { type Table } from 'dexie';
import type { RootFields } from './documents';

export const DB_NAME = 'fitness';
export const DB_VERSION = 5;

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

/** v2 (Schritt F): Tagesaufgaben und ihre Einträge je Tag; additiv zu v1. */
export const STORES_V2 = {
  ...STORES_V1,
  habits: 'id, archivedAt',
  habitLogs: 'id, habitId, dayKey',
} as const;

/** v3 (Schritt G): Lebensmittel, Protokolleinträge und Ernährungsziele; additiv zu v2. */
export const STORES_V3 = {
  ...STORES_V2,
  foods: 'id, nameNorm, barcode, archivedAt',
  foodLog: 'id, dayKey, foodId',
  nutritionTargets: 'id, effectiveFrom',
} as const;

/** v4 (M7): Rezepte; additiv zu v3. */
export const STORES_V4 = {
  ...STORES_V3,
  recipes: 'id, nameNorm, archivedAt',
} as const;

/** v5 (NU-11): Mahlzeit-Vorlagen; additiv zu v4. */
export const STORES_V5 = {
  ...STORES_V4,
  mealTemplates: 'id, archivedAt',
} as const;

export const STORES_CURRENT = STORES_V5;

/** Tabellen mit synchronisierbaren Dokumenten (Aggregatwurzeln). */
export const DOCUMENT_TABLES = [
  'sessions',
  'programs',
  'exercises',
  'exercisePrefs',
  'bodyWeights',
  'goals',
  'singletons',
  'habits',
  'habitLogs',
  'foods',
  'foodLog',
  'nutritionTargets',
  'recipes',
  'mealTemplates',
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
  declare habits: Table<StoredDoc, string>;
  declare habitLogs: Table<StoredDoc, string>;
  declare foods: Table<StoredDoc, string>;
  declare foodLog: Table<StoredDoc, string>;
  declare nutritionTargets: Table<StoredDoc, string>;
  declare recipes: Table<StoredDoc, string>;
  declare mealTemplates: Table<StoredDoc, string>;
  declare exerciseHistory: Table<ExerciseHistoryRow, string>;
  declare sessionUi: Table<SessionUiRow, string>;
  declare meta: Table<MetaEntry, string>;
  declare errorLog: Table<ErrorLogEntry, number>;

  constructor(name: string = DB_NAME) {
    super(name);
    this.version(1).stores(STORES_V1);
    this.version(2).stores(STORES_V2);
    this.version(3).stores(STORES_V3);
    this.version(4).stores(STORES_V4);
    this.version(5).stores(STORES_V5);
  }
}
