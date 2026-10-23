import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

/**
 * Vorübergehende Gegenprobe (D-344, Nachtrag): In WebKit startete die App nach dem Neuladen des
 * Startwächters nicht, weil WebKit ein fehlgeschlagenes Vorladen (`<link rel="modulepreload">`)
 * im Speicher behält, solange die alte Seite lebt; die neue Seite fragte den Teil gar nicht erst
 * an (Diagnose in der CI zu `505cc1a`). Seitdem enthält index.html kein Vorladen mehr. Dieser
 * Test lädt dieselbe App einmal so und einmal mit dem früheren Vorladen und schreibt auf, was
 * die Seite lädt und zeigt. Er fällt nach der Bestätigung in der CI wieder weg.
 */
test.use({ serviceWorkers: 'block' });

/** Statische Importe des Einstiegs, wie Vite sie früher vorgeladen hat. */
function preloadLinks(): string {
  const manifest = JSON.parse(readFileSync('dist/.vite/manifest.json', 'utf8')) as Record<
    string,
    { file: string; imports?: string[] }
  >;
  const files: string[] = [];
  const visit = (key: string) => {
    for (const imported of manifest[key]?.imports ?? []) {
      const file = manifest[imported]?.file;
      if (!file || files.includes(file)) continue;
      files.push(file);
      visit(imported);
    }
  };
  visit('index.html');
  return files.map((file) => `<link rel="modulepreload" crossorigin href="/${file}">`).join('');
}

function short(url: string) {
  return new URL(url).pathname.replace(/^\/assets\//, '').replace(/-[\w-]{8}\.js$/, '.js');
}

async function trace(page: Page, log: string[], withPreload: boolean) {
  let documents = 0;
  const at = Date.now();
  const stamp = (text: string) => log.push(`${String(Date.now() - at)} ${text}`);
  const links = withPreload ? preloadLinks() : '';
  await page.route(
    (url) => url.pathname === '/heute',
    async (route) => {
      if (route.request().resourceType() !== 'document') return route.continue();
      documents += 1;
      stamp(`Dokument ${String(documents)}`);
      const response = await route.fetch();
      const html = await response.text();
      const body = withPreload
        ? html.replace('<script type="module"', `${links}<script type="module"`)
        : html;
      stamp(`Vorladen im Dokument: ${String((body.match(/rel="modulepreload"/g) ?? []).length)}`);
      return route.fulfill({ response, body });
    },
  );
  await page.route('**/assets/ui-*.js', async (route) => {
    const abort = documents === 1;
    stamp(`ui ${abort ? 'abgebrochen' : 'durchgelassen'}`);
    if (abort) await route.abort();
    else await route.continue();
  });
  page.on('requestfailed', (request) => {
    if (request.url().includes('/assets/ui-'))
      stamp(`fehlgeschlagen ${short(request.url())}: ${request.failure()?.errorText ?? ''}`);
  });
  page.on('pageerror', (error) => {
    stamp(`Ausnahme: ${error.message.slice(0, 160)}`);
  });
  return () => documents;
}

for (const withPreload of [false, true]) {
  const name = withPreload ? 'mit Vorladen (alter Aufbau)' : 'ohne Vorladen (neu)';
  test(`Gegenprobe Startwächter: ${name}`, async ({ page, consoleErrors }, testInfo) => {
    const log: string[] = [];
    const documents = await trace(page, log, withPreload);
    await page.goto('/heute');
    const started = await expect(page.getByRole('heading', { level: 1, name: /^Heute/ }))
      .toBeVisible({ timeout: 8000 })
      .then(
        () => true,
        () => false,
      );
    const h1 = await page.getByRole('heading', { level: 1 }).allTextContents();
    console.log(
      `GEGENPROBE ${testInfo.project.name} „${name}“: gestartet=${String(started)} Dokumente=${String(documents())} h1=${JSON.stringify(h1)}\n  ${log.join('\n  ')}`,
    );
    consoleErrors.splice(0, consoleErrors.length);
  });
}
