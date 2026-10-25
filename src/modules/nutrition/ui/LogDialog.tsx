import { useEffect, useId, useRef, useState } from 'react';
import { useFormatters } from '@/modules/settings';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { tNutrition } from '@/shared/i18n/de-nutrition';
import { parseDecimal } from '@/shared/lib/format';
import { Button, Dialog, SegmentedControl, SelectField } from '@/shared/ui';
import { scaleNutrients } from '../calc/nutrients';
import { cleanPieceGrams, pieceGramsOf, pieceServingId, withPiece } from '../calc/pieces';
import type { FoodItem } from '../model/foodItem';
import type { MealSlot } from '../model/nutrition';
import { logFood, type Quantity } from '../service/nutritionService';
import { savePieceWeight } from '../service/pieceWeightService';
import { kcal } from './format';
import { NutrientTable } from './NutrientTable';
import { useSubmitOnce } from './useSubmitOnce';

const INPUT = 'field w-full min-w-0';
/** Auswahl „Gramm bzw. Milliliter“ und bei der Grundauswahl „Stück“ (bzw. Scheibe, Zehe …). */
const BASIS = 'basis';
const PIECE = 'piece';
/** Höchstens so viele Stück oder Portionen je Eintrag (wie `logFood`). */
const COUNT_MAX = 100;

/** Gramm für ein Eingabefeld, ohne Tausenderpunkt (den `parseDecimal` als Komma läse). */
function gramsText(grams: number): string {
  return String(grams).replace('.', ',');
}

/**
 * Menge wählen und eintragen (S-16, NU-09; Grundauswahl D-362): in Gramm, als Portion oder bei
 * Grundnahrungsmitteln mit Einheit als Stück. Fehlt das Stückgewicht, fragt der Dialog einmal
 * danach und merkt es sich beim Hinzufügen; „Gewicht ändern“ ändert es jederzeit.
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
  const pieceUnit = food.basic?.unit;
  const knownPiece = pieceGramsOf(food);
  // Mit bekanntem Stückgewicht zuerst „Stück“, ohne zuerst Gramm; sonst die erste Portion.
  const [unitChoice, setUnitChoice] = useState<string>(() =>
    pieceUnit ? (knownPiece === undefined ? BASIS : PIECE) : (food.servings[0]?.id ?? BASIS),
  );
  const [value, setValue] = useState(unitChoice === BASIS ? '100' : '1');
  const [pieceText, setPieceText] = useState(knownPiece === undefined ? '' : gramsText(knownPiece));
  const [editingPiece, setEditingPiece] = useState(knownPiece === undefined);
  const [error, setError] = useState<string | null>(null);
  const once = useSubmitOnce();
  // Erscheint das Feld für das Stückgewicht nach einem Tipp, bekommt es den Fokus. Erst nach der
  // Standardbehandlung des Tipps: WebKit setzt den Fokus nach dem Klick auf ein Label noch auf
  // dessen Optionsfeld. Ein Zeitgeber unter einer Sekunde behält in WebKit die Geste des Tipps,
  // auf dem iPhone darf die Tastatur also aufgehen.
  const pieceInput = useRef<HTMLInputElement>(null);
  const focusPiece = useRef(false);
  useEffect(() => {
    if (!focusPiece.current) return;
    focusPiece.current = false;
    window.setTimeout(() => {
      pieceInput.current?.focus();
    }, 0);
  });

  const piece = pieceUnit !== undefined && unitChoice === PIECE;
  const typedPiece = parseDecimal(pieceText);
  const pieceGrams = !piece
    ? null
    : editingPiece
      ? typedPiece === null
        ? null
        : cleanPieceGrams(typedPiece)
      : (knownPiece ?? null);
  const serving = piece ? undefined : food.servings.find((s) => s.id === unitChoice);
  const parsed = parseDecimal(value);
  const factor = piece ? pieceGrams : serving ? serving.amount : 1;
  const amount = parsed === null || factor === null ? null : parsed * factor;
  const scaled = amount !== null && amount > 0 ? scaleNutrients(food.per100, amount) : null;
  const preview = scaled?.kcal ?? null;
  const derived = food.basic?.derived ?? [];

  const fail = (caught: unknown) => {
    setError(tNutrition.saveFailed);
    void logError(rt.db, { area: 'nutrition', error: caught, route: window.location.pathname });
  };

  const submit = () => {
    const counted = piece || serving !== undefined;
    if (parsed === null || parsed <= 0 || (counted && parsed > COUNT_MAX)) {
      setError(counted ? tNutrition.basic.invalidCount : tNutrition.invalidAmount);
      return;
    }
    if (piece) {
      if (pieceGrams === null) {
        setError(tNutrition.basic.invalidPiece);
        return;
      }
      const grams = pieceGrams;
      once.run(async () => {
        try {
          // Erst merken, dann eintragen: Das Gewicht gilt ab jetzt für dieses Lebensmittel.
          if (grams !== knownPiece) await savePieceWeight(rt, food, grams);
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
    const quantity: Quantity = serving
      ? { kind: 'serving', servingId: serving.id, count: parsed }
      : { kind: 'amount', amount: parsed };
    once.run(() => logFood(rt, { food, slot, dayKey: day, quantity }).then(onLogged, fail));
  };

  const choose = (next: string) => {
    setUnitChoice(next);
    setValue(next === BASIS ? '100' : '1');
    setError(null);
    // Fehlt das Stückgewicht, ist es die nächste Eingabe: Das Feld bekommt gleich den Fokus.
    if (next === PIECE && editingPiece) focusPiece.current = true;
  };

  const sourceLine = food.basic
    ? tNutrition.basic.source[food.basic.origin](food.basic.code, food.basic.sourceName)
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
              { value: BASIS, label: tNutrition.basic.grams },
              { value: PIECE, label: pieceUnit },
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
          <input
            id={`${id}-menge`}
            inputMode="decimal"
            autoComplete="off"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setError(null);
            }}
            className={INPUT}
          />
        </div>
        {piece && !editingPiece && knownPiece !== undefined ? (
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <p className="text-sm">
              {tNutrition.basic.pieceIs(pieceUnit, fmt.number(knownPiece))}
              {food.basic?.ownPieceGrams !== undefined && food.basic.listPieceGrams !== undefined
                ? ` · ${tNutrition.basic.ownPiece(fmt.number(food.basic.listPieceGrams))}`
                : food.basic?.pieceHint
                  ? ` · ${food.basic.pieceHint}`
                  : ''}
            </p>
            <Button
              variant="quiet"
              size="sm"
              onClick={() => {
                setEditingPiece(true);
                setError(null);
                focusPiece.current = true;
              }}
            >
              {tNutrition.basic.changePiece}
            </Button>
          </div>
        ) : null}
        {piece && editingPiece ? (
          <div>
            <label htmlFor={`${id}-stueck`} className="mb-2 block text-sm font-semibold text-muted">
              {tNutrition.basic.pieceLabel(pieceUnit)}
            </label>
            <input
              ref={pieceInput}
              id={`${id}-stueck`}
              inputMode="decimal"
              autoComplete="off"
              value={pieceText}
              aria-describedby={`${id}-stueck-hinweis`}
              onChange={(event) => {
                setPieceText(event.target.value);
                setError(null);
              }}
              className={INPUT}
            />
            <p id={`${id}-stueck-hinweis`} className="mt-2 text-sm text-muted">
              {tNutrition.basic.pieceAsk}
              {food.basic?.listPieceGrams !== undefined
                ? ` ${tNutrition.basic.listPiece(fmt.number(food.basic.listPieceGrams))}${food.basic.pieceHint ? ` (${food.basic.pieceHint})` : ''}.`
                : ''}
            </p>
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
