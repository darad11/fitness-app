import { useEffect, useMemo, useState } from 'react';
import { loadCoreExercises, type Exercise } from '@/modules/exercises';
import { logError, useDb } from '@/shared/db';
import { programProgress, type ProgramProgress } from '../calc/programProgress';
import { useOwnProgram } from '../data/programRepository';
import { loadSampleTemplates } from '../data/sampleTemplates';
import { useCompletedSessions } from '../data/useSession';
import { useTrainingState } from '../data/useTrainingState';
import type { OwnProgram, SampleTemplate } from '../model/program';
import type { TrainingStateData } from '../model/trainingState';

/** Gebündeltes oder eigenes Programm; eigene haben keinen `key`. */
export type AnyProgram = SampleTemplate | OwnProgram;

/** Seite eines Programms: eigene unter /training/programme, gebündelte unter /training/vorlagen. */
export function programLink(program: AnyProgram): string {
  return 'key' in program
    ? `/training/vorlagen/${program.key}`
    : `/training/programme/${program.id}`;
}

export interface ActiveProgram {
  template: AnyProgram;
  exercises: readonly Exercise[];
  progress: ProgramProgress;
  state: TrainingStateData;
}

interface Loaded {
  programId: string;
  bundled?: SampleTemplate;
  exercises: readonly Exercise[];
}

/**
 * Programm nach ID (eigenes zuerst, sonst gebündeltes) mit der Übungsbibliothek: `undefined` beim
 * Laden, `null`, wenn es das Programm nicht (mehr) gibt.
 */
export function useProgramById(
  programId: string | undefined,
): { program: AnyProgram; exercises: readonly Exercise[] } | null | undefined {
  const { db } = useDb();
  const own = useOwnProgram(programId);
  const [loaded, setLoaded] = useState<Loaded>();

  useEffect(() => {
    if (!programId) return;
    let cancelled = false;
    Promise.all([loadSampleTemplates(), loadCoreExercises()]).then(
      ([templates, exercises]) => {
        if (cancelled) return;
        setLoaded({ programId, bundled: templates.find((t) => t.id === programId), exercises });
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

  if (!programId) return null;
  const current = loaded?.programId === programId ? loaded : undefined;
  if (own === undefined || !current) return undefined;
  const program = own ?? current.bundled;
  return program ? { program, exercises: current.exercises } : null;
}

/**
 * Aktives Programm mit Fortschritt: `undefined` beim Laden, `null` ohne aktives Programm oder
 * wenn es das Programm nicht (mehr) gibt.
 */
export function useActiveProgram(): ActiveProgram | null | undefined {
  const state = useTrainingState();
  const sessions = useCompletedSessions();
  const programId = state?.activeProgramId;
  const found = useProgramById(programId);
  const template = found?.program;
  const progress = useMemo(
    () =>
      template && sessions ? programProgress(template, sessions, state?.activeSince) : undefined,
    [template, sessions, state?.activeSince],
  );

  if (state === undefined || sessions === undefined) return undefined;
  if (!programId) return null;
  if (found === undefined) return undefined;
  if (!found || !template || !progress) return null;
  return { template, exercises: found.exercises, progress, state };
}
