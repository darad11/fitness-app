// Prüft nach `pnpm build`, dass der Service Worker jede Datei der App vorab speichert (E-16, D-343).
// Fehlt eine Datei (Muster, Ausnahme oder Größengrenze von Workbox, 2 MiB), käme sie ohne Netz
// nicht aus dem Speicher, und der Bereich bliebe leer.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const sw = readFileSync(join(dist, 'sw.js'), 'utf8');
const entries = [...sw.matchAll(/\{url:"([^"]+)",revision:(?:"([0-9a-f]+)"|null)\}/g)].map((m) => ({
  url: m[1],
  revision: m[2],
}));
const precached = new Set(entries.map((entry) => entry.url));

// Bewusst nicht vorab gespeichert: der Service Worker selbst, seine Laufzeit, das Manifest von
// Vite und große Bilder, die die App offline nicht braucht (vite.config.ts, globIgnores).
const IGNORED = [
  /^sw\.js$/,
  /^workbox-[\w-]+\.js$/,
  /^\.vite\//,
  /^icons\/icon-1024\.png$/,
  /^brand\/.+\.png$/,
  /^splash\/.+\.png$/,
  // Bilder der Übungen lädt der Service Worker bei Bedarf, nicht vorab (D-397).
  /^uebungen\/medien\//,
];

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [relative(dist, path).split('\\').join('/')];
  });
}

const files = walk(dist);
const missing = files.filter(
  (file) => !precached.has(file) && !IGNORED.some((re) => re.test(file)),
);
const stale = [...precached].filter((url) => !files.includes(url));
// Jede Prüfsumme muss zur Datei im Build passen (D-396): Workbox rechnet sie aus der Datei, die es
// findet. Kommt eine Datei zweimal (aus public/ und aus dist/) mit verschiedenem Inhalt, scheitert
// die Installation des Service Workers. Die Skripte im Kopf werden beim Bauen verkleinert.
const wrong = entries.filter(
  ({ url, revision }) =>
    revision !== undefined &&
    files.includes(url) &&
    createHash('md5')
      .update(readFileSync(join(dist, url)))
      .digest('hex') !== revision,
);
console.log(`Vorab gespeichert: ${precached.size} von ${files.length} Dateien`);
if (missing.length > 0 || stale.length > 0 || wrong.length > 0) {
  for (const file of missing) console.error(`fehlt im Service Worker: ${file}`);
  for (const { url } of wrong) console.error(`Prüfsumme passt nicht zur Datei im Build: ${url}`);
  for (const url of stale) console.error(`im Service Worker, aber nicht im Build: ${url}`);
  process.exit(1);
}
