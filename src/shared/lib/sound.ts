/**
 * Kurzer Ton zum Pausenende über die Web Audio API (architecture.md Abschnitt 6.3, D-215).
 * Nur im Vordergrund. Safari verlangt, dass der Audiokontext bei einer Bedienung entsperrt
 * wird; dafür ruft der Player `unlockSound()` beim ersten Tippen auf. Mit
 * `navigator.audioSession.type = 'ambient'` läuft Musik weiter, und der Stummschalter wirkt.
 */

interface AudioSessionLike {
  type: string;
}

type AudioContextCtor = new () => AudioContext;

let context: AudioContext | null = null;

function audioContextCtor(): AudioContextCtor | undefined {
  const scope = globalThis as {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  return scope.AudioContext ?? scope.webkitAudioContext;
}

/** Setzt die Audio-Session auf „ambient", sofern der Browser sie kennt. */
export function setAmbientAudioSession(): boolean {
  const session = (navigator as Navigator & { audioSession?: AudioSessionLike }).audioSession;
  if (!session) return false;
  try {
    session.type = 'ambient';
    return true;
  } catch {
    return false;
  }
}

/** Entsperrt den Audiokontext; nur innerhalb einer Bedienung aufrufen. */
export function unlockSound(): void {
  const Ctor = audioContextCtor();
  if (!Ctor) return;
  try {
    if (!context) {
      setAmbientAudioSession();
      context = new Ctor();
    }
    if (context.state === 'suspended') void context.resume();
  } catch {
    context = null;
  }
}

/** Spielt zwei kurze Töne. Liefert `false`, wenn kein entsperrter Kontext da ist. */
export function playRestEndSound(): boolean {
  if (context?.state !== 'running') return false;
  try {
    const start = context.currentTime;
    for (const offset of [0, 0.25]) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, start + offset);
      gain.gain.exponentialRampToValueAtTime(0.3, start + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.18);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start + offset);
      oscillator.stop(start + offset + 0.2);
    }
    return true;
  } catch {
    return false;
  }
}

/** Nur für Tests. */
export function resetSoundForTests(): void {
  context = null;
}
