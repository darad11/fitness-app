import { useId } from 'react';

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
}

/**
 * Einfachauswahl als Gruppe nativer Optionsfelder: Pfeiltasten, Screenreader und Formular-
 * verhalten kommen vom Browser. Der gewählte Teil hebt sich mit der Akzentfläche ab (≥ 3:1).
 */
export function SegmentedControl<T extends string>({
  legend,
  options,
  value,
  onChange,
  hint,
  disabled,
}: SegmentedControlProps<T>) {
  const name = useId();
  const hintId = useId();
  return (
    <fieldset disabled={disabled} aria-describedby={hint ? hintId : undefined}>
      <legend className="mb-2 text-sm font-semibold text-muted">{legend}</legend>
      <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-input bg-surface-2 p-1">
        {options.map((option) => (
          <label key={option.value} className="relative">
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
            <span className="flex min-h-11 cursor-pointer items-center justify-center rounded-[6px] px-3 text-center text-base font-medium text-muted transition-colors duration-120 peer-checked:bg-accent peer-checked:text-on-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus peer-disabled:cursor-not-allowed">
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
