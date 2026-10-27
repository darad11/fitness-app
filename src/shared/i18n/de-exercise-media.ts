// Texte, die nur nachgeladene Teile brauchen (D-288): Visuals und Ausführung der Übungen
// (D-397, D-398). Gehören zu `de.ts`, liegen aber getrennt, damit sie nicht in die Startansicht
// geladen werden.
export const tExerciseMedia = {
  /** Bereich der Demonstration im Player; ohne Übungsnamen, damit er nicht wie die Übung heißt. */
  demoRegion: 'Ausführung der aktuellen Übung',
  /** Muskelkarte in den Übungsdetails (D-401). */
  muscleMapLabel: (muscles: string) => `Muskelkarte. ${muscles}`,
  muscleMapFront: 'Vorne',
  muscleMapBack: 'Hinten',
  /** Knopf über der Demonstration im Player. */
  openInfo: (name: string) => `${name}: Ausführung und Angaben`,
  phaseStart: 'Ausgangsposition',
  phaseEnd: 'Endposition',
  phasesAlt: (alt: string) => `${alt} Zwei Bilder im Wechsel: Ausgangs- und Endposition.`,
  guideTitle: 'Ausführung',
  setupTitle: 'Ausgangsposition',
  stepsTitle: 'Schritt für Schritt',
  cuesTitle: 'Technik',
  mistakesTitle: 'Häufige Fehler',
  safetyTitle: 'Sicherheit',
  sourcesTitle: 'Quellen',
  sourcesChecked: (date: string) => `abgerufen am ${date}`,
  disclaimer:
    'Allgemeine Hinweise zur Technik, keine persönliche oder medizinische Empfehlung. Wenn etwas schmerzt, hör auf und lass dich beraten.',
  guideMissing: 'Für diese Übung gibt es noch keine belegte Beschreibung der Ausführung.',
  guideCustom: 'Eigene Übung: Die Ausführung beschreibst du bei Bedarf in deiner Notiz.',
  guideFailed: 'Die Beschreibung konnte nicht geladen werden. Bitte versuche es später erneut.',
  allDetails: 'Alle Angaben zur Übung',
  tabGuide: 'Ausführung',
  imageSource: (name: string, license: string) => `Bild: ${name}, ${license}`,
};
