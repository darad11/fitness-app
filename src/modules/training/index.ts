// Öffentliche Schnittstelle des Moduls „training".
import type { DocDef, RootFields } from '@/shared/db';
export { trainingRoutes } from './routes';
export { SessionBanner } from './ui/SessionBanner';
export {
  ActiveProgramCard,
  nextDayInput,
  plannedEyebrow,
  plannedRest,
} from './ui/ActiveProgramCard';
export { useActiveProgram } from './ui/useActiveProgram';
export { ReadyCard } from './ui/ReadyCard';
export { useActiveSession, useCompletedSessions, useHistoryRows } from './data/useSession';
export { LIGHT_QUERY, useStartSession } from './ui/useStartSession';
export { sessionDurationSec, sessionProgress } from './calc/session';
export { formatClock } from './calc/format';
export { summarizeSession, type SessionSummary } from './calc/history';
export { estimateCalories, type CalorieEstimate } from './calc/calories';
export { estimateOneRepMax } from './calc/session';
export { formatSetValues } from './calc/fields';
export { compareWithPrevious, type SessionComparison } from './calc/history';
export { compareBest, isNewRecord } from './calc/records';
export type { Session } from './model/session';
export type { HistoryRow } from './model/history';
// Anwendungsfälle und Helfer, die andere Module (und deren Tests) brauchen. Der Trainingsdienst
// wird erst beim Aufruf geladen, damit er nicht in der Startansicht liegt (D-307).
export { planFromTemplateDay } from './calc/plan';
export async function startSession(
  ...args: Parameters<typeof import('./service/sessionService').startSession>
) {
  return (await import('./service/sessionService')).startSession(...args);
}
export async function completeSet(
  ...args: Parameters<typeof import('./service/sessionService').completeSet>
) {
  return (await import('./service/sessionService')).completeSet(...args);
}
export async function finishSession(
  ...args: Parameters<typeof import('./service/sessionService').finishSession>
) {
  return (await import('./service/sessionService')).finishSession(...args);
}
export { loadSampleTemplate } from './data/sampleTemplates';
export { liveExercises, liveSets } from './calc/session';
export { hasActiveSession, refreshSessionProjection } from './data/sessionRepository';

/**
 * Dokumentarten für das Wiederherstellen aus dem Export (D-345): Training, Programme,
 * Trainingszustand. Erst bei Bedarf geladen, damit die Startansicht nicht wächst.
 */
export async function trainingDocDefs(): Promise<readonly DocDef<RootFields>[]> {
  const [m0, m1, m2] = await Promise.all([
    import('./data/sessionRepository'),
    import('./data/programRepository'),
    import('./data/trainingStateRepository'),
  ]);
  return [m0.sessionDef, m1.programDef, m2.trainingStateDef];
}
