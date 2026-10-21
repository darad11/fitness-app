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

/**
 * Listenzeilen der Marke FORM (D-314) in einer Karte: Symbol in einer Kachel (40 px, card-2,
 * Radius 12), Titel 16/600, Untertitel 13 gedämpft, Chevron in `text-faint`; Zeilen mindestens 56 px.
 */
export function LinkList({ items, label }: { items: readonly LinkListItem[]; label?: string }) {
  const prefix = useId();
  return (
    <ul aria-label={label} className="divide-y divide-line rounded-card bg-surface shadow-card">
      {items.map(({ to, label: itemLabel, icon: Icon, description }, index) => (
        <li key={to}>
          <Link
            to={to}
            aria-describedby={description ? `${prefix}-${String(index)}` : undefined}
            className="flex min-h-14 items-center gap-3 px-card py-3 first:rounded-t-card last:rounded-b-card hover:bg-surface-2"
          >
            <TileIcon icon={Icon} />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{itemLabel}</span>
              {description ? (
                // Beschreibung nur über aria-describedby, damit der Name der Zeile die Beschriftung bleibt.
                <span
                  id={`${prefix}-${String(index)}`}
                  aria-hidden="true"
                  className="block text-caption text-muted"
                >
                  {description}
                </span>
              ) : null}
            </span>
            <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-faint" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Symbol in einer Kachel (40 px, card-2, Radius 12) für Listenzeilen und Karten. */
export function TileIcon({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <span
      className={`flex size-tile shrink-0 items-center justify-center rounded-tile bg-surface-2 text-fg ${className ?? ''}`}
    >
      <Icon aria-hidden="true" className="size-5" />
    </span>
  );
}
