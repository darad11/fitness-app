import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  text?: string;
  /** Eine Aktion, in der Regel ein Sekundärknopf (design-system.md Abschnitt 7). */
  action?: ReactNode;
  className?: string;
}

/** Leerzustand der Marke FORM (D-314): Symbol in `text-faint`, ein Satz, eine Aktion. */
export function EmptyState({ icon: Icon, title, text, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-card bg-surface px-card py-8 text-center shadow-card',
        className,
      )}
    >
      {Icon ? <Icon aria-hidden="true" className="mb-3 size-10 text-faint" /> : null}
      <h2 className="text-title font-semibold">{title}</h2>
      {text ? <p className="mt-1 max-w-md text-muted">{text}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
