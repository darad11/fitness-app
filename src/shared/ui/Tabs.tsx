import { useId, type KeyboardEvent, type ReactNode } from 'react';
import { chipClasses } from './Chip';

export interface TabItem<K extends string> {
  key: K;
  label: string;
}

/**
 * Reiter als Chips (FORM, D-315) mit den Rollen `tablist`, `tab` und `tabpanel`: Pfeiltasten,
 * Pos1 und Ende wechseln den Reiter, der aktive ist Lime. Der Inhalt steht in `children` des
 * aktiven Reiters; inaktive Reiter rendern nichts.
 */
export function Tabs<K extends string>({
  label,
  items,
  selected,
  onSelect,
  children,
}: {
  label: string;
  items: readonly TabItem<K>[];
  selected: K;
  onSelect: (key: K) => void;
  children: ReactNode;
}) {
  const prefix = useId();
  const tabId = (key: K) => `${prefix}-tab-${key}`;
  const panelId = `${prefix}-panel`;
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const index = items.findIndex((item) => item.key === selected);
    const last = items.length - 1;
    const next =
      event.key === 'ArrowRight'
        ? index === last
          ? 0
          : index + 1
        : event.key === 'ArrowLeft'
          ? index === 0
            ? last
            : index - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : -1;
    const item = items[next];
    if (!item) return;
    event.preventDefault();
    onSelect(item.key);
    document.getElementById(tabId(item.key))?.focus();
  };
  return (
    <div>
      <div role="tablist" aria-label={label} className="flex flex-wrap gap-2">
        {items.map((item) => {
          const active = item.key === selected;
          return (
            <button
              key={item.key}
              id={tabId(item.key)}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={panelId}
              tabIndex={active ? 0 : -1}
              onKeyDown={onKeyDown}
              onClick={() => {
                onSelect(item.key);
              }}
              className={chipClasses(active)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div
        id={panelId}
        role="tabpanel"
        aria-labelledby={tabId(selected)}
        tabIndex={0}
        className="mt-stack rounded-card outline-offset-4"
      >
        {children}
      </div>
    </div>
  );
}
