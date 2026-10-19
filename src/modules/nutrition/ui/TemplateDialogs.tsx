import { useId, useState } from 'react';
import { useFormatters } from '@/modules/settings';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { Button, Dialog } from '@/shared/ui';
import type { MealTemplate } from '../model/mealTemplate';
import type { FoodLogEntry, MealSlot } from '../model/nutrition';
import {
  applyTemplate,
  createTemplateFromEntries,
  InvalidTemplateError,
  renameTemplate,
} from '../service/mealTemplateService';
import { describeAmount, kcal } from './format';

const INPUT = 'h-12 w-full rounded-input border border-line bg-surface px-3 text-base text-fg';

export function templateKcal(template: MealTemplate): number {
  return template.items.reduce((sum, item) => sum + (item.nutrients.kcal ?? 0), 0);
}

/** Name abfragen; gemeinsam für „Als Vorlage speichern“ und „Umbenennen“. */
function NameDialog({
  title,
  initial,
  onClose,
  onSave,
}: {
  title: string;
  initial: string;
  onClose: () => void;
  onSave: (name: string) => Promise<unknown>;
}) {
  const { db } = useDb();
  const id = useId();
  const [name, setName] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const submit = () => {
    onSave(name).then(onClose, (caught: unknown) => {
      if (caught instanceof InvalidTemplateError) {
        setError(
          caught.reason === 'name'
            ? t.nutrition.templates.nameError
            : t.nutrition.templates.tooMany,
        );
      } else {
        setError(t.nutrition.saveFailed);
        void logError(db, { area: 'nutrition', error: caught, route: window.location.pathname });
      }
    });
  };
  return (
    <Dialog
      open
      onClose={onClose}
      title={title}
      closeLabel={t.common.close}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t.nutrition.cancel}
          </Button>
          <Button type="submit" form={`${id}-form`}>
            {t.nutrition.templates.save}
          </Button>
        </>
      }
    >
      <form
        id={`${id}-form`}
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <label htmlFor={`${id}-name`} className="mb-2 block text-sm font-semibold text-muted">
          {t.nutrition.templates.nameLabel}
        </label>
        <input
          id={`${id}-name`}
          maxLength={60}
          autoComplete="off"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setError(null);
          }}
          className={INPUT}
        />
        {error ? (
          <p role="alert" className="mt-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}

export function SaveTemplateDialog({
  slot,
  entries,
  onClose,
  onSaved,
}: {
  slot: MealSlot;
  entries: readonly FoodLogEntry[];
  onClose: () => void;
  onSaved: (template: MealTemplate) => void;
}) {
  const rt = useDb();
  return (
    <NameDialog
      title={t.nutrition.templates.saveTitle}
      initial={t.nutrition.templates.defaultName(t.nutrition.slots[slot])}
      onClose={onClose}
      onSave={(name) => createTemplateFromEntries(rt, name, entries).then(onSaved)}
    />
  );
}

export function RenameTemplateDialog({
  template,
  onClose,
}: {
  template: MealTemplate;
  onClose: () => void;
}) {
  const rt = useDb();
  return (
    <NameDialog
      title={t.nutrition.templates.renameTitle}
      initial={template.name}
      onClose={onClose}
      onSave={(name) => renameTemplate(rt, template.id, name)}
    />
  );
}

/** Vorlage ansehen und mit einem Tipp in die gewählte Mahlzeit eintragen. */
export function ApplyTemplateDialog({
  template,
  slot,
  day,
  onClose,
  onApplied,
}: {
  template: MealTemplate;
  slot: MealSlot;
  day: string;
  onClose: () => void;
  onApplied: () => void;
}) {
  const rt = useDb();
  const fmt = useFormatters();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Dialog
      open
      onClose={onClose}
      title={t.nutrition.templates.applyTitle(template.name)}
      closeLabel={t.common.close}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t.nutrition.cancel}
          </Button>
          <Button
            disabled={busy}
            onClick={() => {
              setBusy(true);
              applyTemplate(rt, template, { slot, dayKey: day }).then(
                onApplied,
                (caught: unknown) => {
                  setBusy(false);
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
            {t.nutrition.templates.apply}
          </Button>
        </>
      }
    >
      <p className="mb-3 text-sm text-muted">
        {t.nutrition.templates.applyText(t.nutrition.slots[slot])}
      </p>
      <ul className="divide-y divide-line">
        {template.items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 py-2">
            <span className="min-w-0 flex-1">
              <span className="block font-medium break-words">{item.nameSnapshot}</span>
              <span className="block text-sm text-muted">
                {describeAmount(fmt, {
                  amount: item.amount,
                  basisSnapshot: item.basisSnapshot,
                  servingSnapshot: item.servingSnapshot,
                })}
              </span>
            </span>
            <span className="shrink-0 font-semibold tabular-nums">
              {kcal(fmt, item.nutrients.kcal ?? 0)} {t.nutrition.units.kcal}
            </span>
          </li>
        ))}
      </ul>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </Dialog>
  );
}
