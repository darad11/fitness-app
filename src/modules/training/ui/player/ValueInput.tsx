import { useEffect, useRef, useState } from 'react';
import { parseDecimal } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';
import { toDisplay, toStored, type FieldSpec } from '../../calc/fields';

/** Verzögerung, bis eine Eingabe gespeichert wird (AK-TRN-16: spätestens 0,5 s). */
export const SAVE_DELAY_MS = 300;

export interface ValueInputProps {
  spec: FieldSpec;
  label: string;
  stored: number | undefined;
  /** Vorschlag als Platzhalter (Vorwert oder fester Zielwert, D-225). */
  suggestion: number | undefined;
  format: (value: number) => string;
  /** Speichert; `null` leert das Feld. `'invalid'` meldet eine Eingabe, die keine Zahl ist. */
  onCommit: (value: number | null | 'invalid') => void;
  disabled?: boolean;
}

/**
 * Zahlenfeld einer Satzzeile mit Komma oder Punkt. Gespeichert wird 300 ms nach der letzten
 * Eingabe, sofort beim Verlassen des Feldes und beim Wechsel in den Hintergrund.
 */
export function ValueInput({
  spec,
  label,
  stored,
  suggestion,
  format,
  onCommit,
  disabled,
}: ValueInputProps) {
  const shown = stored === undefined ? '' : format(toDisplay(spec, stored));
  const [draft, setDraft] = useState(shown);
  const focused = useRef(false);
  const pending = useRef<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const commitRef = useRef(onCommit);
  useEffect(() => {
    commitRef.current = onCommit;
  });

  // Werte von außen (z. B. ±-Tasten) übernehmen, solange nicht getippt wird.
  useEffect(() => {
    if (!focused.current && pending.current === null) setDraft(shown);
  }, [shown]);

  const flush = () => {
    window.clearTimeout(timer.current);
    const text = pending.current;
    if (text === null) return;
    pending.current = null;
    if (text.trim() === '') {
      commitRef.current(null);
      return;
    }
    const value = parseDecimal(text);
    commitRef.current(value === null ? 'invalid' : toStored(spec, value));
  };
  const flushRef = useRef(flush);
  useEffect(() => {
    flushRef.current = flush;
  });

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') flushRef.current();
    };
    const onPageHide = () => {
      flushRef.current();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onPageHide);
      flushRef.current();
    };
  }, []);

  return (
    <input
      type="text"
      inputMode={spec.decimals ? 'decimal' : 'numeric'}
      enterKeyHint="done"
      autoComplete="off"
      aria-label={label}
      value={draft}
      disabled={disabled}
      placeholder={suggestion === undefined ? '' : format(toDisplay(spec, suggestion))}
      onFocus={() => {
        focused.current = true;
      }}
      onBlur={() => {
        focused.current = false;
        flush();
      }}
      onChange={(event) => {
        setDraft(event.target.value);
        pending.current = event.target.value;
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(flush, SAVE_DELAY_MS);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur();
      }}
      className={cn(
        'h-11 w-full min-w-0 rounded-input border border-line-input bg-surface px-2 text-center text-base text-fg tabular-nums placeholder:text-muted disabled:opacity-60',
      )}
    />
  );
}
