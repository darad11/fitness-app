// Öffentliche Schnittstelle des Moduls „body" (Körpergewicht).
import type { DocDef, RootFields } from '@/shared/db';
export { bodyRoutes } from './routes';
export { useBodyWeights } from './data/useBodyWeights';
export { addBodyWeight } from './service/bodyWeightService';
export { listBodyWeights } from './data/bodyWeightRepository';
export { Sparkline } from './ui/Sparkline';
export { WeightCurve } from './ui/WeightCurve';
export {
  changeInPeriod,
  inPeriod,
  latestBefore,
  recentValues,
  type WeightEntry,
} from './calc/bodyWeight';
export type { BodyWeight } from './model/bodyWeight';

/**
 * Dokumentarten für das Wiederherstellen aus dem Export (D-345): Körpergewicht. Erst bei Bedarf
 * geladen, damit die Startansicht nicht wächst.
 */
export async function bodyDocDefs(): Promise<readonly DocDef<RootFields>[]> {
  const m0 = await import('./data/bodyWeightRepository');
  return [m0.bodyWeightDef];
}
