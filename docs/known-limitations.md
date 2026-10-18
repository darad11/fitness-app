# Bekannte Einschränkungen

Stand: 18.10.2026 · Version 0.3 (M0 umgesetzt) · Vorgänger: `archive/v0.1-phase-1/known-limitations.md`

## Änderungen gegenüber Version 0.1

- iOS-Befunde mit Quellen belegt und präzisiert: Speichertrennung zwischen Safari und installierter App, Wake Lock erst ab iOS 18.4, Verbindungsverlust der IndexedDB, Audio-Session, fehlende Vibration, fehlender BarcodeDetector.
- Korrektur zu `navigator.storage.persist()`: Safari gewährt den dauerhaften Speicher nach Heuristik und laut Quellen für Home-Bildschirm-Apps; in v0.1 stand pauschal „keine Garantie".
- Neu: Zusagen und Nicht-Zusagen zum Timer (Abschnitt 3), Grenzen der Testwerkzeuge (Abschnitt 5), Bindung an die Adresse (Abschnitt 6), Supabase-Grenzen (Abschnitt 7), Liste dessen, was ausdrücklich nicht behauptet wird (Abschnitt 11).
- Version 0.3: Grenzen des Standes M0 (Abschnitt 12); Quellen jetzt Abschnitt 13.

## 1. Grenzen der Analyse

- Die Xeela-App wurde nicht bedient. Grundlage sind öffentliche Quellen (`product-research.md`).
- Direkter Abruf vieler Hosts ist aus dieser Cloud-Umgebung durch die Netzwerkrichtlinie gesperrt. Die Recherche in Phase 2 stützt sich auf Websuche mit Zitaten. Punkte mit Restunsicherheit tragen den Vermerk „im Gerätetest prüfen" oder „im Prüfspike prüfen".
- Rezensionen stammen überwiegend aus 2024 und 2025. Dort genannte Schwächen sind Erkenntnisse aus dieser Zeit, nicht automatisch der heutige Stand von Xeela (D-118).

## 2. iPhone und iPad

Auf iOS und iPadOS nutzen alle Browser WebKit. Maßgeblich ist, was Safari und installierte Home-Bildschirm-Apps können.

| Fähigkeit | Befund | Quelle | Auswirkung | Umgang |
|---|---|---|---|---|
| Installation | Nur manuell über „Teilen › Zum Home-Bildschirm"; kein Installationsdialog | Allgemein dokumentiert | Nutzer muss selbst installieren | Anleitung in der App (AK-PWA-04, AK-SET-06) |
| Speichertrennung | Installierte Web-Apps haben eigene Cookies, Web Storage und IndexedDB, getrennt von Safari; Service Worker und Cache Storage teilen sie seit iOS 14. Apple bezeichnet die Isolation als beabsichtigt | firt.dev (iOS 14); WebKit-Bug 181849 | Daten aus dem Safari-Tab erscheinen nicht in der installierten App | Hinweis im Safari-Tab; Empfehlung, nur die installierte App zu nutzen; Umzug per Export und Import |
| 7-Tage-Regel | Safari löscht skriptbeschreibbaren Speicher einer Website nach 7 Nutzungstagen ohne Interaktion; Home-Bildschirm-Apps zählen ihre Nutzungstage getrennt, die Regel greift dort praktisch nicht | WebKit-Richtlinie, zitiert in mehreren Quellen | Gefahr im Safari-Tab | Installation als Voraussetzung für echte Nutzung |
| Dauerhafter Speicher | `navigator.storage.persist()` wird nach Heuristik gewährt, laut Quellen für Home-Bildschirm-Apps, ohne Nachfrage | WebKit-Speicherrichtlinie 2023 (Sekundärquellen) | Schutz vor Räumung unter Speicherdruck nicht garantiert | Anfordern und Status anzeigen (AK-PWA-05); Export und Snapshots |
| Speicherkontingent | Laut Sekundärquellen bis etwa 60 % des Gerätespeichers je Origin seit Safari 17; Räumung unter Speicherdruck nach Nutzungsalter bleibt möglich | Sekundärquellen, nicht primär bestätigt | Für Trainingsdaten unkritisch, für Fotos relevant (R4) | `navigator.storage.estimate()` anzeigen; Fotos komprimieren |
| Verbindungsverlust der IndexedDB | Nach Rückkehr aus dem Hintergrund meldet Safari teils „Connection to Indexed Database server lost"; WebKit-Fehler 197050 ist offen; Dexie öffnet neu, das hilft laut Berichten nicht immer; Neuladen hilft zuverlässig | WebKit-Bugs 197050, 273827; Dexie-Issue 2008 | Speichern kann fehlschlagen | Gesundheitsprüfung, Neuöffnen, kontrollierter Neustart vor neuen Eingaben (D-216, AK-TRN-26) |
| JavaScript im Hintergrund | Wird im Hintergrund und bei gesperrtem Bildschirm angehalten; Apple verhindert Hintergrundausführung bewusst | Apple Developer Forums | Timer laufen im Hintergrund nicht weiter | Endzeitpunkte statt Zähler (AK-TRN-11) |
| Ton | Web Audio braucht eine Bedienung zur Freischaltung; die Audio-Session-API ist in WebKit nur teilweise aktiv, Berichte zu „transient" sind widersprüchlich | MDN; WebKit-Bug 264473 | Ton nur im Vordergrund sicher | Ton im Vordergrund, Typ „ambient", Gerätetest (D-215, AK-TRN-12) |
| Wake Lock | In installierten Web-Apps erst ab iOS 18.4 behoben; die Sperre endet, sobald die Seite verborgen ist; Stromsparmodus kann ablehnen | WebKit-Features in Safari 18.4; WebKit-Bug 254545 | Unter iOS 18.4 geht der Bildschirm aus | Mindestziel 18.4 (D-228); Neuanforderung bei Rückkehr (AK-TRN-13) |
| Vibration | `navigator.vibrate` steht in Safari auf iOS nicht zur Verfügung | Kompatibilitätsangaben mehrerer Quellen | Keine Haptik | Nicht angeboten |
| Web Push | Nur für installierte Web-Apps ab iOS 16.4, Berechtigung nur nach Bedienung; Declarative Web Push ab iOS 18.4 | WebKit-Blog „Meet Declarative Web Push"; Anbieterdokumentationen | Erinnerungen brauchen Installation und einen Server | R5 |
| Hintergrund-Synchronisierung | Background Sync und Periodic Sync fehlen in Safari | Allgemein dokumentiert | Abgleich nur bei geöffneter App | Abgleich bei Start, Rückkehr, Online-Ereignis (R3) |
| Barcode-Erkennung | `BarcodeDetector` ist in Safari bis 26.x und in den 27er-Vorschauen standardmäßig deaktiviert | caniuse | Keine native Erkennung | Polyfill `barcode-detector` auf Basis von zxing-wasm (D-305, Prüfspike S-3) |
| Kamera | `getUserMedia` funktioniert auch in installierten Apps; ob die Berechtigung wiederholt abgefragt wird, ist im Prüfspike zu klären | Allgemein dokumentiert; Rest im Spike | Barcode-Scan möglich | R2, Prüfspike S-3 |
| Dateien | Keine File System Access API; Export über Teilen-Menü oder Download, Import über Dateiauswahl | Allgemein dokumentiert | Kein direkter Ordnerzugriff | AK-DAT-01, AK-DAT-02 |
| Apple Health, Apple Watch | Keine Web-Schnittstelle | Allgemein dokumentiert | Keine automatische Übernahme | Ausgeschlossen (D-116); native Option in Abschnitt 9 |
| Kurzbefehle | Ein aus Kurzbefehle geöffneter Link öffnet Safari, nicht die installierte App; wegen der Speichertrennung kommen so übergebene Daten nicht in der App an | Ableitung aus der Speichertrennung; im Spike zu bestätigen | Kein Import per Link | R4: Import über Datei oder Zwischenablage; R5: Kurzbefehl sendet an Supabase |

## 3. Timer und Signale im MVP

**Zugesagt:**

- Der Pausentimer zeigt nach Reload, Tabwechsel, Wechsel in den Hintergrund und Entsperren innerhalb einer Sekunde die korrekte Restzeit oder die Überziehung (AK-TRN-11).
- Im Vordergrund erscheint bei Pausenende eine deutliche visuelle Anzeige und, falls eingeschaltet, ein kurzer Ton (AK-TRN-12).
- Der Bildschirm bleibt während einer Einheit aktiv, wenn iOS 18.4 oder neuer läuft und der Stromsparmodus es zulässt (AK-TRN-13).

**Nicht zugesagt:**

- Ein Ton oder eine Benachrichtigung bei gesperrtem Bildschirm oder im Hintergrund.
- Dass der Ton laufende Musik nicht unterbricht; das Ziel ist es, über den Typ „ambient" zu mischen, der Befund kommt aus dem Gerätetest.
- Haptisches Feedback.

**Gerätebefund T-IPH-M1:** ausstehend. Hier werden die Ergebnisse der Schritte 4 bis 7 eingetragen.

## 4. Mac

- Safari ab macOS 14 erstellt über „Zum Dock hinzufügen" eine installierte Web-App mit eigenem Fenster; Chrome und Edge bieten die PWA-Installation an.
- Auch am Mac gilt: Daten gehören zur jeweiligen Installation bzw. zum jeweiligen Browserprofil; ohne Sync helfen Export und Import.
- Unterschiede werden über Feature-Erkennung behandelt, nie über die Browserkennung.

## 5. Testwerkzeuge

- Playwright-WebKit ist nicht Safari auf iOS. Es fehlen Home-Bildschirm-Modus, Speicherisolation, Anhalten im Hintergrund und Betriebssystemdienste (Hinweise von Testanbietern; `testing.md` Abschnitt 3).
- In dieser Cloud-Umgebung ist nur Chromium installiert; WebKit-Läufe brauchen GitHub Actions (Q-01).
- Lighthouse prüft keine PWA-Kategorie mehr (D-221).

## 6. Hosting und Adresse

- IndexedDB-Daten gehören zu genau einer Adresse. Ein Wechsel der Adresse oder Domain lässt vorhandene Daten in der App verschwinden; sie müssen per Export und Import umziehen. Die Produktivadresse wird deshalb vor M1 festgelegt (Q-02).
- Vorschau-Adressen haben eigene, getrennte Daten; sie dienen nur Tests.
- Hosting erfolgt auf Vercel (D-231). Der Hobby-Plan ist nur für persönliche, nicht kommerzielle Nutzung erlaubt; laut Sekundärquellen gelten 100 GB Datentransfer und 100 Deployments pro Tag. Bei Überschreitung pausiert Vercel Funktionen statt Kosten zu berechnen.
- Vorschau-Adressen können je nach Einstellung des Vercel-Kontos eine Vercel-Anmeldung verlangen. Eine installierte Vorschau-App hat wegen der Speichertrennung keine solche Anmeldung; Vorschauen werden deshalb im Safari-Tab geprüft, die installierte App nutzt die Produktivadresse.
- GitHub Pages ist für private Repositories im kostenlosen Plan nicht verfügbar.

## 7. Supabase (ab R3)

- Kostenlose Projekte pausieren nach 7 Tagen ohne Aktivität und müssen manuell reaktiviert werden; laut Sekundärquellen 500 MB Datenbank, 1 GB Dateispeicher, keine automatischen Backups. Der Pro-Plan kostet laut diesen Quellen 25 USD pro Monat.
- Laut einer Quelle ändert sich die Data API für bestehende kostenlose Projekte ab 30.10.2026; vor R3 zu prüfen.
- Der öffentliche Anon-Key ist kein Geheimnis; die Sicherheit hängt vollständig an RLS. RLS-Tests sind Teil der Abnahme von R3.
- Bei aktivierter Sync liegen die synchronisierten Nutzdaten bei Supabase (`data-sources.md` Abschnitt 8).

## 8. Datenquellen

Prüfergebnisse und Restfragen stehen in `data-sources.md`: strengere Limits bei Open Food Facts (15 Produktabfragen und 10 Suchanfragen pro Minute und IP), ungeklärte User-Agent-Anforderung im Browser, unsicheres CORS-Verhalten der Suche; BLS 4.0 frei unter CC BY 4.0.

## 9. Native Erweiterung (spätere Option)

Ein nativer Rahmen um dieselbe Web-App, etwa mit Capacitor, würde HealthKit, lokal geplante Benachrichtigungen, verlässliche Signale im Hintergrund und Haptik ermöglichen. Er setzt einen Apple-Developer-Account, Xcode und eine Verteilung über TestFlight oder den App Store voraus. Die Web-Architektur bleibt dabei unverändert. Die Option ist bewusst nicht Teil von R1 bis R4.

## 10. Eignung als Web-App

| Bereich | Bewertung |
|---|---|
| Training, Programme, Übungen, Verlauf, Körpergewicht, Ziele, Export, Import | Ohne Einschränkung als Web-App umsetzbar |
| Pausentimer | Umsetzbar mit Einschränkung: kein garantiertes Signal im Hintergrund |
| Bildschirm aktiv | Umsetzbar ab iOS 18.4 |
| Ernährung, Rezepte, Wochenmenü, Einkaufsliste | Umsetzbar; Barcode mit Polyfill und Prüfspike |
| Synchronisierung | Umsetzbar; nur bei geöffneter App |
| Fotos | Umsetzbar; Speicher beachten |
| Erinnerungen | Nur installiert und mit Server |
| Schritte | Nur manuell oder per Kurzbefehl-Import |
| Apple Health, Apple Watch, Haptik | Nicht als Web-App |

## 11. Was ausdrücklich nicht behauptet wird

- Dass Daten im Browser ohne Sicherung dauerhaft sicher sind.
- Dass Töne oder Hinweise im Hintergrund oder bei gesperrtem Bildschirm funktionieren.
- Dass Playwright-Tests Safari auf iOS vollständig abbilden.
- Dass Open Food Facts ohne Prüfspike verlässlich aus dem Browser nutzbar ist.
- Dass die App Schritte misst oder Daten mit Apple Health austauscht.

## 12. Stand M0 (18.10.2026)

- **WebKit ungetestet:** Alle E2E-Tests liefen bisher nur in Chromium. WebKit läuft erst in GitHub Actions, sobald das Repository besteht; das Verhalten auf dem iPhone prüft T-IPH-M0.
- **Noch keine Produktivadresse:** `vercel.json` ist fertig, das Vercel-Projekt verbindet der Produktinhaber. Das Etikett „Vorschau – Testdaten" hängt an der Vercel-Umgebung (`VERCEL_ENV`) und lässt sich erst auf einer Vorschau-Adresse sehen; lokal ist es nur als Komponententest geprüft.
- **Safari-Hinweis:** Die Erkennung nutzt Browserkennung, Touch-Unterstützung und `display-mode`. Eingebettete Browser anderer Apps können wie Safari erscheinen. Die Anleitung ist bewusst allgemein formuliert, weil sich die Lage von „Teilen" je nach iOS-Version unterscheidet.
- **Installationsknopf** gibt es nur in Chromium-Browsern (`beforeinstallprompt`); Safari bietet keinen solchen Dialog, dort hilft nur die Anleitung.
- **Offline-Status:** Beim allerersten Aufruf zeigt „Heute" „Wird für die Offline-Nutzung vorbereitet", bis der Service Worker alle Dateien gespeichert hat. Im Entwicklungsmodus (`pnpm dev`) gibt es keinen Service Worker.
- **Updates:** Die App fragt beim Start und höchstens einmal pro Stunde bei Rückkehr in den Vordergrund nach einer neuen Version, außerdem über „Nach Update suchen". Die Sperre des Update-Hinweises während eines Trainings folgt mit M4 (AK-PWA-03), weil es in M0 noch kein Training gibt.
- **Snapshots und Wiederherstellung:** Snapshots lassen sich anlegen und lesen; das Wiederherstellen folgt mit M1 und M4. Der Wiederherstellungsbildschirm bietet in M0 nur Ursache, „Erneut versuchen" und gegebenenfalls „Jetzt aktualisieren".
- **Formatierung de-CH:** Schweizer Tausendertrennzeichen mit Dezimalkomma (D-233); das weicht von der üblichen Schweizer Schreibweise mit Punkt ab.
- **Build-Manifest:** `dist/.vite/manifest.json` wird mit ausgeliefert, weil die Prüfung der Bündelgröße es braucht. Es enthält nur Dateinamen und keine Daten.

## 13. Quellen

- WebKit-Features in Safari 18.4: https://webkit.org/blog/16574/webkit-features-in-safari-18-4/
- WebKit-Bug 254545 (Wake Lock in Home-Bildschirm-Apps): https://bugs.webkit.org/show_bug.cgi?id=254545
- WebKit-Bug 197050 (IndexedDB-Verbindungsverlust): https://bugs.webkit.org/show_bug.cgi?id=197050
- WebKit-Bug 273827: https://bugs.webkit.org/show_bug.cgi?id=273827
- Dexie-Issue 2008: https://github.com/dexie/Dexie.js/issues/2008
- WebKit-Bug 181849 (Speicherisolation): https://bugs.webkit.org/show_bug.cgi?id=181849
- Safari auf iOS 14 für PWA-Entwickler: https://firt.dev/ios-14/
- Audio Session API: https://developer.mozilla.org/en-US/docs/Web/API/Audio_Session_API und https://bugs.webkit.org/show_bug.cgi?id=264473
- Declarative Web Push: https://webkit.org/?p=16535
- BarcodeDetector-Unterstützung: https://caniuse.com/mdn-api_barcodedetector
- Hintergrundausführung unter iOS: https://developer.apple.com/forums/thread/777860
- Tailwind CSS Browser-Unterstützung: https://tailwindcss.com/docs/compatibility
- Entfernung der Lighthouse-PWA-Kategorie: https://developer.chrome.com/blog/update-install-criteria
- Playwright und Safari: https://www.browserstack.com/guide/playwright-safari
- GitHub Pages und private Repositories: https://github.com/orgs/community/discussions/22817
- Cloudflare-Pages-Limits: https://developers.cloudflare.com/pages/platform/limits/
- Supabase-Limits (Sekundärquelle): https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/
