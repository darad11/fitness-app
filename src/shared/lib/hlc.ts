/**
 * Hybride logische Uhr (HLC) für Änderungsstempel (D-206, data-model.md Abschnitt 1).
 *
 * Format: `<ISO-Zeit UTC mit ms>-<Zähler 4-stellig>-<Geräte-ID 8 hex>`,
 * z. B. `2026-10-18T09:15:02.123Z-0003-a1b2c3d4`. Stempel sind lexikografisch sortierbar.
 */

export type Hlc = string;

export interface HlcState {
  /** Physikalischer Anteil in Millisekunden seit 1970 (UTC). */
  readonly wallMs: number;
  /** Logischer Zähler bei gleicher Zeit. */
  readonly counter: number;
}

export const HLC_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z-\d{4}-[0-9a-f]{8}$/;
export const NODE_PATTERN = /^[0-9a-f]{8}$/;
const MAX_COUNTER = 9999;
const ISO_LENGTH = 24;

export class HlcError extends Error {
  override name = 'HlcError';
}

export function formatHlc(state: HlcState, node: string): Hlc {
  if (!NODE_PATTERN.test(node)) throw new HlcError('Ungültige Geräte-ID für HLC');
  if (!Number.isInteger(state.counter) || state.counter < 0 || state.counter > MAX_COUNTER) {
    throw new HlcError('HLC-Zähler außerhalb des Bereichs');
  }
  const iso = new Date(state.wallMs).toISOString();
  if (iso.length !== ISO_LENGTH) throw new HlcError('HLC-Zeit außerhalb des Bereichs');
  return `${iso}-${String(state.counter).padStart(4, '0')}-${node}`;
}

export function parseHlc(hlc: string): HlcState & { readonly node: string } {
  if (!HLC_PATTERN.test(hlc)) throw new HlcError('Ungültiger HLC-Stempel');
  const wallMs = Date.parse(hlc.slice(0, ISO_LENGTH));
  if (Number.isNaN(wallMs)) throw new HlcError('Ungültige Zeit im HLC-Stempel');
  return {
    wallMs,
    counter: Number(hlc.slice(ISO_LENGTH + 1, ISO_LENGTH + 5)),
    node: hlc.slice(ISO_LENGTH + 6),
  };
}

export function isHlc(value: unknown): value is Hlc {
  if (typeof value !== 'string' || !HLC_PATTERN.test(value)) return false;
  return !Number.isNaN(Date.parse(value.slice(0, ISO_LENGTH)));
}

/** Vergleich wie bei Zeichenketten; dank fester Breite entspricht das der zeitlichen Reihenfolge. */
export function compareHlc(a: Hlc, b: Hlc): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

export function isHlcState(value: unknown): value is HlcState {
  if (typeof value !== 'object' || value === null) return false;
  const { wallMs, counter } = value as Record<string, unknown>;
  return (
    typeof wallMs === 'number' &&
    Number.isFinite(wallMs) &&
    typeof counter === 'number' &&
    Number.isInteger(counter) &&
    counter >= 0 &&
    counter <= MAX_COUNTER
  );
}

function isAhead(a: HlcState, b: HlcState): boolean {
  return a.wallMs > b.wallMs || (a.wallMs === b.wallMs && a.counter > b.counter);
}

/** Läuft der Zähler über, rückt die Zeit um 1 ms vor; so bleibt der Stempel 4-stellig und monoton. */
function normalize(wallMs: number, counter: number): HlcState {
  return counter > MAX_COUNTER ? { wallMs: wallMs + 1, counter: 0 } : { wallMs, counter };
}

export class HybridClock {
  private state: HlcState;

  constructor(
    readonly node: string,
    initial?: HlcState,
    private readonly now: () => number = () => Date.now(),
  ) {
    if (!NODE_PATTERN.test(node)) throw new HlcError('Ungültige Geräte-ID für HLC');
    this.state = initial && isHlcState(initial) ? initial : { wallMs: 0, counter: 0 };
  }

  /** Aktueller Zustand, z. B. zum Speichern in der Tabelle `meta`. */
  get snapshot(): HlcState {
    return this.state;
  }

  /** Übernimmt einen gespeicherten Zustand (anderer Tab, Neustart), wenn er weiter ist. */
  observe(state: unknown): void {
    if (isHlcState(state) && isAhead(state, this.state)) this.state = state;
  }

  /** Stempel für eine lokale Änderung. */
  tick(): Hlc {
    const physical = this.now();
    this.state =
      physical > this.state.wallMs
        ? { wallMs: physical, counter: 0 }
        : normalize(this.state.wallMs, this.state.counter + 1);
    return formatHlc(this.state, this.node);
  }

  /** Stempel nach Empfang eines fremden Stempels (Import, später Sync). */
  receive(remote: Hlc): Hlc {
    const r = parseHlc(remote);
    const l = this.state;
    const wallMs = Math.max(l.wallMs, r.wallMs, this.now());
    let counter: number;
    if (wallMs === l.wallMs && wallMs === r.wallMs) counter = Math.max(l.counter, r.counter) + 1;
    else if (wallMs === l.wallMs) counter = l.counter + 1;
    else if (wallMs === r.wallMs) counter = r.counter + 1;
    else counter = 0;
    this.state = normalize(wallMs, counter);
    return formatHlc(this.state, this.node);
  }
}
