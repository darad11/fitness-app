import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

/**
 * Chip der Marke FORM (D-314): 36 px hoch, rund, Fläche card-2 mit 1-px-Rand; aktiv Lime mit
 * Schrift in Nacht. Die Tippfläche reicht unsichtbar auf 44 px (`before`), damit kleine Chips gut
 * zu treffen sind. Für Links und Etiketten gibt es dieselben Klassen über `chipClasses`.
 *
 * `cn` löst widersprüchliche Klassen nicht auf (clsx): Was sich je Aufruf ändert (Innenmaß,
 * Breite), kommt deshalb über `fill`, nicht über `className` (F5, D-322). `class-conflicts.test.ts`
 * prüft alle Aufrufe.
 */
export const CHIP_BASE =
  'relative inline-flex h-chip min-w-0 select-none items-center justify-center gap-1.5 rounded-pill text-sm font-semibold whitespace-nowrap transition-[background-color,color,opacity] duration-120 before:absolute before:-inset-y-1 before:content-[""]';
export const CHIP_SELECTED = 'bg-accent text-on-accent';
export const CHIP_IDLE =
  'bg-surface-2 text-fg shadow-[inset_0_0_0_1px_var(--border)] hover:bg-surface';
/**
 * Größe nach Inhalt, als Zelle eines Rasters (volle Breite, Tippfläche bis an den Nachbarn) oder
 * als Teil einer Zeile, die sich die Breite teilt (`row`, F5 D-327: wächst vom Inhalt aus, damit
 * z. B. fünf Zeiträume auf 360 pt in eine Zeile passen; ab 48 rem wieder nach Inhalt).
 */
export const CHIP_SIZES = {
  content: 'px-4 before:inset-x-0',
  fill: 'w-full px-1 before:-inset-x-0.5',
  row: 'w-full px-1 before:-inset-x-0.5 md:px-4 md:before:inset-x-0',
} as const;

export type ChipSize = keyof typeof CHIP_SIZES;

export interface ChipOptions {
  /** Füllt eine Zelle (z. B. sieben Wochentage in einer Zeile) statt sich nach dem Inhalt zu richten. */
  fill?: boolean;
  /** Größe ausdrücklich; geht `fill` vor. */
  size?: ChipSize;
}

export function chipClasses(
  selected = false,
  className?: string,
  { fill = false, size }: ChipOptions = {},
): string {
  return cn(
    CHIP_BASE,
    CHIP_SIZES[size ?? (fill ? 'fill' : 'content')],
    selected ? CHIP_SELECTED : CHIP_IDLE,
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
  /** Zelle eines Rasters, siehe `ChipOptions`. */
  fill?: boolean;
}

export function Chip({ selected, pressed, fill, className, type = 'button', ...props }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={pressed}
      className={cn(
        chipClasses(selected ?? pressed ?? false, className, { fill }),
        'active:opacity-92 disabled:cursor-not-allowed disabled:opacity-50',
      )}
      {...props}
    />
  );
}
