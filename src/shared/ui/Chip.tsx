import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

/**
 * Chip der Marke FORM (D-314): 36 px hoch, rund, Fläche card-2 mit 1-px-Rand; aktiv Lime mit
 * Schrift in Nacht. Die Tippfläche reicht unsichtbar auf 44 px (`before`), damit kleine Chips gut
 * zu treffen sind. Für Links und Etiketten gibt es dieselben Klassen über `chipClasses`.
 */
export function chipClasses(selected = false, className?: string): string {
  return cn(
    'relative inline-flex h-chip min-w-0 select-none items-center justify-center gap-1.5 rounded-pill px-4 text-sm font-semibold whitespace-nowrap transition-[background-color,color,opacity] duration-120',
    'before:absolute before:inset-x-0 before:-inset-y-1 before:content-[""]',
    selected
      ? 'bg-accent text-on-accent'
      : 'bg-surface-2 text-fg shadow-[inset_0_0_0_1px_var(--border)] hover:bg-surface',
    className,
  );
}

/** Etikett ohne Aktion im Stil eines Chips, z. B. Muskelgruppen; ohne vergrößerte Tippfläche. */
export function tagClasses(className?: string): string {
  return cn(
    'inline-flex h-7 items-center rounded-pill bg-surface-2 px-3 text-caption font-medium text-fg shadow-[inset_0_0_0_1px_var(--border)]',
    className,
  );
}

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Ausgewählt (z. B. aktive Auswahl): Lime; als Umschalter mit `aria-pressed` über `pressed`. */
  selected?: boolean;
  /** Setzt `aria-pressed`, wenn der Chip einen Zustand umschaltet. */
  pressed?: boolean;
}

export function Chip({ selected, pressed, className, type = 'button', ...props }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={pressed}
      className={cn(
        chipClasses(selected ?? pressed ?? false, className),
        'active:opacity-92 disabled:cursor-not-allowed disabled:opacity-50',
      )}
      {...props}
    />
  );
}
