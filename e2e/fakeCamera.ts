import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Künstliche Kamera für Chromium (D-374): ein Standbild als Y4M-Datei mit einem EAN-13 an
 * einer gewählten Stelle; Chromium spielt die Datei mit `--use-file-for-fake-video-capture`
 * als Kamera ab. Graustufen: Helligkeit je Pixel, Farbe neutral.
 */

const LCODES = [
  '0001101',
  '0011001',
  '0010011',
  '0111101',
  '0100011',
  '0110001',
  '0101111',
  '0111011',
  '0110111',
  '0001011',
];
const GCODES = [
  '0100111',
  '0110011',
  '0011011',
  '0100001',
  '0011101',
  '0111001',
  '0000101',
  '0010001',
  '0001001',
  '0010111',
];
const PARITY = [
  'LLLLLL',
  'LLGLGG',
  'LLGGLG',
  'LLGGGL',
  'LGLLGG',
  'LGGLLG',
  'LGGGLL',
  'LGLGLG',
  'LGLGGL',
  'LGGLGL',
];

/** 95 Module eines EAN-13 (1 = Strich). */
export function ean13Modules(code: string): string {
  if (!/^\d{13}$/.test(code)) throw new Error(`Kein EAN-13: ${code}`);
  const digits = Array.from(code, Number);
  const first = digits[0] ?? 0;
  const parity = PARITY[first] ?? 'LLLLLL';
  const left = digits
    .slice(1, 7)
    .map((d, i) => (parity[i] === 'G' ? GCODES[d] : LCODES[d]) ?? '')
    .join('');
  const right = digits
    .slice(7)
    .map((d) => Array.from(LCODES[d] ?? '', (bit) => (bit === '1' ? '0' : '1')).join(''))
    .join('');
  return `101${left}01010${right}101`;
}

export interface FakeCameraOptions {
  /** Bildgröße des Kamerabilds. */
  width: number;
  height: number;
  /** Code und Lage (linke obere Ecke der Striche) im Bild; ohne Code ein leeres Bild. */
  code?: string;
  x?: number;
  y?: number;
  /** Breite eines Moduls und Höhe der Striche in Pixeln. */
  module?: number;
  barHeight?: number;
}

/** Schreibt die Y4M-Datei in den temporären Ordner und gibt den Pfad zurück. */
export function writeFakeCamera(name: string, options: FakeCameraOptions): string {
  const { width, height, code, x = 0, y = 0, module = 3, barHeight = 110 } = options;
  const luma = Buffer.alloc(width * height, 200);
  if (code) {
    const modules = ean13Modules(code);
    for (let m = 0; m < modules.length; m += 1) {
      if (modules[m] !== '1') continue;
      for (let row = y; row < Math.min(height, y + barHeight); row += 1) {
        const start = row * width + x + m * module;
        luma.fill(0, start, start + module);
      }
    }
  }
  const chroma = Buffer.alloc((width / 2) * (height / 2) * 2, 128);
  const header = Buffer.from(
    `YUV4MPEG2 W${String(width)} H${String(height)} F30:1 Ip A1:1 C420jpeg\n`,
  );
  const frame = Buffer.concat([Buffer.from('FRAME\n'), luma, chroma]);
  // Nicht in `test-results`: Playwright leert den Ordner zu Beginn eines Laufs.
  const dir = join(tmpdir(), 'form-fake-camera');
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${name}.y4m`);
  writeFileSync(file, Buffer.concat([header, frame]));
  return file;
}
