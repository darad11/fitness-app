import { describe, expect, it } from 'vitest';
import { decide } from './merge';

const H = (n: number) => `2026-10-19T10:00:0${String(n)}.000Z-0000-aaaaaaaa`;
const doc = (hlc: string, extra: Record<string, unknown> = {}) => ({
  hlc,
  deletedAt: null as string | null,
  ...extra,
});

describe('Zusammenführen (D-269)', () => {
  it('übernimmt Neues und Unverändertes vom Server', () => {
    expect(decide('bodyWeights', undefined, doc(H(1)), undefined)).toEqual({ kind: 'take' });
    expect(decide('bodyWeights', doc(H(1)), doc(H(1)), H(1))).toEqual({ kind: 'same' });
    // Lokal unverändert seit der Basis: Server gilt.
    expect(decide('bodyWeights', doc(H(1)), doc(H(2)), H(1))).toEqual({ kind: 'take' });
  });

  it('erkennt die eigene, schon bekannte Fassung als nichts Neues', () => {
    expect(decide('programs', doc(H(3)), doc(H(1)), H(1))).toEqual({ kind: 'keep' });
  });

  it('nimmt bei beidseitiger Änderung den jüngeren HLC', () => {
    expect(decide('bodyWeights', doc(H(3)), doc(H(2)), H(1))).toEqual({ kind: 'keep' });
    expect(decide('bodyWeights', doc(H(2)), doc(H(3)), H(1))).toEqual({ kind: 'take' });
    // Ohne Basis (erster Abgleich mit vorhandenen Daten) gilt dasselbe.
    expect(decide('goals', doc(H(2)), doc(H(3)), undefined)).toEqual({ kind: 'take' });
  });

  it('lässt „abgeschlossen“ vor „laufend“ gewinnen (K-01)', () => {
    const done = (h: string) => doc(h, { status: 'completed' });
    const live = (h: string) => doc(h, { status: 'in_progress' });
    expect(decide('sessions', done(H(2)), live(H(3)), H(1))).toEqual({ kind: 'restamp' });
    expect(decide('sessions', live(H(3)), done(H(2)), H(1))).toEqual({ kind: 'take' });
    expect(decide('sessions', done(H(2)), done(H(3)), H(1))).toEqual({ kind: 'take' });
  });

  it('lässt das Verwerfen einer laufenden Kopie keine abgeschlossene Einheit löschen (K-03)', () => {
    const done = (h: string) => doc(h, { status: 'completed' });
    const discarded = (h: string) =>
      doc(h, { status: 'in_progress', deletedAt: h, deletedFrom: 'in_progress' });
    // Die Löschmarke ist jünger, die abgeschlossene Einheit bleibt trotzdem.
    expect(decide('sessions', discarded(H(3)), done(H(2)), H(1))).toEqual({ kind: 'take' });
    expect(decide('sessions', done(H(2)), discarded(H(3)), H(1))).toEqual({ kind: 'restamp' });
    // Löschen im Verlauf (aus „abgeschlossen“) folgt weiter dem jüngeren HLC (K-04).
    const removed = (h: string) =>
      doc(h, { status: 'completed', deletedAt: h, deletedFrom: 'completed' });
    expect(decide('sessions', removed(H(3)), done(H(2)), H(1))).toEqual({ kind: 'keep' });
    expect(decide('sessions', done(H(2)), removed(H(3)), H(1))).toEqual({ kind: 'take' });
    // Verwerfen gegen eine weiter laufende Fassung: jüngerer HLC.
    const live = (h: string) => doc(h, { status: 'in_progress' });
    expect(decide('sessions', discarded(H(3)), live(H(2)), H(1))).toEqual({ kind: 'keep' });
  });

  it('legt bei Programmen und Rezepten eine Konfliktkopie an, außer bei Löschung', () => {
    expect(decide('programs', doc(H(2)), doc(H(3)), H(1))).toEqual({ kind: 'conflict' });
    expect(decide('recipes', doc(H(3)), doc(H(2)), H(1))).toEqual({ kind: 'conflict' });
    const gone = doc(H(3), { deletedAt: H(3) });
    expect(decide('programs', doc(H(2)), gone, H(1))).toEqual({ kind: 'take' });
  });
});
