import { insertDoc, restoreDoc, softDeleteDoc, updateDoc, type DbRuntime } from '@/shared/db';
import { dayKey, localTimeZone } from '@/shared/lib/time';
import { bodyWeightDef } from '../data/bodyWeightRepository';
import { BODY_WEIGHT_LIMITS, MAX_FUTURE_MS, type BodyWeight } from '../model/bodyWeight';

/** Zeitpunkt mehr als einen Tag in der Zukunft (AK-BW-01). */
export class FutureDateError extends Error {
  override name = 'FutureDateError';
}

/** Gewicht außerhalb von 20 bis 400 kg oder nicht auf eine Nachkommastelle (AK-BW-01). */
export class InvalidWeightError extends Error {
  override name = 'InvalidWeightError';
}

export interface BodyWeightInput {
  weightKg: number;
  measuredAt: Date;
  note?: string;
}

export interface Clock {
  now?: () => Date;
}

/** Rundet auf eine Nachkommastelle und prüft die Grenzen. */
export function normalizeWeight(value: number): number {
  const rounded = Math.round(value * 10) / 10;
  if (
    !Number.isFinite(rounded) ||
    rounded < BODY_WEIGHT_LIMITS.min ||
    rounded > BODY_WEIGHT_LIMITS.max
  ) {
    throw new InvalidWeightError('Gewicht außerhalb des Bereichs');
  }
  return rounded;
}

function checkDate(measuredAt: Date, now: Date): void {
  if (Number.isNaN(measuredAt.getTime())) throw new FutureDateError('Ungültiger Zeitpunkt');
  if (measuredAt.getTime() > now.getTime() + MAX_FUTURE_MS) {
    throw new FutureDateError('Zeitpunkt zu weit in der Zukunft');
  }
}

function fields(input: BodyWeightInput, tz: string) {
  const note = input.note?.trim();
  return {
    measuredAt: input.measuredAt.toISOString(),
    dayKey: dayKey(input.measuredAt, tz),
    tz,
    weightKg: normalizeWeight(input.weightKg),
    ...(note ? { note } : {}),
  };
}

export async function addBodyWeight(
  rt: DbRuntime,
  input: BodyWeightInput,
  clock: Clock = {},
): Promise<BodyWeight> {
  const now = (clock.now ?? (() => new Date()))();
  checkDate(input.measuredAt, now);
  return insertDoc(rt, bodyWeightDef, () => ({
    ...fields(input, localTimeZone()),
    source: 'manual',
  }));
}

export async function updateBodyWeight(
  rt: DbRuntime,
  id: string,
  input: BodyWeightInput,
  clock: Clock = {},
): Promise<BodyWeight> {
  const now = (clock.now ?? (() => new Date()))();
  checkDate(input.measuredAt, now);
  return updateDoc(rt, bodyWeightDef, id, (current) => {
    const { note: _note, ...rest } = current;
    return { ...rest, ...fields(input, current.tz) };
  });
}

/** Weich löschen; „Rückgängig“ ist 10 s lang möglich (AK-BW-04). */
export async function deleteBodyWeight(rt: DbRuntime, id: string): Promise<void> {
  await softDeleteDoc(rt, bodyWeightDef, id, 'active');
}

export function restoreBodyWeight(rt: DbRuntime, id: string): Promise<BodyWeight> {
  return restoreDoc(rt, bodyWeightDef, id);
}
