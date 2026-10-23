// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createFormatters } from '@/shared/lib/format';
import { macroRing } from '../calc/ring';
import { MacroRing, ringLabel } from './MacroRing';

// de-DE: Tausenderpunkt („2.390“); de-AT trennt mit einem schmalen Leerzeichen.
const fmt = createFormatters('de-DE', 'Europe/Berlin');

function draw(sums: { kcal: number; protein: number; carbs: number; fat: number }, target = 2390) {
  const model = macroRing(sums, target);
  const { container } = render(
    <MacroRing model={model} label={ringLabel(fmt, model)} size={10} stroke={12}>
      <span>Mitte</span>
    </MacroRing>,
  );
  const svg = container.querySelector('svg');
  if (!svg) throw new Error('SVG fehlt');
  const circle = (part: string) =>
    svg.querySelector<SVGCircleElement>(`circle[data-part="${part}"]`);
  return {
    model,
    svg,
    parts: [...svg.querySelectorAll('circle[data-part]')].map((c) => c.getAttribute('data-part')),
    blends: [...svg.querySelectorAll('[data-blend]')].map((g) => g.getAttribute('data-blend')),
    caps: [...svg.querySelectorAll('circle[data-cap]')].map((c) => c.getAttribute('data-cap')),
    circle,
    /** Länge eines Abschnitts als Anteil am Umfang. */
    length: (part: string) => {
      const [dash = 0, gap = 1] = (circle(part)?.getAttribute('stroke-dasharray') ?? '')
        .split(' ')
        .map(Number);
      return dash / gap;
    },
  };
}

describe('Ring mit Makros (D-326)', () => {
  afterEach(cleanup);

  it('Abschnitte nach Kalorienanteil in Eiweiß, Kohlenhydrate, Fett; Übergänge und runde Enden', () => {
    const ring = draw({ kcal: 732, protein: 46, carbs: 17, fat: 51 });
    expect(ring.parts).toEqual(['protein', 'carbs', 'fat']);
    expect(ring.blends).toEqual(['protein-carbs', 'carbs-fat']);
    expect(ring.caps).toEqual(['protein', 'fat']);
    // Zusammen so lang wie 732 von 2.390 kcal, je Abschnitt nach seinem Anteil.
    const total = ring.length('protein') + ring.length('carbs') + ring.length('fat');
    expect(total).toBeCloseTo(732 / 2390, 6);
    expect(ring.length('fat') / total).toBeCloseTo(459 / 711, 6);
    expect(ring.circle('protein')?.style.stroke).toBe('var(--macro-protein)');
    expect(ring.circle('carbs')?.style.stroke).toBe('var(--macro-carbs)');
    expect(ring.circle('fat')?.style.stroke).toBe('var(--macro-fat)');
    expect(
      screen.getByRole('img', {
        name: '732 von 2.390 kcal, davon Eiweiß 184, Kohlenhydrate 68, Fett 459',
      }),
    ).toBeTruthy();
    expect(screen.getByText('Mitte')).toBeTruthy();
  });

  it('kcal ohne Makro ab 5 % als letzter, grauer Abschnitt, auch im Vorlesetext', () => {
    const ring = draw({ kcal: 1000, protein: 50, carbs: 50, fat: 22.2222 }, 2000);
    expect(ring.parts).toEqual(['protein', 'carbs', 'fat', 'other']);
    expect(ring.circle('other')?.style.stroke).toBe('var(--macro-other)');
    expect(ring.caps).toEqual(['protein', 'other']);
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe(
      '1.000 von 2.000 kcal, davon Eiweiß 200, Kohlenhydrate 200, Fett 200, nicht zugeordnet 400',
    );
  });

  it('bei 0 kcal nur die Spur, ohne Enden und Übergänge', () => {
    const ring = draw({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
    expect(ring.parts).toEqual([]);
    expect(ring.blends).toEqual([]);
    expect(ring.caps).toEqual([]);
    expect(ring.svg.querySelectorAll('circle')).toHaveLength(1);
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('0 von 2.390 kcal');
  });

  it('über dem Ziel voll: ohne Enden, mit Übergang vom letzten zum ersten Abschnitt', () => {
    const ring = draw({ kcal: 2600, protein: 150, carbs: 300, fat: 88.889 });
    expect(ring.model.over).toBe(210);
    expect(ring.caps).toEqual([]);
    expect(ring.blends).toEqual(['protein-carbs', 'carbs-fat', 'fat-protein']);
    const total = ring.length('protein') + ring.length('carbs') + ring.length('fat');
    expect(total).toBeCloseTo(1, 6);
  });

  it('Übergang aus feinen Schritten über 2 × 18°, Mischfarben in OKLab (F6, D-333)', () => {
    // 600 kcal von 1.000 zu gleichen Teilen: Abschnitte von 72°, Nähte bei 72° und 144°.
    const ring = draw({ kcal: 600, protein: 50, carbs: 50, fat: 22.2222 }, 1000);
    const blend = ring.svg.querySelector('[data-blend="protein-carbs"]');
    expect([blend?.getAttribute('data-start'), blend?.getAttribute('data-end')]).toEqual([
      '54',
      '90',
    ]);
    const steps = [...(blend?.querySelectorAll('path') ?? [])];
    expect(steps).toHaveLength(36);
    expect(steps[0]?.style.stroke).toBe(
      'color-mix(in oklab, var(--macro-carbs) 1.4%, var(--macro-protein))',
    );
    expect(steps[35]?.style.stroke).toBe(
      'color-mix(in oklab, var(--macro-carbs) 98.6%, var(--macro-protein))',
    );
    // Keine Verläufe in RGB mehr.
    expect(ring.svg.querySelectorAll('linearGradient')).toHaveLength(0);
  });

  it('ein einziger Abschnitt: runde Enden in seiner Farbe, kein Übergang', () => {
    const ring = draw({ kcal: 400, protein: 0, carbs: 100, fat: 0 });
    expect(ring.parts).toEqual(['carbs']);
    expect(ring.blends).toEqual([]);
    expect(ring.caps).toEqual(['carbs', 'carbs']);
  });
});
