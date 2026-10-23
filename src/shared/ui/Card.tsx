import { useId, type ReactNode } from 'react';
import { cn } from '../lib/cn';

/**
 * `surface`: Karte; `stage`: Bühne für die wichtigste Information einer Seite (eine Stufe heller,
 * `bg-elevated`); `soft`: Fläche card-2 ohne Rand, z. B. innerhalb einer Karte; `tint`: grüne
 * Karte „Bereit für dein Training?“ (F6, D-336, V2c), Vorzeile in hellem Grüngrau.
 */
export type CardTone = 'surface' | 'stage' | 'soft' | 'tint';

const TONES: Record<CardTone, string> = {
  surface: 'bg-surface text-fg shadow-card',
  stage: 'stage text-fg',
  soft: 'bg-surface-2 text-fg',
  tint: 'bg-stage-tint text-stage-tint-fg shadow-tint',
};

export interface CardProps {
  title?: string;
  /** Kleine Vorzeile über dem Titel, z. B. „Heute geplant“ oder „Woche 2“. */
  eyebrow?: string;
  /**
   * `label`: Der Titel steht als Label oben (13 px, Versalien, gedämpft), wie bei Kennzahl-Karten
   * mit großem Wert darunter; sonst als Titel 20/600.
   */
  titleStyle?: 'title' | 'label';
  /** Aktion rechts neben dem Titel. */
  action?: ReactNode;
  tone?: CardTone;
  children: ReactNode;
  className?: string;
  as?: 'section' | 'div';
}

/**
 * Karte der Marke FORM (D-314): Fläche `card`, 1-px-Rand `line`, Radius 20, Innenabstand 16, ohne
 * Schatten; Label oben in 13 px Versalien, Werte groß mit tabellarischen Ziffern.
 */
export function Card({
  title,
  eyebrow,
  titleStyle = 'title',
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
      className={cn('rounded-card p-card', TONES[tone], className)}
    >
      {title || eyebrow ? (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {eyebrow ? (
              <p
                className={cn(
                  'eyebrow mb-1',
                  tone === 'tint' ? 'text-stage-tint-muted' : 'text-muted',
                )}
              >
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2
                id={titleId}
                className={
                  titleStyle === 'label' ? 'eyebrow text-muted' : 'text-title font-semibold'
                }
              >
                {title}
              </h2>
            ) : null}
          </div>
          {action ? <div className="-my-2 shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </Tag>
  );
}
