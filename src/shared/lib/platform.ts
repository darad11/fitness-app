/**
 * Erkennung von Gerät und Startart für Installationshinweise (AK-PWA-04, AK-SET-06).
 * iPadOS meldet sich in Safari als Mac; erkennbar ist es an der Touch-Unterstützung.
 */

export interface PlatformInput {
  readonly userAgent: string;
  readonly maxTouchPoints: number;
  readonly standalone?: boolean;
  /** Ergebnis von `matchMedia('(display-mode: standalone)')` */
  readonly displayModeStandalone: boolean;
}

export interface PlatformInfo {
  readonly isIphone: boolean;
  readonly isIpad: boolean;
  readonly isIos: boolean;
  readonly isMac: boolean;
  /** Die App läuft als installierte Web-App und nicht im Browser-Tab. */
  readonly isStandalone: boolean;
  /** iPhone oder iPad im Browser-Tab: Hinweis zur Installation und Datentrennung zeigen. */
  readonly needsIosInstallHint: boolean;
}

export function detectPlatform(input: PlatformInput): PlatformInfo {
  const ua = input.userAgent;
  const isIphone = ua.includes('iPhone') || ua.includes('iPod');
  const isIpad = ua.includes('iPad') || (ua.includes('Macintosh') && input.maxTouchPoints > 1);
  const isIos = isIphone || isIpad;
  const isMac = ua.includes('Macintosh') && !isIpad;
  const isStandalone = input.displayModeStandalone || input.standalone === true;
  return {
    isIphone,
    isIpad,
    isIos,
    isMac,
    isStandalone,
    needsIosInstallHint: isIos && !isStandalone,
  };
}

export function currentPlatform(): PlatformInfo {
  const standaloneQuery =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(display-mode: standalone)').matches
      : false;
  return detectPlatform({
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints,
    standalone: navigator.standalone,
    displayModeStandalone: standaloneQuery,
  });
}
