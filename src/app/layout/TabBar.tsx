import { NavLink, useLocation } from 'react-router';
import { t } from '@/shared/i18n/de';
import { cn } from '@/shared/lib/cn';
import { inSection, VISIBLE_NAV_ITEMS } from './nav';

/** Tab-Leiste auf iPhone und iPad hoch (unter 1024 px). */
export function TabBar() {
  const { pathname } = useLocation();
  return (
    <nav
      aria-label={t.nav.label}
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto flex max-w-lg">
        {VISIBLE_NAV_ITEMS.map((item) => {
          const { to, label, icon: Icon } = item;
          const section = inSection(pathname, item);
          return (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-16 flex-col items-center justify-center gap-1 text-xs',
                    isActive || section
                      ? 'font-semibold text-accent-ink'
                      : 'font-medium text-muted',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      aria-hidden="true"
                      className={cn(
                        'flex h-8 w-14 items-center justify-center rounded-pill transition-colors duration-120',
                        (isActive || section) && 'bg-accent-soft',
                      )}
                    >
                      <Icon aria-hidden="true" className="size-6" />
                    </span>
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
