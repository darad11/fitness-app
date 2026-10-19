import { Database, Download, Info, Settings, UserRound } from 'lucide-react';
import { t } from '@/shared/i18n/de';
import { LinkList, PageHeader, type LinkListItem } from '@/shared/ui';

interface MoreItem extends LinkListItem {
  /** Eingeschaltet mit dem Meilenstein, der die Seite liefert (AK-UX-01). */
  available: boolean;
}

const MORE_ITEMS: readonly MoreItem[] = [
  { to: '/mehr/profil', label: t.more.profile, icon: UserRound, available: true },
  { to: '/mehr/einstellungen', label: t.more.settings, icon: Settings, available: true },
  { to: '/mehr/daten', label: t.more.data, icon: Database, available: true },
  { to: '/mehr/installieren', label: t.more.install, icon: Download, available: true },
  { to: '/mehr/ueber', label: t.more.about, icon: Info, available: true },
];

export function MorePage() {
  return (
    <>
      <PageHeader title={t.more.title} />
      <LinkList items={MORE_ITEMS.filter((item) => item.available)} />
    </>
  );
}
