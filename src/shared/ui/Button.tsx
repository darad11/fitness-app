import type { ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router';
import { cn } from '../lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger';
export type ButtonSize = 'md' | 'lg';

const BASE =
  'inline-flex select-none items-center justify-center gap-2 rounded-input font-semibold transition-colors duration-120 disabled:cursor-not-allowed disabled:opacity-50';

const SIZES: Record<ButtonSize, string> = {
  md: 'min-h-11 px-4 text-base',
  lg: 'min-h-12 px-5 text-lg',
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-accent hover:bg-accent-hover active:bg-accent-hover',
  secondary: 'border border-line-input bg-surface text-fg hover:bg-surface-2 active:bg-surface-2',
  quiet: 'text-accent-ink hover:bg-surface-2 active:bg-surface-2',
  danger: 'border border-danger bg-surface text-danger hover:bg-surface-2 active:bg-surface-2',
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
