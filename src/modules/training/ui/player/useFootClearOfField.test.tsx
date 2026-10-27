// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FOOT_COVERING, useFootClearOfField } from './useFootClearOfField';

/**
 * Fußleiste im Training bei offener Tastatur (D-391): bleibt, solange sie das Feld nicht verdeckt;
 * sonst ist sie aus, bis das Feld wieder frei steht oder die Tastatur zugeht.
 */

function touch(coarse: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: query === '(pointer: coarse)' ? coarse : false,
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })) as unknown as typeof window.matchMedia;
}

/** Fußleiste unten im Fenster (`top` bis `top + 100`) und ein Feld bei `fieldTop` (48 hoch). */
function setup(fieldTop: number, footTop = 500) {
  const foot = document.createElement('div');
  const field = document.createElement('input');
  document.body.append(field, foot);
  let footAt = footTop;
  let fieldAt = fieldTop;
  vi.spyOn(foot, 'getBoundingClientRect').mockImplementation(() =>
    DOMRect.fromRect({ x: 0, y: footAt, width: 400, height: 100 }),
  );
  vi.spyOn(field, 'getBoundingClientRect').mockImplementation(() =>
    DOMRect.fromRect({ x: 20, y: fieldAt, width: 200, height: 48 }),
  );
  const hook = renderHook(() => {
    useFootClearOfField({ current: foot });
  });
  return {
    foot,
    field,
    hook,
    moveFoot: (top: number) => {
      footAt = top;
    },
    moveField: (top: number) => {
      fieldAt = top;
    },
    covering: () => foot.hasAttribute(FOOT_COVERING),
  };
}

beforeEach(() => {
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    callback(0);
    return 0;
  });
  touch(true);
});

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
  Reflect.deleteProperty(window, 'matchMedia');
});

describe('Fußleiste bei offener Tastatur (D-391)', () => {
  it('bleibt, solange das Feld frei darüber steht', () => {
    const { field, covering } = setup(100);
    field.focus();
    expect(covering()).toBe(false);
  });

  it('geht aus, wenn sie nach dem Öffnen der Tastatur über dem Feld läge, und kommt danach wieder', () => {
    const { field, covering, moveFoot } = setup(300);
    field.focus();
    expect(covering()).toBe(false);
    // Tastatur geht auf: Das Fenster wird niedriger, die Leiste rückt über das Feld.
    moveFoot(320);
    window.dispatchEvent(new Event('resize'));
    expect(covering()).toBe(true);
    // Tastatur geht zu: Das Feld verliert den Fokus, die Leiste ist wieder da.
    field.blur();
    expect(covering()).toBe(false);
  });

  it('prüft auch beim Scrollen: Ein Feld unter der Leiste blendet sie aus, frei wieder ein', () => {
    const { field, covering, moveField } = setup(100);
    field.focus();
    moveField(520);
    window.dispatchEvent(new Event('scroll'));
    expect(covering()).toBe(true);
    moveField(200);
    window.dispatchEvent(new Event('scroll'));
    expect(covering()).toBe(false);
  });

  it('am Computer (ohne Touch) bleibt sie immer', () => {
    touch(false);
    const { field, covering } = setup(520);
    field.focus();
    expect(covering()).toBe(false);
  });

  it('Felder in Dialogen liegen über der Leiste; sie bleibt', () => {
    const { covering } = setup(0);
    const dialog = document.createElement('dialog');
    const note = document.createElement('textarea');
    dialog.append(note);
    document.body.append(dialog);
    vi.spyOn(note, 'getBoundingClientRect').mockReturnValue(
      DOMRect.fromRect({ x: 20, y: 520, width: 200, height: 80 }),
    );
    note.focus();
    expect(covering()).toBe(false);
  });

  it('nach dem Verlassen des Trainings ist das Attribut weg', () => {
    const { field, covering, hook } = setup(520);
    field.focus();
    expect(covering()).toBe(true);
    hook.unmount();
    expect(covering()).toBe(false);
  });
});
