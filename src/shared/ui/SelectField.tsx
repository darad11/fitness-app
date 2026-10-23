import { useId } from 'react';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

export interface SelectFieldProps<T extends string> {
  label: string;
  options: readonly SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  hint?: string;
  disabled?: boolean;
}

/** Natives Auswahlfeld im Stil der Eingabefelder (`field`); Schrift 16 px, damit iOS nicht zoomt. */
export function SelectField<T extends string>({
  label,
  options,
  value,
  onChange,
  hint,
  disabled,
}: SelectFieldProps<T>) {
  const id = useId();
  const hintId = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-muted">
        {label}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        aria-describedby={hint ? hintId : undefined}
        onChange={(event) => {
          const next = options.find((option) => option.value === event.target.value);
          if (next) onChange(next.value);
        }}
        className="field w-full font-medium"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint ? (
        <p id={hintId} className="mt-2 text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
