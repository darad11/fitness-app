import { useEffect, useState } from 'react';
import { lastStepsDay } from '@/modules/steps';
import { getMetaValue, lastEntryDay, setMetaValue, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { Button, Dialog } from '@/shared/ui';
import { laterDay, shouldShowReturn } from '../calc/returnFlow';

/** Gerätelokal in `meta` (nicht abgeglichen): für welchen letzten Eintrag das Blatt schon kam. */
const SHOWN_KEY = 'dashboard.returnShownFor';

export type ReturnChoice = 'walk' | 'light' | 'look';

/**
 * Rückkehr-Flow auf „Heute“ (form-markenleitplanken.md Abschnitt 3, D-319): `open`, sobald der
 * Auslöser greift; vermerkt wird beim Zeigen, damit das Blatt einmal je Rückkehr kommt.
 * `firstStart`: noch gar kein Eintrag. Gelesen wird einmal je Besuch von „Heute“.
 */
export function useReturnFlow(todayKey: string): {
  open: boolean;
  firstStart: boolean;
  close: () => void;
} {
  const { db } = useDb();
  const [open, setOpen] = useState(false);
  const [firstStart, setFirstStart] = useState(false);
  useEffect(() => {
    const visit = new AbortController();
    // Als Funktion gelesen: Der Besuch kann während jedes `await` enden.
    const ended = () => visit.signal.aborted;
    void (async () => {
      try {
        const [entries, steps, shown] = await Promise.all([
          lastEntryDay(db),
          lastStepsDay(db),
          getMetaValue(db, SHOWN_KEY),
        ]);
        if (ended()) return;
        const last = laterDay(entries, steps);
        setFirstStart(last === null);
        if (
          last === null ||
          !shouldShowReturn(last, todayKey, typeof shown === 'string' ? shown : null)
        ) {
          return;
        }
        await setMetaValue(db, SHOWN_KEY, last);
        if (!ended()) setOpen(true);
      } catch {
        // Ein Angebot, keine Pflicht: Ohne Daten bleibt „Heute“ wie immer.
      }
    })();
    return () => {
      visit.abort();
    };
  }, [db, todayKey]);
  return {
    open,
    firstStart,
    close: () => {
      setOpen(false);
    },
  };
}

/**
 * Blatt „Schön, dass du da bist.“ mit drei gleichwertigen Knöpfen; Wegwischen, Escape und
 * „Schließen“ wirken wie „Nur reinschauen“. Keine Zahl verpasster Tage, keine Rückstandsliste.
 */
export function ReturnSheet({
  open,
  onChoose,
}: {
  open: boolean;
  onChoose: (choice: ReturnChoice) => void;
}) {
  const r = t.returnFlow;
  const choices: [ReturnChoice, string][] = [
    ['walk', r.walk],
    ['light', r.light],
    ['look', r.look],
  ];
  return (
    <Dialog
      open={open}
      onClose={() => {
        onChoose('look');
      }}
      title={r.title}
      closeLabel={t.common.close}
      variant="sheet"
      fit
      focusTitle
    >
      <p>{r.text}</p>
      <div className="mt-5 grid gap-2">
        {choices.map(([choice, label]) => (
          <Button
            key={choice}
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={() => {
              onChoose(choice);
            }}
          >
            {label}
          </Button>
        ))}
      </div>
    </Dialog>
  );
}
