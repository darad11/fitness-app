import { Plus, X } from 'lucide-react';
import { useId, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { useFormatters } from '@/modules/settings';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { tNutrition } from '@/shared/i18n/de-nutrition';
import { parseDecimal } from '@/shared/lib/format';
import {
  Button,
  ButtonLink,
  Card,
  IconButton,
  PageHeader,
  SegmentedControl,
  Skeleton,
  Switch,
} from '@/shared/ui';
import { kcalMismatch } from '../calc/nutrients';
import { useFoods } from '../data/nutritionRepository';
import {
  CORE_NUTRIENTS,
  NUTRIENTS,
  type Food,
  type FoodBasis,
  type Nutrient,
  type Nutrients,
} from '../model/nutrition';
import type { FoodDraftState } from './BarcodeFlow';
import {
  createFood,
  createFoodFromOff,
  InvalidFoodError,
  setFoodArchived,
  setFoodFavorite,
  updateFood,
} from '../service/nutritionService';

const INPUT = 'field w-full min-w-0';

/** Eigenes Lebensmittel anlegen oder bearbeiten (S-19, NU-10, NU-19, NU-22, NU-23). */
/** Vorbelegung aus dem Scan (Navigation mit `state`), geprüft, weil der Verlauf sie speichert. */
function readDraft(state: unknown): FoodDraftState | undefined {
  if (typeof state !== 'object' || state === null || !('draft' in state)) return undefined;
  const { draft, fromOff } = state as { draft: unknown; fromOff?: unknown };
  if (typeof draft !== 'object' || draft === null) return undefined;
  const d = draft as Partial<NonNullable<FoodDraftState['draft']>>;
  if (typeof d.barcode !== 'string') return undefined;
  return { draft: d as FoodDraftState['draft'], fromOff: fromOff === true };
}

export function FoodFormPage() {
  const { foodId } = useParams();
  const location = useLocation();
  const foods = useFoods();
  if (!foodId) {
    const draft = readDraft(location.state);
    return <FoodForm key={location.key} {...(draft ? { draft } : {})} />;
  }
  if (foods === undefined) {
    return (
      <div aria-busy="true">
        <Skeleton className="h-64" />
      </div>
    );
  }
  const food = foods.find((f) => f.id === foodId);
  if (!food) {
    return (
      <>
        <PageHeader
          title={tNutrition.editFoodTitle}
          back={{ to: '/ernaehrung/lebensmittel', label: tNutrition.foodsTitle }}
        />
        <p className="mb-4 text-muted">{tNutrition.foodNotFound}</p>
        <ButtonLink to="/ernaehrung/lebensmittel">{tNutrition.foodsTitle}</ButtonLink>
      </>
    );
  }
  return <FoodForm key={food.id} food={food} />;
}

function FoodForm({ food, draft: draftState }: { food?: Food; draft?: FoodDraftState }) {
  const draft = draftState?.draft;
  const fromOff = draftState?.fromOff === true;
  const rt = useDb();
  const fmt = useFormatters();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnTo = params.get('zurueck');
  const back = returnTo?.startsWith('/ernaehrung') ? returnTo : '/ernaehrung/lebensmittel';
  const id = useId();
  // Ohne Tausendertrennung, weil parseDecimal keine liest (D-291).
  const show = (value: number | undefined) =>
    value === undefined ? '' : fmt.number(value, { maximumFractionDigits: 2, useGrouping: false });
  const [name, setName] = useState(food?.name ?? draft?.name ?? '');
  const [brand, setBrand] = useState(food?.brand ?? draft?.brand ?? '');
  const [barcode, setBarcode] = useState(food?.barcode ?? draft?.barcode ?? '');
  const [basis, setBasis] = useState<FoodBasis>(food?.basis ?? draft?.basis ?? 'g');
  const [values, setValues] = useState<Record<Nutrient, string>>(
    () =>
      Object.fromEntries(
        NUTRIENTS.map((n) => [n, show(food?.per100[n] ?? draft?.per100?.[n])]),
      ) as Record<Nutrient, string>,
  );
  const [servings, setServings] = useState(
    (food?.servings ?? draft?.servings ?? []).map((s) => ({
      name: s.name,
      amount: show(s.amount),
    })),
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const unit = tNutrition.units[basis];

  const parsedPer100 = (): Nutrients | null => {
    const result: Nutrients = {};
    for (const n of NUTRIENTS) {
      const text = values[n].trim();
      if (!text) continue;
      const value = parseDecimal(text);
      if (value === null) return null;
      result[n] = value;
    }
    return result;
  };
  const preview = parsedPer100();
  const mismatch = preview ? kcalMismatch(preview) : null;

  const submit = () => {
    const per100 = parsedPer100();
    const parsedServings = servings
      .filter((s) => s.name.trim() || s.amount.trim())
      .map((s) => ({ name: s.name, amount: parseDecimal(s.amount) ?? -1 }));
    if (!per100) {
      setError(tNutrition.errors.number);
      return;
    }
    setBusy(true);
    setError(null);
    const input = { name, brand, basis, per100, servings: parsedServings, barcode };
    (food
      ? updateFood(rt, food.id, input)
      : fromOff
        ? createFoodFromOff(rt, input)
        : createFood(rt, input)
    )
      .then(() => navigate(back))
      .catch((caught: unknown) => {
        if (caught instanceof InvalidFoodError) setError(tNutrition.errors[caught.reason]);
        else {
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
        title={food ? tNutrition.editFoodTitle : tNutrition.newFoodTitle}
        back={{ to: back, label: food ? tNutrition.foodsTitle : t.common.back }}
      />
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        {fromOff ? (
          <p role="status" className="rounded-card bg-surface-2 p-4">
            {tNutrition.barcode.incomplete}
          </p>
        ) : null}
        <Card>
          <div className="grid gap-4">
            <div>
              <label htmlFor={`${id}-name`} className="mb-2 block text-sm font-semibold text-muted">
                {tNutrition.nameLabel}
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
                htmlFor={`${id}-brand`}
                className="mb-2 block text-sm font-semibold text-muted"
              >
                {tNutrition.brandLabel}
              </label>
              <input
                id={`${id}-brand`}
                maxLength={60}
                autoComplete="off"
                value={brand}
                onChange={(event) => {
                  setBrand(event.target.value);
                }}
                className={INPUT}
              />
            </div>
            <div>
              <label
                htmlFor={`${id}-barcode`}
                className="mb-2 block text-sm font-semibold text-muted"
              >
                {tNutrition.barcode.barcodeLabel}
              </label>
              <input
                id={`${id}-barcode`}
                inputMode="numeric"
                autoComplete="off"
                maxLength={20}
                value={barcode}
                onChange={(event) => {
                  setBarcode(event.target.value);
                }}
                className={INPUT}
              />
            </div>
            <SegmentedControl
              legend={tNutrition.basisLabel}
              options={[
                { value: 'g', label: tNutrition.basis.g },
                { value: 'ml', label: tNutrition.basis.ml },
              ]}
              value={basis}
              onChange={setBasis}
            />
          </div>
        </Card>
        <Card title={tNutrition.per100Title(unit)}>
          <div className="grid grid-cols-2 gap-3">
            {NUTRIENTS.map((n) => {
              const required = (CORE_NUTRIENTS as readonly string[]).includes(n);
              return (
                <div key={n}>
                  <label
                    htmlFor={`${id}-${n}`}
                    className="mb-1 block text-sm font-semibold text-muted"
                  >
                    {tNutrition.nutrients[n]} (
                    {n === 'kcal' ? tNutrition.units.kcal : tNutrition.units.g})
                    {required ? '' : `, ${tNutrition.optional}`}
                  </label>
                  <input
                    id={`${id}-${n}`}
                    inputMode="decimal"
                    autoComplete="off"
                    required={required}
                    value={values[n]}
                    onChange={(event) => {
                      setValues((all) => ({ ...all, [n]: event.target.value }));
                    }}
                    className={INPUT}
                  />
                </div>
              );
            })}
          </div>
          {mismatch !== null ? (
            <p role="status" className="mt-3 text-sm text-muted">
              {tNutrition.kcalCheck(fmt.number(mismatch))}
            </p>
          ) : null}
        </Card>
        <Card title={tNutrition.servingsTitle}>
          <ul className="grid gap-2">
            {servings.map((serving, index) => (
              <li key={index} className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <label
                    htmlFor={`${id}-s${String(index)}-name`}
                    className="mb-1 block text-sm text-muted"
                  >
                    {tNutrition.servingName}
                  </label>
                  <input
                    id={`${id}-s${String(index)}-name`}
                    maxLength={40}
                    autoComplete="off"
                    value={serving.name}
                    onChange={(event) => {
                      setServings((all) =>
                        all.map((s, i) => (i === index ? { ...s, name: event.target.value } : s)),
                      );
                    }}
                    className={INPUT}
                  />
                </div>
                <div className="w-28">
                  <label
                    htmlFor={`${id}-s${String(index)}-amount`}
                    className="mb-1 block text-sm text-muted"
                  >
                    {tNutrition.servingAmount(unit)}
                  </label>
                  <input
                    id={`${id}-s${String(index)}-amount`}
                    inputMode="decimal"
                    autoComplete="off"
                    value={serving.amount}
                    onChange={(event) => {
                      setServings((all) =>
                        all.map((s, i) => (i === index ? { ...s, amount: event.target.value } : s)),
                      );
                    }}
                    className={INPUT}
                  />
                </div>
                <IconButton
                  label={tNutrition.removeServing(serving.name || String(index + 1))}
                  onClick={() => {
                    setServings((all) => all.filter((_, i) => i !== index));
                  }}
                >
                  <X aria-hidden="true" className="size-5" />
                </IconButton>
              </li>
            ))}
          </ul>
          {servings.length < 10 ? (
            <Button
              variant="quiet"
              size="sm"
              className="mt-2"
              onClick={() => {
                setServings((all) => [...all, { name: '', amount: '' }]);
              }}
            >
              <Plus aria-hidden="true" className="size-4" />
              {tNutrition.addServing}
            </Button>
          ) : null}
        </Card>
        {food ? (
          <Card>
            <Switch
              label={tNutrition.favorite}
              checked={food.favorite === true}
              onChange={(checked) => void setFoodFavorite(rt, food.id, checked)}
            />
            <Button
              variant="secondary"
              className="mt-3"
              onClick={() => void setFoodArchived(rt, food.id, !food.archivedAt)}
            >
              {food.archivedAt ? tNutrition.unarchive : tNutrition.archive}
            </Button>
          </Card>
        ) : null}
        {error ? (
          <p role="alert" className="text-danger">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={busy} className="justify-self-start">
          {tNutrition.save}
        </Button>
      </form>
    </>
  );
}
