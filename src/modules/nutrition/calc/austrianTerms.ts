/**
 * Österreichische Bezeichnungen als zusätzliche Suchbegriffe für die deutschen BLS-Namen
 * (D-261, D-306): Wer „Topfen“ sucht, findet „Speisequark“. Die Liste ist eigene Arbeit und
 * ändert die BLS-Daten nicht. Schlüssel: Wortteil im BLS-Namen (klein), Wert: Begriffe in Österreich.
 */
export const AUSTRIAN_TERMS: Readonly<Record<string, readonly string[]>> = {
  quark: ['Topfen'],
  schlagsahne: ['Schlagobers'],
  'saure sahne': ['Sauerrahm'],
  sahne: ['Obers', 'Rahm'],
  kartoffel: ['Erdäpfel', 'Erdapfel'],
  tomate: ['Paradeiser'],
  aprikose: ['Marille'],
  pflaume: ['Zwetschke'],
  zwetschge: ['Zwetschke'],
  blumenkohl: ['Karfiol'],
  rosenkohl: ['Kohlsprossen'],
  meerrettich: ['Kren'],
  hackfleisch: ['Faschiertes'],
  gehacktes: ['Faschiertes'],
  pfifferling: ['Eierschwammerl'],
  brötchen: ['Semmel'],
  johannisbeere: ['Ribisel'],
  aubergine: ['Melanzani'],
  'grüne bohne': ['Fisolen'],
  weißkohl: ['Weißkraut'],
  rotkohl: ['Rotkraut', 'Blaukraut'],
  feldsalat: ['Vogerlsalat'],
  mais: ['Kukuruz'],
  hähnchen: ['Hendl', 'Huhn'],
  pute: ['Truthahn'],
  puter: ['Truthahn'],
  konfitüre: ['Marmelade'],
  puderzucker: ['Staubzucker'],
  'rote bete': ['Rote Rüben'],
  'rote rübe': ['Rote Rüben'],
  paniermehl: ['Semmelbrösel'],
  pfannkuchen: ['Palatschinke'],
  hefe: ['Germ'],
  sauerkirsche: ['Weichsel'],
  möhre: ['Karotte'],
  mohrrübe: ['Karotte'],
  grieben: ['Grammeln'],
  eiweiß: ['Eiklar'],
  eigelb: ['Dotter'],
  stachelbeere: ['Agrasel'],
  porree: ['Lauch'],
  sellerie: ['Zeller'],
  kürbiskernöl: ['Kernöl'],
  kloß: ['Knödel'],
  klöße: ['Knödel'],
  brathähnchen: ['Brathendl'],
  sülze: ['Sulz'],
};

/** Zusätzliche Suchbegriffe für einen BLS-Namen. */
export function austrianAliases(name: string): string[] {
  const lower = name.toLocaleLowerCase('de');
  const result = new Set<string>();
  for (const [term, aliases] of Object.entries(AUSTRIAN_TERMS)) {
    if (lower.includes(term)) for (const alias of aliases) result.add(alias);
  }
  return [...result];
}
