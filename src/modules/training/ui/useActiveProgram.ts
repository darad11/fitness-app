import { useEffect, useMemo, useState } from 'react';
import { loadCoreExercises, type Exercise } from '@/modules/exercises';
import { logError, useDb } from '@/shared/db';
import { programProgress, type ProgramProgress } from '../calc/programProgress';
import { loadSampleTemplates } from '../data/sampleTemplates';
import { useCompletedSessions } from '../data/useSession';
import { useTrainingState } from '../data/useTrainingState';
import type { SampleTemplate } from '../model/program';
import type { TrainingStateData } from '../model/trainingState';

export interface ActiveProgram {
  template: SampleTemplate;
  exercises: readonly Exercise[];
  progress: ProgramProgress;
  state: TrainingStateData;
}

interface Loaded {
  programId: string;
  template?: SampleTemplate;
  exercises: readonly Exercise[];
}

/**
 * Aktives Programm mit Fortschritt: `undefined` beim Laden, `null` ohne aktives Programm oder
 * wenn es das Programm in dieser Version nicht (mehr) gibt.
 */
export function useActiveProgram(): ActiveProgram | null | undefined {
  const { db } = useDb();
  const state = useTrainingState();
  const sessions = useCompletedSessions();
  const programId = state?.activeProgramId;
  const [loaded, setLoaded] = useState<Loaded>();

  useEffect(() => {
    if (!programId) return;
    let cancelled = false;
    Promise.all([loadSampleTemplates(), loadCoreExercises()]).then(
      ([templates, exercises]) => {
        if (cancelled) return;
        setLoaded({ programId, template: templates.find((t) => t.id === programId), exercises });
      },
      (error: unknown) => {
        if (cancelled) return;
        void logError(db, { area: 'training', error, route: window.location.pathname });
        setLoaded({ programId, exercises: [] });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [db, programId]);

  const current = loaded && loaded.programId === programId ? loaded : undefined;
  const template = current?.template;
  const progress = useMemo(
    () =>
      template && sessions ? programProgress(template, sessions, state?.activeSince) : undefined,
    [template, sessions, state?.activeSince],
  );

  if (state === undefined || sessions === undefined) return undefined;
  if (!programId) return null;
  if (!current) return undefined;
  if (!template || !progress) return null;
  return { template, exercises: current.exercises, progress, state };
}

/** Lädt eine gebündelte Vorlage über ihren Schlüssel; `undefined` beim Laden, `null`, wenn es sie nicht gibt. */
export function useSampleTemplate(key: string | undefined): SampleTemplate | null | undefined {
  const [result, setResult] = useState<{ key: string; template: SampleTemplate | null }>();
  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    loadSampleTemplates().then(
      (templates) => {
        if (!cancelled) setResult({ key, template: templates.find((t) => t.key === key) ?? null });
      },
      () => {
        if (!cancelled) setResult({ key, template: null });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [key]);
  if (!key) return null;
  return result?.key === key ? result.template : undefined;
}
