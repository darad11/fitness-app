import {
  Apple,
  BookmarkPlus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Plus,
  ScanBarcode,
  ShoppingCart,
  Soup,
  Target,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import { Suspense, useId, useMemo, useState } from 'react';
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
  NameRest,
  PageHeader,
  Skeleton,
  TileIcon,
  Toast,
} from '@/shared/ui';
import { useToday } from '@/shared/ui/useToday';
import { mealSlotAt } from '../calc/mealSlot';
import { sumEntries } from '../calc/nutrients';
import { referenceLines } from '../calc/references';
import { macroRing } from '../calc/ring';
import { targetOn } from '../calc/targets';
import { useImportedCatalog } from '../data/catalogStore';
import { useDayEntries, useTargets } from '../data/nutritionRepository';
import { MEAL_SLOTS, type FoodLogEntry, type MealSlot } from '../model/nutrition';
import { restoreEntry } from '../service/nutritionService';
import { EntryDialog } from './EntryDialog';
import { ExtrasPanel } from './ExtrasPanel';
import { KitchenMenu, PILL } from './KitchenMenu';
import { MacroRing, RING_COLORS, ringLabel } from './MacroRing';
import { SaveTemplateDialog } from './TemplateDialogs';
import { dayDate, describeAmount, entryNameAndBrand, grams, kcal } from './format';
import './nutrition-layout.css';

/** Symbol je Mahlzeit in der Kachel (FORM, D-315). */
const SLOT_ICONS: Record<MealSlot, LucideIcon> = {
  breakfast: Coffee,
  lunch: Soup,
  dinner: UtensilsCrossed,
  snacks: Apple,
};

/** Weitere Tageswerte neben den Makros. */
const MACROS = ['protein', 'carbs', 'fat'] as const;
type Macro = (typeof MACROS)[number];

/** Farben der Makro-Balken: dieselben wie im Ring, Türkis, Blau, Violett (D-333). */
const MACRO_COLORS: Record<Macro, string> = {
  protein: RING_COLORS.protein,
  carbs: RING_COLORS.carbs,
  fat: RING_COLORS.fat,
};

function macroGoal(
  target: { proteinG: number; carbsG: number; fatG: number },
  macro: Macro,
): number {
  return { protein: target.proteinG, carbs: target.carbsG, fat: target.fatG }[macro];
}

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
  const entryIds = useId();
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
  // Salz, Zucker, gesättigte Fettsäuren und Ballaststoffe mit Tagesreferenz (D-359); Zucker und
  // gesättigte Fettsäuren aus 10 % der Kalorien des Tagesziels (D-369). Einträge ohne Angabe
  // zählen nicht als 0, sie werden genannt.
  const referenceEntries = useMemo(
    () =>
      (entries ?? []).map((entry) => ({ nutrients: entry.nutrients, name: entry.nameSnapshot })),
    [entries],
  );
  const references = referenceLines(referenceEntries, target?.kcal);
  const ring = target && totals ? macroRing(totals.sums, target.kcal) : undefined;
  // Der Hinweis unter den Makros nennt nur Eiweiß, Kohlenhydrate und Fett; die weiteren
  // Nährwerte tragen bei fehlenden Werten ein Sternchen (D-363).
  const missingMacros = totals ? MACROS.filter((macro) => totals.incomplete.includes(macro)) : [];
  // Kurz, damit die Zeile auf dem Handy einzeilig bleibt: „Heute · Do., 22. Okt.“ (D-326).
  const dateLabel = fmt.weekdayDayMonthShort(dayDate(day));

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
          <p className="font-semibold whitespace-nowrap" aria-live="polite">
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
        <div className="nutrition-frame">
          {/* Aufgeklappt zwei Spalten (D-381, `nutrition-layout.css`): links Ring, Makros und
              weitere Nährwerte mit „Ziel“ und „Meine Küche“, rechts Mahlzeiten und Wasser. Schmal
              eine Spalte in derselben Reihenfolge; nur angeordnet, nichts neu aufgebaut. */}
          <div className="nutrition-grid grid gap-stack">
            <Card
              className="nutrition-stage"
              tone="stage"
              title={tNutrition.eaten}
              titleStyle="label"
            >
              {/* Aufbau wie in der bisherigen App (D-326): großer Ring mittig, darunter drei Spalten
                mit Ist / Ziel und Balken in den Farben der Abschnitte, darunter „noch x kcal“. */}
              {target && ring ? (
                <div className="flex justify-center">
                  <MacroRing model={ring} label={ringLabel(fmt, ring)} size={10} stroke={12}>
                    <span className="text-value font-semibold">{kcal(fmt, totals.sums.kcal)}</span>
                    <span className="mt-1 text-sm text-muted">
                      {tNutrition.ofKcal(kcal(fmt, target.kcal))}
                    </span>
                  </MacroRing>
                </div>
              ) : (
                <div>
                  <p className="text-value font-semibold">
                    {tNutrition.kcalOnly(kcal(fmt, totals.sums.kcal))}
                  </p>
                  <p className="mt-1 text-sm text-muted">{tNutrition.noTarget}</p>
                </div>
              )}
              <dl className="mt-5 grid grid-cols-3 gap-3">
                {MACROS.map((macro) => {
                  const goal = target ? macroGoal(target, macro) : undefined;
                  const eaten = totals.sums[macro];
                  return (
                    <div key={macro} className="min-w-0">
                      <dt className="truncate text-sm text-muted">
                        <span aria-hidden="true">{tNutrition.macrosShort[macro]}</span>
                        <span className="sr-only">{tNutrition.macros[macro]}</span>
                      </dt>
                      <dd className="mt-0.5 text-sm whitespace-nowrap text-muted">
                        <span className="text-lg font-semibold text-fg">{grams(fmt, eaten)}</span>
                        {goal !== undefined
                          ? ` / ${grams(fmt, goal)} ${tNutrition.units.g}`
                          : ` ${tNutrition.units.g}`}
                      </dd>
                      {goal !== undefined ? (
                        <Meter
                          label={null}
                          className="mt-2"
                          value={goal > 0 ? eaten / goal : 0}
                          color={MACRO_COLORS[macro]}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </dl>
              {ring ? (
                <p className="mt-4 text-sm text-muted">
                  {ring.over > 0
                    ? tNutrition.over(kcal(fmt, ring.over))
                    : tNutrition.remaining(kcal(fmt, ring.remaining))}
                </p>
              ) : null}
              {missingMacros.length > 0 ? (
                <p className="mt-3 text-sm text-muted">
                  {tNutrition.incomplete(missingMacros.map((n) => tNutrition.nutrientNames[n]))}
                </p>
              ) : null}
              {totals.estimated ? (
                <p className="mt-1 text-sm text-muted">{tNutrition.estimatedHint}</p>
              ) : null}
              {/* Dezent zugeklappt: Eiweiß, Kohlenhydrate und Fett bleiben im Vordergrund. */}
              <details className="group mt-1">
                <summary
                  aria-label={tNutrition.extrasLabel}
                  title={tNutrition.extrasLabel}
                  className="mx-auto flex min-h-11 w-16 cursor-pointer list-none items-center justify-center rounded-pill text-muted hover:text-fg [&::-webkit-details-marker]:hidden"
                >
                  <ChevronDown
                    aria-hidden="true"
                    strokeWidth={1.75}
                    className="size-6 transition-transform duration-200 group-open:rotate-180"
                  />
                </summary>
                {/* Je Wert eine Zeile „Ist / Referenz g“ (D-363); Erklärung, Quellen und
                  Einträge ohne Angabe im Blatt hinter dem Info-Symbol. */}
                <ExtrasPanel lines={references} />
              </details>
            </Card>

            {/* Zwei gleich breite Knöpfe; braucht einer mehr Platz (breitere Schrift), wird seine
              Spalte breiter, statt dass der Text umbricht (F5 Abschnitt 9, D-331). */}
            <nav
              aria-label={tNutrition.shortcuts}
              className="nutrition-nav my-2 grid grid-cols-[repeat(2,minmax(max-content,1fr))] gap-2 md:relative md:flex md:justify-center md:gap-3"
            >
              <Link to="/ernaehrung/ziele" className={PILL}>
                <Target aria-hidden="true" className="size-5" />
                {tNutrition.kitchen.target}
              </Link>
              <KitchenMenu />
            </nav>

            {/* Mahlzeiten und Wasser in einem Rahmen: aufgeklappt die rechte Spalte. */}
            <div className="nutrition-meals grid gap-stack">
              {MEAL_SLOTS.map((slot) => {
                const items = (entries ?? []).filter((e) => e.slot === slot);
                const slotKcal = items.reduce((sum, e) => sum + (e.nutrients.kcal ?? 0), 0);
                return (
                  <section
                    key={slot}
                    aria-labelledby={`mahlzeit-${slot}`}
                    className="rounded-card bg-surface p-card shadow-card"
                  >
                    {/* Mahlzeit als Listenzeile (FORM, D-315): Kachel, Titel, Beschreibung, kcal rechts. */}
                    <div className="flex items-center gap-3">
                      <TileIcon icon={SLOT_ICONS[slot]} />
                      <div className="min-w-0 flex-1">
                        <h2 id={`mahlzeit-${slot}`} className="font-semibold">
                          {tNutrition.slots[slot]}
                        </h2>
                        <p className="text-caption text-muted">
                          {items.length === 0
                            ? tNutrition.emptySlot
                            : tNutrition.entryCount(items.length)}
                        </p>
                      </div>
                      {items.length > 0 ? (
                        <span className="shrink-0 font-semibold">
                          {kcal(fmt, slotKcal)} {tNutrition.units.kcal}
                        </span>
                      ) : null}
                    </div>
                    {items.length > 0 ? (
                      <ul className="mt-2 divide-y divide-line">
                        {items.map((entry) => {
                          const { name, brand } = entryNameAndBrand(entry, brandOf);
                          const ids = {
                            amount: `${entryIds}-${entry.id}-menge`,
                            kcal: `${entryIds}-${entry.id}-kcal`,
                          };
                          return (
                            <li key={entry.id}>
                              {/* Name aus dem Inhalt statt `aria-label` (D-377, WCAG 2.5.3 „Label
                              in Name“): sichtbarer Name und unsichtbar „von Marke bearbeiten“;
                              Menge und Kalorien beschreiben den Knopf. */}
                              <button
                                type="button"
                                aria-describedby={`${ids.amount} ${ids.kcal}`}
                                onClick={() => {
                                  setEditing(entry);
                                }}
                                className="flex min-h-12 w-full items-center gap-3 py-2 text-left hover:bg-surface-2"
                              >
                                <span className="min-w-0 flex-1">
                                  <span className="block font-medium break-words">{name}</span>
                                  <span
                                    aria-hidden="true"
                                    className="block text-caption text-muted"
                                  >
                                    {brand ? `${brand} · ` : null}
                                    <span id={ids.amount}>{describeAmount(fmt, entry)}</span>
                                  </span>
                                </span>
                                <NameRest
                                  full={tNutrition.entryLabel(name, brand)}
                                  visible={name}
                                />
                                <span
                                  id={ids.kcal}
                                  aria-hidden="true"
                                  className="shrink-0 text-muted"
                                >
                                  {kcal(fmt, entry.nutrients.kcal ?? 0)} {tNutrition.units.kcal}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                    <div className="mt-2 -ml-3 flex flex-wrap gap-2">
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
                          aria-label={tNutrition.templates.saveFromSlotLabel(
                            tNutrition.slots[slot],
                          )}
                          onClick={() => {
                            setSaving(slot);
                          }}
                        >
                          <BookmarkPlus aria-hidden="true" className="size-4" />
                          {tNutrition.templates.saveFromSlot}
                        </Button>
                      ) : null}
                    </div>
                  </section>
                );
              })}

              <Suspense fallback={null}>
                <WaterCard day={day} />
              </Suspense>
            </div>
          </div>
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
 * Kurzkarte für „Heute“ (D-275, FORM D-315): Ring (Lime) mit den Kalorien links, rechts Eiweiß,
 * Kohlenhydrate und Fett mit Balken in Lime, Grün dunkel und Orange gedämpft; darunter drei
 * Schnellaktionen als Symbol-Knöpfe in card-2 („Barcode scannen“ öffnet den Scanner sofort, die
 * Mahlzeit folgt der Uhrzeit). Ist die Karte höher als ihr Inhalt (zwei Spalten, so hoch wie die
 * Wasser-Karte daneben), stehen die Knöpfe mittig im freien Raum unter den Makros (D-387).
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
  const ring = target ? macroRing(sums, target.kcal) : undefined;
  const hour = hourIn(now, fmt.timeZone);
  const scanTo = `/ernaehrung/hinzufuegen?mahlzeit=${mealSlotAt(hour)}&scan=1&von=heute`;
  return (
    <Card title={tNutrition.todayCard} titleStyle="label" className="flex flex-col">
      <div className="flex items-center gap-5">
        {target && ring ? (
          <MacroRing model={ring} label={ringLabel(fmt, ring)} size={7}>
            <span className="text-2xl font-semibold">{kcal(fmt, sums.kcal)}</span>
            <span className="text-xs text-muted">{tNutrition.ofKcal(kcal(fmt, target.kcal))}</span>
          </MacroRing>
        ) : (
          <p className="text-2xl font-semibold">{tNutrition.kcalOnly(kcal(fmt, sums.kcal))}</p>
        )}
        <dl className="grid min-w-0 flex-1 gap-3">
          {MACROS.map((macro) => {
            const goal = target ? macroGoal(target, macro) : undefined;
            const eaten = sums[macro];
            return (
              <div key={macro} className="grid grid-cols-[1fr_auto] items-baseline gap-x-2">
                <dt className="truncate text-sm text-muted">
                  <span aria-hidden="true">{tNutrition.macrosShort[macro]}</span>
                  <span className="sr-only">{tNutrition.macros[macro]}</span>
                </dt>
                <dd className="text-sm whitespace-nowrap text-muted">
                  <span className="font-semibold text-fg">{grams(fmt, eaten)}</span>
                  {goal !== undefined
                    ? ` / ${grams(fmt, goal)} ${tNutrition.units.g}`
                    : ` ${tNutrition.units.g}`}
                </dd>
                {goal !== undefined ? (
                  <Meter
                    label={null}
                    className="col-span-2 mt-1.5"
                    value={goal > 0 ? eaten / goal : 0}
                    color={MACRO_COLORS[macro]}
                  />
                ) : null}
              </div>
            );
          })}
        </dl>
      </div>
      {ring && ring.over > 0 ? (
        <p className="mt-3 text-sm text-muted">{tNutrition.over(kcal(fmt, ring.over))}</p>
      ) : null}
      {/* Drei runde Symbol-Knöpfe in card-2, mittig: scannen, Ernährung, Einkaufsliste. Die Zeile
          nimmt den übrigen Platz der Karte; zwei gleich wachsende Abstände darüber und darunter
          stellen die Knöpfe mittig in den freien Raum unter den Makros, mindestens 16 px darunter
          (D-387). Ohne freien Raum (eine Spalte) bleibt es bei 16 px Abstand wie bisher. */}
      <div className="flex flex-1 flex-col before:min-h-4 before:flex-1 after:flex-1">
        <div className="flex justify-center gap-3">
          {(
            [
              { to: scanTo, label: tNutrition.barcode.scan, icon: ScanBarcode },
              { to: '/ernaehrung', label: tNutrition.toNutrition, icon: Apple },
              { to: '/ernaehrung/einkaufsliste', label: tShopping.title, icon: ShoppingCart },
            ] as const
          ).map(({ to, label, icon: Icon }) => (
            <ButtonLink
              key={label}
              to={to}
              aria-label={label}
              title={label}
              variant="tile"
              size="icon"
            >
              <Icon aria-hidden="true" className="size-5" />
            </ButtonLink>
          ))}
        </div>
      </div>
    </Card>
  );
}
