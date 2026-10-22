import { useId } from 'react';
import { cn } from '../lib/cn';

export interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
  disabled?: boolean;
}

/**
 * Schalter als natives Kontrollkästchen mit Rolle „switch“; Zustand über Fläche und Position.
 * Das Kontrollkästchen liegt unsichtbar über der ganzen Schalterfläche (44 × 56 px), damit ein
 * Tipp auf den Schalter selbst wirkt, nicht nur auf die Beschriftung (F5, D-322). Die Fläche
 * ragt oben und unten je 6 px über den sichtbaren Schalter hinaus, ohne die Zeile zu erhöhen.
 */
export function Switch({ label, checked, onChange, hint, disabled }: SwitchProps) {
  const id = useId();
  const hintId = useId();
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="min-w-0">
        <label htmlFor={id} className="block font-medium">
          {label}
        </label>
        {hint ? (
          <p id={hintId} className="mt-1 text-sm text-muted">
            {hint}
          </p>
        ) : null}
      </div>
      <span className="relative -my-1.5 inline-flex h-touch w-14 shrink-0 items-center">
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          aria-checked={checked}
          aria-describedby={hint ? hintId : undefined}
          onChange={(event) => {
            onChange(event.target.checked);
          }}
          className="peer absolute inset-0 z-10 m-0 size-full cursor-pointer appearance-none opacity-0 disabled:cursor-not-allowed"
        />
        <span
          aria-hidden="true"
          className={cn(
            'block h-8 w-14 rounded-pill transition-colors duration-120 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus peer-disabled:opacity-50',
            checked ? 'bg-accent' : 'bg-line-input',
          )}
        />
        <span
          aria-hidden="true"
          className={cn(
            'absolute top-1/2 left-1 size-6 -translate-y-1/2 rounded-pill bg-surface shadow-card transition-transform duration-120',
            checked && 'translate-x-6',
          )}
        />
      </span>
    </div>
  );
}
