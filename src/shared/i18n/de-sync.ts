// Texte, die nur nachgeladene Teile brauchen (D-288): Synchronisierung und Anmeldung (D-269). Gehören zu `de.ts`, liegen
// aber getrennt, damit sie nicht in die Startansicht geladen werden.
export const tSync = {
  title: 'Synchronisierung',
  intro:
    'Gleicht deine Daten zwischen iPhone, iPad und Mac ab. Gespeichert wird in deinem eigenen Supabase-Projekt in Frankfurt; nur du kannst nach der Anmeldung darauf zugreifen.',
  notSynced:
    'Nicht abgeglichen werden importierte Lebensmitteldaten (ÖNWT) und die Erlaubnis für Open Food Facts; beides bleibt je Gerät.',
  email: 'E-Mail',
  password: 'Passwort',
  signIn: 'Anmelden',
  signingIn: 'Wird angemeldet …',
  /** Name der Anmeldung: Alternativtext des Logos (FORM, D-316). */
  loginTitle: 'FORM',
  /** Claim und Unterzeile der Marke, nur an Markenstellen (form-markenleitplanken.md Regel 4). */
  claim: 'FORM YOURSELF.',
  claimSub: 'Werde die Person, die du sein möchtest.',
  loginSubtitle:
    'Melde dich an, damit Training, Ernährung und Fortschritt auf all deinen Geräten gleich sind.',
  later: 'Später',
  signUp: 'Registrieren',
  signingUp: 'Wird registriert …',
  signUpSubtitle:
    'Lege dein Konto mit E-Mail und Passwort an. Damit gleichst du Training, Ernährung und Fortschritt zwischen deinen Geräten ab.',
  toSignUp: 'Noch kein Konto? Registrieren',
  toSignIn: 'Schon registriert? Anmelden',
  passwordNew: (min: number) => `Passwort (mindestens ${String(min)} Zeichen)`,
  passwordRepeat: 'Passwort wiederholen',
  passwordTooShort: (min: number) => `Das Passwort braucht mindestens ${String(min)} Zeichen.`,
  passwordMismatch: 'Die Passwörter stimmen nicht überein.',
  confirmSent: (email: string) =>
    `Fast geschafft: Wir haben eine E-Mail an ${email} geschickt. Tippe auf den Link darin und melde dich dann hier an.`,
  confirmed: 'E-Mail bestätigt. Melde dich jetzt mit E-Mail und Passwort an.',
  confirmFailed:
    'Der Bestätigungslink ist abgelaufen oder ungültig. Registriere dich erneut oder melde dich an.',
  signUpErrors: {
    disabled:
      'Neue Konten sind gerade nicht erlaubt. Schalte in Supabase „Allow new users to sign up“ ein oder lege das Konto dort an.',
    exists: 'Zu dieser E-Mail gibt es schon ein Konto. Melde dich an.',
    weakPassword: 'Das Passwort ist zu schwach. Nimm ein längeres Passwort.',
    invalidEmail: 'Diese E-Mail-Adresse passt nicht. Bitte prüfe sie.',
  },
  loginNote: 'Ohne Anmeldung bleibt alles auf diesem Gerät.',
  invalidCredentials: 'E-Mail oder Passwort stimmt nicht.',
  offline: 'Keine Verbindung. Bitte versuche es mit Netz erneut.',
  failed: 'Das hat nicht geklappt. Bitte versuche es erneut.',
  signedInAs: (email: string) => `Angemeldet als ${email}`,
  lastSync: (date: string) => `Zuletzt abgeglichen: ${date}`,
  never: 'Noch nicht abgeglichen.',
  lastResult: (pulled: number, pushed: number) =>
    `Zuletzt ${String(pulled)} geholt, ${String(pushed)} gesendet.`,
  conflicts: (n: number) =>
    `${String(n)} Konfliktkopie${n === 1 ? '' : 'n'} angelegt (Name mit „Konflikt“). Bitte prüfen und die nicht benötigte Fassung löschen.`,
  errors: {
    SyncOfflineError: 'Letzter Versuch ohne Verbindung. Sobald Netz da ist, geht es weiter.',
    SessionExpiredError: 'Die Anmeldung ist abgelaufen. Bitte melde dich erneut an.',
    NotSignedInError: 'Nicht angemeldet.',
    AppOutdatedError:
      'Ein anderes Gerät nutzt eine neuere Version der App. Der Abgleich wartet, bis diese App aktualisiert ist („Über die App“ › „Nach Update suchen“).',
    other: 'Der letzte Abgleich ist fehlgeschlagen. Er wird automatisch wiederholt.',
  } as Record<string, string>,
  syncNow: 'Jetzt abgleichen',
  syncing: 'Wird abgeglichen …',
  auto: 'Die App gleicht automatisch ab: beim Öffnen, nach Änderungen und alle 5 Minuten, solange sie offen ist.',
  signOut: 'Abmelden',
  signOutHint: 'Beim Abmelden bleiben alle Daten auf diesem Gerät.',
} as const;
