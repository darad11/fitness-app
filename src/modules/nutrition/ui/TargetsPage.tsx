import { useId, useState } from 'react';
import { useBodyWeights } from '@/modules/body';
import { useFormatters } from '@/modules/settings';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { parseDecimal } from '@/shared/lib/format';
import { Button, Card, PageHeader, SelectField, Skeleton } from '@/shared/ui';
import { useToday } from '@/shared/ui/useToday';
import { activeTarget, suggestTarget, type TargetValues } from '../calc/targets';
import { useTargets } from '../data/nutritionRepository';
import {
  ACTIVITY_LEVELS,
  DIRECTIONS,
  SEXES,
  targetInputsSchema,
  type ActivityLevel,
  type Direction,
  type NutritionTarget,
  type Sex,
  type TargetInputs,
} from '../model/nutrition';
import { InvalidTargetError, setNutritionTarget } from '../service/nutritionService';
import { dayDate, kcal } from './format';

const INPUT =
  'h-12 w-full min-w-0 rounded-input border border-line bg-surface px-3 text-base text-fg tabular-nums';

/** Tagesziele (S-26, NU-01, NU-17, D-262): selbst festlegen oder Vorschlag übernehmen. */
export function TargetsPage() {
  const targets = useTargets();
  const weights = useBodyWeights();
  if (targets === undefined || weights === undefined) {
    return (
      <div aria-busy="true">
        <Skeleton className="h-64" />
      </div>
    );
  }
  const current = activeTarget(targets);
  const lastInputs = targets
    .filter((x) => x.inputsSnapshot)
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0]?.inputsSnapshot;
  return (
    <TargetsForm
      key={current?.id ?? 'neu'}
      current={current}
      lastInputs={lastInputs}
      latestWeight={weights[0]?.weightKg}
    />
  );
}

function TargetsForm({
  current,
  lastInputs,
  latestWeight,
}: {
  current: NutritionTarget | undefined;
  lastInputs: TargetInputs | undefined;
  latestWeight: number | undefined;
}) {
  const rt = useDb();
  const fmt = useFormatters();
  const now = useToday();
  const id = useId();
  const show = (value: number | undefined) => (value === undefined ? '' : String(value));
  const [manual, setManual] = useState({
    kcal: show(current?.kcal),
    proteinG: show(current?.proteinG),
    carbsG: show(current?.carbsG),
    fatG: show(current?.fatG),
  });
  const [sex, setSex] = useState<Sex>(lastInputs?.sex ?? 'male');
  const [birthYear, setBirthYear] = useState(show(lastInputs?.birthYear));
  const [height, setHeight] = useState(show(lastInputs?.heightCm));
  const [weight, setWeight] = useState(
    latestWeight !== undefined
      ? fmt.number(latestWeight, { maximumFractionDigits: 1 })
      : show(lastInputs?.weightKg),
  );
  const [activity, setActivity] = useState<ActivityLevel>(lastInputs?.activity ?? 'moderate');
  const [direction, setDirection] = useState<Direction>(lastInputs?.direction ?? 'maintain');
  const [suggestion, setSuggestion] = useState<{
    values: TargetValues;
    inputs: TargetInputs;
  } | null>(null);
  const [message, setMessage] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null);

  const save = (values: TargetValues, method: 'manual' | 'computed', inputs?: TargetInputs) => {
    setMessage(null);
    setNutritionTarget(rt, values, { method, ...(inputs ? { inputs } : {}) }).then(
      () => {
        setMessage({ kind: 'ok', text: t.nutrition.targetSaved });
      },
      (caught: unknown) => {
        if (caught instanceof InvalidTargetError) {
          setMessage({ kind: 'error', text: t.nutrition.targetError });
        } else {
          setMessage({ kind: 'error', text: t.nutrition.saveFailed });
          void logError(rt.db, {
            area: 'nutrition',
            error: caught,
            route: window.location.pathname,
          });
        }
      },
    );
  };

  const numberField = (
    key: string,
    label: string,
    value: string,
    onChange: (value: string) => void,
    hint?: string,
  ) => (
    <div>
      <label htmlFor={`${id}-${key}`} className="mb-2 block text-sm font-semibold text-muted">
        {label}
      </label>
      <input
        id={`${id}-${key}`}
        inputMode="decimal"
        autoComplete="off"
        value={value}
        aria-describedby={hint ? `${id}-${key}-hint` : undefined}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className={INPUT}
      />
      {hint ? (
        <p id={`${id}-${key}-hint`} className="mt-1 text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );

  return (
    <>
      <PageHeader
        title={t.nutrition.targetsTitle}
        back={{ to: '/ernaehrung', label: t.nutrition.title }}
      />
      <div className="grid gap-4">
        {current ? (
          <Card
            tone="ink"
            eyebrow={t.nutrition.currentTarget}
            title={`${kcal(fmt, current.kcal)} ${t.nutrition.units.kcal}`}
          >
            <p className="-mt-2 text-on-ink-muted">
              {t.nutrition.macros.protein} {current.proteinG} g · {t.nutrition.macros.carbs}{' '}
              {current.carbsG} g · {t.nutrition.macros.fat} {current.fatG} g
            </p>
            <p className="mt-2 text-sm text-on-ink-muted">
              {t.nutrition.methods[current.method]} ·{' '}
              {t.nutrition.since(fmt.weekdayDayMonth(dayDate(current.effectiveFrom)))}
            </p>
          </Card>
        ) : null}
        {message ? (
          <p
            role={message.kind === 'error' ? 'alert' : 'status'}
            className={message.kind === 'error' ? 'text-danger' : 'text-muted'}
          >
            {message.text}
          </p>
        ) : null}

        <Card title={t.nutrition.manualTitle}>
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              const values = {
                kcal: parseDecimal(manual.kcal),
                proteinG: parseDecimal(manual.proteinG),
                carbsG: parseDecimal(manual.carbsG),
                fatG: parseDecimal(manual.fatG),
              };
              if (Object.values(values).some((v) => v === null)) {
                setMessage({ kind: 'error', text: t.nutrition.targetError });
                return;
              }
              save(values as TargetValues, 'manual');
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              {numberField('kcal', t.nutrition.kcalLabel, manual.kcal, (v) => {
                setManual((m) => ({ ...m, kcal: v }));
              })}
              {numberField('protein', t.nutrition.proteinLabel, manual.proteinG, (v) => {
                setManual((m) => ({ ...m, proteinG: v }));
              })}
              {numberField('carbs', t.nutrition.carbsLabel, manual.carbsG, (v) => {
                setManual((m) => ({ ...m, carbsG: v }));
              })}
              {numberField('fat', t.nutrition.fatLabel, manual.fatG, (v) => {
                setManual((m) => ({ ...m, fatG: v }));
              })}
            </div>
            <Button type="submit" className="justify-self-start">
              {t.nutrition.saveTarget}
            </Button>
          </form>
        </Card>

        <Card title={t.nutrition.suggestTitle}>
          <p className="-mt-2 mb-4 text-sm text-muted">{t.nutrition.suggestHint}</p>
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              const parsed = targetInputsSchema.safeParse({
                sex,
                birthYear: Number(birthYear),
                heightCm: parseDecimal(height),
                weightKg: parseDecimal(weight),
                activity,
                direction,
              });
              if (!parsed.success || parsed.data.birthYear > now.getFullYear() - 14) {
                setSuggestion(null);
                setMessage({ kind: 'error', text: t.nutrition.inputError });
                return;
              }
              setMessage(null);
              setSuggestion({ values: suggestTarget(parsed.data, now), inputs: parsed.data });
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField
                label={t.nutrition.sexLabel}
                value={sex}
                options={SEXES.map((value) => ({ value, label: t.nutrition.sexes[value] }))}
                onChange={setSex}
              />
              {numberField('birthYear', t.nutrition.birthYearLabel, birthYear, setBirthYear)}
              {numberField('height', t.nutrition.heightLabel, height, setHeight)}
              {numberField(
                'weight',
                t.nutrition.weightLabel,
                weight,
                setWeight,
                latestWeight !== undefined ? t.nutrition.weightHint : undefined,
              )}
              <SelectField
                label={t.nutrition.activityLabel}
                value={activity}
                options={ACTIVITY_LEVELS.map((value) => ({
                  value,
                  label: t.nutrition.activities[value],
                }))}
                onChange={setActivity}
              />
              <SelectField
                label={t.nutrition.directionLabel}
                value={direction}
                options={DIRECTIONS.map((value) => ({
                  value,
                  label: t.nutrition.directions[value],
                }))}
                onChange={setDirection}
              />
            </div>
            <Button type="submit" variant="secondary" className="justify-self-start">
              {t.nutrition.calculate}
            </Button>
          </form>
          {suggestion ? (
            <div className="mt-4 rounded-card bg-surface-2 p-4">
              <p className="eyebrow text-muted">{t.nutrition.suggestion}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {kcal(fmt, suggestion.values.kcal)} {t.nutrition.units.kcal}
              </p>
              <p className="text-muted">
                {t.nutrition.macros.protein} {suggestion.values.proteinG} g ·{' '}
                {t.nutrition.macros.carbs} {suggestion.values.carbsG} g · {t.nutrition.macros.fat}{' '}
                {suggestion.values.fatG} g
              </p>
              <Button
                className="mt-3"
                onClick={() => {
                  save(suggestion.values, 'computed', suggestion.inputs);
                }}
              >
                {t.nutrition.useSuggestion}
              </Button>
            </div>
          ) : null}
        </Card>
      </div>
    </>
  );
}
