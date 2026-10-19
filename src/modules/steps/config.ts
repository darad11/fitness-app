/**
 * Supabase-Projekt des Dashboards des Produktinhabers (D-277), nur lesend für die Schritte. Der
 * öffentliche Schlüssel steht auch im Dashboard selbst; ohne Anmeldung erlaubt er nichts, die
 * Zeilen sind per RLS auf den eigenen Nutzer beschränkt.
 */
export const DASHBOARD_URL = 'https://jbkufpyyfmbxjeswagli.supabase.co';
export const DASHBOARD_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impia3VmcHl5Zm1ieGplc3dhZ2xpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MjgyMjYsImV4cCI6MjA4MzEwNDIyNn0.vmi9FErxUI2bZy_0vEqoCwoZ8RMgH7uRAtJ8QAhU8VY';
/** Einstellung des Dashboards mit Jahresziel und Startwert (Tabelle `settings`). */
export const CHALLENGE_SETTING = 'stepChallenge';
