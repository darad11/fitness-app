import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

export interface PageHeaderProps {
  title: string;
  /** Vorzeile über dem Titel, z. B. das Datum oder der Bereich. */
  eyebrow?: string;
  subtitle?: string;
  back?: { to: string; label: string };
  /** Aktion rechts vom Titel (Desktop) bzw. darunter (mobil). */
  action?: ReactNode;
}

/**
 * Seitenkopf der Marke FORM (D-314): Rücksprung in heller Schrift, Vorzeile als Label,
 * Headline 28/600, Untertitel gedämpft.
 */
export function PageHeader({ title, eyebrow, subtitle, back, action }: PageHeaderProps) {
  return (
    <header className="mb-5">
      {back ? (
        <Link
          to={back.to}
          className="-ml-2 mb-1 inline-flex min-h-touch items-center gap-1 rounded-button px-2 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-fg"
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
          {back.label}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          {eyebrow ? <p className="eyebrow mb-1 text-muted">{eyebrow}</p> : null}
          <h1 className="text-headline font-semibold hyphens-auto [overflow-wrap:anywhere]">
            {title}
          </h1>
          {subtitle ? <p className="mt-1 text-muted">{subtitle}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}
