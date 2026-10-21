import { Plus, Trash2 } from 'lucide-react';
import { Suspense, useState } from 'react';
import { useNavigate } from 'react-router';
import { ExercisePicker, type Exercise } from '@/modules/exercises';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { parseDecimal } from '@/shared/lib/format';
import { Button, Card, IconButton, PageHeader, SegmentedControl, SelectField } from '@/shared/ui';
import { fieldsFor, toStored, type FieldSpec } from '../calc/fields';
import { ACTIVITY_TYPES, type ActivityType, type SetValues } from '../model/session';
import { InvalidLogError, logActivity, logStrength } from '../service/logService';

type Mode = 'strength' | 'activity';

const INPUT = 'field w-full min-w-0';

function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Vorbelegung: vor einer Stunde, auf Viertelstunden gerundet. */
function defaultStart(): string {
  const date = new Date(Date.now() - 60 * 60 * 1000);
  date.setMinutes(Math.floor(date.getMinutes() / 15) * 15, 0, 0);
  return toLocalInput(date);
}

function messageFor(error: unknown): string {
  if (error instanceof InvalidLogError) return t.log.errors[error.reason];
  return t.log.saveFailed;
}

/** Nachtragen (S-10, AK-TRN-23): Krafttraining ohne Timer oder Aktivität mit Dauer und Distanz. */
export function LogPage() {
  const [mode, setMode] = useState<Mode>('strength');
  return (
    <>
      <PageHeader title={t.log.title} back={{ to: '/training', label: t.training.title }} />
      <div className="mb-4">
        <SegmentedControl
          legend={t.log.modeLegend}
          options={[
            { value: 'strength', label: t.log.modeStrength },
            { value: 'activity', label: t.log.modeActivity },
          ]}
          value={mode}
          onChange={setMode}
        />
      </div>
      {mode === 'strength' ? <StrengthForm /> : <ActivityForm />}
    </>
  );
}

function ActivityForm() {
  const rt = useDb();
  const navigate = useNavigate();
  const [type, setType] = useState<ActivityType>('run');
  const [when, setWhen] = useState(defaultStart);
  const [minutes, setMinutes] = useState('');
  const [distance, setDistance] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const typeOptions = ACTIVITY_TYPES.map((value) => ({ value, label: t.log.activityTypes[value] }));

  const submit = async () => {
    const duration = parseDecimal(minutes);
    const km = distance.trim() ? parseDecimal(distance) : null;
    if (duration === null || duration <= 0) {
      setError(t.log.errors.duration);
      return;
    }
    if (distance.trim() && (km === null || km < 0)) {
      setError(t.log.errors.values);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const session = await logActivity(
        rt,
        {
          type,
          startedAt: new Date(when),
          durationSec: Math.round(duration * 60),
          ...(km !== null && distance.trim() ? { distanceM: Math.round(km * 1000) } : {}),
          notes,
        },
        t.log.activityTypes[type],
      );
      void navigate(`/training/verlauf/${session.id}`);
    } catch (caught) {
      if (!(caught instanceof InvalidLogError)) {
        void logError(rt.db, { area: 'training', error: caught, route: '/training/nachtragen' });
      }
      setError(messageFor(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title={t.log.modeActivity}>
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <SelectField
          label={t.log.activityType}
          options={typeOptions}
          value={type}
          onChange={setType}
        />
        <Field id="aktivitaet-zeit" label={t.log.start}>
          <input
            id="aktivitaet-zeit"
            type="datetime-local"
            value={when}
            onChange={(e) => {
              setWhen(e.target.value);
            }}
            className={INPUT}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field id="aktivitaet-dauer" label={t.log.durationMin}>
            <input
              id="aktivitaet-dauer"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={minutes}
              onChange={(e) => {
                setMinutes(e.target.value);
              }}
              className={INPUT}
            />
          </Field>
          <Field id="aktivitaet-distanz" label={t.log.distanceKm}>
            <input
              id="aktivitaet-distanz"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={distance}
              onChange={(e) => {
                setDistance(e.target.value);
              }}
              className={INPUT}
            />
          </Field>
        </div>
        <Field id="aktivitaet-notiz" label={t.log.notes}>
          <textarea
            id="aktivitaet-notiz"
            rows={2}
            maxLength={5000}
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
            }}
            className="field w-full"
          />
        </Field>
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={busy} className="md:justify-self-start">
          {t.log.save}
        </Button>
      </form>
    </Card>
  );
}

interface DraftSet {
  key: number;
  type: 'warmup' | 'working';
  values: Record<string, string>;
}
interface DraftExercise {
  key: number;
  exercise: Exercise;
  sets: DraftSet[];
}

let nextKey = 1;

function StrengthForm() {
  const rt = useDb();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [when, setWhen] = useState(defaultStart);
  const [minutes, setMinutes] = useState('');
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState<DraftExercise[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const update = (key: number, change: (draft: DraftExercise) => DraftExercise) => {
    setExercises((all) => all.map((draft) => (draft.key === key ? change(draft) : draft)));
  };
  const newSet = (type: DraftSet['type'] = 'working'): DraftSet => ({
    key: nextKey++,
    type,
    values: {},
  });

  const submit = async () => {
    const duration = parseDecimal(minutes);
    if (duration === null || duration <= 0) {
      setError(t.log.errors.duration);
      return;
    }
    try {
      const input = exercises.map((draft) => ({
        exerciseId: draft.exercise.id,
        name: draft.exercise.name,
        trackingMode: draft.exercise.trackingMode,
        ...(draft.exercise.distanceUnit ? { distanceUnit: draft.exercise.distanceUnit } : {}),
        ...(draft.exercise.isUnilateral ? { perSide: true } : {}),
        sets: draft.sets.map((set) => {
          const values: SetValues = {};
          for (const spec of fieldsFor(draft.exercise.trackingMode, draft.exercise.distanceUnit)) {
            const text = set.values[spec.label] ?? '';
            if (!text.trim()) continue;
            const parsed = parseDecimal(text);
            if (parsed === null) throw new InvalidLogError('values');
            values[spec.field] = toStored(spec, parsed);
          }
          return { type: set.type, values };
        }),
      }));
      setBusy(true);
      setError(null);
      const session = await logStrength(rt, {
        title: title.trim() || t.log.defaultTitle,
        startedAt: new Date(when),
        durationSec: Math.round(duration * 60),
        notes,
        exercises: input,
      });
      void navigate(`/training/verlauf/${session.id}`);
    } catch (caught) {
      if (!(caught instanceof InvalidLogError)) {
        void logError(rt.db, { area: 'training', error: caught, route: '/training/nachtragen' });
      }
      setError(messageFor(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <Card title={t.log.modeStrength}>
        <div className="grid gap-4">
          <Field id="kraft-titel" label={t.log.titleLabel}>
            <input
              id="kraft-titel"
              type="text"
              maxLength={200}
              placeholder={t.log.defaultTitle}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
              }}
              className={INPUT}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id="kraft-zeit" label={t.log.start}>
              <input
                id="kraft-zeit"
                type="datetime-local"
                value={when}
                onChange={(e) => {
                  setWhen(e.target.value);
                }}
                className={INPUT}
              />
            </Field>
            <Field id="kraft-dauer" label={t.log.durationMin}>
              <input
                id="kraft-dauer"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={minutes}
                onChange={(e) => {
                  setMinutes(e.target.value);
                }}
                className={INPUT}
              />
            </Field>
          </div>
          <Field id="kraft-notiz" label={t.log.notes}>
            <textarea
              id="kraft-notiz"
              rows={2}
              maxLength={5000}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
              }}
              className="field w-full"
            />
          </Field>
        </div>
      </Card>

      {exercises.map((draft) => {
        const specs = fieldsFor(draft.exercise.trackingMode, draft.exercise.distanceUnit);
        let working = 0;
        let warmup = 0;
        return (
          <Card
            key={draft.key}
            title={draft.exercise.name}
            action={
              <IconButton
                label={`${t.session.removeExercise}, ${draft.exercise.name}`}
                onClick={() => {
                  setExercises((all) => all.filter((d) => d.key !== draft.key));
                }}
              >
                <Trash2 aria-hidden="true" className="size-5" />
              </IconButton>
            }
          >
            <ol className="grid gap-2">
              {draft.sets.map((set) => {
                const ordinal = set.type === 'working' ? ++working : ++warmup;
                const name = `${draft.exercise.name}, ${t.session.setLabel(t.session.setTypeLabel[set.type], ordinal)}`;
                return (
                  <li key={set.key} className="flex items-center gap-2">
                    <span
                      className="w-8 shrink-0 text-sm font-semibold text-muted tabular-nums"
                      aria-hidden="true"
                    >
                      {set.type === 'warmup' ? t.session.setTypeShort.warmup : String(ordinal)}
                    </span>
                    <div
                      className={
                        specs.length === 2
                          ? 'grid min-w-0 flex-1 grid-cols-2 gap-2'
                          : 'grid min-w-0 flex-1 gap-2'
                      }
                    >
                      {specs.map((spec: FieldSpec) => (
                        <input
                          key={spec.label}
                          type="text"
                          inputMode={spec.decimals ? 'decimal' : 'numeric'}
                          autoComplete="off"
                          aria-label={`${t.session.fields[spec.label]}, ${name}`}
                          placeholder={t.session.units[spec.label]}
                          value={set.values[spec.label] ?? ''}
                          onChange={(event) => {
                            update(draft.key, (d) => ({
                              ...d,
                              sets: d.sets.map((s) =>
                                s.key === set.key
                                  ? {
                                      ...s,
                                      values: { ...s.values, [spec.label]: event.target.value },
                                    }
                                  : s,
                              ),
                            }));
                          }}
                          className={INPUT}
                        />
                      ))}
                    </div>
                    <IconButton
                      label={`${t.session.removeSet}, ${name}`}
                      onClick={() => {
                        update(draft.key, (d) => ({
                          ...d,
                          sets: d.sets.filter((s) => s.key !== set.key),
                        }));
                      }}
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                    </IconButton>
                  </li>
                );
              })}
            </ol>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="quiet"
                size="sm"
                onClick={() => {
                  update(draft.key, (d) => ({ ...d, sets: [...d.sets, newSet()] }));
                }}
              >
                <Plus aria-hidden="true" className="size-4" />
                {t.session.addSet}
              </Button>
              <Button
                type="button"
                variant="quiet"
                size="sm"
                onClick={() => {
                  update(draft.key, (d) => ({ ...d, sets: [newSet('warmup'), ...d.sets] }));
                }}
              >
                <Plus aria-hidden="true" className="size-4" />
                {t.session.addWarmup}
              </Button>
            </div>
          </Card>
        );
      })}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setPickerOpen(true);
          }}
        >
          <Plus aria-hidden="true" className="size-5" />
          {t.session.addExercise}
        </Button>
        <Button type="submit" disabled={busy || exercises.length === 0}>
          {t.log.save}
        </Button>
      </div>
      {exercises.length === 0 ? <p className="text-sm text-muted">{t.log.noExercises}</p> : null}
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
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
              setExercises((all) => [
                ...all,
                { key: nextKey++, exercise, sets: [newSet(), newSet(), newSet()] },
              ]);
            }}
          />
        </Suspense>
      ) : null}
    </form>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}
