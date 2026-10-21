import { cn } from '../lib/cn';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-surface-2 text-fg',
  accent: 'bg-accent-soft text-accent-ink',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
};

/**
 * Kleines Etikett als Tonfläche, z. B. „Beispiel" oder „Aktiv" (Lime-Ton mit Lime-Schrift, D-314).
 * Die Farbe trägt keine Bedeutung allein.
 */
export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: string;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-semibold',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
