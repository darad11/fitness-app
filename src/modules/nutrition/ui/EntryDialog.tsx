import { useId, useState } from 'react';
import { useFormatters } from '@/modules/settings';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { parseDecimal } from '@/shared/lib/format';
import { Button, Dialog, SelectField } from '@/shared/ui';
import { MEAL_SLOTS, type FoodLogEntry, type MealSlot } from '../model/nutrition';
import { changeEntry, deleteEntry } from '../service/nutritionService';

const INPUT =
  'h-12 w-full rounded-input border border-line bg-surface px-3 text-base text-fg tabular-nums';

/** Eintrag bearbeiten (NU-15): Menge bzw. Portionen, Mahlzeit, Löschen. */
export function EntryDialog({
  entry,
  onClose,
  onDeleted,
}: {
  entry: FoodLogEntry;
  onClose: () => void;
  onDeleted: (entry: FoodLogEntry) => void;
}) {
  const rt = useDb();
  const fmt = useFormatters();
  const id = useId();
  const byServing = entry.servingSnapshot !== undefined;
  const [value, setValue] = useState(
    entry.amount === undefined
      ? ''
      : fmt.number(byServing ? (entry.servingSnapshot?.count ?? 1) : entry.amount, {
          maximumFractionDigits: 2,
        }),
  );
  const [slot, setSlot] = useState<MealSlot>(entry.slot);
  const [error, setError] = useState<string | null>(null);
  const unit = t.nutrition.units[entry.basisSnapshot ?? 'g'];

  const save = () => {
    setError(null);
    const change: Parameters<typeof changeEntry>[2] = { slot };
    if (entry.amount !== undefined) {
      const parsed = parseDecimal(value);
      if (parsed === null || parsed <= 0) {
        setError(t.nutrition.invalidAmount);
        return;
      }
      if (byServing) change.servingCount = parsed;
      else change.amount = parsed;
    }
    changeEntry(rt, entry.id, change).then(onClose, (caught: unknown) => {
      setError(t.nutrition.saveFailed);
      void logError(rt.db, { area: 'nutrition', error: caught, route: window.location.pathname });
    });
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={entry.nameSnapshot}
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
                  setError(t.nutrition.saveFailed);
                  void logError(rt.db, {
                    area: 'nutrition',
                    error: caught,
                    route: window.location.pathname,
                  });
                },
              );
            }}
          >
            {t.nutrition.delete}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            {t.nutrition.cancel}
          </Button>
          <Button type="submit" form={`${id}-form`}>
            {t.nutrition.save}
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
        {entry.amount !== undefined ? (
          <div>
            <label htmlFor={`${id}-menge`} className="mb-2 block text-sm font-semibold text-muted">
              {byServing
                ? `${t.nutrition.servingsLabel} (${entry.servingSnapshot?.name ?? ''})`
                : t.nutrition.amountLabel(unit)}
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
          label={t.nutrition.slotLabel}
          value={slot}
          options={MEAL_SLOTS.map((s) => ({ value: s, label: t.nutrition.slots[s] }))}
          onChange={setSlot}
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
