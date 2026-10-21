import { ChevronRight, Plus, Star } from 'lucide-react';
import { Link } from 'react-router';
import { useFormatters } from '@/modules/settings';
import { tNutrition } from '@/shared/i18n/de-nutrition';
import { ButtonLink, PageHeader, Skeleton } from '@/shared/ui';
import { recipeTotals } from '../calc/recipe';
import { useRecipes } from '../data/nutritionRepository';
import type { Recipe } from '../model/recipe';
import { kcal } from './format';

/** Rezepte (M7, D-267): Liste mit Portionen und kcal je Portion, Archiv eingeklappt. */
export function RecipesPage() {
  const recipes = useRecipes();
  const fmt = useFormatters();
  const active = recipes?.filter((r) => !r.archivedAt) ?? [];
  const archived = recipes?.filter((r) => r.archivedAt) ?? [];
  const list = (items: readonly Recipe[], label: string) => (
    <ul
      aria-label={label}
      className="divide-y divide-line overflow-hidden rounded-card bg-surface shadow-card"
    >
      {items.map((recipe) => {
        const totals = recipeTotals(recipe.ingredients, recipe.servings);
        return (
          <li key={recipe.id}>
            <Link
              to={`/ernaehrung/rezepte/${recipe.id}`}
              className="flex min-h-14 items-center gap-3 px-5 py-3 hover:bg-surface-2"
            >
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2 font-medium">
                  {recipe.name}
                  {recipe.favorite ? (
                    <Star aria-label={tNutrition.favorite} className="size-4 text-accent-ink" />
                  ) : null}
                </span>
                <span className="block text-sm text-muted">
                  {tNutrition.recipes.summary(
                    recipe.servings,
                    kcal(fmt, totals.perServing.kcal ?? 0),
                  )}
                </span>
              </span>
              <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
  return (
    <>
      <PageHeader
        title={tNutrition.recipes.title}
        back={{ to: '/ernaehrung', label: tNutrition.title }}
      />
      <ButtonLink to="/ernaehrung/rezepte/neu" className="mb-4">
        <Plus aria-hidden="true" className="size-5" />
        {tNutrition.recipes.newRecipe}
      </ButtonLink>
      {recipes === undefined ? (
        <Skeleton className="h-32" />
      ) : active.length === 0 ? (
        <p className="rounded-card bg-surface-2 p-4 text-muted">{tNutrition.recipes.empty}</p>
      ) : (
        list(active, tNutrition.recipes.title)
      )}
      {archived.length > 0 ? (
        <details className="mt-6">
          <summary className="eyebrow cursor-pointer py-2 text-muted">
            {tNutrition.archivedTitle(archived.length)}
          </summary>
          <div className="mt-2">{list(archived, tNutrition.archivedTitle(archived.length))}</div>
        </details>
      ) : null}
    </>
  );
}
