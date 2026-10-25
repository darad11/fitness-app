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
import { useOpenShoppingCount } from '@/modules/shopping';
import { tNutrition } from '@/shared/i18n/de-nutrition';
import { tShopping } from '@/shared/i18n/de-shopping';
import { cn } from '@/shared/lib/cn';
import { buttonClasses, isAtLeast, TileIcon, useSwipeToClose } from '@/shared/ui';
import { useFoods, useMealTemplates, useRecipes } from '../data/nutritionRepository';

/** Knopf unter „Gegessen“: Sekundärknopf (Ghost) der Marke FORM, gleich für „Ziel“ und „Meine Küche“ (D-314). */
export const PILL = buttonClasses('secondary', 'row');

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
            className="flex min-h-14 items-center gap-3 rounded-button px-2.5 py-2 hover:bg-surface-2 focus-visible:bg-surface-2"
          >
            <TileIcon icon={Icon} />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{title}</span>
              <span className="block text-sm text-muted">{hint}</span>
            </span>
            {count !== undefined ? (
              <span className="text-sm text-muted tabular-nums">{count}</span>
            ) : null}
            <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-faint" />
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
  const shoppingOpen = useOpenShoppingCount();
  const tk = tNutrition.kitchen;

  const entries: Entry[] = [
    {
      to: '/ernaehrung/lebensmittel',
      icon: UtensilsCrossed,
      title: tNutrition.myFoods,
      hint: tk.foodsHint,
      count: foods?.filter((food) => !food.archivedAt).length,
    },
    {
      to: '/ernaehrung/rezepte',
      icon: CookingPot,
      title: tNutrition.recipes.title,
      hint: tk.recipesHint,
      count: recipes?.filter((recipe) => !recipe.archivedAt).length,
    },
    {
      to: '/ernaehrung/einkaufsliste',
      icon: ShoppingCart,
      title: tShopping.title,
      hint: tShopping.kitchenHint,
      count: shoppingOpen,
    },
    {
      to: '/ernaehrung/vorlagen',
      icon: Bookmark,
      title: tNutrition.templates.title,
      hint: tk.templatesHint,
      count: templates?.length,
    },
  ];

  const close = () => {
    setOpen(null);
  };
  // Am Griff und am Kopf nach unten wegwischen (D-314); Tipp daneben und Escape schließen weiter.
  const swipe = useSwipeToClose(close);

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
          setOpen((current) => (current ? null : isAtLeast('md') ? 'menu' : 'sheet'));
        }}
        className={cn(PILL, 'w-full md:w-auto')}
      >
        <Utensils aria-hidden="true" className="size-5" />
        {tk.title}
      </button>
      {open === 'menu' ? (
        <div
          id={`${id}-panel`}
          role="group"
          aria-label={tk.title}
          className="absolute top-full left-1/2 z-20 mt-2 w-menu max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-card bg-panel p-2 shadow-float"
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
        // Wie das Blatt aus `Dialog`: Inhalt im sicheren Bereich (D-372); bleibt es beim
        // Aufklappen offen, steht es ab 48 rem mittig wie jedes Blatt.
        className="mt-auto mb-0 w-full max-w-none rounded-t-sheet bg-panel p-0 text-fg shadow-float transition-transform duration-240 backdrop:bg-scrim max-md:pr-[env(safe-area-inset-right)] max-md:pl-[env(safe-area-inset-left)] md:inset-x-safe md:m-auto md:max-w-sheet md:rounded-sheet"
      >
        {open === 'sheet' ? (
          <div className="px-4 pt-2.5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
            <div {...swipe} className="touch-none select-none">
              <div aria-hidden="true" className="mx-auto mb-3 h-1 w-9 rounded-pill bg-faint" />
              <h2 id={`${id}-title`} className="text-title font-semibold">
                {tk.title}
              </h2>
              <p className="mb-3 text-sm text-muted">{tk.subtitle}</p>
            </div>
            <div className="rounded-card bg-surface p-1.5 shadow-card">
              <Entries entries={entries} onPick={close} />
            </div>
            <div className="mt-3 grid grid-cols-[repeat(2,minmax(max-content,1fr))] gap-2">
              <Link
                to="/ernaehrung/lebensmittel/neu"
                onClick={close}
                className={buttonClasses('primary', 'row')}
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
