import { useId, useState } from 'react';
import { t } from '@/shared/i18n/de';
import { Button, Dialog } from '@/shared/ui';

export interface NoteDialogProps {
  title: string;
  hint: string;
  initial: string;
  maxLength: number;
  onSave: (text: string) => void;
  onClose: () => void;
}

/** Notiz zu einer Übung oder zur Einheit (AK-TRN-24); leerer Text entfernt sie. */
export function NoteDialog({ title, hint, initial, maxLength, onSave, onClose }: NoteDialogProps) {
  const id = useId();
  const [text, setText] = useState(initial);
  return (
    <Dialog
      open
      onClose={onClose}
      title={title}
      closeLabel={t.common.close}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t.session.noteCancel}
          </Button>
          <Button
            onClick={() => {
              onSave(text);
            }}
          >
            {t.session.noteSave}
          </Button>
        </>
      }
    >
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-muted">
        {t.session.noteLabel}
      </label>
      <textarea
        id={id}
        rows={4}
        maxLength={maxLength}
        value={text}
        aria-describedby={`${id}-hint`}
        onChange={(event) => {
          setText(event.target.value);
        }}
        className="w-full rounded-input border border-line bg-surface px-3 py-2 text-base text-fg"
      />
      <p id={`${id}-hint`} className="mt-1 text-sm text-muted">
        {hint}
      </p>
    </Dialog>
  );
}
