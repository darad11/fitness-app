import { cn } from '../lib/cn';

/**
 * Ruhige Fläche in der Form eines Inhalts, solange er lädt (design-system.md Abschnitt 7).
 * Ohne Animation und ohne Text; den Ladezustand meldet der umgebende Bereich mit `aria-busy`.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('rounded-input bg-surface-2', className)} />;
}
