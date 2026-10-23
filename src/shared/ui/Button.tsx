import { Settings2 } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router';
import { cn } from '../lib/cn';

/**
 * Schaltflächen der Marke FORM (D-314): Radius 14, ohne Schatten, gedrückt 92 % Deckkraft.
 * Primär: Lime mit Schrift in Nacht, ein Primärknopf je Seite. Sekundär: Ghost mit Rand `line`
 * und heller Schrift. Leise (tertiär): nur Text in Lime. Destruktiv: Ghost mit Schrift in Rot.
 * Leise destruktiv: nur Text in Rot, z. B. „Löschen“ neben „Speichern“. Kachel: Fläche card-2
 * mit Rand, für Schnellaktionen als Symbol-Knopf. Aktion: Blau, nur im aktiven Workout („Satz
 * erledigt“, „Überspringen“), damit sich die Trainingsaktion vom Lime abhebt.
 *
 * `cn` löst widersprüchliche Klassen nicht auf (clsx): Farbe, Größe und Innenmaß kommen über
 * `variant`, `size` und `tone`, nicht über `className` (F5, D-322). `class-conflicts.test.ts`
 * prüft alle Aufrufe.
 */
export type ButtonVariant =
  'primary' | 'secondary' | 'quiet' | 'quietDanger' | 'danger' | 'tile' | 'action';
/**
 * `lg`: Primärknopf in Karten, 52 px; `icon`: runder Knopf mit nur einem Symbol (Name über
 * `aria-label`); `row`: wie `md`, auf schmalen Breiten mit 12 px Innenmaß, für Knöpfe, die sich
 * eine Zeile teilen (F5 Abschnitt 9, D-331).
 */
export type ButtonSize = 'sm' | 'md' | 'row' | 'lg' | 'icon';

export const BUTTON_BASE =
  'inline-flex select-none items-center justify-center gap-2 rounded-button font-semibold transition-[background-color,color,opacity] duration-120 active:opacity-92 disabled:cursor-not-allowed disabled:opacity-50';

export const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'min-h-10 px-4 text-sm',
  md: 'min-h-12 px-5 text-base',
  row: 'min-h-12 px-3 text-base md:px-5',
  lg: 'min-h-button px-6 text-base',
  icon: 'size-12 shrink-0 rounded-pill text-base',
};

export const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-accent hover:bg-accent-hover',
  secondary: 'bg-transparent text-fg shadow-[inset_0_0_0_1px_var(--border)] hover:bg-surface-2',
  quiet: 'text-accent-ink hover:bg-surface-2',
  quietDanger: 'text-danger hover:bg-danger-soft',
  danger: 'bg-transparent text-danger shadow-[inset_0_0_0_1px_var(--border)] hover:bg-danger-soft',
  tile: 'bg-surface-2 text-fg shadow-[inset_0_0_0_1px_var(--border)] hover:bg-surface',
  action: 'bg-action text-on-action hover:opacity-92',
};

export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
): string {
  return cn(BUTTON_BASE, BUTTON_SIZES[size], BUTTON_VARIANTS[variant], className);
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
 * Runde Symbol-Schaltfläche, 44 px. `tile`: Symbol in der Fläche card-2, z. B. Schnellaktionen
 * auf „Heute“ oder ein geöffneter Umschalter; `danger`: Symbol in Rot, z. B. Löschen.
 */
export type IconButtonTone = 'default' | 'tile' | 'danger';

export const ICON_BUTTON_BASE =
  'inline-flex size-touch shrink-0 items-center justify-center rounded-pill transition-[background-color,color,opacity] duration-120 active:opacity-92 disabled:cursor-not-allowed disabled:opacity-50';

export const ICON_BUTTON_TONES: Record<IconButtonTone, string> = {
  default: 'text-muted hover:bg-surface-2 hover:text-fg',
  tile: 'bg-surface-2 text-fg shadow-[inset_0_0_0_1px_var(--border)] hover:bg-surface',
  danger: 'text-danger hover:bg-danger-soft',
};

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  tone?: IconButtonTone;
}

export function IconButton({ label, tone = 'default', className, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(ICON_BUTTON_BASE, ICON_BUTTON_TONES[tone], className)}
      {...props}
    />
  );
}

/**
 * Regler-Symbol oben rechts in einer Karte, führt zur Verwaltung (F5, D-325): rund wie
 * `IconButton`, 44 px Tippfläche, Symbol 20 px; `-mr-2` rückt das Symbol an die Innenkante der
 * Karte. Eine Komponente für „Tagesaufgaben“ und „Wochenziel“, damit Größe, Strichstärke und
 * Lage gleich bleiben.
 */
export function SettingsLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      aria-label={label}
      className={cn(ICON_BUTTON_BASE, ICON_BUTTON_TONES.default, '-mr-2')}
    >
      <Settings2 aria-hidden="true" className="size-5" />
    </Link>
  );
}
