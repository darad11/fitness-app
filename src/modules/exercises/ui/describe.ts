import { t } from '@/shared/i18n/de';
import type { SelectOption } from '@/shared/ui';
import { EQUIPMENT, MUSCLES, type Equipment, type Exercise, type Muscle } from '../model/exercise';

/**
 * Filteroptionen und Kurzbeschreibung einer Übung. Eigene Datei ohne Seitenimporte, damit die
 * Modulschnittstelle nicht die Seite „Übungen“ in die Startansicht zieht (D-307).
 */
export const MUSCLE_OPTIONS: readonly SelectOption<Muscle | ''>[] = [
  { value: '', label: t.exercises.all },
  ...MUSCLES.map((muscle) => ({ value: muscle, label: t.exercises.muscles[muscle] })),
];
export const EQUIPMENT_OPTIONS: readonly SelectOption<Equipment | ''>[] = [
  { value: '', label: t.exercises.all },
  ...EQUIPMENT.map((item) => ({ value: item, label: t.exercises.equipment[item] })),
];

export function describeExercise(exercise: Exercise): string {
  const muscles = exercise.primaryMuscles.map((m) => t.exercises.muscles[m]).join(', ');
  const equipment = exercise.equipment.map((e) => t.exercises.equipment[e]).join(', ');
  const parts = [muscles, equipment];
  if (exercise.isUnilateral) parts.push(t.exercises.unilateral);
  return parts.join(' · ');
}
