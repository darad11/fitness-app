/**
 * Barcodes (NU-07, D-266): EAN-13, EAN-8, UPC-A (12 Stellen) und GTIN-14. Leerzeichen werden
 * entfernt; die Prüfziffer muss stimmen, damit ein verlesener Code nicht nach außen geht.
 */
export function normalizeBarcode(raw: string): string | null {
  const code = raw.replace(/[\s-]/g, '');
  if (!/^\d{8}$|^\d{12,14}$/.test(code)) return null;
  return hasValidCheckDigit(code) ? code : null;
}

/** Prüfziffer nach GS1: von rechts abwechselnd ×3 und ×1, ohne die Prüfziffer selbst. */
export function hasValidCheckDigit(code: string): boolean {
  const digits = code.split('').map(Number);
  const check = digits.pop();
  let sum = 0;
  digits.reverse().forEach((digit, i) => {
    sum += digit * (i % 2 === 0 ? 3 : 1);
  });
  return (10 - (sum % 10)) % 10 === check;
}

/** UPC-A als EAN-13 schreiben (führende 0), damit beide Schreibweisen dasselbe finden. */
export function barcodeVariants(code: string): string[] {
  if (code.length === 12) return [code, `0${code}`];
  if (code.length === 13 && code.startsWith('0')) return [code, code.slice(1)];
  return [code];
}
