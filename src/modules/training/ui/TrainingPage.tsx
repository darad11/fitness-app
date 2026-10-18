import { ClipboardList, ListChecks } from 'lucide-react';
import { t } from '@/shared/i18n/de';
import { LinkList, PageHeader, type LinkListItem } from '@/shared/ui';

/**
 * Training (S-03). Einstiege erscheinen erst, wenn ihr Bereich fertig ist (AK-UX-01);
 * Starten, Programme und Verlauf folgen mit den weiteren Arbeitspaketen von M1.
 */
const ENTRIES: readonly LinkListItem[] = [
  { to: '/training/programme', label: t.training.programs, icon: ClipboardList },
  { to: '/uebungen', label: t.training.exercises, icon: ListChecks },
];

export function TrainingPage() {
  return (
    <>
      <PageHeader title={t.training.title} />
      <LinkList items={ENTRIES} />
    </>
  );
}
