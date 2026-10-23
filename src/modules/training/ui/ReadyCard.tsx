import { Play, TriangleAlert } from 'lucide-react';
import { t } from '@/shared/i18n/de';
import { Button, ButtonLink, Card } from '@/shared/ui';

/**
 * Oberste Karte auf „Heute“ und „Training“, wenn kein Training läuft und kein Programm aktiv ist
 * (F5, D-324; Variante V2c aus F6, D-336): deckend grüne Fläche mit 1-px-Rand, Label „Training“
 * und Text in hellem Grüngrau, die Frage als Titel in `--fg`, der Primärknopf weiß mit Schrift in
 * Nacht und Play-Symbol über die ganze Breite (Radius 14), darunter der Textlink „Vorlage wählen“
 * halbfett in `--fg`. Kein Lime auf der Karte.
 */
export function ReadyCard({
  busy,
  onStartFree,
  className,
  error,
}: {
  busy: boolean;
  onStartFree: () => void;
  className?: string;
  /** Fehler beim Start; in der hellen Schrift der Karte mit Symbol (Rot hätte hier nur 3,7:1). */
  error?: string;
}) {
  return (
    <Card
      tone="tint"
      eyebrow={t.training.readyEyebrow}
      title={t.training.readyTitle}
      className={className}
    >
      <p className="-mt-1 max-w-md text-stage-tint-muted">{t.training.readyText}</p>
      <Button
        variant="onTint"
        size="lg"
        className="mt-5 w-full"
        disabled={busy}
        onClick={onStartFree}
      >
        <Play aria-hidden="true" className="size-5" />
        {t.training.startFree}
      </Button>
      <div className="mt-2">
        <ButtonLink to="/training/programme" variant="tintLink" className="-ml-5">
          {t.training.chooseTemplate}
        </ButtonLink>
      </div>
      {error ? (
        <p role="alert" className="mt-3 flex items-start gap-2 text-sm font-semibold">
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : null}
    </Card>
  );
}
