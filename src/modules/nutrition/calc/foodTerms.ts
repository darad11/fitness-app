/**
 * Sprachwissen für die Lebensmittelsuche (Phase Ernährung §1, D-356): Begriffe, die dasselbe
 * Lebensmittel meinen (österreichisch und bundesdeutsch, Schreibweisen, Kurzformen), und
 * unregelmäßige Mehrzahlformen. Eigene Arbeit, keine Lebensmitteldaten. Die Suche erweitert damit
 * die Eingabe, deshalb gilt es für jede Datenquelle: eigene Lebensmittel, Rezepte, Importe,
 * Open Food Facts und die Grundnahrungsmittel.
 *
 * Mehrere Wörter in einem Begriff („grüne Bohne“) müssen alle im Namen vorkommen.
 */
export const SYNONYM_GROUPS: readonly (readonly string[])[] = [
  ['Tomate', 'Paradeiser'],
  ['Kartoffel', 'Erdapfel', 'Erdäpfel'],
  ['Blumenkohl', 'Karfiol'],
  ['Aprikose', 'Marille'],
  ['Johannisbeere', 'Ribisel'],
  ['grüne Bohne', 'Fisole', 'Brechbohne'],
  ['Aubergine', 'Melanzani'],
  ['Rosenkohl', 'Kohlsprosse'],
  ['Pflaume', 'Zwetschge', 'Zwetschke'],
  ['Meerrettich', 'Kren'],
  ['Quark', 'Topfen'],
  ['Sahne', 'Obers'],
  ['Schlagsahne', 'Schlagobers'],
  ['saure Sahne', 'Sauerrahm'],
  ['Kaffeesahne', 'Kaffeeobers'],
  // Ohne „Gehacktes“: Dessen Einzahlform „gehackte“ träfe „gehackte Mandeln“ (D-357).
  ['Hackfleisch', 'Faschiertes'],
  ['Brötchen', 'Semmel'],
  ['Hefe', 'Germ'],
  ['Brokkoli', 'Broccoli'],
  ['Nudel', 'Teigware', 'Pasta'],
  ['Ei', 'Hühnerei'],
  ['Eiweiß', 'Eiklar'],
  ['Eigelb', 'Dotter', 'Eidotter'],
  ['Karotte', 'Möhre', 'Mohrrübe'],
  ['Hähnchen', 'Hendl', 'Hühnchen', 'Huhn'],
  ['Pute', 'Truthahn', 'Puter'],
  ['Mais', 'Kukuruz'],
  ['Feldsalat', 'Vogerlsalat', 'Rapunzel'],
  ['Weißkohl', 'Weißkraut'],
  ['Rotkohl', 'Rotkraut', 'Blaukraut'],
  ['Pfifferling', 'Eierschwammerl'],
  ['Champignon', 'Egerling'],
  ['Steinpilz', 'Herrenpilz'],
  ['Sellerie', 'Zeller'],
  ['Porree', 'Lauch'],
  ['Frühlingszwiebel', 'Jungzwiebel', 'Lauchzwiebel'],
  ['Rote Bete', 'Rote Rübe'],
  ['Konfitüre', 'Marmelade'],
  ['Puderzucker', 'Staubzucker'],
  ['Paniermehl', 'Semmelbrösel'],
  ['Pfannkuchen', 'Palatschinke'],
  ['Sauerkirsche', 'Weichsel'],
  ['Stachelbeere', 'Agrasel'],
  ['Heidelbeere', 'Blaubeere', 'Schwarzbeere'],
  ['Paprika', 'Gemüsepaprika', 'Paprikaschote'],
  ['Orange', 'Apfelsine'],
  ['Kürbiskernöl', 'Kernöl'],
  ['Kloß', 'Knödel'],
  ['Grieben', 'Grammeln'],
  ['Sülze', 'Sulz'],
  ['Petersilie', 'Petersil'],
  ['Joghurt', 'Jogurt'],
  ['Grieß', 'Gries'],
  ['Garnele', 'Shrimp'],
  ['Rucola', 'Rauke'],
  ['Rindfleisch', 'Rind'],
  ['Schweinefleisch', 'Schwein'],
  ['Kalbfleisch', 'Kalb'],
  ['Lammfleisch', 'Lamm'],
  ['Putenfleisch', 'Pute'],
];

/** Mehrzahlformen, die keine Regel trifft (Kleinbuchstaben ohne Umlaute, wie die Suche sie sieht). */
export const IRREGULAR_PLURALS: Readonly<Record<string, string>> = {
  eier: 'ei',
  huhner: 'huhn',
  krauter: 'kraut',
  rinder: 'rind',
  lammer: 'lamm',
  kalber: 'kalb',
};

/**
 * Falsche Freunde: Wörter, in denen ein anderes Lebensmittelwort steckt, ohne dass sie es meinen
 * („Apfel“ in Erdapfel, Granatapfel und Apfelsine, „Lachs“ in Seelachs, „Lauch“ in Knoblauch,
 * „Eis“ in Reis und Paradeiser, „Obers“ in Oberschenkel). Ein Teiltreffer in einem solchen Wort
 * zählt nicht; als ganzes Wort werden sie natürlich gefunden.
 */
export const FALSE_FRIENDS: readonly string[] = [
  'Erdapfel',
  'Granatapfel',
  'Apfelsine',
  'Paradeiser',
  'Reis',
  'Eierschwammerl',
  'Muskatnuss',
  'Butternuss',
  'Butternut',
  'Oberschenkel',
  'Seelachs',
  'Bärlauch',
  'Schnittlauch',
  'Knoblauch',
  'Meerrettich',
  'Kokosmilch',
];
