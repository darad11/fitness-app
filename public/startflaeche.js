// Lage der Startfläche (D-393, D-394). Das Startbild von iOS füllt den ganzen Bildschirm. Ist das
// Fenster der App kleiner, weil Systemstreifen daneben liegen (iPhone Duo), reicht die Grafik der
// Startfläche über die Streifen hinaus: Logo und Claim stehen dann dort, wo sie im Startbild
// standen, und beim Übergang springt nichts. Die Fläche richtet sich per CSS nach dem aktuellen
// Fenster (index.html, aus tools/splash.mjs); dieses Skript setzt nur die Breite der Streifen als
// CSS-Variablen `--start-links`, `--start-rechts`, `--start-oben` und `--start-unten`.
//
// Keine einmalige Messung (D-394): Beim Start des Duo meldet iOS manchmal noch Maße des
// zugeklappten Zustands. Gemessen wird deshalb in jedem Bild und bei jeder Größenänderung,
// Drehung und Änderung des visualViewport, solange die Fläche da ist. Das Logo bleibt unsichtbar
// (`data-startlage="warten"` am Wurzelelement), bis zwei aufeinanderfolgende Bilder gleiche Werte
// melden, die zu einer bekannten Haltung passen, höchstens 300 ms. Werte, die sich widersprechen,
// zählen nie.
//
// Extern, weil die CSP keine Inline-Skripte erlaubt. Die Rechnung steht als
// `window.__formStartLage`, die Messungen beim Start als `window.__formStartMessung` den
// Gerätedaten unter „Über die App“ zur Verfügung; src/app/startLage.test.ts prüft beides.
(function () {
  'use strict';

  /**
   * Displays des iPhone Duo in pt (hochkant `b` × `h`) und ihre Systemstreifen neben dem Fenster je
   * Ausrichtung: `seite` rechts, `oben` oben, 0 für keinen. Rechts liegt der Streifen an der
   * hinteren Kante, wie Apple es für das Duo beschreibt („Designing for iPhone Duo“, D-371).
   * Am Gerät gemessen (D-393): zugeklappt hoch rechts 84, aufgeklappt hoch oben 82, aufgeklappt
   * quer rechts 84 und, sobald die App läuft, oben 82 (beim Start war das Fenster quer noch so
   * hoch wie der Bildschirm). Zugeklappt quer nach Apple an der Seite; Safari ist dort 594 pt
   * breit, also wie hoch 84 pt schmaler als das Display (WebKit). Andere Seiten gelten nicht.
   */
  var DUO = [
    { b: 466, h: 678, hoch: { seite: 84, oben: 0 }, quer: { seite: 84, oben: 0 } },
    { b: 669, h: 951, hoch: { seite: 0, oben: 82 }, quer: { seite: 84, oben: 82 } },
  ];
  var KEINE = { seite: 0, oben: 0 };
  /** So viele pt Abweichung gelten noch als gleich. */
  var TOLERANZ = 2;
  /** Höchstens so viel größer als das Fenster ist ein plausibler Bildschirm (ein Streifen). */
  var STREIFEN_MAX = 120;
  /** Höchstens so lange bleibt das Logo beim Start unsichtbar (D-394); ebenso in index.html. */
  var WARTEN_MS = 300;
  /** So lange misst das Skript höchstens in jedem Bild; dann verbirgt index.html die Fläche. */
  var MESSEN_MS = 10000;
  /** Höchstens so viele Änderungen merkt sich das Protokoll des Starts. */
  var AENDERUNGEN_MAX = 20;

  function nahe(a, b) {
    return Math.abs(a - b) <= TOLERANZ;
  }

  /** Fenster so groß wie der Bildschirm, auch gedreht: iOS meldet `screen.*` immer hochkant. */
  function gleichGross(fenster, bildschirm) {
    return (
      (nahe(fenster.b, bildschirm.b) && nahe(fenster.h, bildschirm.h)) ||
      (nahe(fenster.b, bildschirm.h) && nahe(fenster.h, bildschirm.b))
    );
  }

  /**
   * Gemeldeter Bildschirm (`screen.width` und `screen.height`) nur, wenn er plausibel ist: in
   * beiden Richtungen mindestens so groß wie das Fenster, höchstens einen Streifen größer und
   * passend zur Ausrichtung des Fensters.
   */
  function plausibel(fenster, bildschirm) {
    if (!bildschirm || !(bildschirm.b > 0) || !(bildschirm.h > 0)) return false;
    var restB = bildschirm.b - fenster.b;
    var restH = bildschirm.h - fenster.h;
    var quer = fenster.b > fenster.h;
    var bildschirmQuer = bildschirm.b > bildschirm.h;
    var passt = bildschirm.b === bildschirm.h || bildschirmQuer === quer;
    return passt && restB >= 0 && restH >= 0 && restB <= STREIFEN_MAX && restH <= STREIFEN_MAX;
  }

  /** Streifen des Duo für einen Bildschirm `b` × `h` (in Ausrichtung), `null` für andere Geräte. */
  function streifen(b, h) {
    for (var i = 0; i < DUO.length; i += 1) {
      var d = DUO[i];
      if (nahe(b, d.b) && nahe(h, d.h)) return d.hoch;
      if (nahe(b, d.h) && nahe(h, d.b)) return d.quer;
    }
    return null;
  }

  /** Passt der Rest zwischen Bildschirm und Fenster zum Streifen (0, wenn es keinen gibt)? */
  function passtZu(rest, breite) {
    return nahe(rest, 0) || (breite > 0 && nahe(rest, breite));
  }

  /**
   * Display des Duo, zu dem das Fenster mit den Streifen dieses Displays passt, in der Ausrichtung
   * des Fensters: eine bekannte Haltung des Duo. Sonst `null`.
   */
  function duoBildschirm(fenster) {
    var quer = fenster.b > fenster.h;
    for (var i = 0; i < DUO.length; i += 1) {
      var d = DUO[i];
      var b = quer ? d.h : d.b;
      var h = quer ? d.b : d.h;
      var s = quer ? d.quer : d.hoch;
      if (passtZu(b - fenster.b, s.seite) && passtZu(h - fenster.h, s.oben)) return { b: b, h: h };
    }
    return null;
  }

  /**
   * Lage des Fensters auf einer Achse des Bildschirms (Abstand von links oder oben); `rest` ist der
   * Teil des Bildschirms neben dem Fenster. Ohne Rest mittig. Mit dem Streifen des Duo `breite`
   * daneben nach dessen offizieller Lage: `oben` Streifen oben, Fenster darunter; sonst Streifen
   * rechts, Fenster links. Sonst ist die Lage nicht bekannt: `null`.
   */
  function achse(rest, breite, oben) {
    if (rest < 1) return rest / 2;
    if (breite > 0 && nahe(rest, breite)) return oben ? rest : 0;
    return null;
  }

  /**
   * Kein iPhone Duo: Der gemeldete Bildschirm ist kein Display des Duo und, in der Ausrichtung des
   * Fensters, plausibel. Dann hängt die Lage nicht an Streifen des Duo; die Fläche steht mittig im
   * Fenster wie vor D-390 (etwa ein iPhone, dessen Fenster unter der Statusleiste beginnt).
   */
  function keinDuo(fenster, bildschirm) {
    if (!bildschirm || streifen(bildschirm.b, bildschirm.h)) return false;
    var bildschirmQuer = bildschirm.b > bildschirm.h;
    var fensterQuer = fenster.b > fenster.h;
    var gedreht =
      bildschirmQuer === fensterQuer ? bildschirm : { b: bildschirm.h, h: bildschirm.b };
    return plausibel(fenster, gedreht);
  }

  /**
   * Widerspruch in einer Messung: Die gemeldete Ausrichtung passt nicht zur Form des Fensters,
   * etwa ein Fenster mit der Breite des äußeren Displays (466 × 669, also hoch) bei Ausrichtung
   * quer. Solche Werte zählen nie (D-394). Gibt den Grund oder `null`.
   */
  function widerspruch(messung) {
    var fenster = messung.fenster;
    var ausrichtung = messung.ausrichtung;
    if (ausrichtung !== 'hoch' && ausrichtung !== 'quer') return null;
    if (fenster.b === fenster.h) return null;
    var fensterQuer = fenster.b > fenster.h;
    var gemeldetQuer = ausrichtung === 'quer';
    return fensterQuer === gemeldetQuer ? null : 'ausrichtung';
  }

  /** Lage ohne Streifen: mittig im Fenster. */
  function mittig(fenster, quelle, sicher, grund) {
    return {
      quelle: quelle,
      b: fenster.b,
      h: fenster.h,
      links: 0,
      rechts: 0,
      oben: 0,
      unten: 0,
      dx: 0,
      dy: 0,
      sicher: sicher,
      widerspruch: grund || null,
    };
  }

  /**
   * Größe und Lage der Grafik der Startfläche für eine Messung `{ fenster: { b, h }, bildschirm:
   * { b, h } | null, ausrichtung: 'hoch' | 'quer' | null }` in CSS-Pixeln. Ergebnis: `quelle`
   * („bildschirm“ für `screen.*`, „duo“ für die Maße des Duo, „fenster“, wenn nichts verlässlich
   * ist, „widerspruch“, wenn sich die Werte widersprechen), Größe des Bildschirms `b` × `h`, die
   * Streifen um das Fenster (`links`, `rechts`, `oben`, `unten`), die Verschiebung der Mitte der
   * Fläche gegenüber der Mitte des Fensters `dx`, `dy` (positiv nach rechts und unten) und
   * `sicher`: Die Werte passen zu einer bekannten Haltung des Duo, Fenster und Bildschirm sind
   * gleich groß, oder das Gerät ist kein Duo. Nur dann darf das Logo erscheinen, bevor 300 ms um
   * sind.
   */
  function startLage(messung) {
    var fenster = messung.fenster;
    var grund = widerspruch(messung);
    if (grund) return mittig(fenster, 'widerspruch', false, grund);
    var gemeldet = messung.bildschirm || null;
    if (gemeldet && gleichGross(fenster, gemeldet)) return mittig(fenster, 'bildschirm', true);
    var quelle = 'bildschirm';
    var bildschirm = plausibel(fenster, gemeldet) ? gemeldet : null;
    if (!bildschirm) {
      quelle = 'duo';
      bildschirm = duoBildschirm(fenster);
      if (!bildschirm) return mittig(fenster, 'fenster', keinDuo(fenster, gemeldet));
    }
    var s = streifen(bildschirm.b, bildschirm.h) || KEINE;
    var restB = Math.max(0, bildschirm.b - fenster.b);
    var restH = Math.max(0, bildschirm.h - fenster.h);
    var x = achse(restB, s.seite, false);
    var y = achse(restH, s.oben, true);
    // Lage des Fensters nicht bekannt: nichts raten, mittig im Fenster.
    if (x === null || y === null) return mittig(fenster, 'fenster', keinDuo(fenster, gemeldet));
    return {
      quelle: quelle,
      b: fenster.b + restB,
      h: fenster.h + restH,
      links: x,
      rechts: restB - x,
      oben: y,
      unten: restH - y,
      dx: restB / 2 - x,
      dy: restH / 2 - y,
      sicher: true,
      widerspruch: null,
    };
  }

  function jetzt() {
    return window.performance.now();
  }

  /**
   * Werte des Geräts jetzt: das Fenster, wie die Fläche es zeichnet (`clientWidth` und
   * `clientHeight` des Wurzelelements), dazu `innerWidth` und `innerHeight`, `screen.*` und die
   * Ausrichtung aus `screen.orientation`, sonst aus `window.orientation`. `t` in ms seit dem
   * Beginn der Navigation.
   */
  function messen() {
    var root = document.documentElement;
    var s = window.screen;
    var o = s && s.orientation;
    var typ = o && typeof o.type === 'string' ? o.type : null;
    var alt = typeof window.orientation === 'number' ? window.orientation : null;
    var winkel = o && typeof o.angle === 'number' ? o.angle : alt;
    var ausrichtung = null;
    if (typ) ausrichtung = typ.indexOf('landscape') === 0 ? 'quer' : 'hoch';
    else if (alt !== null) ausrichtung = Math.abs(alt) === 90 ? 'quer' : 'hoch';
    return {
      t: Math.round(jetzt()),
      fenster: {
        b: root.clientWidth || window.innerWidth,
        h: root.clientHeight || window.innerHeight,
      },
      innen: { b: window.innerWidth, h: window.innerHeight },
      bildschirm: s ? { b: s.width, h: s.height } : null,
      ausrichtung: ausrichtung,
      typ: typ,
      winkel: winkel,
    };
  }

  /** Gleiche Maße und gleiche Ausrichtung in zwei Messungen. */
  function gleich(a, b) {
    if (!a || !b) return false;
    var bildschirm =
      a.bildschirm && b.bildschirm
        ? a.bildschirm.b === b.bildschirm.b && a.bildschirm.h === b.bildschirm.h
        : a.bildschirm === b.bildschirm;
    return (
      bildschirm &&
      a.fenster.b === b.fenster.b &&
      a.fenster.h === b.fenster.h &&
      a.innen.b === b.innen.b &&
      a.innen.h === b.innen.h &&
      a.ausrichtung === b.ausrichtung &&
      a.typ === b.typ &&
      a.winkel === b.winkel
    );
  }

  /**
   * Protokoll des Starts für die Gerätedaten: die erste Messung, jede Änderung danach mit ihrer
   * Zeit und wann das Logo erschien (`stabil`, sonst `zeit` nach 300 ms). Nur im Speicher der
   * Seite, nichts wird gespeichert oder übertragen.
   */
  var protokoll = { erste: null, aenderungen: [], sichtbar: null };
  var gemerkt = null;

  function merken(messung) {
    if (!protokoll.erste) {
      protokoll.erste = messung;
    } else if (gleich(messung, gemerkt)) {
      return;
    } else if (protokoll.aenderungen.length < AENDERUNGEN_MAX) {
      protokoll.aenderungen.push(messung);
    }
    gemerkt = messung;
  }

  var gesetzt = null;

  /** Setzt die Streifen als CSS-Variablen, wenn sie sich geändert haben. */
  function setzen(lage) {
    if (
      gesetzt &&
      gesetzt.links === lage.links &&
      gesetzt.rechts === lage.rechts &&
      gesetzt.oben === lage.oben &&
      gesetzt.unten === lage.unten
    ) {
      return;
    }
    var stil = document.documentElement.style;
    stil.setProperty('--start-links', lage.links + 'px');
    stil.setProperty('--start-rechts', lage.rechts + 'px');
    stil.setProperty('--start-oben', lage.oben + 'px');
    stil.setProperty('--start-unten', lage.unten + 'px');
    gesetzt = lage;
  }

  var beginn = jetzt();
  var gezeigt = false;
  var aktiv = true;
  /** Messung im letzten Bild, wenn sie zum Zeigen reichte; sonst `null`. */
  var vorher = null;
  var zeitgeber = null;
  var orientierung = window.screen && window.screen.orientation;

  function zeigen(grund) {
    if (gezeigt) return;
    gezeigt = true;
    document.documentElement.setAttribute('data-startlage', 'fest');
    protokoll.sichtbar = { t: Math.round(jetzt()), grund: grund };
  }

  /**
   * Misst und setzt die Streifen, wenn die Werte sich nicht widersprechen. Im Takt der Bilder
   * (`imBild`) erscheint das Logo, sobald zwei aufeinanderfolgende Bilder gleiche Werte melden,
   * die zum Zeigen reichen; spätestens nach 300 ms.
   */
  function pruefen(imBild) {
    var messung = messen();
    merken(messung);
    var lage = startLage(messung);
    if (!lage.widerspruch) setzen(lage);
    if (imBild) {
      if (lage.sicher && gleich(messung, vorher)) zeigen('stabil');
      vorher = lage.sicher ? messung : null;
    }
    if (jetzt() - beginn >= WARTEN_MS) zeigen('zeit');
  }

  /** Fläche entfernt: Die App ist gestartet. */
  function fertig() {
    return document.readyState !== 'loading' && !document.getElementById('startflaeche');
  }

  function beenden() {
    if (!aktiv) return;
    aktiv = false;
    window.clearTimeout(zeitgeber);
    window.removeEventListener('resize', ereignis);
    window.removeEventListener('orientationchange', ereignis);
    if (orientierung && orientierung.removeEventListener) {
      orientierung.removeEventListener('change', ereignis);
    }
    if (window.visualViewport) window.visualViewport.removeEventListener('resize', ereignis);
    if (!gezeigt) document.documentElement.removeAttribute('data-startlage');
  }

  /** Größenänderung, Drehung, Änderung des visualViewport: sofort neu setzen. */
  function ereignis() {
    if (!aktiv) return;
    if (fertig()) {
      beenden();
      return;
    }
    pruefen(false);
  }

  /** In jedem Bild messen, solange die Fläche da ist. */
  function bild() {
    if (!aktiv) return;
    if (fertig() || jetzt() - beginn > MESSEN_MS) {
      beenden();
      return;
    }
    pruefen(true);
    window.requestAnimationFrame(bild);
  }

  window.__formStartLage = startLage;
  window.__formStartMessung = protokoll;
  try {
    zeitgeber = window.setTimeout(function () {
      if (!aktiv) return;
      pruefen(false);
      zeigen('zeit');
    }, WARTEN_MS);
    document.documentElement.setAttribute('data-startlage', 'warten');
    pruefen(false);
    window.addEventListener('resize', ereignis);
    window.addEventListener('orientationchange', ereignis);
    if (orientierung && orientierung.addEventListener) {
      orientierung.addEventListener('change', ereignis);
    }
    if (window.visualViewport) window.visualViewport.addEventListener('resize', ereignis);
    window.requestAnimationFrame(bild);
  } catch (error) {
    // Ohne Rechnung steht die Fläche mittig im Fenster; das Logo zeigt index.html nach 300 ms.
  }
})();
