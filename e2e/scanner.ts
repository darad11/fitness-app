import type { Page } from '@playwright/test';
import { setDuoPose, type DuoPose } from './duo';
import { expect, openPage } from './fixtures';

/**
 * Gemeinsames für die Scanner-Tests beim iPhone Duo (D-374). Jede Datei bekommt ihre eigene
 * künstliche Kamera, weil Playwright Startoptionen des Browsers nur je Datei erlaubt.
 */

/** Gültiger EAN-13 (Prüfziffer 1). */
export const CODE = '4006381333931';

/** Startoptionen für Chromium mit einem Standbild als Kamera (`e2e/fakeCamera.ts`). */
export function fakeCamera(file: string) {
  return {
    launchOptions: {
      ...(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {}),
      args: [
        '--use-fake-device-for-media-stream',
        '--use-fake-ui-for-media-stream',
        `--use-file-for-fake-video-capture=${file}`,
      ],
    },
    permissions: ['camera'],
  };
}

/** Haltungen für den Scanner: die drei Prüfmaße und zugeklappt quer (niedrigste Haltung). */
export type ScanPose = DuoPose | 'quer';

export async function setScanPose(page: Page, pose: ScanPose) {
  if (pose === 'quer') await page.setViewportSize({ width: 594, height: 368 });
  else await setDuoPose(page, pose);
}

/** Öffnet den Scanner und wartet, bis Kamera und Erkennung (WebAssembly) bereit sind. */
export async function openScanner(page: Page) {
  const wasm = page.waitForResponse((response) => response.url().endsWith('.wasm'));
  await openPage(page, '/ernaehrung/hinzufuegen?mahlzeit=lunch');
  await page.getByRole('button', { name: 'Barcode scannen' }).click();
  const scanner = page.getByRole('dialog', { name: 'Barcode scannen' });
  await expect(
    scanner.getByText('Halte den Barcode ruhig in den Rahmen.', { exact: true }),
  ).toBeVisible();
  await wasm;
  return scanner;
}
