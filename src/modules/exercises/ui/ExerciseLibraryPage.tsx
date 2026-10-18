import { useMemo } from 'react';
import { useLoaderData, useSearchParams } from 'react-router';
import { t } from '@/shared/i18n/de';
import { Button, PageHeader, SearchField, SelectField, type SelectOption } from '@/shared/ui';
import { buildSearchIndex, compareExerciseNames, searchExercises } from '../calc/search';
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

const MUSCLE_OPTIONS: readonly SelectOption<Muscle | ''>[] = [
  { value: '', label: t.exercises.all },
  ...MUSCLES.map((muscle) => ({ value: muscle, label: t.exercises.muscles[muscle] })),
];
const EQUIPMENT_OPTIONS: readonly SelectOption<Equipment | ''>[] = [
  { value: '', label: t.exercises.all },
  ...EQUIPMENT.map((item) => ({ value: item, label: t.exercises.equipment[item] })),
];

/** Suche und Filter stehen in der Adresse, damit „Zurück" sie erhält. */
const PARAM = { query: 'q', muscle: 'muskel', equipment: 'geraet' } as const;

export function ExerciseLibraryPage() {
  const exercises = useLoaderData<readonly Exercise[]>();
  const index = useMemo(() => buildSearchIndex(exercises), [exercises]);
  const [params, setParams] = useSearchParams();
  const query = params.get(PARAM.query) ?? '';
  const muscle = muscleSchema.safeParse(params.get(PARAM.muscle)).data;
  const equipment = equipmentSchema.safeParse(params.get(PARAM.equipment)).data;
  const filtered = query.trim() !== '' || muscle !== undefined || equipment !== undefined;
  const results = useMemo(
    () => searchExercises(index, { query, muscle, equipment }),
    [index, query, muscle, equipment],
  );

  function update(key: string, value: string) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );
  }

  return (
    <>
      <PageHeader
        title={t.exercises.title}
        subtitle={t.exercises.count(exercises.length)}
        back={{ to: '/training', label: t.training.title }}
      />
      <div
        role="search"
        className="mb-6 grid grid-cols-2 gap-x-3 gap-y-4 md:grid-cols-[2fr_1fr_1fr]"
      >
        <div className="col-span-2 md:col-span-1">
          <SearchField
            label={t.exercises.searchLabel}
            placeholder={t.exercises.searchPlaceholder}
            clearLabel={t.exercises.clearSearch}
            value={query}
            onChange={(value) => {
              update(PARAM.query, value);
            }}
          />
        </div>
        <SelectField
          label={t.exercises.muscleFilter}
          options={MUSCLE_OPTIONS}
          value={muscle ?? ''}
          onChange={(value) => {
            update(PARAM.muscle, value);
          }}
        />
        <SelectField
          label={t.exercises.equipmentFilter}
          options={EQUIPMENT_OPTIONS}
          value={equipment ?? ''}
          onChange={(value) => {
            update(PARAM.equipment, value);
          }}
        />
      </div>
      <p role="status" className="sr-only">
        {filtered ? t.exercises.results(results.length) : ''}
      </p>
      {!filtered ? (
        <GroupedList exercises={exercises} />
      ) : results.length > 0 ? (
        <>
          <p aria-hidden="true" className="mb-2 text-sm text-muted">
            {t.exercises.results(results.length)}
          </p>
          <ExerciseList exercises={results} label={t.exercises.results(results.length)} />
        </>
      ) : (
        <div className="rounded-card border border-line bg-surface p-6 text-center">
          <h2 className="text-lg font-semibold">{t.exercises.emptyTitle}</h2>
          <p className="mt-1 mb-4 text-muted">{t.exercises.emptyText}</p>
          <Button
            variant="secondary"
            onClick={() => {
              setParams(new URLSearchParams(), { replace: true });
            }}
          >
            {t.exercises.reset}
          </Button>
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
  return (
    <div className="grid gap-6">
      {groups.map(({ group, items }) => (
        <section key={group} aria-labelledby={`gruppe-${group}`}>
          <h2 id={`gruppe-${group}`} className="mb-2 text-lg font-semibold">
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
      className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface"
    >
      {exercises.map((exercise) => (
        <li key={exercise.id} className="min-h-12 px-4 py-3">
          <p className="font-medium">{exercise.name}</p>
          <p className="text-sm text-muted">{describe(exercise)}</p>
        </li>
      ))}
    </ul>
  );
}

function describe(exercise: Exercise): string {
  const muscles = exercise.primaryMuscles.map((m) => t.exercises.muscles[m]).join(', ');
  const equipment = exercise.equipment.map((e) => t.exercises.equipment[e]).join(', ');
  const parts = [muscles, equipment];
  if (exercise.isUnilateral) parts.push(t.exercises.unilateral);
  return parts.join(' · ');
}
