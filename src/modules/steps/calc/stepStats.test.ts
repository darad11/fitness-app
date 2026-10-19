import { describe, expect, it } from 'vitest';
import { stepsSummary } from './stepStats';

const config = {
  goal: 4_018_405,
  baselineSteps: 2_223_411,
  baselineDate: '2026-10-15',
  previousYearTotal: 4_018_404,
};

describe('stepsSummary (D-277, wie Step Challenge im Dashboard)', () => {
  it('rechnet Jahressumme, Tagesziel und Rest wie das Dashboard', () => {
    const entries = {
      '2026-10-15': 9_999,
      '2026-10-16': 15_041,
      '2026-10-17': 12_000,
      '2026-10-19': 8_420,
    };
    const s = stepsSummary(config, entries, '2026-10-19');
    // Der Tag des Stichtags steckt schon im Startwert.
    expect(s?.ytd).toBe(2_223_411 + 15_041 + 12_000 + 8_420);
    // Vor heute fehlten 4.018.405 − 2.250.452 = 1.767.953; 74 Tage inkl. heute bis 31.12.
    expect(s?.target).toBe(Math.ceil(1_767_953 / 74));
    expect(s?.todaySteps).toBe(8_420);
    expect(s?.remaining).toBe((s?.target ?? 0) - 8_420);
    expect(s?.percent).toBe(Math.round((8_420 / (s?.target ?? 1)) * 100));
    expect(s?.yearPercent).toBe(56);
  });

  it('gleiche Zahlen wie das Dashboard (steps-core.js und home-core.js, 19.10.2026 nachgerechnet)', () => {
    const entries = {
      '2026-10-15': 9_999,
      '2026-10-16': 15_041,
      '2026-10-17': 12_000,
      '2026-10-19': 8_420,
    };
    expect(stepsSummary(config, entries, '2026-10-19')).toEqual({
      todaySteps: 8_420,
      target: 23_892,
      remaining: 15_472,
      percent: 35,
      ytd: 2_258_872,
      goal: 4_018_405,
      yearPercent: 56,
    });
    expect(stepsSummary(config, { '2026-10-16': 15_041 }, '2026-10-19')).toMatchObject({
      todaySteps: null,
      target: 24_054,
      remaining: 24_054,
      percent: 0,
      ytd: 2_238_452,
    });
  });

  it('ohne Eintrag heute: noch nichts übertragen, Ziel zählt heute mit', () => {
    const s = stepsSummary(config, { '2026-10-16': 15_041 }, '2026-10-19');
    expect(s?.todaySteps).toBeNull();
    expect(s?.remaining).toBe(s?.target);
    expect(s?.percent).toBe(0);
  });

  it('Tagesziel erreicht: Rest 0, Balken voll', () => {
    const s = stepsSummary(config, { '2026-10-19': 60_000 }, '2026-10-19');
    expect(s?.remaining).toBe(0);
    expect(s?.percent).toBe(100);
  });

  it('Jahresziel erreicht: Tagesziel 0', () => {
    const s = stepsSummary({ ...config, baselineSteps: 4_100_000 }, {}, '2026-10-19');
    expect(s?.target).toBe(0);
    expect(s?.yearPercent).toBe(100);
  });

  it('heute vom Startwert abgedeckt: kein Tagesziel', () => {
    const s = stepsSummary({ ...config, baselineDate: '2026-10-20' }, {}, '2026-10-19');
    expect(s?.target).toBeNull();
    expect(s?.todaySteps).toBeNull();
  });

  it('31. Dezember: ein Tag übrig', () => {
    const s = stepsSummary({ ...config, baselineSteps: 4_000_000 }, {}, '2026-12-31');
    expect(s?.target).toBe(18_405);
  });
});
