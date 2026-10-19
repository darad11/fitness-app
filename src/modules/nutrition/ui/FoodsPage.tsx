import { ChevronRight, Plus, Star } from 'lucide-react';
import { Link } from 'react-router';
import { useFormatters } from '@/modules/settings';
import { t } from '@/shared/i18n/de';
import { ButtonLink, PageHeader, Skeleton } from '@/shared/ui';
import { useFoods } from '../data/nutritionRepository';
import type { Food } from '../model/nutrition';
import { CatalogCard } from './CatalogCard';
import { kcal } from './format';

/** Eigene Lebensmittel (S-18, NU-10). */
export function FoodsPage() {
  const foods = useFoods();
  const fmt = useFormatters();
  const active = foods?.filter((f) => !f.archivedAt) ?? [];
  const archived = foods?.filter((f) => f.archivedAt) ?? [];
  const list = (items: readonly Food[], label: string) => (
    <ul
      aria-label={label}
      className="divide-y divide-line overflow-hidden rounded-card bg-surface shadow-card"
    >
      {items.map((food) => (
        <li key={food.id}>
          <Link
            to={`/ernaehrung/lebensmittel/${food.id}`}
            className="flex min-h-14 items-center gap-3 px-5 py-3 hover:bg-surface-2"
          >
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2 font-medium">
                {food.name}
                {food.favorite ? (
                  <Star aria-label={t.nutrition.favorite} className="size-4 text-accent-ink" />
                ) : null}
              </span>
              <span className="block text-sm text-muted">
                {[
                  food.brand,
                  `${kcal(fmt, food.per100.kcal ?? 0)} ${t.nutrition.units.kcal} ${t.nutrition.per100(t.nutrition.units[food.basis])}`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </span>
            <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted" />
          </Link>
        </li>
      ))}
    </ul>
  );
  return (
    <>
      <PageHeader
        title={t.nutrition.foodsTitle}
        back={{ to: '/ernaehrung', label: t.nutrition.title }}
      />
      <ButtonLink to="/ernaehrung/lebensmittel/neu" className="mb-4">
        <Plus aria-hidden="true" className="size-5" />
        {t.nutrition.newFood}
      </ButtonLink>
      {foods === undefined ? (
        <Skeleton className="h-32" />
      ) : active.length === 0 ? (
        <p className="rounded-card bg-surface-2 p-4 text-muted">{t.nutrition.foodsEmpty}</p>
      ) : (
        list(active, t.nutrition.foodsTitle)
      )}
      {archived.length > 0 ? (
        <details className="mt-6">
          <summary className="eyebrow cursor-pointer py-2 text-muted">
            {t.nutrition.archivedTitle(archived.length)}
          </summary>
          <div className="mt-2">{list(archived, t.nutrition.archivedTitle(archived.length))}</div>
        </details>
      ) : null}
      <CatalogCard />
    </>
  );
}
