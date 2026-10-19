import { useFormatters } from '@/modules/settings';
import { useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { Button, Card, Skeleton } from '@/shared/ui';
import { setOffConsent, useOffConsent } from '../data/openFoodFacts';

/** Einwilligung für Open Food Facts ansehen, geben und zurückziehen (D-266). */
export function OffConsentCard() {
  const { db } = useDb();
  const fmt = useFormatters();
  const consent = useOffConsent();
  const tb = t.nutrition.barcode;
  return (
    <Card title={tb.offTitle} className="mt-6">
      {consent === undefined ? (
        <Skeleton className="h-12" />
      ) : (
        <>
          <p>{consent ? tb.offOn(fmt.dayMonthYear(new Date(consent.grantedAt))) : tb.offOff}</p>
          <Button
            variant="secondary"
            className="mt-3"
            onClick={() => void setOffConsent(db, !consent)}
          >
            {consent ? tb.offRevoke : tb.offGrant}
          </Button>
        </>
      )}
      <p className="mt-3 text-xs text-muted">{tb.offSource}</p>
    </Card>
  );
}
