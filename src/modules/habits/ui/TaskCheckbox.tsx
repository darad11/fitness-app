import { cn } from '@/shared/lib/cn';
import { CheckMark } from '@/shared/ui';

/** Abhaken einer Aufgabe: natives Kontrollkästchen, die ganze Zeile (48 px) als Bedienziel, Kreis 20 px (D-325). */
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
      <CheckMark checked={checked} />
      <span className={cn('min-w-0 flex-1', checked && 'text-muted line-through')}>{label}</span>
    </label>
  );
}
