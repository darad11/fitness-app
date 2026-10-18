// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { playRestEndSound, resetSoundForTests, setAmbientAudioSession, unlockSound } from './sound';

interface FakeContext {
  state: string;
  currentTime: number;
  resume: ReturnType<typeof vi.fn>;
  createOscillator: ReturnType<typeof vi.fn>;
  createGain: ReturnType<typeof vi.fn>;
  destination: object;
}

function installAudioContext(state = 'running'): { instances: FakeContext[]; starts: number[] } {
  const instances: FakeContext[] = [];
  const starts: number[] = [];
  class Fake {
    state = state;
    currentTime = 10;
    destination = {};
    resume = vi.fn(() => {
      this.state = 'running';
      return Promise.resolve();
    });
    createGain = vi.fn(() => {
      const gain = {
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(() => gain),
      };
      return gain;
    });
    createOscillator = vi.fn(() => ({
      frequency: { value: 0 },
      connect: vi.fn((node: { connect: () => unknown }) => node),
      start: vi.fn((at: number) => starts.push(at)),
      stop: vi.fn(),
    }));
    constructor() {
      instances.push(this);
    }
  }
  vi.stubGlobal('AudioContext', Fake);
  return { instances, starts };
}

afterEach(() => {
  resetSoundForTests();
  vi.unstubAllGlobals();
  delete (navigator as Navigator & { audioSession?: unknown }).audioSession;
});

describe('Ton zum Pausenende (AK-TRN-12, D-215)', () => {
  it('spielt ohne entsperrten Kontext nichts und meldet das', () => {
    vi.stubGlobal('AudioContext', undefined);
    unlockSound();
    expect(playRestEndSound()).toBe(false);
  });

  it('entsperrt bei einer Bedienung und spielt danach zwei kurze Töne', () => {
    const { instances, starts } = installAudioContext();
    unlockSound();
    expect(instances).toHaveLength(1);
    expect(playRestEndSound()).toBe(true);
    expect(starts).toEqual([10, 10.25]);
    // Ein zweites Entsperren erzeugt keinen zweiten Kontext.
    unlockSound();
    expect(instances).toHaveLength(1);
  });

  it('setzt einen angehaltenen Kontext fort', () => {
    const { instances } = installAudioContext('suspended');
    unlockSound();
    expect(instances[0]?.resume).toHaveBeenCalledTimes(1);
    unlockSound();
    expect(instances[0]?.resume).toHaveBeenCalledTimes(1);
  });

  it('wählt die Audio-Session „ambient", wenn der Browser sie kennt', () => {
    expect(setAmbientAudioSession()).toBe(false);
    const session = { type: 'auto' };
    (navigator as Navigator & { audioSession?: { type: string } }).audioSession = session;
    expect(setAmbientAudioSession()).toBe(true);
    expect(session.type).toBe('ambient');
  });

  it('fängt Fehler beim Erzeugen und Abspielen ab', () => {
    vi.stubGlobal('AudioContext', function broken() {
      throw new Error('kaputt');
    });
    unlockSound();
    expect(playRestEndSound()).toBe(false);

    const { instances } = installAudioContext();
    unlockSound();
    instances[0]!.createOscillator = vi.fn(() => {
      throw new Error('kaputt');
    });
    expect(playRestEndSound()).toBe(false);
  });
});
