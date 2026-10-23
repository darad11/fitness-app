/**
 * Konturen einer OpenType-Schrift mit CFF-Daten (z. B. Inter) als SVG-Pfade, ohne Abhängigkeit
 * (F5, D-325). Gelesen werden `head` (Einheiten je Geviert), `cmap` (Format 4), `hhea` und `hmtx`
 * (Vorschübe) und die Type-2-Charstrings aus `CFF `. Die Laufweite mit Unterschneidung misst das
 * Startbild-Werkzeug im Browser; dieses Modul liefert nur die Umrisse je Zeichen.
 *
 * Nur für Werkzeuge in `tools/`; die App lädt keine Schrift (D-203).
 */
import { readFileSync } from 'node:fs';

/** INDEX-Struktur der CFF-Daten: Anfang und Ende jedes Eintrags. */
function readIndex(view, offset) {
  const count = view.getUint16(offset);
  if (count === 0) return { items: [], end: offset + 2 };
  const offSize = view.getUint8(offset + 2);
  const readOffset = (i) => {
    let value = 0;
    for (let k = 0; k < offSize; k += 1)
      value = value * 256 + view.getUint8(offset + 3 + i * offSize + k);
    return value;
  };
  // Die Versätze zählen ab 1, bezogen auf das Byte vor den Daten.
  const base = offset + 3 + (count + 1) * offSize - 1;
  const items = [];
  for (let i = 0; i < count; i += 1) items.push([base + readOffset(i), base + readOffset(i + 1)]);
  return { items, end: base + readOffset(count) };
}

function readReal(view, p) {
  const digits = '0123456789.EE?-';
  let text = '';
  for (;;) {
    const byte = view.getUint8(p);
    p += 1;
    for (const nibble of [byte >> 4, byte & 15]) {
      if (nibble === 15) return { value: Number.parseFloat(text), end: p };
      text += nibble === 12 ? 'E-' : (digits[nibble] ?? '');
    }
  }
}

/** DICT als Zuordnung Operator → Operanden (Escape-Operatoren als 1200 + Code). */
function readDict(view, start, end) {
  const out = {};
  let operands = [];
  let p = start;
  while (p < end) {
    const b0 = view.getUint8(p);
    if (b0 <= 21) {
      let key = b0;
      p += 1;
      if (b0 === 12) {
        key = 1200 + view.getUint8(p);
        p += 1;
      }
      out[key] = operands;
      operands = [];
    } else if (b0 === 28) {
      operands.push(view.getInt16(p + 1));
      p += 3;
    } else if (b0 === 29) {
      operands.push(view.getInt32(p + 1));
      p += 5;
    } else if (b0 === 30) {
      const real = readReal(view, p + 1);
      operands.push(real.value);
      p = real.end;
    } else if (b0 >= 32 && b0 <= 246) {
      operands.push(b0 - 139);
      p += 1;
    } else if (b0 >= 247 && b0 <= 250) {
      operands.push((b0 - 247) * 256 + view.getUint8(p + 1) + 108);
      p += 2;
    } else if (b0 >= 251 && b0 <= 254) {
      operands.push(-(b0 - 251) * 256 - view.getUint8(p + 1) - 108);
      p += 2;
    } else {
      p += 1;
    }
  }
  return out;
}

const subrBias = (count) => (count < 1240 ? 107 : count < 33900 ? 1131 : 32768);

/** Type-2-Charstring eines Zeichens als Liste von Befehlen M, L, C, Z in Schrifteinheiten. */
function interpret(view, glyph, globalSubrs, localSubrs) {
  const commands = [];
  const stack = [];
  let x = 0;
  let y = 0;
  let stems = 0;
  let haveWidth = false;
  let open = false;
  let done = false;
  const width = (evenExpected) => {
    if (!haveWidth && stack.length % 2 !== (evenExpected ? 0 : 1)) stack.shift();
    haveWidth = true;
  };
  const close = () => {
    if (open) commands.push({ type: 'Z' });
    open = false;
  };
  const moveTo = (nx, ny) => {
    close();
    x = nx;
    y = ny;
    commands.push({ type: 'M', x, y });
    open = true;
  };
  const lineTo = (nx, ny) => {
    x = nx;
    y = ny;
    commands.push({ type: 'L', x, y });
  };
  const curveTo = (x1, y1, x2, y2, nx, ny) => {
    x = nx;
    y = ny;
    commands.push({ type: 'C', x1, y1, x2, y2, x, y });
  };
  const run = ([start, end]) => {
    let p = start;
    while (p < end && !done) {
      const b0 = view.getUint8(p);
      if (b0 >= 32 || b0 === 28 || b0 === 255) {
        if (b0 === 28) {
          stack.push(view.getInt16(p + 1));
          p += 3;
        } else if (b0 === 255) {
          stack.push(view.getInt32(p + 1) / 65536);
          p += 5;
        } else if (b0 <= 246) {
          stack.push(b0 - 139);
          p += 1;
        } else if (b0 <= 250) {
          stack.push((b0 - 247) * 256 + view.getUint8(p + 1) + 108);
          p += 2;
        } else {
          stack.push(-(b0 - 251) * 256 - view.getUint8(p + 1) - 108);
          p += 2;
        }
        continue;
      }
      p += 1;
      switch (b0) {
        case 1: // hstem
        case 3: // vstem
        case 18: // hstemhm
        case 23: // vstemhm
          width(true);
          stems += stack.length / 2;
          stack.length = 0;
          break;
        case 19: // hintmask
        case 20: // cntrmask
          width(true);
          stems += stack.length / 2;
          stack.length = 0;
          p += Math.ceil(stems / 8);
          break;
        case 21: // rmoveto
          width(true);
          moveTo(x + stack[0], y + stack[1]);
          stack.length = 0;
          break;
        case 22: // hmoveto
          width(false);
          moveTo(x + stack[0], y);
          stack.length = 0;
          break;
        case 4: // vmoveto
          width(false);
          moveTo(x, y + stack[0]);
          stack.length = 0;
          break;
        case 5: // rlineto
          for (let i = 0; i + 1 < stack.length; i += 2) lineTo(x + stack[i], y + stack[i + 1]);
          stack.length = 0;
          break;
        case 6: // hlineto
        case 7: {
          // vlineto
          let horizontal = b0 === 6;
          for (const d of stack) {
            if (horizontal) lineTo(x + d, y);
            else lineTo(x, y + d);
            horizontal = !horizontal;
          }
          stack.length = 0;
          break;
        }
        case 8: // rrcurveto
          for (let i = 0; i + 5 < stack.length; i += 6) {
            const x1 = x + stack[i];
            const y1 = y + stack[i + 1];
            const x2 = x1 + stack[i + 2];
            const y2 = y1 + stack[i + 3];
            curveTo(x1, y1, x2, y2, x2 + stack[i + 4], y2 + stack[i + 5]);
          }
          stack.length = 0;
          break;
        case 24: {
          // rcurveline
          let i = 0;
          for (; i + 7 < stack.length; i += 6) {
            const x1 = x + stack[i];
            const y1 = y + stack[i + 1];
            const x2 = x1 + stack[i + 2];
            const y2 = y1 + stack[i + 3];
            curveTo(x1, y1, x2, y2, x2 + stack[i + 4], y2 + stack[i + 5]);
          }
          lineTo(x + stack[i], y + stack[i + 1]);
          stack.length = 0;
          break;
        }
        case 25: {
          // rlinecurve
          let i = 0;
          for (; i + 7 < stack.length; i += 2) lineTo(x + stack[i], y + stack[i + 1]);
          const x1 = x + stack[i];
          const y1 = y + stack[i + 1];
          const x2 = x1 + stack[i + 2];
          const y2 = y1 + stack[i + 3];
          curveTo(x1, y1, x2, y2, x2 + stack[i + 4], y2 + stack[i + 5]);
          stack.length = 0;
          break;
        }
        case 26: {
          // vvcurveto
          let i = 0;
          let dx1 = 0;
          if (stack.length % 2) dx1 = stack[i++];
          for (; i + 3 < stack.length; i += 4) {
            const x1 = x + dx1;
            const y1 = y + stack[i];
            const x2 = x1 + stack[i + 1];
            const y2 = y1 + stack[i + 2];
            curveTo(x1, y1, x2, y2, x2, y2 + stack[i + 3]);
            dx1 = 0;
          }
          stack.length = 0;
          break;
        }
        case 27: {
          // hhcurveto
          let i = 0;
          let dy1 = 0;
          if (stack.length % 2) dy1 = stack[i++];
          for (; i + 3 < stack.length; i += 4) {
            const x1 = x + stack[i];
            const y1 = y + dy1;
            const x2 = x1 + stack[i + 1];
            const y2 = y1 + stack[i + 2];
            curveTo(x1, y1, x2, y2, x2 + stack[i + 3], y2);
            dy1 = 0;
          }
          stack.length = 0;
          break;
        }
        case 30: // vhcurveto
        case 31: {
          // hvcurveto
          let horizontal = b0 === 31;
          let i = 0;
          while (i + 3 < stack.length) {
            const last = stack.length - (i + 4) === 1;
            if (horizontal) {
              const x1 = x + stack[i];
              const y1 = y;
              const x2 = x1 + stack[i + 1];
              const y2 = y1 + stack[i + 2];
              curveTo(x1, y1, x2, y2, x2 + (last ? stack[i + 4] : 0), y2 + stack[i + 3]);
            } else {
              const x1 = x;
              const y1 = y + stack[i];
              const x2 = x1 + stack[i + 1];
              const y2 = y1 + stack[i + 2];
              curveTo(x1, y1, x2, y2, x2 + stack[i + 3], y2 + (last ? stack[i + 4] : 0));
            }
            i += last ? 5 : 4;
            horizontal = !horizontal;
          }
          stack.length = 0;
          break;
        }
        case 10: {
          // callsubr
          const index = stack.pop() + subrBias(localSubrs.length);
          run(localSubrs[index]);
          break;
        }
        case 29: {
          // callgsubr
          const index = stack.pop() + subrBias(globalSubrs.length);
          run(globalSubrs[index]);
          break;
        }
        case 11: // return
          return;
        case 14: // endchar
          width(true);
          close();
          done = true;
          return;
        case 12: {
          const op = view.getUint8(p);
          p += 1;
          const s = stack;
          if (op === 35) {
            // flex
            const x1 = x + s[0];
            const y1 = y + s[1];
            const x2 = x1 + s[2];
            const y2 = y1 + s[3];
            curveTo(x1, y1, x2, y2, x2 + s[4], y2 + s[5]);
            const x4 = x + s[6];
            const y4 = y + s[7];
            const x5 = x4 + s[8];
            const y5 = y4 + s[9];
            curveTo(x4, y4, x5, y5, x5 + s[10], y5 + s[11]);
          } else if (op === 34) {
            // hflex
            const y0 = y;
            const x1 = x + s[0];
            const x2 = x1 + s[1];
            const y2 = y + s[2];
            curveTo(x1, y, x2, y2, x2 + s[3], y2);
            const x4 = x + s[4];
            const x5 = x4 + s[5];
            curveTo(x4, y2, x5, y0, x5 + s[6], y0);
          } else if (op === 36) {
            // hflex1
            const y0 = y;
            const x1 = x + s[0];
            const y1 = y + s[1];
            const x2 = x1 + s[2];
            const y2 = y1 + s[3];
            curveTo(x1, y1, x2, y2, x2 + s[4], y2);
            const x4 = x + s[5];
            const x5 = x4 + s[6];
            const y5 = y + s[7];
            curveTo(x4, y, x5, y5, x5 + s[8], y0);
          } else if (op === 37) {
            // flex1
            const sx = x;
            const sy = y;
            const x1 = x + s[0];
            const y1 = y + s[1];
            const x2 = x1 + s[2];
            const y2 = y1 + s[3];
            curveTo(x1, y1, x2, y2, x2 + s[4], y2 + s[5]);
            const x4 = x + s[6];
            const y4 = y + s[7];
            const x5 = x4 + s[8];
            const y5 = y4 + s[9];
            const dx = x5 - sx;
            const dy = y5 - sy;
            if (Math.abs(dx) > Math.abs(dy)) curveTo(x4, y4, x5, y5, x5 + s[10], sy);
            else curveTo(x4, y4, x5, y5, sx, y5 + s[10]);
          } else {
            throw new Error(`Charstring-Operator 12 ${String(op)} nicht unterstützt`);
          }
          stack.length = 0;
          break;
        }
        default:
          throw new Error(`Charstring-Operator ${String(b0)} nicht unterstützt`);
      }
    }
  };
  run(glyph);
  close();
  return commands;
}

/** Lädt eine OTF-Datei mit CFF-Konturen (nicht CID-basiert). */
export function loadFont(path) {
  const buffer = readFileSync(path);
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const tables = {};
  const count = view.getUint16(4);
  for (let i = 0; i < count; i += 1) {
    const o = 12 + 16 * i;
    const tag = String.fromCharCode(
      view.getUint8(o),
      view.getUint8(o + 1),
      view.getUint8(o + 2),
      view.getUint8(o + 3),
    );
    tables[tag] = { offset: view.getUint32(o + 8), length: view.getUint32(o + 12) };
  }
  for (const tag of ['head', 'hhea', 'hmtx', 'cmap', 'CFF ']) {
    if (!tables[tag]) throw new Error(`Tabelle ${tag} fehlt in ${path}`);
  }
  const unitsPerEm = view.getUint16(tables.head.offset + 18);
  const metrics = view.getUint16(tables.hhea.offset + 34);
  const advance = (gid) => view.getUint16(tables.hmtx.offset + 4 * Math.min(gid, metrics - 1));

  // cmap: Unterabschnitt Windows Unicode BMP (3, 1) im Format 4.
  const cmap = tables.cmap.offset;
  let format4 = -1;
  for (let i = 0; i < view.getUint16(cmap + 2); i += 1) {
    const platform = view.getUint16(cmap + 4 + 8 * i);
    const encoding = view.getUint16(cmap + 6 + 8 * i);
    const offset = cmap + view.getUint32(cmap + 8 + 8 * i);
    if (platform === 3 && encoding === 1 && view.getUint16(offset) === 4) format4 = offset;
  }
  if (format4 < 0) throw new Error('cmap Format 4 fehlt');
  const segments = view.getUint16(format4 + 6) / 2;
  const ends = format4 + 14;
  const starts = ends + 2 * segments + 2;
  const deltas = starts + 2 * segments;
  const rangeOffsets = deltas + 2 * segments;
  const glyphId = (char) => {
    const code = char.codePointAt(0) ?? 0;
    for (let s = 0; s < segments; s += 1) {
      if (view.getUint16(ends + 2 * s) < code) continue;
      const start = view.getUint16(starts + 2 * s);
      if (start > code) return 0;
      const delta = view.getInt16(deltas + 2 * s);
      const range = view.getUint16(rangeOffsets + 2 * s);
      if (range === 0) return (code + delta) & 0xffff;
      const gid = view.getUint16(rangeOffsets + 2 * s + range + 2 * (code - start));
      return gid === 0 ? 0 : (gid + delta) & 0xffff;
    }
    return 0;
  };

  const base = tables['CFF '].offset;
  const names = readIndex(view, base + view.getUint8(base + 2));
  const topDicts = readIndex(view, names.end);
  const strings = readIndex(view, topDicts.end);
  const globals = readIndex(view, strings.end);
  const top = readDict(view, ...topDicts.items[0]);
  if (top[1230]) throw new Error('CID-basierte CFF-Schriften werden nicht unterstützt');
  const charStrings = readIndex(view, base + top[17][0]);
  const [privateSize, privateOffset] = top[18];
  const privateDict = readDict(view, base + privateOffset, base + privateOffset + privateSize);
  const locals = privateDict[19]
    ? readIndex(view, base + privateOffset + privateDict[19][0])
    : { items: [] };

  return {
    unitsPerEm,
    glyphId,
    advance,
    /** Umriss eines Zeichens in Schrifteinheiten (y nach oben). */
    outline: (char) => {
      const gid = glyphId(char);
      const glyph = charStrings.items[gid];
      if (!glyph) throw new Error(`Zeichen „${char}“ fehlt`);
      return interpret(view, glyph, globals.items, locals.items);
    },
  };
}

/**
 * SVG-Pfad eines Zeichens an der Stelle `x` auf der Grundlinie `baseline`, `scale` px je
 * Schrifteinheit (SVG: y nach unten).
 */
export function glyphPath(commands, x, baseline, scale) {
  const n = (v) => Number(v.toFixed(2));
  const X = (v) => n(x + v * scale);
  const Y = (v) => n(baseline - v * scale);
  return commands
    .map((c) => {
      if (c.type === 'M') return `M${String(X(c.x))} ${String(Y(c.y))}`;
      if (c.type === 'L') return `L${String(X(c.x))} ${String(Y(c.y))}`;
      if (c.type === 'C')
        return `C${String(X(c.x1))} ${String(Y(c.y1))} ${String(X(c.x2))} ${String(Y(c.y2))} ${String(X(c.x))} ${String(Y(c.y))}`;
      return 'Z';
    })
    .join('');
}
