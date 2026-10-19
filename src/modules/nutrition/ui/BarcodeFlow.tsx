import { useState } from 'react';
import { useNavigate } from 'react-router';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
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

  const openForm = (state: FoodDraftState) => {
    void navigate(`/ernaehrung/lebensmittel/neu?zurueck=${encodeURIComponent(returnTo)}`, {
      state,
    });
  };

  const search = (code: string) => {
    setStep({ kind: 'searching', code });
    lookupBarcode(rt, code).then(
      (lookup) => {
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
        setStep({ kind: 'result', lookup: { kind: 'unavailable', barcode: code } });
        void logError(rt.db, { area: 'nutrition', error, route: window.location.pathname });
      },
    );
  };

  if (step.kind === 'consent') {
    return (
      <Dialog
        open
        onClose={onClose}
        title={t.nutrition.barcode.consentTitle}
        closeLabel={t.common.close}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                openForm({ draft: { barcode: step.code } });
              }}
            >
              {t.nutrition.barcode.consentDeny}
            </Button>
            <Button
              onClick={() => {
                void setOffConsent(rt.db, true).then(() => {
                  search(step.code);
                });
              }}
            >
              {t.nutrition.barcode.consentAllow}
            </Button>
          </>
        }
      >
        <p>{t.nutrition.barcode.consentText}</p>
      </Dialog>
    );
  }

  const status =
    step.kind === 'searching' ? (
      <p role="status" className="font-semibold">
        {t.nutrition.barcode.searching(step.code)}
      </p>
    ) : step.kind === 'result' ? (
      <div role="status" className="grid gap-3 rounded-card bg-surface-2 p-4">
        <p>
          {step.lookup.kind === 'invalid'
            ? t.nutrition.barcode.invalid
            : step.lookup.kind === 'notFound'
              ? t.nutrition.barcode.notFound(step.lookup.barcode)
              : t.nutrition.barcode.unavailable}
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
              {t.nutrition.barcode.createOwn}
            </Button>
            {step.lookup.kind === 'unavailable' ? (
              <Button
                variant="secondary"
                onClick={() => {
                  if (step.lookup.kind === 'unavailable') search(step.lookup.barcode);
                }}
              >
                {t.nutrition.barcode.retry}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    ) : undefined;

  return <ScannerDialog onClose={onClose} onCode={search} status={status} />;
}
