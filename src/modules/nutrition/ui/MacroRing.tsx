import type { ReactNode } from 'react';
import { tNutrition } from '@/shared/i18n/de-nutrition';
import { cn } from '@/shared/lib/cn';
import type { Formatters } from '@/shared/lib/format';
import { ringGeometry, seamSteps, type MacroRingModel, type RingPart } from '../calc/ring';
import { kcal } from './format';

/**
 * Farben der Abschnitte (F6, D-333): Eiweiß Türkis, Kohlenhydrate Blau, Fett Violett, eine eigene
 * kühle Familie neben Lime (Lime bleibt Bedienung und Fortschritt); nicht zugeordnete kcal Grau.
 * Dieselben Farben gelten für Balken und Legenden der Makros. Kontrast in tokens.test.ts.
 */
export const RING_COLORS: Record<RingPart, string> = {
  protein: 'var(--macro-protein)',
  carbs: 'var(--macro-carbs)',
  fat: 'var(--macro-fat)',
  other: 'var(--macro-other)',
};

/**
 * Mischfarbe im Übergang (D-333): in OKLab, nicht linear in RGB. Der Farbton wandert gleichmäßig
 * von einem Abschnitt zum nächsten (Türkis über Cyan zu Blau, Blau über Lavendel zu Violett), die
 * Buntheit bleibt erhalten, und alle Mischfarben liegen im darstellbaren Bereich. In OKLCH lag die
 * Mitte zwischen Türkis und Blau außerhalb davon und erschien als greller Cyan-Ton.
 */
export function ringMix(from: RingPart, to: RingPart, t: number): string {
  return `color-mix(in oklab, ${RING_COLORS[to]} ${(t * 100).toFixed(1)}%, ${RING_COLORS[from]})`;
}

/** Jeder feine Schritt reicht etwas in den nächsten, damit keine Kante durchscheint. */
const STEP_OVERLAP_DEG = 0.5;
/** Rechnen in einem festen Koordinatensystem (100 Einheiten), dargestellt in `size` rem. */
const BOX = 100;

/** Punkt auf dem Kreis; 0° liegt vor der Drehung des SVG bei 3 Uhr, danach bei 12 Uhr. */
function point(deg: number, radius: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: BOX / 2 + radius * Math.cos(rad), y: BOX / 2 + radius * Math.sin(rad) };
}

/** Bogen im Uhrzeigersinn, kürzer als ein Halbkreis. */
function arcPath(start: number, end: number, radius: number): string {
  const from = point(start, radius);
  const to = point(end, radius);
  return `M ${String(from.x)} ${String(from.y)} A ${String(radius)} ${String(radius)} 0 0 1 ${String(to.x)} ${String(to.y)}`;
}

const deg3 = (value: number) => String(Number(value.toFixed(3)));

/** „732 von 2.390 kcal, davon Eiweiß 184, Kohlenhydrate 68, Fett 459“ für VoiceOver. */
export function ringLabel(fmt: Formatters, model: MacroRingModel): string {
  const head = tNutrition.ringLabel(kcal(fmt, model.eaten), kcal(fmt, model.target));
  if (model.segments.length === 0) return head;
  const parts = (['protein', 'carbs', 'fat'] as const).map(
    (macro) => `${tNutrition.macros[macro]} ${kcal(fmt, model.kcal[macro])}`,
  );
  if (model.kcal.other > 0) parts.push(`${tNutrition.ringOther} ${kcal(fmt, model.kcal.other)}`);
  return `${head}, ${tNutrition.ringParts(parts.join(', '))}`;
}

/**
 * Kalorien-Ring mit Makros (F5, D-326; Farben und Übergänge F6, D-333): Der Bogen zeigt die
 * gegessenen kcal im Verhältnis zum Tagesziel, geteilt in Eiweiß, Kohlenhydrate, Fett und
 * gegebenenfalls nicht zugeordnete kcal (`macroRing`). An jeder Naht ein weicher Übergang aus
 * feinen Schritten (`ringGeometry`, `seamSteps`, `ringMix`), runde Enden, der Rest der Spur
 * in `--meter-track` (card-2). Über dem Ziel voll, ohne Warnfarbe. Eine Komponente für die
 * Ernährungsseite und „Heute“; `label` liest VoiceOver vor.
 */
export function MacroRing({
  model,
  label,
  size = 8.25,
  stroke = 10,
  className,
  children,
}: {
  model: MacroRingModel;
  label: string;
  /** Durchmesser in rem. */
  size?: number;
  /** Strichstärke in px. */
  stroke?: number;
  className?: string;
  children?: ReactNode;
}) {
  const width = (stroke / (size * 16)) * BOX;
  const radius = (BOX - width) / 2;
  const circumference = 2 * Math.PI * radius;
  const { arcs, seams, caps } = ringGeometry(model);

  return (
    <div
      role="img"
      aria-label={label}
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: `${String(size)}rem`, height: `${String(size)}rem` }}
    >
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${String(BOX)} ${String(BOX)}`}
        className="absolute inset-0 size-full -rotate-90"
      >
        <circle
          cx={BOX / 2}
          cy={BOX / 2}
          r={radius}
          fill="none"
          strokeWidth={width}
          className="stroke-meter-track"
        />
        {arcs.map((arc) => (
          <circle
            key={arc.part}
            data-part={arc.part}
            cx={BOX / 2}
            cy={BOX / 2}
            r={radius}
            fill="none"
            strokeWidth={width}
            strokeDasharray={`${String((arc.sweep / 360) * circumference)} ${String(circumference)}`}
            strokeDashoffset={-(arc.start / 360) * circumference}
            style={{ stroke: RING_COLORS[arc.part] }}
          />
        ))}
        {seams.map((seam) => {
          const steps = seamSteps(seam);
          return (
            <g
              key={`${seam.from}-${seam.to}`}
              data-blend={`${seam.from}-${seam.to}`}
              data-start={deg3(seam.at - seam.half)}
              data-end={deg3(seam.at + seam.half)}
              fill="none"
              strokeWidth={width}
            >
              {steps.map((step, k) => (
                <path
                  key={step.start}
                  d={arcPath(
                    step.start,
                    k < steps.length - 1 ? step.end + STEP_OVERLAP_DEG : step.end,
                    radius,
                  )}
                  style={{ stroke: ringMix(seam.from, seam.to, step.t) }}
                />
              ))}
            </g>
          );
        })}
        {caps.map((cap) => {
          const p = point(cap.deg, radius);
          return (
            <circle
              key={cap.deg}
              data-cap={cap.part}
              cx={p.x}
              cy={p.y}
              r={width / 2}
              style={{ fill: RING_COLORS[cap.part] }}
            />
          );
        })}
      </svg>
      {children ? (
        <div className="relative flex flex-col items-center text-center leading-tight">
          {children}
        </div>
      ) : null}
    </div>
  );
}
