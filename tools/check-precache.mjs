// Prüft nach `pnpm build`, dass der Service Worker jede Datei der App vorab speichert (E-16, D-343).
// Fehlt eine Datei (Muster, Ausnahme oder Größengrenze von Workbox, 2 MiB), käme sie ohne Netz
// nicht aus dem Speicher, und der Bereich bliebe leer.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const sw = readFileSync(join(dist, 'sw.js'), 'utf8');
const precached = new Set([...sw.matchAll(/\{url:"([^"]+)",revision:/g)].map((m) => m[1]));

// Bewusst nicht vorab gespeichert: der Service Worker selbst, seine Laufzeit, das Manifest von
// Vite und große Bilder, die die App offline nicht braucht (vite.config.ts, globIgnores).
const IGNORED = [
  /^sw\.js$/,
  /^workbox-[\w-]+\.js$/,
  /^\.vite\//,
  /^icons\/icon-1024\.png$/,
  /^brand\/.+\.png$/,
  /^splash\/.+\.png$/,
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
console.log(`Vorab gespeichert: ${precached.size} von ${files.length} Dateien`);
if (missing.length > 0 || stale.length > 0) {
  for (const file of missing) console.error(`fehlt im Service Worker: ${file}`);
  for (const url of stale) console.error(`im Service Worker, aber nicht im Build: ${url}`);
  process.exit(1);
}
