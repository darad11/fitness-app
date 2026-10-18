import { NavLink } from 'react-router';
import { t } from '@/shared/i18n/de';
import { cn } from '@/shared/lib/cn';
import { VISIBLE_NAV_ITEMS } from './nav';

/** Seitenleiste am Mac und auf dem iPad quer (ab 1024 px). */
export function Sidebar() {
  return (
    <nav
      aria-label={t.nav.label}
      className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-surface px-3 pt-[max(1.5rem,env(safe-area-inset-top))] pb-6 lg:flex"
    >
      <p className="mb-6 px-3 text-lg font-semibold">{t.app.name}</p>
      <ul className="space-y-1">
        {VISIBLE_NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex min-h-11 items-center gap-3 rounded-input px-3',
                  isActive
                    ? 'bg-surface-2 font-semibold text-accent-ink'
                    : 'text-muted hover:bg-surface-2 hover:text-fg',
                )
              }
            >
              <Icon aria-hidden="true" className="size-5" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
