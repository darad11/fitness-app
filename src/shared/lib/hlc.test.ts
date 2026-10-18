import { describe, expect, it } from 'vitest';
import { compareHlc, formatHlc, HLC_PATTERN, HybridClock, isHlc, parseHlc } from './hlc';

const NODE = 'a1b2c3d4';
const T0 = Date.parse('2026-10-18T09:15:02.123Z');

describe('formatHlc und parseHlc', () => {
  it('erzeugt das dokumentierte Format', () => {
    const stamp = formatHlc({ wallMs: T0, counter: 3 }, NODE);
    expect(stamp).toBe('2026-10-18T09:15:02.123Z-0003-a1b2c3d4');
    expect(HLC_PATTERN.test(stamp)).toBe(true);
  });

  it('liest einen Stempel verlustfrei zurück', () => {
    expect(parseHlc('2026-10-18T09:15:02.123Z-0042-ffffffff')).toEqual({
      wallMs: T0,
      counter: 42,
      node: 'ffffffff',
    });
  });

  it('lehnt ungültige Stempel, Zähler und Geräte-IDs ab', () => {
    expect(() => parseHlc('2026-10-18T09:15:02Z-0001-a1b2c3d4')).toThrow();
    expect(() => parseHlc('2026-13-45T09:15:02.123Z-0001-a1b2c3d4')).toThrow();
    expect(() => formatHlc({ wallMs: T0, counter: 10_000 }, NODE)).toThrow();
    expect(() => formatHlc({ wallMs: T0, counter: 0 }, 'XYZ')).toThrow();
    expect(() => new HybridClock('zu-lang-123')).toThrow();
  });

  it('erkennt gültige Stempel', () => {
    expect(isHlc('2026-10-18T09:15:02.123Z-0000-a1b2c3d4')).toBe(true);
    expect(isHlc('2026-13-18T09:15:02.123Z-0000-a1b2c3d4')).toBe(false);
    expect(isHlc(42)).toBe(false);
  });
});

describe('HybridClock', () => {
  it('erhöht bei gleicher Zeit den Zähler', () => {
    const clock = new HybridClock(NODE, undefined, () => T0);
    const a = clock.tick();
    const b = clock.tick();
    expect(compareHlc(a, b)).toBe(-1);
    expect(parseHlc(b)).toMatchObject({ wallMs: T0, counter: 1 });
  });

  it('setzt den Zähler zurück, wenn die Zeit fortschreitet', () => {
    let now = T0;
    const clock = new HybridClock(NODE, undefined, () => now);
    clock.tick();
    clock.tick();
    now = T0 + 10;
    expect(parseHlc(clock.tick())).toMatchObject({ wallMs: T0 + 10, counter: 0 });
  });

  it('bleibt monoton, wenn die Geräteuhr zurückspringt', () => {
    let now = T0;
    const clock = new HybridClock(NODE, undefined, () => now);
    const before = clock.tick();
    now = T0 - 60_000;
    const after = clock.tick();
    expect(after > before).toBe(true);
    expect(parseHlc(after)).toMatchObject({ wallMs: T0, counter: 1 });
  });

  it('rückt bei Zählerüberlauf die Zeit um 1 ms vor', () => {
    const clock = new HybridClock(NODE, { wallMs: T0, counter: 9999 }, () => T0);
    expect(parseHlc(clock.tick())).toMatchObject({ wallMs: T0 + 1, counter: 0 });
  });

  it('springt beim Empfang auf einen späteren fremden Stempel', () => {
    const clock = new HybridClock(NODE, undefined, () => T0);
    const remote = formatHlc({ wallMs: T0 + 5000, counter: 7 }, 'ffffffff');
    const merged = clock.receive(remote);
    expect(parseHlc(merged)).toEqual({ wallMs: T0 + 5000, counter: 8, node: NODE });
    expect(clock.tick() > merged).toBe(true);
  });

  it('zählt beim Empfang eines älteren Stempels lokal weiter', () => {
    const clock = new HybridClock(NODE, { wallMs: T0, counter: 4 }, () => T0 - 1000);
    const merged = clock.receive(formatHlc({ wallMs: T0 - 5000, counter: 9 }, 'ffffffff'));
    expect(parseHlc(merged)).toMatchObject({ wallMs: T0, counter: 5 });
  });

  it('nimmt bei gleicher Zeit den größeren Zähler plus eins', () => {
    const clock = new HybridClock(NODE, { wallMs: T0, counter: 2 }, () => T0 - 1);
    const merged = clock.receive(formatHlc({ wallMs: T0, counter: 6 }, 'ffffffff'));
    expect(parseHlc(merged)).toMatchObject({ wallMs: T0, counter: 7 });
  });

  it('beginnt mit Zähler 0, wenn die physikalische Zeit vorne liegt', () => {
    const clock = new HybridClock(NODE, { wallMs: T0, counter: 2 }, () => T0 + 100);
    const merged = clock.receive(formatHlc({ wallMs: T0 + 50, counter: 6 }, 'ffffffff'));
    expect(parseHlc(merged)).toMatchObject({ wallMs: T0 + 100, counter: 0 });
  });

  it('übernimmt mit observe nur weitere und gültige Zustände', () => {
    const clock = new HybridClock(NODE, { wallMs: T0, counter: 5 }, () => T0);
    clock.observe({ wallMs: T0, counter: 3 });
    expect(clock.snapshot).toEqual({ wallMs: T0, counter: 5 });
    clock.observe({ wallMs: T0 + 1, counter: 0 });
    expect(clock.snapshot).toEqual({ wallMs: T0 + 1, counter: 0 });
    clock.observe({ wallMs: 'kaputt', counter: 1 });
    clock.observe(null);
    expect(clock.snapshot).toEqual({ wallMs: T0 + 1, counter: 0 });
  });

  it('erzeugt Stempel, deren Textreihenfolge der Erzeugungsreihenfolge entspricht', () => {
    let now = T0;
    const clock = new HybridClock(NODE, undefined, () => now);
    const stamps: string[] = [];
    for (let i = 0; i < 500; i++) {
      // Uhr springt pseudozufällig vor und zurück
      now = T0 + ((i * 7919) % 97) - 40;
      stamps.push(clock.tick());
    }
    expect([...stamps].sort()).toEqual(stamps);
    expect(new Set(stamps).size).toBe(stamps.length);
  });
});
