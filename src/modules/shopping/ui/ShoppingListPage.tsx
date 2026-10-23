import { Check, ChevronDown, Pencil, Plus, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { loadOwnFoodNames } from '@/modules/nutrition';
import { useFormatters } from '@/modules/settings';
import { logError, useDb } from '@/shared/db';
import { tShopping } from '@/shared/i18n/de-shopping';
import { cn } from '@/shared/lib/cn';
import {
  Button,
  Card,
  CheckMark,
  chipClasses,
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
  matchSuggestions,
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
const INPUT = 'field w-full min-w-0';
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
  // Beim Eintragen bleibt die Tastatur offen; damit man trotzdem sieht, was dazukam, steht es
  // direkt unter dem Feld. „Fertig“ schließt die Tastatur. Die Zeile bleibt beim Verlassen des
  // Feldes stehen (sonst springt die Liste unter dem Finger) und weicht erst beim nächsten Eintragen.
  const [justAdded, setJustAdded] = useState<readonly string[]>([]);
  const blurredAt = useRef<number | null>(null);
  const remember = (item: ShoppingItem) => {
    setJustAdded((ids) => [item.id, ...ids.filter((id) => id !== item.id)].slice(0, 3));
  };
  // Eigene Lebensmittel aus „Meine Küche“ als Vorschläge; freie Eingabe bleibt immer möglich.
  const [foodNames, setFoodNames] = useState<readonly string[]>([]);
  useEffect(() => {
    let active = true;
    loadOwnFoodNames(rt.db)
      .then((names) => {
        if (active) setFoodNames(names);
      })
      .catch((caught: unknown) => {
        void logError(rt.db, {
          area: 'shopping',
          error: caught,
          route: '/ernaehrung/einkaufsliste',
        });
      });
    return () => {
      active = false;
    };
  }, [rt.db]);

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
  /** `name` kommt von einem Vorschlag: Menge und Einheit aus dem Getippten bleiben erhalten. */
  const submit = (name?: string) => {
    const trimmed = text.trim();
    if (trimmed.length === 0 && name === undefined) {
      setError(ts.nameMissing);
      return;
    }
    const parsed = parseEntry(trimmed);
    const entry = name === undefined ? parsed : { ...parsed, name };
    const existing = items ? findDuplicate(items, entry.name) : undefined;
    if (existing) {
      setPending({ entry, existing });
      return;
    }
    run(async () => {
      remember(await addItem(rt, entry));
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
  const addedNow = justAdded
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is ShoppingItem => item !== undefined);
  // Vorschläge erst beim Tippen, als eigene Knöpfe unter dem Feld statt der Auswahl des Browsers
  // (die blieb auf dem iPhone nach dem Hinzufügen offen): frühere Namen und eigene Lebensmittel,
  // nicht was schon offen auf der Liste steht (D-287).
  const suggestions = matchSuggestions(
    [...items.map((item) => item.name), ...foodNames],
    open.map((item) => item.name),
    text,
  );
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
          <CheckMark checked={item.doneAt !== undefined} />
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
              enterKeyHint="done"
              onChange={(event) => {
                setText(event.target.value);
                setPending(null);
              }}
              onFocus={() => {
                // Nach einer echten Pause neu beginnen; kurzes Abgeben des Fokus (Plus) zählt nicht.
                if (blurredAt.current !== null && Date.now() - blurredAt.current > 1000) {
                  setJustAdded([]);
                }
                blurredAt.current = null;
              }}
              onBlur={() => {
                blurredAt.current = Date.now();
              }}
              className={INPUT}
            />
            <Button type="submit" aria-label={ts.add}>
              <Plus aria-hidden="true" className="size-5" />
            </Button>
          </form>
          {suggestions.length > 0 && !pending ? (
            <ul aria-label={ts.suggestionsLabel} className="mt-2 flex flex-wrap gap-2">
              {suggestions.map((name) => (
                <li key={name}>
                  <button
                    type="button"
                    aria-label={ts.suggestionAdd(name)}
                    // Fokus im Feld lassen, damit die Tastatur offen bleibt.
                    onPointerDown={(event) => {
                      event.preventDefault();
                    }}
                    onClick={() => {
                      submit(name);
                    }}
                    className={chipClasses(false)}
                  >
                    <Plus aria-hidden="true" className="size-3.5" />
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {addedNow.length > 0 ? (
            <div className="mt-2 flex items-start gap-2">
              <p aria-live="polite" className="min-w-0 flex-1 py-2 text-sm">
                <Check aria-hidden="true" className="mr-1 inline size-4 text-success" />
                <span className="text-muted">{ts.justAdded} </span>
                {addedNow
                  .map((item) => (amount(item) ? `${item.name} ${amount(item)}` : item.name))
                  .join(' · ')}
              </p>
              <Button
                size="sm"
                variant="secondary"
                onPointerDown={(event) => {
                  event.preventDefault();
                }}
                onClick={() => {
                  setJustAdded([]);
                  input.current?.blur();
                }}
              >
                {ts.doneTyping}
              </Button>
            </div>
          ) : null}
          {error ? (
            <p role="alert" className="mt-2 text-sm text-danger">
              {error}
            </p>
          ) : null}
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
                        remember(await mergeQuantity(rt, existing.id, entry.quantity ?? 0));
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
                      remember(await addItem(rt, entry));
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
          {recent.length > 0 && text.trim().length === 0 ? (
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
                      className={chipClasses(false)}
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
              variant="quiet"
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
        <Button type="button" size="sm" variant="quietDanger" onClick={onDelete}>
          {ts.delete}
        </Button>
      </div>
    </form>
  );
}
