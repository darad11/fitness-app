import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

export type StatusTone = 'success' | 'neutral' | 'warning';

const TONE: Record<StatusTone, string> = {
  success: 'text-success',
  neutral: 'text-muted',
  warning: 'text-warning',
};

export interface StatusItem {
  id: string;
  icon: LucideIcon;
  tone: StatusTone;
  content: ReactNode;
}

/** Zustände mit Symbol und Text; die Farbe ist nie die einzige Information. */
export function StatusList({ items }: { items: readonly StatusItem[] }) {
  return (
    <ul className="space-y-1">
      {items.map(({ id, icon: Icon, tone, content }) => (
        <li key={id} className="flex min-h-11 items-center gap-3">
          <Icon aria-hidden="true" className={cn('size-5 shrink-0', TONE[tone])} />
          <span className="flex flex-1 flex-wrap items-center justify-between gap-x-3">
            {content}
          </span>
        </li>
      ))}
    </ul>
  );
}
