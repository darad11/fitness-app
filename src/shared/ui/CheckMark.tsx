import { Check } from 'lucide-react';
import { cn } from '../lib/cn';

/**
 * Erledigt-Markierung in Listen (F5, D-325): Kreis 20 px, Haken 14 px. Die Tippfläche ist die
 * ganze Zeile (ein `<label>` mit mindestens 44 px Höhe), nicht der Kreis. Steht direkt hinter
 * einem nativen, unsichtbaren Kontrollkästchen mit der Klasse `peer`; dessen Tastaturfokus zeigt
 * der Kreis.
 */
export function CheckMark({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-5 shrink-0 items-center justify-center rounded-pill border-2 transition-colors duration-120 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus',
        checked ? 'border-success bg-success text-on-accent' : 'border-line-input bg-surface',
      )}
    >
      {checked ? <Check className="size-3.5" strokeWidth={3} /> : null}
    </span>
  );
}
