import { useId } from 'react';
import { chipClasses } from './Chip';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  legend: string;
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  hint?: string;
  disabled?: boolean;
  /**
   * Alle Optionen in einer Zeile, die Chips teilen sich die Breite (F5, D-327), z. B. Zeiträume;
   * sonst brechen die Chips nach Inhalt um.
   */
  row?: boolean;
}

/**
 * Einfachauswahl als Reihe von Chips (D-314) über native Optionsfelder: Pfeiltasten, Screenreader
 * und Formularverhalten kommen vom Browser. Der gewählte Chip ist Lime mit Schrift in Nacht.
 */
export function SegmentedControl<T extends string>({
  legend,
  options,
  value,
  onChange,
  hint,
  disabled,
  row = false,
}: SegmentedControlProps<T>) {
  const name = useId();
  const hintId = useId();
  return (
    <fieldset disabled={disabled} aria-describedby={hint ? hintId : undefined}>
      <legend className="mb-2 text-sm font-semibold text-muted">{legend}</legend>
      <div className={row ? 'flex gap-1 md:gap-2' : 'flex flex-wrap gap-2'}>
        {options.map((option) => (
          <label
            key={option.value}
            className={row ? 'relative flex min-w-0 flex-auto md:flex-none' : 'relative min-w-0'}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => {
                onChange(option.value);
              }}
              className="peer sr-only"
            />
            <span
              className={chipClasses(
                value === option.value,
                'cursor-pointer peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
                { size: row ? 'row' : 'content' },
              )}
            >
              {option.label}
            </span>
          </label>
        ))}
      </div>
      {hint ? (
        <p id={hintId} className="mt-2 text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </fieldset>
  );
}
