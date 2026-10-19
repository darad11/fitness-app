import type {
  Day,
  OwnProgram,
  PlannedExercise,
  PlannedSet,
  ProgramDoc,
  StoredDay,
  StoredExercise,
  StoredSet,
  StoredWeek,
  Week,
} from '../model/program';

/**
 * Baumfunktionen für eigene Programme (D-257): Anzeigeform aus dem gespeicherten Dokument,
 * Zusammenführen einer geänderten Anzeigeform mit Änderungsstempeln je Element und Kopieren
 * mit neuen IDs. Ohne React und Dexie.
 */

interface Child {
  id: string;
  position: number;
  deletedAt: string | null;
}

function live<T extends Child>(items: readonly T[]): T[] {
  return items.filter((item) => item.deletedAt === null).sort((a, b) => a.position - b.position);
}

/** Entfernt Sync-Felder; Positionen werden fortlaufend ab 0 neu gezählt. */
function strip<T extends Child & { hlc: string; deletedFrom?: string }>(
  item: T,
  position: number,
): Omit<T, 'hlc' | 'deletedAt' | 'deletedFrom'> {
  const { hlc: _hlc, deletedAt: _deletedAt, deletedFrom: _deletedFrom, ...rest } = item;
  return { ...rest, position };
}

function setView(set: StoredSet, position: number): PlannedSet {
  return strip(set, position);
}

function exerciseView(exercise: StoredExercise, position: number): PlannedExercise {
  return { ...strip(exercise, position), sets: live(exercise.sets).map(setView) };
}

function dayView(day: StoredDay, position: number): Day {
  const { weekdayHint, ...rest } = strip(day, position);
  return {
    ...rest,
    ...(weekdayHint !== undefined ? { weekdayHint: weekdayHint as Day['weekdayHint'] } : {}),
    exercises: live(day.exercises).map(exerciseView),
  };
}

function weekView(week: StoredWeek, position: number): Week {
  return { ...strip(week, position), days: live(week.days).map(dayView) };
}

/** Anzeigeform eines gespeicherten Programms: ohne Löschmarkierungen, nach Position sortiert. */
export function toOwnProgram(doc: ProgramDoc): OwnProgram {
  return {
    id: doc.id,
    kind: doc.kind,
    origin: doc.origin,
    name: doc.name,
    ...(doc.description ? { description: doc.description } : {}),
    ...(doc.sampleKey ? { sampleKey: doc.sampleKey } : {}),
    ...(doc.level ? { level: doc.level } : {}),
    ...(doc.location ? { location: doc.location } : {}),
    ...(doc.archivedAt ? { archivedAt: doc.archivedAt } : {}),
    repeat: doc.repeat,
    createdAt: doc.createdAt,
    weeks: live(doc.weeks).map(weekView),
  };
}

// ---------------------------------------------------------------------------------------------
// Zusammenführen mit Änderungsstempeln

interface StoredChild {
  id: string;
  hlc: string;
  deletedAt: string | null;
}

/** Eigene Felder ohne Kinder und Sync-Felder, für den Vergleich „geändert oder nicht". */
function ownFields(item: object, childKey: string | undefined): string {
  const copy: Record<string, unknown> = { ...item };
  for (const key of ['hlc', 'deletedAt', 'deletedFrom', ...(childKey ? [childKey] : [])]) {
    Reflect.deleteProperty(copy, key);
  }
  return JSON.stringify(
    Object.keys(copy)
      .filter((key) => copy[key] !== undefined)
      .sort()
      .map((key) => [key, copy[key]]),
  );
}

/**
 * Führt eine Ebene zusammen: Geänderte und neue Elemente erhalten den Stempel `hlc`, fehlende
 * werden mit Löschmarkierung behalten (Tombstone), unveränderte bleiben unberührt.
 */
function mergeLevel<V extends { id: string; position: number }, S extends StoredChild>(
  stored: readonly S[],
  next: readonly V[],
  hlc: string,
  childKey: string | undefined,
  mergeChildren: (storedItem: S | undefined, nextItem: V) => Partial<S>,
): S[] {
  const byId = new Map(stored.map((item) => [item.id, item]));
  const seen = new Set<string>();
  const result: S[] = [];
  next.forEach((item, position) => {
    seen.add(item.id);
    const previous = byId.get(item.id);
    const base = { ...item, position } as unknown as S;
    const children = mergeChildren(previous?.deletedAt === null ? previous : undefined, item);
    if (previous?.deletedAt === null) {
      const changed = ownFields(previous, childKey) !== ownFields(base, childKey);
      result.push({
        ...base,
        ...children,
        hlc: changed ? hlc : previous.hlc,
        deletedAt: null,
      });
    } else {
      result.push({ ...base, ...children, hlc, deletedAt: null });
    }
  });
  for (const item of stored) {
    if (seen.has(item.id)) continue;
    result.push(item.deletedAt === null ? { ...item, deletedAt: hlc, hlc } : item);
  }
  return result;
}

const noChildren = () => ({});

/** Gespeicherte Wochen nach einer Änderung der Anzeigeform (D-257). */
export function mergeWeeks(stored: readonly StoredWeek[], next: readonly Week[], hlc: string) {
  return mergeLevel<Week, StoredWeek>(stored, next, hlc, 'days', (prevWeek, week) => ({
    days: mergeLevel<Day, StoredDay>(
      prevWeek?.days ?? [],
      week.days,
      hlc,
      'exercises',
      (prevDay, day) => ({
        exercises: mergeLevel<PlannedExercise, StoredExercise>(
          prevDay?.exercises ?? [],
          day.exercises,
          hlc,
          'sets',
          (prevExercise, exercise) => ({
            sets: mergeLevel<PlannedSet, StoredSet>(
              prevExercise?.sets ?? [],
              exercise.sets,
              hlc,
              undefined,
              noChildren,
            ),
          }),
        ),
      }),
    ),
  }));
}

// ---------------------------------------------------------------------------------------------
// Kopieren

/** Kopie mit neuen IDs auf allen Ebenen; Drop-Sätze zeigen auf die neue ID ihres Arbeitssatzes. */
export function copyWeeks(weeks: readonly Week[], newId: () => string): Week[] {
  return weeks.map((week) => copyWeek(week, newId));
}

export function copyWeek(week: Week, newId: () => string): Week {
  return { ...week, id: newId(), days: week.days.map((day) => copyDay(day, newId)) };
}

export function copyDay(day: Day, newId: () => string): Day {
  return {
    ...day,
    id: newId(),
    exercises: day.exercises.map((exercise) => {
      const ids = new Map(exercise.sets.map((set) => [set.id, newId()]));
      return {
        ...exercise,
        id: newId(),
        sets: exercise.sets.map((set) => ({
          ...set,
          id: ids.get(set.id) ?? newId(),
          ...(set.parentSetId ? { parentSetId: ids.get(set.parentSetId) ?? set.parentSetId } : {}),
        })),
      };
    }),
  };
}
