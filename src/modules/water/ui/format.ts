import type { Formatters } from '@/shared/lib/format';

/** Unter 1 l in ml („750 ml“), ab 1 l in Litern („1,25 l“). */
export function formatMl(fmt: Formatters, ml: number): string {
  return ml < 1000
    ? `${fmt.number(ml)} ml`
    : `${fmt.number(ml / 1000, { maximumFractionDigits: 2 })} l`;
}
