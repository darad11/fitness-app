// Prüft die komprimierte Größe der Startansicht (testing.md Abschnitt 5: unter 250 KB gzip).
// Startansicht = index.html selbst (mit der Startfläche, D-325) und die Skripte im Kopf, der
// Einstieg mit allen statischen Importen und CSS plus die nachgeladene Seite „Heute" mit ihren
// Importen.
// Voraussetzung: `pnpm build`.
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const LIMIT_KB = 250;
const START_PAGE = 'src/modules/dashboard/ui/TodayPage.tsx';
const dist = new URL('../dist/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('.vite/manifest.json', dist), 'utf8'));

const files = new Set(['index.html']);
function collect(key) {
  const chunk = manifest[key];
  if (!chunk) throw new Error(`Eintrag fehlt im Vite-Manifest: ${key}`);
  if (files.has(chunk.file)) return;
  files.add(chunk.file);
  for (const css of chunk.css ?? []) files.add(css);
  for (const imported of chunk.imports ?? []) collect(imported);
}
collect('index.html');
collect(START_PAGE);
// Klassische Skripte aus public/ im Kopf (`theme-init.js`, `startflaeche.js`): Sie laden vor dem
// ersten Bild, stehen aber nicht im Vite-Manifest (D-393).
const html = readFileSync(new URL('index.html', dist), 'utf8');
for (const match of html.matchAll(/<script src="\/([^"]+\.js)"><\/script>/g)) {
  files.add(match[1]);
}

let total = 0;
for (const file of [...files].sort()) {
  const size = gzipSync(readFileSync(new URL(file, dist))).length;
  total += size;
  console.log(`${(size / 1024).toFixed(1).padStart(7)} KB  ${file}`);
}
const totalKb = total / 1024;
console.log(
  `${totalKb.toFixed(1).padStart(7)} KB  Summe Startansicht (gzip), Grenze ${LIMIT_KB} KB`,
);
if (totalKb > LIMIT_KB) {
  console.error('Bündelgröße der Startansicht überschritten');
  process.exit(1);
}
