import { X } from 'lucide-react';
import { useEffect, useId, useRef, type PointerEvent, type ReactNode } from 'react';
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
  /** Blatt nur so hoch wie sein Inhalt (höchstens 85 % der Höhe), z. B. für kurze Auswahl. */
  fit?: boolean;
  /** Startfokus auf dem Titel statt auf „Schließen“, z. B. für eine Begrüßung (D-319). */
  focusTitle?: boolean;
}

/** Ab dieser Strecke nach unten schließt das Wegwischen das Blatt. */
const SWIPE_CLOSE_PX = 80;
/** Erst ab dieser Bewegung gilt eine Berührung als Wischen (ein Tipp bleibt ein Tipp). */
const SWIPE_SLOP_PX = 6;

/**
 * Modaler Dialog über das native `<dialog>`: Fokusfalle, Escape und Hintergrund-Sperre liefert
 * der Browser (Safari ab 15.4). Der Titel benennt den Dialog für Screenreader.
 *
 * Marke FORM (D-314): Fläche `bg-elevated`, ohne Glas und Schatten, 1-px-Rand. Das Blatt hat oben
 * Radius 24 und einen Griff (36 × 4); am Griff und am Kopf lässt es sich nach unten wegwischen.
 * Wischen ist nie der einzige Weg: Schließen-Knopf und Escape bleiben (design-system.md Abschnitt 6).
 */
export function Dialog({
  open,
  onClose,
  title,
  closeLabel,
  children,
  actions,
  variant = 'confirm',
  fit = false,
  focusTitle = false,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const swipe = useSwipeToClose(onClose);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      if (focusTitle) titleRef.current?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, focusTitle]);
  const sheet = variant === 'sheet';
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className={cn(
        'bg-panel text-fg shadow-float backdrop:bg-scrim',
        // Sicherer Bereich an der Seite (D-372; iPhone Duo: Statusleiste und Kamera an der Seite):
        // Das Blatt über die ganze Breite rückt seinen Inhalt ein, Dialoge in der Mitte stehen
        // mittig zwischen den Rändern des sicheren Bereichs.
        sheet
          ? cn(
              'mt-auto mb-0 w-full max-w-none rounded-t-sheet p-0 transition-transform duration-240 max-md:pr-[env(safe-area-inset-right)] max-md:pl-[env(safe-area-inset-left)] md:inset-x-safe md:m-auto md:max-w-sheet md:rounded-sheet',
              fit ? 'h-fit max-h-[85dvh] md:max-h-[80dvh]' : 'h-[85dvh] md:h-[80dvh]',
            )
          : 'inset-x-safe m-auto w-[calc(100%-2rem-env(safe-area-inset-left)-env(safe-area-inset-right))] max-w-dialog rounded-sheet p-page',
      )}
    >
      {open ? (
        <div className={cn('flex flex-col', sheet && 'h-full')}>
          <div
            {...(sheet ? swipe : {})}
            className={cn(
              'flex flex-col',
              sheet && 'touch-none border-b border-line px-card pt-2 pb-3 select-none',
            )}
          >
            {sheet ? (
              <span aria-hidden="true" className="mx-auto mb-2 h-1 w-9 rounded-pill bg-faint" />
            ) : null}
            <div className="flex items-start gap-3">
              <h2
                id={titleId}
                ref={titleRef}
                tabIndex={focusTitle ? -1 : undefined}
                className={cn('flex-1 pt-2 text-title font-semibold', focusTitle && 'outline-none')}
              >
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label={closeLabel}
                className="-mr-2 flex size-touch shrink-0 items-center justify-center rounded-pill text-muted hover:bg-surface-2"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>
          </div>
          <div
            className={cn(
              sheet ? 'min-h-0 flex-1 overflow-y-auto px-card py-4' : 'mt-2',
              sheet && fit && 'pb-[calc(env(safe-area-inset-bottom)+1rem)]',
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

/**
 * Wegwischen eines Blatts nach unten: Das Blatt (das umgebende `<dialog>`) folgt dem Finger; ab
 * {@link SWIPE_CLOSE_PX} schließt es, sonst gleitet es zurück. Der Zeiger wird erst ab
 * {@link SWIPE_SLOP_PX} gefangen, damit ein Tipp auf „Schließen“ ein Klick bleibt.
 */
export function useSwipeToClose(onClose: () => void): {
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: PointerEvent<HTMLElement>) => void;
} {
  const drag = useRef<{ id: number; startY: number; dy: number; captured: boolean } | null>(null);
  const sheetOf = (event: PointerEvent<HTMLElement>) => event.currentTarget.closest('dialog');
  const reset = (event: PointerEvent<HTMLElement>) => {
    const sheet = sheetOf(event);
    if (sheet) {
      // Übergang und Lage zusammen zurücksetzen: Das Blatt gleitet animiert an seinen Platz.
      sheet.style.removeProperty('transition');
      sheet.style.removeProperty('transform');
    }
    drag.current = null;
  };
  return {
    onPointerDown: (event) => {
      if (!event.isPrimary || event.button !== 0) return;
      drag.current = { id: event.pointerId, startY: event.clientY, dy: 0, captured: false };
    },
    onPointerMove: (event) => {
      const current = drag.current;
      const sheet = sheetOf(event);
      if (current?.id !== event.pointerId || !sheet) return;
      current.dy = Math.max(0, event.clientY - current.startY);
      if (!current.captured && current.dy > SWIPE_SLOP_PX) {
        current.captured = true;
        // Während des Wischens folgt das Blatt dem Finger ohne Verzögerung.
        sheet.style.transition = 'none';
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          // Zeiger schon weg
        }
      }
      if (current.captured) sheet.style.transform = `translateY(${String(current.dy)}px)`;
    },
    onPointerUp: (event) => {
      const current = drag.current;
      if (current?.id !== event.pointerId) return;
      const close = current.captured && current.dy > SWIPE_CLOSE_PX;
      reset(event);
      if (close) onClose();
    },
    onPointerCancel: (event) => {
      reset(event);
    },
  };
}
