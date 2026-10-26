// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  isTextEntry,
  PAGE_SCROLLER_ID,
  releaseRoom,
  revealField,
  setKeyboardBars,
  TEXT_ENTRY_SELECTOR,
  typing,
} from '@/shared/ui/pageScroll';
import styles from './styles.css?raw';

/**
 * Bildschirmtastatur (D-391): Felder, an denen sie aufgeht, die Regeln für Tab-Leiste, Kreis,
 * Fußleiste und Platz unten in `styles.css` und das Zeigen eines angetippten Feldes.
 */

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
  Reflect.deleteProperty(window, 'matchMedia');
});

/** Ohne Leerzeichen und mit einheitlichen Anführungszeichen, damit CSS und TS vergleichbar sind. */
const squash = (text: string) => text.replace(/\s+/g, '').replaceAll("'", '"');

function touch(coarse: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: query === '(pointer: coarse)' ? coarse : false,
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })) as unknown as typeof window.matchMedia;
}

describe('Felder mit Tastatur (D-391)', () => {
  it('Textfelder, Zahlen, Suche, Textbereiche und Auswahlen zählen, Schalter und Knöpfe nicht', () => {
    document.body.innerHTML = `
      <input id="text"><input id="zahl" type="number" inputmode="decimal"><input id="suche" type="search">
      <input id="mail" type="email"><input id="pw" type="password"><input id="datum" type="date">
      <textarea id="notiz"></textarea><select id="einheit"></select><div id="frei" contenteditable="true"></div>
      <input id="haken" type="checkbox"><input id="radio" type="radio"><input id="regler" type="range">
      <input id="knopf" type="button"><input id="senden" type="submit"><input id="datei" type="file">
      <button id="button"></button><div id="aus" contenteditable="false"></div>`;
    const entry = (id: string) => isTextEntry(document.getElementById(id));
    for (const id of ['text', 'zahl', 'suche', 'mail', 'pw', 'datum', 'notiz', 'einheit', 'frei']) {
      expect(entry(id), id).toBe(true);
    }
    for (const id of ['haken', 'radio', 'regler', 'knopf', 'senden', 'datei', 'button', 'aus']) {
      expect(entry(id), id).toBe(false);
    }
    expect(isTextEntry(null)).toBe(false);
  });

  it('getippt wird nur am Touch-Gerät und nur mit Fokus in einem Feld', () => {
    document.body.innerHTML = '<input id="feld"><button id="knopf">OK</button>';
    touch(true);
    expect(typing()).toBe(false);
    document.getElementById('feld')?.focus();
    expect(typing()).toBe(true);
    document.getElementById('knopf')?.focus();
    expect(typing()).toBe(false);
    document.getElementById('feld')?.focus();
    touch(false);
    expect(typing()).toBe(false);
  });

  it('styles.css blendet Tab-Leiste und Kreis aus, mit denselben Feldern; die Fußleiste nur, wenn sie das Feld verdeckte; Platz unten nur über die Variable', () => {
    const css = squash(styles);
    const has = `:root:has(:is(${squash(TEXT_ENTRY_SELECTOR)}):focus)`;
    const touchBlock = css.indexOf('@media(pointer:coarse){');
    expect(touchBlock).toBeGreaterThan(0);
    expect(css.indexOf(`${has}.tabbar-dock{visibility:hidden;}`, touchBlock)).toBeGreaterThan(0);
    // Platz unten nicht am Fokus: Er verschwände beim Antippen eines Knopfes und verschöbe den
    // Inhalt unter dem Finger. `revealField` setzt ihn bei Bedarf.
    expect(css).not.toContain('::after{height:60%');
    // Die Fußleiste im Training bleibt über der Tastatur, „Satz erledigt“ in Reichweite; aus nur,
    // wenn sie das Feld verdeckte (`useFootClearOfField`), nicht pauschal im niedrigen Fenster.
    expect(css).toContain('.player-foot[data-covering]{visibility:hidden;}');
    expect(css).not.toContain(`${has}.player-foot`);
    // Platz unten im Rahmen und in der Anmeldung: ohne Variable null hoch.
    expect(css).toContain(
      '.page-scroller::after{content:"";display:block;height:var(--tastatur-platz,0px);}',
    );
    expect(css).toContain(
      '.login-screen::after{content:"";display:block;height:var(--tastatur-platz,0px);}',
    );
  });
});

describe('Angetipptes Feld zeigen (D-391)', () => {
  /** Rahmen 400 hoch, Abstand oben 80; das Feld liegt bei `top` (48 hoch, Beschriftung 28). */
  function setup(top: number) {
    const frame = document.createElement('div');
    frame.id = PAGE_SCROLLER_ID;
    const field = document.createElement('input');
    frame.append(field);
    document.body.append(frame);
    Object.defineProperty(frame, 'clientHeight', { configurable: true, value: 400 });
    vi.spyOn(frame, 'getBoundingClientRect').mockReturnValue(
      DOMRect.fromRect({ x: 0, y: 0, width: 300, height: 400 }),
    );
    vi.spyOn(field, 'getBoundingClientRect').mockReturnValue(
      DOMRect.fromRect({ x: 20, y: top, width: 200, height: 48 }),
    );
    const original = window.getComputedStyle.bind(window);
    /** Stil mit einem nachgestellten Wert (jsdom kennt `scroll-padding` und `scroll-margin` nicht). */
    const withValue = (style: CSSStyleDeclaration, name: string, value: string) =>
      new Proxy(style, {
        get: (target, key): unknown => (key === name ? value : Reflect.get(target, key, target)),
      });
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element, pseudo) => {
      const style = original(element, pseudo);
      if (element === frame) return withValue(style, 'scrollPaddingTop', '80px');
      if (element === field) return withValue(style, 'scrollMarginTop', '28px');
      return style;
    });
    const scrollBy = vi.fn();
    frame.scrollBy = scrollBy;
    return { frame, field, scrollBy };
  }

  it('liegt es im oberen Teil, bewegt sich nichts', () => {
    // Linie bei 40 % von 400 = 160: Feld von 100 bis 148.
    const { field, scrollBy } = setup(100);
    revealField(field);
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it('liegt es tiefer, kommt es in einem Schritt unter den Abstand oben, mit Platz für die Beschriftung', () => {
    const { field, scrollBy } = setup(300);
    revealField(field);
    expect(scrollBy).toHaveBeenCalledTimes(1);
    expect(scrollBy).toHaveBeenCalledWith({ top: 300 - (80 + 28), behavior: 'instant' });
  });

  it('liegt es hinter dem Abstand oben (Kopf im Training), kommt es darunter', () => {
    const { field, scrollBy } = setup(40);
    revealField(field);
    expect(scrollBy).toHaveBeenCalledWith({ top: 40 - 108, behavior: 'instant' });
  });

  it('eine Leiste, die über der Tastatur bleibt (Fußleiste im Training), zieht die Linie nach oben', () => {
    // Linie bei 160 minus 100 für die Leiste: Das Feld von 112 bis 160 kommt so hoch wie möglich.
    const { frame, field, scrollBy } = setup(112);
    setKeyboardBars(0, 100);
    expect(frame.style.getPropertyValue('--tastatur-unten')).toBe('100px');
    revealField(field);
    expect(scrollBy).toHaveBeenCalledWith({ top: 112 - 108, behavior: 'instant' });
    setKeyboardBars(0, 0);
    expect(frame.style.getPropertyValue('--tastatur-unten')).toBe('');
  });

  it('steht es schon so hoch wie möglich, rückt es nicht nach unten', () => {
    const { field, scrollBy } = setup(90);
    setKeyboardBars(0, 100);
    revealField(field);
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it('der Kopf im Training gilt statt des Abstands oben, ohne ihn doppelt zu zählen', () => {
    // Kopf 132 hoch (mit Abstand): Das Feld bei 300 kommt unter ihn plus Beschriftung (28).
    const { frame, field, scrollBy } = setup(300);
    setKeyboardBars(132, 0);
    expect(frame.style.getPropertyValue('--tastatur-oben')).toBe('132px');
    revealField(field);
    expect(scrollBy).toHaveBeenCalledWith({ top: 300 - (132 + 28), behavior: 'instant' });
  });

  it('reicht die Seite darunter nicht, entsteht unten Platz; beim Zurückscrollen geht er ohne Sprung wieder weg', () => {
    const { frame, field } = setup(300);
    const room = () => frame.style.getPropertyValue('--tastatur-platz');
    // Seite 500 hoch, Rahmen 400, schon 100 gescrollt: nach unten geht es nicht weiter.
    Object.defineProperty(frame, 'scrollHeight', {
      configurable: true,
      get: () => 500 + (parseFloat(room()) || 0),
    });
    frame.scrollTop = 100;
    revealField(field);
    expect(room()).toBe('192px');
    // Nach dem Schritt zum Feld (300 - 108) wird der Platz gebraucht und bleibt.
    frame.scrollTop = 292;
    frame.dispatchEvent(new Event('scroll'));
    expect(room()).toBe('192px');
    // Zurückscrollen: nur noch so viel Platz, wie unten zu sehen ist, nie weniger.
    frame.scrollTop = 150;
    frame.dispatchEvent(new Event('scroll'));
    expect(room()).toBe('50px');
    frame.scrollTop = 0;
    frame.dispatchEvent(new Event('scroll'));
    expect(room()).toBe('');
  });

  it('beim Wechsel der Seite ist der Platz weg', () => {
    const { frame } = setup(300);
    frame.style.setProperty('--tastatur-platz', '120px');
    releaseRoom();
    expect(frame.style.getPropertyValue('--tastatur-platz')).toBe('');
  });

  it('Felder in Blättern bleiben, wie sie sind; iOS schiebt das Blatt mit der Tastatur', () => {
    const { scrollBy } = setup(300);
    const sheet = document.createElement('dialog');
    Object.defineProperty(sheet, 'clientHeight', { configurable: true, value: 300 });
    const inSheet = document.createElement('input');
    sheet.append(inSheet);
    document.body.append(sheet);
    const sheetScroll = vi.fn();
    sheet.scrollBy = sheetScroll;
    vi.spyOn(inSheet, 'getBoundingClientRect').mockReturnValue(
      DOMRect.fromRect({ x: 20, y: 500, width: 200, height: 48 }),
    );
    revealField(inSheet);
    expect(scrollBy).not.toHaveBeenCalled();
    expect(sheetScroll).not.toHaveBeenCalled();
  });

  it('in einem Dialog über den ganzen Bildschirm (Anmeldung) kommt das Feld wie im Rahmen nach oben', () => {
    const login = document.createElement('dialog');
    const field = document.createElement('input');
    login.append(field);
    document.body.append(login);
    Object.defineProperty(login, 'clientHeight', { configurable: true, value: window.innerHeight });
    vi.spyOn(login, 'getBoundingClientRect').mockReturnValue(
      DOMRect.fromRect({ x: 0, y: 0, width: 300, height: window.innerHeight }),
    );
    vi.spyOn(field, 'getBoundingClientRect').mockReturnValue(
      DOMRect.fromRect({ x: 20, y: window.innerHeight * 0.6, width: 200, height: 48 }),
    );
    const scroll = vi.fn();
    login.scrollBy = scroll;
    revealField(field);
    expect(scroll).toHaveBeenCalledTimes(1);
    expect(scroll.mock.calls[0]?.[0]).toMatchObject({ behavior: 'instant' });
  });
});
