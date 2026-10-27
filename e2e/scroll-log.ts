import type { Page } from '@playwright/test';

/**
 * Mitschrift für die Meldung eines fehlgeschlagenen Tests (Nachtrag zu D-384): Größenwechsel
 * (Fenster und Maßstab des sichtbaren Bereichs), Scrollen des Rahmens und jeder Aufruf von
 * `scrollTo` und `scrollBy` am Rahmen mit der Stelle im Code. Zum Nachsehen, wenn ein Test nur in
 * WebKit in der CI scheitert.
 */
export async function startScrollLog(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as unknown as { scrollLog?: string[] };
    if (w.scrollLog) return;
    const log: string[] = [];
    w.scrollLog = log;
    const start = performance.now();
    const at = () => String(Math.round(performance.now() - start));
    const frame = document.getElementById('seite');
    window.addEventListener('resize', () => {
      const scale = window.visualViewport?.scale ?? 1;
      log.push(
        `resize ${at()}: ${String(window.innerWidth)}×${String(window.innerHeight)}, Maßstab ${String(scale)}`,
      );
    });
    frame?.addEventListener(
      'scroll',
      () => {
        log.push(`scroll ${at()}: s${String(frame.scrollTop)}`);
      },
      { passive: true },
    );
    const proto = Element.prototype as unknown as Record<
      'scrollTo' | 'scrollBy',
      (...args: unknown[]) => void
    >;
    for (const name of ['scrollTo', 'scrollBy'] as const) {
      const original = proto[name];
      proto[name] = function (this: Element, ...args: unknown[]) {
        if (this.id === 'seite') {
          const where = (new Error().stack ?? '')
            .split('\n')
            .filter((line) => !line.startsWith('Error'))
            .slice(1, 3)
            .map((line) => line.trim().slice(0, 40))
            .join(' < ');
          log.push(`${name} ${at()}: ${JSON.stringify(args[0])} ${where}`);
        }
        Reflect.apply(original, this, args);
      };
    }
  });
}

/** Mitschrift seit dem letzten Abruf; mehrere Scroll-Ereignisse hintereinander als eines. */
export async function takeScrollLog(page: Page): Promise<string> {
  const entries = await page.evaluate(() => {
    const w = window as unknown as { scrollLog?: string[] };
    return (w.scrollLog ?? []).splice(0);
  });
  const out: string[] = [];
  let run: string[] = [];
  const flush = () => {
    if (run.length > 2) out.push(`${run[0] ?? ''} … ${run.at(-1) ?? ''} (${String(run.length)}×)`);
    else out.push(...run);
    run = [];
  };
  for (const entry of entries) {
    if (entry.startsWith('scroll ')) {
      run.push(entry);
      continue;
    }
    flush();
    out.push(entry);
  }
  flush();
  return out.join(' | ');
}
