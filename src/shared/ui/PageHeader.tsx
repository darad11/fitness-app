import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  back?: { to: string; label: string };
}

export function PageHeader({ title, subtitle, back }: PageHeaderProps) {
  return (
    <header className="mb-6">
      {back ? (
        <Link
          to={back.to}
          className="-ml-2 mb-1 inline-flex min-h-11 items-center gap-1 rounded-input px-2 text-accent-ink hover:bg-surface-2"
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
          {back.label}
        </Link>
      ) : null}
      <h1 className="text-2xl font-semibold">{title}</h1>
      {subtitle ? <p className="mt-1 text-muted">{subtitle}</p> : null}
    </header>
  );
}
