import { useId, useState } from 'react';
import { t } from '@/shared/i18n/de';
import { parseDecimal } from '@/shared/lib/format';
import { Button, Dialog } from '@/shared/ui';
import { needsReview, type WeightEntry } from '../calc/bodyWeight';
import { BODY_WEIGHT_LIMITS, MAX_FUTURE_MS } from '../model/bodyWeight';

export interface BodyWeightSheetProps {
  open: boolean;
  /** Beim Bearbeiten der bestehende Eintrag. */
  entry?: WeightEntry;
  entries: readonly WeightEntry[];
  onClose: () => void;
  onSave: (input: { weightKg: number; measuredAt: Date; note?: string }) => Promise<void>;
  onDelete?: () => void;
  /** Anzeige des Werts im Feld. */
  formatWeight: (value: number) => string;
}

/** `datetime-local` erwartet die Ortszeit ohne Zone. */
function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const INPUT =
  'h-12 w-full rounded-input border border-line bg-surface px-3 text-base text-fg tabular-nums';

/** Gewicht erfassen oder bearbeiten (S-28, AK-BW-01, AK-BW-02). */
export function BodyWeightSheet(props: BodyWeightSheetProps) {
  const { open, entry } = props;
  const id = useId();
  // Der Aufrufer setzt einen `key` je Öffnen und Eintrag; so startet das Formular frisch.
  const [weight, setWeight] = useState(() => (entry ? props.formatWeight(entry.weightKg) : ''));
  const [when, setWhen] = useState(() =>
    toLocalInput(entry ? new Date(entry.measuredAt) : new Date()),
  );
  const [note, setNote] = useState(entry?.note ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const parsedWeight = parseDecimal(weight);
  const measuredAt = when ? new Date(when) : null;
  const review =
    parsedWeight !== null && measuredAt && !Number.isNaN(measuredAt.getTime())
      ? needsReview(
          props.entries,
          { measuredAt: measuredAt.toISOString(), weightKg: parsedWeight },
          entry?.id,
        )
      : false;

  const submit = async () => {
    if (
      parsedWeight === null ||
      parsedWeight < BODY_WEIGHT_LIMITS.min ||
      parsedWeight > BODY_WEIGHT_LIMITS.max
    ) {
      setError(t.body.invalidWeight);
      return;
    }
    if (!measuredAt || Number.isNaN(measuredAt.getTime())) {
      setError(t.body.invalidDate);
      return;
    }
    if (measuredAt.getTime() > Date.now() + MAX_FUTURE_MS) {
      setError(t.body.futureDate);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await props.onSave({ weightKg: parsedWeight, measuredAt, note: note.trim() || undefined });
    } catch {
      setError(t.body.saveFailed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={props.onClose}
      title={entry ? t.body.editTitle : t.body.addTitle}
      closeLabel={t.common.close}
      variant="sheet"
    >
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div>
          <label htmlFor={`${id}-w`} className="mb-1 block text-sm font-medium">
            {t.body.weightLabel}
          </label>
          <input
            id={`${id}-w`}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={weight}
            onChange={(event) => {
              setWeight(event.target.value);
            }}
            className={INPUT}
          />
          {review ? (
            <p role="status" className="mt-1 text-sm text-warning">
              {t.body.review}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor={`${id}-d`} className="mb-1 block text-sm font-medium">
            {t.body.dateLabel}
          </label>
          <input
            id={`${id}-d`}
            type="datetime-local"
            value={when}
            onChange={(event) => {
              setWhen(event.target.value);
            }}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor={`${id}-n`} className="mb-1 block text-sm font-medium">
            {t.body.noteLabel}
          </label>
          <textarea
            id={`${id}-n`}
            value={note}
            rows={2}
            maxLength={500}
            onChange={(event) => {
              setNote(event.target.value);
            }}
            className="w-full rounded-input border border-line bg-surface px-3 py-2 text-base text-fg"
          />
        </div>
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={busy}>
            {t.body.save}
          </Button>
          <Button type="button" variant="secondary" onClick={props.onClose}>
            {t.session.cancel}
          </Button>
          {entry && props.onDelete ? (
            <Button type="button" variant="danger" className="ml-auto" onClick={props.onDelete}>
              {t.body.delete}
            </Button>
          ) : null}
        </div>
      </form>
    </Dialog>
  );
}
