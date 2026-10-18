import { stableId } from '@/shared/lib/uuid';
import { coreLibrarySchema, type Exercise } from '../model/exercise';

/** ID einer Basisübung aus ihrem dauerhaften Schlüssel (D-207, D-240). */
export function coreExerciseId(key: string): string {
  return stableId(`core-exercise:${key}`);
}

/** Prüft die gebündelten Daten und ergänzt IDs. Wirft bei ungültigen Daten. */
export function parseCoreLibrary(input: unknown): Exercise[] {
  return coreLibrarySchema.parse(input).exercises.map((exercise) => ({
    ...exercise,
    id: coreExerciseId(exercise.key),
    source: 'core' as const,
  }));
}

let pending: Promise<readonly Exercise[]> | undefined;

/**
 * Basisbibliothek (gebündelt, nicht in der Datenbank; D-230). Die Daten liegen in einer eigenen
 * Datei, die erst bei Bedarf geladen wird und damit den Start nicht verlangsamt; der Service
 * Worker speichert sie vorab, sie ist also auch offline verfügbar (AK-EXL-01).
 */
export function loadCoreExercises(): Promise<readonly Exercise[]> {
  pending ??= import('./core-exercises.v1.json').then(
    (module) => Object.freeze(parseCoreLibrary(module.default)),
    (error: unknown) => {
      pending = undefined;
      throw error;
    },
  );
  return pending;
}
