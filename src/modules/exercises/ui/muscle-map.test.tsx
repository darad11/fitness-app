// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MuscleMap, muscleRegions } from './MuscleMap';

/** Stufe je Bereich in einer Ansicht der gezeichneten Karte. */
function levels(container: HTMLElement, side: 0 | 1): Record<string, string | null> {
  const svg = container.querySelectorAll('svg')[side];
  const result: Record<string, string | null> = {};
  for (const g of svg?.querySelectorAll('g[data-region]') ?? []) {
    result[g.getAttribute('data-region') ?? ''] = g.getAttribute('data-level');
  }
  return result;
}

afterEach(cleanup);

describe('Muskelkarte (D-401)', () => {
  it('Bankdrücken: Brust vorne Lime, Trizeps und vordere Schulter mitarbeitend, Rücken grau', () => {
    const { container } = render(
      <MuscleMap primary={['chest']} secondary={['triceps', 'front_delts']} />,
    );
    const front = levels(container, 0);
    const back = levels(container, 1);
    expect(front.chest).toBe('primary');
    expect(front.triceps).toBe('secondary');
    expect(front.deltoids).toBe('secondary');
    expect(front.quadriceps).toBe('none');
    expect(back.triceps).toBe('secondary');
    expect(back['upper-back']).toBe('none');
    expect(back.gluteal).toBe('none');
    // Lime voll für Haupt-, mit geringer Deckkraft für Nebenmuskeln, kein Leuchten.
    const chest = container.querySelector('g[data-region="chest"]');
    expect(chest?.getAttribute('fill')).toBe('var(--accent)');
    expect(chest?.getAttribute('fill-opacity')).toBe('1');
    expect(container.querySelector('g[data-region="triceps"]')?.getAttribute('fill-opacity')).toBe(
      '0.35',
    );
    expect(container.querySelector('filter')).toBeNull();
    expect(
      screen.getByRole('img', {
        name: 'Muskelkarte. Hauptmuskeln: Brust. Nebenmuskeln: Trizeps, Vordere Schulter',
      }),
    ).toBeInTheDocument();
  });

  it('Kniebeuge: Oberschenkel vorne und Gesäß hinten Lime, Adduktoren und unterer Rücken mitarbeitend', () => {
    const { container } = render(
      <MuscleMap primary={['quads', 'glutes']} secondary={['adductors', 'lower_back']} />,
    );
    const front = levels(container, 0);
    const back = levels(container, 1);
    expect(front.quadriceps).toBe('primary');
    expect(front.chest).toBe('none');
    expect(front.adductors).toBe('secondary');
    expect(back.gluteal).toBe('primary');
    expect(back['lower-back']).toBe('secondary');
    expect(back.adductors).toBe('secondary');
    expect(back.hamstring).toBe('none');
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe(
      'Muskelkarte. Hauptmuskeln: Oberschenkel vorne, Gesäß. Nebenmuskeln: Adduktoren, Unterer Rücken',
    );
  });

  it('Hauptmuskel geht vor, Ganzkörper färbt alle Muskeln, Kopf und Hände bleiben grau', () => {
    expect(muscleRegions(['lats'], ['upper_back'], 'back').get('upper-back')).toBe('primary');
    const all = muscleRegions(['full_body'], [], 'front');
    expect(all.get('chest')).toBe('primary');
    expect(all.get('quadriceps')).toBe('primary');
    expect(all.has('head')).toBe(false);
    expect(all.has('hands')).toBe(false);
  });
});
