import { z } from 'zod';

/**
 * Marken zu den importierten ÖNWT-Lebensmitteln (D-271). Die Datei `nuts-marken.json` enthält je
 * Eintrag die Herstellerangabe der Recherche, z. B. „Alnatura Aufstrich/Dip auf Basis von
 * Kichererbsen …“ oder „Knorr, Unilever Basis, Trockenprodukt“. Marke und Beschreibung stehen dort
 * in einem Text; die Marke wird mit einfachen Regeln herausgelöst. Reine Funktionen ohne Dexie.
 */

/** Code, Name (zur Kontrolle beim Zuordnen) und Marke. */
export type BrandRow = [code: string, name: string, brand: string];

export interface BrandImportResult {
  fetchedAt?: string;
  rows: BrandRow[];
  /** Einträge ohne erkennbare Marke (leer, „/“ oder nur Beschreibung). */
  withoutBrand: number;
}

export const BRAND_MAX = 60;

const rowSchema = z.object({
  code: z.string().max(20),
  name: z.string().max(200),
  firma: z.string().max(5000),
});
const fileSchema = z.object({
  fetchedAt: z.string().max(40).optional(),
  rows: z.array(z.unknown()).min(1),
});

/** Erkennt die Markendatei an der Herstellerangabe („firma“) im ersten Eintrag. */
export function isBrandFile(raw: unknown): boolean {
  const file = fileSchema.safeParse(raw);
  if (!file.success) return false;
  const first = file.data.rows[0];
  return typeof first === 'object' && first !== null && 'firma' in first;
}

/** Rechtsform am Ende eines Firmennamens, z. B. „GmbH“, „GmbH & Co. KG“ oder „Ges.m.b.H“. */
const LEGAL_FORM =
  /^(.*?)\s*(?:\b(?:GmbH(?:\s*&\s*Co\.?\s*KG)?|Ges\.?\s*m\.?\s*b\.?\s*H\.?|GesmbH|mbH|AG|KG|OG|SE|e\.U\.|Ltd\.?|Inc\.?|S\.p\.A\.|S\.r\.l\.|B\.V\.|eGen|reg\.\s*Gen\.(?:\s*m\.b\.H\.)?|Co\.\s*KG))(?=[\s,]|$)/;

/** Text nach „Firma:“ bis zum Zeilenende, ohne Händler- und Lieferantenzusatz. */
export function firmaText(firma: string): string {
  const match = /Firma:[ \t]*([^\n]*)/.exec(firma);
  return (match?.[1] ?? '')
    .normalize('NFC')
    .replace(/\s*(?:Händler|Lieferant):.*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function words(text: string): string[] {
  return text.split(' ').filter(Boolean);
}

/** Erstes Wort eines Texts, an dem Marken über mehrere Einträge erkannt werden. */
function firstWord(text: string): string | undefined {
  return words(text.split(',')[0] ?? '')[0];
}

/** Gewöhnliches kleingeschriebenes Wort (Beschreibung, keine Marke wie „dmBio“ oder „ja!“). */
const PLAIN_WORD = /^[a-zäöüß-]+$/;

/**
 * Marke aus der Herstellerangabe. `firstWordCounts` zählt, wie oft ein erstes Wort in der ganzen
 * Datei vorkommt: Kommt es mehrmals vor (z. B. „Alnatura“), ist es die Marke und alles danach
 * Beschreibung.
 */
export function brandFromFirma(
  text: string,
  firstWordCounts: ReadonlyMap<string, number>,
): string | undefined {
  if (!/\p{L}/u.test(text)) return undefined;
  const [head = '', ...rest] = text.split(',');
  const tail = rest.join(',').trim();
  const headWords = words(head);
  const first = headWords[0];
  if (!first) return undefined;

  let brand: string | undefined;
  const legal = LEGAL_FORM.exec(head);
  if (legal && words(legal[1] ?? '').length <= 5 && legal[1]) {
    // „Bahlsen GmbH & Co. KG Butterkeks“ → „Bahlsen“
    brand = legal[1];
  } else if (
    tail &&
    (/^\p{Lu}/u.test(tail) || LEGAL_FORM.test(tail.split(',')[0] ?? '')) &&
    // Kleingeschriebene Wörter („mit“, „aus“, „glutenfrei“) gehören zur Beschreibung.
    !headWords.slice(1).some((word) => PLAIN_WORD.test(word))
  ) {
    // „Knorr, Unilever Basis“ oder „FRECHE FREUNDE, erdbär GmbH …“: vor dem Komma steht die Marke.
    if (headWords.length <= 4 && !(headWords.length > 1 && PLAIN_WORD.test(first))) brand = head;
  } else if (!PLAIN_WORD.test(first)) {
    const picked = [first];
    if ((first.endsWith('!') || first.endsWith('.') || first.length <= 2) && headWords[1]) {
      // „ja! Natürlich“, „Dr. Oetker“
      picked.push(headWords[1]);
    } else if ((firstWordCounts.get(first) ?? 0) < 2) {
      // Einzelner Eintrag: ein weiteres großgeschriebenes Wort mitnehmen („Mautner Markhof“).
      const next = headWords[1];
      if (next && /^\p{Lu}/u.test(next) && headWords.length <= 2) picked.push(next);
    }
    brand = picked.join(' ');
  }
  const cleaned = brand?.replace(/[\s,;:/-]+$/, '').trim();
  return cleaned ? cleaned.slice(0, BRAND_MAX) : undefined;
}

/** Prüft die Markendatei und löst je Eintrag die Marke heraus. */
export function parseBrandFile(raw: unknown): BrandImportResult | undefined {
  const file = fileSchema.safeParse(raw);
  if (!file.success) return undefined;
  const entries: { code: string; name: string; text: string }[] = [];
  for (const item of file.data.rows) {
    const parsed = rowSchema.safeParse(item);
    if (!parsed.success) continue;
    const code = parsed.data.code.trim();
    if (!/^[0-9A-Za-z]{1,20}$/.test(code)) continue;
    entries.push({
      code,
      name: parsed.data.name.normalize('NFC').replace(/\s+/g, ' ').trim(),
      text: firmaText(parsed.data.firma),
    });
  }
  if (entries.length === 0) return undefined;
  const counts = new Map<string, number>();
  for (const { text } of entries) {
    const word = firstWord(text);
    if (word) counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  const rows: BrandRow[] = [];
  let withoutBrand = 0;
  for (const { code, name, text } of entries) {
    const brand = brandFromFirma(text, counts);
    if (brand) rows.push([code, name, brand]);
    else withoutBrand += 1;
  }
  return {
    ...(file.data.fetchedAt ? { fetchedAt: file.data.fetchedAt } : {}),
    rows,
    withoutBrand,
  };
}
