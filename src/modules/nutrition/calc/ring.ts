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

/**
 * Übergang an einer Naht zweier Abschnitte (F6 Abschnitt 2, D-333): etwa 18° Bogen in jeden der
 * beiden Abschnitte, höchstens ein Drittel des kürzeren, damit die Anteile erkennbar bleiben.
 */
export const SEAM_HALF_DEG = 18;
export const SEAM_MAX_SHARE = 1 / 3;
/** Der Übergang besteht aus feinen Schritten von höchstens 1° Bogen. */
export const SEAM_STEP_DEG = 1;

export interface RingArc {
  part: RingPart;
  /** Beginn und Länge in Grad, im Uhrzeigersinn ab 12 Uhr. */
  start: number;
  sweep: number;
}

export interface RingSeam {
  from: RingPart;
  to: RingPart;
  /** Lage der Naht in Grad ab 12 Uhr; beim vollen Ring liegt die letzte bei 360°. */
  at: number;
  /** So weit reicht der Übergang in jeden der beiden Abschnitte, in Grad. */
  half: number;
}

export interface RingGeometry {
  arcs: RingArc[];
  seams: RingSeam[];
  /** Runde Enden am Anfang und am Ende des Bogens; beim vollen Ring keine. */
  caps: { part: RingPart; deg: number }[];
}

/**
 * Lage der Abschnitte, Nähte und runden Enden. Der Übergang liegt symmetrisch um die Naht, so
 * bleibt die sichtbare Grenze an der richtigen Stelle; beim vollen Ring (über dem Ziel) auch vom
 * letzten zum ersten Abschnitt, dann ohne Enden.
 */
export function ringGeometry(model: MacroRingModel): RingGeometry {
  const full = model.fill >= 1;
  const arcs: RingArc[] = [];
  let at = 0;
  for (const { part, share } of model.segments) {
    const sweep = model.fill * 360 * share;
    arcs.push({ part, start: at, sweep });
    at += sweep;
  }
  const seams = arcs.flatMap((a, i): RingSeam[] => {
    const b = arcs[i + 1] ?? (full && arcs.length > 1 ? arcs[0] : undefined);
    if (!b) return [];
    const half = Math.min(SEAM_HALF_DEG, a.sweep * SEAM_MAX_SHARE, b.sweep * SEAM_MAX_SHARE);
    return [{ from: a.part, to: b.part, at: a.start + a.sweep, half }];
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
  return { arcs, seams, caps };
}

/**
 * Feine Schritte eines Übergangs: gleich lange Bögen von höchstens `SEAM_STEP_DEG`, je mit dem
 * Anteil `t` des zweiten Abschnitts an der Mischfarbe (0 bis 1, gemessen in der Mitte des Schritts).
 */
export function seamSteps(seam: RingSeam): { start: number; end: number; t: number }[] {
  const width = 2 * seam.half;
  if (width <= 0) return [];
  const count = Math.max(1, Math.ceil(width / SEAM_STEP_DEG - 1e-9));
  const step = width / count;
  const begin = seam.at - seam.half;
  return Array.from({ length: count }, (_, k) => ({
    start: begin + k * step,
    end: begin + (k + 1) * step,
    t: (k + 0.5) / count,
  }));
}
