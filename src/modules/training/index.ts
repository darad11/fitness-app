// Öffentliche Schnittstelle des Moduls „training".
export { trainingRoutes } from './routes';
export { SessionBanner } from './ui/SessionBanner';
export { ActiveProgramCard, plannedEyebrow } from './ui/ActiveProgramCard';
export { useActiveProgram } from './ui/useActiveProgram';
export { useActiveSession, useCompletedSessions, useHistoryRows } from './data/useSession';
export { useStartSession } from './ui/useStartSession';
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
// Anwendungsfälle und Helfer, die andere Module (und deren Tests) brauchen.
export {
  completeSet,
  finishSession,
  planFromTemplateDay,
  startSession,
} from './service/sessionService';
export { loadSampleTemplate } from './data/sampleTemplates';
export { liveExercises, liveSets } from './calc/session';
export { refreshSessionProjection } from './data/sessionRepository';
