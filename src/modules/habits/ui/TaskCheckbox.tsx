import { Check } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

/** Abhaken einer Aufgabe: natives Kontrollkästchen, 48 px Bedienziel, Haken als Tonfläche. */
export function TaskCheckbox({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-3 py-1">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => {
          onChange(event.target.checked);
        }}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-pill border-2 transition-colors duration-120 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus',
          checked ? 'border-success bg-success text-on-accent' : 'border-line-input bg-surface',
        )}
      >
        {checked ? <Check className="size-4" /> : null}
      </span>
      <span className={cn('min-w-0 flex-1', checked && 'text-muted line-through')}>{label}</span>
    </label>
  );
}
