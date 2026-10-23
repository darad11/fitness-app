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
