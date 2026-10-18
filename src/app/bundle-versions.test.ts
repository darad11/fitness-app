import { describe, expect, it } from 'vitest';
import coreExercises from '@/modules/exercises/data/core-exercises.v1.json';
import sampleTemplates from '@/modules/training/data/sample-templates.v1.json';
import { BUNDLE_VERSIONS } from '@/shared/db';

/** Der Export nennt die Versionen der gebündelten Stammdaten (data-model.md Abschnitt 11). */
describe('Versionen der gebündelten Stammdaten im Export', () => {
  it('stimmen mit den Datendateien überein', () => {
    expect(BUNDLE_VERSIONS).toEqual({
      coreExercises: coreExercises.version,
      sampleTemplates: sampleTemplates.version,
    });
  });
});
