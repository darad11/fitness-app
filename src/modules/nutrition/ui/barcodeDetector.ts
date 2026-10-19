/**
 * Barcode-Erkennung (D-305, D-266): eingebauter `BarcodeDetector`, wenn der Browser ihn für EAN
 * anbietet, sonst das Paket `barcode-detector` (zxing-wasm). Die WebAssembly-Datei kommt aus
 * dem eigenen Paket, nicht von einem CDN; beides wird erst beim Öffnen des Scanners geladen.
 */
export const BARCODE_FORMATS = ['ean_13', 'ean_8', 'upc_a'] as const;

export interface Detector {
  detect(source: HTMLVideoElement): Promise<readonly { rawValue: string }[]>;
}

interface NativeDetectorClass {
  new (options: { formats: string[] }): Detector;
  getSupportedFormats(): Promise<string[]>;
}

async function nativeDetector(): Promise<Detector | null> {
  const Native = (globalThis as { BarcodeDetector?: NativeDetectorClass }).BarcodeDetector;
  if (!Native) return null;
  try {
    const supported = await Native.getSupportedFormats();
    if (!BARCODE_FORMATS.every((f) => supported.includes(f))) return null;
    return new Native({ formats: [...BARCODE_FORMATS] });
  } catch {
    return null;
  }
}

let ponyfill: Promise<Detector> | undefined;

export async function createDetector(): Promise<Detector> {
  const native = await nativeDetector();
  if (native) return native;
  ponyfill ??= Promise.all([
    import('barcode-detector/ponyfill'),
    import('zxing-wasm/reader/zxing_reader.wasm?url'),
  ]).then(([{ BarcodeDetector, prepareZXingModule }, { default: wasmUrl }]) => {
    prepareZXingModule({
      overrides: {
        locateFile: (path: string, prefix: string) =>
          path.endsWith('.wasm') ? wasmUrl : prefix + path,
      },
    });
    return new BarcodeDetector({ formats: [...BARCODE_FORMATS] });
  });
  try {
    return await ponyfill;
  } catch (error) {
    ponyfill = undefined;
    throw error;
  }
}
