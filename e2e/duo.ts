import type { CDPSession, Page } from '@playwright/test';

/**
 * Prüfmaße für das iPhone Duo (D-371, `form-duo-report.md` Abschnitt 2.4). Die Breiten stammen
 * aus den Angaben von Apple und WebKit; der sichere Bereich ist eine Annahme (rechts die Leiste
 * des Systems an der Seite, unten der Home-Balken).
 */
export const DUO = {
  /** Äußeres Display hoch, als App vom Home-Bildschirm. */
  zu: { width: 466, height: 678, insets: { top: 0, right: 84, bottom: 34, left: 0 } },
  /** Inneres Display hoch (Gerät gedreht): das Zwischenmaß. */
  hoch: { width: 669, height: 951, insets: { top: 24, right: 0, bottom: 20, left: 0 } },
  /** Inneres Display quer, so wie man das Gerät aufklappt. */
  auf: { width: 951, height: 669, insets: { top: 0, right: 84, bottom: 20, left: 0 } },
} as const;

export type DuoPose = keyof typeof DUO;

/** Eine Sitzung je Seite, damit die Vorgabe für den sicheren Bereich nicht doppelt anliegt. */
const sessions = new WeakMap<Page, CDPSession>();

/**
 * Stellt Fenster und sicheren Bereich einer Haltung ein. Den sicheren Bereich (`env(safe-area-
 * inset-*)`) kann nur Chromium über die Entwicklerschnittstelle nachstellen; in WebKit ändert
 * sich nur das Fenster. Gibt zurück, ob der sichere Bereich gesetzt ist.
 */
export async function setDuoPose(page: Page, pose: DuoPose): Promise<boolean> {
  const { width, height, insets } = DUO[pose];
  const chromium = page.context().browser()?.browserType().name() === 'chromium';
  // Am Gerät ändern sich sicherer Bereich und Fenster zusammen, danach kommt `resize`. Die
  // Vorgabe für den sicheren Bereich löst kein `resize` aus; sie kommt deshalb zuerst.
  if (chromium) {
    let cdp = sessions.get(page);
    if (!cdp) {
      cdp = await page.context().newCDPSession(page);
      sessions.set(page, cdp);
    }
    await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets });
  }
  await page.setViewportSize({ width, height });
  return chromium;
}

/** Rechter Rand des sicheren Bereichs im Fenster (CSS-Pixel). */
export function safeRight(pose: DuoPose): number {
  return DUO[pose].width - DUO[pose].insets.right;
}
