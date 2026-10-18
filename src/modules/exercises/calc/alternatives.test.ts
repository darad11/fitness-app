import { describe, expect, it } from 'vitest';
import { loadCoreExercises } from '../data/coreLibrary';
import { findAlternatives } from './alternatives';

const exercises = await loadCoreExercises();
const byKey = (key: string) => exercises.find((e) => e.key === key)!;

describe('Alternativen zu einer Übung (TP-12, AK-PRG-03)', () => {
  it('schlägt Übungen mit gleichem Hauptmuskel vor, die Übung selbst nie', () => {
    const bench = byKey('bench_press_barbell');
    const result = findAlternatives(exercises, bench);
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(8);
    expect(result.map((e) => e.id)).not.toContain(bench.id);
    for (const alternative of result) {
      expect(alternative.primaryMuscles.some((m) => bench.primaryMuscles.includes(m))).toBe(true);
    }
    // Gleiche Erfassungsart und gleiches Gerät stehen vorn.
    expect(result[0]!.trackingMode).toBe('weight_reps');
    expect(result.slice(0, 3).map((e) => e.key)).toContain('bench_press_dumbbell');
  });

  it('beachtet den Gerätefilter und die Obergrenze', () => {
    const squat = byKey('back_squat_barbell');
    const machines = findAlternatives(exercises, squat, { equipment: 'machine', limit: 3 });
    expect(machines.length).toBeLessThanOrEqual(3);
    for (const alternative of machines) expect(alternative.equipment).toContain('machine');
    expect(machines.map((e) => e.key)).toContain('leg_press');
  });

  it('liefert nichts, wenn kein Hauptmuskel passt', () => {
    const plank = byKey('plank');
    const result = findAlternatives(exercises, { ...plank, primaryMuscles: ['full_body'] });
    for (const alternative of result) expect(alternative.primaryMuscles).toContain('full_body');
  });
});
