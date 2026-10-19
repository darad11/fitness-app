import { useId, useState } from 'react';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { Button, Dialog, SelectField, Switch } from '@/shared/ui';
import { findSameName } from '../calc/names';
import { useExercises } from '../data/customExercises';
import {
  DISTANCE_UNITS,
  EQUIPMENT,
  MUSCLES,
  TRACKING_MODES,
  type DistanceUnit,
  type Equipment,
  type Exercise,
  type Muscle,
  type TrackingMode,
} from '../model/exercise';
import {
  createCustomExercise,
  InvalidExerciseError,
  updateCustomExercise,
} from '../service/exerciseService';

export interface CustomExerciseDialogProps {
  /** Ohne Übung: neu anlegen. */
  exercise?: Exercise;
  /** Vorschlag für den Namen, z. B. der Suchtext. */
  initialName?: string;
  onClose: () => void;
  onSaved: (exercise: Exercise) => void;
}

const MUSCLE_CHOICES = MUSCLES.map((value) => ({ value, label: t.exercises.muscles[value] }));
const EQUIPMENT_CHOICES = EQUIPMENT.map((value) => ({
  value,
  label: t.exercises.equipment[value],
}));
const TRACKING_CHOICES = TRACKING_MODES.map((value) => ({
  value,
  label: t.session.trackingModes[value],
}));

/** Eigene Übung anlegen oder bearbeiten (S-14, AK-EXL-03, D-258). */
export function CustomExerciseDialog({
  exercise,
  initialName,
  onClose,
  onSaved,
}: CustomExerciseDialogProps) {
  const rt = useDb();
  const all = useExercises();
  const nameId = useId();
  const [name, setName] = useState(exercise?.name ?? initialName ?? '');
  const [primary, setPrimary] = useState<Muscle>(exercise?.primaryMuscles[0] ?? 'chest');
  const [secondary, setSecondary] = useState<Muscle | ''>(exercise?.secondaryMuscles[0] ?? '');
  const [equipment, setEquipment] = useState<Equipment>(exercise?.equipment[0] ?? 'machine');
  const [mode, setMode] = useState<TrackingMode>(exercise?.trackingMode ?? 'weight_reps');
  const [unilateral, setUnilateral] = useState(exercise?.isUnilateral === true);
  const [unit, setUnit] = useState<DistanceUnit>(exercise?.distanceUnit ?? 'km');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const same = all ? findSameName(all, name, exercise?.id) : undefined;

  const submit = () => {
    setBusy(true);
    setError(null);
    const input = {
      name,
      primaryMuscles: [primary],
      secondaryMuscles: secondary && secondary !== primary ? [secondary] : [],
      equipment: [equipment],
      trackingMode: mode,
      isUnilateral: unilateral,
      distanceUnit: unit,
    };
    (exercise ? updateCustomExercise(rt, exercise.id, input) : createCustomExercise(rt, input))
      .then(onSaved)
      .catch((caught: unknown) => {
        if (caught instanceof InvalidExerciseError) {
          setError(t.exercises.errors[caught.reason]);
        } else {
          setError(t.exercises.saveFailed);
          void logError(rt.db, {
            area: 'exercises',
            error: caught,
            route: window.location.pathname,
          });
        }
      })
      .finally(() => {
        setBusy(false);
      });
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={exercise ? t.exercises.editTitle : t.exercises.createTitle}
      closeLabel={t.common.close}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t.exercises.cancel}
          </Button>
          <Button type="submit" form="eigene-uebung" disabled={busy}>
            {exercise ? t.exercises.save : t.exercises.create}
          </Button>
        </>
      }
    >
      <form
        id="eigene-uebung"
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div>
          <label htmlFor={nameId} className="mb-2 block text-sm font-semibold text-muted">
            {t.exercises.nameLabel}
          </label>
          <input
            id={nameId}
            required
            maxLength={80}
            autoComplete="off"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
            }}
            className="h-12 w-full rounded-input border border-line bg-surface px-3 text-base text-fg"
          />
          {same ? (
            <p role="status" className="mt-2 text-sm text-muted">
              {t.exercises.sameName(same.name)}
            </p>
          ) : null}
        </div>
        <SelectField
          label={t.exercises.primaryLabel}
          options={MUSCLE_CHOICES}
          value={primary}
          onChange={setPrimary}
        />
        <SelectField
          label={t.exercises.secondaryLabel}
          options={[
            { value: '' as const, label: t.exercises.noneOption },
            ...MUSCLE_CHOICES.filter((choice) => choice.value !== primary),
          ]}
          value={secondary === primary ? '' : secondary}
          onChange={setSecondary}
        />
        <SelectField
          label={t.exercises.equipmentLabel}
          options={EQUIPMENT_CHOICES}
          value={equipment}
          onChange={setEquipment}
        />
        <SelectField
          label={t.exercises.trackingLabel}
          hint={t.exercises.trackingHint}
          options={TRACKING_CHOICES}
          value={mode}
          onChange={setMode}
        />
        {mode === 'time_distance' ? (
          <SelectField
            label={t.exercises.distanceUnitLabel}
            options={DISTANCE_UNITS.map((value) => ({
              value,
              label: t.exercises.distanceUnits[value],
            }))}
            value={unit}
            onChange={setUnit}
          />
        ) : null}
        <Switch
          label={t.exercises.unilateralLabel}
          hint={t.exercises.unilateralHint}
          checked={unilateral}
          onChange={setUnilateral}
        />
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}
