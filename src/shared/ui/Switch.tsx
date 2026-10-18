import { useId } from 'react';
import { cn } from '../lib/cn';

export interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
  disabled?: boolean;
}

/** Schalter als natives Kontrollkästchen mit Rolle „switch“; Zustand über Fläche und Position. */
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
      <span className="relative inline-flex shrink-0 items-center">
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
          className="peer sr-only"
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
            'absolute top-1 left-1 size-6 rounded-pill bg-surface shadow-card transition-transform duration-120',
            checked && 'translate-x-6',
          )}
        />
      </span>
    </div>
  );
}
