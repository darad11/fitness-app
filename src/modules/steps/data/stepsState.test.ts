import { expect, it } from 'vitest';
import { isPrivateMetaKey } from '@/shared/db';
import { STEPS_KEYS } from './stepsState';

it('Zugang und Zwischenspeicher des Dashboards gehören nicht in Snapshots (D-02)', () => {
  expect(Object.values(STEPS_KEYS).every(isPrivateMetaKey)).toBe(true);
});
