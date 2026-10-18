import { Plus } from 'lucide-react';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { ExercisePicker } from '@/modules/exercises';
import { SETTINGS_DEFAULTS, useFormatters, useSettings } from '@/modules/settings';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { Button, ButtonLink, Dialog, Skeleton } from '@/shared/ui';
import { previousValues } from '../../calc/history';
import {
  currentSet,
  liveExercises,
  liveSets,
  sessionDurationSec,
  sessionProgress,
  setSlot,
  suggestValues,
} from '../../calc/session';
import { usePreviousHistory, useSession } from '../../data/useSession';
import type { HistoryRow } from '../../model/history';
import type { Session, SessionExercise, SessionSet } from '../../model/session';
import {
  addExercise,
  addSet,
  completeSet,
  discardSession,
  finishSession,
  InvalidValueError,
  MissingValuesError,
  removeExercise,
  removeSet,
  reopenSet,
  setValues,
  skipSet,
} from '../../service/sessionService';
import { formatClock } from '../../calc/format';
import { SetHeader, SetRow } from './SetRow';

/** Trainingsplayer (S-07) unter `/training/einheit/:id`. */
export function SessionPage() {
  const { id = '' } = useParams();
  const session = useSession(id);
  if (session === undefined) {
    return (
      <div aria-busy="true" className="grid gap-4">
        <Skeleton className="h-16" />
        <Skeleton className="h-48" />
      </div>
    );
  }
  if (session === null) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-semibold">{t.training.title}</h1>
        <p className="mb-6 text-muted">{t.session.notFound}</p>
        <ButtonLink to="/training">{t.training.title}</ButtonLink>
      </div>
    );
  }
  if (session.status === 'completed') {
    return <Navigate to={`/training/einheit/${session.id}/zusammenfassung`} replace />;
  }
  return <Player session={session} />;
}

type Confirm =
  | { kind: 'finish'; open: number }
  | { kind: 'discard' }
  | { kind: 'removeExercise'; exercise: SessionExercise; done: number };

interface RowError {
  message: string;
  retry?: () => void;
}

function useNow(intervalMs: number): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const tick = () => {
      setNow(new Date());
    };
    const timer = window.setInterval(tick, intervalMs);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [intervalMs]);
  return now;
}

function Player({ session }: { session: Session }) {
  const rt = useDb();
  const navigate = useNavigate();
  const settings = useSettings() ?? SETTINGS_DEFAULTS;
  const fmt = useFormatters();
  const history = usePreviousHistory(session);
  const now = useNow(1000);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [errors, setErrors] = useState<Record<string, RowError>>({});
  const number = useCallback(
    (value: number) => fmt.number(value, { maximumFractionDigits: 2 }),
    [fmt],
  );

  const exercises = liveExercises(session);
  const progress = sessionProgress(session);
  const current = currentSet(session);

  /** Führt eine Änderung aus und zeigt Fehler am Satz (AK-TRN-25). */
  async function run(key: string, action: () => Promise<unknown>): Promise<void> {
    try {
      await action();
      setErrors(({ [key]: _removed, ...rest }) => rest);
    } catch (error) {
      let entry: RowError;
      if (error instanceof MissingValuesError) entry = { message: t.session.missing };
      else if (error instanceof InvalidValueError)
        entry = { message: t.session.invalid[error.field] };
      else {
        void logError(rt.db, { area: 'training', error, route: window.location.pathname });
        entry = {
          message: t.session.saveFailed,
          retry: () => {
            void run(key, action);
          },
        };
      }
      setErrors((all) => ({ ...all, [key]: entry }));
    }
  }

  const suggestionFor = (exercise: SessionExercise, set: SessionSet, row: HistoryRow | undefined) =>
    suggestValues(set, previousValues(row, setSlot(exercise, set.id)));

  const complete = (exercise: SessionExercise, set: SessionSet) =>
    run(set.id, () =>
      completeSet(rt, session.id, set.id, {
        previous: previousValues(history?.get(exercise.exerciseId), setSlot(exercise, set.id)),
        restDefaultSec: settings.restDefaultSec,
        autoStartRest: settings.autoStartRest,
      }),
    );

  const finish = async (skipOpen: boolean) => {
    try {
      await finishSession(rt, session.id, { skipOpen });
      void navigate(`/training/einheit/${session.id}/zusammenfassung`, { replace: true });
    } catch (error) {
      void logError(rt.db, { area: 'training', error, route: window.location.pathname });
      setErrors((all) => ({
        ...all,
        session: { message: t.session.saveFailed, retry: () => void finish(skipOpen) },
      }));
    }
  };

  const currentExercise = current
    ? exercises.find((exercise) => exercise.sets.some((s) => s.id === current.id))
    : undefined;

  return (
    <div className="pb-24">
      <header className="sticky top-0 z-10 -mx-4 mb-4 border-b border-line bg-bg px-4 pt-2 pb-3 md:-mx-6 md:px-6">
        <h1 className="text-xl font-semibold">{session.title}</h1>
        <p className="mt-1 text-sm text-muted tabular-nums">
          <span className="sr-only">{t.session.duration}: </span>
          {formatClock(sessionDurationSec(session, now))} ·{' '}
          {t.session.progress(progress.done, progress.total)}
        </p>
        {errors.session ? (
          <p role="alert" className="mt-2 text-sm text-danger">
            {errors.session.message}{' '}
            {errors.session.retry ? (
              <button
                type="button"
                className="font-semibold underline"
                onClick={errors.session.retry}
              >
                {t.session.retry}
              </button>
            ) : null}
          </p>
        ) : null}
      </header>

      {exercises.length === 0 ? <p className="mb-4 text-muted">{t.session.empty}</p> : null}

      <div className="grid gap-4">
        {exercises.map((exercise) => {
          const row = history?.get(exercise.exerciseId);
          const sets = liveSets(exercise);
          let working = 0;
          let warmup = 0;
          let drop = 0;
          return (
            <section
              key={exercise.id}
              aria-labelledby={`uebung-${exercise.id}`}
              className="rounded-card border border-line bg-surface p-3"
            >
              <div className="mb-2 flex items-start gap-2 px-1">
                <div className="min-w-0 flex-1">
                  <h2 id={`uebung-${exercise.id}`} className="text-lg font-semibold">
                    {exercise.nameSnapshot}
                  </h2>
                  <p className="text-sm text-muted">
                    {row
                      ? t.session.lastTime(fmt.weekdayDayMonth(new Date(row.completedAt)))
                      : t.session.firstTime}
                    {exercise.perSide ? ` · ${t.session.perSide}` : ''}
                  </p>
                </div>
                <Button
                  variant="quiet"
                  className="min-h-10 px-2 text-sm"
                  onClick={() => {
                    const done = sets.filter((s) => s.status === 'done').length;
                    if (done === 0)
                      void run(exercise.id, () => removeExercise(rt, session.id, exercise.id));
                    else setConfirm({ kind: 'removeExercise', exercise, done });
                  }}
                >
                  {t.session.removeExercise}
                </Button>
              </div>
              {errors[exercise.id] ? (
                <p role="alert" className="mb-2 px-1 text-sm text-danger">
                  {errors[exercise.id]?.message}
                </p>
              ) : null}
              {sets.length > 0 ? <SetHeader exercise={exercise} /> : null}
              <ol className="grid gap-1">
                {sets.map((set) => {
                  const ordinal =
                    set.type === 'working' ? ++working : set.type === 'warmup' ? ++warmup : ++drop;
                  const label =
                    set.type === 'working' ? String(ordinal) : t.session.setTypeShort[set.type];
                  const name = t.session.setLabel(t.session.setTypeLabel[set.type], ordinal);
                  const previous = previousValues(row, setSlot(exercise, set.id));
                  return (
                    <SetRow
                      key={set.id}
                      exercise={exercise}
                      set={set}
                      label={label}
                      name={`${exercise.nameSnapshot}, ${name}`}
                      previous={previous}
                      suggestion={suggestionFor(exercise, set, row)}
                      current={current?.id === set.id}
                      error={errors[set.id]?.message}
                      onRetry={errors[set.id]?.retry}
                      weightStep={settings.weightStepKg}
                      number={number}
                      onValue={(field, value) => {
                        if (value === 'invalid') {
                          setErrors((all) => ({
                            ...all,
                            [set.id]: { message: t.session.invalid[field] },
                          }));
                          return;
                        }
                        void run(set.id, () =>
                          setValues(rt, session.id, set.id, { [field]: value }),
                        );
                      }}
                      onToggleDone={() => {
                        if (set.status === 'planned') void complete(exercise, set);
                        else void run(set.id, () => reopenSet(rt, session.id, set.id));
                      }}
                      onSkip={() => void run(set.id, () => skipSet(rt, session.id, set.id))}
                      onRemove={() => void run(set.id, () => removeSet(rt, session.id, set.id))}
                    />
                  );
                })}
              </ol>
              <Button
                variant="quiet"
                className="mt-2"
                onClick={() => void run(exercise.id, () => addSet(rt, session.id, exercise.id))}
              >
                <Plus aria-hidden="true" className="size-5" />
                {t.session.addSet}
              </Button>
            </section>
          );
        })}
      </div>

      <div className="mt-6 flex justify-center">
        <Button
          variant="quiet"
          className="text-danger"
          onClick={() => {
            setConfirm({ kind: 'discard' });
          }}
        >
          {t.session.discard}
        </Button>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <div className="mx-auto flex max-w-[1200px] gap-2">
          {current && currentExercise ? (
            <Button
              className="flex-1"
              onClick={() => {
                void complete(currentExercise, current);
              }}
            >
              {t.session.done}
            </Button>
          ) : null}
          <Button
            variant="secondary"
            className={currentExercise ? '' : 'flex-1'}
            onClick={() => {
              setPickerOpen(true);
            }}
          >
            <Plus aria-hidden="true" className="size-5" />
            <span className={currentExercise ? 'sr-only md:not-sr-only' : ''}>
              {t.session.addExercise}
            </span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              const open = progress.total - progress.done;
              if (open > 0) setConfirm({ kind: 'finish', open });
              else void finish(false);
            }}
          >
            {t.session.finish}
          </Button>
        </div>
      </div>

      {pickerOpen ? (
        <Suspense fallback={null}>
          <ExercisePicker
            open={pickerOpen}
            title={t.session.pickTitle}
            onClose={() => {
              setPickerOpen(false);
            }}
            onSelect={(exercise) => {
              setPickerOpen(false);
              void run('session', () =>
                addExercise(rt, session.id, {
                  exerciseId: exercise.id,
                  name: exercise.name,
                  trackingMode: exercise.trackingMode,
                  ...(exercise.distanceUnit ? { distanceUnit: exercise.distanceUnit } : {}),
                  ...(exercise.isUnilateral ? { perSide: true } : {}),
                }),
              );
            }}
          />
        </Suspense>
      ) : null}

      <Dialog
        open={confirm !== null}
        onClose={() => {
          setConfirm(null);
        }}
        closeLabel={t.common.close}
        title={
          confirm?.kind === 'finish'
            ? t.session.finishTitle
            : confirm?.kind === 'discard'
              ? t.session.discardTitle
              : t.session.removeExerciseTitle
        }
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setConfirm(null);
              }}
            >
              {t.session.cancel}
            </Button>
            {confirm?.kind === 'finish' ? (
              <Button
                onClick={() => {
                  setConfirm(null);
                  void finish(true);
                }}
              >
                {t.session.finishConfirm}
              </Button>
            ) : confirm?.kind === 'discard' ? (
              <Button
                variant="danger"
                onClick={() => {
                  setConfirm(null);
                  void discardSession(rt, session.id).then(() =>
                    navigate('/training', { state: { discarded: session.id } }),
                  );
                }}
              >
                {t.session.discardConfirm}
              </Button>
            ) : confirm?.kind === 'removeExercise' ? (
              <Button
                variant="danger"
                onClick={() => {
                  const target = confirm.exercise;
                  setConfirm(null);
                  void run(target.id, () => removeExercise(rt, session.id, target.id));
                }}
              >
                {t.session.remove}
              </Button>
            ) : null}
          </>
        }
      >
        <p>
          {confirm?.kind === 'finish'
            ? t.session.finishOpen(confirm.open)
            : confirm?.kind === 'discard'
              ? t.session.discardText
              : confirm?.kind === 'removeExercise'
                ? `${confirm.exercise.nameSnapshot}: ${t.session.removeExerciseText(confirm.done)}`
                : ''}
        </p>
      </Dialog>
      <p className="sr-only">
        <Link to="/training">{t.training.title}</Link>
      </p>
    </div>
  );
}
