import { Bookmark, Plus, ScanBarcode, Star, Zap } from 'lucide-react';
import { useDeferredValue, useId, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useFormatters } from '@/modules/settings';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { tNutrition } from '@/shared/i18n/de-nutrition';
import { parseDecimal } from '@/shared/lib/format';
import { addDays, dayKey as toDayKey, isValidDayKey } from '@/shared/lib/time';
import {
  Badge,
  Button,
  ButtonLink,
  Dialog,
  PageHeader,
  SearchField,
  SelectField,
  Skeleton,
} from '@/shared/ui';
import { useToday } from '@/shared/ui/useToday';
import { searchFoods } from '../calc/foodSearch';
import { useEntriesSince, useMealTemplates } from '../data/nutritionRepository';
import type { MealTemplate } from '../model/mealTemplate';
import type { FoodItem } from '../model/foodItem';
import { MEAL_SLOTS, type MealSlot } from '../model/nutrition';
import { logQuick } from '../service/nutritionService';
import { BarcodeFlow } from './BarcodeFlow';
import { kcal } from './format';
import { LogDialog } from './LogDialog';
import { useSubmitOnce } from './useSubmitOnce';
import { ApplyTemplateDialog, templateKcal } from './TemplateDialogs';
import { useFoodCatalog } from './useFoodCatalog';

const INPUT = 'field w-full min-w-0';
const RECENT_DAYS = 30;
const RECENT_LIMIT = 12;

function isSlot(value: string | null): value is MealSlot {
  return MEAL_SLOTS.includes(value as MealSlot);
}

/** Lebensmittel hinzufügen (S-16, NU-06, NU-08, NU-11, NU-20). */
export function AddFoodPage() {
  const fmt = useFormatters();
  const now = useToday();
  const navigate = useNavigate();
  const today = toDayKey(now, fmt.timeZone);
  const [params] = useSearchParams();
  const requestedDay = params.get('tag');
  const day = requestedDay && isValidDayKey(requestedDay) ? requestedDay : today;
  const requestedSlot = params.get('mahlzeit');
  const [slot, setSlot] = useState<MealSlot>(isSlot(requestedSlot) ? requestedSlot : 'snacks');
  const catalog = useFoodCatalog();
  const recentEntries = useEntriesSince(addDays(day, -RECENT_DAYS));
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);
  const [picked, setPicked] = useState<FoodItem | null>(null);
  const [quick, setQuick] = useState(false);
  // Schnell-Eintrag von „Heute“ (D-275): Scanner sofort offen, danach zurück zu „Heute“.
  const fromToday = params.get('von') === 'heute';
  const [scanning, setScanning] = useState(params.get('scan') === '1');
  const [applying, setApplying] = useState<MealTemplate | null>(null);
  const templates = useMealTemplates();
  const [savedNotice, setSavedNotice] = useState(false);
  const back = fromToday ? '/heute' : `/ernaehrung${day === today ? '' : `?tag=${day}`}`;

  const results = useMemo(
    () => (catalog ? searchFoods(catalog.index, deferred) : []),
    [catalog, deferred],
  );
  const recent = useMemo(() => {
    if (!catalog || !recentEntries) return [];
    const seen = new Set<string>();
    const list: FoodItem[] = [];
    for (const entry of [...recentEntries].sort((a, b) => b.loggedAt.localeCompare(a.loggedAt))) {
      if (!entry.foodId || seen.has(entry.foodId)) continue;
      seen.add(entry.foodId);
      const food = catalog.byId.get(entry.foodId);
      if (food && !food.archivedAt) list.push(food);
      if (list.length >= RECENT_LIMIT) break;
    }
    return list;
  }, [catalog, recentEntries]);
  const favorites = catalog ? catalog.own.filter((f) => f.favorite && !f.archivedAt) : [];

  const list = (items: readonly FoodItem[], label: string) => (
    <ul
      aria-label={label}
      className="divide-y divide-line overflow-hidden rounded-card bg-surface shadow-card"
    >
      {items.map((food) => (
        <li key={food.id}>
          <button
            type="button"
            onClick={() => {
              setPicked(food);
            }}
            className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-2"
          >
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-medium break-words">{food.name}</span>
                {food.brand ? <span className="text-sm text-muted">{food.brand}</span> : null}
                <Badge tone={food.basic || food.catalog ? 'neutral' : 'accent'}>
                  {food.catalog
                    ? tNutrition.catalogBadge[food.catalog]
                    : tNutrition.sourceBadge[food.source]}
                </Badge>
              </span>
              <span className="block text-sm text-muted">
                {kcal(fmt, food.per100.kcal ?? 0)} {tNutrition.units.kcal}{' '}
                {tNutrition.per100(tNutrition.units[food.basis])}
              </span>
            </span>
            <Plus aria-hidden="true" className="size-5 shrink-0 text-muted" />
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <PageHeader
        eyebrow={tNutrition.slots[slot]}
        title={tNutrition.addTitle}
        back={{ to: back, label: fromToday ? t.today.title : tNutrition.backToDay }}
      />
      {/* Auswahl und Knöpfe nebeneinander erst ab 48 rem, die Auswahl mindestens 10 rem breit
          (D-377): Zwischen 40 und 48 rem (iPhone Duo hoch) blieb von „Snacks“ nur das „S“. */}
      <div className="mb-4 grid gap-3 md:grid-cols-[minmax(10rem,1fr)_auto] md:items-end">
        <SelectField
          label={tNutrition.slotLabel}
          value={slot}
          options={MEAL_SLOTS.map((s) => ({ value: s, label: tNutrition.slots[s] }))}
          onChange={setSlot}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setScanning(true);
            }}
          >
            <ScanBarcode aria-hidden="true" className="size-5" />
            {tNutrition.barcode.scan}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setQuick(true);
            }}
          >
            <Zap aria-hidden="true" className="size-5" />
            {tNutrition.quick}
          </Button>
          <ButtonLink
            variant="secondary"
            to={`/ernaehrung/lebensmittel/neu?zurueck=${encodeURIComponent(`/ernaehrung/hinzufuegen?tag=${day}&mahlzeit=${slot}`)}`}
          >
            <Plus aria-hidden="true" className="size-5" />
            {tNutrition.newFood}
          </ButtonLink>
        </div>
      </div>
      <div role="search" className="mb-2">
        <SearchField
          label={tNutrition.searchLabel}
          placeholder={tNutrition.searchPlaceholder}
          clearLabel={t.exercises.clearSearch}
          value={query}
          onChange={setQuery}
        />
      </div>
      <p className="mb-4 text-sm text-muted">{tNutrition.searchHint}</p>
      {catalog?.basicFailed ? (
        <p role="status" className="mb-4 rounded-card bg-surface-2 p-3 text-sm">
          {tNutrition.basicFailed}
        </p>
      ) : null}
      {catalog === undefined ? (
        <div aria-busy="true">
          <p className="sr-only">{tNutrition.loadingFoods}</p>
          <Skeleton className="h-40" />
        </div>
      ) : query.trim() ? (
        <section aria-label={tNutrition.results(results.length)}>
          <p role="status" className="mb-2 text-sm text-muted">
            {tNutrition.results(results.length)}
          </p>
          {results.length > 0 ? (
            list(results, tNutrition.results(results.length))
          ) : (
            <p className="rounded-card bg-surface-2 p-4 text-muted">{tNutrition.noResults}</p>
          )}
        </section>
      ) : (
        <div className="grid gap-6">
          {templates && templates.length > 0 ? (
            <section aria-labelledby="vorlagen">
              <h2 id="vorlagen" className="eyebrow mb-2 flex items-center gap-1 text-muted">
                <Bookmark aria-hidden="true" className="size-4" />
                {tNutrition.templates.title}
              </h2>
              <ul
                aria-label={tNutrition.templates.title}
                className="divide-y divide-line overflow-hidden rounded-card bg-surface shadow-card"
              >
                {templates.map((template) => (
                  <li key={template.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setApplying(template);
                      }}
                      className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-2"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium break-words">{template.name}</span>
                        <span className="block text-sm text-muted">
                          {tNutrition.templates.summary(
                            template.items.length,
                            kcal(fmt, templateKcal(template)),
                          )}
                        </span>
                      </span>
                      <Plus aria-hidden="true" className="size-5 shrink-0 text-muted" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {favorites.length > 0 ? (
            <section aria-labelledby="favoriten">
              <h2 id="favoriten" className="eyebrow mb-2 flex items-center gap-1 text-muted">
                <Star aria-hidden="true" className="size-4" />
                {tNutrition.favorites}
              </h2>
              {list(favorites, tNutrition.favorites)}
            </section>
          ) : null}
          {recent.length > 0 ? (
            <section aria-labelledby="zuletzt">
              <h2 id="zuletzt" className="eyebrow mb-2 text-muted">
                {tNutrition.recent}
              </h2>
              {list(recent, tNutrition.recent)}
            </section>
          ) : null}
        </div>
      )}

      {applying ? (
        <ApplyTemplateDialog
          template={applying}
          slot={slot}
          day={day}
          onClose={() => {
            setApplying(null);
          }}
          onApplied={() => {
            setApplying(null);
            void navigate(back);
          }}
        />
      ) : null}
      {scanning ? (
        <BarcodeFlow
          returnTo={`/ernaehrung/hinzufuegen?tag=${day}&mahlzeit=${slot}${fromToday ? '&von=heute' : ''}`}
          onClose={() => {
            setScanning(false);
          }}
          onFood={(food, saved) => {
            setScanning(false);
            setSavedNotice(saved);
            setPicked(food);
          }}
        />
      ) : null}
      {picked ? (
        <LogDialog
          key={picked.id}
          food={picked}
          savedNotice={savedNotice}
          slot={slot}
          day={day}
          onClose={() => {
            setPicked(null);
            setSavedNotice(false);
          }}
          onLogged={() => {
            setPicked(null);
            void navigate(back);
          }}
        />
      ) : null}
      {quick ? (
        <QuickDialog
          slot={slot}
          day={day}
          onClose={() => {
            setQuick(false);
          }}
          onLogged={() => {
            setQuick(false);
            void navigate(back);
          }}
        />
      ) : null}
    </>
  );
}

function QuickDialog({
  slot,
  day,
  onClose,
  onLogged,
}: {
  slot: MealSlot;
  day: string;
  onClose: () => void;
  onLogged: () => void;
}) {
  const rt = useDb();
  const id = useId();
  const [fields, setFields] = useState({ name: '', kcal: '', protein: '', carbs: '', fat: '' });
  const [error, setError] = useState<string | null>(null);
  const once = useSubmitOnce();
  const field = (key: keyof typeof fields, label: string, numeric = true) => (
    <div>
      <label htmlFor={`${id}-${key}`} className="mb-2 block text-sm font-semibold text-muted">
        {label}
      </label>
      <input
        id={`${id}-${key}`}
        inputMode={numeric ? 'decimal' : 'text'}
        autoComplete="off"
        maxLength={numeric ? 8 : 100}
        value={fields[key]}
        onChange={(event) => {
          setFields((all) => ({ ...all, [key]: event.target.value }));
        }}
        className={INPUT}
      />
    </div>
  );
  const submit = () => {
    const kcalValue = parseDecimal(fields.kcal);
    const optional = (text: string) => (text.trim() ? parseDecimal(text) : undefined);
    const protein = optional(fields.protein);
    const carbs = optional(fields.carbs);
    const fat = optional(fields.fat);
    if (kcalValue === null || protein === null || carbs === null || fat === null) {
      setError(tNutrition.errors.number);
      return;
    }
    once.run(() =>
      logQuick(rt, {
        name: fields.name,
        slot,
        dayKey: day,
        kcal: kcalValue,
        ...(protein !== undefined ? { protein } : {}),
        ...(carbs !== undefined ? { carbs } : {}),
        ...(fat !== undefined ? { fat } : {}),
      }).then(onLogged, (caught: unknown) => {
        setError(tNutrition.saveFailed);
        void logError(rt.db, { area: 'nutrition', error: caught, route: window.location.pathname });
      }),
    );
  };
  return (
    <Dialog
      open
      onClose={onClose}
      title={tNutrition.quickTitle}
      closeLabel={t.common.close}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            {tNutrition.cancel}
          </Button>
          <Button type="submit" form={`${id}-form`} disabled={once.busy}>
            {tNutrition.add}
          </Button>
        </>
      }
    >
      <form
        id={`${id}-form`}
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <p className="text-sm text-muted">{tNutrition.quickHint}</p>
        {field('name', tNutrition.quickName, false)}
        {field('kcal', tNutrition.quickKcal)}
        {/* Jede Spalte mindestens so breit wie ihr längstes Wort („Kohlenhydrate“), sonst gleich
            breit (F5 Abschnitt 9, D-331). */}
        <div className="grid grid-cols-[repeat(3,minmax(min-content,1fr))] gap-2">
          {field('protein', tNutrition.quickProtein)}
          {field('carbs', tNutrition.quickCarbs)}
          {field('fat', tNutrition.quickFat)}
        </div>
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}
