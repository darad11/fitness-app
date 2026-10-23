import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

/**
 * Vorübergehende Diagnose (D-344, Nachtrag): In WebKit startet die App nach dem automatischen
 * Neuladen des Startwächters nicht (`start-watch.spec.ts` Fall 1, in der CI 40 von 40 rot),
 * nach einem Neuladen per Knopf schon (Fall 2). WebKit läuft nur in der CI. Dieser Test spielt
 * dieselbe Lage mit vier Fassungen des Neuladens durch und schreibt auf, was die Seite lädt und
 * zeigt. Er prüft nichts und fliegt mit der Behebung wieder hinaus.
 */
test.use({ serviceWorkers: 'block' });

const RELOAD = 'location.reload();\n    return true;';

const VARIANTS: Record<string, string> = {
  jetzt: RELOAD,
  'nach load': `if (document.readyState === 'complete') setTimeout(function () { location.reload(); }, 0);
    else window.addEventListener('load', function () { setTimeout(function () { location.reload(); }, 0); });
    return true;`,
  'nach 1 s': 'setTimeout(function () { location.reload(); }, 1000);\n    return true;',
  replace: 'location.replace(location.href);\n    return true;',
};

function short(url: string) {
  const { pathname } = new URL(url);
  return pathname.replace(/^\/assets\//, '').replace(/-[\w-]{8}\.js$/, '.js');
}

async function trace(page: Page, log: string[]) {
  let documents = 0;
  const at = Date.now();
  const stamp = (text: string) => log.push(`${String(Date.now() - at)} ${text}`);
  await page.route(
    (url) => url.pathname === '/heute',
    async (route) => {
      if (route.request().resourceType() === 'document') {
        documents += 1;
        stamp(`Dokument ${String(documents)}`);
      }
      await route.continue();
    },
  );
  await page.route('**/assets/ui-*.js', async (route) => {
    const abort = documents === 1;
    stamp(`ui ${abort ? 'abgebrochen' : 'durchgelassen'}`);
    if (abort) await route.abort();
    else await route.continue();
  });
  page.on('requestfailed', (request) => {
    stamp(`fehlgeschlagen ${short(request.url())}: ${request.failure()?.errorText ?? ''}`);
  });
  page.on('response', (response) => {
    if (/\/assets\/(ui|index)-/.test(response.url()))
      stamp(`Antwort ${short(response.url())} ${String(response.status())}`);
  });
  page.on('console', (message) => {
    stamp(`Konsole ${message.type()}: ${message.text().slice(0, 160)}`);
  });
  page.on('pageerror', (error) => {
    stamp(`Ausnahme: ${error.message.slice(0, 160)}`);
  });
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) stamp(`navigiert ${new URL(frame.url()).pathname}`);
  });
  page.on('domcontentloaded', () => stamp('DOMContentLoaded'));
  page.on('load', () => stamp('load'));
  return () => documents;
}

for (const [name, code] of Object.entries(VARIANTS)) {
  test(`Diagnose Startwächter: Neuladen ${name}`, async ({ page, consoleErrors }, testInfo) => {
    const log: string[] = [];
    await page.route('**/theme-init.js', async (route) => {
      const response = await route.fetch();
      const body = (await response.text()).replace(RELOAD, code);
      await route.fulfill({ response, body });
    });
    const documents = await trace(page, log);
    await page.goto('/heute');
    const heading = page.getByRole('heading', { level: 1 });
    const started = await expect(page.getByRole('heading', { level: 1, name: /^Heute/ }))
      .toBeVisible({ timeout: 8000 })
      .then(
        () => true,
        () => false,
      );
    const state = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as
        PerformanceNavigationTiming | undefined;
      const scripts = performance
        .getEntriesByType('resource')
        .filter((e) => /\/assets\/(ui|index)-/.test(e.name))
        .map((e) => `${e.name.split('/').pop() ?? ''}:${String(Math.round(e.duration))}ms`);
      return {
        ready: document.readyState,
        root: document.getElementById('root')?.childElementCount ?? -1,
        surface: Boolean(document.getElementById('startflaeche')),
        failed: (window as { __formStartFailed?: boolean }).__formStartFailed ?? null,
        marker: sessionStorage.getItem('form.startReloadAt') !== null,
        navigation: nav?.type ?? null,
        scripts,
      };
    });
    const h1 = await heading.allTextContents();
    console.log(
      `DIAGNOSE ${testInfo.project.name} „${name}“: gestartet=${String(started)} Dokumente=${String(documents())} h1=${JSON.stringify(h1)} Zustand=${JSON.stringify(state)}\n  ${log.join('\n  ')}`,
    );
    consoleErrors.splice(0, consoleErrors.length);
  });
}
