// Lage der Startfläche (D-393). Das Startbild von iOS füllt den ganzen Bildschirm. Ist das Fenster
// der App kleiner, weil Systemstreifen daneben liegen (iPhone Duo), zeichnet die Startfläche ihre
// Grafik so groß wie der Bildschirm und verschiebt sie so, dass Logo und Claim dort stehen, wo sie
// im Startbild standen; beim Übergang springt dann nichts. Läuft vor dem ersten Bild und setzt nur
// CSS-Variablen (`--start-*` am Wurzelelement), die index.html für die Fläche nutzt. Extern, weil
// die CSP keine Inline-Skripte erlaubt. Die Rechnung steht als `window.__formStartLage` auch den
// Gerätedaten unter „Über die App“ zur Verfügung; src/app/startLage.test.ts prüft sie mit den
// Werten vom Gerät.
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

  function nahe(a, b) {
    return Math.abs(a - b) <= TOLERANZ;
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
   * des Fensters; sonst `null`.
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
   * rechts, Fenster links. Sonst ist die Lage nicht bekannt: `null`. `screenX` und `screenY`
   * zählen nicht; die Gerätedaten zeigen sie nur an.
   */
  function achse(rest, breite, oben) {
    if (rest < 1) return rest / 2;
    if (breite > 0 && nahe(rest, breite)) return oben ? rest : 0;
    return null;
  }

  /**
   * Größe und Lage der Grafik der Startfläche für eine Messung `{ fenster: { b, h }, bildschirm:
   * { b, h } | null }` in CSS-Pixeln. Ergebnis: `quelle` („bildschirm“ für `screen.*`, „duo“ für
   * die Maße des Duo, „fenster“, wenn nichts verlässlich ist), Größe des Bildschirms `b` × `h`,
   * Lage des Fensters darin `x`, `y` und die Verschiebung der Mitte der Fläche gegenüber der Mitte
   * des Fensters `dx`, `dy`. Ist die Lage des Fensters nicht bekannt, steht die Fläche mittig im
   * Fenster, ohne Verschiebung; geraten wird nichts.
   */
  function startLage(messung) {
    var fenster = messung.fenster;
    var mitte = { quelle: 'fenster', b: fenster.b, h: fenster.h, x: 0, y: 0, dx: 0, dy: 0 };
    var quelle = 'bildschirm';
    var bildschirm = plausibel(fenster, messung.bildschirm) ? messung.bildschirm : null;
    if (!bildschirm) {
      quelle = 'duo';
      bildschirm = duoBildschirm(fenster);
      if (!bildschirm) return mitte;
    }
    var s = streifen(bildschirm.b, bildschirm.h) || KEINE;
    var restB = Math.max(0, bildschirm.b - fenster.b);
    var restH = Math.max(0, bildschirm.h - fenster.h);
    var x = achse(restB, s.seite, false);
    var y = achse(restH, s.oben, true);
    if (x === null || y === null) return mitte;
    return {
      quelle: quelle,
      b: fenster.b + restB,
      h: fenster.h + restH,
      x: x,
      y: y,
      dx: restB / 2 - x,
      dy: restH / 2 - y,
    };
  }

  /** Werte des Geräts jetzt. */
  function messen() {
    var s = window.screen;
    return {
      fenster: { b: window.innerWidth, h: window.innerHeight },
      bildschirm: s ? { b: s.width, h: s.height } : null,
    };
  }

  /** Setzt Größe und Lage der Grafik; nach dem Start der App nicht mehr. */
  function anwenden() {
    if (document.readyState !== 'loading' && !document.getElementById('startflaeche')) {
      window.removeEventListener('resize', anwenden);
      return;
    }
    var lage = startLage(messen());
    var stil = document.documentElement.style;
    stil.setProperty('--start-b', lage.b + 'px');
    stil.setProperty('--start-h', lage.h + 'px');
    stil.setProperty('--start-x', -lage.x + 'px');
    stil.setProperty('--start-y', -lage.y + 'px');
    stil.setProperty('--start-kurz', Math.min(lage.b, lage.h) + 'px');
  }

  window.__formStartLage = startLage;
  try {
    anwenden();
    window.addEventListener('resize', anwenden);
  } catch (error) {
    // Ohne Rechnung steht die Fläche mittig im Fenster, wie ohne Systemstreifen.
  }
})();
