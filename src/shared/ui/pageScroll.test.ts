// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { holdOwnPosition, ownPositionHeld, PAGE_SCROLLER_ID } from './pageScroll';

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
  it('schaltet die Scroll-Verankerung im Rahmen aus, bis die letzte Seite freigibt', () => {
    const page = frame();
    expect(ownPositionHeld()).toBe(false);
    const first = holdOwnPosition();
    const second = holdOwnPosition();
    expect(ownPositionHeld()).toBe(true);
    expect(page.style.getPropertyValue('overflow-anchor')).toBe('none');
    first();
    first();
    expect(ownPositionHeld()).toBe(true);
    expect(page.style.getPropertyValue('overflow-anchor')).toBe('none');
    second();
    expect(ownPositionHeld()).toBe(false);
    expect(page.style.getPropertyValue('overflow-anchor')).toBe('');
  });

  it('kommt ohne Rahmen aus', () => {
    const release = holdOwnPosition();
    expect(ownPositionHeld()).toBe(true);
    release();
    expect(ownPositionHeld()).toBe(false);
  });
});
