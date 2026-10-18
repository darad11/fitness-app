import { loadCoreExercises } from '@/modules/exercises';
import { expandSampleTemplate } from '../calc/sampleTemplates';
import { sampleTemplateSourceSchema, type SampleTemplate } from '../model/program';

/** Prüft die Quelle und baut die Vorlagen; wirft bei ungültigen Daten oder unbekannten Übungen. */
export function parseSampleTemplates(
  input: unknown,
  exercises: readonly { key: string; id: string; name: string }[],
): SampleTemplate[] {
  const byKey = new Map(exercises.map((exercise) => [exercise.key, exercise]));
  return sampleTemplateSourceSchema
    .parse(input)
    .templates.map((source) => expandSampleTemplate(source, (key) => byKey.get(key)));
}

let pending: Promise<readonly SampleTemplate[]> | undefined;

/**
 * Beispielvorlagen (gebündelt, schreibgeschützt, D-230). Wie die Übungen eine eigene Datei, die
 * erst bei Bedarf geladen und vom Service Worker vorab gespeichert wird (D-242).
 */
export function loadSampleTemplates(): Promise<readonly SampleTemplate[]> {
  // Programme A, B, C (programs.v1.json, erzeugt von tools/programs_build.py) stehen vor den
  // Beispielvorlagen; beide Dateien haben dasselbe Format.
  pending ??= Promise.all([
    import('./programs.v1.json'),
    import('./sample-templates.v1.json'),
    loadCoreExercises(),
  ]).then(
    ([programs, samples, exercises]) =>
      Object.freeze([
        ...parseSampleTemplates(programs.default, exercises),
        ...parseSampleTemplates(samples.default, exercises),
      ]),
    (error: unknown) => {
      pending = undefined;
      throw error;
    },
  );
  return pending;
}

export async function loadSampleTemplate(key: string): Promise<SampleTemplate | undefined> {
  return (await loadSampleTemplates()).find((template) => template.key === key);
}
