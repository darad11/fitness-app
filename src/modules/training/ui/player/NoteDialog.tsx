import { useId, useState } from 'react';
import { t } from '@/shared/i18n/de';
import { tSession } from '@/shared/i18n/de-session';
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
            {tSession.noteCancel}
          </Button>
          <Button
            onClick={() => {
              onSave(text);
            }}
          >
            {tSession.noteSave}
          </Button>
        </>
      }
    >
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-muted">
        {tSession.noteLabel}
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
        className="field w-full"
      />
      <p id={`${id}-hint`} className="mt-1 text-sm text-muted">
        {hint}
      </p>
    </Dialog>
  );
}
