import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { t } from '@/shared/i18n/de';
import { Badge, Button, Dialog, SearchField, SelectField } from '@/shared/ui';
import { findAlternatives } from '../calc/alternatives';
import { buildSearchIndex, searchExercises } from '../calc/search';
import { useExercises } from '../data/customExercises';
import { CustomExerciseDialog } from './CustomExerciseDialog';
import type { Equipment, Exercise, Muscle } from '../model/exercise';
import { EQUIPMENT_OPTIONS, MUSCLE_OPTIONS, describeExercise } from './describe';
import { ExerciseThumb } from './ExerciseVisual';

export interface ExercisePickerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
  /** Beim Ersetzen: ID der bisherigen Übung; passende Alternativen stehen dann vorn (TP-12). */
  alternativesForId?: string;
}

/** Übung auswählen (S-39): Suche und Filter wie in der Bibliothek, als Blatt von unten. */
export function ExercisePicker({
  open,
  title,
  onClose,
  onSelect,
  alternativesForId,
}: ExercisePickerProps) {
  const all = useExercises();
  // Archivierte eigene Übungen erscheinen nicht in der Auswahl (AK-EXL-03).
  const exercises = useMemo(() => (all ?? []).filter((e) => !e.archivedAt), [all]);
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<Muscle | ''>('');
  const [equipment, setEquipment] = useState<Equipment | ''>('');
  const [creating, setCreating] = useState(false);
  const index = useMemo(() => buildSearchIndex(exercises), [exercises]);
  const results = useMemo(
    () =>
      searchExercises(index, {
        query,
        ...(muscle ? { muscle } : {}),
        ...(equipment ? { equipment } : {}),
      }),
    [index, query, muscle, equipment],
  );
  const alternatives = useMemo(() => {
    const original = alternativesForId
      ? exercises.find((exercise) => exercise.id === alternativesForId)
      : undefined;
    if (!original || query.trim() !== '') return [];
    return findAlternatives(exercises, original, {
      ...(equipment ? { equipment } : {}),
    }).filter((exercise) => !muscle || exercise.primaryMuscles.includes(muscle));
  }, [alternativesForId, exercises, query, muscle, equipment]);
  const renderList = (list: readonly Exercise[]) => (
    <ul className="divide-y divide-line overflow-hidden rounded-card bg-surface-2">
      {list.map((exercise) => (
        <li key={exercise.id}>
          <button
            type="button"
            onClick={() => {
              onSelect(exercise);
            }}
            className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left hover:bg-line"
          >
            {/* Vorschaubild links (D-397); die Liste liegt auf card-2, die Kachel auf card. */}
            <ExerciseThumb exerciseId={exercise.id} on="card-2" />
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{exercise.name}</span>
                {exercise.source === 'custom' ? (
                  <Badge tone="accent">{t.exercises.customBadge}</Badge>
                ) : null}
              </span>
              <span className="block text-sm text-muted">{describeExercise(exercise)}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
  return (
    <Dialog open={open} onClose={onClose} title={title} closeLabel={t.common.close} variant="sheet">
      <div className="mb-4 grid grid-cols-2 gap-x-3 gap-y-3">
        <div className="col-span-2">
          <SearchField
            label={t.exercises.searchLabel}
            placeholder={t.exercises.searchPlaceholder}
            clearLabel={t.exercises.clearSearch}
            value={query}
            onChange={setQuery}
          />
        </div>
        <SelectField
          label={t.exercises.muscleFilter}
          options={MUSCLE_OPTIONS}
          value={muscle}
          onChange={setMuscle}
        />
        <SelectField
          label={t.exercises.equipmentFilter}
          options={EQUIPMENT_OPTIONS}
          value={equipment}
          onChange={setEquipment}
        />
      </div>
      {alternatives.length > 0 ? (
        <section aria-labelledby="alternativen" className="mb-4">
          <h3 id="alternativen" className="eyebrow mb-1 text-muted">
            {t.exercises.alternatives}
          </h3>
          <p className="mb-2 text-sm text-muted">{t.exercises.alternativesHint}</p>
          {renderList(alternatives)}
        </section>
      ) : null}
      {alternatives.length > 0 ? (
        <h3 className="eyebrow mb-1 text-muted">{t.exercises.allExercises}</h3>
      ) : null}
      <p role="status" className="mb-2 text-sm text-muted">
        {exercises.length > 0 ? t.exercises.results(results.length) : ''}
      </p>
      {exercises.length > 0 && results.length === 0 ? (
        <p className="text-muted">{t.exercises.emptyText}</p>
      ) : (
        renderList(results)
      )}
      <Button
        variant="secondary"
        className="mt-4 w-full"
        onClick={() => {
          setCreating(true);
        }}
      >
        <Plus aria-hidden="true" className="size-5" />
        {query.trim() ? t.exercises.createCustomFrom(query.trim()) : t.exercises.createCustomEmpty}
      </Button>
      {creating ? (
        <CustomExerciseDialog
          initialName={query.trim()}
          onClose={() => {
            setCreating(false);
          }}
          onSaved={(exercise) => {
            setCreating(false);
            onSelect(exercise);
          }}
        />
      ) : null}
    </Dialog>
  );
}
