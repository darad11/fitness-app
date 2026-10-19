import { ChevronRight, Plus } from 'lucide-react';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { t } from '@/shared/i18n/de';
import {
  Badge,
  Button,
  PageHeader,
  SearchField,
  SelectField,
  Skeleton,
  type SelectOption,
} from '@/shared/ui';
import { buildSearchIndex, compareExerciseNames, searchExercises } from '../calc/search';
import { useExercises } from '../data/customExercises';

const CustomExerciseDialog = lazy(async () => ({
  default: (await import('./CustomExerciseDialog')).CustomExerciseDialog,
}));
import {
  EQUIPMENT,
  EXERCISE_GROUPS,
  MUSCLES,
  equipmentSchema,
  muscleSchema,
  type Equipment,
  type Exercise,
  type Muscle,
} from '../model/exercise';

export const MUSCLE_OPTIONS: readonly SelectOption<Muscle | ''>[] = [
  { value: '', label: t.exercises.all },
  ...MUSCLES.map((muscle) => ({ value: muscle, label: t.exercises.muscles[muscle] })),
];
export const EQUIPMENT_OPTIONS: readonly SelectOption<Equipment | ''>[] = [
  { value: '', label: t.exercises.all },
  ...EQUIPMENT.map((item) => ({ value: item, label: t.exercises.equipment[item] })),
];

/** Suche und Filter stehen in der Adresse, damit „Zurück" und Neuladen sie erhalten (D-242). */
const PARAM = { query: 'q', muscle: 'muskel', equipment: 'geraet' } as const;

interface LibraryFilter {
  query: string;
  muscle?: Muscle;
  equipment?: Equipment;
}

const EMPTY_FILTER: LibraryFilter = { query: '' };

function readFilter(params: URLSearchParams): LibraryFilter {
  return {
    query: params.get(PARAM.query) ?? '',
    muscle: muscleSchema.safeParse(params.get(PARAM.muscle)).data,
    equipment: equipmentSchema.safeParse(params.get(PARAM.equipment)).data,
  };
}

function writeFilter({ query, muscle, equipment }: LibraryFilter): URLSearchParams {
  const params = new URLSearchParams();
  if (query) params.set(PARAM.query, query);
  if (muscle) params.set(PARAM.muscle, muscle);
  if (equipment) params.set(PARAM.equipment, equipment);
  return params;
}

/** Übungsbibliothek (S-12) mit eigenen Übungen (AK-EXL-03, D-258). */
export function ExerciseLibraryPage() {
  const all = useExercises();
  if (all === undefined) {
    return (
      <div aria-busy="true" className="grid gap-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  return <Library all={all} />;
}

function Library({ all }: { all: readonly Exercise[] }) {
  const navigate = useNavigate();
  const [creating, setCreating] = useState<{ name?: string } | null>(null);
  const exercises = useMemo(() => all.filter((exercise) => !exercise.archivedAt), [all]);
  const archived = useMemo(
    () => all.filter((exercise) => exercise.archivedAt).sort(compareExerciseNames),
    [all],
  );
  const index = useMemo(() => buildSearchIndex(exercises), [exercises]);
  const [params, setParams] = useSearchParams();
  // Die Seite hält Suche und Filter selbst und schreibt sie nur in die Adresse. So geht bei schnell
  // aufeinanderfolgenden Änderungen nichts verloren, auch wenn der Router die Adresse verzögert
  // übernimmt, und das Tippen reagiert sofort.
  const [filter, setFilter] = useState(() => readFilter(params));
  useEffect(() => {
    const next = writeFilter(filter);
    if (next.toString() !== params.toString()) setParams(next, { replace: true });
  }, [filter, params, setParams]);

  const { query, muscle, equipment } = filter;
  const filtered = query.trim() !== '' || muscle !== undefined || equipment !== undefined;
  const results = useMemo(
    () => searchExercises(index, { query, muscle, equipment }),
    [index, query, muscle, equipment],
  );

  return (
    <>
      <PageHeader
        title={t.exercises.title}
        subtitle={t.exercises.count(exercises.length)}
        back={{ to: '/training', label: t.training.title }}
      />
      <Button
        variant="secondary"
        className="mb-4"
        onClick={() => {
          setCreating({});
        }}
      >
        <Plus aria-hidden="true" className="size-5" />
        {t.exercises.createCustom}
      </Button>
      {creating ? (
        <Suspense fallback={null}>
          <CustomExerciseDialog
            initialName={creating.name}
            onClose={() => {
              setCreating(null);
            }}
            onSaved={(exercise) => {
              setCreating(null);
              void navigate(`/uebungen/${exercise.id}`);
            }}
          />
        </Suspense>
      ) : null}
      <div
        role="search"
        className="mb-6 grid grid-cols-2 gap-x-3 gap-y-3 md:grid-cols-[2fr_1fr_1fr]"
      >
        <div className="col-span-2 md:col-span-1">
          <SearchField
            label={t.exercises.searchLabel}
            placeholder={t.exercises.searchPlaceholder}
            clearLabel={t.exercises.clearSearch}
            value={query}
            onChange={(value) => {
              setFilter((current) => ({ ...current, query: value }));
            }}
          />
        </div>
        <SelectField
          label={t.exercises.muscleFilter}
          options={MUSCLE_OPTIONS}
          value={muscle ?? ''}
          onChange={(value) => {
            setFilter((current) => ({ ...current, muscle: value || undefined }));
          }}
        />
        <SelectField
          label={t.exercises.equipmentFilter}
          options={EQUIPMENT_OPTIONS}
          value={equipment ?? ''}
          onChange={(value) => {
            setFilter((current) => ({ ...current, equipment: value || undefined }));
          }}
        />
      </div>
      <p role="status" className="sr-only">
        {filtered ? t.exercises.results(results.length) : ''}
      </p>
      {!filtered ? (
        <>
          <GroupedList exercises={exercises} />
          {archived.length > 0 ? (
            <details className="mt-6">
              <summary className="eyebrow cursor-pointer py-2 text-muted">
                {t.exercises.archivedTitle(archived.length)}
              </summary>
              <p className="mt-2 mb-3 text-sm text-muted">{t.exercises.archivedHint}</p>
              <ExerciseList
                exercises={archived}
                label={t.exercises.archivedTitle(archived.length)}
              />
            </details>
          ) : null}
        </>
      ) : results.length > 0 ? (
        <>
          <p aria-hidden="true" className="mb-2 text-sm text-muted">
            {t.exercises.results(results.length)}
          </p>
          <ExerciseList exercises={results} label={t.exercises.results(results.length)} />
        </>
      ) : (
        <div className="rounded-card bg-surface p-6 text-center shadow-card">
          <h2 className="text-lg font-semibold">{t.exercises.emptyTitle}</h2>
          <p className="mt-1 mb-4 text-muted">{t.exercises.emptyText}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setFilter(EMPTY_FILTER);
              }}
            >
              {t.exercises.reset}
            </Button>
            {query.trim() ? (
              <Button
                onClick={() => {
                  setCreating({ name: query.trim() });
                }}
              >
                <Plus aria-hidden="true" className="size-5" />
                {t.exercises.createCustomFrom(query.trim())}
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}

function GroupedList({ exercises }: { exercises: readonly Exercise[] }) {
  const groups = useMemo(
    () =>
      EXERCISE_GROUPS.map((group) => ({
        group,
        items: exercises.filter((exercise) => exercise.group === group).sort(compareExerciseNames),
      })).filter(({ items }) => items.length > 0),
    [exercises],
  );
  const custom = useMemo(
    () => exercises.filter((exercise) => exercise.source === 'custom').sort(compareExerciseNames),
    [exercises],
  );
  return (
    <div className="grid gap-6">
      {custom.length > 0 ? (
        <section aria-labelledby="gruppe-eigene">
          <h2 id="gruppe-eigene" className="eyebrow mb-2 text-muted">
            {t.exercises.customTitle}
          </h2>
          <ExerciseList exercises={custom} label={t.exercises.customTitle} />
        </section>
      ) : null}
      {groups.map(({ group, items }) => (
        <section key={group} aria-labelledby={`gruppe-${group}`}>
          <h2 id={`gruppe-${group}`} className="eyebrow mb-2 text-muted">
            {t.exercises.groups[group]}
          </h2>
          <ExerciseList exercises={items} label={t.exercises.groups[group]} />
        </section>
      ))}
    </div>
  );
}

function ExerciseList({ exercises, label }: { exercises: readonly Exercise[]; label: string }) {
  return (
    <ul
      aria-label={label}
      className="divide-y divide-line overflow-hidden rounded-card bg-surface shadow-card"
    >
      {exercises.map((exercise) => (
        <li key={exercise.id}>
          <Link
            to={`/uebungen/${exercise.id}`}
            className="flex min-h-14 items-center gap-3 px-5 py-3 hover:bg-surface-2"
          >
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{exercise.name}</span>
                {exercise.source === 'custom' ? (
                  <Badge tone="accent">{t.exercises.customBadge}</Badge>
                ) : null}
              </span>
              <span className="block text-sm text-muted">{describeExercise(exercise)}</span>
            </span>
            <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function describeExercise(exercise: Exercise): string {
  const muscles = exercise.primaryMuscles.map((m) => t.exercises.muscles[m]).join(', ');
  const equipment = exercise.equipment.map((e) => t.exercises.equipment[e]).join(', ');
  const parts = [muscles, equipment];
  if (exercise.isUnilateral) parts.push(t.exercises.unilateral);
  return parts.join(' · ');
}
