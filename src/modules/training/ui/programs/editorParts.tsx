import { useState, type ReactNode } from 'react';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { tProgramEditor } from '@/shared/i18n/de-program-editor';
import { Button, Dialog } from '@/shared/ui';
import { PlanEditError } from '../../calc/programEdit';
import type { ProgramPlan, Week } from '../../model/program';
import { editProgram, InvalidProgramError } from '../../service/programService';

export const INPUT =
  'h-12 w-full min-w-0 rounded-input border border-line bg-surface px-3 text-base text-fg';
export const TEXTAREA =
  'w-full rounded-input border border-line bg-surface px-3 py-2 text-base text-fg';

type Messages = Partial<Record<PlanEditError['reason'], string>>;

/**
 * Speichert Änderungen im Editor sofort (D-257). Fehler erscheinen als Meldung; erwartete Fälle
 * (letzte Woche, Grenze) mit eigenem Text, alles andere landet zusätzlich im Fehlerprotokoll.
 */
export function useProgramEdit(programId: string) {
  const rt = useDb();
  const [error, setError] = useState<string | null>(null);
  const apply = async (change: (plan: ProgramPlan) => ProgramPlan, messages: Messages = {}) => {
    setError(null);
    try {
      await editProgram(rt, programId, change);
      return true;
    } catch (caught) {
      if (caught instanceof PlanEditError) {
        setError(
          messages[caught.reason] ??
            (caught.reason === 'limit' ? tProgramEditor.limit : t.programs.actionFailed),
        );
      } else if (caught instanceof InvalidProgramError) {
        setError(caught.reason === 'name' ? t.programs.nameError : tProgramEditor.lastDay);
      } else {
        setError(t.programs.actionFailed);
        void logError(rt.db, { area: 'training', error: caught, route: window.location.pathname });
      }
      return false;
    }
  };
  /** Kurzform für Änderungen nur an den Wochen. */
  const applyWeeks = (change: (weeks: Week[]) => Week[], messages?: Messages) =>
    apply((plan) => ({ ...plan, weeks: change(plan.weeks) }), messages);
  return {
    apply,
    applyWeeks,
    error,
    clearError: () => {
      setError(null);
    },
  };
}

export function ErrorMessage({ error }: { error: string | null }) {
  return error ? (
    <p role="alert" className="mb-4 rounded-card bg-danger-soft p-4 text-danger">
      {error}
    </p>
  ) : null;
}

/** Ein Textfeld im Dialog, z. B. zum Umbenennen. */
export function NameDialog({
  title,
  label,
  initial,
  onSave,
  onClose,
}: {
  title: string;
  label: string;
  initial: string;
  onSave: (name: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initial);
  const valid = value.trim().length > 0 && value.trim().length <= 80;
  return (
    <Dialog
      open
      onClose={onClose}
      title={title}
      closeLabel={t.common.close}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t.programs.cancel}
          </Button>
          <Button type="submit" form="name-dialog" disabled={!valid}>
            {t.programs.save}
          </Button>
        </>
      }
    >
      <form
        id="name-dialog"
        onSubmit={(event) => {
          event.preventDefault();
          if (valid) onSave(value.trim());
        }}
      >
        <label htmlFor="name-dialog-input" className="mb-1 block text-sm font-medium">
          {label}
        </label>
        <input
          id="name-dialog-input"
          autoComplete="off"
          maxLength={80}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
          }}
          className={INPUT}
        />
      </form>
    </Dialog>
  );
}

/** Rückfrage vor dem Löschen (AK-PRG-02). */
export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog
      open
      onClose={onClose}
      title={title}
      closeLabel={t.common.close}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t.programs.cancel}
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-muted">{children}</p>
    </Dialog>
  );
}
