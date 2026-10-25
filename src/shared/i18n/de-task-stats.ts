// Texte, die nur nachgeladene Seiten brauchen (D-288); gehören zu `de.ts`, liegen aber getrennt,
// damit sie nicht in die Startansicht geladen werden.
export const tTaskStats = {
  title: 'Fortschritt',
  periodLegend: 'Zeitraum: letzte Tage',
  periods: { '7d': '7', '30d': '30', '90d': '90', all: 'Gesamt' },
  periodNames: { '7d': '7 Tage', '30d': '30 Tage', '90d': '90 Tage', all: 'Gesamt' },
  today: 'Heute',
  todayValue: (done: string, total: string) => `${done} / ${total}`,
  rate: 'Erfüllt',
  rateHint: 'der fälligen Aufgaben, ohne heute',
  rateNone: 'Noch nichts auswertbar',
  /** Wochenbild statt Serie (Leitplanken Regel 2; F4, D-318). */
  week: 'Diese Woche',
  weekValue: (done: string, due: string) => `${done} von ${due}`,
  weekHint: 'Tage mit allem erledigt, ab Montag',
  active: 'Aktive Aufgaben',
  since: (date: string) => `Daten seit ${date}; davor gibt es nichts zu werten.`,
  noDataDays: (n: number) =>
    n === 1
      ? 'An 1 Tag gab es keinen Eintrag; er zählt nicht mit.'
      : `An ${n} Tagen gab es keinen Eintrag; sie zählen nicht mit.`,
  empty: 'Sobald du Aufgaben abhakst, siehst du hier deinen Fortschritt.',
  chartTitle: 'Verlauf',
  chartHintDay: 'Erledigte Aufgaben je Tag;',
  /** Neben der Markierung unter dem Verlauf (D-334). */
  chartComplete: 'alles erledigt.',
  chartHintWeek: 'Erfüllt je Woche in Prozent.',
  chartAria: (n: number, unit: 'day' | 'week') =>
    `Balkendiagramm, ${n} ${unit === 'day' ? 'Tage' : 'Wochen'}; die Werte stehen in der Liste darunter.`,
  chartDone: 'Erledigt',
  chartOpen: 'Offen',
  chartNoData: 'kein Eintrag',
  chartToday: 'heute, läuft noch',
  chartWeek: (date: string) => `Woche ab ${date}`,
  chartDay: (date: string, done: number, due: number) =>
    due === 0 ? `${date}: nichts fällig` : `${date}: ${done} von ${due} erledigt`,
  chartWeekValue: (date: string, percent: string, done: number, due: number) =>
    `Woche ab ${date}: ${percent} (${done} von ${due})`,
  perTask: 'Je Aufgabe',
  matrixCaptionDay: 'Alle Aufgaben je Tag im Zeitraum',
  matrixCaptionWeek: 'Alle Aufgaben je Woche im Zeitraum',
  matrixWeekFull: 'Füllhöhe: Anteil erledigt',
  matrixWeekNone: 'nichts erledigt',
  sortLegend: 'Sortieren',
  sorts: {
    list: 'Eigene Reihenfolge',
    best: 'Höchste Quote zuerst',
    lowest: 'Niedrigste Quote zuerst',
    up: 'Größte Verbesserung zuerst',
    down: 'Stärkster Rückgang zuerst',
  },
  taskLine: (done: number, due: number) =>
    due === 1 ? `an ${done} von 1 fälligen Tag` : `an ${done} von ${due} fälligen Tagen`,
  taskNone: 'noch nichts zu werten; heute zählt ab morgen mit',
  change: (points: number) =>
    points === 0 ? '± 0 Punkte' : `${points > 0 ? '+' : '−'}${Math.abs(points)} Punkte`,
  paused: 'pausiert',
  removed: 'gelöscht',
  openTask: (name: string) => `${name} – Auswertung öffnen`,
  insightsTitle: 'Hinweise',
  observation: 'Beobachtung',
  suggestion: 'Vorschlag',
  insights: {
    oftenSkipped: (name: string, percent: string, due: number) =>
      `„${name}“ hast du in den letzten 30 Tagen an ${percent} der ${due} fälligen Tage erledigt.`,
    oftenSkippedTip:
      'Vielleicht hilft eine kleinere Version, z. B. 10 statt 30 Minuten. Oder pausiere sie für eine Weile.',
    weekend: (name: string, week: string, weekend: string) =>
      `„${name}“ klappt unter der Woche zu ${week}, am Wochenende zu ${weekend}.`,
    weekendTip: 'Ein fester Zeitpunkt am Wochenende kann helfen.',
    improving: (name: string, points: number) =>
      `„${name}“ liegt in den letzten 30 Tagen ${points} Punkte über den 30 Tagen davor.`,
    improvingTip: 'Das ist auf dem Weg zur Gewohnheit.',
    stabilize: (added: number, points: number) =>
      `Seit ${added} neue Aufgaben dazugekommen sind, liegt die Quote ${Math.abs(points)} Punkte unter den 30 Tagen davor.`,
    stabilizeTip:
      'Es kann sich lohnen, erst die bestehenden Aufgaben zu festigen, bevor neue dazukommen.',
  },
  detail: {
    back: 'Tagesaufgaben',
    done: 'Erledigt',
    doneValue: (done: string, due: string) => `${done} / ${due}`,
    doneHint: 'fällige Tage, ohne heute',
    week: 'Diese Woche',
    weekHint: 'fällige Tage erledigt, ab Montag',
    compare: (label: string, before: string, now: string, change: string) =>
      `${label} davor: ${before}, jetzt ${now} (${change}).`,
    compareNone: 'Kein Vergleich: Im Zeitraum davor gibt es zu wenig Daten.',
    compareAll: 'Für „Gesamt“ gibt es keinen Zeitraum davor.',
    calendar: 'Kalender',
    calendarHint: 'Ältester Tag zuerst.',
    calendarLimited: 'Der Kalender zeigt die letzten 90 Tage.',
    states: {
      done: 'erledigt',
      open: 'nicht erledigt',
      notDue: 'nicht fällig',
      noData: 'kein Eintrag',
      today: 'heute',
    },
    weekdays: 'Wochentage',
    weekdaysHint: 'Erfüllt je Wochentag im Zeitraum.',
    weekdaysTooFew:
      'Für Wochentage braucht es mindestens drei fällige Tage je Wochentag, an dem die Aufgabe gilt.',
    weekdayNames: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
    notFound: 'Diese Aufgabe gibt es nicht mehr.',
    status: (state: 'paused' | 'removed') =>
      state === 'paused'
        ? 'Pausiert: zählt nicht mehr als fällig.'
        : 'Gelöscht: zählt nicht mehr als fällig; frühere Tage bleiben.',
  },
} as const;
