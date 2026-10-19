import { t } from '@/shared/i18n/de';
import type { PlanTree } from '../../model/program';

/** Z. B. „2 Wochen · 6 Trainingstage". */
export function describeOwn(program: PlanTree): string {
  const days = program.weeks.reduce((sum, week) => sum + week.days.length, 0);
  return [t.programs.weekCount(program.weeks.length), t.programs.dayCount(days)].join(' · ');
}
