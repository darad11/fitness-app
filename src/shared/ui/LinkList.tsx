import { ChevronRight, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router';

export interface LinkListItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

/** Liste von Einstiegen, z. B. auf „Mehr". Jede Zeile ist mindestens 48 px hoch. */
export function LinkList({ items, label }: { items: readonly LinkListItem[]; label?: string }) {
  return (
    <ul
      aria-label={label}
      className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface"
    >
      {items.map(({ to, label: itemLabel, icon: Icon }) => (
        <li key={to}>
          <Link to={to} className="flex min-h-12 items-center gap-3 px-4 py-3 hover:bg-surface-2">
            <Icon aria-hidden="true" className="size-5 shrink-0 text-muted" />
            <span className="flex-1">{itemLabel}</span>
            <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
