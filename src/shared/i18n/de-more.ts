// Texte, die nur nachgeladene Teile brauchen (D-347): Bereich „Mehr“: Übersicht, Profil, Einstellungen, Daten, Installieren, Über die App, Schritte. Gehören zu `de.ts`, liegen
// aber getrennt, damit sie nicht in die Startansicht geladen werden.
export const tMore = {
  more: {
    title: 'Mehr',
    profile: 'Profil und Ziele',
    data: 'Daten und Sicherung',
    settings: 'Einstellungen',
    install: 'Installieren',
    sync: 'Synchronisierung',
    steps: 'Schritte aus dem Dashboard',
    about: 'Über die App',
  },
  profile: {
    title: 'Profil',
    nameLabel: 'Anzeigename (optional)',
    nameHint: 'Ohne Konto, ohne Pflichtangaben. Der Name erscheint nur auf „Heute“.',
    save: 'Speichern',
    saved: 'Gespeichert.',
  },
  settings: {
    more: 'Weiteres',
    title: 'Einstellungen',
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
    training: 'Training',
    restDefault: 'Standardpause',
    restDefaultHint: 'Gilt, wenn Übung oder Satz keine eigene Pause haben.',
    weightStep: 'Gewichtsschritt',
    autoStartRest: 'Pause nach „erledigt“ automatisch starten',
    restSound: 'Ton bei Pausenende',
    restSoundHint:
      'Nur, solange die App im Vordergrund ist. Bei gesperrtem Bildschirm gibt es keinen Ton.',
    keepAwake: 'Bildschirm im Training aktiv halten',
    keepAwakeUnsupported:
      'Dein Browser unterstützt das nicht. Auf dem iPhone funktioniert es ab iOS 18.4 in der installierten App; im Stromsparmodus kann das System ablehnen.',
    keepAwakeDenied: 'Zuletzt hat das System die Anforderung abgelehnt, z. B. im Stromsparmodus.',
    seconds: (n: number) => `${n} s`,
    off: 'Aus',
  },
  data: {
    title: 'Daten und Sicherung',
    exportTitle: 'Daten exportieren',
    exportText:
      'Eine JSON-Datei mit allen Trainings und Einstellungen dieses Geräts. Auf dem iPhone über das Teilen-Menü („In Dateien sichern“), am Mac als Download.',
    exportButton: 'Jetzt exportieren',
    lastExport: (when: string) => `Letzter Export: ${when}`,
    noExportYet: 'Noch kein Export.',
    exportResult: {
      shared: 'Die Datei wurde übergeben.',
      downloaded: 'Die Datei wurde heruntergeladen.',
      cancelled: 'Der Export wurde abgebrochen.',
      failed: 'Der Export hat nicht geklappt. Bitte versuche es erneut.',
    },
    storageTitle: 'Speicher',
    storageHint:
      'Der Browser kann Daten bei Speichermangel löschen, wenn der Speicher nicht dauerhaft ist. In der installierten App gilt er als dauerhaft. Ein regelmäßiger Export schützt zusätzlich.',
    persist: {
      persisted: 'Speicher ist dauerhaft.',
      denied: 'Speicher ist nicht garantiert.',
      unsupported: 'Dauerhafter Speicher wird von diesem Browser nicht gemeldet.',
    },
    usage: (size: string) => `Belegt: ${size}`,
    snapshotsTitle: 'Snapshots',
    snapshotsText:
      'Automatische Sicherungen vor Schema-Upgrades, Importen und dem Löschen aller Daten; die letzten fünf bleiben erhalten. Wiederherstellen folgt in einer späteren Version.',
    noSnapshots: 'Noch kein Snapshot angelegt.',
    snapshotReason: {
      'schema-upgrade': 'Vor Schema-Upgrade',
      import: 'Vor Import',
      'delete-all': 'Vor „Alle Daten löschen“',
    },
    appVersion: 'Version',
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
    // Während eines Trainings bleibt der Hinweis aus (E-01, D-343).
    updateAfterTraining:
      'Eine neue Version ist bereit. „Jetzt aktualisieren“ erscheint, wenn dein Training beendet ist.',
    updateFailed:
      'Die Suche hat nicht geklappt. Prüfe die Internetverbindung und versuche es erneut.',
    updateUnavailable: 'In dieser Umgebung gibt es keine automatischen Updates.',
    /** Lizenzliste der Lebensmitteldaten (Phase Ernährung §6, D-362, `docs/licenses-data.md`). */
    dataTitle: 'Lebensmitteldaten und Lizenzen',
    dataSources: {
      bls: {
        name: 'Bundeslebensmittelschlüssel (BLS) 4.0',
        text: 'Nährwerte der Grundauswahl: Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0, Karlsruhe, DOI 10.25826/Data20251217-134202-0. Kostenfrei nutzbar, auch in Apps, mit Quellenangabe. Gekürzt auf acht Nährwerte, ergänzt um österreichische Namen, Suchbegriffe und Richtwerte je Stück.',
      },
      usda: {
        name: 'USDA SR28',
        text: 'Pfefferoni, Butternusskürbis und Magermilch: U.S. Department of Agriculture, Agricultural Research Service (2015): USDA National Nutrient Database for Standard Reference, Release 28. Gemeinfrei. Nährwerte nach EU-Regeln umgerechnet. Bei den Richtwerten je Stück nur zum Vergleich.',
      },
      pieces: {
        name: 'Richtwerte je Stück und Scheibe',
        text: 'Mittelgroße Stücke, essbarer Anteil. Meist nach der Schweizer Nährwerttabelle 2021 (SGE, BAG, ETH), beim Apfel und bei der Birne ohne Kerngehäuse gerechnet (Anteil nach CoFID, Vereinigtes Königreich), Erdäpfel geschält (Schälverlust nach DTU, Dänemark). Ei Größe M nach der EU-Vermarktungsnorm für Eier und dem Schweizer Ernährungsbulletin 2021 (BLV), Semmel nach dem Österreichischen Lebensmittelbuch (Codex-Kapitel B 18, Mindestgewicht), Käsescheiben nach DTU (Dänemark) und NICE (Belgien), Avocado (Sorte Hass) nach DTU, Reiswaffeln nach dem Voedingscentrum (Niederlande). Du kannst jedes Gewicht anpassen; FORM merkt es sich.',
      },
      off: {
        name: 'Open Food Facts',
        text: 'Produkte per Barcode, nur wenn du es einschaltest: Open Food Facts, Open Database License (ODbL).',
      },
      import: {
        name: 'Importierte Lebensmitteldaten',
        text: 'Was du selbst importierst (ÖNWT), bleibt auf deinem Gerät und ist nicht Teil der App.',
      },
    },
    /** Gerätedaten zum Nachsehen bei Fehlern am Gerät (D-388). Bezeichnungen wie im Browser. */
    deviceTitle: 'Gerätedaten',
    deviceHint:
      'Maße von Fenster und Bildschirm, zum Nachsehen bei Fehlern in der Darstellung. Sie ändern sich beim Drehen, Auf- und Zuklappen. Die App speichert und überträgt sie nicht.',
    device: {
      window: 'Fenster (innerWidth × innerHeight)',
      layout: 'Layout (clientWidth × clientHeight)',
      screen: 'Bildschirm (screen.width × screen.height)',
      available: 'Verfügbar (screen.availWidth × screen.availHeight)',
      outer: 'Fenster außen (outerWidth × outerHeight)',
      position: 'Lage des Fensters (screenX / screenY)',
      startScreen: 'Startfläche: Bildschirm (Breite × Höhe, Quelle)',
      startShift: 'Startfläche: Verschiebung (x, y)',
      startSource: {
        bildschirm: 'aus screen.*',
        duo: 'Maße des Duo',
        fenster: 'nichts verlässlich, mittig im Fenster',
        widerspruch: 'Werte widersprechen sich, nicht genutzt',
      },
      startFirst: 'Startfläche: beim Start zuerst gemeldet',
      startChanges: 'Startfläche: Änderungen beim Start',
      startShown: 'Startfläche: Logo erschienen',
      startNoChanges: 'keine',
      startNotShown: 'nicht gezeigt',
      startReason: {
        stabil: 'Werte stabil',
        zeit: 'Werte nicht stabil, nach der Wartezeit',
      },
      startLayout: (size: string) => `Layout ${size}`,
      startScreenOf: (size: string) => `Bildschirm ${size}`,
      startAfter: (ms: string) => `nach ${ms} ms`,
      viewport: 'Sichtbarer Bereich (visualViewport, Breite × Höhe)',
      viewportOffset: 'visualViewport offsetTop / pageTop',
      safeArea: 'Sichere Bereiche (oben, rechts, unten, links)',
      orientation: 'Ausrichtung (screen.orientation, Typ und Winkel)',
      pixelRatio: 'Pixeldichte (devicePixelRatio)',
      displayMode: 'Anzeigemodus',
      standalone: 'App vom Home-Bildschirm',
      browser: 'Browser (z. B. Safari)',
      unavailable: 'nicht verfügbar',
    },
    privacyTitle: 'Daten und Datenschutz',
    privacyText:
      'Keine Werbung, keine Analyse. Deine Daten bleiben auf diesem Gerät, solange du dich nicht anmeldest; angemeldet gleicht die App sie mit deinem eigenen Speicher bei Supabase ab. Andere Dienste fragt sie nur, wenn du sie selbst einschaltest: Open Food Facts beim Scannen und die Schritte aus dem Dashboard.',
  },
  steps: {
    title: 'Schritte',
    pageTitle: 'Schritte aus dem Dashboard',
    intro:
      'Zeigt deine Schritte aus der Step Challenge deines Dashboards auf „Heute“. Melde dich dazu einmal mit deinem Dashboard-Konto an. Die App liest nur und ändert im Dashboard nichts.',
    privacy:
      'E-Mail und Passwort gehen nur an die Datenbank deines Dashboards. Die Anmeldung bleibt auf diesem Gerät; am iPhone und am Mac je einmal anmelden.',
    email: 'E-Mail des Dashboards',
    password: 'Passwort des Dashboards',
    connect: 'Verbinden',
    connecting: 'Verbinde …',
    connectedAs: (email: string) => `Verbunden als ${email}`,
    refresh: 'Jetzt abholen',
    refreshing: 'Hole Schritte …',
    disconnect: 'Verbindung trennen',
    disconnectHint: 'Löscht die Anmeldung und die abgeholten Schritte auf diesem Gerät.',
    lastFetched: (time: string) => `Zuletzt abgeholt: ${time}`,
    invalidCredentials:
      'E-Mail oder Passwort stimmen nicht. Nutzt du im Dashboard nur den Link per E-Mail, vergib dort zuerst ein Passwort.',
    offline: 'Keine Verbindung zum Dashboard. Versuch es später noch einmal.',
    failed: 'Das hat nicht geklappt. Bitte versuche es erneut.',
    authExpired: 'Die Anmeldung beim Dashboard ist abgelaufen. Bitte neu verbinden.',
    notSetUp: 'Die Step Challenge ist im Dashboard für dieses Jahr noch nicht eingerichtet.',
    connectHint: 'Verbinde dein Dashboard, dann siehst du hier deine Schritte.',
    connectLink: 'Verbinden',
    unit: 'Schritte',
    target: (n: string) => `Ziel ${n}`,
    toGo: (n: string) => `noch ${n}`,
    targetReached: 'Ziel erreicht. Das warst du.',
    notLogged: 'Heute noch nichts übertragen',
    year: (percent: string, ytd: string, goal: string) => `Jahr ${percent} % · ${ytd} von ${goal}`,
    stale: (time: string) => `Stand ${time}`,
    meterLabel: 'Schritte heute im Verhältnis zum Tagesziel',
  },
} as const;
