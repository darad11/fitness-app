import { Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useFormatters } from '@/modules/settings';
import { addShoppingLines } from '@/modules/shopping';
import { logError, useDb } from '@/shared/db';
import { tNutrition } from '@/shared/i18n/de-nutrition';
import { tShopping } from '@/shared/i18n/de-shopping';
import { parseDecimal } from '@/shared/lib/format';
import {
  Button,
  ButtonLink,
  Card,
  Dialog,
  IconButton,
  PageHeader,
  Skeleton,
  Switch,
} from '@/shared/ui';
import { recipeTotals } from '../calc/recipe';
import { useRecipes } from '../data/nutritionRepository';
import type { Ingredient, Recipe } from '../model/recipe';
import {
  createRecipe,
  deleteRecipe,
  InvalidRecipeError,
  setRecipeArchived,
  setRecipeFavorite,
  updateRecipe,
  withAmount,
} from '../service/recipeService';
import { grams } from './format';
import { IngredientPicker } from './IngredientPicker';
import { NutrientTable } from './NutrientTable';

const INPUT =
  'h-12 w-full min-w-0 rounded-input border border-line bg-surface px-3 text-base text-fg tabular-nums';

/** Rezept anlegen oder bearbeiten (M7, D-267). */
export function RecipeEditPage() {
  const { recipeId } = useParams();
  const recipes = useRecipes();
  if (!recipeId) return <RecipeForm />;
  if (recipes === undefined) {
    return (
      <div aria-busy="true">
        <Skeleton className="h-64" />
      </div>
    );
  }
  const recipe = recipes.find((r) => r.id === recipeId);
  if (!recipe) {
    return (
      <>
        <PageHeader
          title={tNutrition.recipes.editTitle}
          back={{ to: '/ernaehrung/rezepte', label: tNutrition.recipes.title }}
        />
        <p className="mb-4 text-muted">{tNutrition.recipes.notFound}</p>
        <ButtonLink to="/ernaehrung/rezepte">{tNutrition.recipes.title}</ButtonLink>
      </>
    );
  }
  return <RecipeForm key={recipe.id} recipe={recipe} />;
}

interface Row {
  ingredient: Ingredient;
  /** Eingabe der Menge in g bzw. ml. */
  amountText: string;
}

function RecipeForm({ recipe }: { recipe?: Recipe }) {
  const rt = useDb();
  const fmt = useFormatters();
  const navigate = useNavigate();
  const id = useId();
  // Ohne Tausendertrennung, weil parseDecimal keine liest (D-291).
  const show = (value: number) =>
    fmt.number(value, { maximumFractionDigits: 1, useGrouping: false });
  const [name, setName] = useState(recipe?.name ?? '');
  const [servingsText, setServingsText] = useState(String(recipe?.servings ?? 1));
  const [rows, setRows] = useState<Row[]>(
    (recipe?.ingredients ?? []).map((ingredient) => ({
      ingredient,
      amountText: show(ingredient.amount),
    })),
  );
  const [steps, setSteps] = useState(recipe?.steps ?? '');
  const [picking, setPicking] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shopped, setShopped] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  /** Zutaten mit den eingegebenen Mengen; `null`, wenn eine Menge keine Zahl ist. */
  const current = useMemo(() => {
    const list: Ingredient[] = [];
    for (const row of rows) {
      const amount = parseDecimal(row.amountText);
      if (amount === null || amount <= 0) return null;
      list.push(amount === row.ingredient.amount ? row.ingredient : { ...row.ingredient, amount });
    }
    return list;
  }, [rows]);
  const servings = Number.parseInt(servingsText, 10);
  const totals =
    current && current.length > 0 && servings >= 1 ? recipeTotals(current, servings) : null;

  const submit = () => {
    setError(null);
    let ingredients: Ingredient[];
    try {
      ingredients = rows.map((row) => {
        const amount = parseDecimal(row.amountText);
        if (amount === null) throw new InvalidRecipeError('amount');
        return amount === row.ingredient.amount
          ? row.ingredient
          : withAmount(row.ingredient, amount);
      });
    } catch (caught) {
      if (caught instanceof InvalidRecipeError) {
        setError(tNutrition.recipes.errors[caught.reason]);
        return;
      }
      throw caught;
    }
    const input = { name, servings: Number(servingsText.trim()), ingredients, steps };
    setBusy(true);
    (recipe ? updateRecipe(rt, recipe.id, input) : createRecipe(rt, input))
      .then(() => navigate('/ernaehrung/rezepte'))
      .catch((caught: unknown) => {
        if (caught instanceof InvalidRecipeError) {
          setError(tNutrition.recipes.errors[caught.reason]);
        } else {
          setError(tNutrition.saveFailed);
          void logError(rt.db, {
            area: 'nutrition',
            error: caught,
            route: window.location.pathname,
          });
        }
      })
      .finally(() => {
        setBusy(false);
      });
  };

  return (
    <>
      <PageHeader
        title={recipe ? tNutrition.recipes.editTitle : tNutrition.recipes.newTitle}
        back={{ to: '/ernaehrung/rezepte', label: tNutrition.recipes.title }}
      />
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <Card>
          <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <div>
              <label htmlFor={`${id}-name`} className="mb-2 block text-sm font-semibold text-muted">
                {tNutrition.recipes.nameLabel}
              </label>
              <input
                id={`${id}-name`}
                required
                maxLength={100}
                autoComplete="off"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                }}
                className={INPUT}
              />
            </div>
            <div>
              <label
                htmlFor={`${id}-servings`}
                className="mb-2 block text-sm font-semibold text-muted"
              >
                {tNutrition.recipes.servingsLabel}
              </label>
              <input
                id={`${id}-servings`}
                inputMode="numeric"
                autoComplete="off"
                value={servingsText}
                onChange={(event) => {
                  setServingsText(event.target.value);
                }}
                className={INPUT}
              />
            </div>
          </div>
        </Card>

        <Card title={tNutrition.recipes.ingredientsTitle}>
          {rows.length === 0 ? (
            <p className="-mt-2 text-sm text-muted">{tNutrition.recipes.noIngredients}</p>
          ) : (
            <ul className="-mt-2 divide-y divide-line">
              {rows.map((row, index) => {
                const unit = tNutrition.units[row.ingredient.basisSnapshot];
                const label = tNutrition.recipes.ingredientAmount(
                  row.ingredient.nameSnapshot,
                  unit,
                );
                return (
                  <li key={row.ingredient.id} className="flex items-center gap-2 py-2">
                    <span className="min-w-0 flex-1 font-medium break-words">
                      {row.ingredient.nameSnapshot}
                      {row.ingredient.servingSnapshot &&
                      row.amountText === show(row.ingredient.amount) ? (
                        <span className="block text-sm font-normal text-muted">
                          {`${fmt.number(row.ingredient.servingSnapshot.count, { maximumFractionDigits: 2 })} × ${row.ingredient.servingSnapshot.name}`}
                        </span>
                      ) : null}
                    </span>
                    <label htmlFor={`${id}-a${String(index)}`} className="sr-only">
                      {label}
                    </label>
                    <input
                      id={`${id}-a${String(index)}`}
                      inputMode="decimal"
                      autoComplete="off"
                      value={row.amountText}
                      onChange={(event) => {
                        const text = event.target.value;
                        setRows((all) =>
                          all.map((r, i) => (i === index ? { ...r, amountText: text } : r)),
                        );
                      }}
                      className={`${INPUT.replace('w-full', 'w-24')} shrink-0 text-right`}
                    />
                    <span aria-hidden="true" className="w-6 text-sm text-muted">
                      {unit}
                    </span>
                    <IconButton
                      label={tNutrition.recipes.removeIngredient(row.ingredient.nameSnapshot)}
                      onClick={() => {
                        setRows((all) => all.filter((_, i) => i !== index));
                      }}
                    >
                      <X aria-hidden="true" className="size-5" />
                    </IconButton>
                  </li>
                );
              })}
            </ul>
          )}
          <Button
            variant="quiet"
            size="sm"
            className="mt-2"
            disabled={rows.length >= 40}
            onClick={() => {
              setPicking(true);
            }}
          >
            <Plus aria-hidden="true" className="size-4" />
            {tNutrition.recipes.addIngredient}
          </Button>
        </Card>

        {totals ? (
          <Card>
            <NutrientTable
              caption={tNutrition.recipes.nutrientsTitle}
              columns={[
                { label: tNutrition.recipes.perServing, values: totals.perServing },
                { label: tNutrition.recipes.total, values: totals.total },
              ]}
            />
            <p className="mt-3 text-sm text-muted">
              {tNutrition.recipes.weightHint(grams(fmt, totals.grams))}
            </p>
            {totals.missing.length > 0 ? (
              <p className="mt-1 text-sm text-muted">
                {tNutrition.recipes.missingHint(
                  totals.missing.map((n) => tNutrition.nutrientNames[n]).join(', '),
                )}
              </p>
            ) : null}
          </Card>
        ) : null}

        <Card>
          <label htmlFor={`${id}-steps`} className="mb-2 block text-sm font-semibold text-muted">
            {tNutrition.recipes.stepsLabel}
          </label>
          <textarea
            id={`${id}-steps`}
            rows={5}
            maxLength={5000}
            value={steps}
            onChange={(event) => {
              setSteps(event.target.value);
            }}
            className="w-full rounded-input border border-line bg-surface p-3 text-base text-fg"
          />
        </Card>

        {recipe ? (
          <Card>
            <Switch
              label={tNutrition.favorite}
              checked={recipe.favorite === true}
              onChange={(checked) => void setRecipeFavorite(rt, recipe.id, checked)}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => void setRecipeArchived(rt, recipe.id, !recipe.archivedAt)}
              >
                {recipe.archivedAt ? tNutrition.unarchive : tNutrition.archive}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setConfirmDelete(true);
                }}
              >
                <Trash2 aria-hidden="true" className="size-5" />
                {tNutrition.recipes.delete}
              </Button>
            </div>
          </Card>
        ) : null}

        {error ? (
          <p role="alert" className="text-danger">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={busy} className="justify-self-start">
          {tNutrition.recipes.save}
        </Button>
      </form>

      {recipe ? (
        // D-287: gespeicherte Zutaten auf die Einkaufsliste; gleiche Zutaten werden zusammengerechnet.
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              addShoppingLines(
                rt,
                recipe.ingredients.map((ingredient) => ({
                  name: ingredient.nameSnapshot,
                  quantity: ingredient.amount,
                  unit: ingredient.basisSnapshot,
                })),
              ).then(
                ({ added, merged }) => {
                  setShopped(added + merged);
                },
                (caught: unknown) => {
                  setError(tNutrition.saveFailed);
                  void logError(rt.db, {
                    area: 'nutrition',
                    error: caught,
                    route: window.location.pathname,
                  });
                },
              );
            }}
          >
            <ShoppingCart aria-hidden="true" className="size-5" />
            {tNutrition.recipes.toShopping}
          </Button>
          {shopped !== null ? (
            <p role="status" className="text-sm text-muted">
              {tNutrition.recipes.toShoppingDone(shopped)}{' '}
              <Link to="/ernaehrung/einkaufsliste" className="font-semibold text-accent-ink">
                {tShopping.title}
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}

      {picking ? (
        <IngredientPicker
          onClose={() => {
            setPicking(false);
          }}
          onAdd={(ingredient) => {
            setRows((all) => [...all, { ingredient, amountText: show(ingredient.amount) }]);
            setPicking(false);
          }}
        />
      ) : null}

      {recipe ? (
        <Dialog
          open={confirmDelete}
          onClose={() => {
            setConfirmDelete(false);
          }}
          title={tNutrition.recipes.deleteTitle}
          closeLabel={tNutrition.cancel}
          actions={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setConfirmDelete(false);
                }}
              >
                {tNutrition.cancel}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  deleteRecipe(rt, recipe.id).then(
                    () => navigate('/ernaehrung/rezepte'),
                    (caught: unknown) => {
                      setConfirmDelete(false);
                      setError(tNutrition.saveFailed);
                      void logError(rt.db, {
                        area: 'nutrition',
                        error: caught,
                        route: window.location.pathname,
                      });
                    },
                  );
                }}
              >
                {tNutrition.recipes.delete}
              </Button>
            </>
          }
        >
          <p>{tNutrition.recipes.deleteText}</p>
        </Dialog>
      ) : null}
    </>
  );
}
