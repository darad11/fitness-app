import { ChartLine, Dumbbell, Ellipsis, House, type LucideIcon } from 'lucide-react';
import { t } from '@/shared/i18n/de';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Nicht verfügbare Bereiche erscheinen nicht in der Navigation (AK-UX-01). */
  available: boolean;
  /** Weitere Pfade, die zu diesem Bereich gehören (z. B. Übungen zu Training). */
  sections?: readonly string[];
}

/** Navigation im MVP nach D-211. Training ab M1, Fortschritt ab Schritt E. */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/heute', label: t.nav.today, icon: House, available: true },
  {
    to: '/training',
    label: t.nav.training,
    icon: Dumbbell,
    available: true,
    sections: ['/uebungen'],
  },
  { to: '/fortschritt', label: t.nav.progress, icon: ChartLine, available: true },
  { to: '/mehr', label: t.nav.more, icon: Ellipsis, available: true },
];

export const VISIBLE_NAV_ITEMS: readonly NavItem[] = NAV_ITEMS.filter((item) => item.available);

/** Gehört der Pfad zu einem weiteren Bereich des Eintrags (NavLink prüft nur `to`)? */
export function inSection(pathname: string, item: NavItem): boolean {
  return (item.sections ?? []).some(
    (section) => pathname === section || pathname.startsWith(`${section}/`),
  );
}
