import type { ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router';
import { cn } from '../lib/cn';

/**
 * Schaltflächen der Marke FORM (D-314): Radius 14, ohne Schatten, gedrückt 92 % Deckkraft.
 * Primär: Lime mit Schrift in Nacht, ein Primärknopf je Seite. Sekundär: Ghost mit Rand `line`
 * und heller Schrift. Leise (tertiär): nur Text in Lime. Destruktiv: Ghost mit Schrift in Rot.
 * Kachel: Fläche card-2 mit Rand, für Schnellaktionen als Symbol-Knopf. Aktion: Blau, nur im
 * aktiven Workout („Satz erledigt“, „Überspringen“), damit sich die Trainingsaktion vom Lime abhebt.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger' | 'tile' | 'action';
/** `lg`: Primärknopf in Karten, 52 px; `icon`: runder Knopf mit nur einem Symbol (Name über `aria-label`). */
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const BASE =
  'inline-flex select-none items-center justify-center gap-2 rounded-button font-semibold transition-[background-color,color,opacity] duration-120 active:opacity-92 disabled:cursor-not-allowed disabled:opacity-50';

const SIZES: Record<ButtonSize, string> = {
  sm: 'min-h-10 px-4 text-sm',
  md: 'min-h-12 px-5 text-base',
  lg: 'min-h-button px-6 text-base',
  icon: 'size-12 shrink-0 rounded-pill text-base',
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-accent hover:bg-accent-hover',
  secondary: 'bg-transparent text-fg shadow-[inset_0_0_0_1px_var(--border)] hover:bg-surface-2',
  quiet: 'text-accent-ink hover:bg-surface-2',
  danger: 'bg-transparent text-danger shadow-[inset_0_0_0_1px_var(--border)] hover:bg-danger-soft',
  tile: 'bg-surface-2 text-fg shadow-[inset_0_0_0_1px_var(--border)] hover:bg-surface',
  action: 'bg-action text-on-action hover:opacity-92',
};

export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
): string {
  return cn(BASE, SIZES[size], VARIANTS[variant], className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ variant, size, className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...props} />;
}

export interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return (
    <Link
      className={buttonClasses(
        variant,
        size,
        typeof className === 'string' ? className : undefined,
      )}
      {...props}
    />
  );
}

/**
 * Runde Symbol-Schaltfläche, 44 px (im Training 48 px über `className`). `tile`: Symbol in der
 * Fläche card-2, z. B. Schnellaktionen auf „Heute“.
 */
export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  tone?: 'default' | 'tile';
}

export function IconButton({ label, tone = 'default', className, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        'inline-flex size-touch shrink-0 items-center justify-center rounded-pill transition-[background-color,color,opacity] duration-120 active:opacity-92 disabled:cursor-not-allowed disabled:opacity-50',
        tone === 'tile'
          ? 'bg-surface-2 text-fg shadow-[inset_0_0_0_1px_var(--border)] hover:bg-surface'
          : 'text-muted hover:bg-surface-2 hover:text-fg',
        className,
      )}
      {...props}
    />
  );
}
