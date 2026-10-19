import type { ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router';
import { cn } from '../lib/cn';

/**
 * Schaltflächen (ux-audit.md Abschnitt 2): Pille, 48 px hoch. Primär in Akzent, sekundär als
 * Tonfläche ohne Rahmen, leise nur Text, destruktiv als Gefahr-Tonfläche; `onInk` für die Bühne.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger' | 'onInk';
export type ButtonSize = 'sm' | 'md' | 'lg';

const BASE =
  'inline-flex select-none items-center justify-center gap-2 rounded-pill font-semibold transition-colors duration-120 disabled:cursor-not-allowed disabled:opacity-50';

const SIZES: Record<ButtonSize, string> = {
  sm: 'min-h-10 px-4 text-sm',
  md: 'min-h-12 px-5 text-base',
  lg: 'min-h-14 px-6 text-lg',
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-on-accent shadow-[0_8px_20px_-8px_var(--accent)] hover:bg-accent-hover active:bg-accent-hover',
  secondary:
    'bg-surface-2 text-fg shadow-[inset_0_0_0_1px_var(--border),inset_0_1px_0_var(--glass-edge)] hover:bg-surface active:bg-surface',
  quiet: 'text-accent-ink hover:bg-surface-2 active:bg-surface-2',
  danger: 'bg-danger-soft text-danger hover:bg-surface-2 active:bg-surface-2',
  onInk: 'bg-on-ink text-ink hover:bg-on-ink-muted active:bg-on-ink-muted',
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

/** Runde Symbol-Schaltfläche, 44 px (im Training 48 px über `className`). */
export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  tone?: 'default' | 'onInk';
}

export function IconButton({ label, tone = 'default', className, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        'inline-flex size-11 shrink-0 items-center justify-center rounded-pill transition-colors duration-120',
        tone === 'onInk'
          ? 'text-on-ink hover:bg-on-ink/15 active:bg-on-ink/20'
          : 'text-muted hover:bg-surface-2 hover:text-fg active:bg-surface-2',
        className,
      )}
      {...props}
    />
  );
}
