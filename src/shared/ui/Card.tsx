import { useId, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export type CardTone = 'surface' | 'ink' | 'soft';

const TONES: Record<CardTone, string> = {
  surface: 'bg-surface text-fg shadow-card',
  ink: 'bg-ink text-on-ink',
  soft: 'bg-surface-2 text-fg',
};

export interface CardProps {
  title?: string;
  /** Kleine Vorzeile über dem Titel, z. B. „Heute“ oder „Woche 2“. */
  eyebrow?: string;
  /** Aktion rechts neben dem Titel. */
  action?: ReactNode;
  tone?: CardTone;
  children: ReactNode;
  className?: string;
  as?: 'section' | 'div';
}

/**
 * Fläche für zusammengehörige Inhalte (ux-audit.md Abschnitt 2): ohne Rahmen, mit weichem
 * Schatten; `ink` ist die Bühne für die wichtigste Information einer Seite.
 */
export function Card({
  title,
  eyebrow,
  action,
  tone = 'surface',
  children,
  className,
  as: Tag = 'section',
}: CardProps) {
  const titleId = useId();
  return (
    <Tag
      aria-labelledby={title && Tag === 'section' ? titleId : undefined}
      className={cn('rounded-card p-5', TONES[tone], className)}
    >
      {title || eyebrow ? (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {eyebrow ? (
              <p
                className={cn('eyebrow mb-1', tone === 'ink' ? 'text-on-ink-muted' : 'text-muted')}
              >
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2 id={titleId} className="text-lg font-semibold">
                {title}
              </h2>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </Tag>
  );
}
