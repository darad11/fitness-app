import { cn } from '@/shared/lib/cn';

/**
 * Das bisherige Symbol der App für Übungen (Hantel wie „Training“) in der Kachel, so groß wie das
 * Vorschaubild (D-397). Rückfall ohne Visual und Platzhalter, solange die Visuals nachladen; eigene
 * Datei ohne Daten und Schemas, damit sie die Startansicht nicht vergrößert.
 */

/**
 * Hantel wie das Symbol `Dumbbell` aus lucide-react (ISC-Lizenz, wie die Abhängigkeit selbst),
 * hier als eigene Kopie: Über den Import hinge der Teil am Hauptteil der App, und Vite legte für
 * jede Seite mit Vorschaubildern eine lange Vorladeliste in die Startansicht (D-397).
 */
function DumbbellIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Alle Linien in einem Pfad: In langen Listen (124 Übungen) zählt jedes Element. */}
      <path d="M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z m2.5 21.5 1.4-1.4 m20.1 3.9 1.4-1.4 M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z m9.6 14.4 4.8-4.8" />
    </svg>
  );
}
export interface TileLook {
  /** `list`: 56 px in Listen; `small`: 40 px wie die Symbol-Kachel (Karten im Training). */
  size?: 'list' | 'small';
  /** Fläche darunter: auf `card` liegt die Kachel auf card-2, auf `card-2` umgekehrt. */
  on?: 'card' | 'card-2';
}

export function tileClasses({ size = 'list', on = 'card' }: TileLook): string {
  return cn(
    size === 'small' ? 'size-tile' : 'size-thumb',
    on === 'card-2' ? 'bg-surface' : 'bg-surface-2',
  );
}

export function SymbolTile({ className, ...look }: TileLook & { className?: string }) {
  return (
    <span
      data-visual="symbol"
      className={cn(
        'flex shrink-0 items-center justify-center rounded-tile text-fg',
        tileClasses(look),
        className,
      )}
    >
      <DumbbellIcon />
    </span>
  );
}
