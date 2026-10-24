import { describe, expect, it } from 'vitest';
import type { Nutrients } from '../model/nutrition';
import { austrianAliases } from './austrianTerms';
import { buildFoodIndex, foldText, searchFoods, singularForms } from './foodSearch';

/**
 * Suche für jede Datenquelle (Phase Ernährung §1, D-356). Die Einträge stehen für eigene
 * Lebensmittel, Rezepte, den ÖNWT-Import und gescannte Markenprodukte; die Namen folgen den
 * Schreibweisen dieser Quellen (z. B. „Hühnerei roh“, „Hafer Flocken“, „Bohne grün, roh“).
 */
interface Item {
  id: string;
  name: string;
  aliases: string[];
  brand?: string;
  per100?: Nutrients;
}

const item = (id: string, name: string, extra: Partial<Item> = {}): Item => ({
  id,
  name,
  aliases: [],
  ...extra,
});

const ids = (index: ReturnType<typeof buildFoodIndex<Item>>, query: string) =>
  searchFoods(index, query).map((f) => f.id);

describe('Text für die Suche', () => {
  it('faltet Umlaute und ihre Schreibweise mit e gleich', () => {
    expect(foldText('Äpfel')).toBe('apfel');
    expect(foldText('Aepfel')).toBe('apfel');
    expect(foldText('Muesli')).toBe(foldText('Müsli'));
    expect(foldText('Grieß')).toBe('griess');
    expect(foldText('  Karotten-/Möhrenpüree ')).toBe('karotten mohrenpuree');
  });

  it('kennt Einzahlformen ohne „-er“ außer aus der Liste', () => {
    expect(singularForms('tomaten')).toContain('tomate');
    expect(singularForms('nusse')).toContain('nuss');
    expect(singularForms('kiwis')).toContain('kiwi');
    expect(singularForms('eier')).toContain('ei');
    expect(singularForms('butter')).toEqual([]);
    expect(singularForms('eis')).toEqual([]);
  });
});

describe('Suche über alle Quellen', () => {
  const items: Item[] = [
    item('apfel', 'Apfel roh'),
    item('apfelmus', 'Apfelmus'),
    item('apfelmus-marke', 'Apfelmus', { brand: 'Spar' }),
    item('ei', 'Hühnerei roh'),
    item('eis', 'Eis Vanille'),
    item('eierlikoer', 'Eierlikör'),
    item('brei', 'Grießbrei'),
    item('tomate', 'Tomate roh', { aliases: austrianAliases('Tomate roh') }),
    item('paradeiser-oenwt', 'Paradeiser Rispen'),
    item('tomatenmark', 'Tomatenmark', { brand: 'Mutti' }),
    item('banane', 'Banane roh'),
    item('kartoffel', 'Kartoffel gekocht'),
    item('erdaepfelsalat', 'Erdäpfelsalat'),
    item('erdaepfel', 'Erdäpfel roh'),
    item('apfelsine', 'Apfelsine'),
    item('granatapfel', 'Granatapfel roh'),
    item('bratapfel', 'Bratapfel'),
    item('lachs', 'Lachs roh'),
    item('seelachs', 'Seelachs roh'),
    item('knoblauch', 'Knoblauch roh'),
    item('lauch', 'Porree/Lauch, roh'),
    item('milchreis', 'Milchreis'),
    item('speiseeis', 'Speiseeis Vanille'),
    item('quark', 'Speisequark mager', { aliases: austrianAliases('Speisequark mager') }),
    item('topfen', 'Topfen 20 %'),
    item('broccoli', 'Broccoli roh'),
    item('teigwaren', 'Teigwaren eifrei, roh'),
    item('hafer', 'Hafer Flocken'),
    item('bohne', 'Bohne grün, roh'),
    item('rapsoel', 'Rapsöl/Rüböl'),
    item('olivenoel', 'Olivenöl'),
    item('oliven', 'Oliven grün'),
    item('karfiol', 'Karfiol'),
    item('walnuss', 'Walnuss'),
    item('butter', 'Butter'),
    item('butt', 'Steinbutt roh'),
    item('sauerrahm', 'Sauerrahm 15 %'),
    item('recipe', 'Overnight Oats mit Apfel'),
  ];
  const index = buildFoodIndex(items);

  it('findet Apfel, Äpfel und Aepfel gleich, das ganze Wort vor Apfelmus, nie Erdäpfel', () => {
    for (const query of ['Apfel', 'Äpfel', 'Aepfel', 'apfel', 'ÄPFEL']) {
      expect(ids(index, query)[0]).toBe('apfel');
    }
    // Ganzes Wort vorne, dann Grundwort (Bratapfel), dann weiter hinten (Rezept), dann Wortanfang.
    expect(ids(index, 'Apfel')).toEqual([
      'apfel',
      'bratapfel',
      'recipe',
      'apfelmus',
      'apfelmus-marke',
    ]);
  });

  it('findet Ei und Eier beim Hühnerei, Eis und Eierlikör erst danach, Brei nie', () => {
    expect(ids(index, 'Ei')[0]).toBe('ei');
    expect(ids(index, 'Eier')[0]).toBe('ei');
    expect(ids(index, 'Ei')).toContain('eis');
    expect(ids(index, 'Eier')).toContain('eierlikoer');
    expect(ids(index, 'Ei')).not.toContain('brei');
    expect(ids(index, 'Eier')).not.toContain('brei');
  });

  it('findet Tomate, Tomaten und Paradeiser in beide Richtungen, lose vor Marke', () => {
    expect(ids(index, 'Tomate').slice(0, 2)).toEqual(['tomate', 'paradeiser-oenwt']);
    expect(ids(index, 'Tomaten').slice(0, 2)).toEqual(['tomate', 'paradeiser-oenwt']);
    // Beide sind ganze Wörter am Anfang; der kürzere Name steht vorn.
    expect(ids(index, 'Paradeiser').slice(0, 2)).toEqual(['tomate', 'paradeiser-oenwt']);
    // Tomatenmark ist ein Markenprodukt und nur Wortanfang: zuletzt.
    expect(ids(index, 'Tomaten').at(-1)).toBe('tomatenmark');
  });

  it('findet Einzahl über Mehrzahl und umgekehrt', () => {
    expect(ids(index, 'Bananen')).toEqual(['banane']);
    expect(ids(index, 'Kartoffeln').slice(0, 2).sort()).toEqual(['erdaepfel', 'kartoffel']);
    expect(ids(index, 'Nüsse')).toEqual(['walnuss']);
    expect(ids(index, 'grüne Bohnen')).toEqual(['bohne']);
  });

  it('findet österreichische und bundesdeutsche Begriffe in beide Richtungen', () => {
    expect(ids(index, 'Erdäpfel').slice(0, 2)).toEqual(['erdaepfel', 'kartoffel']);
    expect(ids(index, 'Kartoffel')).toContain('erdaepfelsalat');
    // „Topfen 20 %“ trifft „Quark“ als ganzes Wort (Synonym), „Speisequark“ nur am Wortende.
    expect(ids(index, 'Topfen').slice(0, 2)).toEqual(['topfen', 'quark']);
    expect(ids(index, 'Quark').slice(0, 2)).toEqual(['topfen', 'quark']);
    expect(ids(index, 'Blumenkohl')).toEqual(['karfiol']);
    expect(ids(index, 'Fisolen')).toEqual(['bohne']);
    expect(ids(index, 'saure Sahne')).toEqual(['sauerrahm']);
    expect(ids(index, 'Kartoffelsalat')).toEqual(['erdaepfelsalat']);
  });

  it('kennt Schreibweisen und Kurzformen', () => {
    expect(ids(index, 'Brokkoli')).toEqual(['broccoli']);
    expect(ids(index, 'Nudeln')).toEqual(['teigwaren']);
    expect(ids(index, 'Haferflocken')).toEqual(['hafer']);
    expect(ids(index, 'hafer flocken')).toEqual(['hafer']);
  });

  it('findet Öl über das Wortende, aber nicht Oliven oder Karfiol', () => {
    expect(ids(index, 'Öl')).toEqual(['olivenoel', 'rapsoel']);
    expect(ids(index, 'Oel')).toEqual(['olivenoel', 'rapsoel']);
  });

  it('überspringt falsche Freunde', () => {
    expect(ids(index, 'Lachs')).toEqual(['lachs']);
    expect(ids(index, 'Lauch')).toEqual(['lauch']);
    expect(ids(index, 'Eis')).toEqual(['eis', 'speiseeis']);
    expect(ids(index, 'Reis')).toEqual(['milchreis']);
  });

  it('macht aus Butter keinen Butt und täuscht keine Treffer vor', () => {
    expect(ids(index, 'Butter')).toEqual(['butter']);
    expect(ids(index, 'Avocado')).toEqual([]);
    expect(ids(index, '   ')).toEqual([]);
  });

  it('verlangt jeden Teil der Eingabe', () => {
    expect(ids(index, 'Apfel roh')).toEqual(['apfel']);
    expect(ids(index, 'Hühnerei gekocht')).toEqual([]);
  });
});

describe('Ganzes Wort vor Grundwort, falsche Freunde (D-357)', () => {
  const index = buildFoodIndex<Item>([
    item('buttermilch', 'Buttermilch'),
    item('magermilch', 'Magermilch'),
    item('milch', 'Milch 3,5 %'),
    item('suesskartoffel', 'Süßkartoffel, roh'),
    item('ofenerdaepfel', 'Ofenerdäpfel'),
    item('erdaepfel', 'Erdäpfel, roh'),
    item('butternuss', 'Butternusskürbis', { aliases: ['Butternut'] }),
    item('kuerbis', 'Kürbis, Hokkaido'),
    item('schenkel', 'Hühneroberschenkel mit Haut'),
    item('obers', 'Schlagobers'),
    item('mandeln', 'Mandeln', { aliases: ['gehackte Mandeln'] }),
    item('faschiertes', 'Faschiertes gemischt'),
    item('butter', 'Butter'),
  ]);

  it('stellt das ganze Wort vor zusammengesetzte Wörter mit diesem Grundwort', () => {
    expect(ids(index, 'Milch')).toEqual(['milch', 'magermilch', 'buttermilch']);
    expect(ids(index, 'Erdäpfel')).toEqual(['erdaepfel', 'ofenerdaepfel', 'suesskartoffel']);
    expect(ids(index, 'Kartoffeln')).toEqual(['erdaepfel', 'ofenerdaepfel', 'suesskartoffel']);
    expect(ids(index, 'Kürbis')).toEqual(['kuerbis', 'butternuss']);
  });

  it('findet Obers und Sahne nicht im Oberschenkel, Butter nicht im Butternusskürbis', () => {
    expect(ids(index, 'Obers')).toEqual(['obers']);
    expect(ids(index, 'Sahne')).toEqual(['obers']);
    // Buttermilch beginnt mit „Butter“ und bleibt ein Treffer, der Butternusskürbis nicht.
    expect(ids(index, 'Butter')).toEqual(['butter', 'buttermilch']);
    expect(ids(index, 'Oberschenkel')).toEqual(['schenkel']);
  });

  it('macht aus Hackfleisch keine gehackten Mandeln', () => {
    expect(ids(index, 'Hackfleisch')).toEqual(['faschiertes']);
    expect(ids(index, 'gehackt')).toEqual(['mandeln']);
  });
});

describe('Dubletten aus mehreren Quellen', () => {
  const values = { kcal: 52, protein: 0.3, carbs: 11.4, fat: 0.6 };

  it('zeigt gleiche Einträge (Name, Marke, Pflichtwerte) nur einmal, den eigenen zuerst', () => {
    const index = buildFoodIndex<Item>([
      item('eigen', 'Apfel', { per100: values }),
      item('import', 'Apfel', { per100: { ...values, protein: 0.32 } }),
      item('anders', 'Apfel', { per100: { ...values, kcal: 58 } }),
      item('marke', 'Apfel', { per100: values, brand: 'Spar' }),
    ]);
    expect(ids(index, 'apfel')).toEqual(['eigen', 'anders', 'marke']);
  });

  it('fasst Einträge ohne Werte nie zusammen', () => {
    const index = buildFoodIndex<Item>([item('a', 'Apfel'), item('b', 'Apfel')]);
    expect(ids(index, 'apfel')).toEqual(['a', 'b']);
  });
});

describe('Bisheriges Verhalten (D-306)', () => {
  const items = [
    { id: '2', name: 'Kartoffel gekocht', aliases: austrianAliases('Kartoffel gekocht') },
    {
      id: '3',
      name: 'Kartoffelpüree mit Milch und Butter',
      aliases: austrianAliases('Kartoffelpüree'),
    },
    { id: '5', name: 'Haferflocken', aliases: [], brand: 'Spar' },
  ];
  const index = buildFoodIndex(items);

  it('findet Marken und sortiert das ganze Wort vor dem Wortanfang', () => {
    expect(searchFoods(index, 'spar').map((f) => f.id)).toEqual(['5']);
    expect(searchFoods(index, 'kartoffel').map((f) => f.id)).toEqual(['2', '3']);
    expect(searchFoods(index, 'erdäpfelpüree').map((f) => f.id)).toEqual(['3']);
  });

  it('begrenzt die Trefferzahl', () => {
    const many = buildFoodIndex(
      Array.from({ length: 80 }, (_, i) => ({ id: String(i), name: `Apfel ${i}`, aliases: [] })),
    );
    expect(searchFoods(many, 'apfel')).toHaveLength(50);
    expect(searchFoods(many, 'apfel', 10)).toHaveLength(10);
  });
});
