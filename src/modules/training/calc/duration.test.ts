import { describe, expect, it } from 'vitest';
import { loadCoreExercises } from '@/modules/exercises';
import { loadSampleTemplate } from '../data/sampleTemplates';
import type { Day, PlannedSet } from '../model/program';
import { distinctDays } from './sampleTemplates';
import { estimateDay, roundMinutes } from './duration';

function set(position: number, fields: Partial<PlannedSet> = {}): PlannedSet {
  return { id: `s${String(position)}`, position, type: 'working', ...fields };
}

describe('Geschätzte Dauer eines Trainingstags', () => {
  it('rechnet Aufbau, Arbeit, Pausen ohne die letzte und Übungswechsel zusammen', () => {
    const day: Pick<Day, 'exercises'> = {
      exercises: [
        {
          id: 'e0',
          position: 0,
          exerciseId: 'x',
          nameSnapshot: 'A',
          restSec: 120,
          sets: [set(0, { repsMin: 8, repsMax: 10 }), set(1, { repsMin: 8, repsMax: 10 })],
        },
        {
          id: 'e1',
          position: 1,
          exerciseId: 'y',
          nameSnapshot: 'B',
          sets: [set(0, { durationMinSec: 30, durationMaxSec: 45, restSec: 30 }), set(1)],
        },
      ],
    };
    // A: 2 × (15 + 30) + 120 = 210; Wechsel 60; B: (15 + 45) + 30 + (15 + 30) = 135.
    expect(estimateDay(day, 90)).toEqual({ exercises: 2, sets: 4, seconds: 405 });
  });

  it('nutzt die Standardpause, wenn Satz und Übung keine haben; Drop-Sätze ohne Pause', () => {
    const day: Pick<Day, 'exercises'> = {
      exercises: [
        {
          id: 'e0',
          position: 0,
          exerciseId: 'x',
          nameSnapshot: 'A',
          sets: [set(0), set(1, { type: 'drop', parentSetId: 's0', restSec: 0 }), set(2)],
        },
      ],
    };
    // (15 + 30) + 90 + (15 + 30) + 0 + (15 + 30) = 225
    expect(estimateDay(day, 90).seconds).toBe(225);
    expect(estimateDay({ exercises: [] }, 90)).toEqual({ exercises: 0, sets: 0, seconds: 0 });
  });

  it('rundet auf 5 Minuten, mindestens 5', () => {
    expect(roundMinutes(0)).toBe(5);
    expect(roundMinutes(405)).toBe(5);
    expect(roundMinutes(2700)).toBe(45);
    expect(roundMinutes(2850)).toBe(50);
  });

  it('schätzt Tag A der Beispielvorlage Ganzkörper A/B plausibel', async () => {
    const exercises = await loadCoreExercises();
    const template = (await loadSampleTemplate('full_body_ab'))!;
    const dayA = distinctDays(template)[0]!;
    const estimate = estimateDay(dayA, 90);
    expect(estimate).toMatchObject({ exercises: 5, sets: 17 });
    expect(roundMinutes(estimate.seconds)).toBeGreaterThanOrEqual(40);
    expect(roundMinutes(estimate.seconds)).toBeLessThanOrEqual(60);
    expect(exercises.length).toBeGreaterThan(0);
  });
});
