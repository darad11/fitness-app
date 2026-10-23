/**
 * Ring der gegessenen Kalorien mit Abschnitten nach Makros (F5 Abschnitt 5.1, D-326).
 *
 * Der Bogen zeigt die gegessenen kcal im Verhältnis zum Tagesziel (über dem Ziel voll). Er ist
 * nacheinander in Eiweiß, Kohlenhydrate und Fett geteilt, jeder Abschnitt so lang wie sein
 * Kalorienanteil (4 kcal je g Eiweiß und Kohlenhydrate, 9 kcal je g Fett). Kalorien ohne Makro
 * (z. B. Schnelleinträge nur mit kcal) bekommen ab 5 % der gegessenen kcal einen eigenen, letzten
 * Abschnitt; kleinere Unterschiede (Rundung, Angaben der Hersteller) verteilen sich anteilig auf
 * die Makros. Rechnet nur mit den Tagessummen aus `sumEntries`, nichts doppelt.
 */

export type RingPart = 'protein' | 'carbs' | 'fat' | 'other';

export const KCAL_PER_GRAM = { protein: 4, carbs: 4, fat: 9 } as const;

/** Ab diesem Anteil an den gegessenen kcal erscheinen nicht zugeordnete kcal als Abschnitt. */
export const OTHER_MIN_SHARE = 0.05;

export interface RingSegment {
  part: RingPart;
  /** Anteil am gegessenen Bogen; alle Anteile zusammen ergeben 1. */
  share: number;
}

export interface MacroRingModel {
  /** Gegessene kcal und Tagesziel. */
  eaten: number;
  target: number;
  /** Gefüllter Teil des Kreises von 0 bis 1; über dem Ziel 1. */
  fill: number;
  /** Abschnitte in der Reihenfolge Eiweiß, Kohlenhydrate, Fett, nicht zugeordnet; ohne leere. */
  segments: RingSegment[];
  /** kcal je Makro (Gramm mal 4 bzw. 9) und die nicht zugeordneten, wenn sie einen Abschnitt haben. */
  kcal: Record<RingPart, number>;
  /** kcal bis zum Ziel bzw. darüber; je eines ist 0. */
  remaining: number;
  over: number;
}

export function macroRing(
  sums: { kcal: number; protein: number; carbs: number; fat: number },
  target: number,
): MacroRingModel {
  const eaten = Math.max(0, sums.kcal);
  const macro = {
    protein: Math.max(0, sums.protein) * KCAL_PER_GRAM.protein,
    carbs: Math.max(0, sums.carbs) * KCAL_PER_GRAM.carbs,
    fat: Math.max(0, sums.fat) * KCAL_PER_GRAM.fat,
  };
  const assigned = macro.protein + macro.carbs + macro.fat;
  const rest = eaten - assigned;
  const withOther = eaten > 0 && rest >= OTHER_MIN_SHARE * eaten;
  const parts: [RingPart, number][] =
    eaten <= 0
      ? []
      : withOther
        ? [
            ['protein', macro.protein / eaten],
            ['carbs', macro.carbs / eaten],
            ['fat', macro.fat / eaten],
            ['other', rest / eaten],
          ]
        : [
            ['protein', macro.protein / assigned],
            ['carbs', macro.carbs / assigned],
            ['fat', macro.fat / assigned],
          ];
  return {
    eaten,
    target,
    fill: target > 0 ? Math.min(1, eaten / target) : 0,
    segments: parts.filter(([, share]) => share > 0).map(([part, share]) => ({ part, share })),
    kcal: { ...macro, other: withOther ? rest : 0 },
    remaining: Math.max(0, target - eaten),
    over: Math.max(0, eaten - target),
  };
}
