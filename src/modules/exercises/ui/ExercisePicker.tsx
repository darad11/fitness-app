import { useEffect, useMemo, useState } from 'react';
import { t } from '@/shared/i18n/de';
import { Dialog, SearchField, SelectField } from '@/shared/ui';
import { buildSearchIndex, searchExercises } from '../calc/search';
import { loadCoreExercises } from '../data/coreLibrary';
import type { Equipment, Exercise, Muscle } from '../model/exercise';
import { EQUIPMENT_OPTIONS, MUSCLE_OPTIONS, describeExercise } from './ExerciseLibraryPage';

export interface ExercisePickerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}

/** Übung auswählen (S-39): Suche und Filter wie in der Bibliothek, als Blatt von unten. */
export function ExercisePicker({ open, title, onClose, onSelect }: ExercisePickerProps) {
  const [exercises, setExercises] = useState<readonly Exercise[]>([]);
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<Muscle | ''>('');
  const [equipment, setEquipment] = useState<Equipment | ''>('');
  useEffect(() => {
    if (!open) return;
    let active = true;
    void loadCoreExercises().then((list) => {
      if (active) setExercises(list);
    });
    return () => {
      active = false;
    };
  }, [open]);
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
  return (
    <Dialog open={open} onClose={onClose} title={title} closeLabel={t.common.close} variant="sheet">
      <div className="mb-4 grid grid-cols-2 gap-x-3 gap-y-4">
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
      <p role="status" className="mb-2 text-sm text-muted">
        {exercises.length > 0 ? t.exercises.results(results.length) : ''}
      </p>
      {exercises.length > 0 && results.length === 0 ? (
        <p className="text-muted">{t.exercises.emptyText}</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line">
          {results.map((exercise) => (
            <li key={exercise.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(exercise);
                }}
                className="block min-h-12 w-full px-4 py-3 text-left hover:bg-surface-2"
              >
                <span className="block font-medium">{exercise.name}</span>
                <span className="block text-sm text-muted">{describeExercise(exercise)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
