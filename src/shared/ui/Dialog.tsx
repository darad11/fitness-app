import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  children: ReactNode;
  /** Knöpfe am Ende, z. B. „Abbrechen" und „Entfernen". */
  actions?: ReactNode;
  /** Als Blatt von unten (z. B. Übungsauswahl) statt als Rückfrage in der Mitte. */
  variant?: 'confirm' | 'sheet';
}

/**
 * Modaler Dialog über das native `<dialog>`: Fokusfalle, Escape und Hintergrund-Sperre liefert
 * der Browser (Safari ab 15.4). Der Titel benennt den Dialog für Screenreader.
 */
export function Dialog({
  open,
  onClose,
  title,
  closeLabel,
  children,
  actions,
  variant = 'confirm',
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className={cn(
        'glass-blur bg-panel text-fg shadow-float backdrop:bg-scrim',
        variant === 'sheet'
          ? 'mt-auto mb-0 h-[85dvh] w-full max-w-none rounded-t-sheet p-0 md:m-auto md:h-[80dvh] md:max-w-xl md:rounded-sheet'
          : 'm-auto w-[min(28rem,calc(100%-2rem))] rounded-sheet p-5',
      )}
    >
      {open ? (
        <div className={cn('flex flex-col', variant === 'sheet' && 'h-full')}>
          <div
            className={cn(
              'flex items-start gap-3',
              variant === 'sheet' && 'border-b border-line px-4 pt-4 pb-3',
            )}
          >
            <h2 id={titleId} className="flex-1 pt-2 text-lg font-semibold">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="-mr-2 flex size-11 shrink-0 items-center justify-center rounded-pill text-muted hover:bg-surface-2"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>
          <div
            className={cn(
              variant === 'sheet' ? 'min-h-0 flex-1 overflow-y-auto px-4 py-4' : 'mt-2',
            )}
          >
            {children}
          </div>
          {actions ? <div className="mt-5 flex flex-wrap justify-end gap-2">{actions}</div> : null}
        </div>
      ) : null}
    </dialog>
  );
}
