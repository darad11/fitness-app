import { Play } from 'lucide-react';
import type { ReactNode } from 'react';
import { t } from '@/shared/i18n/de';
import { Button, ButtonLink, Card } from '@/shared/ui';

/**
 * Oberste Karte auf „Heute“ und „Training“, wenn kein Training läuft und kein Programm aktiv ist
 * (F5, D-324; die Karte der bisherigen App in FORM-Gestaltung): Bühne mit Label „Training“, die
 * Frage als Titel wie bei „Heute geplant“, Primärknopf „Freies Training starten“ über die ganze
 * Breite und darunter der Textlink „Vorlage wählen“ zu „Programme und Vorlagen“.
 */
export function ReadyCard({
  busy,
  onStartFree,
  className,
  children,
}: {
  busy: boolean;
  onStartFree: () => void;
  className?: string;
  /** Zum Beispiel ein Fehlerhinweis des Starts. */
  children?: ReactNode;
}) {
  return (
    <Card
      tone="stage"
      eyebrow={t.training.readyEyebrow}
      title={t.training.readyTitle}
      className={className}
    >
      <p className="-mt-1 max-w-md text-muted">{t.training.readyText}</p>
      <Button size="lg" className="mt-5 w-full" disabled={busy} onClick={onStartFree}>
        <Play aria-hidden="true" className="size-5" />
        {t.training.startFree}
      </Button>
      <div className="mt-2">
        <ButtonLink to="/training/programme" variant="quiet" className="-ml-5">
          {t.training.chooseTemplate}
        </ButtonLink>
      </div>
      {children}
    </Card>
  );
}
