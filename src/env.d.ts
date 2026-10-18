// Werte, die Vite beim Build einsetzt (vite.config.ts, `define`).
declare const __APP_ENV__: string;
declare const __APP_VERSION__: string;
declare const __BUILD_SHA__: string;
declare const __BUILD_TIME__: string;

interface Navigator {
  /** Nur Safari unter iOS und iPadOS: `true` in der vom Home-Bildschirm gestarteten Web-App. */
  readonly standalone?: boolean;
}
