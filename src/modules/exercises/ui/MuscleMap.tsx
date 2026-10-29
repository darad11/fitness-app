import { useMemo } from 'react';
import { t } from '@/shared/i18n/de';
import { tExerciseMedia } from '@/shared/i18n/de-exercise-media';
import type { Muscle } from '../model/exercise';
import { MUSCLE_MAP_VIEWS, type MuscleMapView } from './muscleMapPaths';
import './muscle-map.css';

/**
 * Muskelkarte im Reiter „Muskeln“ der Übungsdetails (D-401): Vorder- und Rückansicht, Hauptmuskeln
 * in Lime, mitarbeitende Muskeln in Lime mit geringer Deckkraft, der übrige Körper in Grautönen
 * auf der Fläche der Karte, ohne Leuchten. Die Karte selbst ist für Screenreader stumm; die
 * Muskeln stehen als Text daneben (Liste im Reiter und eine Zeile hier).
 */

type Region = string;

/** Bereiche der Vorlage je Muskel der App. Ganzkörper färbt alle Muskeln. */
const REGIONS: Record<Exclude<Muscle, 'full_body'>, { front: Region[]; back: Region[] }> = {
  chest: { front: ['chest'], back: [] },
  lats: { front: [], back: ['upper-back'] },
  upper_back: { front: [], back: ['upper-back'] },
  traps: { front: ['trapezius'], back: ['trapezius'] },
  lower_back: { front: [], back: ['lower-back'] },
  front_delts: { front: ['deltoids'], back: [] },
  side_delts: { front: ['deltoids'], back: ['deltoids'] },
  rear_delts: { front: [], back: ['deltoids'] },
  biceps: { front: ['biceps'], back: [] },
  triceps: { front: ['triceps'], back: ['triceps'] },
  forearms: { front: ['forearm'], back: ['forearm'] },
  abs: { front: ['abs'], back: [] },
  obliques: { front: ['obliques'], back: [] },
  glutes: { front: [], back: ['gluteal'] },
  quads: { front: ['quadriceps'], back: [] },
  hamstrings: { front: [], back: ['hamstring'] },
  adductors: { front: ['adductors'], back: ['adductors'] },
  // Die Vorlage hat keine eigenen Abduktoren; der mittlere Gesäßmuskel liegt im Bereich „gluteal“.
  abductors: { front: [], back: ['gluteal'] },
  calves: { front: ['calves'], back: ['calves'] },
};

/** Teile ohne Muskel der App: Kopf, Hände, Füße, Gelenke. Etwas dunkler als die Muskeln. */
const NOT_MUSCLE = new Set(['head', 'neck', 'hands', 'feet', 'ankles', 'knees']);

export type MuscleLevel = 'primary' | 'secondary';

/** Bereiche einer Ansicht mit ihrer Stufe; Hauptmuskeln gehen vor. */
export function muscleRegions(
  primary: readonly Muscle[],
  secondary: readonly Muscle[],
  side: 'front' | 'back',
): Map<Region, MuscleLevel> {
  const result = new Map<Region, MuscleLevel>();
  const all = (list: readonly Muscle[]) =>
    list.includes('full_body')
      ? Object.values(REGIONS).flatMap((regions) => regions[side])
      : list.flatMap((muscle) => (muscle === 'full_body' ? [] : REGIONS[muscle][side]));
  for (const region of all(secondary)) result.set(region, 'secondary');
  for (const region of all(primary)) result.set(region, 'primary');
  return result;
}

function View({
  view,
  levels,
  label,
}: {
  view: MuscleMapView;
  levels: Map<Region, MuscleLevel>;
  label: string;
}) {
  return (
    <figure className="muscle-map-view">
      <svg viewBox={view.viewBox} aria-hidden="true" focusable="false">
        {view.parts.map(([region, paths]) => {
          const level = levels.get(region);
          const fill = level
            ? 'var(--accent)'
            : NOT_MUSCLE.has(region)
              ? 'var(--tile-border)'
              : 'var(--fg-faint)';
          return (
            <g
              key={region}
              data-region={region}
              data-level={level ?? 'none'}
              fill={fill}
              fillOpacity={level === 'secondary' ? 0.35 : 1}
            >
              {paths.map((d) => (
                <path key={d.slice(0, 24)} d={d} />
              ))}
            </g>
          );
        })}
        <path
          d={view.outline}
          fill="none"
          stroke="var(--border-input)"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <figcaption className="text-caption text-muted">{label}</figcaption>
    </figure>
  );
}

export function MuscleMap({
  primary,
  secondary,
}: {
  primary: readonly Muscle[];
  secondary: readonly Muscle[];
}) {
  // Je Übung einmal berechnet. Nebenbei hält der Import aus `react` die Aufteilung der Startdateien
  // wie vorher: Ein nachgeladener Teil nur mit JSX trennte `react` von `jsx-runtime` (+0,4 KB).
  const front = useMemo(() => muscleRegions(primary, secondary, 'front'), [primary, secondary]);
  const back = useMemo(() => muscleRegions(primary, secondary, 'back'), [primary, secondary]);
  const names = (list: readonly Muscle[]) =>
    list.map((muscle) => t.exercises.muscles[muscle]).join(', ');
  const text = [
    `${t.session.info.primary}: ${names(primary)}`,
    secondary.length > 0 ? `${t.session.info.secondary}: ${names(secondary)}` : null,
  ]
    .filter(Boolean)
    .join('. ');
  return (
    <div
      data-muscle-map=""
      className="mb-4"
      role="img"
      aria-label={tExerciseMedia.muscleMapLabel(text)}
    >
      <div className="grid grid-cols-2 gap-3">
        <View view={MUSCLE_MAP_VIEWS.front} levels={front} label={tExerciseMedia.muscleMapFront} />
        <View view={MUSCLE_MAP_VIEWS.back} levels={back} label={tExerciseMedia.muscleMapBack} />
      </div>
      <p aria-hidden="true" className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-caption text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="muscle-map-dot size-3 rounded-full bg-accent" />
          {t.session.info.primary}
        </span>
        {secondary.length > 0 ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="muscle-map-dot is-secondary size-3 rounded-full bg-accent" />
            {t.session.info.secondary}
          </span>
        ) : null}
      </p>
    </div>
  );
}
