import {
  Bookmark,
  ChevronRight,
  CookingPot,
  Plus,
  ShoppingCart,
  Utensils,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router';
import { isShoppingItemOpen, useShoppingItems } from '@/modules/shopping';
import { t } from '@/shared/i18n/de';
import { tShopping } from '@/shared/i18n/de-shopping';
import { cn } from '@/shared/lib/cn';
import { useFoods, useMealTemplates, useRecipes } from '../data/nutritionRepository';

const WIDE = '(min-width: 48rem)';

function isWide(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(WIDE).matches;
}

/** Pille unter „Gegessen“ (D-272): gleich für „Ziel“ und „Meine Küche“. */
export const PILL =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-pill bg-surface-2 px-5 text-[15px] font-semibold text-fg shadow-[inset_0_0_0_1px_var(--border),inset_0_1px_0_var(--glass-edge)] transition-colors duration-120 hover:bg-surface';

interface Entry {
  to: string;
  icon: LucideIcon;
  title: string;
  hint: string;
  count: number | undefined;
}

function Entries({ entries, onPick }: { entries: readonly Entry[]; onPick: () => void }) {
  return (
    <ul className="grid gap-1">
      {entries.map(({ to, icon: Icon, title, hint, count }) => (
        <li key={to}>
          <Link
            to={to}
            onClick={onPick}
            className="flex min-h-14 items-center gap-3 rounded-[14px] px-2.5 py-2 hover:bg-surface-2 focus-visible:bg-surface-2"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-accent-soft text-accent-ink shadow-[inset_0_0_0_1px_var(--border)]">
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{title}</span>
              <span className="block text-sm text-muted">{hint}</span>
            </span>
            {count !== undefined ? (
              <span className="text-sm text-muted tabular-nums">{count}</span>
            ) : null}
            <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * „Meine Küche“ (D-272): ein Knopf für Meine Lebensmittel, Rezepte und Vorlagen. Am Handy öffnet
 * * er eine Glas-Fläche von unten, ab 768 px ein kleines Menü mittig unter „Ziel“ und „Meine Küche“.
 */
export function KitchenMenu() {
  const id = useId();
  const [open, setOpen] = useState<'menu' | 'sheet' | null>(null);
  const wrapper = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDialogElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const foods = useFoods();
  const recipes = useRecipes();
  const templates = useMealTemplates();
  const shopping = useShoppingItems();
  const tk = t.nutrition.kitchen;

  const entries: Entry[] = [
    {
      to: '/ernaehrung/lebensmittel',
      icon: UtensilsCrossed,
      title: t.nutrition.myFoods,
      hint: tk.foodsHint,
      count: foods?.filter((food) => !food.archivedAt).length,
    },
    {
      to: '/ernaehrung/rezepte',
      icon: CookingPot,
      title: t.nutrition.recipes.title,
      hint: tk.recipesHint,
      count: recipes?.filter((recipe) => !recipe.archivedAt).length,
    },
    {
      to: '/ernaehrung/einkaufsliste',
      icon: ShoppingCart,
      title: tShopping.title,
      hint: tShopping.kitchenHint,
      count: shopping?.filter(isShoppingItemOpen).length,
    },
    {
      to: '/ernaehrung/vorlagen',
      icon: Bookmark,
      title: t.nutrition.templates.title,
      hint: tk.templatesHint,
      count: templates?.length,
    },
  ];

  const close = () => {
    setOpen(null);
  };

  // Menü: schließt bei Klick daneben und mit Escape, Fokus zurück auf den Knopf.
  useEffect(() => {
    if (open !== 'menu') return;
    const onPointer = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(null);
        button.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    wrapper.current?.querySelector<HTMLElement>('a')?.focus();
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    const dialog = sheet.current;
    if (!dialog) return;
    if (open === 'sheet' && !dialog.open) dialog.showModal();
    if (open !== 'sheet' && dialog.open) dialog.close();
  }, [open]);

  return (
    <div ref={wrapper} className="relative md:static">
      <button
        ref={button}
        type="button"
        aria-expanded={open !== null}
        aria-controls={`${id}-panel`}
        onClick={() => {
          setOpen((current) => (current ? null : isWide() ? 'menu' : 'sheet'));
        }}
        className={cn(PILL, 'w-full md:w-auto')}
      >
        <Utensils aria-hidden="true" className="size-5 text-accent-ink" />
        {tk.title}
      </button>
      {open === 'menu' ? (
        <div
          id={`${id}-panel`}
          role="group"
          aria-label={tk.title}
          className="glass-blur absolute top-full left-1/2 z-20 mt-2 w-[22rem] -translate-x-1/2 rounded-[22px] bg-panel p-2 shadow-float"
        >
          <Entries entries={entries} onPick={close} />
        </div>
      ) : null}
      <dialog
        ref={sheet}
        id={open === 'sheet' ? `${id}-panel` : undefined}
        aria-labelledby={`${id}-title`}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClick={(event) => {
          // Tipp auf den abgedunkelten Rand schließt.
          if (event.target === event.currentTarget) close();
        }}
        className="glass-blur mt-auto mb-0 w-full max-w-none rounded-t-sheet bg-panel p-0 text-fg shadow-float backdrop:bg-scrim"
      >
        {open === 'sheet' ? (
          <div className="px-4 pt-2.5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
            <div aria-hidden="true" className="mx-auto mb-3 h-1.5 w-10 rounded-pill bg-line" />
            <h2 id={`${id}-title`} className="text-xl font-bold">
              {tk.title}
            </h2>
            <p className="mb-3 text-sm text-muted">{tk.subtitle}</p>
            <div className="rounded-card bg-surface-2 p-1.5 shadow-[inset_0_0_0_1px_var(--border)]">
              <Entries entries={entries} onPick={close} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                to="/ernaehrung/lebensmittel/neu"
                onClick={close}
                className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-pill bg-accent px-4 font-semibold text-on-accent"
              >
                <Plus aria-hidden="true" className="size-4" />
                {tk.newFood}
              </Link>
              <Link to="/ernaehrung/rezepte/neu" onClick={close} className={PILL}>
                <Plus aria-hidden="true" className="size-4" />
                {tk.newRecipe}
              </Link>
            </div>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
