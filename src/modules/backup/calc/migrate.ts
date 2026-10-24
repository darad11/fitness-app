/**
 * Ältere Sicherungen auf den aktuellen Stand bringen (D-345). Bisher gibt es nur das Format 1 und
 * Dokumente in Schemaversion 1; ältere App-Versionen hatten weniger Datenbereiche (z. B. vor
 * Schemaversion 8 kein Wasser), die dann als leer gelten. Kommt eine neue Version eines Formats
 * oder einer Dokumentart, trägt sie hier ihren Schritt von der Vorversion ein; die Prüfung wendet
 * die Schritte der Reihe nach an.
 */
import type { BackupEnvelope } from '../model/backup';

type Doc = Record<string, unknown>;
type EnvelopeSteps = Readonly<Record<number, (envelope: BackupEnvelope) => BackupEnvelope>>;
type DocSteps = Readonly<Record<string, Readonly<Record<number, (doc: Doc) => Doc>>>>;

/** Schritte je Format: `n` macht aus Format `n` das Format `n + 1`. */
export const ENVELOPE_STEPS: EnvelopeSteps = {};

/** Schritte je Dokumentart: `[art][n]` macht aus Schemaversion `n` die Version `n + 1`. */
export const DOC_STEPS: DocSteps = {};

export function migrateEnvelope(
  envelope: BackupEnvelope,
  target: number,
  steps: EnvelopeSteps = ENVELOPE_STEPS,
): BackupEnvelope {
  let current = envelope;
  for (let version = current.formatVersion; version < target; version += 1) {
    const step = steps[version];
    if (!step) throw new Error(`Kein Schritt für Format ${String(version)}`);
    current = { ...step(current), formatVersion: version + 1 };
  }
  return current;
}

export function migrateDoc(
  type: string,
  doc: Doc,
  target: number,
  steps: DocSteps = DOC_STEPS,
): Doc {
  let current = doc;
  const forType = steps[type] ?? {};
  for (let version = Number(current.schemaVersion); version < target; version += 1) {
    const step = forType[version];
    if (!step) throw new Error(`Kein Schritt für ${type} ${String(version)}`);
    current = { ...step(current), schemaVersion: version + 1 };
  }
  return current;
}
