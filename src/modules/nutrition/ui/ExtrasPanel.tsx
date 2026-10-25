import { Info } from 'lucide-react';
import { useId, useState } from 'react';
import { useFormatters } from '@/modules/settings';
import { t } from '@/shared/i18n/de';
import { tNutrition } from '@/shared/i18n/de-nutrition';
import type { Formatters } from '@/shared/lib/format';
import { Dialog } from '@/shared/ui';
import { sharedMissing, type ReferenceLine } from '../calc/references';
import { grams } from './format';

/** Ist eines Werts: Salz mit einer Nachkommastelle, sonst wie überall (unter 10 g eine). */
function istText(fmt: Formatters, line: ReferenceLine): string {
  if (line.total === null) return tNutrition.noValue;
  return line.nutrient === 'salt'
    ? fmt.number(line.total, { maximumFractionDigits: 1 })
    : grams(fmt, line.total);
}

/**
 * „Weitere Nährwerte“ kompakt (Phase Ernährung, Abschluss §1, D-363): je Zeile Name und
 * „Ist / Referenz g“, einzeilig. Die breiteste Zeile braucht mit vollem Namen rund 15 rem, die
 * Liste ist bei 360 pt 18 rem breit; erst unter 16 rem (etwa 320 pt) heißt es „Ges. Fettsäuren“.
 * Fehlt der Wert bei einzelnen Einträgen, steht ein Sternchen hinter der Zahl.
 * Erklärung, Quellen und die Einträge ohne Angabe stehen im Blatt hinter dem Info-Symbol.
 */
export function ExtrasPanel({ lines }: { lines: readonly ReferenceLine[] }) {
  const fmt = useFormatters();
  const headingId = useId();
  const [info, setInfo] = useState(false);
  return (
    <div role="group" aria-labelledby={headingId} className="@container">
      <div className="flex items-center gap-1">
        <h3 id={headingId} className="text-sm font-semibold text-muted">
          {tNutrition.extrasLabel}
        </h3>
        <button
          type="button"
          aria-label={tNutrition.reference.infoLabel}
          aria-haspopup="dialog"
          onClick={() => {
            setInfo(true);
          }}
          className="-my-2 flex size-touch shrink-0 items-center justify-center rounded-pill text-muted hover:bg-surface-2 hover:text-fg"
        >
          <Info aria-hidden="true" className="size-4" />
        </button>
      </div>
      <dl className="grid gap-1 text-sm">
        {lines.map((line) => {
          const name = tNutrition.extras[line.nutrient];
          const short =
            line.nutrient === 'saturatedFat' ? tNutrition.extrasShort.saturatedFat : null;
          return (
            <div
              key={line.nutrient}
              className="flex items-baseline justify-between gap-3 whitespace-nowrap"
            >
              <dt className="text-muted">
                {short ? (
                  <>
                    {/* Screenreader lesen immer den ganzen Namen. */}
                    <span className="@max-[16rem]:sr-only">{name}</span>
                    <span aria-hidden="true" className="hidden @max-[16rem]:inline">
                      {short}
                    </span>
                  </>
                ) : (
                  name
                )}
              </dt>
              <dd className="tabular-nums">
                <span className="font-semibold text-fg">{istText(fmt, line)}</span>
                {line.missingCount > 0 ? (
                  <>
                    <span aria-hidden="true" className="font-semibold text-fg">
                      *
                    </span>
                    <span className="sr-only"> ({tNutrition.reference.incomplete})</span>
                  </>
                ) : null}
                <span className="text-muted">
                  {' '}
                  / {fmt.number(line.reference.grams)} {tNutrition.units.g}
                </span>
              </dd>
            </div>
          );
        })}
      </dl>
      {info ? (
        <ExtrasSheet
          lines={lines}
          onClose={() => {
            setInfo(false);
          }}
        />
      ) : null}
    </div>
  );
}

/** Erklärung, Sternchen, Einträge ohne Angabe und Quellen als Blatt. */
function ExtrasSheet({ lines, onClose }: { lines: readonly ReferenceLine[]; onClose: () => void }) {
  const fmt = useFormatters();
  const shared = sharedMissing(lines);
  const missingLines = lines.filter((line) => line.missingCount > 0);
  const text = tNutrition.reference;
  return (
    <Dialog
      open
      onClose={onClose}
      title={tNutrition.extrasLabel}
      closeLabel={t.common.close}
      variant="sheet"
      fit
    >
      <div className="grid gap-5 text-sm">
        <p>{text.sheetIntro}</p>
        <dl className="grid gap-3">
          {lines.map((line) => {
            const reference = fmt.number(line.reference.grams);
            return (
              <div key={line.nutrient}>
                <dt className="font-semibold">
                  {tNutrition.extras[line.nutrient]}:{' '}
                  {line.reference.bound === 'atMost'
                    ? text.atMost(reference)
                    : text.atLeast(reference)}
                </dt>
                <dd className="text-muted">{text.notes[line.nutrient]}</dd>
              </div>
            );
          })}
        </dl>
        <div>
          <p>{text.asterisk}</p>
          {missingLines.length > 0 ? (
            <>
              <h3 className="mt-3 font-semibold">{text.missingTitle}</h3>
              <dl className="mt-1 grid gap-1">
                {(shared
                  ? [{ label: text.missingAll, names: shared }]
                  : missingLines.map((line) => ({
                      label: tNutrition.extras[line.nutrient],
                      names: line.missingNames,
                    }))
                ).map((row) => (
                  <div key={row.label} className="flex flex-wrap gap-x-2">
                    <dt className="text-muted">{row.label}:</dt>
                    <dd>{text.missingNames(row.names)}</dd>
                  </div>
                ))}
              </dl>
            </>
          ) : null}
        </div>
        <div>
          <h3 className="font-semibold">{text.sourcesTitle}</h3>
          <p className="mt-1 text-muted">{text.sources}</p>
        </div>
      </div>
    </Dialog>
  );
}
