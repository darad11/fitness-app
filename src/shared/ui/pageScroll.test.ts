// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import {
  holdOwnPosition,
  ownPositionHeld,
  PAGE_SCROLLER_ID,
  suspendScrollAnchoring,
} from './pageScroll';

afterEach(() => {
  document.body.replaceChildren();
});

function frame(): HTMLElement {
  const element = document.createElement('div');
  element.id = PAGE_SCROLLER_ID;
  document.body.append(element);
  return element;
}

describe('Seite hält ihre Lage selbst (Nachtrag zu D-384)', () => {
  it('gilt, bis die letzte Seite freigibt; doppelte Freigabe zählt nicht', () => {
    expect(ownPositionHeld()).toBe(false);
    const first = holdOwnPosition();
    const second = holdOwnPosition();
    expect(ownPositionHeld()).toBe(true);
    first();
    first();
    expect(ownPositionHeld()).toBe(true);
    second();
    expect(ownPositionHeld()).toBe(false);
  });
});

describe('Scroll-Verankerung aussetzen (Nachtrag zu D-384)', () => {
  it('setzt overflow-anchor im Rahmen aus, bis die letzte Stelle fertig ist', () => {
    const page = frame();
    const first = suspendScrollAnchoring();
    const second = suspendScrollAnchoring();
    expect(page.style.getPropertyValue('overflow-anchor')).toBe('none');
    first();
    first();
    expect(page.style.getPropertyValue('overflow-anchor')).toBe('none');
    second();
    expect(page.style.getPropertyValue('overflow-anchor')).toBe('');
  });
});
