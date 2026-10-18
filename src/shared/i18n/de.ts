/**
 * Deutscher Textkatalog (D-212). Anrede „du“, Satzschreibweise, aktive Verben auf Knöpfen
 * (design-system.md Abschnitt 12). Texte mit Werten sind Funktionen.
 */
export const de = {
  app: {
    name: 'Fitness',
  },
  common: {
    back: 'Zurück',
    close: 'Schließen',
    reload: 'Neu laden',
    retry: 'Erneut versuchen',
    dismiss: 'Ausblenden',
  },
  nav: {
    label: 'Hauptnavigation',
    skipToContent: 'Zum Inhalt springen',
    today: 'Heute',
    training: 'Training',
    progress: 'Fortschritt',
    more: 'Mehr',
  },
  today: {
    title: 'Heute',
    versionTitle: 'Diese Version',
    versionText:
      'Diese erste Version enthält die Grundlage der App: Installation, Offline-Start und Einstellungen. Das Training mit Programmen, Pausentimer und Verlauf folgt mit der nächsten Version.',
    statusTitle: 'Status',
    offlineReady: 'Offline verfügbar',
    offlinePreparing: 'Wird für die Offline-Nutzung vorbereitet',
    offlineUnsupported: 'Offline-Nutzung in diesem Browser nicht verfügbar',
    installed: 'Als App installiert',
    notInstalled: 'Läuft im Browser',
    installLink: 'Installieren',
    localData: 'Alle Daten bleiben auf diesem Gerät.',
  },
  more: {
    title: 'Mehr',
    profile: 'Profil und Ziele',
    data: 'Daten und Sicherung',
    settings: 'Einstellungen',
    install: 'Installieren',
    about: 'Über die App',
  },
  settings: {
    title: 'Einstellungen',
    appearance: 'Darstellung',
    themeLabel: 'Farbschema',
    themeLight: 'Hell',
    themeDark: 'Dunkel',
    themeSystem: 'System',
    themeHint: '„System“ folgt der Einstellung deines Geräts.',
    formatting: 'Sprache und Formatierung',
    localeLabel: 'Datum und Zahlen',
    localeAuto: 'Automatisch (Gerät)',
    localeAT: 'Österreich',
    localeDE: 'Deutschland',
    localeCH: 'Schweiz',
    formattingHint:
      'Alle Texte sind deutsch. „Automatisch“ richtet sich nach Sprache und Region deines Geräts. Wochen beginnen am Montag, Zeiten im 24-Stunden-Format.',
    example: (date: string, time: string, number: string, weight: string) =>
      `Beispiel: ${date} · ${time} · ${number} · ${weight}`,
    saveFailed: 'Speichern hat nicht geklappt. Bitte versuche es erneut.',
  },
  install: {
    title: 'Installieren',
    statusInstalled: 'Die App läuft als installierte App.',
    statusBrowser: 'Die App läuft gerade im Browser.',
    promptButton: 'App installieren',
    promptAccepted: 'Die Installation wurde gestartet.',
    dataSeparation:
      'Daten im Browser-Tab und in der installierten App werden getrennt gespeichert. Verwende nach der Installation nur noch die App vom Home-Bildschirm bzw. aus dem Dock.',
    offlineNote:
      'Öffne die App nach der Installation einmal mit Internetverbindung. Danach startet sie auch offline.',
    iphoneTitle: 'iPhone',
    iphoneSteps: [
      'Öffne diese Seite in Safari.',
      'Tippe auf „Teilen“. Je nach iOS-Version liegt es direkt in der Leiste oder im Menü „…“.',
      'Wähle „Zum Home-Bildschirm“. Falls die Option „Als Web-App öffnen“ erscheint, lass sie eingeschaltet.',
      'Tippe auf „Hinzufügen“ und starte die App über das neue Symbol.',
    ],
    ipadTitle: 'iPad',
    ipadSteps: [
      'Öffne diese Seite in Safari.',
      'Tippe oben rechts auf „Teilen“ (je nach Version im Menü „…“).',
      'Wähle „Zum Home-Bildschirm“ und dann „Hinzufügen“.',
    ],
    macTitle: 'Mac',
    macSteps: [
      'Safari: Menü „Ablage“ › „Zum Dock hinzufügen …“.',
      'Chrome: Installationssymbol rechts in der Adressleiste oder im Chrome-Menü die Installation der Seite als App wählen.',
    ],
    hintHidden: 'Der Installationshinweis ist ausgeblendet.',
    showHintAgain: 'Hinweis wieder anzeigen',
  },
  about: {
    title: 'Über die App',
    version: 'Version',
    build: 'Build',
    environment: 'Umgebung',
    environments: {
      production: 'Produktiv',
      preview: 'Vorschau',
      development: 'Entwicklung',
      ci: 'Testlauf',
      local: 'Lokal',
    },
    storageId: 'Speicher-ID',
    storageIdHint:
      'Kennung des lokalen Speichers. Browser-Tab und installierte App haben getrennte Speicher und damit verschiedene IDs.',
    checkUpdate: 'Nach Update suchen',
    checking: 'Suche nach einer neuen Version …',
    upToDate: 'Du verwendest die aktuelle Version.',
    updateFound:
      'Eine neue Version wurde gefunden. Sobald sie geladen ist, erscheint „Jetzt aktualisieren“.',
    updateFailed:
      'Die Suche hat nicht geklappt. Prüfe die Internetverbindung und versuche es erneut.',
    updateUnavailable: 'In dieser Umgebung gibt es keine automatischen Updates.',
    privacyTitle: 'Daten und Datenschutz',
    privacyText:
      'Keine Anmeldung, keine Werbung, keine Analyse. Alle Daten bleiben auf diesem Gerät; die App lädt nur ihre eigenen Dateien von der eigenen Adresse.',
  },
  banners: {
    preview: 'Vorschau – Testdaten',
    previewHint:
      'Diese Adresse ist eine Vorschau. Daten hier sind von der Produktivversion getrennt.',
    updateAvailable: 'Neue Version verfügbar',
    updateNow: 'Jetzt aktualisieren',
    installHint:
      'Für dauerhafte Daten: Teilen › Zum Home-Bildschirm. Daten im Browser-Tab sind von der installierten App getrennt.',
    installGuide: 'Anleitung',
    replaced:
      'Die App wurde in einem anderen Fenster aktualisiert. Lade sie neu, um weiterzumachen.',
  },
  errors: {
    routeTitle: 'Diese Ansicht hat einen Fehler',
    routeText:
      'Die übrigen Bereiche funktionieren weiter. Der Fehler wurde ohne persönliche Daten im Fehlerprotokoll vermerkt.',
    notFoundTitle: 'Seite nicht gefunden',
    notFoundText: 'Diese Adresse gibt es in der App nicht.',
    toToday: 'Zu Heute',
  },
  recovery: {
    title: 'Die Daten lassen sich gerade nicht öffnen',
    text: 'Deine gespeicherten Daten bleiben auf dem Gerät. Versuche es erneut; oft hilft ein Neustart der App.',
    causeStorageBlocked:
      'Der Browser erlaubt keinen lokalen Speicher, zum Beispiel im privaten Modus oder wenn Website-Daten blockiert sind.',
    causeNewerVersion:
      'Die Daten stammen von einer neueren Version der App. Lade die App neu, um die neue Version zu verwenden.',
    causeConnectionLost: 'Die Verbindung zur lokalen Datenbank ist wiederholt abgebrochen.',
    causeUnknown: 'Unbekannte Ursache.',
    causeLabel: 'Ursache',
  },
} as const;

export type Texts = typeof de;
export const t: Texts = de;
