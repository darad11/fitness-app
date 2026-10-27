import { describe, expect, it } from 'vitest';
import script from '../../public/startflaeche.js?raw';

/**
 * Lage der Startfläche (D-393, D-394), gerechnet von `public/startflaeche.js`. Messwerte vom
 * iPhone Duo (Gerätedaten und Bildschirmfotos vom 27.10.2026): Fenster zugeklappt hoch 382 × 678
 * (Bildschirm 466 × 678), aufgeklappt hoch 669 × 869 (669 × 951), aufgeklappt quer 867 × 587
 * (951 × 669), beim Start quer 867 × 669; sichere Bereiche überall 0, 0, 34, 0. Beim vierten von
 * mehreren Starts aufgeklappt quer stand das Logo bei 233 pt: Die Grafik war 466 pt breit und
 * 669 pt hoch, das Skript hatte beim Laden 466 × 669 gemessen (Breite zugeklappt, Höhe aufgeklappt
 * quer) und danach keine Größenänderung mehr bekommen (D-394).
 */

interface Placement {
  quelle: 'bildschirm' | 'duo' | 'fenster' | 'widerspruch';
  b: number;
  h: number;
  links: number;
  rechts: number;
  oben: number;
  unten: number;
  dx: number;
  dy: number;
  sicher: boolean;
  widerspruch: string | null;
}

type Ausrichtung = 'hoch' | 'quer' | null;

interface Messung {
  fenster: { b: number; h: number };
  bildschirm: { b: number; h: number } | null;
  ausrichtung: Ausrichtung;
}

interface Protokoll {
  erste: { t: number; fenster: { b: number; h: number }; typ: string | null } | null;
  aenderungen: { t: number; fenster: { b: number; h: number }; typ: string | null }[];
  sichtbar: { t: number; grund: 'stabil' | 'zeit' } | null;
}

/** Werte, die die nachgestellte Seite meldet. */
interface Werte {
  /** Fenster, wie das Layout es meldet (`clientWidth` × `clientHeight`). */
  b: number;
  h: number;
  /** `innerWidth` × `innerHeight`; ohne Angabe wie das Layout. */
  innen?: { b: number; h: number };
  bildschirm?: { b: number; h: number } | null;
  /** `screen.orientation.type`; `null`: ohne `screen.orientation`. */
  typ?: string | null;
  winkel?: number;
  /** `window.orientation`. */
  alt?: number;
}

type Hoerer = () => void;

/**
 * Nachgestellte Seite für die Datei aus public/: eigene Uhr, Bilder (`requestAnimationFrame`),
 * Zeitgeber und Ereignisse. `bild()` lässt ein Bild laufen, `zeit()` nur die Uhr.
 */
class Seite {
  uhr = 0;
  werte: Werte;
  bilder: ((t: number) => void)[] = [];
  zeitgeber: { id: number; at: number; fn: Hoerer }[] = [];
  naechsteId = 1;
  hoerer = new Map<string, Set<Hoerer>>();
  stile = new Map<string, string>();
  attribut: string | null = null;
  flaeche = true;
  readyState = 'loading';
  fenster: Record<string, unknown> & {
    __formStartLage?: (messung: Messung) => Placement;
    __formStartMessung?: Protokoll;
  };
  doc: Record<string, unknown>;

  constructor(werte: Werte) {
    this.werte = werte;
    // Getter der nachgestellten Objekte lesen über Pfeilfunktionen aus dieser Seite.
    const w = () => this.werte;
    const liste = (art: string) => {
      let set = this.hoerer.get(art);
      if (!set) {
        set = new Set();
        this.hoerer.set(art, set);
      }
      return set;
    };
    const orientierung = {
      get type() {
        return w().typ ?? undefined;
      },
      get angle() {
        return w().winkel ?? 0;
      },
      addEventListener: (art: string, f: Hoerer) => liste(`orientierung:${art}`).add(f),
      removeEventListener: (art: string, f: Hoerer) => liste(`orientierung:${art}`).delete(f),
    };
    const bildschirm = {
      get width() {
        return (w().bildschirm ?? { b: 0 }).b;
      },
      get height() {
        return (w().bildschirm ?? { h: 0 }).h;
      },
      get orientation() {
        return w().typ === null ? undefined : orientierung;
      },
    };
    this.fenster = {
      get innerWidth() {
        return (w().innen ?? w()).b;
      },
      get innerHeight() {
        return (w().innen ?? w()).h;
      },
      get screen() {
        return w().bildschirm === null ? undefined : bildschirm;
      },
      get orientation() {
        return w().alt;
      },
      visualViewport: {
        addEventListener: (art: string, f: Hoerer) => liste(`viewport:${art}`).add(f),
        removeEventListener: (art: string, f: Hoerer) => liste(`viewport:${art}`).delete(f),
      },
      performance: { now: () => this.uhr },
      setTimeout: (fn: Hoerer, ms: number) => {
        const id = this.naechsteId++;
        this.zeitgeber.push({ id, at: this.uhr + ms, fn });
        return id;
      },
      clearTimeout: (id: number) => {
        this.zeitgeber = this.zeitgeber.filter((z) => z.id !== id);
      },
      requestAnimationFrame: (fn: (t: number) => void) => {
        this.bilder.push(fn);
        return this.bilder.length;
      },
      addEventListener: (art: string, f: Hoerer) => liste(art).add(f),
      removeEventListener: (art: string, f: Hoerer) => liste(art).delete(f),
    };
    const bereit = () => this.readyState;
    this.doc = {
      get readyState() {
        return bereit();
      },
      documentElement: {
        get clientWidth() {
          return w().b;
        },
        get clientHeight() {
          return w().h;
        },
        style: {
          setProperty: (name: string, value: string) => this.stile.set(name, value),
        },
        setAttribute: (name: string, value: string) => {
          if (name === 'data-startlage') this.attribut = value;
        },
        removeAttribute: (name: string) => {
          if (name === 'data-startlage') this.attribut = null;
        },
      },
      getElementById: (id: string) => (id === 'startflaeche' && this.flaeche ? {} : null),
    };
  }

  /** Lädt das Skript wie der Browser im Kopf der Seite. */
  laden() {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval -- nur im Test: die Datei aus public/
    const execute = new Function('window', 'document', script) as (
      win: unknown,
      doc: unknown,
    ) => void;
    execute(this.fenster, this.doc);
    return this;
  }

  /** Uhr vorstellen; fällige Zeitgeber laufen zu ihrer Zeit. */
  zeit(ms: number) {
    const ziel = this.uhr + ms;
    for (;;) {
      const naechster = this.zeitgeber.filter((z) => z.at <= ziel).sort((a, b) => a.at - b.at)[0];
      if (!naechster) break;
      this.zeitgeber = this.zeitgeber.filter((z) => z !== naechster);
      this.uhr = Math.max(this.uhr, naechster.at);
      naechster.fn();
    }
    this.uhr = ziel;
  }

  /** Ein Bild, 16 ms nach dem letzten: alle angemeldeten `requestAnimationFrame`. */
  bild(ms = 16) {
    this.zeit(ms);
    const jetzt = this.bilder;
    this.bilder = [];
    for (const f of jetzt) f(this.uhr);
  }

  ereignis(art: string) {
    for (const f of [...(this.hoerer.get(art) ?? [])]) f();
  }

  /** Logo sichtbar: index.html verbirgt es nur bei `data-startlage="warten"`. */
  get sichtbar() {
    return this.attribut !== 'warten';
  }

  get streifen() {
    const px = (name: string) => parseFloat(this.stile.get(name) ?? '0');
    return {
      links: px('--start-links'),
      rechts: px('--start-rechts'),
      oben: px('--start-oben'),
      unten: px('--start-unten'),
    };
  }

  /**
   * Mitte des Logos auf dem Bildschirm, wie das CSS aus index.html sie zeichnet: Grafik = das
   * echte Fenster `wahr` (Lage `x`, `y` auf dem Bildschirm) plus die Streifen, Logo bei 50 % der
   * Breite und 47 % der Höhe (Regel C3).
   */
  logo(wahr: { x: number; y: number; b: number; h: number }) {
    const s = this.streifen;
    return {
      x: wahr.x - s.links + (wahr.b + s.links + s.rechts) / 2,
      y: wahr.y - s.oben + 0.47 * (wahr.h + s.oben + s.unten),
    };
  }

  get protokoll() {
    const protokoll = this.fenster.__formStartMessung;
    if (!protokoll) throw new Error('__formStartMessung fehlt');
    return protokoll;
  }
}

const { __formStartLage: startLage } = new Seite({ b: 390, h: 844 }).laden().fenster;
if (!startLage) throw new Error('__formStartLage fehlt');

/** `screen.*`, wie das Duo es vermutlich überall meldet: das äußere Display hochkant. */
const AUSSEN = { b: 466, h: 678 };

const lage = (
  fenster: { b: number; h: number },
  bildschirm: Messung['bildschirm'] = AUSSEN,
  ausrichtung: Ausrichtung = fenster.b > fenster.h ? 'quer' : 'hoch',
) => startLage({ fenster, bildschirm, ausrichtung });

const DUO_QUER = { bildschirm: AUSSEN, typ: 'landscape-secondary', winkel: 270 };
const DUO_HOCH = { bildschirm: AUSSEN, typ: 'portrait-primary', winkel: 0 };
/** Aufgeklappt quer beim Start: Fenster 867 × 669 links auf dem Bildschirm 951 × 669. */
const AUF_QUER = { x: 0, y: 0, b: 867, h: 669 };
/** Mitte des Bildschirms aufgeklappt quer: dort steht das Logo im Startbild. */
const MITTE_QUER = { x: 951 / 2, y: 0.47 * 669 };

describe('Startfläche mit den Messwerten vom iPhone Duo (D-393)', () => {
  it('zugeklappt hoch: Bildschirm aus screen.*, Streifen rechts, 42 pt nach rechts (passte schon)', () => {
    expect(lage({ b: 382, h: 678 })).toEqual({
      quelle: 'bildschirm',
      b: 466,
      h: 678,
      links: 0,
      rechts: 84,
      oben: 0,
      unten: 0,
      dx: 42,
      dy: 0,
      sicher: true,
      widerspruch: null,
    });
  });

  it('aufgeklappt hoch: screen.* (466) passt nicht zum Fenster (669), also die Maße des Duo; Streifen oben, 41 pt nach oben', () => {
    expect(lage({ b: 669, h: 869 })).toEqual({
      quelle: 'duo',
      b: 669,
      h: 951,
      links: 0,
      rechts: 0,
      oben: 82,
      unten: 0,
      dx: 0,
      dy: -41,
      sicher: true,
      widerspruch: null,
    });
  });

  it('aufgeklappt quer: Maße des Duo, Streifen rechts und oben, 42 pt nach rechts und 41 pt nach oben', () => {
    expect(lage({ b: 867, h: 587 })).toMatchObject({
      quelle: 'duo',
      b: 951,
      h: 669,
      links: 0,
      rechts: 84,
      oben: 82,
      unten: 0,
      dx: 42,
      dy: -41,
      sicher: true,
    });
  });

  it('aufgeklappt quer beim Start (867 × 669, Streifen nur rechts): 42 pt nach rechts, senkrecht nichts', () => {
    expect(lage({ b: 867, h: 669 })).toMatchObject({
      quelle: 'duo',
      b: 951,
      h: 669,
      rechts: 84,
      oben: 0,
      dx: 42,
      dy: 0,
      sicher: true,
    });
  });

  it('zugeklappt quer (Annahme: 594 pt wie in Safari, Streifen an der Seite): 42 pt nach rechts', () => {
    expect(lage({ b: 594, h: 466 })).toMatchObject({
      quelle: 'duo',
      b: 678,
      h: 466,
      rechts: 84,
      dx: 42,
      dy: 0,
      sicher: true,
    });
  });

  it('Fenster so groß wie das Display: keine Verschiebung, bekannte Haltung', () => {
    expect(lage({ b: 466, h: 678 })).toMatchObject({ quelle: 'bildschirm', dx: 0, sicher: true });
    expect(lage({ b: 678, h: 466 })).toMatchObject({ quelle: 'bildschirm', dx: 0, sicher: true });
    expect(lage({ b: 669, h: 951 })).toMatchObject({ quelle: 'duo', dx: 0, dy: 0, sicher: true });
    expect(lage({ b: 951, h: 669 })).toMatchObject({ quelle: 'duo', dx: 0, dy: 0, sicher: true });
  });

  it('meldet screen.* das richtige Display, kommt dieselbe Lage heraus, nur aus screen.*', () => {
    expect(lage({ b: 669, h: 869 }, { b: 669, h: 951 })).toMatchObject({
      quelle: 'bildschirm',
      dx: 0,
      dy: -41,
    });
    expect(lage({ b: 867, h: 587 }, { b: 951, h: 669 })).toMatchObject({
      quelle: 'bildschirm',
      dx: 42,
      dy: -41,
    });
  });

  it('nie in die Gegenrichtung, in jeder Haltung und mit jedem gemeldeten Bildschirm', () => {
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
        expect(result.links, label).toBe(0);
        expect(result.unten, label).toBe(0);
        // Die Grafik ist das Fenster plus die Streifen; ihre Mitte ist die Mitte des Bildschirms.
        expect(result.b, label).toBe(fenster.b + result.links + result.rechts);
        expect(result.h, label).toBe(fenster.h + result.oben + result.unten);
        expect(result.dx, label).toBe((result.rechts - result.links) / 2);
        expect(result.dy, label).toBe((result.unten - result.oben) / 2);
      }
    }
  });
});

describe('Werte, die sich widersprechen, zählen nie (D-394)', () => {
  it('Fenster mit der Breite des äußeren Displays bei Ausrichtung quer: kein Streifen, Logo darf nicht erscheinen', () => {
    for (const fenster of [
      { b: 466, h: 669 },
      { b: 466, h: 678 },
      { b: 382, h: 678 },
    ]) {
      expect(lage(fenster, AUSSEN, 'quer'), JSON.stringify(fenster)).toEqual({
        quelle: 'widerspruch',
        b: fenster.b,
        h: fenster.h,
        links: 0,
        rechts: 0,
        oben: 0,
        unten: 0,
        dx: 0,
        dy: 0,
        sicher: false,
        widerspruch: 'ausrichtung',
      });
    }
  });

  it('Fenster quer bei Ausrichtung hoch ebenso; ohne gemeldete Ausrichtung zählt nur das Fenster', () => {
    expect(lage({ b: 867, h: 669 }, AUSSEN, 'hoch')).toMatchObject({
      quelle: 'widerspruch',
      sicher: false,
    });
    expect(lage({ b: 867, h: 669 }, AUSSEN, null)).toMatchObject({ quelle: 'duo', dx: 42 });
  });
});

describe('Ist nichts verlässlich, steht die Startfläche mittig im Fenster (D-393, D-394)', () => {
  it('iPhone: Fenster so groß wie der Bildschirm, auch quer mit screen.* hochkant', () => {
    expect(lage({ b: 393, h: 852 }, { b: 393, h: 852 })).toMatchObject({
      quelle: 'bildschirm',
      dx: 0,
      dy: 0,
      sicher: true,
    });
    expect(lage({ b: 852, h: 393 }, { b: 393, h: 852 })).toMatchObject({
      quelle: 'bildschirm',
      dx: 0,
      dy: 0,
      sicher: true,
    });
  });

  it('kein Duo, Bildschirm plausibel, Seite der Streifen unbekannt: mittig im Fenster, das Logo darf erscheinen', () => {
    // iPhone, dessen Fenster unter der Statusleiste beginnt.
    expect(lage({ b: 390, h: 797 }, { b: 390, h: 844 })).toEqual({
      quelle: 'fenster',
      b: 390,
      h: 797,
      links: 0,
      rechts: 0,
      oben: 0,
      unten: 0,
      dx: 0,
      dy: 0,
      sicher: true,
      widerspruch: null,
    });
    // Handy-Profil der Tests (Pixel 7: Bildschirm 412 × 915) mit dem Fenster eines iPhone.
    expect(lage({ b: 390, h: 844 }, { b: 412, h: 915 })).toMatchObject({
      quelle: 'fenster',
      dx: 0,
      sicher: true,
    });
    // iPad quer mit Statusleiste, screen.* hochkant gemeldet.
    expect(lage({ b: 1366, h: 1000 }, { b: 1024, h: 1366 })).toMatchObject({
      quelle: 'fenster',
      dx: 0,
      sicher: true,
    });
  });

  it('nicht plausibel oder unbekannte Lage am Duo: mittig im Fenster, das Logo wartet bis 300 ms', () => {
    // Geteilter Bildschirm: Fenster viel kleiner als der Bildschirm.
    expect(lage({ b: 500, h: 1000 }, { b: 1024, h: 1366 })).toMatchObject({
      quelle: 'fenster',
      dx: 0,
      sicher: false,
    });
    // Bildschirm kleiner als das Fenster, und das Fenster passt zu keinem Display des Duo.
    expect(lage({ b: 700, h: 900 })).toMatchObject({ quelle: 'fenster', sicher: false });
    // Ohne screen.
    expect(lage({ b: 700, h: 500 }, null)).toMatchObject({ quelle: 'fenster', sicher: false });
    // Duo zugeklappt, aber ein Rest oben, den es dort nicht gibt.
    expect(lage({ b: 382, h: 600 })).toMatchObject({ quelle: 'fenster', dx: 0, sicher: false });
  });
});

describe('Keine einmalige Messung: Startfläche Bild für Bild (D-394)', () => {
  it('wie beim vierten Start: beim Laden 466 × 669 bei Ausrichtung quer, ab dem ersten Bild 867 × 669 – Logo erst nach zwei gleichen Bildern, gleich mittig', () => {
    const seite = new Seite({ b: 466, h: 669, ...DUO_QUER }).laden();
    expect(seite.attribut).toBe('warten');
    // Widerspruch beim Laden: keine Streifen gesetzt.
    expect(seite.streifen).toEqual({ links: 0, rechts: 0, oben: 0, unten: 0 });
    seite.werte = { b: 867, h: 669, ...DUO_QUER };
    seite.bild();
    expect(seite.sichtbar).toBe(false);
    expect(seite.streifen).toEqual({ links: 0, rechts: 84, oben: 0, unten: 0 });
    seite.bild();
    expect(seite.sichtbar).toBe(true);
    expect(seite.logo(AUF_QUER)).toEqual(MITTE_QUER);
    expect(seite.protokoll.erste).toMatchObject({ t: 0, fenster: { b: 466, h: 669 } });
    expect(seite.protokoll.aenderungen).toMatchObject([{ t: 16, fenster: { b: 867, h: 669 } }]);
    expect(seite.protokoll.sichtbar).toEqual({ t: 32, grund: 'stabil' });
  });

  it('zuerst Maße des zugeklappten Zustands (ohne Widerspruch), kurz danach die aufgeklappten: am Ende mittig, nie an der falschen Stelle sichtbar', () => {
    const seite = new Seite({ b: 466, h: 678, ...DUO_HOCH }).laden();
    const sichtbar: { x: number; y: number }[] = [];
    // Laden und erstes Bild noch zugeklappt gemeldet, dann aufgeklappt.
    seite.bild();
    seite.werte = { b: 867, h: 669, ...DUO_QUER };
    for (let i = 0; i < 6; i += 1) {
      seite.bild();
      if (seite.sichtbar) sichtbar.push(seite.logo(AUF_QUER));
    }
    expect(sichtbar.length).toBeGreaterThan(0);
    for (const punkt of sichtbar) expect(punkt).toEqual(MITTE_QUER);
    expect(seite.protokoll.sichtbar).toEqual({ t: 48, grund: 'stabil' });
  });

  it('Widerspruch über 100 ms, dann stimmige Werte: unsichtbar bis zwei gleiche Bilder, dann mittig', () => {
    const seite = new Seite({ b: 466, h: 669, ...DUO_QUER }).laden();
    while (seite.uhr < 100) {
      seite.bild();
      expect(seite.sichtbar).toBe(false);
      expect(seite.streifen.rechts).toBe(0);
    }
    seite.werte = { b: 867, h: 669, ...DUO_QUER };
    seite.bild();
    expect(seite.sichtbar).toBe(false);
    seite.bild();
    expect(seite.sichtbar).toBe(true);
    expect(seite.logo(AUF_QUER)).toEqual(MITTE_QUER);
  });

  it('Widerspruch bleibt: nach 300 ms erscheint das Logo trotzdem, ohne Streifen mittig im Fenster', () => {
    const seite = new Seite({ b: 466, h: 669, ...DUO_QUER }).laden();
    while (seite.uhr < 288) {
      seite.bild();
      expect(seite.sichtbar).toBe(false);
    }
    seite.bild();
    expect(seite.uhr).toBe(304);
    expect(seite.sichtbar).toBe(true);
    expect(seite.protokoll.sichtbar).toEqual({ t: 300, grund: 'zeit' });
    expect(seite.streifen).toEqual({ links: 0, rechts: 0, oben: 0, unten: 0 });
  });

  it('ohne Bilder (Seite im Hintergrund): Der Zeitgeber zeigt das Logo nach 300 ms', () => {
    const seite = new Seite({ b: 867, h: 669, ...DUO_QUER }).laden();
    seite.zeit(299);
    expect(seite.sichtbar).toBe(false);
    seite.zeit(1);
    expect(seite.sichtbar).toBe(true);
    expect(seite.protokoll.sichtbar).toEqual({ t: 300, grund: 'zeit' });
    // Die Streifen stimmen schon, gesetzt beim Laden.
    expect(seite.logo(AUF_QUER)).toEqual(MITTE_QUER);
  });

  it('normales iPhone, auch mit Fenster unter der Statusleiste und quer: Logo nach zwei Bildern, ohne Streifen', () => {
    for (const werte of [
      { b: 390, h: 844, bildschirm: { b: 390, h: 844 }, typ: 'portrait-primary', winkel: 0 },
      { b: 390, h: 797, bildschirm: { b: 390, h: 844 }, typ: 'portrait-primary', winkel: 0 },
      { b: 844, h: 390, bildschirm: { b: 390, h: 844 }, typ: 'landscape-primary', winkel: 90 },
    ]) {
      const seite = new Seite(werte).laden();
      seite.bild();
      expect(seite.sichtbar, JSON.stringify(werte)).toBe(false);
      seite.bild();
      expect(seite.sichtbar, JSON.stringify(werte)).toBe(true);
      expect(seite.streifen).toEqual({ links: 0, rechts: 0, oben: 0, unten: 0 });
    }
  });

  it('Computer: Bildschirm viel größer als das Fenster, nichts verlässlich, Logo nach 300 ms mittig', () => {
    const seite = new Seite({
      b: 1280,
      h: 720,
      bildschirm: { b: 1920, h: 1080 },
      typ: 'landscape-primary',
      winkel: 0,
    }).laden();
    for (let i = 0; i < 18; i += 1) seite.bild();
    expect(seite.sichtbar).toBe(false);
    seite.bild();
    expect(seite.sichtbar).toBe(true);
    expect(seite.protokoll.sichtbar?.grund).toBe('zeit');
    expect(seite.streifen).toEqual({ links: 0, rechts: 0, oben: 0, unten: 0 });
  });

  it('ohne screen.orientation zählt window.orientation', () => {
    const seite = new Seite({ b: 466, h: 669, bildschirm: AUSSEN, typ: null, alt: 90 }).laden();
    seite.bild();
    seite.bild();
    expect(seite.sichtbar).toBe(false);
    expect(seite.protokoll.erste).toMatchObject({ typ: null, winkel: 90 });
  });
});

describe('Nach dem Erscheinen: neu gesetzt bei jeder Änderung, solange die Fläche da ist (D-394)', () => {
  it('Streifen oben kommt dazu (867 × 669 → 867 × 587): sofort neu gesetzt, das Logo bleibt an seiner Stelle', () => {
    const seite = new Seite({ b: 867, h: 669, ...DUO_QUER }).laden();
    seite.bild();
    seite.bild();
    expect(seite.sichtbar).toBe(true);
    seite.werte = { b: 867, h: 587, ...DUO_QUER };
    seite.ereignis('resize');
    expect(seite.streifen).toEqual({ links: 0, rechts: 84, oben: 82, unten: 0 });
    expect(seite.logo({ x: 0, y: 82, b: 867, h: 587 })).toEqual(MITTE_QUER);
  });

  it('echtes Zuklappen während des Starts: das Logo folgt, an jeder Stelle richtig', () => {
    const seite = new Seite({ b: 867, h: 669, ...DUO_QUER }).laden();
    seite.bild();
    seite.bild();
    seite.werte = { b: 382, h: 678, ...DUO_HOCH };
    seite.ereignis('orientationchange');
    expect(seite.logo({ x: 0, y: 0, b: 382, h: 678 })).toEqual({ x: 233, y: 0.47 * 678 });
  });

  it('Werte, die sich widersprechen, ändern nach dem Erscheinen nichts', () => {
    const seite = new Seite({ b: 867, h: 669, ...DUO_QUER }).laden();
    seite.bild();
    seite.bild();
    seite.werte = { b: 466, h: 669, ...DUO_QUER };
    seite.ereignis('resize');
    seite.bild();
    expect(seite.streifen).toEqual({ links: 0, rechts: 84, oben: 0, unten: 0 });
  });

  it('hört auf Größenänderung, Drehung, screen.orientation und visualViewport', () => {
    const seite = new Seite({ b: 867, h: 669, ...DUO_QUER }).laden();
    for (const art of ['resize', 'orientationchange', 'orientierung:change', 'viewport:resize']) {
      expect(seite.hoerer.get(art)?.size, art).toBe(1);
    }
    seite.werte = { b: 867, h: 587, ...DUO_QUER };
    seite.ereignis('viewport:resize');
    expect(seite.streifen.oben).toBe(82);
    seite.werte = { b: 867, h: 669, ...DUO_QUER };
    seite.ereignis('orientierung:change');
    expect(seite.streifen.oben).toBe(0);
  });

  it('endet, sobald die App die Fläche entfernt hat: keine Bilder, keine Hörer, kein Zeitgeber', () => {
    const seite = new Seite({ b: 867, h: 669, ...DUO_QUER }).laden();
    seite.bild();
    seite.bild();
    seite.readyState = 'complete';
    seite.flaeche = false;
    seite.bild();
    expect(seite.bilder).toHaveLength(0);
    for (const set of seite.hoerer.values()) expect(set.size).toBe(0);
    expect(seite.zeitgeber).toHaveLength(0);
    expect(seite.attribut).toBe('fest');
  });

  it('Fläche entfernt, bevor das Logo erschien: das Attribut fällt weg, das Protokoll sagt „nicht gezeigt“', () => {
    const seite = new Seite({ b: 1280, h: 720, bildschirm: { b: 1920, h: 1080 } }).laden();
    seite.readyState = 'complete';
    seite.flaeche = false;
    seite.bild();
    expect(seite.attribut).toBeNull();
    expect(seite.protokoll.sichtbar).toBeNull();
  });

  it('misst höchstens 10 s in jedem Bild und merkt sich höchstens 20 Änderungen', () => {
    const seite = new Seite({ b: 867, h: 669, ...DUO_QUER }).laden();
    for (let i = 0; i < 30; i += 1) {
      seite.werte = { b: 867, h: i % 2 === 0 ? 669 : 587, ...DUO_QUER };
      seite.bild();
    }
    expect(seite.protokoll.aenderungen).toHaveLength(20);
    seite.zeit(10_000);
    seite.bild();
    expect(seite.bilder).toHaveLength(0);
  });
});
