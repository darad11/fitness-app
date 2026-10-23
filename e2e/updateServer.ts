import { execFile } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { extname, join, normalize, resolve } from 'node:path';
import { promisify } from 'node:util';

/**
 * Zwei echte Builds nacheinander (alte und neue Version) und ein Server, der wie Vercel ausliefert
 * (E-16, D-343): Dateien des aktiven Builds, alles andere als `index.html` (Rewrite aus
 * `vercel.json`), dazu die Header aus `vercel.json`. Ein „Deployment" schaltet den aktiven Build
 * um; danach gibt es die gehashten Dateien der alten Version nicht mehr, wie bei Vercel.
 */

const run = promisify(execFile);
const ROOT = resolve(import.meta.dirname, '..');
const OUT = join(ROOT, 'node_modules', '.cache', 'form-e2e-update');

export type Version = 'a' | 'b';

/** Build-Kennung je Version; „Über die App" zeigt sie unter „Build". */
export const BUILD_SHA: Record<Version, string> = { a: 'aaaaaaa', b: 'bbbbbbb' };

/** Baut beide Versionen in `node_modules/.cache/form-e2e-update/{a,b}`. */
export async function buildVersions(): Promise<void> {
  const vite = join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
  for (const version of ['a', 'b'] as const) {
    await run(
      process.execPath,
      [vite, 'build', '--outDir', join(OUT, version), '--emptyOutDir', '--logLevel', 'error'],
      {
        cwd: ROOT,
        env: { ...process.env, VERCEL_GIT_COMMIT_SHA: BUILD_SHA[version] },
        maxBuffer: 16 * 1024 * 1024,
      },
    );
  }
}

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.txt': 'text/plain; charset=utf-8',
};

interface VercelConfig {
  headers: { source: string; headers: { key: string; value: string }[] }[];
}

const vercel = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8')) as VercelConfig;
const headerRules = vercel.headers.map((rule) => ({
  pattern: new RegExp(`^${rule.source}$`),
  headers: rule.headers,
}));

export interface UpdateServer {
  readonly origin: string;
  /** Neues Deployment: ab jetzt liefert der Server nur noch diese Version aus. */
  deploy(version: Version): void;
  close(): Promise<void>;
}

export async function startUpdateServer(initial: Version = 'a'): Promise<UpdateServer> {
  let active: Version = initial;
  const server: Server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
    const dir = join(OUT, active);
    const candidate = normalize(join(dir, path));
    const isFile =
      candidate.startsWith(dir) && existsSync(candidate) && statSync(candidate).isFile();
    // Wie Vercel: zuerst das Dateisystem, sonst der Rewrite auf index.html (Status 200).
    const file = isFile ? candidate : join(dir, 'index.html');
    for (const rule of headerRules) {
      if (!rule.pattern.test(path)) continue;
      for (const { key, value } of rule.headers) res.setHeader(key, value);
    }
    res.setHeader('Content-Type', TYPES[extname(file)] ?? 'application/octet-stream');
    res.statusCode = 200;
    res.end(req.method === 'HEAD' ? undefined : readFileSync(file));
  });
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  const { port } = server.address() as AddressInfo;
  return {
    origin: `http://127.0.0.1:${String(port)}`,
    deploy(version) {
      active = version;
    },
    close: () =>
      new Promise<void>((done) => {
        server.closeAllConnections();
        server.close(() => {
          done();
        });
      }),
  };
}
