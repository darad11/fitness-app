// Setzt das Farbschema vor dem ersten Bild aus der Kopie der Einstellung (src/shared/ui/theme.ts).
// Quelle der Wahrheit sind die Einstellungen in der Datenbank; ThemeSync gleicht danach ab.
(function () {
  try {
    var root = document.documentElement;
    var preference = localStorage.getItem('fitness.theme');
    if (preference !== 'dark' && preference !== 'system') preference = 'light';
    if (preference === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', preference);
    var dark =
      preference === 'dark' ||
      (preference === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#212a3f' : '#f5f8fd');
  } catch (error) {
    // Ohne localStorage bleibt die Standarddarstellung „Hell".
  }
})();
