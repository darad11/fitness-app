/**
 * Texte für das Wiederherstellen aus dem Export (Mehr › Daten, D-345). Eigene Datei, damit die
 * Startansicht nicht wächst (D-288); Ton nach `form-markenleitplanken.md`: ruhig, du, ohne
 * Ausrufezeichen.
 */
export const tBackup = {
  title: 'Sicherung wiederherstellen',
  text: 'Spiel eine Datei aus „Jetzt exportieren“ wieder ein. FORM prüft sie zuerst und zeigt dir, was darin steht. Erst nach deiner Bestätigung ersetzt es die Daten auf diesem Gerät.',
  choose: 'Sicherung wählen',
  reading: 'Datei wird geprüft …',
  unchanged: 'An deinen Daten hat sich nichts geändert.',
  rejected: {
    notJson: 'Diese Datei lässt sich nicht lesen. Wähl eine Datei aus „Jetzt exportieren“.',
    tooLarge: 'Diese Datei ist zu groß für eine Sicherung von FORM.',
    foreign: 'Diese Datei ist keine Sicherung von FORM.',
    damaged: 'Diese Sicherung ist beschädigt oder unvollständig.',
    newer:
      'Diese Sicherung stammt von einer neueren Version von FORM. Aktualisiere zuerst die App.',
    invalid: (what: string) => `In dieser Sicherung ist ein Eintrag ungültig (${what}).`,
  },
  /** Dokumentart für die Meldung „ungültig“, ohne Inhalt des Eintrags. */
  kinds: {
    session: 'Training',
    program: 'Programm',
    training_state: 'aktives Programm',
    exercise: 'eigene Übung',
    exercise_pref: 'Angaben zu einer Übung',
    body_weight: 'Körpergewicht',
    goal: 'Ziel',
    settings: 'Einstellungen',
    profile: 'Profil',
    habit: 'Aufgabe',
    habit_log: 'Eintrag einer Aufgabe',
    food: 'Lebensmittel',
    food_log_entry: 'Ernährungseintrag',
    nutrition_target: 'Ernährungsziel',
    recipe: 'Rezept',
    meal_template: 'Mahlzeit-Vorlage',
    shopping_item: 'Einkaufsliste',
    water_entry: 'Wasser',
  } as Record<string, string>,
  otherKind: 'Eintrag',
  summaryTitle: 'In dieser Sicherung',
  exportedAtLabel: 'Stand',
  period: (from: string, to: string) => (from === to ? from : `${from} bis ${to}`),
  periodLabel: 'Zeitraum',
  periodNone: 'keine Einträge',
  trainings: 'Trainings',
  foodEntries: 'Ernährungseinträge',
  tasks: 'Aufgaben',
  replaceHint:
    'Beim Wiederherstellen ersetzt FORM alle Daten auf diesem Gerät durch diese Sicherung. Vorher sichert es den aktuellen Stand als Datei.',
  emptyHint:
    'Auf diesem Gerät ist noch nichts gespeichert. FORM übernimmt alles aus der Sicherung.',
  syncHint:
    'Du bist mit der Synchronisierung angemeldet. Beim nächsten Abgleich übernehmen deine anderen Geräte den wiederhergestellten Stand.',
  restore: 'Wiederherstellen',
  cancel: 'Abbrechen',
  confirmTitle: 'Daten ersetzen?',
  confirmText:
    'Zuerst sichert FORM den aktuellen Stand als Datei. Danach ersetzt es alle Daten auf diesem Gerät durch die Sicherung.',
  confirm: 'Sichern und ersetzen',
  confirmTitleEmpty: 'Sicherung übernehmen?',
  confirmTextEmpty:
    'Auf diesem Gerät ist noch nichts gespeichert. FORM übernimmt alles aus der Sicherung.',
  confirmEmpty: 'Übernehmen',
  busy: 'Wird wiederhergestellt …',
  done: (when: string) => `Die Sicherung vom ${when} ist wiederhergestellt.`,
  failed: 'Das Wiederherstellen hat nicht geklappt.',
  trainingRunning:
    'Während eines Trainings lässt sich nichts wiederherstellen. Beende zuerst dein Training.',
  notSaved: 'Ohne Sicherung des aktuellen Stands ersetzt FORM nichts.',
};
