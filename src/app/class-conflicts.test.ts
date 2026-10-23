import { describe, expect, it } from 'vitest';
import {
  BUTTON_BASE,
  BUTTON_SIZES,
  BUTTON_VARIANTS,
  CHIP_BASE,
  CHIP_IDLE,
  CHIP_SELECTED,
  CHIP_SIZES,
  ICON_BUTTON_BASE,
  ICON_BUTTON_TONES,
} from '@/shared/ui';

/**
 * Schutz vor stillen Überschreibungen (F5, D-322): `cn` setzt Klassen nur zusammen (clsx) und löst
 * Widersprüche nicht auf. Gibt ein Aufruf einer gemeinsamen Komponente eine Klasse mit, die eine
 * Eigenschaft der Komponente erneut setzt (z. B. `px-0` gegen `px-4`), entscheidet die Reihenfolge
 * im CSS, nicht die im Code: Seit F2 liefen so die Wochentage der Tagesaufgaben aus der Karte,
 * und rote Löschknöpfe blieben grau oder weiß. Varianten kommen über `variant`, `size`, `tone`
 * und `fill`; dieser Test findet jede Klasse, die dem widerspricht.
 */

const SOURCES = import.meta.glob<string>(['../**/*.tsx', '!../**/*.test.tsx'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

const TEXT_SIZES = new Set([
  'xs',
  'sm',
  'base',
  'lg',
  'xl',
  '2xl',
  '3xl',
  '4xl',
  'caption',
  'title',
  'headline',
  'value',
  'timer',
  'tab',
  'eyebrow',
  'claim',
]);
const TEXT_OTHER = new Set([
  'left',
  'center',
  'right',
  'justify',
  'start',
  'end',
  'wrap',
  'nowrap',
]);
const WEIGHTS = /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/;

/** Variante (alles vor dem letzten Doppelpunkt außerhalb eckiger Klammern) und Utility. */
function split(cls: string): [variant: string, utility: string] {
  let depth = 0;
  let cut = -1;
  for (let i = 0; i < cls.length; i += 1) {
    const c = cls[i];
    if (c === '[') depth += 1;
    else if (c === ']') depth -= 1;
    else if (c === ':' && depth === 0) cut = i;
  }
  return cut < 0 ? ['', cls] : [cls.slice(0, cut), cls.slice(cut + 1)];
}

/** Eigenschaften, die eine Klasse setzt, mit Variante; leer, wenn sie hier keine Rolle spielt. */
function groups(cls: string): string[] {
  const [variant, u] = split(cls);
  const out: string[] = [];
  const add = (...names: string[]) => {
    for (const name of names) out.push(`${variant}|${name}`);
  };
  if (/^-?p-/.test(u)) add('px', 'py');
  else if (/^-?px-/.test(u)) add('px');
  else if (/^-?py-/.test(u)) add('py');
  else if (u.startsWith('size-')) add('w', 'h');
  else if (u.startsWith('w-')) add('w');
  else if (u.startsWith('h-')) add('h');
  else if (u.startsWith('min-h-')) add('min-h');
  else if (WEIGHTS.test(u)) add('weight');
  else if (u.startsWith('text-')) {
    const rest = u.slice(5);
    if (TEXT_SIZES.has(rest)) add('text-size');
    else if (!TEXT_OTHER.has(rest)) add('text-color');
  } else if (u.startsWith('bg-')) add('bg');
  else if (/^gap-\d|^gap-\[/.test(u)) add('gap');
  else if (
    /^rounded(-[a-z]+)?$|^rounded-\[/.test(u) &&
    !/^rounded-[trbl]-|^rounded-[se][se]?-/.test(u)
  )
    add('radius');
  else if (u.startsWith('shadow-') || u === 'shadow') add('shadow');
  else if (u.startsWith('opacity-')) add('opacity');
  else if (u.startsWith('whitespace-')) add('whitespace');
  return out;
}

function conflicts(base: string, extra: string): string[] {
  const taken = new Set(base.split(/\s+/).flatMap(groups));
  return extra.split(/\s+/).filter((cls) => cls && groups(cls).some((g) => taken.has(g)));
}

/** Text eines JSX-Elements bis zur schließenden spitzen Klammer, Klammern in `{}` beachtet. */
function tagText(source: string, from: number): string {
  let depth = 0;
  let quote: string | null = null;
  for (let i = from; i < source.length; i += 1) {
    const c = source.charAt(i);
    if (quote) {
      if (c === quote) quote = null;
    } else if (c === '"' || c === "'" || c === '`') quote = c;
    else if (c === '{') depth += 1;
    else if (c === '}') depth -= 1;
    else if (c === '>' && depth === 0) return source.slice(from, i);
  }
  return source.slice(from);
}

function literals(expression: string): string[] {
  return [...expression.matchAll(/'([^']*)'|"([^"]*)"|`([^`$]*)`/g)].map(
    (m) => m[1] ?? m[2] ?? m[3] ?? '',
  );
}

/** Wert eines Attributs: Text in Anführungszeichen oder alle Zeichenketten im Ausdruck. */
function attribute(tag: string, name: string): string[] | null {
  const plain = new RegExp(`\\b${name}="([^"]*)"`).exec(tag);
  if (plain) return [plain[1] ?? ''];
  const start = new RegExp(`\\b${name}=\\{`).exec(tag);
  if (!start) return null;
  let depth = 0;
  for (let i = start.index + start[0].length - 1; i < tag.length; i += 1) {
    if (tag[i] === '{') depth += 1;
    else if (tag[i] === '}') {
      depth -= 1;
      if (depth === 0) return literals(tag.slice(start.index + start[0].length, i));
    }
  }
  return null;
}

function pick<K extends string>(
  table: Record<K, string>,
  keys: string[] | null,
  fallback: K,
): string {
  const found = (keys ?? []).filter((key): key is K => key in table);
  return (found.length > 0 ? found : [fallback]).map((key) => table[key]).join(' ');
}

const CHIP_BOTH = `${CHIP_BASE} ${CHIP_IDLE} ${CHIP_SELECTED}`;

function findConflicts(file: string, source: string): string[] {
  const found: string[] = [];
  const line = (index: number) => source.slice(0, index).split('\n').length;
  const report = (index: number, what: string, hits: string[]) => {
    if (hits.length > 0) found.push(`${file}:${String(line(index))} ${what}: ${hits.join(' ')}`);
  };
  for (const m of source.matchAll(/<(Button|ButtonLink|Chip|IconButton)\b/g)) {
    const tag = tagText(source, m.index + m[0].length);
    const className = attribute(tag, 'className');
    if (!className) continue;
    let base: string;
    if (m[1] === 'Chip') {
      base = `${CHIP_BOTH} ${/\bfill\b/.test(tag) ? CHIP_SIZES.fill : CHIP_SIZES.content}`;
    } else if (m[1] === 'IconButton') {
      base = `${ICON_BUTTON_BASE} ${pick(ICON_BUTTON_TONES, attribute(tag, 'tone'), 'default')}`;
    } else {
      base = `${BUTTON_BASE} ${pick(BUTTON_SIZES, attribute(tag, 'size'), 'md')} ${pick(BUTTON_VARIANTS, attribute(tag, 'variant'), 'primary')}`;
    }
    report(m.index, `<${m[1]}>`, conflicts(base, className.join(' ')));
  }
  for (const m of source.matchAll(/\bchipClasses\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g)) {
    const args = m[1] ?? '';
    const fill = /fill:\s*true/.test(args);
    const extra = literals(args).join(' ');
    report(
      m.index,
      'chipClasses',
      conflicts(`${CHIP_BOTH} ${fill ? CHIP_SIZES.fill : CHIP_SIZES.content}`, extra),
    );
  }
  for (const m of source.matchAll(/\bbuttonClasses\(([^()]*)\)/g)) {
    const [variant = 'primary', size = 'md', ...rest] = literals(m[1] ?? '');
    const base = `${BUTTON_BASE} ${pick(BUTTON_SIZES, [size], 'md')} ${pick(BUTTON_VARIANTS, [variant], 'primary')}`;
    report(m.index, 'buttonClasses', conflicts(base, rest.join(' ')));
  }
  return found;
}

describe('Klassen-Konflikte an gemeinsamen Komponenten (F5, D-322)', () => {
  it('liest genug Quelltext, um aussagekräftig zu sein', () => {
    expect(Object.keys(SOURCES).length).toBeGreaterThan(100);
  });

  it('erkennt Konflikte, die bisher still verloren gingen', () => {
    expect(conflicts(`${CHIP_BASE} ${CHIP_SIZES.content}`, 'flex-1 px-0')).toEqual(['px-0']);
    expect(conflicts(`${ICON_BUTTON_BASE} ${ICON_BUTTON_TONES.default}`, 'text-danger')).toEqual([
      'text-danger',
    ]);
    expect(conflicts(BUTTON_VARIANTS.secondary, 'bg-surface shadow-card')).toEqual([
      'bg-surface',
      'shadow-card',
    ]);
    expect(conflicts(BUTTON_BASE, 'disabled:opacity-30 mt-2 w-full')).toEqual([
      'disabled:opacity-30',
    ]);
    expect(conflicts(BUTTON_BASE, 'hover:opacity-80 [&_dd>span:first-child]:text-success')).toEqual(
      [],
    );
  });

  it('kein Aufruf überschreibt eine Eigenschaft der Komponente über className', () => {
    const hits = Object.entries(SOURCES).flatMap(([file, source]) => findConflicts(file, source));
    expect(hits).toEqual([]);
  });
});
