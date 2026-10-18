import { describe, expect, it } from 'vitest';
import { detectPlatform } from './platform';

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Mobile/15E148 Safari/604.1';
const MAC_OR_IPAD_SAFARI =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Safari/605.1.15';
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36';

describe('detectPlatform', () => {
  it('zeigt auf dem iPhone im Safari-Tab den Installationshinweis', () => {
    const info = detectPlatform({
      userAgent: IPHONE_SAFARI,
      maxTouchPoints: 5,
      displayModeStandalone: false,
    });
    expect(info).toMatchObject({ isIphone: true, isIos: true, isStandalone: false });
    expect(info.needsIosInstallHint).toBe(true);
  });

  it('erkennt die installierte App über navigator.standalone', () => {
    const info = detectPlatform({
      userAgent: IPHONE_SAFARI,
      maxTouchPoints: 5,
      standalone: true,
      displayModeStandalone: false,
    });
    expect(info.isStandalone).toBe(true);
    expect(info.needsIosInstallHint).toBe(false);
  });

  it('erkennt das iPad trotz Mac-Kennung an der Touch-Unterstützung', () => {
    const info = detectPlatform({
      userAgent: MAC_OR_IPAD_SAFARI,
      maxTouchPoints: 5,
      displayModeStandalone: false,
    });
    expect(info).toMatchObject({ isIpad: true, isMac: false, needsIosInstallHint: true });
  });

  it('erkennt den Mac ohne Touch und zeigt dort keinen iOS-Hinweis', () => {
    const info = detectPlatform({
      userAgent: MAC_OR_IPAD_SAFARI,
      maxTouchPoints: 0,
      displayModeStandalone: false,
    });
    expect(info).toMatchObject({ isMac: true, isIos: false, needsIosInstallHint: false });
  });

  it('erkennt die installierte App über display-mode', () => {
    const info = detectPlatform({
      userAgent: ANDROID_CHROME,
      maxTouchPoints: 5,
      displayModeStandalone: true,
    });
    expect(info).toMatchObject({ isIos: false, isStandalone: true, needsIosInstallHint: false });
  });
});
