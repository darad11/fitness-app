import { useId, type ReactNode } from 'react';
import { tNutrition } from '@/shared/i18n/de-nutrition';
import { cn } from '@/shared/lib/cn';
import type { Formatters } from '@/shared/lib/format';
import type { MacroRingModel, RingPart } from '../calc/ring';
import { kcal } from './format';

/** Farben der Abschnitte: Lime, Grün dunkel, Orange, Grau (Tokens, Kontrast in tokens.test.ts). */
export const RING_COLORS: Record<RingPart, string> = {
  protein: 'var(--macro-protein)',
  carbs: 'var(--macro-carbs)',
  fat: 'var(--macro-fat)',
  other: 'var(--macro-other)',
};

/** Übergang zwischen zwei Abschnitten: etwa 3° Bogen, kurz genug gegen trübe Mischtöne. */
const BLEND_DEG = 3;
/** Rechnen in einem festen Koordinatensystem (100 Einheiten), dargestellt in `size` rem. */
const BOX = 100;

interface Arc {
  part: RingPart;
  /** Beginn und Länge in Grad, im Uhrzeigersinn ab 12 Uhr. */
  start: number;
  sweep: number;
}

/** Punkt auf dem Kreis; 0° liegt vor der Drehung des SVG bei 3 Uhr, danach bei 12 Uhr. */
function point(deg: number, radius: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: BOX / 2 + radius * Math.cos(rad), y: BOX / 2 + radius * Math.sin(rad) };
}

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
 * Kalorien-Ring mit Makros (F5, D-326; ersetzt den einfarbigen Ring aus D-314): Der Bogen zeigt
 * die gegessenen kcal im Verhältnis zum Tagesziel, geteilt in Eiweiß, Kohlenhydrate, Fett und
 * gegebenenfalls nicht zugeordnete kcal (`macroRing`). Zwischen zwei Abschnitten ein kurzer
 * Verlauf, runde Enden, der Rest der Spur in `--meter-track` (card-2). Über dem Ziel voll, ohne
 * Warnfarbe. Eine Komponente für die Ernährungsseite und „Heute“; `label` liest VoiceOver vor.
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
  const id = useId();
  const width = (stroke / (size * 16)) * BOX;
  const radius = (BOX - width) / 2;
  const circumference = 2 * Math.PI * radius;
  const full = model.fill >= 1;

  const arcs: Arc[] = [];
  let at = 0;
  for (const { part, share } of model.segments) {
    const sweep = model.fill * 360 * share;
    arcs.push({ part, start: at, sweep });
    at += sweep;
  }
  // Übergänge an jeder Grenze; beim vollen Ring auch vom letzten zum ersten Abschnitt.
  const blends = arcs.flatMap((a, i) => {
    const b = arcs[i + 1] ?? (full && arcs.length > 1 ? arcs[0] : undefined);
    if (!b) return [];
    const half = Math.min(BLEND_DEG / 2, a.sweep / 2, b.sweep / 2);
    const edge = a.start + a.sweep;
    return [{ from: a.part, to: b.part, start: edge - half, end: edge + half }];
  });
  const first = arcs[0];
  const last = arcs[arcs.length - 1];
  const caps =
    first && last && !full
      ? [
          { part: first.part, deg: 0 },
          { part: last.part, deg: last.start + last.sweep },
        ]
      : [];

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
        <defs>
          {blends.map((blend, i) => {
            const from = point(blend.start, radius);
            const to = point(blend.end, radius);
            return (
              <linearGradient
                key={`${blend.from}-${blend.to}`}
                id={`${id}-verlauf-${String(i)}`}
                gradientUnits="userSpaceOnUse"
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
              >
                <stop offset="0" style={{ stopColor: RING_COLORS[blend.from] }} />
                <stop offset="1" style={{ stopColor: RING_COLORS[blend.to] }} />
              </linearGradient>
            );
          })}
        </defs>
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
        {blends.map((blend, i) => {
          const from = point(blend.start, radius);
          const to = point(blend.end, radius);
          return (
            <path
              key={`${blend.from}-${blend.to}`}
              data-blend={`${blend.from}-${blend.to}`}
              d={`M ${String(from.x)} ${String(from.y)} A ${String(radius)} ${String(radius)} 0 0 1 ${String(to.x)} ${String(to.y)}`}
              fill="none"
              strokeWidth={width}
              stroke={`url(#${id}-verlauf-${String(i)})`}
            />
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
