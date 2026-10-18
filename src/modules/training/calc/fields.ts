import type { DistanceUnit, TrackingMode } from '@/modules/exercises';
import type { SetValues } from '../model/session';
import type { ValueField } from './session';

/** Eingabefeld einer Satzzeile; `scale` rechnet die Anzeige in den gespeicherten Wert um. */
export interface FieldSpec {
  field: ValueField;
  /** Schlüssel für Beschriftung und Einheit im Textkatalog. */
  label:
    'weightKg' | 'reps' | 'durationSec' | 'durationMin' | 'distanceM' | 'distanceKm' | 'assistKg';
  scale: number;
  decimals: boolean;
}

const WEIGHT: FieldSpec = { field: 'weightKg', label: 'weightKg', scale: 1, decimals: true };
const REPS: FieldSpec = { field: 'reps', label: 'reps', scale: 1, decimals: false };
const SECONDS: FieldSpec = {
  field: 'durationSec',
  label: 'durationSec',
  scale: 1,
  decimals: false,
};
const MINUTES: FieldSpec = {
  field: 'durationSec',
  label: 'durationMin',
  scale: 60,
  decimals: true,
};
const ASSIST: FieldSpec = { field: 'assistKg', label: 'assistKg', scale: 1, decimals: true };

/** Felder je Erfassungsart (D-241): Cardio in Minuten, Distanz in m oder km. */
export function fieldsFor(mode: TrackingMode, distanceUnit: DistanceUnit = 'km'): FieldSpec[] {
  switch (mode) {
    case 'weight_reps':
      return [WEIGHT, REPS];
    case 'reps':
      return [REPS];
    case 'time':
      return [SECONDS];
    case 'weight_time':
      return [WEIGHT, SECONDS];
    case 'time_distance':
      return [
        MINUTES,
        distanceUnit === 'm'
          ? { field: 'distanceM', label: 'distanceM', scale: 1, decimals: false }
          : { field: 'distanceM', label: 'distanceKm', scale: 1000, decimals: true },
      ];
    case 'assisted_reps':
      return [ASSIST, REPS];
  }
}

/** Gespeicherter Wert aus einer Eingabe in der Anzeigeeinheit; ganze Zahlen, wo verlangt. */
export function toStored(spec: FieldSpec, display: number): number {
  const value = display * spec.scale;
  return spec.field === 'reps' || spec.field === 'durationSec' ? Math.round(value) : value;
}

export function toDisplay(spec: FieldSpec, stored: number): number {
  return stored / spec.scale;
}

/** Kurzform eines Satzes, z. B. „60 × 8", „45 s", „10 min · 2,5 km", „−20 kg × 8". */
export function formatSetValues(
  values: SetValues,
  mode: TrackingMode,
  distanceUnit: DistanceUnit | undefined,
  number: (value: number) => string,
): string {
  const parts = fieldsFor(mode, distanceUnit).map((spec) => {
    const stored = values[spec.field];
    if (stored === undefined) return '–';
    const shown = number(toDisplay(spec, stored));
    switch (spec.label) {
      case 'weightKg':
        return mode === 'weight_reps' ? shown : `${shown} kg`;
      case 'assistKg':
        return `−${shown} kg`;
      case 'reps':
        return mode === 'reps' ? `${shown} Wdh.` : shown;
      case 'durationSec':
        return `${shown} s`;
      case 'durationMin':
        return `${shown} min`;
      case 'distanceM':
        return `${shown} m`;
      case 'distanceKm':
        return `${shown} km`;
    }
  });
  return mode === 'weight_reps' || mode === 'assisted_reps' ? parts.join(' × ') : parts.join(' · ');
}
