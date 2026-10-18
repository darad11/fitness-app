import type { SampleTemplate } from '../model/program';

/** Ein Trainingstag in der flachen Folge aller Wochen eines Programms. */
export interface ProgramDayRef {
  /** Position in der Folge, ab 0. */
  index: number;
  weekIndex: number;
  dayIndex: number;
  weekId: string;
  dayId: string;
  name: string;
  weekName: string;
}

/** Nur die Felder einer Einheit, die für den Fortschritt zählen. */
export interface ProgramSessionLike {
  status: 'in_progress' | 'completed';
  endedAt?: string;
  program?: { programId: string; weekIndex: number; dayIndex: number };
}

export interface ProgramProgress {
  /** Trainingstage je Durchlauf, z. B. 32 bei 8 Wochen à 4 Tage. */
  total: number;
  /** Erledigte Trainingstage seit der Aktivierung, über alle Durchläufe. */
  completed: number;
  /** Laufender Durchlauf, ab 1. */
  round: number;
  /** Positionen der im laufenden Durchlauf erledigten Tage. */
  doneInRound: ReadonlySet<number>;
  /** Nächster Trainingstag; fehlt, wenn das Programm ohne Wiederholung abgeschlossen ist. */
  next?: ProgramDayRef;
  finished: boolean;
}

/** Alle Trainingstage eines Programms in Reihenfolge, Woche für Woche (Reihenfolge-Modus, D-214). */
export function flattenDays(template: SampleTemplate): ProgramDayRef[] {
  const days: ProgramDayRef[] = [];
  template.weeks.forEach((week, weekIndex) => {
    week.days.forEach((day, dayIndex) => {
      days.push({
        index: days.length,
        weekIndex,
        dayIndex,
        weekId: week.id,
        dayId: day.id,
        name: day.name,
        weekName: week.name,
      });
    });
  });
  return days;
}

/** Nummer eines Tages in der Folge (ab 1) oder `undefined`, wenn es ihn im Programm nicht gibt. */
export function dayNumber(
  template: SampleTemplate,
  weekIndex: number,
  dayIndex: number,
): number | undefined {
  const day = flattenDays(template).find(
    (d) => d.weekIndex === weekIndex && d.dayIndex === dayIndex,
  );
  return day ? day.index + 1 : undefined;
}

/**
 * Fortschritt eines aktiven Programms aus den abgeschlossenen Einheiten (AK-PRG-08, D-249).
 * Gezählt werden Einheiten dieses Programms seit `activeSince`. Der nächste Tag folgt auf den
 * zuletzt abgeschlossenen; ein frei gewählter früherer Tag beginnt einen neuen Durchlauf.
 * Nach dem letzten Tag beginnt ein Programm mit `repeat` von vorn, sonst ist es abgeschlossen.
 */
export function programProgress(
  template: SampleTemplate,
  sessions: readonly ProgramSessionLike[],
  activeSince?: string,
): ProgramProgress {
  const days = flattenDays(template);
  const total = days.length;
  const byPosition = new Map(days.map((d) => [`${String(d.weekIndex)}:${String(d.dayIndex)}`, d]));
  const indices = sessions
    .filter(
      (
        s,
      ): s is ProgramSessionLike & {
        endedAt: string;
        program: NonNullable<ProgramSessionLike['program']>;
      } =>
        s.status === 'completed' &&
        s.endedAt !== undefined &&
        s.program?.programId === template.id &&
        (activeSince === undefined || s.endedAt >= activeSince),
    )
    .sort((a, b) => a.endedAt.localeCompare(b.endedAt))
    .flatMap((s) => {
      const day = byPosition.get(`${String(s.program.weekIndex)}:${String(s.program.dayIndex)}`);
      return day ? [day.index] : [];
    });

  let round = 1;
  let doneInRound = new Set<number>();
  let last: number | undefined;
  for (const index of indices) {
    if (last !== undefined && index <= last) {
      round += 1;
      doneInRound = new Set();
    }
    doneInRound.add(index);
    last = index;
  }

  const base = { total, completed: indices.length, round, doneInRound };
  if (total === 0) return { ...base, finished: false };
  if (last === undefined) return { ...base, next: days[0], finished: false };
  if (last + 1 < total) return { ...base, next: days[last + 1], finished: false };
  if (template.repeat) return { ...base, next: days[0], finished: false };
  return { ...base, finished: true };
}
