import { ChevronLeft, Plus } from 'lucide-react';
import { useDeferredValue, useId, useMemo, useState } from 'react';
import { useFormatters } from '@/modules/settings';
import { t } from '@/shared/i18n/de';
import { parseDecimal } from '@/shared/lib/format';
import { Badge, Button, Dialog, SearchField, SelectField, Skeleton } from '@/shared/ui';
import { searchFoods } from '../calc/foodSearch';
import { scaleNutrients } from '../calc/nutrients';
import type { FoodItem } from '../model/foodItem';
import type { Ingredient } from '../model/recipe';
import { ingredientFrom, InvalidRecipeError } from '../service/recipeService';
import type { Quantity } from '../service/nutritionService';
import { kcal } from './format';
import { useFoodCatalog } from './useFoodCatalog';

const INPUT =
  'h-12 w-full rounded-input border border-line bg-surface px-3 text-base text-fg tabular-nums';

/**
 * Zutat suchen und Menge wählen (D-267): alle Lebensmittel außer Rezepten, wie in „Lebensmittel
 * hinzufügen“; Menge in g bzw. ml oder als Portion des Lebensmittels.
 */
export function IngredientPicker({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (ingredient: Ingredient) => void;
}) {
  const fmt = useFormatters();
  const id = useId();
  const catalog = useFoodCatalog();
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);
  const [food, setFood] = useState<FoodItem | null>(null);
  const [unitChoice, setUnitChoice] = useState('basis');
  const [value, setValue] = useState('100');
  const [error, setError] = useState<string | null>(null);
  const results = useMemo(
    () =>
      catalog
        ? searchFoods(catalog.index, deferred, 60)
            .filter((f) => f.source !== 'recipe')
            .slice(0, 40)
        : [],
    [catalog, deferred],
  );

  const choose = (item: FoodItem) => {
    setFood(item);
    const first = item.servings[0];
    setUnitChoice(first ? first.id : 'basis');
    setValue(first ? '1' : '100');
    setError(null);
  };

  const unit = food ? t.nutrition.units[food.basis] : '';
  const serving = food?.servings.find((s) => s.id === unitChoice);
  const parsed = parseDecimal(value);
  const amount = parsed === null ? null : serving ? parsed * serving.amount : parsed;
  const preview =
    food && amount !== null && amount > 0 ? scaleNutrients(food.per100, amount).kcal : undefined;

  const add = () => {
    if (!food || parsed === null || parsed <= 0) {
      setError(t.nutrition.invalidAmount);
      return;
    }
    const quantity: Quantity = serving
      ? { kind: 'serving', servingId: serving.id, count: parsed }
      : { kind: 'amount', amount: parsed };
    try {
      onAdd(ingredientFrom(food, quantity));
    } catch (caught) {
      if (caught instanceof InvalidRecipeError) setError(t.nutrition.recipes.errors.amount);
      else throw caught;
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={food ? t.nutrition.recipes.amountTitle(food.name) : t.nutrition.recipes.pickTitle}
      closeLabel={t.common.close}
      variant="sheet"
    >
      <div className="grid gap-4 overflow-y-auto p-4">
        {food ? (
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              add();
            }}
          >
            <Button
              variant="quiet"
              size="sm"
              className="justify-self-start"
              onClick={() => {
                setFood(null);
              }}
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
              {t.nutrition.recipes.back}
            </Button>
            {food.servings.length > 0 ? (
              <SelectField
                label={t.nutrition.quantityLabel}
                value={unitChoice}
                options={[
                  ...food.servings.map((s) => ({
                    value: s.id,
                    label: t.nutrition.servingOption(
                      s.name,
                      fmt.number(s.amount, { maximumFractionDigits: 1 }),
                      unit,
                    ),
                  })),
                  { value: 'basis', label: unit },
                ]}
                onChange={(next) => {
                  setUnitChoice(next);
                  setValue(next === 'basis' ? '100' : '1');
                }}
              />
            ) : null}
            <div>
              <label
                htmlFor={`${id}-menge`}
                className="mb-2 block text-sm font-semibold text-muted"
              >
                {serving ? t.nutrition.servingsLabel : t.nutrition.amountLabel(unit)}
              </label>
              <input
                id={`${id}-menge`}
                inputMode="decimal"
                autoComplete="off"
                value={value}
                onChange={(event) => {
                  setValue(event.target.value);
                  setError(null);
                }}
                className={INPUT}
              />
            </div>
            <p role="status" className="font-semibold tabular-nums">
              {preview !== undefined ? t.nutrition.preview(kcal(fmt, preview)) : '–'}
            </p>
            {error ? (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="justify-self-start">
              <Plus aria-hidden="true" className="size-5" />
              {t.nutrition.recipes.add}
            </Button>
          </form>
        ) : (
          <>
            <SearchField
              label={t.nutrition.recipes.pickSearch}
              placeholder={t.nutrition.searchPlaceholder}
              clearLabel={t.exercises.clearSearch}
              value={query}
              onChange={setQuery}
            />
            {catalog === undefined ? (
              <div aria-busy="true">
                <p className="sr-only">{t.nutrition.loadingFoods}</p>
                <Skeleton className="h-32" />
              </div>
            ) : deferred.trim() ? (
              results.length === 0 ? (
                <p className="text-muted">{t.nutrition.noResults}</p>
              ) : (
                <ul
                  aria-label={t.nutrition.results(results.length)}
                  className="divide-y divide-line"
                >
                  {results.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => {
                          choose(item);
                        }}
                        className="flex min-h-12 w-full items-center gap-3 py-2 text-left hover:bg-surface-2"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-medium break-words">{item.name}</span>
                            {item.brand ? (
                              <span className="text-sm text-muted">{item.brand}</span>
                            ) : null}
                            <Badge tone="neutral">
                              {item.catalog
                                ? t.nutrition.catalogBadge[item.catalog]
                                : t.nutrition.sourceBadge[item.source]}
                            </Badge>
                          </span>
                          <span className="block text-sm text-muted">
                            {kcal(fmt, item.per100.kcal ?? 0)} {t.nutrition.units.kcal}{' '}
                            {t.nutrition.per100(t.nutrition.units[item.basis])}
                          </span>
                        </span>
                        <Plus aria-hidden="true" className="size-5 shrink-0 text-muted" />
                      </button>
                    </li>
                  ))}
                </ul>
              )
            ) : null}
          </>
        )}
      </div>
    </Dialog>
  );
}
