/**
 * IDs (data-model.md Abschnitt 1, D-207):
 * - UUID v4 für neue Datensätze,
 * - UUID v5 (SHA-1, RFC 9562) für Datensätze mit natürlichem Schlüssel und gebündelte Stammdaten.
 *
 * SHA-1 ist hier selbst implementiert, weil `crypto.subtle` nur asynchron arbeitet und
 * deterministische IDs auch beim Aufbau gebündelter Daten synchron gebraucht werden.
 * SHA-1 dient nur der ID-Bildung, nicht der Sicherheit.
 */

/** Namensraum der App. Darf sich nie ändern, sonst ändern sich alle abgeleiteten IDs. */
export const APP_NAMESPACE = 'a9f1c5d1-6d1e-4d1d-b94d-d8ca701b9904';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function uuidv4(): string {
  return crypto.randomUUID();
}

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function rotl(x: number, n: number): number {
  return ((x << n) | (x >>> (32 - n))) >>> 0;
}

export function sha1(input: Uint8Array): Uint8Array {
  const length = input.length;
  const paddedLength = Math.ceil((length + 9) / 64) * 64;
  const buffer = new Uint8Array(paddedLength);
  buffer.set(input);
  buffer[length] = 0x80;
  const view = new DataView(buffer.buffer);
  const bitLength = length * 8;
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x1_0000_0000));
  view.setUint32(paddedLength - 4, bitLength >>> 0);

  const h = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];
  const w = new Uint32Array(80);
  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4);
    for (let i = 16; i < 80; i++) {
      w[i] = rotl((w[i - 3] ?? 0) ^ (w[i - 8] ?? 0) ^ (w[i - 14] ?? 0) ^ (w[i - 16] ?? 0), 1);
    }
    let [a, b, c, d, e] = h as [number, number, number, number, number];
    for (let i = 0; i < 80; i++) {
      let f: number;
      let k: number;
      if (i < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (i < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (i < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }
      const temp = (rotl(a, 5) + f + e + k + (w[i] ?? 0)) >>> 0;
      e = d;
      d = c;
      c = rotl(b, 30);
      b = a;
      a = temp;
    }
    h[0] = ((h[0] ?? 0) + a) >>> 0;
    h[1] = ((h[1] ?? 0) + b) >>> 0;
    h[2] = ((h[2] ?? 0) + c) >>> 0;
    h[3] = ((h[3] ?? 0) + d) >>> 0;
    h[4] = ((h[4] ?? 0) + e) >>> 0;
  }
  const out = new Uint8Array(20);
  const outView = new DataView(out.buffer);
  h.forEach((value, i) => {
    outView.setUint32(i * 4, value);
  });
  return out;
}

function uuidToBytes(uuid: string): Uint8Array {
  if (!isUuid(uuid)) throw new Error('Ungültige UUID als Namensraum');
  const hex = uuid.replace(/-/g, '');
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

function bytesToUuid(bytes: Uint8Array): string {
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export function uuidv5(name: string, namespace: string): string {
  const ns = uuidToBytes(namespace);
  const nameBytes = new TextEncoder().encode(name);
  const input = new Uint8Array(ns.length + nameBytes.length);
  input.set(ns);
  input.set(nameBytes, ns.length);
  const bytes = sha1(input).slice(0, 16);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x50;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  return bytesToUuid(bytes);
}

/** Deterministische ID im Namensraum der App, z. B. `stableId('singleton:settings')`. */
export function stableId(key: string): string {
  return uuidv5(key, APP_NAMESPACE);
}
