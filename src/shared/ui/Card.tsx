import { useId, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

/** Fläche für zusammengehörige Inhalte; mit Titel als benannter Abschnitt. */
export function Card({ title, children, className }: CardProps) {
  const titleId = useId();
  return (
    <section
      aria-labelledby={title ? titleId : undefined}
      className={cn('rounded-card border border-line bg-surface p-4 md:p-5', className)}
    >
      {title ? (
        <h2 id={titleId} className="mb-3 text-lg font-semibold">
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}
