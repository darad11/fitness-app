// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listenForInstallPrompt, promptInstall } from './installPrompt';
import {
  applyUpdate,
  checkForUpdate,
  getPwaState,
  resetPwaState,
  setPwaState,
  setRegistration,
  setUpdateActivator,
} from './state';

function fakeRegistration(patch: Partial<ServiceWorkerRegistration> = {}) {
  return {
    update: vi.fn(() => Promise.resolve()),
    waiting: null,
    installing: null,
    ...patch,
  } as unknown as ServiceWorkerRegistration;
}

beforeEach(() => {
  resetPwaState();
});

describe('Update-Suche', () => {
  it('ist ohne Registrierung nicht verfügbar', async () => {
    expect(await checkForUpdate()).toBe('unavailable');
  });

  it('meldet „aktuell", wenn keine neue Version wartet', async () => {
    const update = vi.fn(() => Promise.resolve({} as ServiceWorkerRegistration));
    setRegistration(fakeRegistration({ update }));
    expect(getPwaState().registered).toBe(true);
    expect(await checkForUpdate()).toBe('up-to-date');
    expect(update).toHaveBeenCalledOnce();
  });

  it('meldet eine gefundene Version', async () => {
    setRegistration(fakeRegistration({ installing: {} as ServiceWorker }));
    expect(await checkForUpdate()).toBe('update-available');
  });

  it('meldet einen Fehler ohne Verbindung', async () => {
    setRegistration(fakeRegistration({ update: () => Promise.reject(new Error('offline')) }));
    expect(await checkForUpdate()).toBe('failed');
  });

  it('aktiviert die wartende Version nur über applyUpdate', async () => {
    const activate = vi.fn(() => Promise.resolve());
    setUpdateActivator(activate);
    setPwaState({ updateAvailable: true });
    expect(activate).not.toHaveBeenCalled();
    await applyUpdate();
    expect(activate).toHaveBeenCalledOnce();
  });
});

describe('Installationsdialog (Chromium)', () => {
  it('ist ohne Ereignis des Browsers nicht verfügbar', async () => {
    expect(await promptInstall()).toBe('unavailable');
  });

  it('zeigt den aufgeschobenen Dialog und liefert die Wahl', async () => {
    listenForInstallPrompt();
    const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt: vi.fn(() => Promise.resolve()),
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(await promptInstall()).toBe('accepted');
    expect(event.prompt).toHaveBeenCalledOnce();
    expect(await promptInstall()).toBe('unavailable');
  });
});
