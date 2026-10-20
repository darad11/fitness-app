import { Check, ChevronDown, Pencil, Plus, RotateCcw } from 'lucide-react';
import { useRef, useState } from 'react';
import { useFormatters } from '@/modules/settings';
import { logError, useDb } from '@/shared/db';
import { tShopping } from '@/shared/i18n/de-shopping';
import { cn } from '@/shared/lib/cn';
import {
  Button,
  Card,
  IconButton,
  Meter,
  PageHeader,
  SegmentedControl,
  Skeleton,
  Toast,
} from '@/shared/ui';
import {
  canMerge,
  findDuplicate,
  isOpen,
  parseEntry,
  recentItems,
  type ParsedEntry,
} from '../calc/entry';
import { useShoppingItems } from '../data/useShopping';
import {
  SHOPPING_CATEGORIES,
  SHOPPING_NAME_MAX,
  SHOPPING_NOTE_MAX,
  SHOPPING_UNITS,
  type ShoppingCategory,
  type ShoppingItem,
} from '../model/shoppingItem';
import {
  addItem,
  clearDone,
  deleteItem,
  mergeQuantity,
  restoreItem,
  setItemDone,
  undoClear,
  updateItem,
} from '../service/shoppingService';

const ts = tShopping;
const INPUT =
  'h-12 w-full min-w-0 rounded-input border border-line bg-surface px-3 text-base text-fg';
type View = 'list' | 'categories';
const VIEW_OPTIONS = (['list', 'categories'] as const).map((value) => ({
  value,
  label: ts.views[value],
}));

type Notice = { kind: 'deleted'; item: ShoppingItem } | { kind: 'cleared'; ids: string[] };

/**
 * Einkaufsliste in „Meine Küche“ (D-287): Schnelleingabe mit Mengen-Erkennung, Doppelte
 * zusammenführen, „Zuletzt gekauft“, abhaken, bearbeiten, löschen, „Gekaufte entfernen“, Ansicht
 * als Liste oder nach Kategorie. Nur Planung, nichts davon zählt als gegessen.
 */
export function ShoppingListPage() {
  const rt = useDb();
  const fmt = useFormatters();
  const items = useShoppingItems();
  const input = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<{ entry: ParsedEntry; existing: ShoppingItem } | null>(
    null,
  );
  const [view, setView] = useState<View>('list');
  const [editing, setEditing] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const run = (action: () => Promise<unknown>) => {
    action().catch((caught: unknown) => {
      void logError(rt.db, { area: 'shopping', error: caught, route: '/ernaehrung/einkaufsliste' });
      setError(ts.saveFailed);
    });
  };
  const amount = (item: { quantity?: number; unit?: string }) =>
    item.quantity === undefined
      ? ''
      : `${fmt.number(item.quantity, { maximumFractionDigits: 2 })}${item.unit ? ` ${item.unit}` : ''}`;

  const finish = () => {
    setText('');
    setPending(null);
    setError(null);
    input.current?.focus();
  };
  const submit = () => {
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      setError(ts.nameMissing);
      return;
    }
    const entry = parseEntry(trimmed);
    const existing = items ? findDuplicate(items, entry.name) : undefined;
    if (existing) {
      setPending({ entry, existing });
      return;
    }
    run(async () => {
      await addItem(rt, entry);
      finish();
    });
  };

  if (items === undefined) {
    return (
      <>
        <PageHeader title={ts.title} back={{ to: '/ernaehrung', label: ts.back }} />
        <div aria-busy="true" className="grid gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-40" />
        </div>
      </>
    );
  }

  const open = items.filter(isOpen);
  const done = items.filter((item) => item.doneAt !== undefined && item.clearedAt === undefined);
  const recent = recentItems(items);
  // Vorschläge beim Tippen: alle bisher eingetragenen Namen, je einmal (D-287).
  const suggestions = [
    ...new Map(items.map((item) => [item.name.toLocaleLowerCase('de'), item.name])).values(),
  ];
  const total = open.length + done.length;
  const groups: { key: ShoppingCategory | 'none'; label: string; items: ShoppingItem[] }[] =
    view === 'list'
      ? [{ key: 'none', label: ts.openTitle, items: open }]
      : [
          ...SHOPPING_CATEGORIES.map((category) => ({
            key: category,
            label: ts.categories[category],
            items: open.filter((item) => item.category === category),
          })),
          {
            key: 'none' as const,
            label: ts.noCategory,
            items: open.filter((item) => item.category === undefined),
          },
        ].filter((group) => group.items.length > 0);

  const row = (item: ShoppingItem) =>
    editing === item.id ? (
      <li key={item.id}>
        <EditItem
          item={item}
          onCancel={() => {
            setEditing(null);
          }}
          onSave={(values) => {
            run(async () => {
              await updateItem(rt, item.id, values);
              setEditing(null);
            });
          }}
          onDelete={() => {
            run(async () => {
              await deleteItem(rt, item.id);
              setEditing(null);
              setNotice({ kind: 'deleted', item });
            });
          }}
        />
      </li>
    ) : (
      <li key={item.id} className="flex items-center gap-1">
        <label className="flex min-h-14 min-w-0 flex-1 cursor-pointer items-center gap-3 py-1">
          <input
            type="checkbox"
            checked={item.doneAt !== undefined}
            onChange={(event) => {
              const checked = event.target.checked;
              run(() => setItemDone(rt, item.id, checked));
            }}
            className="peer sr-only"
          />
          <span
            aria-hidden="true"
            className={cn(
              'flex size-7 shrink-0 items-center justify-center rounded-pill border-2 transition-colors duration-120 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus',
              item.doneAt !== undefined
                ? 'border-success bg-success text-on-accent'
                : 'border-line-input bg-surface',
            )}
          >
            {item.doneAt !== undefined ? <Check className="size-4" /> : null}
          </span>
          <span className="min-w-0 flex-1">
            <span className={cn('block', item.doneAt !== undefined && 'text-muted line-through')}>
              {item.name}
            </span>
            {item.note ? (
              <span className="block truncate text-sm text-muted">{item.note}</span>
            ) : null}
          </span>
          {item.quantity !== undefined ? (
            <span className="shrink-0 text-sm text-muted tabular-nums">{amount(item)}</span>
          ) : null}
        </label>
        <IconButton
          label={ts.edit(item.name)}
          onClick={() => {
            setEditing(item.id);
          }}
        >
          <Pencil aria-hidden="true" className="size-4" />
        </IconButton>
      </li>
    );

  return (
    <>
      <PageHeader title={ts.title} back={{ to: '/ernaehrung', label: ts.back }} />
      <div className="grid grid-cols-1 gap-4">
        <Card>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <label htmlFor="einkauf-neu" className="sr-only">
              {ts.inputLabel}
            </label>
            <input
              ref={input}
              id="einkauf-neu"
              type="text"
              value={text}
              maxLength={SHOPPING_NAME_MAX + 20}
              placeholder={ts.inputLabel}
              autoComplete="off"
              list="einkauf-vorschlaege"
              enterKeyHint="done"
              onChange={(event) => {
                setText(event.target.value);
                setPending(null);
              }}
              className={INPUT}
            />
            <datalist id="einkauf-vorschlaege">
              {suggestions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
            <Button type="submit" aria-label={ts.add}>
              <Plus aria-hidden="true" className="size-5" />
            </Button>
          </form>
          {error ? (
            <p role="alert" className="mt-2 text-sm text-danger">
              {error}
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted">{ts.inputHint}</p>
          )}
          {pending ? (
            <div role="status" className="mt-3 rounded-input bg-surface-2 p-3">
              <p className="text-sm">
                {ts.duplicate(pending.existing.name, amount(pending.existing))}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {canMerge(pending.existing, pending.entry) ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      const { existing, entry } = pending;
                      run(async () => {
                        await mergeQuantity(rt, existing.id, entry.quantity ?? 0);
                        finish();
                      });
                    }}
                  >
                    {ts.mergeAdd(amount(pending.entry))}
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const { entry } = pending;
                    run(async () => {
                      await addItem(rt, entry);
                      finish();
                    });
                  }}
                >
                  {ts.addAnyway}
                </Button>
                <Button
                  size="sm"
                  variant="quiet"
                  onClick={() => {
                    setPending(null);
                    input.current?.focus();
                  }}
                >
                  {ts.cancel}
                </Button>
              </div>
            </div>
          ) : null}
          {recent.length > 0 ? (
            <div className="mt-4">
              <p className="mb-2 text-sm font-semibold text-muted">{ts.recentTitle}</p>
              <ul className="flex flex-wrap gap-2">
                {recent.map((entry) => (
                  <li key={entry.name}>
                    <button
                      type="button"
                      aria-label={ts.recentAdd(entry.name)}
                      onClick={() => {
                        run(() => addItem(rt, entry));
                      }}
                      className="inline-flex min-h-10 items-center gap-1 rounded-pill border border-line-input px-3 text-sm font-medium hover:bg-surface-2"
                    >
                      <Plus aria-hidden="true" className="size-4 text-muted" />
                      {entry.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>

        {total === 0 ? (
          <p className="text-muted">{ts.empty}</p>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <Meter
                className="h-1.5 flex-1"
                label={ts.progressLabel}
                value={total === 0 ? 0 : done.length / total}
              />
              <p className="shrink-0 text-sm text-muted tabular-nums">
                {open.length === 0 ? ts.allDone : ts.progress(done.length, total)}
              </p>
            </div>
            {open.length > 0 ? (
              <>
                <SegmentedControl
                  legend={ts.viewLegend}
                  options={VIEW_OPTIONS}
                  value={view}
                  onChange={setView}
                />
                {groups.map((group) => (
                  <Card key={group.key} title={group.label}>
                    <ul className="divide-y divide-line">{group.items.map(row)}</ul>
                  </Card>
                ))}
              </>
            ) : null}
            {done.length > 0 ? (
              <section aria-labelledby="einkauf-gekauft" className="grid gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    id="einkauf-gekauft"
                    aria-expanded={showDone}
                    aria-controls="einkauf-gekauft-liste"
                    onClick={() => {
                      setShowDone((value) => !value);
                    }}
                    className="inline-flex min-h-11 items-center gap-1 font-semibold"
                  >
                    <ChevronDown
                      aria-hidden="true"
                      className={cn('size-5 transition-transform', showDone && 'rotate-180')}
                    />
                    {ts.doneTitle(done.length)}
                  </button>
                  <Button
                    size="sm"
                    variant="quiet"
                    onClick={() => {
                      run(async () => {
                        const ids = await clearDone(rt);
                        setNotice({ kind: 'cleared', ids });
                      });
                    }}
                  >
                    {ts.clearDone}
                  </Button>
                </div>
                {showDone ? (
                  <Card>
                    <ul id="einkauf-gekauft-liste" className="divide-y divide-line">
                      {done.map(row)}
                    </ul>
                  </Card>
                ) : null}
              </section>
            ) : null}
          </>
        )}
        <p className="text-sm text-muted">{ts.planningHint}</p>
      </div>
      {notice ? (
        <Toast
          message={
            notice.kind === 'deleted' ? ts.deleted(notice.item.name) : ts.cleared(notice.ids.length)
          }
          durationMs={10_000}
          onTimeout={() => {
            setNotice(null);
          }}
          action={
            <Button
              variant="onInk"
              size="sm"
              onClick={() => {
                const current = notice;
                setNotice(null);
                run(() =>
                  current.kind === 'deleted'
                    ? restoreItem(rt, current.item.id)
                    : undoClear(rt, current.ids),
                );
              }}
            >
              <RotateCcw aria-hidden="true" className="size-4" />
              {ts.undo}
            </Button>
          }
        />
      ) : null}
    </>
  );
}

function EditItem({
  item,
  onSave,
  onCancel,
  onDelete,
}: {
  item: ShoppingItem;
  onSave: (values: {
    name: string;
    quantity: number | null;
    unit: string | null;
    category: ShoppingCategory | null;
    note: string | null;
  }) => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(
    item.quantity === undefined ? '' : String(item.quantity).replace('.', ','),
  );
  const [unit, setUnit] = useState(item.unit ?? '');
  const [category, setCategory] = useState<ShoppingCategory | ''>(item.category ?? '');
  const [note, setNote] = useState(item.note ?? '');
  const [error, setError] = useState<string | null>(null);
  const id = `einkauf-${item.id}`;
  const units =
    item.unit && !SHOPPING_UNITS.includes(item.unit as never)
      ? [...SHOPPING_UNITS, item.unit]
      : SHOPPING_UNITS;

  return (
    <form
      className="grid gap-3 py-3"
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = name.trim();
        if (trimmed.length === 0) {
          setError(ts.nameMissing);
          return;
        }
        const number = quantity.trim() === '' ? null : Number(quantity.replace(',', '.'));
        if (number !== null && (!Number.isFinite(number) || number <= 0)) {
          setError(ts.quantityInvalid);
          return;
        }
        onSave({
          name: trimmed,
          quantity: number,
          unit: number === null ? null : unit || null,
          category: category === '' ? null : category,
          note: note.trim() || null,
        });
      }}
    >
      <div>
        <label htmlFor={`${id}-name`} className="mb-1 block text-sm font-semibold text-muted">
          {ts.nameLabel}
        </label>
        <input
          id={`${id}-name`}
          type="text"
          value={name}
          maxLength={SHOPPING_NAME_MAX}
          autoFocus
          onChange={(event) => {
            setName(event.target.value);
          }}
          className={INPUT}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="min-w-0">
          <label htmlFor={`${id}-menge`} className="mb-1 block text-sm font-semibold text-muted">
            {ts.quantityLabel}
          </label>
          <input
            id={`${id}-menge`}
            type="text"
            inputMode="decimal"
            value={quantity}
            onChange={(event) => {
              setQuantity(event.target.value);
            }}
            className={INPUT}
          />
        </div>
        <div className="min-w-0">
          <label htmlFor={`${id}-einheit`} className="mb-1 block text-sm font-semibold text-muted">
            {ts.unitLabel}
          </label>
          <select
            id={`${id}-einheit`}
            value={unit}
            onChange={(event) => {
              setUnit(event.target.value);
            }}
            className={INPUT}
          >
            <option value="">{ts.noUnit}</option>
            {units.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor={`${id}-kategorie`} className="mb-1 block text-sm font-semibold text-muted">
          {ts.categoryLabel}
        </label>
        <select
          id={`${id}-kategorie`}
          value={category}
          onChange={(event) => {
            setCategory(event.target.value as ShoppingCategory | '');
          }}
          className={INPUT}
        >
          <option value="">{ts.noCategory}</option>
          {SHOPPING_CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {ts.categories[value]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`${id}-notiz`} className="mb-1 block text-sm font-semibold text-muted">
          {ts.noteLabel}
        </label>
        <input
          id={`${id}-notiz`}
          type="text"
          value={note}
          maxLength={SHOPPING_NOTE_MAX}
          onChange={(event) => {
            setNote(event.target.value);
          }}
          className={INPUT}
        />
      </div>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" size="sm">
          {ts.save}
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={onCancel}>
          {ts.cancel}
        </Button>
        <span className="flex-1" />
        <Button type="button" size="sm" variant="quiet" className="text-danger" onClick={onDelete}>
          {ts.delete}
        </Button>
      </div>
    </form>
  );
}
