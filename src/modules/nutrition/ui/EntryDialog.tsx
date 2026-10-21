import { useId, useState } from 'react';
import { useFormatters } from '@/modules/settings';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { tNutrition } from '@/shared/i18n/de-nutrition';
import { parseDecimal } from '@/shared/lib/format';
import { Button, Dialog, SelectField } from '@/shared/ui';
import { MEAL_SLOTS, type FoodLogEntry, type MealSlot } from '../model/nutrition';
import { changeEntry, deleteEntry } from '../service/nutritionService';
import { describeAmount, entryNameAndBrand } from './format';
import { NutrientTable } from './NutrientTable';

const INPUT = 'field w-full min-w-0';

/** Eintrag bearbeiten (NU-15): Menge bzw. Portionen, Mahlzeit, Löschen. */
export function EntryDialog({
  entry,
  onClose,
  onDeleted,
  brandOf,
}: {
  entry: FoodLogEntry;
  /** Marke älterer Einträge aus den importierten Lebensmitteldaten (D-278). */
  brandOf?: (foodId: string) => string | undefined;
  onClose: () => void;
  onDeleted: (entry: FoodLogEntry) => void;
}) {
  const rt = useDb();
  const fmt = useFormatters();
  const id = useId();
  const shown = entryNameAndBrand(entry, brandOf);
  const byServing = entry.servingSnapshot !== undefined;
  // Ohne Tausendertrennung, weil parseDecimal keine liest (D-291).
  const initialText =
    entry.amount === undefined
      ? ''
      : fmt.number(byServing ? (entry.servingSnapshot?.count ?? 1) : entry.amount, {
          maximumFractionDigits: 2,
          useGrouping: false,
        });
  const [value, setValue] = useState(initialText);
  const [slot, setSlot] = useState<MealSlot>(entry.slot);
  const [error, setError] = useState<string | null>(null);
  const unit = tNutrition.units[entry.basisSnapshot ?? 'g'];

  const save = () => {
    setError(null);
    const change: Parameters<typeof changeEntry>[2] = { slot };
    // Eine unveränderte Eingabe bleibt außen vor, sonst würde die gerundete Anzeige
    // (etwa 0,33 statt eines Drittels) die Menge verschieben (D-291).
    if (entry.amount !== undefined && value.trim() !== initialText) {
      const parsed = parseDecimal(value);
      if (parsed === null || parsed <= 0) {
        setError(tNutrition.invalidAmount);
        return;
      }
      if (byServing) change.servingCount = parsed;
      else change.amount = parsed;
    }
    changeEntry(rt, entry.id, change).then(onClose, (caught: unknown) => {
      setError(tNutrition.saveFailed);
      void logError(rt.db, { area: 'nutrition', error: caught, route: window.location.pathname });
    });
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={shown.name}
      closeLabel={t.common.close}
      actions={
        <>
          <Button
            variant="danger"
            onClick={() => {
              deleteEntry(rt, entry.id).then(
                () => {
                  onDeleted(entry);
                },
                (caught: unknown) => {
                  setError(tNutrition.saveFailed);
                  void logError(rt.db, {
                    area: 'nutrition',
                    error: caught,
                    route: window.location.pathname,
                  });
                },
              );
            }}
          >
            {tNutrition.delete}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            {tNutrition.cancel}
          </Button>
          <Button type="submit" form={`${id}-form`}>
            {tNutrition.save}
          </Button>
        </>
      }
    >
      <form
        id={`${id}-form`}
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        {shown.brand ? <p className="-mt-2 text-muted">{shown.brand}</p> : null}
        {entry.amount !== undefined ? (
          <div>
            <label htmlFor={`${id}-menge`} className="mb-2 block text-sm font-semibold text-muted">
              {byServing
                ? `${tNutrition.servingsLabel} (${entry.servingSnapshot?.name ?? ''})`
                : tNutrition.amountLabel(unit)}
            </label>
            <input
              id={`${id}-menge`}
              inputMode="decimal"
              autoComplete="off"
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
              }}
              className={INPUT}
            />
          </div>
        ) : null}
        <SelectField
          label={tNutrition.slotLabel}
          value={slot}
          options={MEAL_SLOTS.map((s) => ({ value: s, label: tNutrition.slots[s] }))}
          onChange={setSlot}
        />
        <NutrientTable
          caption={
            entry.amount === undefined
              ? tNutrition.nutrientsTitle
              : `${tNutrition.nutrientsTitle} ${tNutrition.forAmount(describeAmount(fmt, entry))}`
          }
          columns={[{ label: tNutrition.nutrientsTitle, values: entry.nutrients }]}
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
