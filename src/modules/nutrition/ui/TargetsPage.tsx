import { useId, useState } from 'react';
import { useBodyWeights } from '@/modules/body';
import { useFormatters } from '@/modules/settings';
import { logError, useDb } from '@/shared/db';
import { tNutrition } from '@/shared/i18n/de-nutrition';
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
import { kcal } from './format';

const INPUT = 'field w-full min-w-0';

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
        setMessage({ kind: 'ok', text: tNutrition.targetSaved });
      },
      (caught: unknown) => {
        if (caught instanceof InvalidTargetError) {
          setMessage({ kind: 'error', text: tNutrition.targetError });
        } else {
          setMessage({ kind: 'error', text: tNutrition.saveFailed });
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
        title={tNutrition.targetsTitle}
        back={{ to: '/ernaehrung', label: tNutrition.title }}
      />
      <div className="grid gap-4">
        {current ? (
          <Card
            tone="stage"
            eyebrow={tNutrition.currentTarget}
            title={`${kcal(fmt, current.kcal)} ${tNutrition.units.kcal}`}
          >
            <p className="-mt-2 text-muted">
              {tNutrition.macros.protein} {current.proteinG} g · {tNutrition.macros.carbs}{' '}
              {current.carbsG} g · {tNutrition.macros.fat} {current.fatG} g
            </p>
            {/* Wie das Ziel entstand, ohne Datum (F5, D-326); ändert sich mit dem nächsten Ziel. */}
            <p className="mt-2 text-sm text-muted">{tNutrition.methods[current.method]}</p>
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

        <Card title={tNutrition.manualTitle}>
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
                setMessage({ kind: 'error', text: tNutrition.targetError });
                return;
              }
              save(values as TargetValues, 'manual');
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              {numberField('kcal', tNutrition.kcalLabel, manual.kcal, (v) => {
                setManual((m) => ({ ...m, kcal: v }));
              })}
              {numberField('protein', tNutrition.proteinLabel, manual.proteinG, (v) => {
                setManual((m) => ({ ...m, proteinG: v }));
              })}
              {numberField('carbs', tNutrition.carbsLabel, manual.carbsG, (v) => {
                setManual((m) => ({ ...m, carbsG: v }));
              })}
              {numberField('fat', tNutrition.fatLabel, manual.fatG, (v) => {
                setManual((m) => ({ ...m, fatG: v }));
              })}
            </div>
            <Button type="submit" className="justify-self-start">
              {tNutrition.saveTarget}
            </Button>
          </form>
        </Card>

        <Card title={tNutrition.suggestTitle}>
          <p className="-mt-2 mb-4 text-sm text-muted">{tNutrition.suggestHint}</p>
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
                setMessage({ kind: 'error', text: tNutrition.inputError });
                return;
              }
              setMessage(null);
              setSuggestion({ values: suggestTarget(parsed.data, now), inputs: parsed.data });
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField
                label={tNutrition.sexLabel}
                value={sex}
                options={SEXES.map((value) => ({ value, label: tNutrition.sexes[value] }))}
                onChange={setSex}
              />
              {numberField('birthYear', tNutrition.birthYearLabel, birthYear, setBirthYear)}
              {numberField('height', tNutrition.heightLabel, height, setHeight)}
              {numberField(
                'weight',
                tNutrition.weightLabel,
                weight,
                setWeight,
                latestWeight !== undefined ? tNutrition.weightHint : undefined,
              )}
              <SelectField
                label={tNutrition.activityLabel}
                value={activity}
                options={ACTIVITY_LEVELS.map((value) => ({
                  value,
                  label: tNutrition.activities[value],
                }))}
                onChange={setActivity}
              />
              <SelectField
                label={tNutrition.directionLabel}
                value={direction}
                options={DIRECTIONS.map((value) => ({
                  value,
                  label: tNutrition.directions[value],
                }))}
                onChange={setDirection}
              />
            </div>
            <Button type="submit" variant="secondary" className="justify-self-start">
              {tNutrition.calculate}
            </Button>
          </form>
          {suggestion ? (
            <div className="mt-4 rounded-card bg-surface-2 p-4">
              <p className="eyebrow text-muted">{tNutrition.suggestion}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {kcal(fmt, suggestion.values.kcal)} {tNutrition.units.kcal}
              </p>
              <p className="text-muted">
                {tNutrition.macros.protein} {suggestion.values.proteinG} g ·{' '}
                {tNutrition.macros.carbs} {suggestion.values.carbsG} g · {tNutrition.macros.fat}{' '}
                {suggestion.values.fatG} g
              </p>
              <Button
                className="mt-3"
                onClick={() => {
                  save(suggestion.values, 'computed', suggestion.inputs);
                }}
              >
                {tNutrition.useSuggestion}
              </Button>
            </div>
          ) : null}
        </Card>
      </div>
    </>
  );
}
