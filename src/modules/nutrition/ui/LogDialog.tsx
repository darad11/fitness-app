import { Minus, Plus } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useFormatters } from '@/modules/settings';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { tNutrition } from '@/shared/i18n/de-nutrition';
import { cn } from '@/shared/lib/cn';
import { parseDecimal } from '@/shared/lib/format';
import { Button, Dialog, IconButton, SegmentedControl, SelectField } from '@/shared/ui';
import { scaleNutrients } from '../calc/nutrients';
import {
  cleanPieceGrams,
  isPieceCount,
  PIECE_COUNT_MAX,
  PIECE_COUNT_STEP,
  pieceGramsOf,
  pieceServingId,
  stepPieces,
  withPiece,
} from '../calc/pieces';
import type { FoodItem } from '../model/foodItem';
import type { MealSlot } from '../model/nutrition';
import { logFood, type Quantity } from '../service/nutritionService';
import { savePieceWeight } from '../service/pieceWeightService';
import { kcal } from './format';
import { NutrientTable } from './NutrientTable';
import { useSubmitOnce } from './useSubmitOnce';

const INPUT = 'field w-full min-w-0';
/** Auswahl „Gramm bzw. Milliliter“ und bei der Grundauswahl mit Richtwert „Stück“ (bzw. Scheibe). */
const BASIS = 'basis';
const PIECE = 'piece';
/** Höchstens so viele Portionen je Eintrag (wie `logFood`). */
const COUNT_MAX = 100;

/** Gramm für ein Eingabefeld, ohne Tausenderpunkt (den `parseDecimal` als Komma läse). */
function gramsText(grams: number): string {
  return String(grams).replace('.', ',');
}

/**
 * Menge wählen und eintragen (S-16, NU-09; Grundauswahl D-362, Richtwerte D-365): in Gramm, als
 * Portion oder bei Grundnahrungsmitteln mit Richtwert als Stück bzw. Scheibe. Mit Richtwert ist
 * „1 Stück · ca. 150 g“ vorgewählt, ein Tipp auf „Hinzufügen“ genügt; Plus und Minus zählen in
 * ganzen und halben Stück. „Gewicht anpassen“ ändert das Gewicht je Stück, die App merkt es sich
 * beim Hinzufügen; „Auf Richtwert zurücksetzen“ nimmt es zurück. Ohne Richtwert nur Gramm.
 */
export function LogDialog({
  food,
  slot,
  day,
  savedNotice = false,
  onClose,
  onLogged,
}: {
  food: FoodItem;
  savedNotice?: boolean;
  slot: MealSlot;
  day: string;
  onClose: () => void;
  onLogged: () => void;
}) {
  const rt = useDb();
  const fmt = useFormatters();
  const id = useId();
  const unit = tNutrition.units[food.basis];
  const basic = food.basic;
  // „Stück“ nur mit Richtwert; das gemerkte eigene Gewicht gilt vor dem Richtwert.
  const listGrams = basic?.listPieceGrams;
  const pieceUnit = listGrams !== undefined ? basic?.unit : undefined;
  const savedGrams = pieceGramsOf(food);
  const [unitChoice, setUnitChoice] = useState<string>(() =>
    pieceUnit ? PIECE : (food.servings[0]?.id ?? BASIS),
  );
  const [value, setValue] = useState(unitChoice === BASIS ? '100' : '1');
  const [weightText, setWeightText] = useState(
    savedGrams === undefined ? '' : gramsText(savedGrams),
  );
  const [adjusting, setAdjusting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const once = useSubmitOnce();
  // „Gewicht anpassen“ gibt dem Feld den Fokus, erst nach der Standardbehandlung des Tipps (in
  // WebKit setzt der Browser den Fokus sonst wieder zurück). Ein Zeitgeber unter einer Sekunde
  // behält die Geste, auf dem iPhone darf die Tastatur also aufgehen.
  const weightInput = useRef<HTMLInputElement>(null);
  const focusWeight = useRef(false);
  useEffect(() => {
    if (!focusWeight.current) return;
    focusWeight.current = false;
    window.setTimeout(() => {
      weightInput.current?.focus();
    }, 0);
  });

  const piece = pieceUnit !== undefined && unitChoice === PIECE;
  const typedWeight = parseDecimal(weightText);
  const pieceGrams = !piece || typedWeight === null ? null : cleanPieceGrams(typedWeight);
  const serving = piece ? undefined : food.servings.find((s) => s.id === unitChoice);
  const parsed = parseDecimal(value);
  const factor = piece ? pieceGrams : serving ? serving.amount : 1;
  const amount = parsed === null || factor === null ? null : parsed * factor;
  const scaled = amount !== null && amount > 0 ? scaleNutrients(food.per100, amount) : null;
  const preview = scaled?.kcal ?? null;
  const derived = basic?.derived ?? [];
  // Weicht das geltende Gewicht vom Richtwert ab, steht „Dein Gewicht“ statt „Richtwert“.
  const ownWeight = pieceGrams !== null && listGrams !== undefined && pieceGrams !== listGrams;

  const fail = (caught: unknown) => {
    setError(tNutrition.saveFailed);
    void logError(rt.db, { area: 'nutrition', error: caught, route: window.location.pathname });
  };

  const submit = () => {
    if (piece) {
      if (parsed === null || !isPieceCount(parsed)) {
        setError(tNutrition.basic.invalidHalf);
        return;
      }
      if (pieceGrams === null) {
        setError(tNutrition.basic.invalidPiece);
        return;
      }
      const grams = pieceGrams;
      once.run(async () => {
        try {
          // Erst merken, dann eintragen: Ein angepasstes Gewicht gilt ab jetzt für dieses
          // Lebensmittel; gleich dem Richtwert entfernt es das eigene.
          if (grams !== savedGrams) await savePieceWeight(rt, food, grams);
          await logFood(rt, {
            food: withPiece(food, grams),
            slot,
            dayKey: day,
            quantity: { kind: 'serving', servingId: pieceServingId(food.id), count: parsed },
          });
        } catch (caught) {
          fail(caught);
          return;
        }
        onLogged();
      });
      return;
    }
    const counted = serving !== undefined;
    if (parsed === null || parsed <= 0 || (counted && parsed > COUNT_MAX)) {
      setError(counted ? tNutrition.basic.invalidCount : tNutrition.invalidAmount);
      return;
    }
    const quantity: Quantity = serving
      ? { kind: 'serving', servingId: serving.id, count: parsed }
      : { kind: 'amount', amount: parsed };
    once.run(() => logFood(rt, { food, slot, dayKey: day, quantity }).then(onLogged, fail));
  };

  const choose = (next: string) => {
    // Von Stück zu Gramm bleibt die Menge gleich: 1 Stück zu 150 g wird 150 g.
    const grams = piece && amount !== null && amount > 0 ? Math.round(amount * 10) / 10 : null;
    setValue(next === BASIS ? (grams === null ? '100' : gramsText(grams)) : '1');
    setUnitChoice(next);
    setError(null);
  };

  const step = (direction: 1 | -1) => {
    setValue(gramsText(stepPieces(parsed, direction)));
    setError(null);
  };

  const sourceLine = basic
    ? tNutrition.basic.source[basic.origin](basic.code, basic.sourceName)
    : null;

  return (
    <Dialog
      open
      onClose={onClose}
      title={tNutrition.logTitle(food.name)}
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
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        {food.brand ? <p className="-mt-2 text-muted">{food.brand}</p> : null}
        {pieceUnit ? (
          <SegmentedControl
            legend={tNutrition.basic.unitLegend}
            options={[
              { value: PIECE, label: pieceUnit },
              { value: BASIS, label: tNutrition.basic.grams },
            ]}
            value={piece ? PIECE : BASIS}
            onChange={choose}
          />
        ) : food.servings.length > 0 ? (
          <SelectField
            label={tNutrition.quantityLabel}
            value={unitChoice}
            options={[
              ...food.servings.map((s) => ({
                value: s.id,
                label: tNutrition.servingOption(
                  s.name,
                  fmt.number(s.amount, { maximumFractionDigits: 1 }),
                  unit,
                ),
              })),
              { value: BASIS, label: unit },
            ]}
            onChange={choose}
          />
        ) : null}
        <div>
          <label htmlFor={`${id}-menge`} className="mb-2 block text-sm font-semibold text-muted">
            {piece
              ? tNutrition.basic.count(pieceUnit)
              : serving
                ? tNutrition.servingsLabel
                : tNutrition.amountLabel(unit)}
          </label>
          <div className={cn(piece && 'flex items-center gap-2')}>
            {piece ? (
              <IconButton
                label={tNutrition.basic.fewer}
                tone="tile"
                disabled={parsed !== null && parsed <= PIECE_COUNT_STEP}
                onClick={() => {
                  step(-1);
                }}
              >
                <Minus aria-hidden="true" className="size-5" />
              </IconButton>
            ) : null}
            <input
              id={`${id}-menge`}
              inputMode="decimal"
              autoComplete="off"
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                setError(null);
              }}
              className={cn(INPUT, piece && 'text-center tabular-nums')}
            />
            {piece ? (
              <IconButton
                label={tNutrition.basic.more}
                tone="tile"
                disabled={parsed !== null && parsed >= PIECE_COUNT_MAX}
                onClick={() => {
                  step(1);
                }}
              >
                <Plus aria-hidden="true" className="size-5" />
              </IconButton>
            ) : null}
          </div>
        </div>
        {piece && listGrams !== undefined ? (
          <div className="grid gap-2">
            <p className="font-semibold tabular-nums">
              {parsed !== null && parsed > 0 && amount !== null
                ? tNutrition.basic.summary(
                    tNutrition.basic.pieces(
                      parsed,
                      fmt.number(parsed, { maximumFractionDigits: 1 }),
                      pieceUnit,
                    ),
                    fmt.number(Math.round(amount)),
                  )
                : tNutrition.noValue}
            </p>
            {adjusting ? (
              <div>
                <label
                  htmlFor={`${id}-stueck`}
                  className="mb-2 block text-sm font-semibold text-muted"
                >
                  {tNutrition.basic.pieceLabel(pieceUnit)}
                </label>
                <input
                  ref={weightInput}
                  id={`${id}-stueck`}
                  inputMode="decimal"
                  autoComplete="off"
                  value={weightText}
                  aria-describedby={`${id}-stueck-hinweis`}
                  onChange={(event) => {
                    setWeightText(event.target.value);
                    setError(null);
                  }}
                  className={INPUT}
                />
                <p id={`${id}-stueck-hinweis`} className="mt-2 text-sm text-muted">
                  {tNutrition.basic.richtwert(fmt.number(listGrams), pieceUnit, basic?.pieceHint)}.{' '}
                  {tNutrition.basic.adjustHint}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted">
                {ownWeight
                  ? tNutrition.basic.own(fmt.number(pieceGrams), pieceUnit, fmt.number(listGrams))
                  : tNutrition.basic.richtwert(fmt.number(listGrams), pieceUnit, basic?.pieceHint)}
              </p>
            )}
            {/* Wie auf „Heute“: Der Text der leisen Knöpfe steht bündig mit dem übrigen Text. */}
            <div className="-ml-4 flex flex-wrap gap-y-1">
              {!adjusting ? (
                <Button
                  variant="quiet"
                  size="sm"
                  onClick={() => {
                    setAdjusting(true);
                    setError(null);
                    focusWeight.current = true;
                  }}
                >
                  {tNutrition.basic.adjust}
                </Button>
              ) : null}
              {ownWeight ? (
                <Button
                  variant="quiet"
                  size="sm"
                  onClick={() => {
                    setWeightText(gramsText(listGrams));
                    setAdjusting(false);
                    setError(null);
                  }}
                >
                  {tNutrition.basic.reset}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
        <p role="status" className="text-lg font-semibold tabular-nums">
          {preview !== null ? tNutrition.preview(kcal(fmt, preview)) : '–'}
        </p>
        {savedNotice ? (
          <p className="rounded-card bg-surface-2 p-3 text-sm">
            {tNutrition.barcode.saved(food.name)}
          </p>
        ) : null}
        {food.source === 'off' ? (
          <p className="text-sm text-muted">{tNutrition.barcode.fromOff}</p>
        ) : null}
        <NutrientTable
          caption={tNutrition.nutrientsTitle}
          derived={derived}
          header
          columns={[
            { label: tNutrition.per100(unit), values: food.per100 },
            // Zweite Spalte nur, wenn die Menge von 100 g abweicht (D-364).
            ...(scaled && amount !== null && Math.abs(amount - 100) >= 0.05
              ? [
                  {
                    label: tNutrition.forAmount(
                      piece && parsed !== null
                        ? tNutrition.basic.pieces(
                            parsed,
                            fmt.number(parsed, { maximumFractionDigits: 1 }),
                            pieceUnit,
                          )
                        : `${fmt.number(amount, { maximumFractionDigits: 1 })} ${unit}`,
                    ),
                    values: scaled,
                  },
                ]
              : []),
          ]}
        />
        {derived.length > 0 ? (
          <p className="-mt-2 text-sm text-muted">{tNutrition.basic.derivedNote}</p>
        ) : null}
        {sourceLine ? <p className="text-sm text-muted">{sourceLine}</p> : null}
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}
