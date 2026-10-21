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
