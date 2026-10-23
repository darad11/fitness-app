/**
 * Zusammenfassung einer geprüften Sicherung vor dem Wiederherstellen (D-345): Stand der Sicherung,
 * Zeitraum der Einträge, Zahl der Trainings, Ernährungseinträge und Aufgaben. Gezählt wird nur,
 * was nicht gelöscht ist.
 */
import type { BackupSummary, CheckedBackup } from '../model/backup';

type Doc = Record<string, unknown>;

/** Dokumentarten mit einem Tag (`dayKey`) für den Zeitraum. */
const DATED = ['session', 'food_log_entry', 'body_weight', 'habit_log', 'water_entry'] as const;

function live(backup: CheckedBackup, type: string): Doc[] {
  return (backup.byType.get(type) ?? []).filter((doc) => doc.deletedAt === null);
}

export function summarizeBackup(backup: CheckedBackup): BackupSummary {
  let from: string | null = null;
  let to: string | null = null;
  for (const type of DATED) {
    for (const doc of live(backup, type)) {
      const day = doc.dayKey;
      if (typeof day !== 'string') continue;
      if (from === null || day < from) from = day;
      if (to === null || day > to) to = day;
    }
  }
  return {
    exportedAt: backup.exportedAt,
    appVersion: backup.appVersion,
    from,
    to,
    trainings: live(backup, 'session').filter((doc) => doc.status === 'completed').length,
    foodEntries: live(backup, 'food_log_entry').length,
    tasks: live(backup, 'habit').length,
  };
}
