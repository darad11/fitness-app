/** Aufzählung auf Deutsch: „A“, „A und B“, „A, B und C“ (F5, D-326). */
export function listDe(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} und ${items[items.length - 1] ?? ''}`;
}
