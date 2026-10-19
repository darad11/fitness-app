import { ChevronLeft, ChevronRight, CookingPot, Plus, Target, UtensilsCrossed } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useFormatters } from '@/modules/settings';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { addDays, dayKey as toDayKey, isValidDayKey } from '@/shared/lib/time';
import {
  Button,
  ButtonLink,
  Card,
  IconButton,
  Meter,
  PageHeader,
  Skeleton,
  Toast,
} from '@/shared/ui';
import { useToday } from '@/shared/ui/useToday';
import { sumEntries } from '../calc/nutrients';
import { targetOn } from '../calc/targets';
import { useDayEntries, useTargets } from '../data/nutritionRepository';
import { MEAL_SLOTS, type FoodLogEntry } from '../model/nutrition';
import { restoreEntry } from '../service/nutritionService';
import { EntryDialog } from './EntryDialog';
import { dayDate, describeAmount, grams, kcal } from './format';

/** Weitere Tageswerte neben den Makros. */
const EXTRAS = ['sugar', 'salt', 'fiber', 'saturatedFat'] as const;

/** Ernährung an einem Tag (S-15, NU-02, NU-03, NU-12): Summen, Ziel und vier Mahlzeiten. */
export function NutritionPage() {
  const fmt = useFormatters();
  const now = useToday();
  const today = toDayKey(now, fmt.timeZone);
  const [params, setParams] = useSearchParams();
  const requested = params.get('tag');
  const day = requested && isValidDayKey(requested) ? requested : today;
  const entries = useDayEntries(day);
  const targets = useTargets();
  const [editing, setEditing] = useState<FoodLogEntry | null>(null);
  const [deleted, setDeleted] = useState<FoodLogEntry | null>(null);
  const rt = useDb();

  const goTo = (key: string) => {
    setParams(key === today ? {} : { tag: key }, { replace: true });
  };
  const target = targets ? targetOn(targets, day) : undefined;
  const totals = entries ? sumEntries(entries) : undefined;
  const dateLabel = fmt.weekdayDayMonth(dayDate(day));

  return (
    <>
      <PageHeader title={t.nutrition.title} />
      <div className="mb-4 flex items-center justify-between gap-2">
        <IconButton
          label={t.nutrition.previousDay}
          onClick={() => {
            goTo(addDays(day, -1));
          }}
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
        </IconButton>
        <div className="text-center">
          <p className="font-semibold" aria-live="polite">
            {day === today ? `${t.nutrition.today} · ${dateLabel}` : dateLabel}
          </p>
          {day !== today ? (
            <button
              type="button"
              className="text-sm font-semibold text-accent-ink underline"
              onClick={() => {
                goTo(today);
              }}
            >
              {t.nutrition.today}
            </button>
          ) : null}
        </div>
        <IconButton
          label={t.nutrition.nextDay}
          disabled={day >= today}
          onClick={() => {
            goTo(addDays(day, 1));
          }}
        >
          <ChevronRight aria-hidden="true" className="size-5" />
        </IconButton>
      </div>

      {totals === undefined || targets === undefined ? (
        <div aria-busy="true" className="grid gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-24" />
        </div>
      ) : (
        <div className="grid gap-4">
          <Card tone="ink" eyebrow={t.nutrition.eaten}>
            <p className="text-3xl font-bold tabular-nums">
              {target
                ? t.nutrition.kcalOf(kcal(fmt, totals.sums.kcal), kcal(fmt, target.kcal))
                : t.nutrition.kcalOnly(kcal(fmt, totals.sums.kcal))}
            </p>
            {target ? (
              <>
                <Meter
                  tone="onInk"
                  className="mt-3"
                  label={t.nutrition.kcalOf(kcal(fmt, totals.sums.kcal), kcal(fmt, target.kcal))}
                  value={target.kcal > 0 ? totals.sums.kcal / target.kcal : 0}
                />
                <p className="mt-2 text-sm text-on-ink-muted">
                  {totals.sums.kcal <= target.kcal
                    ? t.nutrition.remaining(kcal(fmt, target.kcal - totals.sums.kcal))
                    : t.nutrition.over(kcal(fmt, totals.sums.kcal - target.kcal))}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-on-ink-muted">{t.nutrition.noTarget}</p>
            )}
            <dl className="mt-4 grid grid-cols-3 gap-3">
              {(['protein', 'carbs', 'fat'] as const).map((macro) => {
                const goal = target
                  ? { protein: target.proteinG, carbs: target.carbsG, fat: target.fatG }[macro]
                  : undefined;
                const eaten = totals.sums[macro];
                return (
                  <div key={macro}>
                    <dt className="text-sm text-on-ink-muted">{t.nutrition.macros[macro]}</dt>
                    <dd className="font-semibold tabular-nums">
                      {goal !== undefined
                        ? t.nutrition.gramsOf(grams(fmt, eaten), grams(fmt, goal))
                        : t.nutrition.gramsOnly(grams(fmt, eaten))}
                    </dd>
                    {goal !== undefined ? (
                      <Meter
                        tone="onInk"
                        className="mt-1"
                        label={`${t.nutrition.macros[macro]}: ${t.nutrition.gramsOf(grams(fmt, eaten), grams(fmt, goal))}`}
                        value={goal > 0 ? eaten / goal : 0}
                      />
                    ) : null}
                  </div>
                );
              })}
            </dl>
            <div role="group" aria-label={t.nutrition.extrasLabel}>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                {EXTRAS.map((nutrient) => (
                  <div key={nutrient} className="flex justify-between gap-2">
                    <dt className="text-on-ink-muted">{t.nutrition.extras[nutrient]}</dt>
                    <dd className="font-semibold tabular-nums">
                      {nutrient === 'salt'
                        ? fmt.number(totals.sums.salt, { maximumFractionDigits: 1 })
                        : grams(fmt, totals.sums[nutrient])}{' '}
                      {t.nutrition.units.g}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            {totals.incomplete.some((n) => n !== 'kcal') ? (
              <p className="mt-3 text-sm text-on-ink-muted">
                {t.nutrition.incomplete(
                  totals.incomplete
                    .filter((n) => n !== 'kcal')
                    .map((n) => t.nutrition.nutrientNames[n])
                    .join(', '),
                )}
              </p>
            ) : null}
            {totals.estimated ? (
              <p className="mt-1 text-sm text-on-ink-muted">{t.nutrition.estimatedHint}</p>
            ) : null}
          </Card>

          {MEAL_SLOTS.map((slot) => {
            const items = (entries ?? []).filter((e) => e.slot === slot);
            const slotKcal = items.reduce((sum, e) => sum + (e.nutrients.kcal ?? 0), 0);
            return (
              <Card
                key={slot}
                title={t.nutrition.slots[slot]}
                action={
                  items.length > 0 ? (
                    <span className="text-sm font-semibold text-muted tabular-nums">
                      {kcal(fmt, slotKcal)} {t.nutrition.units.kcal}
                    </span>
                  ) : undefined
                }
              >
                {items.length === 0 ? (
                  <p className="-mt-2 text-sm text-muted">{t.nutrition.emptySlot}</p>
                ) : (
                  <ul className="-mt-2 divide-y divide-line">
                    {items.map((entry) => (
                      <li key={entry.id}>
                        <button
                          type="button"
                          aria-label={t.nutrition.entryLabel(entry.nameSnapshot)}
                          onClick={() => {
                            setEditing(entry);
                          }}
                          className="flex min-h-12 w-full items-center gap-3 py-2 text-left hover:bg-surface-2"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium break-words">
                              {entry.nameSnapshot}
                            </span>
                            <span className="block text-sm text-muted">
                              {describeAmount(fmt, entry)}
                            </span>
                          </span>
                          <span className="shrink-0 font-semibold tabular-nums">
                            {kcal(fmt, entry.nutrients.kcal ?? 0)} {t.nutrition.units.kcal}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <ButtonLink
                  to={`/ernaehrung/hinzufuegen?tag=${day}&mahlzeit=${slot}`}
                  variant="quiet"
                  size="sm"
                  className="mt-2"
                  aria-label={t.nutrition.addTo(t.nutrition.slots[slot])}
                >
                  <Plus aria-hidden="true" className="size-4" />
                  {t.nutrition.add}
                </ButtonLink>
              </Card>
            );
          })}

          <div className="flex flex-wrap gap-2">
            <ButtonLink to="/ernaehrung/ziele" variant="secondary">
              <Target aria-hidden="true" className="size-5" />
              {target ? t.nutrition.targets : t.nutrition.setTarget}
            </ButtonLink>
            <ButtonLink to="/ernaehrung/lebensmittel" variant="secondary">
              <UtensilsCrossed aria-hidden="true" className="size-5" />
              {t.nutrition.myFoods}
            </ButtonLink>
            <ButtonLink to="/ernaehrung/rezepte" variant="secondary">
              <CookingPot aria-hidden="true" className="size-5" />
              {t.nutrition.recipes.title}
            </ButtonLink>
          </div>
          <p className="text-xs text-muted">{t.nutrition.sources}</p>
        </div>
      )}

      {editing ? (
        <EntryDialog
          key={editing.id}
          entry={editing}
          onClose={() => {
            setEditing(null);
          }}
          onDeleted={(entry) => {
            setEditing(null);
            setDeleted(entry);
          }}
        />
      ) : null}
      {deleted ? (
        <Toast
          key={deleted.id}
          message={t.nutrition.deleted(deleted.nameSnapshot)}
          durationMs={10_000}
          onTimeout={() => {
            setDeleted(null);
          }}
          action={
            <Button
              variant="onInk"
              size="sm"
              onClick={() => {
                const entry = deleted;
                setDeleted(null);
                restoreEntry(rt, entry.id).catch((caught: unknown) => {
                  void logError(rt.db, {
                    area: 'nutrition',
                    error: caught,
                    route: window.location.pathname,
                  });
                });
              }}
            >
              {t.nutrition.undo}
            </Button>
          }
        />
      ) : null}
    </>
  );
}

/** Kurzkarte für „Heute“: gegessen und Ziel (NU-02). */
export function NutritionTodayCard() {
  const fmt = useFormatters();
  const now = useToday();
  const today = toDayKey(now, fmt.timeZone);
  const entries = useDayEntries(today);
  const targets = useTargets();
  if (entries === undefined || targets === undefined) return null;
  const target = targetOn(targets, today);
  if (entries.length === 0 && !target) return null;
  const eaten = sumEntries(entries).sums.kcal;
  return (
    <Card
      eyebrow={t.nutrition.todayCard}
      title={
        target
          ? t.nutrition.kcalOf(kcal(fmt, eaten), kcal(fmt, target.kcal))
          : t.nutrition.kcalOnly(kcal(fmt, eaten))
      }
    >
      {target ? (
        <Meter
          label={t.nutrition.kcalOf(kcal(fmt, eaten), kcal(fmt, target.kcal))}
          value={target.kcal > 0 ? eaten / target.kcal : 0}
        />
      ) : null}
      <Link
        to="/ernaehrung"
        className="mt-3 inline-block text-sm font-semibold text-accent-ink underline"
      >
        {t.nutrition.toNutrition}
      </Link>
    </Card>
  );
}
