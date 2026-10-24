// Setzt das Farbschema vor dem ersten Bild. Ausgeliefert wird nur Dunkel (D-308, src/shared/ui/theme.ts);
// die gespeicherte Kopie der Einstellung (localStorage) wirkt erst, wenn ein heller Modus freigegeben ist.
(function () {
  try {
    document.documentElement.setAttribute('data-theme', 'dark');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', '#0c1219');
  } catch (error) {
    // Das Attribut steht schon in index.html; hier geht nichts verloren.
  }
})();

// Merkt sich das erste Bild der Seite für die Startfläche (D-337): Safari meldet für die
// Fläche ohne Text keinen Paint-Eintrag; src/app/startSurface.ts zählt die Mindestzeit auch ab hier.
(function () {
  try {
    requestAnimationFrame(function (time) {
      window.__startFrame = time;
    });
  } catch (error) {
    // Ohne den Zeitpunkt zählt die Startfläche ab dem ersten Paint-Eintrag.
  }
})();

// Startwächter (E-16, D-343): Lässt sich das Einstiegsmodul oder einer seiner Teile nicht laden,
// startet die App nicht und meldet keinen Fehler; die Seite bliebe leer. Chromium bricht unter
// einem Service Worker gelegentlich Modul-Anfragen ab. Dann einmal neu laden; ein zweites Mal
// innerhalb von fünf Minuten nicht (Schleifenschutz), sondern ein Hinweis mit „Neu laden“.
// Die Texte stehen gleich in src/shared/i18n/de.ts (`errors.startTitle`, `errors.chunkText`,
// `common.reload`); wording.test.ts vergleicht sie.
(function () {
  var KEY = 'form.startReloadAt';
  var GUARD_MS = 5 * 60 * 1000;
  var TITLE = 'FORM ließ sich nicht starten';
  var TEXT = 'Lade die App neu. Deine Daten bleiben erhalten.';
  var BUTTON = 'Neu laden';

  function showHint() {
    var surface = document.getElementById('startflaeche');
    if (surface) surface.remove();
    var main = document.createElement('main');
    main.setAttribute('role', 'alert');
    main.style.cssText = 'max-width:36rem;margin:0 auto;padding:4rem 1.5rem;color:var(--fg)';
    var title = document.createElement('h1');
    title.textContent = TITLE;
    title.style.cssText = 'font-size:1.5rem;font-weight:600;margin:0 0 0.5rem';
    var text = document.createElement('p');
    text.textContent = TEXT;
    text.style.cssText = 'color:var(--fg-muted);margin:0 0 1.5rem';
    var button = document.createElement('button');
    button.type = 'button';
    button.textContent = BUTTON;
    button.style.cssText =
      'min-height:3.25rem;padding:0 1.5rem;border:0;border-radius:14px;font:inherit;font-weight:600;background:var(--accent);color:var(--accent-fg)';
    button.addEventListener('click', function () {
      location.reload();
    });
    main.appendChild(title);
    main.appendChild(text);
    main.appendChild(button);
    document.body.appendChild(main);
  }

  function reloadOnce() {
    try {
      var now = Date.now();
      var last = Number(sessionStorage.getItem(KEY));
      if (last > 0 && now >= last && now - last < GUARD_MS) return false;
      sessionStorage.setItem(KEY, String(now));
      if (sessionStorage.getItem(KEY) !== String(now)) return false;
    } catch (error) {
      // Ohne sessionStorage kein Schleifenschutz, also kein automatisches Neuladen.
      return false;
    }
    location.reload();
    return true;
  }

  try {
    window.addEventListener(
      'error',
      function (event) {
        var target = event.target;
        if (!target || target.tagName !== 'SCRIPT' || target.type !== 'module') return;
        if (window.__formStartFailed) return;
        window.__formStartFailed = true;
        if (!reloadOnce()) {
          if (document.body) showHint();
          else document.addEventListener('DOMContentLoaded', showHint);
        }
      },
      true,
    );
  } catch (error) {
    // Ohne Wächter startet die App wie bisher.
  }
})();
