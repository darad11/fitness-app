import type { PlannedExercise, PlanTree } from '../model/program';

/**
 * Angezeigter Name einer geplanten Übung: mit „Übungsnamen auf Englisch“ der englische Name aus dem
 * Programm, wo es einen gibt, sonst der deutsche aus der Bibliothek (D-506).
 */
export function plannedName(
  plan: Pick<PlanTree, 'englishNames'>,
  exercise: Pick<PlannedExercise, 'nameSnapshot' | 'originalName'>,
): string {
  return plan.englishNames && exercise.originalName ? exercise.originalName : exercise.nameSnapshot;
}

/** Hat das Programm Übungen mit englischem Namen? Nur dann wirkt die Einstellung (D-506). */
export function hasEnglishNames(plan: Pick<PlanTree, 'weeks'>): boolean {
  return plan.weeks.some((week) =>
    week.days.some((day) => day.exercises.some((exercise) => exercise.originalName)),
  );
}
