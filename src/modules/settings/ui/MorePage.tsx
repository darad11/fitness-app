import { Info, RefreshCw, Settings, UserRound } from 'lucide-react';
import { tMore } from '@/shared/i18n/de-more';
import { LinkList, PageHeader, type LinkListItem } from '@/shared/ui';

interface MoreItem extends LinkListItem {
  /** Eingeschaltet mit dem Meilenstein, der die Seite liefert (AK-UX-01). */
  available: boolean;
}

const MORE_ITEMS: readonly MoreItem[] = [
  { to: '/mehr/profil', label: tMore.more.profile, icon: UserRound, available: true },
  { to: '/mehr/einstellungen', label: tMore.more.settings, icon: Settings, available: true },
  { to: '/mehr/synchronisierung', label: tMore.more.sync, icon: RefreshCw, available: true },
  { to: '/mehr/ueber', label: tMore.more.about, icon: Info, available: true },
];

export function MorePage() {
  return (
    <>
      <PageHeader title={tMore.more.title} />
      <LinkList items={MORE_ITEMS.filter((item) => item.available)} />
    </>
  );
}
