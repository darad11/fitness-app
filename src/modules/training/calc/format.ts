import type { SetTarget } from '../model/program';

/** „6–8" oder „10"; bei Zeit „30–45 s". Leer, wenn kein Ziel gesetzt ist. */
export function formatTargetRange(
  target: SetTarget,
): { kind: 'reps' | 'time'; text: string } | null {
  const range = (min: number, max: number) =>
    min === max ? String(min) : `${String(min)}–${String(max)}`;
  if (target.repsMin !== undefined && target.repsMax !== undefined) {
    return { kind: 'reps', text: range(target.repsMin, target.repsMax) };
  }
  if (target.durationMinSec !== undefined && target.durationMaxSec !== undefined) {
    const { durationMinSec: min, durationMaxSec: max } = target;
    // Unter einer Minute „30–45 s", sonst „30:00 min" bzw. „45 s–1:30 min".
    if (max < 60) return { kind: 'time', text: `${range(min, max)} s` };
    return {
      kind: 'time',
      text: min === max ? formatRest(min) : `${formatRest(min)}–${formatRest(max)}`,
    };
  }
  return null;
}

/** Pausen ab einer Minute als „2:30 min", darunter als „45 s". */
export function formatRest(seconds: number): string {
  if (seconds < 60) return `${String(seconds)} s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes)}:${String(rest).padStart(2, '0')} min`;
}

/** Laufende Dauer als „12:34" bzw. ab einer Stunde „1:02:03". */
export function formatClock(totalSec: number): string {
  const sec = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const two = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${String(h)}:${two(m)}:${two(s)}` : `${String(m)}:${two(s)}`;
}

/** Restzeit der Pause aus dem gespeicherten Endzeitpunkt (AK-TRN-11); negativ heißt überzogen. */
export function restRemainingSec(endsAt: string, now: Date): number {
  return Math.ceil((Date.parse(endsAt) - now.getTime()) / 1000);
}

/** „1:23" während der Pause, „+0:42" bei Überziehung. */
export function formatRestRemaining(remainingSec: number): string {
  return remainingSec > 0 ? formatClock(remainingSec) : `+${formatClock(-remainingSec)}`;
}

/** Geschütztes Leerzeichen: hält zwei Wörter in einer Zeile. */
const NBSP = ' ';

/** Wortverbinder: unsichtbar, verhindert einen Umbruch an seiner Stelle. */
const WORD_JOINER = '\u2060';

/**
 * Hält Zahlen in einer Zeile mit dem Wort davor und mit ihrer Einheit dahinter (E1, D-525): „Ziel 5“,
 * „Satz 1 von 5“, „Aufwärmsatz 2“, „60 kg“, „45 s“; dazu Spannen wie „8–12“ (D-535: Nach dem
 * Strich darf der Browser umbrechen, in der kleinen Pause stand „Ziel 6–“ am Zeilenende und „10“
 * darunter). Vorher stand im Player „Ziel“ am Ende der Zeile und die Zahl allein in der nächsten.
 * Leerzeichen an anderen Stellen bleiben, damit der Text weiter umbrechen kann.
 */
export function keepNumbersTogether(text: string): string {
  return text
    .replace(/ (?=\d)/g, NBSP)
    .replace(/(\d) (?=(?:s|min|kg|km|m|Wdh\.)(?![\p{L}\d]))/gu, `$1${NBSP}`)
    .replace(/(\d)–(?=\d)/g, `$1–${WORD_JOINER}`);
}
