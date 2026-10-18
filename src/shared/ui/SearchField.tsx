import { Search, X } from 'lucide-react';
import { useId, useRef } from 'react';

export interface SearchFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  clearLabel: string;
}

/**
 * Suchfeld mit sichtbarer Beschriftung und Knopf zum Leeren. Schrift 16 px, damit iOS nicht
 * zoomt; ohne Autokorrektur, weil Übungsnamen oft englisch oder abgekürzt sind.
 */
export function SearchField({ label, value, onChange, placeholder, clearLabel }: SearchFieldProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted"
        />
        <input
          ref={input}
          id={id}
          type="search"
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="search"
          onChange={(event) => {
            onChange(event.target.value);
          }}
          className="min-h-12 w-full appearance-none rounded-pill bg-surface-2 pr-12 pl-11 text-base text-fg placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
        />
        {value ? (
          <button
            type="button"
            aria-label={clearLabel}
            onClick={() => {
              onChange('');
              input.current?.focus();
            }}
            className="absolute top-0.5 right-0.5 flex size-11 items-center justify-center rounded-pill text-muted hover:text-fg"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
