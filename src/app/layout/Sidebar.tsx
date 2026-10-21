import { NavLink, useLocation } from 'react-router';
import { t } from '@/shared/i18n/de';
import { cn } from '@/shared/lib/cn';
import { inSection, VISIBLE_NAV_ITEMS } from './nav';

/**
 * Seitenleiste am Mac und auf dem iPad quer (ab 1024 px): eingeklappt nur Symbole, damit der Inhalt
 * fast die ganze Breite hat; unter dem Mauszeiger oder mit dem Tastaturfokus klappt sie über den
 * Inhalt aus und zeigt die Namen (D-272). Marke FORM: deckende Fläche mit 1-px-Rand, ohne Glas;
 * aktiver Bereich mit Symbol und Namen in Lime, ohne Füllfläche (D-314).
 */
export function Sidebar() {
  const { pathname } = useLocation();
  return (
    <nav
      aria-label={t.nav.label}
      className="sidebar fixed top-3 bottom-3 left-3 z-30 hidden flex-col overflow-hidden px-3 pt-4 pb-4 lg:flex"
    >
      {/* Eingeklappt nur das F (Kachel), ausgeklappt Symbol plus Wortmarke (D-310). */}
      <div className="relative mb-5 flex h-11 items-center px-1.5">
        <img src="/brand/kachel-f.svg" alt="" className="sidebar-tile size-9 shrink-0" />
        <img
          src="/brand/logo-kopfzeile-dunkel.svg"
          alt={t.app.name}
          height={30}
          className="sidebar-label absolute left-1.5 h-logo w-auto"
        />
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
                    'flex min-h-12 items-center gap-3 rounded-button px-3.5',
                    isActive || section
                      ? 'font-semibold text-accent-ink'
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
