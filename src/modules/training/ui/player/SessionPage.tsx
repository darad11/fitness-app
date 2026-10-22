import {
  ArrowLeftRight,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Ellipsis,
  Info,
  NotebookPen,
  Plus,
  Trash2,
} from 'lucide-react';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import {
  describeExercise,
  ExercisePicker,
  MuscleTags,
  useExercisePrefs,
  useExercises,
  type Exercise,
} from '@/modules/exercises';
import { SETTINGS_DEFAULTS, useFormatters, useSettings } from '@/modules/settings';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { playRestEndSound, unlockSound } from '@/shared/lib/sound';
import { keepScreenAwake } from '@/shared/lib/wakeLock';
import { Button, ButtonLink, Dialog, IconButton, Meter, Skeleton } from '@/shared/ui';
import { previousValues } from '../../calc/history';
import { NoteDialog } from './NoteDialog';
import { formatSetValues } from '../../calc/fields';
import { formatClock, formatTargetRange, restRemainingSec } from '../../calc/format';
import {
  currentSet,
  liveExercises,
  liveSets,
  nextOpenSet,
  sessionDurationSec,
  sessionProgress,
  setSlot,
  REQUIRED_FIELDS,
  suggestValues,
} from '../../calc/session';
import { usePreviousHistory, useSession } from '../../data/useSession';
import type { HistoryRow } from '../../model/history';
import {
  NOTE_MAX,
  SESSION_NOTE_MAX,
  type Session,
  type SessionExercise,
  type SessionSet,
  type SetValues,
} from '../../model/session';
import {
  addExercise,
  addSet,
  adjustRest,
  completeSet,
  discardSession,
  finishSession,
  InvalidValueError,
  MissingValuesError,
  moveExercise,
  removeExercise,
  removeSet,
  reopenSet,
  replaceExercise,
  setExerciseNote,
  setSessionNote,
  setValues,
  skipRest,
  skipSet,
  startSetTimer,
  stopSetTimer,
} from '../../service/sessionService';
import { RestStage } from './RestStage';
import { SetHeader, SetRow } from './SetRow';

/** Trainingsplayer (S-07) unter `/training/einheit/:id`. */
export function SessionPage() {
  const { id = '' } = useParams();
  // Leichtes Training aus dem Rückkehr-Flow (D-319): nur ein Hinweis, Plan und Sätze bleiben.
  const [search] = useSearchParams();
  const light = search.get('leicht') === '1';
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
        <h1 className="mb-2 text-headline font-semibold">{t.training.title}</h1>
        <p className="mb-6 text-muted">{t.session.notFound}</p>
        <ButtonLink to="/training">{t.training.title}</ButtonLink>
      </div>
    );
  }
  if (session.status === 'completed') {
    return <Navigate to={`/training/einheit/${session.id}/zusammenfassung`} replace />;
  }
  return <Player session={session} light={light} />;
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

interface SetName {
  label: string;
  name: string;
  /** Position unter den lebenden Sätzen der Übung, 1-basiert. */
  index: number;
  total: number;
}

/** Lesbare Namen aller Sätze („Kniebeuge mit Langhantel, Arbeitssatz 2"), je Übung gezählt. */
function setNames(exercises: SessionExercise[]): Map<string, SetName> {
  const names = new Map<string, SetName>();
  for (const exercise of exercises) {
    let working = 0;
    let warmup = 0;
    let drop = 0;
    const sets = liveSets(exercise);
    sets.forEach((set, position) => {
      const ordinal =
        set.type === 'working' ? ++working : set.type === 'warmup' ? ++warmup : ++drop;
      const label = set.type === 'working' ? String(ordinal) : t.session.setTypeShort[set.type];
      const name = t.session.setLabel(t.session.setTypeLabel[set.type], ordinal);
      names.set(set.id, {
        label,
        name: `${exercise.nameSnapshot}, ${name}`,
        index: position + 1,
        total: sets.length,
      });
    });
  }
  return names;
}

/**
 * Spielt den Ton zum Pausenende nur, wenn das Ende während der Anzeige erreicht wird
 * (letzter Stand höchstens 1 s davor), nie nachträglich nach einer Rückkehr (AK-TRN-12).
 */
function useRestEndSound(timer: Session['restTimer'], now: Date, enabled: boolean): void {
  const last = useRef<{ endsAt: string; remaining: number } | null>(null);
  const remaining = timer ? restRemainingSec(timer.endsAt, now) : null;
  const endsAt = timer?.endsAt;
  useEffect(() => {
    const previous = last.current;
    last.current = endsAt && remaining !== null ? { endsAt, remaining } : null;
    if (
      enabled &&
      endsAt &&
      remaining !== null &&
      remaining <= 0 &&
      previous?.endsAt === endsAt &&
      previous.remaining > 0 &&
      previous.remaining <= 1 &&
      document.visibilityState === 'visible'
    ) {
      playRestEndSound();
    }
  }, [enabled, endsAt, remaining]);
}

/** Basis- und eigene Übungen nach ID, für Übungsinfo und Alternativen; leer, bis sie geladen sind. */
function useLibrary(): ReadonlyMap<string, Exercise> {
  const exercises = useExercises();
  return useMemo(
    () => new Map((exercises ?? []).map((exercise) => [exercise.id, exercise])),
    [exercises],
  );
}

function Player({ session, light }: { session: Session; light: boolean }) {
  const rt = useDb();
  const navigate = useNavigate();
  const settings = useSettings() ?? SETTINGS_DEFAULTS;
  const fmt = useFormatters();
  const history = usePreviousHistory(session);
  const library = useLibrary();
  const prefs = useExercisePrefs();
  const now = useNow(session.restTimer || session.setTimer ? 250 : 1000);
  useRestEndSound(session.restTimer ?? null, now, settings.restSound);
  useEffect(() => {
    if (!settings.keepAwake) return undefined;
    return keepScreenAwake();
  }, [settings.keepAwake]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<SessionExercise | null>(null);
  const [info, setInfo] = useState<SessionExercise | null>(null);
  const [actionsFor, setActionsFor] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  // Notiz-Dialog: zu einer Übung (Schlüssel der Übung in der Einheit) oder zur ganzen Einheit.
  const [noteFor, setNoteFor] = useState<SessionExercise | 'session' | null>(null);
  const [errors, setErrors] = useState<Record<string, RowError>>({});
  // Ohne Tausendertrennung: die Eingabefelder werden damit vorbelegt, und parseDecimal
  // liest keine (D-291).
  const number = useCallback(
    (value: number) => fmt.number(value, { maximumFractionDigits: 2, useGrouping: false }),
    [fmt],
  );

  const exercises = liveExercises(session);
  const progress = sessionProgress(session);
  const current = currentSet(session);
  const names = setNames(exercises);
  const restTimer = session.restTimer ?? null;
  const afterRest = restTimer ? nextOpenSet(session, restTimer.afterSetId) : null;
  const setTimer = session.setTimer ?? null;
  const timerElapsed = setTimer
    ? Math.max(0, Math.floor((now.getTime() - Date.parse(setTimer.startedAt)) / 1000))
    : 0;
  const timerFor = (exercise: SessionExercise, set: SessionSet) => {
    if (!REQUIRED_FIELDS[exercise.trackingMode].includes('durationSec')) return undefined;
    const running = setTimer?.setId === set.id;
    return {
      running,
      elapsedSec: running ? timerElapsed : 0,
      onToggle: () =>
        void run(set.id, () =>
          running ? stopSetTimer(rt, session.id) : startSetTimer(rt, session.id, set.id),
        ),
    };
  };
  const removeWithConfirm = (exercise: SessionExercise) => {
    const done = liveSets(exercise).filter((s) => s.status === 'done').length;
    if (done === 0) void run(exercise.id, () => removeExercise(rt, session.id, exercise.id));
    else setConfirm({ kind: 'removeExercise', exercise, done });
  };

  const previousFor = (exercise: SessionExercise, set: SessionSet): SetValues | undefined =>
    previousValues(history?.get(exercise.exerciseId), setSlot(exercise, set.id));
  const formatValues = (exercise: SessionExercise, values: SetValues) =>
    formatSetValues(values, exercise.trackingMode, exercise.distanceUnit, number);

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
        previous: previousFor(exercise, set),
        // Standardpause der Übung (AK-EXL-04), sonst aus den Einstellungen.
        restDefaultSec: prefs?.get(exercise.exerciseId)?.defaultRestSec ?? settings.restDefaultSec,
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
  const currentName = current ? names.get(current.id) : undefined;
  const currentTarget = current?.target ? formatTargetRange(current.target) : null;
  const currentPrevious =
    current && currentExercise ? previousFor(currentExercise, current) : undefined;
  // Nächste Übung nach der aktuellen: erster offener Satz nach dem letzten Satz dieser Übung.
  const lastOfCurrent = currentExercise ? liveSets(currentExercise).at(-1) : undefined;
  const afterCurrent = lastOfCurrent ? nextOpenSet(session, lastOfCurrent.id) : null;
  const nextExercise =
    afterCurrent && afterCurrent.exercise.id !== currentExercise?.id ? afterCurrent.exercise : null;
  const eyebrow = session.program
    ? `${session.program.programName} · ${session.program.weekName}`
    : t.session.freeSource;

  return (
    <div
      className={restTimer ? 'pb-32' : 'pb-28'}
      onPointerDownCapture={settings.restSound ? unlockSound : undefined}
      onKeyDownCapture={settings.restSound ? unlockSound : undefined}
    >
      <header className="page-gutters sticky top-0 z-10 -mx-page mb-4 border-b border-line bg-bg pt-2 pb-3 md:-mx-page-md lg:-mx-page-lg">
        <div className="flex items-start justify-between gap-2">
          {/* Zurück zu „Training“; die Einheit läuft weiter (Leiste „Training läuft“). */}
          <Link
            to="/training"
            aria-label={t.training.title}
            title={t.training.title}
            className="-ml-2 flex size-touch shrink-0 items-center justify-center rounded-pill text-muted hover:bg-surface-2 hover:text-fg"
          >
            <ChevronLeft aria-hidden="true" className="size-6" />
          </Link>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="eyebrow truncate text-muted">{eyebrow}</p>
            <h1 className="line-clamp-2 text-title leading-tight font-semibold">{session.title}</h1>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const open = progress.total - progress.done;
              if (open > 0) setConfirm({ kind: 'finish', open });
              else void finish(false);
            }}
          >
            {t.session.finish}
          </Button>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Meter
            value={progress.total > 0 ? progress.done / progress.total : 0}
            label={t.session.progress(progress.done, progress.total)}
            className="flex-1"
          />
          <p className="shrink-0 text-sm font-semibold text-muted tabular-nums">
            <span className="sr-only">{t.session.duration}: </span>
            {formatClock(sessionDurationSec(session, now))}
          </p>
        </div>
        <p className="mt-1 text-sm text-muted tabular-nums">
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
        {restTimer ? (
          <RestStage
            timer={restTimer}
            now={now}
            next={
              afterRest
                ? {
                    ...afterRest,
                    name: names.get(afterRest.set.id)?.name ?? afterRest.exercise.nameSnapshot,
                  }
                : null
            }
            previous={(() => {
              const values = afterRest ? previousFor(afterRest.exercise, afterRest.set) : null;
              return afterRest && values ? formatValues(afterRest.exercise, values) : undefined;
            })()}
            onAdjust={(delta) => void run('rest', () => adjustRest(rt, session.id, delta))}
            onSkip={() => void run('rest', () => skipRest(rt, session.id))}
          />
        ) : null}
      </header>
      {light ? (
        <p role="note" className="mb-4 rounded-card bg-surface p-card shadow-card">
          {t.returnFlow.lightHint}
        </p>
      ) : null}

      {!restTimer && current && currentExercise && currentName ? (
        <section aria-label={t.session.now} className="stage mb-4 rounded-card p-card text-fg">
          <p className="eyebrow text-muted">{t.session.now}</p>
          <p className="mt-1 text-2xl font-semibold">{currentExercise.nameSnapshot}</p>
          <p className="mt-1 text-muted">
            {[
              `${t.session.setTypeLabel[current.type]} · ${t.session.setOf(currentName.index, currentName.total)}`,
              currentTarget ? `${t.session.target} ${currentTarget.text}` : null,
              currentPrevious
                ? `${t.session.previous} ${formatValues(currentExercise, currentPrevious)}`
                : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {setTimer?.setId === current.id ? (
            <p className="mt-2 text-timer font-semibold tabular-nums" role="timer">
              {formatClock(timerElapsed)}
            </p>
          ) : null}
          {currentExercise.notes ? (
            <p className="mt-2 text-sm text-muted">{currentExercise.notes}</p>
          ) : null}
          <p className="mt-3 text-sm text-muted">
            {nextExercise
              ? t.session.nextExercise(nextExercise.nameSnapshot)
              : t.session.lastExercise}
          </p>
        </section>
      ) : null}
      {!restTimer && !current && exercises.length > 0 ? (
        <section aria-label={t.session.allDone} className="stage mb-4 rounded-card p-card text-fg">
          <p className="eyebrow text-muted">{t.session.now}</p>
          <p className="mt-1 text-2xl font-semibold">{t.session.allDone}</p>
        </section>
      ) : null}

      {exercises.length === 0 ? <p className="mb-4 text-muted">{t.session.empty}</p> : null}

      <div className="grid gap-4">
        {exercises.map((exercise, index) => {
          const row = history?.get(exercise.exerciseId);
          const sets = liveSets(exercise);
          const open = actionsFor === exercise.id;
          return (
            <section
              key={exercise.id}
              aria-labelledby={`uebung-${exercise.id}`}
              className="rounded-card bg-surface p-3 shadow-card"
            >
              <div className="mb-2 flex items-start gap-1 px-1">
                <div className="min-w-0 flex-1">
                  <h2 id={`uebung-${exercise.id}`} className="text-lg font-semibold">
                    {exercise.nameSnapshot}
                  </h2>
                  <MuscleTags
                    muscles={library.get(exercise.exerciseId)?.primaryMuscles ?? []}
                    className="mt-1.5 mb-1"
                  />
                  <p className="text-sm text-muted">
                    {row
                      ? t.session.lastTime(fmt.weekdayDayMonth(new Date(row.completedAt)))
                      : t.session.firstTime}
                    {exercise.perSide ? ` · ${t.session.perSide}` : ''}
                  </p>
                  {exercise.notes ? <p className="mt-1 text-sm">{exercise.notes}</p> : null}
                  {exercise.note ? (
                    <p className="mt-1 text-sm">
                      <span className="font-semibold">{t.session.yourNote}: </span>
                      {exercise.note}
                    </p>
                  ) : row?.note ? (
                    <p className="mt-1 text-sm text-muted">
                      <span className="font-semibold">{t.session.previousNote}: </span>
                      {row.note}
                    </p>
                  ) : null}
                </div>
                <IconButton
                  label={t.session.exerciseInfo(exercise.nameSnapshot)}
                  onClick={() => {
                    setInfo(exercise);
                  }}
                >
                  <Info aria-hidden="true" className="size-5" />
                </IconButton>
                <IconButton
                  label={t.session.moreExercise(exercise.nameSnapshot)}
                  aria-expanded={open}
                  onClick={() => {
                    setActionsFor(open ? null : exercise.id);
                  }}
                >
                  <Ellipsis aria-hidden="true" className="size-5" />
                </IconButton>
              </div>
              {open ? (
                <div className="mb-3 flex flex-wrap gap-2 px-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={index === 0}
                    onClick={() =>
                      void run(exercise.id, () => moveExercise(rt, session.id, exercise.id, -1))
                    }
                  >
                    <ChevronUp aria-hidden="true" className="size-4" />
                    {t.session.moveUp}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={index === exercises.length - 1}
                    onClick={() =>
                      void run(exercise.id, () => moveExercise(rt, session.id, exercise.id, 1))
                    }
                  >
                    <ChevronDown aria-hidden="true" className="size-4" />
                    {t.session.moveDown}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setActionsFor(null);
                      setReplaceTarget(exercise);
                      setPickerOpen(true);
                    }}
                  >
                    <ArrowLeftRight aria-hidden="true" className="size-4" />
                    {t.session.replaceExercise}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setActionsFor(null);
                      setNoteFor(exercise);
                    }}
                  >
                    <NotebookPen aria-hidden="true" className="size-4" />
                    {t.session.noteAction}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setActionsFor(null);
                      removeWithConfirm(exercise);
                    }}
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                    {t.session.removeExercise}
                  </Button>
                </div>
              ) : null}
              {errors[exercise.id] ? (
                <p role="alert" className="mb-2 px-1 text-sm text-danger">
                  {errors[exercise.id]?.message}
                </p>
              ) : null}
              {sets.length > 0 ? <SetHeader exercise={exercise} /> : null}
              <ol className="grid gap-1">
                {sets.map((set) => {
                  const { label, name } = names.get(set.id) ?? { label: '', name: '' };
                  const previous = previousValues(row, setSlot(exercise, set.id));
                  return (
                    <SetRow
                      key={set.id}
                      exercise={exercise}
                      set={set}
                      label={label}
                      name={name}
                      previous={previous}
                      suggestion={suggestionFor(exercise, set, row)}
                      current={current?.id === set.id}
                      error={errors[set.id]?.message}
                      onRetry={errors[set.id]?.retry}
                      weightStep={
                        prefs?.get(exercise.exerciseId)?.weightStepKg ?? settings.weightStepKg
                      }
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
                      timer={timerFor(exercise, set)}
                    />
                  );
                })}
              </ol>
              <Button
                variant="quiet"
                size="sm"
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

      <section
        aria-label={t.session.sessionNoteTitle}
        className="mt-6 rounded-card bg-surface p-4 shadow-card"
      >
        {session.notes ? (
          <p className="mb-3 whitespace-pre-line">
            <span className="font-semibold">{t.session.sessionNoteTitle}: </span>
            {session.notes}
          </p>
        ) : null}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setNoteFor('session');
          }}
        >
          <NotebookPen aria-hidden="true" className="size-4" />
          {t.session.sessionNoteAction}
        </Button>
      </section>

      <div className="mt-8 flex justify-center">
        <Button
          variant="quietDanger"
          onClick={() => {
            setConfirm({ kind: 'discard' });
          }}
        >
          {t.session.discard}
        </Button>
      </div>

      <div className="page-gutters fixed inset-x-0 bottom-0 z-20 border-t border-line bg-panel pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <div className="mx-auto flex max-w-content gap-2">
          {current && currentExercise ? (
            <Button
              variant="action"
              size="lg"
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
            size="lg"
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
        </div>
      </div>

      {noteFor ? (
        <NoteDialog
          title={
            noteFor === 'session'
              ? t.session.sessionNoteTitle
              : t.session.noteTitle(noteFor.nameSnapshot)
          }
          hint={noteFor === 'session' ? t.session.sessionNoteHint : t.session.noteHint}
          initial={(noteFor === 'session' ? session.notes : noteFor.note) ?? ''}
          maxLength={noteFor === 'session' ? SESSION_NOTE_MAX : NOTE_MAX}
          onClose={() => {
            setNoteFor(null);
          }}
          onSave={(text) => {
            const target = noteFor;
            setNoteFor(null);
            if (target === 'session') {
              void run('session', () => setSessionNote(rt, session.id, text));
            } else {
              void run(target.id, () => setExerciseNote(rt, session.id, target.id, text));
            }
          }}
        />
      ) : null}

      {pickerOpen ? (
        <Suspense fallback={null}>
          <ExercisePicker
            open={pickerOpen}
            title={
              replaceTarget
                ? t.session.replaceTitle(replaceTarget.nameSnapshot)
                : t.session.pickTitle
            }
            alternativesForId={replaceTarget?.exerciseId}
            onClose={() => {
              setPickerOpen(false);
              setReplaceTarget(null);
            }}
            onSelect={(exercise) => {
              setPickerOpen(false);
              const target = replaceTarget;
              setReplaceTarget(null);
              const input = {
                exerciseId: exercise.id,
                name: exercise.name,
                trackingMode: exercise.trackingMode,
                ...(exercise.distanceUnit ? { distanceUnit: exercise.distanceUnit } : {}),
                ...(exercise.isUnilateral ? { perSide: true } : {}),
              };
              if (target) {
                void run(target.id, () => replaceExercise(rt, session.id, target.id, input));
              } else {
                void run('session', () => addExercise(rt, session.id, input));
              }
            }}
          />
        </Suspense>
      ) : null}

      <Dialog
        open={info !== null}
        onClose={() => {
          setInfo(null);
        }}
        closeLabel={t.common.close}
        title={info?.nameSnapshot ?? ''}
      >
        {info ? <ExerciseInfo exercise={info} library={library} /> : null}
      </Dialog>

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
    </div>
  );
}

/** Übungsinfo im Player: Muskeln, Gerät, Erfassung, Hinweis aus dem Programm, Herkunft beim Ersetzen. */
function ExerciseInfo({
  exercise,
  library,
}: {
  exercise: SessionExercise;
  library: ReadonlyMap<string, Exercise>;
}) {
  const entry = library.get(exercise.exerciseId);
  const origin = exercise.replacedFromExerciseId
    ? library.get(exercise.replacedFromExerciseId)
    : undefined;
  const rows: [string, string][] = [];
  if (entry) {
    rows.push([
      t.session.info.primary,
      entry.primaryMuscles.map((m) => t.exercises.muscles[m]).join(', '),
    ]);
    if (entry.secondaryMuscles.length > 0) {
      rows.push([
        t.session.info.secondary,
        entry.secondaryMuscles.map((m) => t.exercises.muscles[m]).join(', '),
      ]);
    }
    rows.push([
      t.session.info.equipment,
      entry.equipment.map((e) => t.exercises.equipment[e]).join(', '),
    ]);
  }
  rows.push([
    t.session.info.tracking,
    t.session.trackingModes[exercise.trackingMode] +
      (exercise.perSide ? ` · ${t.session.perSide}` : ''),
  ]);
  if (exercise.notes) rows.push([t.session.note, exercise.notes]);
  return (
    <div>
      {entry ? <p className="mb-3 text-sm text-muted">{describeExercise(entry)}</p> : null}
      <dl className="grid gap-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="eyebrow text-muted">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {exercise.replacedFromExerciseId ? (
        <p className="mt-3 text-sm text-muted">{t.session.replacedFrom(origin?.name ?? '')}</p>
      ) : null}
      {!entry && !exercise.notes ? <p className="text-muted">{t.session.info.none}</p> : null}
    </div>
  );
}
