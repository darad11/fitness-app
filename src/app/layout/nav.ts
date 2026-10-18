import { ChartLine, Dumbbell, Ellipsis, House, type LucideIcon } from 'lucide-react';
import { t } from '@/shared/i18n/de';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Nicht verfügbare Bereiche erscheinen nicht in der Navigation (AK-UX-01). */
  available: boolean;
}

/** Navigation im MVP nach D-211. Training folgt mit M1, Fortschritt mit M3. */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/heute', label: t.nav.today, icon: House, available: true },
  { to: '/training', label: t.nav.training, icon: Dumbbell, available: false },
  { to: '/fortschritt', label: t.nav.progress, icon: ChartLine, available: false },
  { to: '/mehr', label: t.nav.more, icon: Ellipsis, available: true },
];

export const VISIBLE_NAV_ITEMS: readonly NavItem[] = NAV_ITEMS.filter((item) => item.available);
