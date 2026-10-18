import { cn } from '../lib/cn';

/** Kleines Etikett, z. B. „Beispiel" (design-system.md Abschnitt 6). Die Farbe trägt keine Bedeutung. */
export function Badge({ children, className }: { children: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-input border border-line-input px-2 py-0.5 text-sm font-medium text-fg',
        className,
      )}
    >
      {children}
    </span>
  );
}
