import { listDe } from '../lib/list';

// Texte, die nur nachgeladene Teile brauchen (D-288): Ernährung (Schritt G, D-261). Gehören zu `de.ts`, liegen
// aber getrennt, damit sie nicht in die Startansicht geladen werden.

/** Zahl und Prozentzeichen bleiben beisammen („45 %“ bricht nicht um), D-366. */
const keepPercent = (text: string) => text.replace(/(\d) %/g, '$1\u00a0%');

/** Mehrzahl der Einheiten der Grundauswahl; „Stück“ bleibt gleich. */
const UNIT_PLURAL: Readonly<Record<string, string>> = {
  Stück: 'Stück',
  Scheibe: 'Scheiben',
  Zehe: 'Zehen',
  Stange: 'Stangen',
  Kolben: 'Kolben',
};

export const tNutrition = {
  title: 'Ernährung',
  today: 'Heute',
  previousDay: 'Vorheriger Tag',
  nextDay: 'Nächster Tag',
  slots: { breakfast: 'Frühstück', lunch: 'Mittagessen', dinner: 'Abendessen', snacks: 'Snacks' },
  add: 'Hinzufügen',
  addTo: (slot: string) => `Zu ${slot} hinzufügen`,
  eaten: 'Gegessen',
  goal: 'Ziel',
  remaining: (kcal: string) => `noch ${kcal} kcal`,
  over: (kcal: string) => `${kcal} kcal über dem Tagesziel`,
  /** Ring für VoiceOver (D-326): „732 von 2.390 kcal, davon Eiweiß 184, …“. */
  ringLabel: (eaten: string, goal: string) => `${eaten} von ${goal} kcal`,
  ringParts: (parts: string) => `davon ${parts}`,
  ringOther: 'nicht zugeordnet',
  ofKcal: (goal: string) => `/ ${goal} kcal`,
  kcalOnly: (eaten: string) => `${eaten} kcal`,
  macros: { protein: 'Eiweiß', carbs: 'Kohlenhydrate', fat: 'Fett' },
  macrosShort: { protein: 'Eiweiß', carbs: 'Kohlenh.', fat: 'Fett' },
  nutrients: {
    kcal: 'Energie',
    protein: 'Eiweiß',
    carbs: 'Kohlenhydrate',
    sugar: 'davon Zucker',
    fat: 'Fett',
    saturatedFat: 'davon gesättigte Fettsäuren',
    fiber: 'Ballaststoffe',
    salt: 'Salz',
  },
  units: { kcal: 'kcal', g: 'g', ml: 'ml' },
  noValue: '–',
  nutrientsTitle: 'Nährwerte',
  forAmount: (amount: string) => `für ${amount}`,
  extrasLabel: 'Weitere Nährwerte',
  nutrientNames: {
    kcal: 'Energie',
    protein: 'Eiweiß',
    carbs: 'Kohlenhydrate',
    sugar: 'Zucker',
    fat: 'Fett',
    saturatedFat: 'gesättigte Fettsäuren',
    fiber: 'Ballaststoffe',
    salt: 'Salz',
  },
  extras: {
    sugar: 'Zucker',
    salt: 'Salz',
    fiber: 'Ballaststoffe',
    saturatedFat: 'Gesättigte Fettsäuren',
  },
  /** Kurzform, wenn die Zeile auf schmalen Bildschirmen sonst umbräche (D-363). */
  extrasShort: { saturatedFat: 'Ges. Fettsäuren' },
  /**
   * Ist und Tagesreferenz unter „Weitere Nährwerte“ (D-359), kompakt als „0,3 / 6 g“ (D-363);
   * Erklärung, Quellen und fehlende Angaben stehen im Info-Blatt.
   */
  reference: {
    infoLabel: 'Erklärung und Quellen',
    /** Für Screenreader hinter dem Sternchen. */
    incomplete: 'nicht bei allen Einträgen angegeben',
    sheetIntro:
      'Je Zeile steht, was du an diesem Tag gegessen hast, und die Referenz am Tag. Allgemeine Orientierungswerte, keine Ziele und keine medizinische Empfehlung.',
    atMost: (grams: string) => `höchstens ${grams} g`,
    atLeast: (grams: string) => `mindestens ${grams} g`,
    /**
     * Grundlage bei Zucker und gesättigten Fettsäuren (D-369): 10 % der Kalorien aus dem
     * Tagesziel, ohne Ziel aus 2.000 kcal; dazu die Energie je Gramm.
     */
    energyBasis: (kcal: string, fromTarget: boolean, kcalPerGram: number) =>
      fromTarget
        ? `10 % der Kalorien aus deinem Tagesziel von ${kcal} kcal, ${String(kcalPerGram)} kcal je g.`
        : `Ohne Tagesziel 10 % von ${kcal} kcal, ${String(kcalPerGram)} kcal je g.`,
    notes: {
      salt: 'EU-Referenzmenge für Erwachsene (LMIV).',
      sugar:
        'Der Wert folgt der Empfehlung von WHO und DGE (unter 10 % der Energie). Beim Zucker meint sie freien Zucker; die App zählt jeden Zucker, auch aus Obst und Milch, deshalb ist der Wert eine strenge Orientierung.',
      saturatedFat: 'Der Wert folgt der Empfehlung von WHO und DGE (unter 10 % der Energie).',
      fiber: 'Richtwert der DGE für Erwachsene.',
    },
    asterisk:
      '* Bei mindestens einem Eintrag fehlt dieser Wert. Er zählt nicht als 0; die Zahl gilt nur für die Einträge mit Angabe.',
    missingTitle: 'Ohne Angabe an diesem Tag',
    /** Einträge ohne Angabe: höchstens drei Namen, dann „n weitere“. */
    missingNames: (names: readonly string[]) => {
      const shown = names.slice(0, 3);
      const more = names.length - shown.length;
      return listDe(more > 0 ? [...shown, `${String(more)} weitere`] : shown);
    },
    /** Dieselben Einträge fehlen bei allen vier Werten: eine Zeile statt vier. */
    missingAll: 'Alle vier Werte',
    sourcesTitle: 'Quellen',
    sources:
      'Salz nach der EU-Lebensmittelinformationsverordnung (LMIV, VO (EU) Nr. 1169/2011, Anhang XIII). Zucker und gesättigte Fettsäuren nach der Empfehlung von WHO und DGE, jeweils unter 10 % der Energie; ohne Tagesziel mit der Referenzmenge der LMIV von 2.000 kcal. Ballaststoffe nach der Deutschen Gesellschaft für Ernährung (DGE).',
  },
  noTarget: 'Noch kein Tagesziel.',
  setTarget: 'Ziel festlegen',
  targets: 'Ziele',
  shortcuts: 'Ziel und Meine Küche',
  kitchen: {
    title: 'Meine Küche',
    target: 'Ziel',
    subtitle: 'Alles, was du immer wieder isst.',
    foodsHint: 'Eigene, gescannte und ÖNWT-Daten',
    recipesHint: 'Aus Zutaten, portionsweise eintragen',
    templatesHint: 'Ganze Mahlzeiten mit einem Tipp',
    newFood: 'Lebensmittel',
    newRecipe: 'Rezept',
  },
  myFoods: 'Meine Lebensmittel',
  emptySlot: 'Noch nichts eingetragen.',
  entryCount: (n: number) => (n === 1 ? '1 Eintrag' : `${n} Einträge`),
  incomplete: (names: readonly string[]) =>
    `Bei mindestens einem Eintrag fehlen Werte für ${listDe(names)}.`,
  estimatedHint: 'Enthält Schätzungen (Schnelleinträge).',
  entryLabel: (name: string, brand?: string) =>
    brand ? `${name} von ${brand} bearbeiten` : `${name} bearbeiten`,
  entryTitle: 'Eintrag bearbeiten',
  amountLabel: (unit: string) => `Menge in ${unit}`,
  servingsLabel: 'Anzahl',
  servingOption: (name: string, amount: string, unit: string) => `${name} (${amount} ${unit})`,
  quantityLabel: 'Einheit',
  slotLabel: 'Mahlzeit',
  save: 'Speichern',
  cancel: 'Abbrechen',
  delete: 'Löschen',
  deleted: (name: string) => `„${name}“ gelöscht`,
  undo: 'Rückgängig',
  saveFailed: 'Das ließ sich nicht speichern. Bitte versuche es erneut.',
  invalidAmount: 'Bitte gib eine Menge größer als 0 ein.',
  // Hinzufügen
  addTitle: 'Lebensmittel hinzufügen',
  searchLabel: 'Lebensmittel suchen',
  searchPlaceholder: 'z. B. Topfen, Haferflocken, Apfel',
  recent: 'Zuletzt verwendet',
  favorites: 'Favoriten',
  results: (n: number) => (n === 1 ? '1 Treffer' : `${n} Treffer`),
  noResults: 'Nichts gefunden. Lege ein eigenes Lebensmittel an oder nutze den Schnelleintrag.',
  searchHint:
    'Suche in deinen Lebensmitteln und Rezepten, in der Grundauswahl und in importierten Lebensmitteldaten.',
  loadingFoods: 'Lebensmittel werden geladen …',
  basicFailed: 'Die Grundauswahl ließ sich nicht laden. Gesucht wird ohne sie.',
  sourceBadge: {
    custom: 'Eigenes',
    quick: 'Schnell',
    bls: 'BLS',
    usda: 'USDA',
    off: 'Open Food Facts',
    import: 'Import',
    recipe: 'Rezept',
  },
  /** Grundauswahl (Phase Ernährung §6, D-362): Menge in g oder Stück, Stückgewicht, Quelle. */
  basic: {
    unitLegend: 'Menge in',
    grams: 'Gramm',
    count: (unit: string) => `Anzahl (${unit})`,
    /** „1 Scheibe“, „2 Scheiben“, „1,5 Scheiben“, „2 Stück“. */
    pieces: (count: number, countText: string, unit: string) =>
      `${countText} ${count === 1 ? unit : (UNIT_PLURAL[unit] ?? unit)}`,
    fewer: 'Anzahl verringern',
    more: 'Anzahl erhöhen',
    /** Vorauswahl mit Richtwert (D-365): „1 Stück · ca. 150 g“. */
    summary: (pieces: string, grams: string) => `${pieces} · ca. ${grams} g`,
    richtwert: (grams: string, unit: string, hint?: string) =>
      `Richtwert: ${grams} g je ${unit}${hint ? `, ${hint}` : ''}`,
    own: (grams: string, unit: string, listed: string) =>
      `Dein Gewicht: ${grams} g je ${unit}, Richtwert ${listed} g`,
    adjust: 'Gewicht anpassen',
    reset: 'Auf Richtwert zurücksetzen',
    pieceLabel: (unit: string) => `Gewicht für 1 ${unit} in g`,
    adjustHint:
      'FORM merkt sich dein Gewicht beim Hinzufügen und zeigt es beim nächsten Mal statt des Richtwerts.',
    invalidPiece: 'Bitte gib ein Gewicht zwischen 0,1 und 5.000 g ein.',
    invalidCount: 'Bitte gib eine Anzahl größer als 0 ein, höchstens 100.',
    invalidHalf: 'Bitte gib die Anzahl in ganzen oder halben Schritten an, höchstens 100.',
    /**
     * Kurze Quelle unter der Nährwerttabelle (D-362); die volle Zitierweise mit DOI steht unter
     * „Über die App“ (D-366: ohne eigenen Wortlaut des Produktinhabers bleibt sie so).
     */
    source: {
      bls: (code: string, name: string) => `Quelle: BLS 4.0, ${code} „${keepPercent(name)}“`,
      usda: (code: string, name: string) =>
        `Quelle: USDA SR28, ${code} „${keepPercent(name)}“, umgerechnet nach EU-Regeln`,
    },
    derivedMark: '*',
    derivedLabel: 'abgeleitet',
    derivedNote:
      '* Abgeleitet: Die Quelle nennt keinen Wert, das Lebensmittel enthält diesen Nährstoff von Natur aus nicht.',
  },
  catalogBadge: { oenwt: 'ÖNWT' },
  per100: (unit: string) => `je 100 ${unit}`,
  quick: 'Schnelleintrag',
  quickTitle: 'Schnelleintrag',
  quickHint: 'Nur Kalorien und auf Wunsch Makros. Wird als Schätzung markiert.',
  quickName: 'Bezeichnung (optional)',
  quickKcal: 'Energie (kcal)',
  quickProtein: 'Eiweiß (g, optional)',
  quickCarbs: 'Kohlenhydrate (g, optional)',
  quickFat: 'Fett (g, optional)',
  newFood: 'Eigenes Lebensmittel anlegen',
  logTitle: (name: string) => `${name} hinzufügen`,
  preview: (kcal: string) => `${kcal} kcal`,
  added: (name: string) => `„${name}“ hinzugefügt`,
  backToDay: 'Zum Tag',
  // Eigene Lebensmittel
  foodsTitle: 'Meine Lebensmittel',
  foodsEmpty: 'Noch keine eigenen Lebensmittel.',
  archivedTitle: (n: number) => `Archiv (${n})`,
  newFoodTitle: 'Neues Lebensmittel',
  editFoodTitle: 'Lebensmittel bearbeiten',
  nameLabel: 'Name',
  brandLabel: 'Marke (optional)',
  basisLabel: 'Nährwerte je',
  basis: { g: '100 g', ml: '100 ml' },
  per100Title: (unit: string) => `Nährwerte je 100 ${unit}`,
  required: 'Pflicht',
  optional: 'optional',
  servingsTitle: 'Portionen (optional)',
  servingName: 'Name der Portion',
  servingAmount: (unit: string) => `Menge in ${unit}`,
  addServing: 'Portion hinzufügen',
  removeServing: (name: string) => `Portion ${name} entfernen`,
  favorite: 'Favorit',
  archive: 'Archivieren',
  unarchive: 'Wiederherstellen',
  foodNotFound: 'Dieses Lebensmittel gibt es nicht mehr.',
  kcalCheck: (computed: string) =>
    `Hinweis: Aus Eiweiß, Kohlenhydraten und Fett ergeben sich etwa ${computed} kcal. Bitte prüfe die Angaben.`,
  errors: {
    name: 'Bitte gib einen Namen mit höchstens 100 Zeichen ein.',
    core: 'Energie, Eiweiß, Kohlenhydrate und Fett sind Pflicht.',
    range: 'Ein Wert liegt außerhalb des möglichen Bereichs (je 100 höchstens 100 g, 900 kcal).',
    serving: 'Jede Portion braucht einen Namen und eine Menge größer als 0.',
    barcode: 'Der Barcode ist ungültig (8, 12, 13 oder 14 Ziffern mit passender Prüfziffer).',
    number: 'Bitte gib Zahlen ein, z. B. 12,5.',
  },
  catalog: {
    title: 'Lebensmitteldaten',
    empty: 'Noch keine Lebensmitteldaten importiert.',
    hint: 'Datei der BLS-Recherche von nutritional-software.at (nuts-recherche.json), danach die Marken (nuts-marken.json). Die Daten bleiben nur auf diesem Gerät; nichts wird hochgeladen.',
    brandsMissing: 'Noch keine Marken. Importiere dazu die Datei nuts-marken.json.',
    brandsStatus: (count: string) => `${count} davon mit Marke`,
    brandsPreviewTitle: 'Marken importieren',
    brandsPreview: (count: string) =>
      `${count} deiner importierten Lebensmittel bekommen eine Marke.`,
    brandsHow:
      'Die Marke stammt aus der Herstellerangabe der Recherche, z. B. „Alnatura“ oder „Spar“. Sie erscheint in der Suche neben dem Namen und lässt sich suchen. Frühere Marken werden ersetzt.',
    brandsImported: (count: string) => `Marken für ${count} Lebensmittel importiert.`,
    brandsNeedCatalog:
      'Zu dieser Markendatei passen keine Lebensmittel. Importiere zuerst nuts-recherche.json.',
    status: (count: string) => `${count} Lebensmittel importiert`,
    statusDetail: (date: string) =>
      `Aus der Österreichischen Nährwerttabelle (ÖNWT), importiert am ${date}`,
    choose: 'Datei auswählen',
    replace: 'Neue Datei importieren',
    reading: 'Datei wird geprüft …',
    remove: 'Import entfernen',
    previewTitle: 'Lebensmitteldaten importieren',
    previewKept: (count: string) => `${count} Lebensmittel werden übernommen:`,
    keptOenwt: (count: string) => `${count} aus der Österreichischen Nährwerttabelle (ÖNWT)`,
    previewSkipped: 'Weggelassen:',
    skippedBls: (count: string) => `${count} deutsche Einträge (BLS)`,
    skippedDiscontinued: (count: string) => `${count} auslaufende Produkte`,
    skippedInvalid: (count: string) => `${count} unvollständig oder doppelt`,
    skippedAmbiguous: (count: string) =>
      `${count} mit unklarer Zuordnung (gleicher Code, verschiedene Namen)`,
    replaces: 'Der bisherige Import wird ersetzt.',
    confirm: 'Importieren',
    saving: 'Wird gespeichert …',
    imported: (count: string) => `${count} Lebensmittel importiert.`,
    removed: 'Import entfernt.',
    removeTitle: 'Import entfernen?',
    removeText:
      'Die importierten Lebensmittel verschwinden aus der Suche. Deine Einträge im Protokoll behalten ihre Werte. Du kannst die Datei jederzeit erneut importieren.',
    wrongFile: 'Diese Datei passt nicht. Bitte wähle nuts-recherche.json oder nuts-marken.json.',
    nothingNew: 'Die Datei enthält keine neuen Lebensmittel.',
    failed: 'Das hat nicht geklappt. Bitte versuche es erneut.',
  },
  barcode: {
    scan: 'Barcode scannen',
    title: 'Barcode scannen',
    hint: 'Halte den Barcode ruhig in den Rahmen.',
    starting: 'Kamera wird gestartet …',
    denied:
      'Kein Zugriff auf die Kamera. Erlaube ihn in den Einstellungen oder gib den Barcode unten ein.',
    unsupported: 'Die Kamera ist hier nicht verfügbar. Gib den Barcode unten ein.',
    cameraError: 'Die Kamera ließ sich nicht starten. Gib den Barcode unten ein.',
    manualLabel: 'Barcode eingeben',
    manualHint: '8 oder 13 Ziffern unter den Strichen',
    search: 'Suchen',
    invalid: 'Das ist kein gültiger Barcode. Bitte prüfe die Ziffern.',
    searching: (code: string) => `Suche ${code} …`,
    notFound: (code: string) =>
      `${code} ist bei Open Food Facts nicht bekannt. Lege das Produkt selbst an; beim nächsten Scan findet die App es.`,
    unavailable:
      'Open Food Facts ist gerade nicht erreichbar (kein Netz?). Lege das Produkt selbst an oder versuche es später.',
    incomplete: 'Bei Open Food Facts fehlen Werte. Bitte ergänze sie.',
    saved: (name: string) => `„${name}“ unter „Meine Lebensmittel“ gespeichert`,
    createOwn: 'Selbst anlegen',
    retry: 'Erneut versuchen',
    consentTitle: 'Open Food Facts verwenden?',
    consentText:
      'Für unbekannte Barcodes fragt die App bei Open Food Facts nach, einer freien Lebensmitteldatenbank. Dabei werden nur der Barcode und deine IP-Adresse übertragen, keine anderen Daten. Gefundene Produkte speichert die App unter „Meine Lebensmittel“, damit der nächste Scan ohne Netz geht. Die Angaben stammen von Freiwilligen und können Fehler enthalten.',
    consentAllow: 'Erlauben und suchen',
    consentDeny: 'Nein, selbst anlegen',
    barcodeLabel: 'Barcode (optional)',
    offTitle: 'Open Food Facts',
    offOn: (date: string) =>
      `Erlaubt seit ${date}. Beim Scannen geht nur der Barcode an Open Food Facts.`,
    offOff: 'Nicht erlaubt. Unbekannte Barcodes legst du selbst an.',
    offRevoke: 'Erlaubnis zurückziehen',
    offGrant: 'Erlauben',
    offSource: 'Daten: Open Food Facts, Open Database License (ODbL).',
    fromOff: 'Werte von Open Food Facts. Bitte mit der Verpackung vergleichen.',
  },
  recipes: {
    toShopping: 'Zutaten auf die Einkaufsliste',
    toShoppingDone: (n: number) =>
      n === 1 ? '1 Zutat steht auf der' : `${String(n)} Zutaten stehen auf der`,
    title: 'Rezepte',
    empty:
      'Noch keine Rezepte. Lege ein Gericht aus Zutaten an; die App rechnet die Nährwerte je Portion aus.',
    newRecipe: 'Neues Rezept',
    newTitle: 'Neues Rezept',
    editTitle: 'Rezept bearbeiten',
    notFound: 'Dieses Rezept gibt es nicht mehr.',
    summary: (servings: number, kcal: string) =>
      `${String(servings)} ${servings === 1 ? 'Portion' : 'Portionen'} · ${kcal} kcal je Portion`,
    nameLabel: 'Name',
    servingsLabel: 'Portionen',
    ingredientsTitle: 'Zutaten',
    noIngredients: 'Noch keine Zutaten.',
    addIngredient: 'Zutat hinzufügen',
    ingredientAmount: (name: string, unit: string) => `Menge ${name} in ${unit}`,
    removeIngredient: (name: string) => `${name} entfernen`,
    pickTitle: 'Zutat hinzufügen',
    pickSearch: 'Zutat suchen',
    amountTitle: (name: string) => `${name}: Menge`,
    add: 'Hinzufügen',
    back: 'Zurück zur Suche',
    nutrientsTitle: 'Nährwerte',
    perServing: 'je Portion',
    total: 'gesamt',
    missingHint: (names: readonly string[]) =>
      `Bei mindestens einer Zutat fehlen Werte für ${listDe(names)}. In der Summe fehlen sie deshalb.`,
    weightHint: (grams: string) =>
      `Zutaten zusammen ${grams} g (Milliliter zählen wie Gramm). Eine Portion trägst du als „Portion“ ein.`,
    stepsLabel: 'Zubereitung (optional)',
    save: 'Speichern',
    delete: 'Rezept löschen',
    deleteTitle: 'Rezept löschen?',
    deleteText: 'Das Rezept verschwindet. Einträge im Protokoll behalten ihre Werte.',
    deleted: (name: string) => `„${name}“ gelöscht`,
    errors: {
      name: 'Bitte gib einen Namen mit höchstens 100 Zeichen ein.',
      servings: 'Portionen: eine ganze Zahl von 1 bis 50.',
      ingredients: 'Ein Rezept braucht mindestens eine und höchstens 40 Zutaten.',
      amount: 'Jede Menge muss größer als 0 und höchstens 5000 sein.',
      steps: 'Die Zubereitung darf höchstens 5000 Zeichen haben.',
    },
  },
  templates: {
    title: 'Vorlagen',
    empty:
      'Noch keine Vorlagen. Trag eine Mahlzeit ein und tippe dort auf „Als Vorlage speichern“.',
    saveFromSlot: 'Als Vorlage speichern',
    saveFromSlotLabel: (slot: string) => `${slot} als Vorlage speichern`,
    saveTitle: 'Als Vorlage speichern',
    nameLabel: 'Name der Vorlage',
    defaultName: (slot: string) => slot,
    save: 'Speichern',
    saved: (name: string) => `Vorlage „${name}“ gespeichert`,
    summary: (count: number, kcal: string) =>
      `${String(count)} ${count === 1 ? 'Eintrag' : 'Einträge'} · ${kcal} kcal`,
    applyTitle: (name: string) => `${name} eintragen`,
    applyText: (slot: string) => `Alle Einträge kommen zu „${slot}“.`,
    apply: 'Alle eintragen',
    applied: (name: string) => `„${name}“ eingetragen`,
    rename: 'Umbenennen',
    renameTitle: 'Vorlage umbenennen',
    renameLabel: (name: string) => `${name} umbenennen`,
    delete: 'Löschen',
    deleteLabel: (name: string) => `${name} löschen`,
    deleted: (name: string) => `Vorlage „${name}“ gelöscht`,
    nameError: 'Bitte gib einen Namen mit höchstens 60 Zeichen ein.',
    tooMany: 'Eine Vorlage hat höchstens 30 Einträge.',
  },
  // Ziele
  targetsTitle: 'Tagesziele',
  currentTarget: 'Aktuelles Ziel',
  methods: { manual: 'Selbst festgelegt', computed: 'Aus Vorschlag übernommen' },
  manualTitle: 'Selbst festlegen',
  kcalLabel: 'Energie (kcal)',
  proteinLabel: 'Eiweiß (g)',
  carbsLabel: 'Kohlenhydrate (g)',
  fatLabel: 'Fett (g)',
  saveTarget: 'Ziel speichern',
  targetSaved: 'Gespeichert',
  targetError: 'Energie zwischen 800 und 6000 kcal, Makros zwischen 0 und 600 g.',
  suggestTitle: 'Vorschlag berechnen',
  suggestHint:
    'Grundumsatz nach Mifflin-St Jeor mal Aktivität, Eiweiß 1,8 g je kg, Fett 30 % der Energie, Rest Kohlenhydrate. Ein Vorschlag, keine individuelle Empfehlung; bei gesundheitlichen Fragen hol dir ärztlichen Rat.',
  sexLabel: 'Geschlecht (für die Formel)',
  sexes: { female: 'Weiblich', male: 'Männlich' },
  birthYearLabel: 'Geburtsjahr',
  heightLabel: 'Größe (cm)',
  weightLabel: 'Gewicht (kg)',
  weightHint: 'Vorbelegt mit deinem letzten Gewichtseintrag.',
  activityLabel: 'Aktivität im Alltag und Training',
  activities: {
    sedentary: 'Kaum Bewegung',
    light: 'Leicht (1–3 Trainings pro Woche)',
    moderate: 'Mittel (3–5 Trainings pro Woche)',
    active: 'Hoch (6–7 Trainings pro Woche)',
    very_active: 'Sehr hoch (körperliche Arbeit und Training)',
  },
  directionLabel: 'Ziel',
  directions: {
    lose: 'Abnehmen (−500 kcal)',
    maintain: 'Gewicht halten',
    gain: 'Zunehmen (+300 kcal)',
  },
  calculate: 'Berechnen',
  suggestion: 'Vorschlag',
  useSuggestion: 'Vorschlag übernehmen',
  inputError: 'Bitte prüfe die Angaben: Größe 100–250 cm, Gewicht 30–300 kg, Geburtsjahr gültig.',
  todayCard: 'Ernährung heute',
  toNutrition: 'Zur Ernährung',
} as const;
