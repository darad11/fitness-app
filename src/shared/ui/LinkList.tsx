import { ChevronRight, type LucideIcon } from 'lucide-react';
import { useId } from 'react';
import { Link } from 'react-router';

export interface LinkListItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Zweite Zeile, z. B. „105 Übungen“. */
  description?: string;
}

/** Liste von Einstiegen in einer Karte; Symbol in runder Tonfläche, Zeilen mindestens 56 px. */
export function LinkList({ items, label }: { items: readonly LinkListItem[]; label?: string }) {
  const prefix = useId();
  return (
    <ul aria-label={label} className="divide-y divide-line rounded-card bg-surface shadow-card">
      {items.map(({ to, label: itemLabel, icon: Icon, description }, index) => (
        <li key={to}>
          <Link
            to={to}
            aria-describedby={description ? `${prefix}-${String(index)}` : undefined}
            className="flex min-h-14 items-center gap-3 px-4 py-3 first:rounded-t-card last:rounded-b-card hover:bg-surface-2"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-pill bg-accent-soft text-accent-ink">
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{itemLabel}</span>
              {description ? (
                // Beschreibung nur über aria-describedby, damit der Name der Zeile die Beschriftung bleibt.
                <span
                  id={`${prefix}-${String(index)}`}
                  aria-hidden="true"
                  className="block text-sm text-muted"
                >
                  {description}
                </span>
              ) : null}
            </span>
            <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
