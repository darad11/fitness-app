import { useEffect, useState } from 'react';
import { loadCoreExercises, type Exercise } from '@/modules/exercises';

/** Übungsbibliothek; `undefined` beim Laden, bei einem Fehler leer. */
export function useLibrary(): readonly Exercise[] | undefined {
  const [exercises, setExercises] = useState<readonly Exercise[]>();
  useEffect(() => {
    let active = true;
    loadCoreExercises().then(
      (list) => {
        if (active) setExercises(list);
      },
      () => {
        if (active) setExercises([]);
      },
    );
    return () => {
      active = false;
    };
  }, []);
  return exercises;
}
