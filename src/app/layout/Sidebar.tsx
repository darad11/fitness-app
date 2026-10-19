import { NavLink, useLocation } from 'react-router';
import { t } from '@/shared/i18n/de';
import { cn } from '@/shared/lib/cn';
import { inSection, VISIBLE_NAV_ITEMS } from './nav';

/**
 * Seitenleiste am Mac und auf dem iPad quer (ab 1024 px), schwebendes Glas (D-272): eingeklappt
 * nur Symbole, damit der Inhalt fast die ganze Breite hat; unter dem Mauszeiger oder mit dem
 * Tastaturfokus klappt sie über den Inhalt aus und zeigt die Namen.
 */
export function Sidebar() {
  const { pathname } = useLocation();
  return (
    <nav
      aria-label={t.nav.label}
      className="sidebar glass-blur fixed top-3 bottom-3 left-3 z-30 hidden flex-col overflow-hidden px-3 pt-4 pb-4 lg:flex"
    >
      <div className="mb-5 flex h-11 items-center gap-3 px-1.5">
        <img src="/icons/icon-192.png" alt="" className="size-9 shrink-0 rounded-[10px]" />
        <span className="sidebar-label text-lg font-bold">{t.app.name}</span>
      </div>
      <ul className="space-y-1">
        {VISIBLE_NAV_ITEMS.map((item) => {
          const { to, label, icon: Icon } = item;
          const section = inSection(pathname, item);
          return (
            <li key={to}>
              <NavLink
                to={to}
                title={label}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-12 items-center gap-3 rounded-[14px] px-3.5',
                    isActive || section
                      ? 'bg-[var(--selection-pill)] font-semibold text-accent-ink shadow-[inset_0_0_0_1px_var(--border)]'
                      : 'text-muted hover:bg-surface-2 hover:text-fg',
                  )
                }
              >
                <Icon aria-hidden="true" className="size-5 shrink-0" />
                <span className="sidebar-label">{label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
