// Öffentliche Schnittstelle des Moduls „body" (Körpergewicht).
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
