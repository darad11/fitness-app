import { Check, Minus } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

/** Zustand eines Tages oder einer Aufgabe. */
export type MarkState = 'done' | 'open' | 'notDue' | 'noData';

/**
 * Größen (Tokens in `styles.css`, F6, D-334): `base` 14 px wie die Legende des Kalenders und der
 * Verlauf, `md` 16 px für „Je Aufgabe“ und den Kalender, `lg` 20 px für das Abhakfeld in Listen.
 */
export type MarkSize = 'base' | 'md' | 'lg';

const SIZE: Record<MarkSize, string> = {
  base: 'size-mark',
  md: 'size-mark-md',
  lg: 'size-mark-lg',
};

/** Schmale Spalten: so hoch wie die Größe, höchstens so breit, sonst so breit wie die Spalte. */
const STRETCH: Record<MarkSize, string> = {
  base: 'h-mark w-full max-w-[var(--spacing-mark)]',
  md: 'h-mark-md w-full max-w-[var(--spacing-mark-md)]',
  lg: 'h-mark-lg w-full max-w-[var(--spacing-mark-lg)]',
};

/**
 * Erledigt-Markierung, eine Komponente für alle Stellen (F6, D-334; ersetzt die Kreise und Felder
 * aus D-325): abgerundetes Quadrat mit dem Radius der Kachel (22,5 %, wächst mit der Größe), Haken
 * 60 % der Seite. Zustand nicht nur über Farbe: erledigt gefüllt mit Haken, offen mit Rand, nicht
 * fällig blass, ohne Eintrag gestrichelt; heute mit dünnem Rahmen in Lime. `children` (etwa die
 * Tageszahl im Kalender) erscheinen nur ohne Haken. Rein grafisch; Name und Bedienung liefert der
 * Aufrufer. Als Abhakfeld (`peer`) zeigt sie den Tastaturfokus des unsichtbaren Kontrollkästchens
 * davor; die Tippfläche von 44 pt kommt vom Aufrufer (Innenabstand oder ganze Zeile).
 */
export function Mark({
  state,
  size = 'base',
  today = false,
  stretch = false,
  peer = false,
  dash = false,
  children,
}: {
  state: MarkState;
  size?: MarkSize;
  today?: boolean;
  /** In schmalen Spalten: Breite der Spalte, höchstens die Größe. */
  stretch?: boolean;
  /** Steht hinter einem Kontrollkästchen mit der Klasse `peer` und zeigt dessen Fokus. */
  peer?: boolean;
  /** Ohne Eintrag einen Strich zeigen (Kalender). */
  dash?: boolean;
  children?: ReactNode;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-mark text-[10px] leading-none font-semibold tabular-nums transition-colors duration-120',
        stretch ? STRETCH[size] : SIZE[size],
        state === 'done' && 'bg-success text-on-accent',
        state === 'open' && 'border-line-input text-fg',
        state === 'open' && (size === 'lg' ? 'border-2' : 'border-[1.5px]'),
        state === 'notDue' && 'bg-surface-2 text-muted',
        state === 'noData' && 'border border-dashed border-line-input text-muted',
        today && 'ring-1 ring-accent ring-offset-1 ring-offset-surface',
        peer &&
          'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus',
      )}
    >
      {state === 'done' ? (
        <Check className="size-[60%]" strokeWidth={3} />
      ) : state === 'noData' && dash ? (
        <Minus className="size-[60%]" />
      ) : (
        children
      )}
    </span>
  );
}
