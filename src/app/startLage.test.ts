import { describe, expect, it } from 'vitest';
import script from '../../public/startflaeche.js?raw';

/**
 * Lage der Startfläche (D-393), gerechnet von `public/startflaeche.js`. Messwerte vom iPhone Duo
 * (Gerätedaten und Bildschirmfotos vom 27.10.2026): Fenster zugeklappt hoch 382 × 678 (Bildschirm
 * 466 × 678), aufgeklappt hoch 669 × 869 (669 × 951), aufgeklappt quer 867 × 587 (951 × 669);
 * sichere Bereiche überall 0, 0, 34, 0. `screen.width` meldet vermutlich auch aufgeklappt das
 * äußere Display (466): Mit D-390 stand das Logo aufgeklappt hoch 102 pt links der Mitte, genau
 * (466 − 669) / 2. Aufgeklappt quer stand es 42 pt links der Mitte, so groß und so hoch wie im
 * Startbild: Beim Start war das Fenster quer 867 × 669, der Streifen oben kam erst danach.
 */

interface Placement {
  quelle: 'bildschirm' | 'duo' | 'fenster';
  b: number;
  h: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
}

interface Messung {
  fenster: { b: number; h: number };
  bildschirm: { b: number; h: number } | null;
}

interface FakeWindow {
  innerWidth: number;
  innerHeight: number;
  screen: { width: number; height: number } | undefined;
  screenX: number;
  screenY: number;
  listeners: Map<string, () => void>;
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string) => void;
  __formStartLage?: (messung: Messung) => Placement;
}

/** Führt die Datei aus public/ aus wie der Browser, mit einem nachgestellten Fenster. */
function run(
  values: Partial<
    Pick<FakeWindow, 'innerWidth' | 'innerHeight' | 'screen' | 'screenX' | 'screenY'>
  > = {},
) {
  const styles = new Map<string, string>();
  const doc = {
    readyState: 'loading',
    documentElement: {
      style: {
        setProperty: (name: string, value: string) => {
          styles.set(name, value);
        },
      },
    },
    surface: true,
    getElementById(id: string) {
      return id === 'startflaeche' && this.surface ? {} : null;
    },
  };
  const fake: FakeWindow = {
    innerWidth: 390,
    innerHeight: 844,
    screen: { width: 390, height: 844 },
    screenX: 0,
    screenY: 0,
    listeners: new Map(),
    addEventListener(type, listener) {
      this.listeners.set(type, listener);
    },
    removeEventListener(type) {
      this.listeners.delete(type);
    },
    ...values,
  };
  // eslint-disable-next-line @typescript-eslint/no-implied-eval -- nur im Test: die Datei aus public/
  const execute = new Function('window', 'document', script) as (
    win: unknown,
    doc: unknown,
  ) => void;
  execute(fake, doc);
  const startLage = fake.__formStartLage;
  if (!startLage) throw new Error('__formStartLage fehlt');
  return { startLage, styles, fake, doc };
}

const { startLage } = run();

/** `screen.*`, wie das Duo es vermutlich überall meldet: das äußere Display hochkant. */
const AUSSEN = { b: 466, h: 678 };

const lage = (fenster: { b: number; h: number }, bildschirm: Messung['bildschirm'] = AUSSEN) =>
  startLage({ fenster, bildschirm });

describe('Startfläche mit den Messwerten vom iPhone Duo (D-393)', () => {
  it('zugeklappt hoch: Bildschirm aus screen.*, Streifen rechts, 42 pt nach rechts (passte schon)', () => {
    expect(lage({ b: 382, h: 678 })).toEqual({
      quelle: 'bildschirm',
      b: 466,
      h: 678,
      x: 0,
      y: 0,
      dx: 42,
      dy: 0,
    });
  });

  it('aufgeklappt hoch: screen.* (466) passt nicht zum Fenster (669), also die Maße des Duo; Streifen oben, 41 pt nach oben, waagrecht mittig', () => {
    expect(lage({ b: 669, h: 869 })).toEqual({
      quelle: 'duo',
      b: 669,
      h: 951,
      x: 0,
      y: 82,
      dx: 0,
      dy: -41,
    });
  });

  it('aufgeklappt quer: Maße des Duo, Streifen rechts und oben, 42 pt nach rechts und 41 pt nach oben', () => {
    expect(lage({ b: 867, h: 587 })).toEqual({
      quelle: 'duo',
      b: 951,
      h: 669,
      x: 0,
      y: 82,
      dx: 42,
      dy: -41,
    });
  });

  it('aufgeklappt quer beim Start (laut Messbild 867 × 669, Streifen nur rechts): 42 pt nach rechts, senkrecht nichts', () => {
    expect(lage({ b: 867, h: 669 })).toEqual({
      quelle: 'duo',
      b: 951,
      h: 669,
      x: 0,
      y: 0,
      dx: 42,
      dy: 0,
    });
  });

  it('zugeklappt quer (Annahme: 84 pt schmaler wie in Safari, 594 pt, Streifen an der Seite): 42 pt nach rechts', () => {
    expect(lage({ b: 594, h: 466 })).toEqual({
      quelle: 'duo',
      b: 678,
      h: 466,
      x: 0,
      y: 0,
      dx: 42,
      dy: 0,
    });
  });

  it('Fenster so groß wie das Display: keine Verschiebung', () => {
    expect(lage({ b: 466, h: 678 })).toMatchObject({ quelle: 'bildschirm', dx: 0, dy: 0 });
    expect(lage({ b: 678, h: 466 })).toMatchObject({ quelle: 'duo', dx: 0, dy: 0 });
    expect(lage({ b: 669, h: 951 })).toMatchObject({ quelle: 'duo', dx: 0, dy: 0 });
    expect(lage({ b: 951, h: 669 })).toMatchObject({ quelle: 'duo', dx: 0, dy: 0 });
  });

  it('meldet screen.* das richtige Display, kommt dieselbe Lage heraus, nur aus screen.*', () => {
    const hoch = lage({ b: 669, h: 869 }, { b: 669, h: 951 });
    expect(hoch).toMatchObject({ quelle: 'bildschirm', dx: 0, dy: -41 });
    const quer = lage({ b: 867, h: 587 }, { b: 951, h: 669 });
    expect(quer).toMatchObject({ quelle: 'bildschirm', dx: 42, dy: -41 });
  });

  it('screen.* hochkant bei Fenster quer (wie iOS meldet) passt nicht zur Ausrichtung: Maße des Duo', () => {
    expect(lage({ b: 867, h: 587 }, { b: 669, h: 951 })).toMatchObject({
      quelle: 'duo',
      dx: 42,
      dy: -41,
    });
  });

  it('nie in die Gegenrichtung: aufgeklappt hoch nicht mehr 102 pt nach links wie mit D-390', () => {
    const states = [
      { b: 382, h: 678 },
      { b: 669, h: 869 },
      { b: 867, h: 587 },
      { b: 867, h: 669 },
      { b: 594, h: 466 },
    ];
    for (const fenster of states) {
      for (const bildschirm of [
        AUSSEN,
        { b: 669, h: 951 },
        { b: 951, h: 669 },
        { b: 678, h: 466 },
        null,
      ]) {
        const result = lage(fenster, bildschirm);
        const label = `${String(fenster.b)}×${String(fenster.h)} mit ${JSON.stringify(bildschirm)}`;
        // Der Streifen liegt rechts oder oben: Die Fläche rückt nach rechts oder oben, nie anders.
        expect(result.dx, label).toBeGreaterThanOrEqual(0);
        expect(result.dy, label).toBeLessThanOrEqual(0);
        expect(result.dx, label).toBeLessThanOrEqual((result.b - fenster.b) / 2);
        expect(-result.dy, label).toBeLessThanOrEqual((result.h - fenster.h) / 2);
        // Die Mitte der Fläche ist die Mitte des Bildschirms.
        expect(fenster.b / 2 + result.dx, label).toBe(result.b / 2 - result.x);
        expect(fenster.h / 2 + result.dy, label).toBe(result.h / 2 - result.y);
      }
    }
  });
});

describe('Ist nichts verlässlich, steht die Startfläche mittig im Fenster (D-393)', () => {
  it('iPhone vom Home-Bildschirm: Fenster so groß wie der Bildschirm, keine Verschiebung', () => {
    expect(lage({ b: 393, h: 852 }, { b: 393, h: 852 })).toEqual({
      quelle: 'bildschirm',
      b: 393,
      h: 852,
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
    });
  });

  it('kein Duo und screen.* nicht plausibel: Fenster, keine Verschiebung', () => {
    // Fenster kleiner als der Bildschirm, aber mehr als ein Streifen (geteilter Bildschirm).
    expect(lage({ b: 500, h: 1000 }, { b: 1024, h: 1366 })).toEqual({
      quelle: 'fenster',
      b: 500,
      h: 1000,
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
    });
    // Bildschirm kleiner als das Fenster, und das Fenster passt zu keinem Display des Duo.
    expect(lage({ b: 700, h: 900 })).toMatchObject({ quelle: 'fenster', dx: 0, dy: 0 });
    // Ohne screen.
    expect(lage({ b: 700, h: 500 }, null)).toMatchObject({ quelle: 'fenster', dx: 0, dy: 0 });
  });

  it('Bildschirm plausibel, aber die Seite der Streifen unbekannt: nichts raten, Fläche wie das Fenster', () => {
    // Kein Duo, 40 pt Rest oben oder unten.
    expect(lage({ b: 390, h: 804 }, { b: 390, h: 844 })).toEqual({
      quelle: 'fenster',
      b: 390,
      h: 804,
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
    });
    // Handy-Profil der Tests (Pixel 7: Bildschirm 412 × 915) mit dem Fenster eines iPhone.
    expect(lage({ b: 390, h: 844 }, { b: 412, h: 915 })).toMatchObject({
      quelle: 'fenster',
      b: 390,
      h: 844,
      dx: 0,
      dy: 0,
    });
    // Duo zugeklappt, aber ein Rest oben, den es dort nicht gibt.
    expect(lage({ b: 382, h: 600 })).toMatchObject({ quelle: 'fenster', dx: 0, dy: 0 });
  });
});

describe('Beim Laden setzt das Skript die Größe und Lage der Grafik (D-393)', () => {
  it('aufgeklappt hoch: Grafik 669 × 951, 82 pt nach oben verschoben, kurze Seite 669', () => {
    const { styles } = run({
      innerWidth: 669,
      innerHeight: 869,
      screen: { width: 466, height: 678 },
    });
    expect(Object.fromEntries(styles)).toEqual({
      '--start-b': '669px',
      '--start-h': '951px',
      '--start-x': '0px',
      '--start-y': '-82px',
      '--start-kurz': '669px',
    });
  });

  it('iPhone ohne Streifen: Grafik so groß wie das Fenster, nicht verschoben', () => {
    const { styles } = run();
    expect(Object.fromEntries(styles)).toEqual({
      '--start-b': '390px',
      '--start-h': '844px',
      '--start-x': '0px',
      '--start-y': '0px',
      '--start-kurz': '390px',
    });
  });

  it('screenX und screenY zählen nicht: Die Lage kommt aus den Streifen des Duo', () => {
    const { styles } = run({
      innerWidth: 382,
      innerHeight: 678,
      screen: { width: 466, height: 678 },
      screenX: 84,
      screenY: 30,
    });
    expect(styles.get('--start-x')).toBe('0px');
    expect(styles.get('--start-y')).toBe('0px');
    expect(styles.get('--start-b')).toBe('466px');
  });

  it('folgt Größenänderungen, solange die Fläche da ist, danach nicht mehr', () => {
    const { styles, fake, doc } = run({
      innerWidth: 382,
      innerHeight: 678,
      screen: { width: 466, height: 678 },
    });
    expect(styles.get('--start-b')).toBe('466px');
    // Aufklappen während des Starts.
    fake.innerWidth = 867;
    fake.innerHeight = 587;
    fake.listeners.get('resize')?.();
    expect(styles.get('--start-b')).toBe('951px');
    expect(styles.get('--start-y')).toBe('-82px');
    // Die App ist gestartet, die Fläche entfernt: Das Skript hört auf.
    doc.readyState = 'complete';
    doc.surface = false;
    fake.listeners.get('resize')?.();
    expect(fake.listeners.has('resize')).toBe(false);
  });
});
