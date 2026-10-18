import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  text?: string;
  /** Eine Hauptaktion (design-system.md Abschnitt 7). */
  action?: ReactNode;
  className?: string;
}

/** Leerzustand: Symbol in Tonfläche, ein Satz, eine Aktion. */
export function EmptyState({ icon: Icon, title, text, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-card bg-surface px-6 py-8 text-center shadow-card',
        className,
      )}
    >
      {Icon ? (
        <span className="mb-4 flex size-14 items-center justify-center rounded-pill bg-accent-soft text-accent-ink">
          <Icon aria-hidden="true" className="size-7" />
        </span>
      ) : null}
      <h2 className="text-lg font-semibold">{title}</h2>
      {text ? <p className="mt-1 max-w-sm text-muted">{text}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
