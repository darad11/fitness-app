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

  test('startet von selbst nach dem Start und nach jedem Wechsel, alle elf Übungen, ohne `autoplay`, Rahmen überall gleich', async ({
    page,
  }) => {
    test.slow();
    await page.addInitScript(AUTOPLAY_IGNORED);
    await setDuoPose(page, 'auf');
    // Rahmen der Animation je Übung (D-500): überall gleich groß.
    const frames: string[] = [];
    const frameSize = async (stem: string) => {
      const b = await page
        .getByRole('region', { name: 'Ausführung der aktuellen Übung' })
        .locator('[data-demo-frame]')
        .boundingBox();
      frames.push(`${stem} ${b ? `${b.width.toFixed(1)} × ${b.height.toFixed(1)}` : 'fehlt'}`);
      return b ? `${b.width.toFixed(1)} × ${b.height.toFixed(1)}` : 'fehlt';
    };
    const sizes = new Set<string>();
    for (const [day, stems] of DAYS.entries()) {
      await startDay(page, day === 0);
      const video = demoVideo(page);
      const first = stems[0] ?? '';
      await expectPlaying(video, first, `Tag ${String(day + 1)}: ${first} nach dem Start`);
      sizes.add(await frameSize(first));
      // MP4 (H.264) vor WebM, wo der Browser H.264 kann.
      expect(await playingFile(video)).toMatch(medium(first, await loopExt(page)));
      for (const stem of stems.slice(1)) {
        await finishCurrentExercise(page);
        // Gleich nach dem Wechsel, ohne weiteres Tippen: die Schleife der neuen Übung.
        await expectPlaying(video, stem, `nach dem Wechsel zu ${stem}`);
        await page.getByRole('button', { name: 'Pause überspringen' }).first().click();
        await expectPlaying(video, stem, `${stem} nach der Pause`);
        sizes.add(await frameSize(stem));
      }
      await endSession(page);
    }
    expect(sizes.size, `Rahmen je Übung: ${frames.join('; ')}`).toBe(1);
  });

  test('Rahmen und „Jetzt“ gleich groß, auch bei laufendem Timer und bei „Letzte Übung“ (D-500)', async ({
    page,
  }) => {
    test.slow();
    await setDuoPose(page, 'auf');
    await startDay(page, true);
    const now = page.getByRole('region', { name: 'Jetzt' });
    const frame = page
      .getByRole('region', { name: 'Ausführung der aktuellen Übung' })
      .locator('[data-demo-frame]');
    const seen: string[] = [];
    const sizes = new Set<string>();
    const note = async (label: string) => {
      const f = await frame.boundingBox();
      const n = await now.boundingBox();
      const size = `Rahmen ${f ? `${f.width.toFixed(1)} × ${f.height.toFixed(1)}` : 'fehlt'}, „Jetzt“ ${n ? n.height.toFixed(1) : 'fehlt'}`;
      seen.push(`${label}: ${size}`);
      sizes.add(size);
    };
    const current = page.locator('li[data-set-id][aria-current="step"]');
    const skip = page.getByRole('button', { name: 'Pause überspringen' });
    const allDone = page.getByRole('region', { name: 'Alle Sätze erledigt' });
    // Tag A der Reihe nach, alle Sätze; gemessen am ersten Satz jeder Übung.
    let last = '';
    while ((await current.count()) > 0) {
      const name = (await now.locator('.player-now-name').textContent())?.trim() ?? '';
      if (name !== last) {
        if (name.startsWith('Unterarmstütz')) {
          await expect(now.getByText('Letzte Übung', { exact: true })).toBeVisible();
        }
        await note(name);
        const start = current.getByRole('button', { name: /^Timer starten, / });
        if ((await start.count()) > 0) {
          await start.click();
          await expect(now.getByRole('timer')).toBeVisible();
          await note(`${name} mit laufendem Timer`);
          await current.getByRole('button', { name: /^Timer stoppen, / }).click();
          await expect(now.getByRole('timer')).toHaveCount(0);
        }
        last = name;
      }
      for (const input of await current.locator('input').all()) {
        const label = (await input.getAttribute('aria-label')) ?? '';
        await input.fill(
          label.startsWith('Gewicht') ? '40' : label.startsWith('Wieder') ? '10' : '30',
        );
      }
      await current.getByRole('button', { name: /^Satz erledigt, / }).click();
      await expect(skip.first().or(allDone)).toBeVisible();
      if (await skip.first().isVisible()) await skip.first().click();
    }
    // Die letzte Übung (Unterarmstütz) mit „Letzte Übung“ statt „Danach:“, einmal mit Timer.
    expect(seen.length, seen.join('; ')).toBe(6);
    expect(seen.at(-2) ?? '', 'zuletzt der Unterarmstütz').toMatch(/^Unterarmstütz/);
    expect(sizes.size, seen.join('; ')).toBe(1);
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

/**
 * Video mit nachgestellter Wiedergabe (D-503): Die App sieht ein Video, das nur auf Ansage des
 * Tests weiterläuft, an den Anfang springt oder endet, mit den Ereignissen wie im Browser
 * (`seeking` und `play` kommen danach, nicht im Aufruf). So prüfen Chromium und WebKit dieselbe
 * Logik „zweimal, dann anhalten, Tippen spielt erneut zweimal ab“, unabhängig davon, wie der
 * Browser echte Videos nachlädt: WebKit unter Linux blieb beim ersten Sprung an den Anfang hängen
 * (D-497). Die echte Wiedergabe prüfen die Tests weiter unten nur in Chromium.
 */
const SIMULATED_VIDEO = `(() => {
  const states = new WeakMap();
  const state = (v) => {
    let s = states.get(v);
    if (!s) {
      s = { playing: false, time: 0, ended: false, pending: 0 };
      states.set(v, s);
    }
    return s;
  };
  const fire = (v, type) => v.dispatchEvent(new Event(type));
  const later = (v, types) => {
    const s = state(v);
    s.pending += 1;
    setTimeout(() => {
      for (const type of types) fire(v, type);
      s.pending -= 1;
    }, 0);
  };
  const proto = HTMLMediaElement.prototype;
  proto.play = function () {
    const s = state(this);
    if (!s.playing) {
      s.playing = true;
      s.ended = false;
      later(this, ['play', 'playing']);
    }
    return Promise.resolve();
  };
  proto.pause = function () {
    const s = state(this);
    if (s.playing) {
      s.playing = false;
      later(this, ['pause']);
    }
  };
  Object.defineProperty(proto, 'paused', { configurable: true, get() { return !state(this).playing; } });
  Object.defineProperty(proto, 'ended', { configurable: true, get() { return state(this).ended; } });
  Object.defineProperty(proto, 'duration', { configurable: true, get() { return 2.5; } });
  Object.defineProperty(proto, 'currentTime', {
    configurable: true,
    get() { return state(this).time; },
    set(value) {
      const s = state(this);
      s.time = value;
      s.ended = false;
      later(this, ['seeking', 'seeked', 'timeupdate']);
    },
  });
  window.__video = {
    state: (v) => ({ ...state(v), loop: v.loop }),
    at(v, time) {
      state(v).time = time;
      fire(v, 'timeupdate');
    },
    // Ende eines Durchlaufs wie im Browser: mit loop zurück an den Anfang, sonst Ende.
    end(v) {
      const s = state(v);
      s.time = 2.45;
      fire(v, 'timeupdate');
      if (v.loop) {
        s.time = 0;
        fire(v, 'seeking');
        fire(v, 'seeked');
        fire(v, 'timeupdate');
        return;
      }
      s.time = 2.5;
      fire(v, 'timeupdate');
      s.playing = false;
      s.ended = true;
      fire(v, 'pause');
      fire(v, 'ended');
    },
  };
})();`;

interface SimulatedState {
  playing: boolean;
  time: number;
  ended: boolean;
  pending: number;
  loop: boolean;
}
interface SimulatedVideo {
  state: (v: HTMLVideoElement) => SimulatedState;
  at: (v: HTMLVideoElement, time: number) => void;
  end: (v: HTMLVideoElement) => void;
}

const simulated = {
  state: (video: Locator) =>
    video.evaluate((v: HTMLVideoElement) =>
      (globalThis as unknown as { __video: SimulatedVideo }).__video.state(v),
    ),
  at: (video: Locator, time: number) =>
    video.evaluate((v: HTMLVideoElement, t: number) => {
      (globalThis as unknown as { __video: SimulatedVideo }).__video.at(v, t);
    }, time),
  end: (video: Locator) =>
    video.evaluate((v: HTMLVideoElement) => {
      (globalThis as unknown as { __video: SimulatedVideo }).__video.end(v);
    }),
};

/**
 * Zweimal, dann angehalten mit Symbol; Tippen spielt sie erneut zweimal ab, auch ein zweites Mal;
 * eine Geste anderswo startet die angehaltene Animation nicht.
 */
async function expectTwoRunsSimulated(scope: Locator, label: string) {
  const video = scope.locator('video');
  const replay = scope.getByRole('button', { name: 'Animation wiederholen' });
  const state = () => simulated.state(video);
  await expect
    .poll(async () => (await state()).playing, { message: `${label}: startet von selbst` })
    .toBe(true);
  for (const round of ['von selbst', 'nach dem Tippen', 'nach dem zweiten Tippen']) {
    const where = `${label}, ${round}`;
    if (round !== 'von selbst') {
      await replay.click();
      await expect
        .poll(state, { message: `${where}: von vorn` })
        .toMatchObject({ playing: true, time: 0, ended: false, loop: true, pending: 0 });
      await expect(replay).not.toHaveAttribute('data-angehalten');
    }
    expect((await state()).loop, `${where}: der Browser wiederholt selbst`).toBe(true);
    // Erster Durchlauf zu Ende: Sprung an den Anfang, `loop` bleibt im Sprung an.
    await simulated.end(video);
    expect(await state(), `${where}: zweiter Durchlauf`).toMatchObject({
      playing: true,
      loop: true,
    });
    await simulated.at(video, 0.3);
    expect((await state()).loop, `${where}: kurz nach dem Sprung noch mit loop`).toBe(true);
    await simulated.at(video, 0.6);
    expect((await state()).loop, `${where}: im zweiten Durchlauf ohne loop`).toBe(false);
    await expect(replay).not.toHaveAttribute('data-angehalten');
    // Zweiter Durchlauf zu Ende: Das Video steht am letzten Bild, das Symbol erscheint.
    await simulated.end(video);
    await expect(replay, `${where}: angehalten`).toHaveAttribute('data-angehalten', '');
    await expect(replay.locator('svg')).toBeVisible();
    expect(await state(), `${where}: steht am Ende`).toMatchObject({
      playing: false,
      ended: true,
    });
  }
  // Eine Geste anderswo (Taste) startet die angehaltene Animation nicht.
  await video.page().keyboard.press('Shift');
  await expect.poll(async () => (await state()).pending).toBe(0);
  expect((await state()).playing, `${label}: bleibt angehalten`).toBe(false);
}

test.describe('Übungsinfo und Details: zweimal, dann angehalten, nachgestelltes Video (D-497, D-503)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(SIMULATED_VIDEO);
  });

  test('Details: zweimal, Symbol, Tippen wiederholt', async ({ page }) => {
    await openPage(page, '/uebungen');
    await page
      .getByRole('link', { name: /^Latziehen/ })
      .first()
      .click();
    const demo = page.locator('[data-demo="bild"]');
    await expect.poll(() => playingFile(demo.locator('video'))).toMatch(medium('latziehen'));
    await expectTwoRunsSimulated(demo, 'Details');
  });

  test('Übungsinfo aus dem Player: zweimal, Symbol, Tippen wiederholt; der Player läuft ohne Ende', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'Handy-Profil');
    await setDuoPose(page, 'auf');
    await startDay(page, true);
    const player = demoVideo(page);
    await expect.poll(async () => (await simulated.state(player)).playing).toBe(true);
    await page.getByRole('button', { name: 'Beinpresse: Ausführung und Angaben' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Beinpresse' });
    await expect.poll(() => playingFile(dialog.locator('video'))).toMatch(medium('beinpresse'));
    await expectTwoRunsSimulated(dialog, 'Übungsinfo');
    // Die Schleife im Player dahinter wiederholt weiter ohne Ende, auch über mehrere Enden.
    for (let run = 0; run < 3; run += 1) await simulated.end(player);
    expect(await simulated.state(player)).toMatchObject({ playing: true, loop: true });
  });
});

test.describe('Übungsinfo und Details: echte Wiedergabe (D-497, nur Chromium)', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'Echte Videos nur in Chromium: WebKit unter Linux lädt sie anders als Safari am Gerät; die Logik prüfen die Tests mit nachgestelltem Video in beiden (D-503)',
  );
  /**
   * Beobachtet das Video ab jetzt in jedem Bild: Gezählt wird der Sprung zurück an den Anfang,
   * höchstens einer je halbe Länge (so zählt ein doppelt gemeldeter Sprung nicht doppelt), gleich
   * ob der Browser mit `loop` wiederholt oder die App neu startet. Dazu die Ereignisse des Videos
   * mit Zeit und Stelle, für die Meldung bei einem Fehlschlag (WebKit läuft nur in der CI).
   */
  async function watch(video: Locator) {
    await video.evaluate((v: HTMLVideoElement) => {
      const w = v as HTMLVideoElement & {
        beobachtung?: number;
        spruenge?: number;
        ereignisse?: string[];
      };
      const own = (w.beobachtung ?? 0) + 1;
      w.beobachtung = own;
      w.spruenge = 0;
      w.ereignisse = [];
      const start = performance.now();
      const note = (what: string) => {
        if (w.beobachtung !== own || (w.ereignisse?.length ?? 0) >= 60) return;
        const flags = `${v.paused ? ' angehalten' : ''}${v.ended ? ' Ende' : ''}${v.loop ? ' loop' : ''}`;
        w.ereignisse?.push(
          `${((performance.now() - start) / 1000).toFixed(2)} s ${what} bei ${v.currentTime.toFixed(2)}${flags}`,
        );
      };
      for (const type of ['play', 'playing', 'pause', 'waiting', 'seeking', 'seeked', 'ended']) {
        v.addEventListener(type, () => {
          note(type);
        });
      }
      const half = (Number.isFinite(v.duration) && v.duration > 0 ? v.duration : 2.5) / 2;
      let last = v.currentTime;
      let lastJump = -Infinity;
      const step = () => {
        if (w.beobachtung !== own) return;
        const now = v.currentTime;
        const at = performance.now();
        if (now < last - half && at - lastJump > half * 1000) {
          w.spruenge = (w.spruenge ?? 0) + 1;
          lastJump = at;
          note(`Sprung zurück von ${last.toFixed(2)}`);
        }
        last = now;
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    return () =>
      video.evaluate((v: HTMLVideoElement) => {
        const w = v as HTMLVideoElement & { spruenge?: number; ereignisse?: string[] };
        return { runs: (w.spruenge ?? 0) + 1, events: (w.ereignisse ?? []).join(' | ') };
      });
  }

  /** Wartet, bis das Video am Ende steht; sonst nennt die Meldung die Ereignisse. */
  async function waitStopped(
    video: Locator,
    label: string,
    seen: () => Promise<{ runs: number; events: string }>,
  ) {
    try {
      await expect
        .poll(() => video.evaluate((v: HTMLVideoElement) => v.paused && v.ended), {
          timeout: 20_000,
        })
        .toBe(true);
    } catch {
      throw new Error(`${label}: nach 20 s nicht angehalten; ${(await seen()).events}`);
    }
  }

  /** Tippen auf die Animation, dann die Durchläufe von vorn bis zum Halt. */
  async function runsAfterReplay(video: Locator, replay: Locator, label: string) {
    await replay.click();
    await expect
      .poll(() => video.evaluate((v: HTMLVideoElement) => !v.paused && v.currentTime < 1), {
        message: `${label}: läuft von vorn`,
        timeout: 10_000,
        intervals: [50],
      })
      .toBe(true);
    const seen = await watch(video);
    await waitStopped(video, label, seen);
    return seen();
  }

  async function expectStoppedAfterTwoRuns(scope: Locator, label: string) {
    const video = scope.locator('video');
    const replay = scope.getByRole('button', { name: 'Animation wiederholen' });
    await expect
      .poll(() => video.evaluate((v: HTMLVideoElement) => v.duration), {
        message: `${label}: Länge`,
      })
      .toBeGreaterThan(0);
    // Von selbst: zwei Durchläufe, dann steht das letzte Bild mit dem Symbol.
    await waitStopped(video, `${label}, von selbst`, await watch(video));
    await expect(replay).toHaveAttribute('data-angehalten', '');
    await expect(replay.locator('svg')).toBeVisible();
    // Tippen auf die angehaltene Animation spielt sie erneut zweimal ab, auch ein zweites Mal.
    for (const round of ['', ', wieder']) {
      const result = await runsAfterReplay(video, replay, `${label}${round}`);
      expect(result.runs, `${label}${round}: zwei Durchläufe; ${result.events}`).toBe(2);
      await expect(replay).toHaveAttribute('data-angehalten', '');
      await expect(replay.locator('svg')).toBeVisible();
    }
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
