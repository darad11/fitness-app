import type { Locator, Page } from '@playwright/test';
import { setDuoPose } from './duo';
import { expect, openPage, test } from './fixtures';

/**
 * Wiedergabe der Übungsschleifen (D-497). Safari startet `autoplay` nur, solange es das Video für
 * sichtbar hält; in der festen rechten Spalte des Players tat es das am Gerät nicht, die
 * Beinpresse stand nach dem Start still. Im Stromsparmodus startet iOS Videos nur aus einer Geste.
 * Beides lässt sich in Chromium und WebKit unter Linux nicht direkt auslösen; die Tests stellen
 * es mit einem Skript vor dem Laden der Seite nach.
 */

/** Safari: `autoplay` startet das Video nicht (Sichtbarkeit falsch eingeschätzt). */
const AUTOPLAY_IGNORED = `(() => {
  const set = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (name, value) {
    if (this instanceof HTMLMediaElement && String(name).toLowerCase() === 'autoplay') return;
    return set.call(this, name, value);
  };
  Object.defineProperty(HTMLMediaElement.prototype, 'autoplay', {
    configurable: true,
    get() { return false; },
    set() {},
  });
})();`;

/** Stromsparmodus am iPhone: `play()` nur während einer Geste, sonst abgelehnt. */
const GESTURE_ONLY = `(() => {
  let gesture = false;
  const start = () => {
    gesture = true;
    setTimeout(() => { gesture = false; }, 0);
  };
  for (const type of ['click', 'touchend', 'keydown', 'pointerup']) {
    window.addEventListener(type, start, true);
  }
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    if (!gesture) return Promise.reject(new DOMException('Nur aus einer Geste', 'NotAllowedError'));
    return play.call(this);
  };
})();`;

/** „Ganzkörper A/B“ mit den Dateien ihrer Schleifen, in der Reihenfolge des Programms. */
const DAYS = [
  ['beinpresse', 'bankdruecken_kh', 'rudern_kabel', 'schulterdruecken_maschine', 'unterarmstuetz'],
  [
    'rumaenisches_kreuzheben_kh',
    'latziehen',
    'schraegbankdruecken_kh',
    'beinbeuger_liegend',
    'seitheben_kh',
    'crunch',
  ],
];

/** Adresse einer Schleife mit Prüfsumme im Namen (D-494), MP4 oder WebM. */
function medium(stem: string, ext = '(?:mp4|webm)'): RegExp {
  return new RegExp(`^/uebungen/medien/${stem}-[0-9a-f]{8}\\.${ext}$`);
}

/** Endung der Fassung, die die App in diesem Browser zuerst spielt: MP4 (H.264) vor WebM. */
async function loopExt(page: Page): Promise<string> {
  return page.evaluate(() => {
    const probe = document.createElement('video');
    if (probe.canPlayType('video/mp4; codecs="avc1.64001E"') !== '') return 'mp4';
    return probe.canPlayType('video/webm; codecs="vp9"') !== '' ? 'webm' : 'mp4';
  });
}

function demoVideo(page: Page): Locator {
  return page.getByRole('region', { name: 'Ausführung der aktuellen Übung' }).locator('video');
}

/** Zeit der Wiedergabe; -1, solange das Video angehalten ist. */
function playhead(video: Locator): Promise<number> {
  return video.evaluate((v: HTMLVideoElement) => (v.paused ? -1 : v.currentTime));
}

/** Pfad der Datei, die das Video gewählt hat (mit `src` oder `<source>`). */
function playingFile(video: Locator): Promise<string> {
  return video.evaluate((v: HTMLVideoElement) =>
    v.currentSrc ? new URL(v.currentSrc).pathname : '',
  );
}

/** Die Schleife dieser Übung läuft wirklich: nicht angehalten, die Zeit schreitet fort. */
async function expectPlaying(video: Locator, stem: string, label: string) {
  await expect.poll(() => playingFile(video), { message: label }).toMatch(medium(stem));
  await expect
    .poll(() => playhead(video), { message: label, timeout: 10_000 })
    .toBeGreaterThan(0.2);
}

/** Programm aktivieren und den nächsten Trainingstag starten. */
async function startDay(page: Page, activate: boolean) {
  if (activate) {
    await openPage(page, '/training/vorlagen/compound_ab_4');
    await page.getByRole('button', { name: 'Programm aktivieren' }).click();
    await expect(
      page.getByRole('heading', { level: 2, name: /^Trainingstag 1 von/ }),
    ).toBeVisible();
  }
  await openPage(page, '/heute');
  await page.getByRole('button', { name: 'Training starten' }).click();
  await expect(page.getByRole('button', { name: 'Beenden', exact: true })).toBeVisible();
}

/** Letzten Satz der aktuellen Übung erledigen: Danach ist die nächste Übung die aktuelle. */
async function finishCurrentExercise(page: Page) {
  const name = (
    await page.getByRole('region', { name: 'Jetzt' }).locator('p.text-2xl').textContent()
  )?.trim();
  if (!name) throw new Error('keine aktuelle Übung');
  const card = page.locator('section', {
    has: page.getByRole('heading', { level: 2, name, exact: true }),
  });
  const row = card.locator('li[data-set-id]').last();
  for (const input of await row.locator('input').all()) {
    const label = (await input.getAttribute('aria-label')) ?? '';
    await input.fill(label.startsWith('Gewicht') ? '40' : label.startsWith('Wieder') ? '10' : '30');
  }
  await row.getByRole('button', { name: /^Satz erledigt, / }).click();
}

async function endSession(page: Page) {
  await page.getByRole('button', { name: 'Beenden', exact: true }).click();
  await page
    .getByRole('dialog')
    .last()
    .getByRole('button', { name: /beenden/i })
    .last()
    .click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Training abgeschlossen' }),
  ).toBeVisible();
}

test.describe('Player aufgeklappt: Schleife der aktuellen Übung (D-497)', () => {
  test.skip(({ isMobile }) => !isMobile, 'Handy-Profil');

  test('startet von selbst nach dem Start und nach jedem Wechsel, alle elf Übungen, ohne `autoplay`', async ({
    page,
  }) => {
    test.slow();
    await page.addInitScript(AUTOPLAY_IGNORED);
    await setDuoPose(page, 'auf');
    for (const [day, stems] of DAYS.entries()) {
      await startDay(page, day === 0);
      const video = demoVideo(page);
      const first = stems[0] ?? '';
      await expectPlaying(video, first, `Tag ${String(day + 1)}: ${first} nach dem Start`);
      // MP4 (H.264) vor WebM, wo der Browser H.264 kann.
      expect(await playingFile(video)).toMatch(medium(first, await loopExt(page)));
      for (const stem of stems.slice(1)) {
        await finishCurrentExercise(page);
        // Gleich nach dem Wechsel, ohne weiteres Tippen: die Schleife der neuen Übung.
        await expectPlaying(video, stem, `nach dem Wechsel zu ${stem}`);
        await page.getByRole('button', { name: 'Pause überspringen' }).first().click();
        await expectPlaying(video, stem, `${stem} nach der Pause`);
      }
      await endSession(page);
    }
  });

  test('Stromsparmodus: ohne Geste steht sie, das nächste Tippen irgendwo startet sie', async ({
    page,
  }) => {
    await page.addInitScript(AUTOPLAY_IGNORED);
    await page.addInitScript(GESTURE_ONLY);
    await setDuoPose(page, 'auf');
    await startDay(page, true);
    const video = demoVideo(page);
    await expect.poll(() => playingFile(video)).toMatch(medium('beinpresse'));
    await page.waitForTimeout(800);
    expect(await playhead(video), 'ohne Geste angehalten').toBe(-1);
    // Ein Tippen auf eine Stelle ohne Funktion genügt.
    await page.getByRole('region', { name: 'Jetzt' }).locator('p.eyebrow').click();
    await expectPlaying(video, 'beinpresse', 'nach dem ersten Tippen');
  });
});

test.describe('Übungsinfo und Details: zweimal, dann angehalten (D-497)', () => {
  /** Zwei Durchläufe in normaler Geschwindigkeit (5 s); eine schnellere Wiedergabe ließ WebKit
   *  unter Linux bei 0 stehen. Gezählt wird mit, wie oft das Video endet. */
  /**
   * Gespielte Zeit in Sekunden, in jedem Bild gemessen: Summe der Fortschritte, ein Sprung zurück
   * zählt nicht. So zählen die Durchläufe auch dort, wo der Browser ein Ende doppelt meldet
   * (WebKit unter Linux).
   */
  async function trackPlayed(video: Locator) {
    await video.evaluate((v: HTMLVideoElement) => {
      const tracked = v as HTMLVideoElement & { spielzeit?: number; messung?: number };
      // Jede Messung beginnt bei 0; eine frühere hört auf zu zählen.
      const own = (tracked.messung ?? 0) + 1;
      tracked.messung = own;
      tracked.spielzeit = 0;
      let last = v.currentTime;
      const step = () => {
        if (tracked.messung !== own) return;
        const now = v.currentTime;
        if (now > last) tracked.spielzeit = (tracked.spielzeit ?? 0) + (now - last);
        last = now;
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    return async () =>
      video.evaluate((v: HTMLVideoElement) => ({
        played: (v as HTMLVideoElement & { spielzeit?: number }).spielzeit ?? 0,
        duration: v.duration,
      }));
  }

  async function expectStoppedAfterTwoRuns(scope: Locator, label: string) {
    const video = scope.locator('video');
    const replay = scope.getByRole('button', { name: 'Animation wiederholen' });
    await expect
      .poll(() => video.evaluate((v: HTMLVideoElement) => v.duration), {
        message: `${label}: Länge`,
      })
      .toBeGreaterThan(0);
    // Von vorn zählen: Tippen auf die Animation beginnt die zwei Durchläufe neu.
    let played = await trackPlayed(video);
    await replay.click();
    await expect
      .poll(() => playhead(video), { message: `${label}: läuft`, timeout: 10_000 })
      .toBeGreaterThan(0);
    await expect
      .poll(() => video.evaluate((v: HTMLVideoElement) => v.paused && v.ended), {
        message: `${label}: nach zwei Durchläufen angehalten`,
        timeout: 20_000,
      })
      .toBe(true);
    let result = await played();
    expect(result.played / result.duration, `${label}: zwei Durchläufe`).toBeGreaterThan(1.7);
    expect(result.played / result.duration, `${label}: zwei Durchläufe`).toBeLessThan(2.3);
    await expect(replay).toHaveAttribute('data-angehalten', '');
    await expect(replay.locator('svg')).toBeVisible();
    // Angehalten: Tippen spielt sie erneut zweimal ab.
    played = await trackPlayed(video);
    await replay.click();
    await expect
      .poll(() => playhead(video), { message: `${label}: wieder` })
      .toBeGreaterThanOrEqual(0);
    await expect(replay).not.toHaveAttribute('data-angehalten');
    await expect
      .poll(() => video.evaluate((v: HTMLVideoElement) => v.paused && v.ended), {
        message: `${label}: wieder angehalten`,
        timeout: 20_000,
      })
      .toBe(true);
    result = await played();
    expect(result.played / result.duration, `${label}: wieder zwei`).toBeGreaterThan(1.7);
    expect(result.played / result.duration, `${label}: wieder zwei`).toBeLessThan(2.3);
  }

  test('Details: zweimal, Symbol, Tippen wiederholt', async ({ page }) => {
    await openPage(page, '/uebungen');
    await page
      .getByRole('link', { name: /^Latziehen/ })
      .first()
      .click();
    const demo = page.locator('[data-demo="bild"]');
    await expect.poll(() => playingFile(demo.locator('video'))).toMatch(medium('latziehen'));
    await expectStoppedAfterTwoRuns(demo, 'Details');
    expect(await playingFile(demo.locator('video'))).toMatch(
      medium('latziehen', await loopExt(page)),
    );
  });

  test('Übungsinfo aus dem Player: zweimal, Symbol, Tippen wiederholt', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'Handy-Profil');
    await setDuoPose(page, 'auf');
    await startDay(page, true);
    await page.getByRole('button', { name: 'Beinpresse: Ausführung und Angaben' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Beinpresse' });
    await expect.poll(() => playingFile(dialog.locator('video'))).toMatch(medium('beinpresse'));
    await expectStoppedAfterTwoRuns(dialog, 'Übungsinfo');
    // Die Schleife im Player dahinter läuft weiter ohne Ende.
    await expect(demoVideo(page)).toHaveJSProperty('loop', true);
  });
});
