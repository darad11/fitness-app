import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { ProgressRing } from '@/shared/ui';

/**
 * Kalorien-Ring (D-314, ersetzt den Farbverlauf aus D-272): ein Lime-Bogen auf der Spur card-2,
 * Strich 10 px, runde Enden; ab dem Ziel voll. Eiweiß, Kohlenhydrate und Fett stehen als Balken
 * daneben. Rein grafisch; `label` nennt Kalorien und Makros für VoiceOver.
 */
export function MacroRing({
  value,
  label,
  size = 8.25,
  className,
  children,
}: {
  /** Anteil am Ziel; über 1 bleibt der Ring voll. */
  value: number;
  label: string;
  /** Durchmesser in rem. */
  size?: number;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div role="img" aria-label={label} className={cn('inline-flex shrink-0', className)}>
      <ProgressRing value={value} label={null} size={size}>
        {children}
      </ProgressRing>
    </div>
  );
}
