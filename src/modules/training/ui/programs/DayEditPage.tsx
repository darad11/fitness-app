import { ArrowDown, ArrowUp, Plus, Repeat2, Trash2, X } from 'lucide-react';
import { Suspense, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { ExercisePicker, type Exercise, type TrackingMode } from '@/modules/exercises';
import { SETTINGS_DEFAULTS, useFormatters, useSettings } from '@/modules/settings';
import { uuidv4 } from '@/shared/lib/uuid';
import { t } from '@/shared/i18n/de';
import { tProgramEditor } from '@/shared/i18n/de-program-editor';
import {
  Button,
  ButtonLink,
  Card,
  IconButton,
  PageHeader,
  SelectField,
  Skeleton,
} from '@/shared/ui';
import type { FieldSpec } from '../../calc/fields';
import { formatRest } from '../../calc/format';
import {
  addDropSet,
  addExercise,
  addSet,
  moveExercise,
  removeExercise,
  removeSet,
  replaceExercise,
  updateDay,
  updateExercise,
  updateSet,
  type Range,
  type SetPatch,
} from '../../calc/programEdit';
import { useOwnProgram } from '../../data/programRepository';
import type { Day, OwnProgram, PlannedExercise, PlannedSet, Weekday } from '../../model/program';
import { ValueInput } from '../player/ValueInput';
import { describeDay } from '../../calc/describe';
import { ConfirmDialog, ErrorMessage, INPUT, TEXTAREA, useProgramEdit } from './editorParts';
import { useLibrary } from './useLibrary';
import { Thumb } from '../exerciseVisuals';

/** Tag im Programm-Editor (S-07, AK-PRG-03, AK-PRG-04, AK-PRG-09, D-257). */
export function DayEditPage() {
  const { id, dayId } = useParams();
  const program = useOwnProgram(id);
  const exercises = useLibrary();
  if (program === undefined || exercises === undefined) {
    return (
      <div aria-busy="true" className="grid gap-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-40" />
      </div>
    );
  }
  const day = program?.weeks.flatMap((week) => week.days).find((d) => d.id === dayId);
  if (!program || !day) {
    return (
      <>
        <PageHeader
          title={t.programs.notFoundTitle}
          back={{ to: '/training/programme', label: t.programs.title }}
        />
        <p className="mb-6 text-muted">{t.programs.notFoundOwn}</p>
        <ButtonLink to="/training/programme">{t.programs.title}</ButtonLink>
      </>
    );
  }
  return <DayEditor key={day.id} program={program} day={day} library={exercises} />;
}

type Pending = { kind: 'remove'; exercise: PlannedExercise } | null;

function DayEditor({
  program,
  day,
  library,
}: {
  program: OwnProgram;
  day: Day;
  library: readonly Exercise[];
}) {
  const { applyWeeks, error } = useProgramEdit(program.id);
  const restDefaultSec = (useSettings() ?? SETTINGS_DEFAULTS).restDefaultSec;
  const byId = useMemo(() => new Map(library.map((e) => [e.id, e])), [library]);
  const [picker, setPicker] = useState<{ replace?: PlannedExercise } | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const week = program.weeks.find((w) => w.days.some((d) => d.id === day.id));

  return (
    <>
      <PageHeader
        eyebrow={week ? `${week.name} · ${program.name}` : program.name}
        title={day.name}
        subtitle={day.exercises.length > 0 ? describeDay(day, restDefaultSec) : undefined}
        back={{
          to: `/training/programme/${program.id}/bearbeiten`,
          label: tProgramEditor.backToEditor,
        }}
      />
      <p className="mb-4 max-w-xl text-sm text-muted">{tProgramEditor.autosave}</p>
      <ErrorMessage error={error} />
      <div className="grid gap-6">
        <DayDetails
          day={day}
          onSave={(patch) => applyWeeks((all) => updateDay(all, day.id, patch))}
        />
        <section aria-labelledby="uebungen" className="grid gap-4">
          <h2 id="uebungen" className="eyebrow text-muted">
            {tProgramEditor.exercisesTitle}
          </h2>
          {day.exercises.length === 0 ? (
            <p className="rounded-card bg-surface-2 p-4 text-muted">{t.programs.emptyDay}</p>
          ) : null}
          {day.exercises.map((exercise, index) => (
            <ExerciseEditor
              key={exercise.id}
              exercise={exercise}
              info={byId.get(exercise.exerciseId)}
              index={index}
              count={day.exercises.length}
              restDefaultSec={restDefaultSec}
              applyWeeks={applyWeeks}
              onReplace={() => {
                setPicker({ replace: exercise });
              }}
              onRemove={() => {
                setPending({ kind: 'remove', exercise });
              }}
            />
          ))}
          <Button
            variant="secondary"
            className="justify-self-start"
            onClick={() => {
              setPicker({});
            }}
          >
            <Plus aria-hidden="true" className="size-5" />
            {tProgramEditor.addExercise}
          </Button>
        </section>
      </div>

      {picker ? (
        <Suspense fallback={null}>
          <ExercisePicker
            open
            title={
              picker.replace
                ? tProgramEditor.replaceTitle(picker.replace.nameSnapshot)
                : tProgramEditor.pickTitle
            }
            alternativesForId={picker.replace?.exerciseId}
            onClose={() => {
              setPicker(null);
            }}
            onSelect={(choice) => {
              const target = picker.replace;
              setPicker(null);
              const input = { id: choice.id, name: choice.name, trackingMode: choice.trackingMode };
              void applyWeeks((all) =>
                target
                  ? replaceExercise(all, target.id, input)
                  : addExercise(all, day.id, input, uuidv4),
              );
            }}
          />
        </Suspense>
      ) : null}
      {pending ? (
        <ConfirmDialog
          title={tProgramEditor.removeExerciseTitle(pending.exercise.nameSnapshot)}
          confirmLabel={tProgramEditor.remove}
          onClose={() => {
            setPending(null);
          }}
          onConfirm={() => {
            const target = pending.exercise;
            setPending(null);
            void applyWeeks((all) => removeExercise(all, target.id));
          }}
        >
          {tProgramEditor.removeExerciseText}
        </ConfirmDialog>
      ) : null}
    </>
  );
}

const WEEKDAY_VALUES = ['1', '2', '3', '4', '5', '6', '7'] as const;

function DayDetails({
  day,
  onSave,
}: {
  day: Day;
  onSave: (patch: { name: string; weekdayHint: Weekday | null; notes: string }) => Promise<boolean>;
}) {
  const [name, setName] = useState(day.name);
  const [weekday, setWeekday] = useState<string>(day.weekdayHint ? String(day.weekdayHint) : '');
  const [notes, setNotes] = useState(day.notes ?? '');
  const [saved, setSaved] = useState(false);
  const dirty =
    name !== day.name ||
    weekday !== (day.weekdayHint ? String(day.weekdayHint) : '') ||
    notes !== (day.notes ?? '');
  const valid = name.trim().length > 0;
  return (
    <Card title={tProgramEditor.dayDetails}>
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!valid) return;
          void onSave({
            name: name.trim(),
            weekdayHint: weekday ? (Number(weekday) as Weekday) : null,
            notes,
          }).then((ok) => {
            setSaved(ok);
          });
        }}
      >
        <div>
          <label htmlFor="tag-name" className="mb-1 block text-sm font-medium">
            {t.programs.nameLabel}
          </label>
          <input
            id="tag-name"
            required
            maxLength={80}
            autoComplete="off"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setSaved(false);
            }}
            className={INPUT}
          />
        </div>
        <SelectField
          label={tProgramEditor.weekdayLabel}
          hint={tProgramEditor.weekdayHint}
          value={weekday}
          options={[
            { value: '', label: tProgramEditor.weekdayNone },
            ...WEEKDAY_VALUES.map((value, index) => ({
              value,
              label: t.programs.weekdays[index] ?? value,
            })),
          ]}
          onChange={(value) => {
            setWeekday(value);
            setSaved(false);
          }}
        />
        <div>
          <label htmlFor="tag-notiz" className="mb-1 block text-sm font-medium">
            {tProgramEditor.dayNotes}
          </label>
          <textarea
            id="tag-notiz"
            rows={2}
            maxLength={2000}
            value={notes}
            onChange={(event) => {
              setNotes(event.target.value);
              setSaved(false);
            }}
            className={TEXTAREA}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={!dirty || !valid}>
            {t.programs.save}
          </Button>
          {saved && !dirty ? (
            <span role="status" className="text-sm text-muted">
              {tProgramEditor.detailsSaved}
            </span>
          ) : null}
        </div>
      </form>
    </Card>
  );
}

const REST_CHOICES = [0, 30, 45, 60, 75, 90, 120, 150, 180, 240, 300] as const;

const usesReps = (mode: TrackingMode) =>
  mode === 'weight_reps' || mode === 'reps' || mode === 'assisted_reps';

const REPS: FieldSpec = { field: 'reps', label: 'reps', scale: 1, decimals: false };
const SECONDS: FieldSpec = {
  field: 'durationSec',
  label: 'durationSec',
  scale: 1,
  decimals: false,
};
const MINUTES: FieldSpec = {
  field: 'durationSec',
  label: 'durationMin',
  scale: 60,
  decimals: true,
};
const KG: FieldSpec = { field: 'weightKg', label: 'weightKg', scale: 1, decimals: true };
const KM: FieldSpec = { field: 'distanceM', label: 'distanceKm', scale: 1000, decimals: true };
const METERS: FieldSpec = { field: 'distanceM', label: 'distanceM', scale: 1, decimals: false };

function ExerciseEditor({
  exercise,
  info,
  index,
  count,
  restDefaultSec,
  applyWeeks,
  onReplace,
  onRemove,
}: {
  exercise: PlannedExercise;
  info: Exercise | undefined;
  index: number;
  count: number;
  restDefaultSec: number;
  applyWeeks: ReturnType<typeof useProgramEdit>['applyWeeks'];
  onReplace: () => void;
  onRemove: () => void;
}) {
  const fmt = useFormatters();
  const [notes, setNotes] = useState(exercise.notes ?? '');
  const [invalid, setInvalid] = useState(false);
  const mode: TrackingMode = info?.trackingMode ?? 'weight_reps';
  const format = useMemo(() => {
    const plain = new Intl.NumberFormat(fmt.locale, {
      useGrouping: false,
      maximumFractionDigits: 2,
    });
    return (value: number) => plain.format(value);
  }, [fmt.locale]);
  const name = exercise.nameSnapshot;
  const restValues: number[] = [...REST_CHOICES];
  if (exercise.restSec !== undefined && !restValues.includes(exercise.restSec)) {
    restValues.push(exercise.restSec);
    restValues.sort((a, b) => a - b);
  }
  const patchSet = (set: PlannedSet, patch: SetPatch) =>
    void applyWeeks((all) => updateSet(all, set.id, patch), {
      invalid: tProgramEditor.dropTypeLocked,
    });
  const commit =
    (handler: (value: number | null) => void) => (value: number | null | 'invalid') => {
      if (value === 'invalid') {
        setInvalid(true);
        return;
      }
      setInvalid(false);
      handler(value);
    };
  /** Untere oder obere Grenze eines Bereichs; ein leerer Wert macht daraus einen festen Wert. */
  const rangeCommit = (
    set: PlannedSet,
    key: 'reps' | 'duration',
    end: 'min' | 'max',
  ): ((value: number | null) => void) => {
    const min = key === 'reps' ? set.repsMin : set.durationMinSec;
    const max = key === 'reps' ? set.repsMax : set.durationMaxSec;
    return (value) => {
      let range: Range | null;
      if (value === null) {
        const other = end === 'min' ? max : min;
        range = other === undefined ? null : { min: other, max: other };
      } else if (end === 'min') {
        range = { min: value, max: Math.max(value, max ?? value) };
      } else {
        range = { min: Math.min(value, min ?? value), max: value };
      }
      patchSet(set, { [key]: range });
    };
  };

  return (
    <Card>
      <div className="flex flex-wrap items-start gap-1">
        {/* Vorschaubild links neben dem Namen (D-397). */}
        <Thumb exerciseId={exercise.exerciseId} className="mt-1 mr-2" />
        <div className="min-w-0 flex-1 basis-40 pt-2">
          <p className="text-sm font-semibold text-muted tabular-nums">{index + 1}</p>
          <h3 className="text-lg font-semibold break-words">{name}</h3>
        </div>
        <IconButton
          label={tProgramEditor.moveUp(name)}
          disabled={index === 0}
          onClick={() => void applyWeeks((all) => moveExercise(all, exercise.id, -1))}
        >
          <ArrowUp aria-hidden="true" className="size-5" />
        </IconButton>
        <IconButton
          label={tProgramEditor.moveDown(name)}
          disabled={index === count - 1}
          onClick={() => void applyWeeks((all) => moveExercise(all, exercise.id, 1))}
        >
          <ArrowDown aria-hidden="true" className="size-5" />
        </IconButton>
        <IconButton label={tProgramEditor.replace(name)} onClick={onReplace}>
          <Repeat2 aria-hidden="true" className="size-5" />
        </IconButton>
        <IconButton label={tProgramEditor.removeItem(name)} onClick={onRemove}>
          <Trash2 aria-hidden="true" className="size-5" />
        </IconButton>
      </div>
      {!info ? <p className="mt-2 text-sm text-danger">{tProgramEditor.unknownExercise}</p> : null}

      <h4 className="mt-4 mb-2 text-sm font-semibold text-muted">{tProgramEditor.setsTitle}</h4>
      <ol className="grid gap-3">
        {exercise.sets.map((set, setIndex) => {
          const number = setIndex + 1;
          const fields: {
            spec: FieldSpec;
            label: string;
            stored: number | undefined;
            onCommit: (value: number | null) => void;
          }[] = [];
          if (usesReps(mode)) {
            fields.push(
              {
                spec: REPS,
                label: tProgramEditor.repsMin,
                stored: set.repsMin,
                onCommit: rangeCommit(set, 'reps', 'min'),
              },
              {
                spec: REPS,
                label: tProgramEditor.repsMax,
                stored: set.repsMax,
                onCommit: rangeCommit(set, 'reps', 'max'),
              },
            );
          } else {
            const minutes = mode === 'time_distance';
            fields.push(
              {
                spec: minutes ? MINUTES : SECONDS,
                label: minutes ? tProgramEditor.durationMinMinutes : tProgramEditor.durationMin,
                stored: set.durationMinSec,
                onCommit: rangeCommit(set, 'duration', 'min'),
              },
              {
                spec: minutes ? MINUTES : SECONDS,
                label: minutes ? tProgramEditor.durationMaxMinutes : tProgramEditor.durationMax,
                stored: set.durationMaxSec,
                onCommit: rangeCommit(set, 'duration', 'max'),
              },
            );
          }
          if (mode === 'weight_reps' || mode === 'weight_time') {
            fields.push({
              spec: KG,
              label: tProgramEditor.weight,
              stored: set.weightKg,
              onCommit: (value) => {
                patchSet(set, { weightKg: value });
              },
            });
          }
          if (mode === 'assisted_reps') {
            fields.push({
              spec: { ...KG, field: 'assistKg', label: 'assistKg' },
              label: tProgramEditor.assist,
              stored: set.assistKg,
              onCommit: (value) => {
                patchSet(set, { assistKg: value });
              },
            });
          }
          if (mode === 'time_distance') {
            const metres = info?.distanceUnit === 'm';
            fields.push({
              spec: metres ? METERS : KM,
              label: metres ? tProgramEditor.distanceM : tProgramEditor.distanceKm,
              stored: set.distanceM,
              onCommit: (value) => {
                patchSet(set, { distanceM: value });
              },
            });
          }
          return (
            <li key={set.id} className="rounded-input bg-surface-2 p-3">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {set.type === 'drop' ? (
                  <span className="flex-1 text-sm font-semibold">
                    {tProgramEditor.setLabel(number)} · {tProgramEditor.setTypes.drop}
                  </span>
                ) : (
                  <span className="flex flex-1 items-center gap-2">
                    <span className="text-sm font-semibold">{tProgramEditor.setLabel(number)}</span>
                    <select
                      aria-label={tProgramEditor.setTypeLabel(number, name)}
                      value={set.type}
                      onChange={(event) => {
                        patchSet(set, { type: event.target.value as 'warmup' | 'working' });
                      }}
                      className="field min-h-10 py-1 pr-2 pl-2"
                    >
                      <option value="warmup">{tProgramEditor.setTypes.warmup}</option>
                      <option value="working">{tProgramEditor.setTypes.working}</option>
                    </select>
                  </span>
                )}
                {set.type === 'working' ? (
                  <Button
                    variant="quiet"
                    size="sm"
                    aria-label={tProgramEditor.addDropFor(number, name)}
                    onClick={() => void applyWeeks((all) => addDropSet(all, set.id, uuidv4))}
                  >
                    <Plus aria-hidden="true" className="size-4" />
                    {tProgramEditor.addDrop}
                  </Button>
                ) : null}
                <IconButton
                  label={tProgramEditor.removeSet(number, name)}
                  onClick={() =>
                    void applyWeeks((all) => removeSet(all, set.id), {
                      last: tProgramEditor.lastSet,
                    })
                  }
                >
                  <X aria-hidden="true" className="size-5" />
                </IconButton>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {fields.map((field) => (
                  <div key={field.label}>
                    <span aria-hidden="true" className="mb-1 block text-xs text-muted">
                      {field.label}
                    </span>
                    <ValueInput
                      spec={field.spec}
                      label={tProgramEditor.field(field.label, number, name)}
                      stored={field.stored}
                      suggestion={undefined}
                      format={format}
                      onCommit={commit(field.onCommit)}
                    />
                  </div>
                ))}
              </div>
            </li>
          );
        })}
      </ol>
      {invalid ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {tProgramEditor.invalidNumber}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          aria-label={tProgramEditor.addSetFor(name)}
          onClick={() => void applyWeeks((all) => addSet(all, exercise.id, 'working', uuidv4))}
        >
          <Plus aria-hidden="true" className="size-4" />
          {tProgramEditor.addWorking}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          aria-label={tProgramEditor.addWarmupFor(name)}
          onClick={() => void applyWeeks((all) => addSet(all, exercise.id, 'warmup', uuidv4))}
        >
          <Plus aria-hidden="true" className="size-4" />
          {tProgramEditor.addWarmup}
        </Button>
      </div>

      <div className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
        <SelectField
          label={tProgramEditor.restLabel}
          value={exercise.restSec === undefined ? '' : String(exercise.restSec)}
          options={[
            { value: '', label: tProgramEditor.restDefault(formatRest(restDefaultSec)) },
            ...restValues.map((value) => ({
              value: String(value),
              label: value === 0 ? tProgramEditor.restNone : formatRest(value),
            })),
          ]}
          onChange={(value) =>
            void applyWeeks((all) =>
              updateExercise(all, exercise.id, { restSec: value === '' ? null : Number(value) }),
            )
          }
        />
        <div>
          <label
            htmlFor={`notiz-${exercise.id}`}
            className="mb-2 block text-sm font-semibold text-muted"
          >
            {tProgramEditor.exerciseNotes}
          </label>
          <textarea
            id={`notiz-${exercise.id}`}
            rows={2}
            maxLength={2000}
            value={notes}
            onChange={(event) => {
              setNotes(event.target.value);
            }}
            onBlur={() => {
              if (notes.trim() !== (exercise.notes ?? '')) {
                void applyWeeks((all) => updateExercise(all, exercise.id, { notes }));
              }
            }}
            className={TEXTAREA}
          />
        </div>
      </div>
    </Card>
  );
}
