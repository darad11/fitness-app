import { Plus, X } from 'lucide-react';
import { useId, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { useFormatters } from '@/modules/settings';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
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

const INPUT =
  'h-12 w-full min-w-0 rounded-input border border-line bg-surface px-3 text-base text-fg tabular-nums';

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
          title={t.nutrition.editFoodTitle}
          back={{ to: '/ernaehrung/lebensmittel', label: t.nutrition.foodsTitle }}
        />
        <p className="mb-4 text-muted">{t.nutrition.foodNotFound}</p>
        <ButtonLink to="/ernaehrung/lebensmittel">{t.nutrition.foodsTitle}</ButtonLink>
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
  const show = (value: number | undefined) =>
    value === undefined
      ? ''
      : fmt
          .number(value, { maximumFractionDigits: 2, minimumFractionDigits: 0 })
          .replace(/\s/g, '');
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
  const unit = t.nutrition.units[basis];

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
      setError(t.nutrition.errors.number);
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
        if (caught instanceof InvalidFoodError) setError(t.nutrition.errors[caught.reason]);
        else {
          setError(t.nutrition.saveFailed);
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
        title={food ? t.nutrition.editFoodTitle : t.nutrition.newFoodTitle}
        back={{ to: back, label: food ? t.nutrition.foodsTitle : t.common.back }}
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
            {t.nutrition.barcode.incomplete}
          </p>
        ) : null}
        <Card>
          <div className="grid gap-4">
            <div>
              <label htmlFor={`${id}-name`} className="mb-2 block text-sm font-semibold text-muted">
                {t.nutrition.nameLabel}
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
                {t.nutrition.brandLabel}
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
                {t.nutrition.barcode.barcodeLabel}
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
              legend={t.nutrition.basisLabel}
              options={[
                { value: 'g', label: t.nutrition.basis.g },
                { value: 'ml', label: t.nutrition.basis.ml },
              ]}
              value={basis}
              onChange={setBasis}
            />
          </div>
        </Card>
        <Card title={t.nutrition.per100Title(unit)}>
          <div className="grid grid-cols-2 gap-3">
            {NUTRIENTS.map((n) => {
              const required = (CORE_NUTRIENTS as readonly string[]).includes(n);
              return (
                <div key={n}>
                  <label
                    htmlFor={`${id}-${n}`}
                    className="mb-1 block text-sm font-semibold text-muted"
                  >
                    {t.nutrition.nutrients[n]} (
                    {n === 'kcal' ? t.nutrition.units.kcal : t.nutrition.units.g})
                    {required ? '' : `, ${t.nutrition.optional}`}
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
              {t.nutrition.kcalCheck(fmt.number(mismatch))}
            </p>
          ) : null}
        </Card>
        <Card title={t.nutrition.servingsTitle}>
          <ul className="grid gap-2">
            {servings.map((serving, index) => (
              <li key={index} className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <label
                    htmlFor={`${id}-s${String(index)}-name`}
                    className="mb-1 block text-sm text-muted"
                  >
                    {t.nutrition.servingName}
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
                    {t.nutrition.servingAmount(unit)}
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
                  label={t.nutrition.removeServing(serving.name || String(index + 1))}
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
              {t.nutrition.addServing}
            </Button>
          ) : null}
        </Card>
        {food ? (
          <Card>
            <Switch
              label={t.nutrition.favorite}
              checked={food.favorite === true}
              onChange={(checked) => void setFoodFavorite(rt, food.id, checked)}
            />
            <Button
              variant="secondary"
              className="mt-3"
              onClick={() => void setFoodArchived(rt, food.id, !food.archivedAt)}
            >
              {food.archivedAt ? t.nutrition.unarchive : t.nutrition.archive}
            </Button>
          </Card>
        ) : null}
        {error ? (
          <p role="alert" className="text-danger">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={busy} className="justify-self-start">
          {t.nutrition.save}
        </Button>
      </form>
    </>
  );
}
