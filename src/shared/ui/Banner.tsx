import { X, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

export type BannerTone = 'neutral' | 'warning' | 'accent';

const ICON_TONE: Record<BannerTone, string> = {
  neutral: 'text-muted',
  warning: 'text-warning',
  accent: 'text-accent-ink',
};

export interface BannerProps {
  icon?: LucideIcon;
  tone?: BannerTone;
  children: ReactNode;
  actions?: ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
  role?: 'status' | 'alert';
}

/**
 * Globale Hinweisleiste (S-46). Text in Texttokens; die Farbe trägt nur das Symbol.
 * Der Inhalt fluchtet mit dem Seiteninhalt; Aktionen stehen unter dem Text, Schließen oben rechts.
 */
export function Banner({
  icon: Icon,
  tone = 'neutral',
  children,
  actions,
  onDismiss,
  dismissLabel,
  role = 'status',
}: BannerProps) {
  return (
    <div role={role} className="border-b border-line bg-surface text-sm">
      <div className="page-gutters mx-auto flex max-w-content items-start gap-3 py-2">
        {Icon ? (
          <Icon aria-hidden="true" className={cn('mt-2.5 size-5 shrink-0', ICON_TONE[tone])} />
        ) : null}
        <div className="min-w-0 flex-1 py-2">
          <div>{children}</div>
          {actions ? <div className="mt-2 flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label={dismissLabel}
            className="-mr-2 inline-flex size-touch shrink-0 items-center justify-center rounded-pill text-muted hover:bg-surface-2"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
