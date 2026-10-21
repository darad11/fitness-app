import {
  Apple,
  BookmarkPlus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  ScanBarcode,
  ShoppingCart,
  Target,
} from 'lucide-react';
import { Suspense, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useFormatters } from '@/modules/settings';
import { WaterCard } from '@/modules/water';
import { logError, useDb } from '@/shared/db';
import { tNutrition } from '@/shared/i18n/de-nutrition';
import { tShopping } from '@/shared/i18n/de-shopping';
import { addDays, dayKey as toDayKey, hourIn, isValidDayKey } from '@/shared/lib/time';
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
import { mealSlotAt } from '../calc/mealSlot';
import { sumEntries } from '../calc/nutrients';
import { targetOn } from '../calc/targets';
import { useImportedCatalog } from '../data/catalogStore';
import { useDayEntries, useTargets } from '../data/nutritionRepository';
import { MEAL_SLOTS, type FoodLogEntry, type MealSlot } from '../model/nutrition';
import { restoreEntry } from '../service/nutritionService';
import { EntryDialog } from './EntryDialog';
import { KitchenMenu, PILL } from './KitchenMenu';
import { MacroRing } from './MacroRing';
import { SaveTemplateDialog } from './TemplateDialogs';
import { brandedName, dayDate, describeAmount, entryNameAndBrand, grams, kcal } from './format';

/** Weitere Tageswerte neben den Makros. */
const MACROS = ['protein', 'carbs', 'fat'] as const;
type Macro = (typeof MACROS)[number];

/** Farben der Makro-Balken: Lime, Grün dunkel, Orange gedämpft (Tokens, Kontrast in tokens.test.ts). */
const MACRO_COLORS: Record<Macro, string> = {
  protein: 'var(--macro-protein)',
  carbs: 'var(--macro-carbs)',
  fat: 'var(--macro-fat)',
};

function macroGoal(
  target: { proteinG: number; carbsG: number; fatG: number },
  macro: Macro,
): number {
  return { protein: target.proteinG, carbs: target.carbsG, fat: target.fatG }[macro];
}

/**
 * Weitere Nährwerte in den Spalten der Makros darunter: Salz unter Eiweiß, Zucker und Ballaststoffe
 * unter Kohlenhydrate, gesättigte Fettsäuren unter Fett.
 */
const EXTRAS = [
  { nutrient: 'salt', column: 'col-start-1' },
  { nutrient: 'sugar', column: 'col-start-2' },
  { nutrient: 'saturatedFat', column: 'col-start-3' },
  { nutrient: 'fiber', column: 'col-start-2' },
] as const;

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
  const [saving, setSaving] = useState<MealSlot | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const rt = useDb();
  // Marke älterer Einträge aus den importierten Lebensmitteldaten (D-278).
  const imported = useImportedCatalog();
  const brandOf = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of imported?.items ?? []) if (item.brand) map.set(item.id, item.brand);
    return (foodId: string) => map.get(foodId);
  }, [imported]);

  const goTo = (key: string) => {
    setParams(key === today ? {} : { tag: key }, { replace: true });
  };
  const target = targets ? targetOn(targets, day) : undefined;
  const totals = entries ? sumEntries(entries) : undefined;
  const dateLabel = fmt.weekdayDayMonth(dayDate(day));

  return (
    <>
      <PageHeader title={tNutrition.title} />
      <div className="mb-4 flex items-center justify-between gap-2">
        <IconButton
          label={tNutrition.previousDay}
          onClick={() => {
            goTo(addDays(day, -1));
          }}
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
        </IconButton>
        <div className="text-center">
          <p className="font-semibold" aria-live="polite">
            {day === today ? `${tNutrition.today} · ${dateLabel}` : dateLabel}
          </p>
          {day !== today ? (
            <button
              type="button"
              className="text-sm font-semibold text-accent-ink underline"
              onClick={() => {
                goTo(today);
              }}
            >
              {tNutrition.today}
            </button>
          ) : null}
        </div>
        <IconButton
          label={tNutrition.nextDay}
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
          <Card tone="stage">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:gap-8">
              <p className="eyebrow text-on-ink-muted md:hidden">{tNutrition.eaten}</p>
              {target ? (
                <MacroRing
                  className="self-center md:self-auto"
                  size={11}
                  label={[
                    tNutrition.kcalOf(kcal(fmt, totals.sums.kcal), kcal(fmt, target.kcal)),
                    ...MACROS.map(
                      (macro) =>
                        `${tNutrition.macros[macro]} ${tNutrition.gramsOf(grams(fmt, totals.sums[macro]), grams(fmt, macroGoal(target, macro)))}`,
                    ),
                  ].join(', ')}
                  value={target.kcal > 0 ? totals.sums.kcal / target.kcal : 0}
                >
                  <span className="text-value font-semibold">{kcal(fmt, totals.sums.kcal)}</span>
                  <span className="mt-1 text-xs text-muted">
                    {tNutrition.ofKcal(kcal(fmt, target.kcal))}
                  </span>
                </MacroRing>
              ) : (
                <div>
                  <p className="text-3xl font-semibold tabular-nums">
                    {tNutrition.kcalOnly(kcal(fmt, totals.sums.kcal))}
                  </p>
                  <p className="mt-1 text-sm text-on-ink-muted">{tNutrition.noTarget}</p>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="eyebrow mb-4 hidden text-on-ink-muted md:block">{tNutrition.eaten}</p>
                <dl className="grid grid-cols-3 gap-4 md:gap-6">
                  {MACROS.map((macro) => {
                    const goal = target ? macroGoal(target, macro) : undefined;
                    const eaten = totals.sums[macro];
                    return (
                      <div key={macro} className="min-w-0">
                        <dt className="truncate text-sm text-on-ink-muted">
                          <span aria-hidden="true" className="md:hidden">
                            {tNutrition.macrosShort[macro]}
                          </span>
                          <span className="max-md:sr-only">{tNutrition.macros[macro]}</span>
                        </dt>
                        <dd className="mt-0.5 tabular-nums">
                          <span className="text-xl font-semibold">{grams(fmt, eaten)}</span>
                          {goal !== undefined ? (
                            <span className="text-sm whitespace-nowrap text-on-ink-muted">
                              {` / ${grams(fmt, goal)} ${tNutrition.units.g}`}
                            </span>
                          ) : (
                            <span className="text-xl font-semibold">{` ${tNutrition.units.g}`}</span>
                          )}
                        </dd>
                        {goal !== undefined ? (
                          <Meter
                            label={null}
                            className="mt-2.5"
                            value={goal > 0 ? eaten / goal : 0}
                            color={MACRO_COLORS[macro]}
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </dl>
                {target ? (
                  <p className="mt-3 text-sm text-on-ink-muted">
                    {totals.sums.kcal <= target.kcal
                      ? tNutrition.remaining(kcal(fmt, target.kcal - totals.sums.kcal))
                      : tNutrition.over(kcal(fmt, totals.sums.kcal - target.kcal))}
                  </p>
                ) : null}
              </div>
            </div>
            {/* Dezent zugeklappt: Eiweiß, Kohlenhydrate und Fett bleiben im Vordergrund. */}
            <details className="group mt-1">
              <summary
                aria-label={tNutrition.extrasLabel}
                title={tNutrition.extrasLabel}
                className="mx-auto flex min-h-11 w-16 cursor-pointer list-none items-center justify-center rounded-pill text-on-ink-muted hover:text-on-ink [&::-webkit-details-marker]:hidden"
              >
                <ChevronDown
                  aria-hidden="true"
                  strokeWidth={1.75}
                  className="size-6 transition-transform duration-200 group-open:rotate-180"
                />
              </summary>
              <div role="group" aria-label={tNutrition.extrasLabel}>
                <dl className="mt-1 grid grid-flow-row-dense grid-cols-3 gap-x-3 gap-y-2 text-sm">
                  {EXTRAS.map(({ nutrient, column }) => (
                    <div key={nutrient} className={column}>
                      <dt className="text-on-ink-muted">{tNutrition.extras[nutrient]}</dt>
                      <dd className="font-semibold tabular-nums">
                        {nutrient === 'salt'
                          ? fmt.number(totals.sums.salt, { maximumFractionDigits: 1 })
                          : grams(fmt, totals.sums[nutrient])}{' '}
                        {tNutrition.units.g}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </details>
            {totals.incomplete.some((n) => n !== 'kcal') ? (
              <p className="mt-3 text-sm text-on-ink-muted">
                {tNutrition.incomplete(
                  totals.incomplete
                    .filter((n) => n !== 'kcal')
                    .map((n) => tNutrition.nutrientNames[n])
                    .join(', '),
                )}
              </p>
            ) : null}
            {totals.estimated ? (
              <p className="mt-1 text-sm text-on-ink-muted">{tNutrition.estimatedHint}</p>
            ) : null}
          </Card>

          <nav
            aria-label={tNutrition.shortcuts}
            className="my-2 grid grid-cols-2 gap-2 md:relative md:flex md:justify-center md:gap-3"
          >
            <Link to="/ernaehrung/ziele" className={PILL}>
              <Target aria-hidden="true" className="size-5 text-accent-ink" />
              {tNutrition.kitchen.target}
            </Link>
            <KitchenMenu />
          </nav>

          {MEAL_SLOTS.map((slot) => {
            const items = (entries ?? []).filter((e) => e.slot === slot);
            const slotKcal = items.reduce((sum, e) => sum + (e.nutrients.kcal ?? 0), 0);
            return (
              <Card
                key={slot}
                title={tNutrition.slots[slot]}
                action={
                  items.length > 0 ? (
                    <span className="text-sm font-semibold text-muted tabular-nums">
                      {kcal(fmt, slotKcal)} {tNutrition.units.kcal}
                    </span>
                  ) : undefined
                }
              >
                {items.length === 0 ? (
                  <p className="-mt-2 text-sm text-muted">{tNutrition.emptySlot}</p>
                ) : (
                  <ul className="-mt-2 divide-y divide-line">
                    {items.map((entry) => (
                      <li key={entry.id}>
                        <button
                          type="button"
                          aria-label={tNutrition.entryLabel(
                            brandedName(entryNameAndBrand(entry, brandOf)),
                          )}
                          onClick={() => {
                            setEditing(entry);
                          }}
                          className="flex min-h-12 w-full items-center gap-3 py-2 text-left hover:bg-surface-2"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium break-words">
                              {entryNameAndBrand(entry, brandOf).name}
                            </span>
                            <span className="block text-sm text-muted">
                              {[entryNameAndBrand(entry, brandOf).brand, describeAmount(fmt, entry)]
                                .filter(Boolean)
                                .join(' · ')}
                            </span>
                          </span>
                          <span className="shrink-0 font-semibold tabular-nums">
                            {kcal(fmt, entry.nutrients.kcal ?? 0)} {tNutrition.units.kcal}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  <ButtonLink
                    to={`/ernaehrung/hinzufuegen?tag=${day}&mahlzeit=${slot}`}
                    variant="quiet"
                    size="sm"
                    aria-label={tNutrition.addTo(tNutrition.slots[slot])}
                  >
                    <Plus aria-hidden="true" className="size-4" />
                    {tNutrition.add}
                  </ButtonLink>
                  {items.length > 0 ? (
                    <Button
                      variant="quiet"
                      size="sm"
                      aria-label={tNutrition.templates.saveFromSlotLabel(tNutrition.slots[slot])}
                      onClick={() => {
                        setSaving(slot);
                      }}
                    >
                      <BookmarkPlus aria-hidden="true" className="size-4" />
                      {tNutrition.templates.saveFromSlot}
                    </Button>
                  ) : null}
                </div>
              </Card>
            );
          })}

          <Suspense fallback={null}>
            <WaterCard day={day} />
          </Suspense>
        </div>
      )}

      {editing ? (
        <EntryDialog
          key={editing.id}
          entry={editing}
          brandOf={brandOf}
          onClose={() => {
            setEditing(null);
          }}
          onDeleted={(entry) => {
            setEditing(null);
            setDeleted(entry);
          }}
        />
      ) : null}
      {saving ? (
        <SaveTemplateDialog
          slot={saving}
          entries={(entries ?? []).filter((e) => e.slot === saving)}
          onClose={() => {
            setSaving(null);
          }}
          onSaved={(template) => {
            setNotice(tNutrition.templates.saved(template.name));
          }}
        />
      ) : null}
      {notice && !deleted ? (
        <Toast
          key={notice}
          message={notice}
          durationMs={4000}
          onTimeout={() => {
            setNotice(null);
          }}
        />
      ) : null}
      {deleted ? (
        <Toast
          key={deleted.id}
          message={tNutrition.deleted(entryNameAndBrand(deleted, brandOf).name)}
          durationMs={10_000}
          onTimeout={() => {
            setDeleted(null);
          }}
          action={
            <Button
              variant="quiet"
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
              {tNutrition.undo}
            </Button>
          }
        />
      ) : null}
    </>
  );
}

/**
 * Kurzkarte für „Heute“ (D-275): kleiner Ring wie auf der Ernährungsseite, die drei Makros und
 * „Barcode scannen“ als schnellster Weg zum Eintrag. Der Scanner öffnet sofort; die Mahlzeit
 * folgt der Uhrzeit.
 */
export function NutritionTodayCard() {
  const fmt = useFormatters();
  const now = useToday();
  const today = toDayKey(now, fmt.timeZone);
  const entries = useDayEntries(today);
  const targets = useTargets();
  if (entries === undefined || targets === undefined) return null;
  const target = targetOn(targets, today);
  const sums = sumEntries(entries).sums;
  const hour = hourIn(now, fmt.timeZone);
  const scanTo = `/ernaehrung/hinzufuegen?mahlzeit=${mealSlotAt(hour)}&scan=1&von=heute`;
  return (
    <Card eyebrow={tNutrition.todayCard}>
      <div className="flex items-center gap-4">
        {target ? (
          <MacroRing
            size={7}
            label={[
              tNutrition.kcalOf(kcal(fmt, sums.kcal), kcal(fmt, target.kcal)),
              ...MACROS.map(
                (macro) =>
                  `${tNutrition.macros[macro]} ${tNutrition.gramsOf(grams(fmt, sums[macro]), grams(fmt, macroGoal(target, macro)))}`,
              ),
            ].join(', ')}
            value={target.kcal > 0 ? sums.kcal / target.kcal : 0}
          >
            <span className="text-xl font-semibold">{kcal(fmt, sums.kcal)}</span>
            <span className="text-xs text-muted">{tNutrition.ofKcal(kcal(fmt, target.kcal))}</span>
          </MacroRing>
        ) : null}
        <div className="min-w-0 flex-1">
          {target ? null : (
            <p className="mb-3 text-2xl font-semibold tabular-nums">
              {tNutrition.kcalOnly(kcal(fmt, sums.kcal))}
            </p>
          )}
          <dl className="grid grid-cols-3 gap-3">
            {MACROS.map((macro) => {
              const goal = target ? macroGoal(target, macro) : undefined;
              const eaten = sums[macro];
              return (
                <div key={macro} className="min-w-0 text-center">
                  <dt className="truncate text-xs text-muted">
                    <span aria-hidden="true">{tNutrition.macrosShort[macro]}</span>
                    <span className="sr-only">{tNutrition.macros[macro]}</span>
                  </dt>
                  <dd className="tabular-nums">
                    <span className="block text-lg leading-tight font-semibold">
                      {grams(fmt, eaten)}
                      {/* Ohne Ziel steht die Einheit neben der Zahl, nicht allein darunter. */}
                      {goal === undefined ? (
                        <span className="text-xs font-normal text-muted">{` ${tNutrition.units.g}`}</span>
                      ) : null}
                    </span>
                    {goal !== undefined ? (
                      <span className="block text-xs whitespace-nowrap text-muted">
                        {`/ ${grams(fmt, goal)} ${tNutrition.units.g}`}
                      </span>
                    ) : null}
                  </dd>
                  {goal !== undefined ? (
                    <Meter
                      label={null}
                      className="mt-1.5"
                      value={goal > 0 ? eaten / goal : 0}
                      color={MACRO_COLORS[macro]}
                    />
                  ) : null}
                </div>
              );
            })}
          </dl>
        </div>
      </div>
      {/* Drei runde Symbol-Knöpfe, mittig: scannen, Ernährung, Einkaufsliste. */}
      <div className="mt-4 flex justify-center gap-3">
        {(
          [
            { to: scanTo, label: tNutrition.barcode.scan, icon: ScanBarcode, primary: true },
            { to: '/ernaehrung', label: tNutrition.toNutrition, icon: Apple, primary: false },
            {
              to: '/ernaehrung/einkaufsliste',
              label: tShopping.title,
              icon: ShoppingCart,
              primary: false,
            },
          ] as const
        ).map(({ to, label, icon: Icon, primary }) => (
          <ButtonLink
            key={label}
            to={to}
            aria-label={label}
            title={label}
            variant={primary ? 'primary' : 'secondary'}
            size="icon"
          >
            <Icon aria-hidden="true" className="size-5" />
          </ButtonLink>
        ))}
      </div>
    </Card>
  );
}
