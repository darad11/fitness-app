# Bekannte Einschränkungen

Stand: 18.10.2026 · Version 0.3 (M0 umgesetzt) · Vorgänger: `archive/v0.1-phase-1/known-limitations.md`

## Änderungen gegenüber Version 0.1

- iOS-Befunde mit Quellen belegt und präzisiert: Speichertrennung zwischen Safari und installierter App, Wake Lock erst ab iOS 18.4, Verbindungsverlust der IndexedDB, Audio-Session, fehlende Vibration, fehlender BarcodeDetector.
- Korrektur zu `navigator.storage.persist()`: Safari gewährt den dauerhaften Speicher nach Heuristik und laut Quellen für Home-Bildschirm-Apps; in v0.1 stand pauschal „keine Garantie".
- Neu: Zusagen und Nicht-Zusagen zum Timer (Abschnitt 3), Grenzen der Testwerkzeuge (Abschnitt 5), Bindung an die Adresse (Abschnitt 6), Supabase-Grenzen (Abschnitt 7), Liste dessen, was ausdrücklich nicht behauptet wird (Abschnitt 11).
- Version 0.3: Grenzen des Standes M0 (Abschnitt 12); Quellen jetzt Abschnitt 13.

## 1. Grenzen der Analyse

- Die Referenz-App wurde nicht bedient. Grundlage sind öffentliche Quellen (`product-research.md`).
- Direkter Abruf vieler Hosts ist aus dieser Cloud-Umgebung durch die Netzwerkrichtlinie gesperrt. Die Recherche in Phase 2 stützt sich auf Websuche mit Zitaten. Punkte mit Restunsicherheit tragen den Vermerk „im Gerätetest prüfen" oder „im Prüfspike prüfen".
- Rezensionen stammen überwiegend aus 2024 und 2025. Dort genannte Schwächen sind Erkenntnisse aus dieser Zeit, nicht automatisch der heutige Stand der Referenz-App (D-118).
- Interner Vermerk: Programm C („Winterprogramm 2026“) beruht auf einer fremden Vorlage. Vor einer öffentlichen Öffnung der App wird es durch ein eigenes Programm ersetzt (D-328).

## 2. iPhone und iPad

Auf iOS und iPadOS nutzen alle Browser WebKit. Maßgeblich ist, was Safari und installierte Home-Bildschirm-Apps können.

| Fähigkeit | Befund | Quelle | Auswirkung | Umgang |
|---|---|---|---|---|
| Installation | Nur manuell über „Teilen › Zum Home-Bildschirm"; kein Installationsdialog | Allgemein dokumentiert | Nutzer muss selbst installieren | Anleitung in der App (AK-PWA-04, AK-SET-06) |
| Speichertrennung | Installierte Web-Apps haben eigene Cookies, Web Storage und IndexedDB, getrennt von Safari; Service Worker und Cache Storage teilen sie seit iOS 14. Apple bezeichnet die Isolation als beabsichtigt | firt.dev (iOS 14); WebKit-Bug 181849 | Daten aus dem Safari-Tab erscheinen nicht in der installierten App | Hinweis im Safari-Tab; Empfehlung, nur die installierte App zu nutzen; Umzug per Export und Import |
| 7-Tage-Regel | Safari löscht skriptbeschreibbaren Speicher einer Website nach 7 Nutzungstagen ohne Interaktion; Home-Bildschirm-Apps zählen ihre Nutzungstage getrennt, die Regel greift dort praktisch nicht | WebKit-Richtlinie, zitiert in mehreren Quellen | Gefahr im Safari-Tab | Installation als Voraussetzung für echte Nutzung |
| Dauerhafter Speicher | `navigator.storage.persist()` wird nach Heuristik gewährt, laut Quellen für Home-Bildschirm-Apps, ohne Nachfrage | WebKit-Speicherrichtlinie 2023 (Sekundärquellen) | Schutz vor Räumung unter Speicherdruck nicht garantiert | Anfordern nach dem ersten gespeicherten Eintrag, nach einem Abgleich mit abgeholten Daten und nach dem Wiederherstellen (D-346); Status anzeigen (AK-PWA-05); Export und Snapshots |
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
| Startbild | iOS zeigt ein `apple-touch-startup-image` nur, wenn die `media`-Abfrage genau zu Bildschirmgröße, Pixeldichte und Ausrichtung passt, und lädt die Bilder nur beim Hinzufügen zum Home-Bildschirm | Apple-Dokumentation zu Web-Apps; allgemein dokumentiert | Ein neues Gerätemaß ohne Bild startet ohne Startbild; geänderte Startbilder, Name und Icon erscheinen erst nach erneutem Hinzufügen, und beim Entfernen der alten App kann iOS deren Daten löschen | Bilder für 20 aktuelle iPhone- und iPad-Maße, hochkant und quer (D-317), seit F5 nach Variante C3 und mit einer Startfläche in der App aus derselben Regel, die nur in der installierten App erscheint (D-325); neue Geräte in `tools/splash.mjs` ergänzen; Gerätetest T-IPH-M0 Schritt 5 zuerst an der Vorschau, nach dem Merge an der Produktivadresse; mit Testdaten ohne Risiko (D-329). Ein Export lässt sich seit D-345 wieder einspielen (Mehr › Daten und Sicherung); der Gerätetest dazu steht aus |
| Unschärfe am oberen Rand | iOS legt ab Version 26 über die obersten rund 40 pt einer Seite eine weiche Unschärfe (Liquid Glass), im Safari-Tab und in der installierten App; keine CSS-Regel und kein Meta-Tag schaltet sie ab | Berichte mehrerer Web-Apps (2026), keine Dokumentation von Apple; hier nicht nachstellbar | Was dort ruht, wirkt unscharf, etwa das Logo der Kopfzeile | Auf iPhone und iPad beginnt der Inhalt 2 rem tiefer (`--spacing-edge-clear`, D-332); Gerätetest T-IPH-M0 Schritt 6 |
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
- In dieser Cloud-Umgebung ist nur Chromium installiert; WebKit-Läufe brauchen GitHub Actions (Q-01). Was nur in WebKit auftritt, lässt sich deshalb nur in der CI nachstellen, etwa mit einem vorübergehenden Test, der aufschreibt, was die Seite lädt (D-344, entfernt mit D-348).
- Die E2E-Jobs der CI laufen im offiziellen Image von Playwright in der Version aus dem Lockfile (D-344). Ein fehlgeschlagener Test wird dort einmal wiederholt; besteht er erst im zweiten Versuch, meldet Playwright ihn als „flaky“, und das gilt als Befund, nicht als bestanden.
- Die früher wackelnden Tests laufen 20-mal hintereinander ohne Wiederholung nur auf Abruf (`repeat.yml`, Label „wiederholen“ oder Start von Hand), nicht bei jedem Push; ein Lauf dauert je Engine rund 12 min.
- Lighthouse prüft keine PWA-Kategorie mehr (D-221).

## 6. Hosting und Adresse

- IndexedDB-Daten gehören zu genau einer Adresse. Ein Wechsel der Adresse oder Domain lässt vorhandene Daten in der App verschwinden; sie müssen per Export und Import umziehen. Die Produktivadresse ist deshalb vor M1 festgelegt: `https://fitness-app-mu-drab.vercel.app` (Q-02).
- Vorschau-Adressen haben eigene, getrennte Daten; sie dienen nur Tests.
- Hosting erfolgt auf Vercel (D-231). Der Hobby-Plan ist nur für persönliche, nicht kommerzielle Nutzung erlaubt; laut Sekundärquellen gelten 100 GB Datentransfer und 100 Deployments pro Tag. Bei Überschreitung pausiert Vercel Funktionen statt Kosten zu berechnen.
- Vorschau-Adressen können je nach Einstellung des Vercel-Kontos eine Vercel-Anmeldung verlangen. Eine installierte Vorschau-App hat wegen der Speichertrennung keine solche Anmeldung; Vorschauen werden deshalb im Safari-Tab geprüft, die installierte App nutzt die Produktivadresse.
- GitHub Pages ist für private Repositories im kostenlosen Plan nicht verfügbar.

## 7. Supabase (ab R3)

- Kostenlose Projekte pausieren nach 7 Tagen ohne Aktivität und müssen manuell reaktiviert werden; laut Sekundärquellen 500 MB Datenbank, 1 GB Dateispeicher, keine automatischen Backups. Der Pro-Plan kostet laut diesen Quellen 25 USD pro Monat.
- Laut einer Quelle ändert sich die Data API für bestehende kostenlose Projekte ab 30.10.2026; vor R3 zu prüfen.
- Der öffentliche Anon-Key ist kein Geheimnis; die Sicherheit hängt vollständig an RLS. RLS-Tests sind Teil der Abnahme von R3.
- Bei aktivierter Sync liegen die synchronisierten Nutzdaten bei Supabase (`data-sources.md` Abschnitt 8).
- Stand 19.10.2026 (D-269): Projekt „fitness-app“ in Frankfurt im kostenlosen Tarif; nach 7 Tagen ohne Nutzung pausiert es und muss im Supabase-Dashboard geweckt werden, bis dahin meldet die App einen Fehler beim Abgleich und arbeitet lokal weiter.
- Erste Stufe: Bei Änderungen am selben Dokument auf zwei Geräten zwischen zwei Abgleichen gewinnt die jüngere Fassung ganz (z. B. ein Ernährungseintrag); nur Trainingseinheiten (abgeschlossen vor laufend; das Verwerfen einer laufenden Kopie löscht keine abgeschlossene Einheit, K-03, D-293) sowie Programme und Rezepte (Konfliktkopie) haben eigene Regeln. Feldweise Zusammenführung folgt bei Bedarf.
- Versionsversatz (D-292): Läuft ein Gerät mit einer älteren App-Version als das andere, hält sein Abgleich vor dem ersten Dokument einer ihm unbekannten Tabelle oder Art an und meldet „neuere Version“; bis zum Update auf diesem Gerät wird nichts geholt und nichts gesendet, danach geht es an derselben Stelle weiter. Dokumente neuerer Versionen in bekannten Tabellen werden dagegen übernommen; Felder, die die ältere Version nicht kennt, können dabei verloren gehen (`audit-report.md` A-03).
- Löschmarkierungen bleiben auf dem Server unbegrenzt; ein Aufräumen nach 180 Tagen (data-model.md 7.3) ist noch nicht umgesetzt.
- Supabase war aus der Cloud-Entwicklungsumgebung nicht erreichbar. Server-Funktion und RLS sind per SQL im Projekt geprüft, der Client mit nachgebildeten Antworten; der erste echte Abgleich zwischen zwei Geräten ist der Gerätetest.

## 8. Datenquellen

Prüfergebnisse und Restfragen stehen in `data-sources.md`: strengere Limits bei Open Food Facts (15 Produktabfragen und 10 Suchanfragen pro Minute und IP), ungeklärte User-Agent-Anforderung im Browser, unsicheres CORS-Verhalten der Suche; BLS 4.0 frei unter CC BY 4.0.

Zucker-Referenz (D-369): WHO und DGE meinen mit „unter 10 % der Energie“ freien Zucker. Die Nährwertangaben trennen ihn nicht vom Zucker aus Obst und Milch, deshalb zählt die App jeden Zucker; die Referenz ist damit eine strenge Orientierung. Geplant ist, freien Zucker später über die Lebensmittelgruppen zu schätzen (Plan, Punkt 68).

Grundauswahl (D-362): Die Nährwerte gelten je 100 g, auch bei Getränken (Milch, Säfte, Pflanzendrinks); wer in ml misst, liegt bei Milch um etwa 3 % daneben. Richtwerte je Stück (D-365) gibt es für 47 Lebensmittel; sie gelten für mittlere Größen und den essbaren Anteil, ein großer Apfel oder eine dicke Scheibe wiegt mehr. Mit „Gewicht anpassen“ gilt dein eigenes Gewicht. Ohne Richtwert trägst du in Gramm ein, zum Beispiel bei Mandarinen, Toastbrot oder gekochten Erdäpfeln. Die Richtwerte stammen aus der Websuche; die Fußnoten der Schweizer Tabelle ließen sich in der Cloud-Sitzung nicht lesen. Gemerkte Stückgewichte stehen in den Einstellungen; wie bei allen Einstellungen gewinnt beim Abgleich die jüngere Fassung des ganzen Dokuments, ändern zwei Geräte vor dem Abgleich Einstellungen, kann ein dort gemerktes Gewicht verloren gehen. Den Lizenzhinweis des BLS aus dem Download konnte die Cloud-Sitzung nicht wörtlich übernehmen (Seiten gesperrt); laut Auftrag bleibt deshalb die Zitierweise mit DOI aus der BLS-Dokumentation (D-366, `licenses-data.md`).

Barcode-Scanner (D-266): Open Food Facts war aus der Cloud-Umgebung nicht erreichbar; die Abfrage ist mit nachgebildeten Antworten getestet. Der erste echte Scan auf dem iPhone (19.10.2026) lieferte Marke und Nährwerte; CORS klappt damit (Prüfspike S-1). Ein Browser darf keinen eigenen User-Agent setzen; die Abfrage geht ohne App-Kennung. Auf dem iPhone fragt iOS bei installierten Web-Apps unter Umständen bei jedem Start erneut nach der Kamera. Die Erkennung braucht genug Licht und einen ruhigen Abstand von etwa 10 bis 20 cm; sonst bleibt die Eingabe von Hand.

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

- **WebKit und iPhone:** Die E2E-Tests sind in GitHub Actions auch mit WebKit bestanden. Auf dem iPhone mit iOS 27.0.1 funktionieren laut Gerätetest T-IPH-M0 der Hinweis im Safari-Tab, die Installation über „Teilen › Zum Home-Bildschirm" und der Offline-Start. Auch der Update-Hinweis funktioniert dort: Eine neue Version wurde erst nach „Jetzt aktualisieren" aktiv.
- **Produktivadresse und Vorschau:** Vercel ist verbunden; Produktivadresse `https://fitness-app-mu-drab.vercel.app`. Das Etikett „Vorschau – Testdaten" hängt an der Vercel-Umgebung (`VERCEL_ENV`) und lässt sich erst auf einer Vorschau-Adresse sehen; lokal ist es nur als Komponententest geprüft.
- **Safari-Hinweis:** Die Erkennung nutzt Browserkennung, Touch-Unterstützung und `display-mode`. Eingebettete Browser anderer Apps können wie Safari erscheinen. Die Anleitung ist bewusst allgemein formuliert, weil sich die Lage von „Teilen" je nach iOS-Version unterscheidet.
- **Installationsknopf** gibt es nur in Chromium-Browsern (`beforeinstallprompt`); Safari bietet keinen solchen Dialog, dort hilft nur die Anleitung.
- **Offline-Status:** Beim allerersten Aufruf zeigt „Heute" „Wird für die Offline-Nutzung vorbereitet", bis der Service Worker alle Dateien gespeichert hat. Im Entwicklungsmodus (`pnpm dev`) gibt es keinen Service Worker.
- **Updates:** Die App fragt beim Start und höchstens einmal pro Stunde bei Rückkehr in den Vordergrund nach einer neuen Version, außerdem über „Nach Update suchen". Seit D-343 erscheint der Hinweis während eines Trainings erst nach dem Beenden (AK-PWA-03); Einzelheiten im Abschnitt „Updates und Start“.
- **Snapshots und Wiederherstellung:** Snapshots lassen sich anlegen und lesen; das Wiederherstellen folgt mit M1 und M4. Der Wiederherstellungsbildschirm bietet in M0 nur Ursache, „Erneut versuchen" und gegebenenfalls „Jetzt aktualisieren". Snapshots enthalten keine Zugänge (Synchronisierung, Schritte; D-346). Ist der Speicher voll, löscht der Snapshot einmal den ältesten und versucht es neu; reicht das nicht, nennt der Bildschirm „Der Speicher des Geräts ist voll …“ (E-03).
- **Formatierung de-CH:** Schweizer Tausendertrennzeichen mit Dezimalkomma (D-233); das weicht von der üblichen Schweizer Schreibweise mit Punkt ab. Das Tausendertrennzeichen hängt von den Sprachdaten des Geräts ab („’“ oder „'“).
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

## Updates und Start (D-343)

- **Wann eine neue Version übernimmt:** Nach „Jetzt aktualisieren“ oder beim nächsten Start der App, wenn kein Fenster der alten Version mehr offen ist. Am iPhone reicht dafür, die App ganz zu schließen; wann iOS eine App im Hintergrund wirklich beendet, bestimmt iOS. Startet die App so mitten in einem Training neu, läuft das Training mit der neuen Version weiter; es ist gespeichert.
- **Hinweis während eines Trainings:** „Neue Version verfügbar“ erscheint erst nach dem Beenden. „Mehr › Über die App“ sagt in dieser Zeit, dass eine neue Version bereitliegt.
- **Abgebrochene Modul-Anfragen in Chromium:** Unter einem Service Worker verwendet Chromium vorgeladene Module nicht und lädt sie ein zweites Mal; unter Last bricht dabei gelegentlich ein Teil ab. Seit index.html nichts mehr vorlädt (Nachtrag D-344), betrifft das nur noch nachgeladene Bereiche. Die App lädt dann einmal neu (beim Start der Startwächter, später die Erholung beim Nachladen). Ob Safari dasselbe tut, ist nicht geprüft; die Erholung greift dort genauso, sobald der Browser einen Ladefehler meldet. Hängt eine Anfrage, ohne zu scheitern, hilft sie nicht; beim Start blendet sich die Startfläche nach 10 s trotzdem aus (D-325).
- **Ohne Service Worker** (Safari-Tab im privaten Modus, geräumter Speicher, erster Aufruf ohne Unterstützung): Nach einem Deployment fehlen der offenen Seite die Dateien der alten Version; Vercel liefert dann `index.html`, und die App lädt einmal neu. Ohne Netz lädt sie nicht neu, sondern zeigt „Ohne Verbindung lässt sich dieser Bereich gerade nicht laden.“
- **Fehlgeschlagenes Vorladen in WebKit:** WebKit behält ein vorgeladenes Modul, dessen Laden scheiterte, im Speicher, solange die alte Seite lebt; die neu geladene Seite fragt es dann nicht noch einmal an. Deshalb lädt index.html keine Module mehr vor (Nachtrag D-344), und der Startwächter hilft auch in WebKit. In der CI belegt: Mit dem früheren Vorladen startete die App nach dem Neuladen nicht, ohne startet sie (Gegenprobe zu `9517f73`). Nachgeladene Bereiche laden ihre Teile weiter vor: Scheitert dort ein Teil am Netz, sieht das einmalige Neuladen in WebKit womöglich denselben Fehler, dann bleibt der Hinweis mit „Neu laden“; geprüft ist das in WebKit nicht. Nach einem Deployment trifft es nicht zu, weil die neue Version andere Dateinamen hat.
- **Schleifenschutz:** Höchstens ein automatisches Neuladen je fünf Minuten und Tab (`sessionStorage`); ohne `sessionStorage` gar keins. Danach bleibt der Hinweis mit „Neu laden“.
- **Verlassen der Seite in WebKit:** WebKit bricht beim Verlassen oder Neuladen der Seite alle laufenden Importe ab, schon vor `pagehide`. Ab `beforeunload` entscheidet die Erholung deshalb nichts mehr (Nachtrag D-343). Das iPhone kennt `beforeunload` nicht; die App verlässt sich dort aber nur durch Neuladen, und ein zweites Neuladen derselben Seite schadet nicht.
- **Nicht gespeicherte Eingaben:** Fehlt genau der Teil, den eine offene Ansicht nachlädt, ersetzt der Hinweis die Ansicht; was dort ungespeichert eingegeben war, geht verloren. Gespeicherte Daten bleiben immer erhalten.
- **Tests:** Service Worker, Offline und Updates prüft Playwright in Chromium; die Fälle ohne Service Worker und den Startwächter auch in WebKit. Safari auf dem iPhone prüft der Gerätetest T-IPH-M0 Schritt 4.

## Wiederherstellen aus dem Export (D-345)

- **Nur Ersetzen:** Eine Sicherung ersetzt alle Daten dieses Geräts; Zusammenführen (AK-DAT-03) gibt es noch nicht. Was nur auf dem Gerät lag, ist danach gelöscht markiert. Es steckt in der Datei `form-sicherung-vor-wiederherstellung-…`, die FORM vorher anlegt, und im Snapshot „Vor Import“.
- **Snapshots** lassen sich weiterhin nicht über die App zurückspielen (A-06). Wieder einspielen lässt sich die Datei von vor dem Wiederherstellen.
- **Nicht Teil der Sicherung** sind Anzeigeeinstellungen dieses Geräts (z. B. „Als Tabelle“), Anmeldungen, das Fehlerprotokoll und importierte Lebensmitteldaten. Sie bleiben beim Wiederherstellen, wie sie sind; nach einem Gerätewechsel die Lebensmitteldaten neu importieren.
- **Mit Synchronisierung:** Der eingespielte Stand geht beim nächsten Abgleich an die anderen Geräte, auch die Löschmarken. Hat ein anderes Gerät seit dem letzten Abgleich ein Programm oder Rezept geändert, bleibt dessen Fassung, und die eingespielte erscheint als Konfliktkopie (K-09, K-17). Was ein anderes Gerät seit dem letzten Abgleich neu angelegt hat, bleibt erhalten und kommt mit dem nächsten Abgleich. Ein dort abgeschlossenes Training gewinnt gegen eine eingespielte laufende Fassung (K-01).
- **Während eines Trainings** lässt sich nichts wiederherstellen.
- **iPhone:** Die Datei kommt über die Dateiauswahl (Dateien-App), die Sicherung vorher über das Teilen-Menü („In Dateien sichern“). Bricht man das Teilen-Menü ab, ersetzt FORM nichts. Geprüft in Chromium und WebKit (CI); der Gerätetest am iPhone steht aus.
- **Größe:** Dateien über 50 MB lehnt FORM als nicht plausibel ab.

## Registrieren (D-273)

- Die Registrierung ist offen (D-328): Jede Person, die die App-Adresse kennt, kann ein Konto anlegen und Daten im Supabase-Projekt speichern. Die Zeilen sind je Konto getrennt (RLS). Noch offen sind die Punkte aus Q-20 (der Kontowechsel ist seit D-346 abgesichert, siehe unten): Grenzen oder CAPTCHA für Registrierungen, Datenschutzerklärung. Bis dahin auf eigenen Geräten nur mit dem eigenen Konto anmelden.
- **Kontowechsel (D-346):** Liegen Daten auf dem Gerät, die schon mit einem Konto abgeglichen wurden, bricht die Anmeldung mit einem anderen Konto ab: „Auf diesem Gerät liegen Daten eines anderen Kontos …“. Ein Wechsel mit Daten folgt erst mit „Alle Daten löschen“; ein Gerät ohne Daten darf wechseln.
- Der Link in der Bestätigungsmail öffnet am iPhone Safari, nicht die installierte App. Beide haben getrennte Speicher; deshalb meldet man sich nach dem Bestätigen in der App selbst mit E-Mail und Passwort an.
- Der Link führt nur dann zurück in die App, wenn in Supabase unter Authentication › URL Configuration die Adresse der App als „Site URL“ bzw. unter „Redirect URLs“ eingetragen ist; sonst landet er auf der voreingestellten Adresse.

## iPhone Duo (D-371 bis D-379)

- **Nicht am Gerät getestet:** Alle Prüfungen liefen in Browser-Fenstern mit den Maßen des Duo (`form-duo-report.md` Abschnitt 2.4). Ein Teil der Maße stammt aus Messungen Dritter; der Systemrand an der Seite (84 pt) ist eine Annahme. Die App nimmt immer den gemeldeten sicheren Bereich, keine feste Zahl.
- **Zustand nicht erkennbar:** Web-Apps erfahren nicht, ob das Duo auf- oder zugeklappt oder halb geöffnet ist; die Schnittstellen dafür sind in Safari nur hinter Schaltern. FORM richtet sich nach der Fensterbreite. Was über den Falz läuft, ist nicht geprüft.
- **Testwerkzeuge:** Den sicheren Bereich kann nur Chromium in Playwright nachstellen (`Emulation.setSafeAreaInsetsOverride`), die Kamera nur Chromium durch ein Standbild ersetzen. WebKit prüft dieselben Abläufe ohne Systemrand; die Scanner-Tests laufen dort nicht.
- **Neu laden beim Auf- und Zuklappen:** Ob iOS die App dabei neu lädt, ist offen. Training, Sätze und Pause liegen in der Datenbank und bleiben; offene Dialoge und die Scrollposition gingen dann verloren.
- **Sehr schmale Bildschirme:** Bei 360 pt ragt ein Wert wie „102,5“ in der Satzzeile 7 px über das Feld, bei 320 pt (iPhone SE oder mini mit Anzeigezoom) sind die Felder 25 pt breit (D-378, Vorschlag im Bericht Abschnitt 5).
