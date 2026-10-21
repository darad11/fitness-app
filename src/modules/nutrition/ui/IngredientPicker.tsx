import { ChevronLeft, Plus } from 'lucide-react';
import { useDeferredValue, useId, useMemo, useState } from 'react';
import { useFormatters } from '@/modules/settings';
import { t } from '@/shared/i18n/de';
import { tNutrition } from '@/shared/i18n/de-nutrition';
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

const INPUT = 'field w-full min-w-0';

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

  const unit = food ? tNutrition.units[food.basis] : '';
  const serving = food?.servings.find((s) => s.id === unitChoice);
  const parsed = parseDecimal(value);
  const amount = parsed === null ? null : serving ? parsed * serving.amount : parsed;
  const preview =
    food && amount !== null && amount > 0 ? scaleNutrients(food.per100, amount).kcal : undefined;

  const add = () => {
    if (!food || parsed === null || parsed <= 0) {
      setError(tNutrition.invalidAmount);
      return;
    }
    const quantity: Quantity = serving
      ? { kind: 'serving', servingId: serving.id, count: parsed }
      : { kind: 'amount', amount: parsed };
    try {
      onAdd(ingredientFrom(food, quantity));
    } catch (caught) {
      if (caught instanceof InvalidRecipeError) setError(tNutrition.recipes.errors.amount);
      else throw caught;
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={food ? tNutrition.recipes.amountTitle(food.name) : tNutrition.recipes.pickTitle}
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
              {tNutrition.recipes.back}
            </Button>
            {food.servings.length > 0 ? (
              <SelectField
                label={tNutrition.quantityLabel}
                value={unitChoice}
                options={[
                  ...food.servings.map((s) => ({
                    value: s.id,
                    label: tNutrition.servingOption(
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
                {serving ? tNutrition.servingsLabel : tNutrition.amountLabel(unit)}
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
              {preview !== undefined ? tNutrition.preview(kcal(fmt, preview)) : '–'}
            </p>
            {error ? (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="justify-self-start">
              <Plus aria-hidden="true" className="size-5" />
              {tNutrition.recipes.add}
            </Button>
          </form>
        ) : (
          <>
            <SearchField
              label={tNutrition.recipes.pickSearch}
              placeholder={tNutrition.searchPlaceholder}
              clearLabel={t.exercises.clearSearch}
              value={query}
              onChange={setQuery}
            />
            {catalog === undefined ? (
              <div aria-busy="true">
                <p className="sr-only">{tNutrition.loadingFoods}</p>
                <Skeleton className="h-32" />
              </div>
            ) : deferred.trim() ? (
              results.length === 0 ? (
                <p className="text-muted">{tNutrition.noResults}</p>
              ) : (
                <ul
                  aria-label={tNutrition.results(results.length)}
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
                                ? tNutrition.catalogBadge[item.catalog]
                                : tNutrition.sourceBadge[item.source]}
                            </Badge>
                          </span>
                          <span className="block text-sm text-muted">
                            {kcal(fmt, item.per100.kcal ?? 0)} {tNutrition.units.kcal}{' '}
                            {tNutrition.per100(tNutrition.units[item.basis])}
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
