import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { tNutrition } from '@/shared/i18n/de-nutrition';
import { Button, Dialog } from '@/shared/ui';
import type { OffDraft } from '../calc/openFoodFacts';
import { toFoodItem } from '../data/nutritionRepository';
import { setOffConsent } from '../data/openFoodFacts';
import type { FoodItem } from '../model/foodItem';
import { lookupBarcode, type BarcodeLookup } from '../service/barcodeService';
import { ScannerDialog } from './ScannerDialog';

export interface FoodDraftState {
  draft: Partial<OffDraft> & { barcode: string };
  fromOff?: boolean;
}

type Step =
  | { kind: 'scan' }
  | { kind: 'searching'; code: string }
  | { kind: 'consent'; code: string }
  | {
      kind: 'result';
      lookup: Extract<BarcodeLookup, { kind: 'invalid' | 'notFound' | 'unavailable' }>;
    };

/**
 * Ablauf „Barcode scannen“ (NU-07, D-266): scannen bzw. eintippen, lokal suchen, nach
 * Einwilligung bei Open Food Facts nachfragen, Treffer speichern und zum Eintragen übergeben.
 */
export function BarcodeFlow({
  returnTo,
  onClose,
  onFood,
}: {
  /** Rückweg für das Formular „Selbst anlegen“. */
  returnTo: string;
  onClose: () => void;
  onFood: (food: FoodItem, saved: boolean) => void;
}) {
  const rt = useDb();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>({ kind: 'scan' });
  // Nach „Schließen“ oder beim Verlassen zählt ein spätes Ergebnis nicht mehr (C-03): vorher
  // öffnete es bis zu 10 s danach unvermittelt „Eintragen“ oder das Formular.
  const open = useRef(true);
  useEffect(() => {
    // Auch nach dem zweiten Einhängen im StrictMode wieder offen.
    open.current = true;
    return () => {
      open.current = false;
    };
  }, []);
  const close = () => {
    open.current = false;
    onClose();
  };

  const openForm = (state: FoodDraftState) => {
    void navigate(`/ernaehrung/lebensmittel/neu?zurueck=${encodeURIComponent(returnTo)}`, {
      state,
    });
  };

  const search = (code: string) => {
    setStep({ kind: 'searching', code });
    lookupBarcode(rt, code).then(
      (lookup) => {
        if (!open.current) return;
        switch (lookup.kind) {
          case 'local':
          case 'saved':
            onFood(toFoodItem(lookup.food), lookup.kind === 'saved');
            return;
          case 'needsConsent':
            setStep({ kind: 'consent', code: lookup.barcode });
            return;
          case 'incomplete':
            openForm({ draft: lookup.draft, fromOff: true });
            return;
          default:
            setStep({ kind: 'result', lookup });
        }
      },
      (error: unknown) => {
        void logError(rt.db, { area: 'nutrition', error, route: window.location.pathname });
        if (!open.current) return;
        setStep({ kind: 'result', lookup: { kind: 'unavailable', barcode: code } });
      },
    );
  };

  if (step.kind === 'consent') {
    return (
      <Dialog
        open
        onClose={close}
        title={tNutrition.barcode.consentTitle}
        closeLabel={t.common.close}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                openForm({ draft: { barcode: step.code } });
              }}
            >
              {tNutrition.barcode.consentDeny}
            </Button>
            <Button
              onClick={() => {
                void setOffConsent(rt.db, true).then(() => {
                  search(step.code);
                });
              }}
            >
              {tNutrition.barcode.consentAllow}
            </Button>
          </>
        }
      >
        <p>{tNutrition.barcode.consentText}</p>
      </Dialog>
    );
  }

  const status =
    step.kind === 'searching' ? (
      <p role="status" className="font-semibold">
        {tNutrition.barcode.searching(step.code)}
      </p>
    ) : step.kind === 'result' ? (
      <div role="status" className="grid gap-3 rounded-card bg-surface-2 p-4">
        <p>
          {step.lookup.kind === 'invalid'
            ? tNutrition.barcode.invalid
            : step.lookup.kind === 'notFound'
              ? tNutrition.barcode.notFound(step.lookup.barcode)
              : tNutrition.barcode.unavailable}
        </p>
        {step.lookup.kind !== 'invalid' ? (
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                if (step.lookup.kind !== 'invalid') {
                  openForm({ draft: { barcode: step.lookup.barcode } });
                }
              }}
            >
              {tNutrition.barcode.createOwn}
            </Button>
            {step.lookup.kind === 'unavailable' ? (
              <Button
                variant="secondary"
                onClick={() => {
                  if (step.lookup.kind === 'unavailable') search(step.lookup.barcode);
                }}
              >
                {tNutrition.barcode.retry}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    ) : undefined;

  return <ScannerDialog onClose={close} onCode={search} status={status} />;
}
