# Essens-Scanner – Entwurf (D-538)

Stand: 07.11.2026 · Status: **Entwurf zur Freigabe**. Gebaut wird nichts, bevor der Gerätetest und der Merge von PR #54 erledigt sind. Danach bekommt der Scanner einen eigenen Branch und einen eigenen PR (Entscheidung des Produktinhabers vom 07.11.2026).

Grundsatz aus dem Auftrag: Erkennen, was sichtbar ist. Prüfen, was sich prüfen lässt. Schätzen nur, wenn es nötig ist. Unsicherheit zeigen. Du bestätigst alles.

## 1. Kurz

**Was der Scanner tut:** Du fotografierst deine Mahlzeit oder wählst ein Foto. Die KI nennt, was sie sieht, schätzt die Portionen mit einer Sicherheitsstufe und sagt, was unklar ist. Jeden Posten ordnest du einem Lebensmittel aus FORM zu, prüfst die Menge und fügst die Mahlzeit dem Tagebuch hinzu. **Die KI liefert keine Nährwerte.** Die kommen aus den Daten, die FORM schon hat (BLS 4.0, deine eigenen Lebensmittel, Barcode und Open Food Facts), gerechnet wird im Code der App.

**Entschieden (Produktinhaber, 07.11.2026):**

| Punkt | Entscheidung |
|---|---|
| Fotos an einen KI-Dienst | ja, aber nur nach deiner Einwilligung; ohne Zustimmung bleibt alles wie heute (NU-14 wird damit nach dem Merge von #54 wieder aufgenommen) |
| Einwilligungstext | ehrlich, nach den aktuellen Bedingungen von Anthropic (Abschnitt 5) |
| Modell | Einstellung, nicht fest eingebaut; Vergleich Claude Opus 5.5 und Claude Sonnet 5.5 mit denselben Fotos (Abschnitt 6) |
| Server | Edge Function in deinem Supabase-Projekt, nur für dein Konto; eingespielt erst nach deinem OK |
| Test-Schlüssel | du legst einen eigenen Schlüssel mit niedrigem Ausgabelimit nur für die Tests an |
| Reihenfolge | zuerst Gerätetest und Merge von #54, dann eigener Branch und PR |
| iOS | Migration von FORM auf React Native mit Expo nach #54; Server, Datenmodell, Prüfung der KI-Antwort und Berechnung gleich für Web und App (Abschnitt 8) |
| Nährwerte | aus BLS 4.0, Barcode-Scanner und Open Food Facts; dazu geprüft: Nährwerttabellen auf dem Gerät auslesen, ohne Dritte (Abschnitt 7) |
| Sprache | alle Texte in der App bleiben deutsch |

**Offen, deine Freigabe:** dieser Entwurf; das Standardmodell nach dem Vergleich; das Einspielen der Edge Function; Oberfläche im Web oder erst nativ (meine Empfehlung: Abschnitt 8.2).

## 2. Bestand (Prüfung vom 07.11.2026)

| Bereich | Stand heute |
|---|---|
| Anforderungen | Fotoerkennung von Mahlzeiten ist Nicht-Ziel: NU-14 „Ausgeschlossen“ (`docs/feature-inventory.md`), `docs/requirements.md` (Nicht-Ziele), `docs/evolution-plan.md`, `docs/reference-analysis.md`; Grund damals: externer KI-Dienst, Kosten, Datenschutz. AK-PWA-06: keine Nutzdaten an Dritte im MVP. |
| Server | kein Server-Code: keine Edge Functions, kein `api/`, keine Umgebungsvariablen; D-302 nennt eine Edge Function nur als Idee für einen Proxy |
| KI | kein Anbieter, kein SDK |
| Netz (CSP) | `connect-src` erlaubt `'self'`, Open Food Facts und deine zwei Supabase-Projekte. Eine Edge Function im Projekt `eyxqciryeggpjzvaxjvu` braucht **keine** Änderung der CSP; ein direkter Aufruf eines KI-Anbieters aus der App wäre gesperrt (und der Schlüssel läge offen) |
| Anmeldung | Supabase mit E-Mail und Passwort (`src/modules/sync/data/remote.ts`), Sitzung in `meta` `sync.auth`; die App geht ohne Konto; die Registrierung ist offen (D-273) |
| Vorbild Einwilligung | Open Food Facts (D-266): erst beim ersten unbekannten Barcode, gespeichert in `meta` `consent.openFoodFacts` (nicht synchronisiert), zurücknehmen in „Meine Lebensmittel“ |
| Lebensmittel | Grundauswahl aus BLS 4.0, 361 Einträge (358 BLS, 3 USDA), offline; 47 Richtwerte je Stück; ÖNWT-Import, wenn du die Dateien mitbringst; Open Food Facts per Barcode; Suche mit Synonymen, Umlauten, Einzahl und Mehrzahl |
| Datenmodell | Dexie Version 8. `foods` speichert `per100`, `source` (custom, quick, bls, off, import) und `quality` (verified, community, user, estimated). `foodLog` friert absolute Nährwerte ein, mit `amount`, `kind` (food, quick, recipe), `isEstimated` und `notes` (bis 500 Zeichen, bisher ungenutzt). Nährwerte: kcal, Eiweiß, Kohlenhydrate, Zucker, Fett, gesättigte Fettsäuren, Ballaststoffe, Salz. Fehlende Werte fehlen, sie sind nie 0 |
| Kamera | nur für den Barcode (`ScannerDialog.tsx`, `getUserMedia`); kein Foto-Upload, keine Fotospeicherung. iOS fragt in der installierten App unter Umständen bei jedem Start nach der Kamera (`docs/known-limitations.md`) |
| Mehrere Einträge auf einmal | `applyTemplate` (Vorlagen) schreibt in einer Transaktion; Muster für eine gescannte Mahlzeit |
| Rechnen | `scaleNutrients`, `sumEntries` (zählt fehlende und geschätzte Werte), `kcalMismatch` (4/4/9 mit Toleranz) |

## 3. Ablauf für dich

1. **Ernährung → Hinzufügen → „Mahlzeit fotografieren“** (neben „Barcode scannen“).
2. Beim ersten Mal: **Einwilligung** (Text in Abschnitt 5.3). „Nicht jetzt“ lässt alles wie heute.
3. **Foto aufnehmen oder auswählen.** Hinweis: „Fotografiere von oben, mit allem auf dem Teller und ohne Hand davor.“
4. **Auswerten:** „Foto wird verkleinert“, „Foto wird ausgewertet“. Es gibt nur Schritte, die wirklich passieren; Abbrechen geht jederzeit.
5. **Erkannte Posten**, je eine Karte:
   - Name, wie erkannt, mit Sicherheit (hoch, mittel, niedrig),
   - zugeordnetes Lebensmittel aus FORM mit Quelle (zum Beispiel „BLS 4.0“) oder „Lebensmittel wählen“,
   - Menge: Schätzung als „ca. 150 g, geschätzt, Sicherheit mittel“, dazu klein, mittel, groß, Gramm oder Stück,
   - kcal und Makros, gerechnet aus dem Lebensmittel und der Menge,
   - Ändern und Entfernen.
6. **Rückfragen, nur wenn sie viel ausmachen**, zum Beispiel „Hähnchenbrust oder Hähnchenkeule?“, „Wurde Öl oder Butter verwendet?“, „Reis gekocht oder roh gewogen?“.
7. **Zusammenfassung:** Summe von kcal, Eiweiß, Kohlenhydraten, Fett und Ballaststoffen; Hinweise auf Schätzungen und fehlende Werte wie heute.
8. **„Zum Tagebuch hinzufügen“** mit Wahl der Mahlzeit. Erst jetzt wird gespeichert.

Erkennt die KI nichts sicher: „Ich konnte das nicht sicher erkennen. Wähle das Lebensmittel selbst oder mach ein neues Foto.“ Die Suche bleibt immer offen.

## 4. Architektur

### 4.1 Überblick

```
Gerät (Web heute, App mit Expo später)        Supabase (dein Projekt)            Anthropic
┌──────────────────────────────┐              ┌──────────────────────────┐       ┌─────────┐
│ Foto → verkleinern (≤ 1568 px)│── JWT ─────▶│ Edge Function analyze-meal│──────▶│ Claude  │
│ Einwilligung, Einstellung     │              │ Konto prüfen (Allowlist)  │◀──────│ (Modell │
│ Antwort prüfen (gemeinsames   │◀─ geprüfte ──│ Modell aus Allowlist      │       │ aus der │
│ Schema), zuordnen, rechnen,   │   Posten     │ Antwort prüfen (Schema)   │       │ Einstel-│
│ bestätigen, speichern         │              │ nichts speichern          │       │ lung)   │
└──────────────────────────────┘              └──────────────────────────┘       └─────────┘
```

Die Erkennung (KI) und die Nährwerte (Daten der App) sind getrennt. Die KI rechnet nichts, was gespeichert wird.

### 4.2 Gemeinsamer Kern für Web und App

Ein Teil ohne Oberfläche, ohne Dexie und ohne DOM, in TypeScript, für Web, Expo-App und Edge Function gleich:

- **Schemas (Zod):** Anfrage, Antwort der KI, Rückfragen, Fehlercodes; dieselbe Prüfung auf dem Server und im Gerät.
- **Zuordnung:** Suchbegriffe der KI gegen den Katalog (`searchFoods` aus `calc/foodSearch.ts`), mit Vorrang für den passenden Zustand (gekocht oder roh).
- **Portionen:** klein, mittel, groß aus der Spanne der Schätzung; Stück aus den Richtwerten.
- **Rechnen:** `scaleNutrients`, `sumEntries`, `kcalMismatch` wie heute; die Summen rechnet immer die App, nie die KI.
- **Parser für Nährwerttabellen** (Abschnitt 7.4).

Ablage: Heute liegt diese Logik in `src/modules/nutrition/calc` und `model`. Für den Scanner und die spätere App wandert der gemeinsame Teil in einen Ordner, den Vite, Expo und die Edge Function lesen können (Vorschlag `supabase/functions/_shared/scanner/`, von der App per Alias eingebunden; Supabase bündelt Dateien aus `_shared` mit). Zod kommt in der Edge Function über `npm:zod` dazu; eine neue Laufzeitabhängigkeit der App entsteht dadurch nicht.

### 4.3 Server: Edge Function `analyze-meal`

- **Ort:** Supabase-Projekt `eyxqciryeggpjzvaxjvu` (Frankfurt), Code unter `supabase/functions/analyze-meal/`. Eingespielt erst nach deinem OK, wie jede Änderung am Server.
- **Zugang:** Supabase prüft das Anmeldetoken (JWT); die Funktion lässt nur Konten aus einer Allowlist zu (Secret `SCANNER_ALLOWED_USERS`, deine `user_id`). Weil die Registrierung offen ist (D-273), reicht die Anmeldung allein nicht.
- **Schlüssel:** `ANTHROPIC_API_KEY` als Secret der Edge Function. Du trägst ihn selbst in Supabase ein; er steht nie im Code, in der App oder im Chat.
- **Modell:** aus der Anfrage, aber nur aus einer Allowlist (`claude-opus-5-5`, `claude-sonnet-5-5`); alles andere lehnt die Funktion ab. So kann niemand über die App ein anderes, teureres Modell anfordern.
- **Grenzen:** ein Bild, JPEG, PNG oder WebP, höchstens 1,5 MB nach dem Verkleinern; Zeitlimit für den Aufruf 60 s (Supabase erlaubt bis 150 s Laufzeit im kostenlosen Plan, 2 s Rechenzeit; das Warten auf Anthropic zählt nicht als Rechenzeit).
- **Speichern und Protokolle:** Die Funktion speichert nichts und schreibt weder Bild noch Antwort ins Protokoll. Protokolliert werden nur Zeitpunkt, Dauer, Modell, Ergebnis und die Zahl der Token für die Kosten.
- **Aufruf:** offizielles SDK `@anthropic-ai/sdk` (in der Funktion per `npm:`), Messages API mit dem Bild als `base64`, Systemprompt aus dem Auftrag (Abschnitt 16 dort, angepasst: Namen auf Deutsch, keine Nährwerte), strukturierte Ausgabe über `output_config.format` mit dem JSON-Schema aus Zod, adaptives Denken mit einer Stufe aus dem Vergleich (`low` oder `medium`). Für Ablehnungen aus Sicherheitsgründen ist die serverseitige Ausweichlösung von Anthropic vorgesehen (`fallbacks: "default"`); greift sie, steht das in der Antwort und auf der Karte.
- **Antwort:** Die Funktion prüft die Ausgabe mit dem gemeinsamen Schema. Ungültiges wird nie weitergegeben, stattdessen ein Fehlercode.

### 4.4 Antwort der KI (Schema, Kurzform)

```
meal:
  image_quality: ok | unscharf | dunkel | verdeckt
  no_food_detected: boolean
  overall_confidence: hoch | mittel | niedrig
  items[]:
    name_de: string               # wie gesehen, z. B. „Hähnchenbrust“
    search_terms_de: string[]     # für die Suche in FORM, z. B. „Hähnchen Brust gebraten“
    category: string
    seen: sichtbar | wahrscheinlich
    identification_confidence: hoch | mittel | niedrig
    portion:                      # null, wenn sich nichts sinnvoll schätzen lässt
      low_g, high_g, estimate_g   # gerundet, z. B. 120 / 180 / 150
      basis: Augenmaß | Bezugsgröße | Verpackung
      confidence: hoch | mittel | niedrig
    state: gekocht | roh | unklar
    preparation: string | null    # nur wenn sichtbar
    uncertainties: string[]       # z. B. „Öl nicht erkennbar“
  questions[]: { item_ref, text_de, options_de[] }
```

Bewusst anders als im Schema des Auftrags: **keine Felder für Nährwerte.** Nährwerte kommen nur aus Quellen, die FORM prüfen kann; die KI kann dort nichts erfinden. Unbekanntes ist `null`, nie 0.

### 4.5 Zuordnung und Nährwerte

Reihenfolge der Quellen, wie im Auftrag:

1. **Verpackung:** Barcode → eigenes Lebensmittel oder Open Food Facts (wie heute, mit Einwilligung); Nährwerttabelle auf dem Gerät auslesen (Abschnitt 7).
2. **Amtliche Datenbank:** BLS 4.0 (Grundauswahl, DOI 10.25826/Data20251217-134202-0), 3 Einträge aus USDA SR28; ÖNWT, wenn importiert.
3. **Deine eigenen Lebensmittel und Rezepte.**
4. **Ohne passende Quelle:** kein Wert von der KI. Du wählst ein Lebensmittel, legst eines an oder machst einen Schnelleintrag, gekennzeichnet als geschätzt.

Die Quelle steht auf jeder Karte, wie heute im Eintragsdialog („BLS 4.0“, „Open Food Facts“, „eigene Angabe“).

### 4.6 Portionen, Zubereitung, versteckte Zutaten

- **Portion:** gerundet, mit Spanne und Sicherheit; nie Zahlen wie 183,7 g ohne Messung. Wählbar: klein, mittel, groß (aus der Spanne), Gramm, Stück (Richtwerte), Faktor. Ohne Schätzung: „Die Menge lässt sich auf dem Foto nicht bestimmen.“
- **Gekocht oder roh:** Die Zuordnung nimmt nur den passenden BLS-Eintrag; ist der Zustand unklar, fragt die App. Gekochte und rohe Werte werden nie gemischt.
- **Öl, Butter, Soßen, Dressing, Zucker, Käse, Nüsse:** kommen nie von selbst dazu. Nur sichtbar Erkanntes oder deine Antwort zählt. Frage „Wurde Öl oder Butter verwendet?“ mit nein, wenig (1 TL), mäßig (1 EL), viel (2 EL), weiß nicht. „Weiß nicht“ bleibt als Hinweis an der Mahlzeit stehen und wird nicht gezählt.
- **Gerichte wie Lasagne, Curry, Burger:** Die KI nennt das Gericht so genau wie möglich und sagt, welche Zutaten unklar sind. Ein allgemeiner Eintrag wird nur angeboten, wenn er klar als Annäherung gekennzeichnet ist.

### 4.7 Speichern

- Erst nach „Zum Tagebuch hinzufügen“, in einer Transaktion wie `applyTemplate`; Doppeltippen verhindert `useSubmitOnce`.
- Je Posten ein Eintrag `kind: 'food'` mit `foodId` (BLS, eigenes Lebensmittel, Open Food Facts), `amount` und eingefrorenen Nährwerten, wie heute.
- `isEstimated: true`, solange die Menge nur geschätzt und nicht von dir bestätigt ist; die Tagessumme zeigt das wie bisher.
- `notes` hält die Herkunft fest, zum Beispiel „Aus Foto erkannt · Menge geschätzt (mittel)“. So bleibt nachvollziehbar, was von der KI kam.
- Die Tagessumme und die Makros aktualisieren sich wie bei jedem Eintrag; jeder Eintrag lässt sich danach wie gewohnt ändern.

### 4.8 Datenmodell

- **Keine neue Tabelle, keine neue Dexie-Version** für den Scanner: Einträge und Lebensmittel nutzen die bestehenden Felder.
- **Neu, klein:** die Einstellung „Modell für Fotos“ (optionales Feld in den Einstellungen mit Standardwert). Migrationsplan: optional, alte App-Versionen ignorieren das Feld; Rückfall: Feld weglassen, die Funktion nimmt dann das Standardmodell. Die Einwilligung liegt lokal in `meta` (`consent.photoAnalysis`), wie bei Open Food Facts, nicht synchronisiert.
- **Kein Foto:** weder in Dexie noch in der Synchronisierung noch auf dem Server.
- Eine Tabelle für Analysen (`FoodAnalysis` im Auftrag) ist nicht nötig, solange nichts gespeichert wird. Kommt sie später, dann mit Dexie-Version, Snapshot, Migrationstest und Rückfallplan.

## 5. Datenschutz und Einwilligung

### 5.1 Was wohin geht

| Daten | Wohin | Gespeichert |
|---|---|---|
| verkleinertes Foto | Gerät → deine Edge Function → Anthropic | FORM: nein. Anthropic: siehe 5.2 |
| Anmeldetoken | Gerät → Supabase | wie heute bei der Synchronisierung |
| erkannte Posten (Text) | Anthropic → Edge Function → Gerät | nur im Gerät, solange du prüfst |
| Einträge im Tagebuch | lokal, mit Synchronisierung wie heute | ja, wie jeder Eintrag |
| Name, Tagebuch, Ziele, Gewicht | nirgendwohin | – |

Ohne Einwilligung verlässt nichts das Gerät, wie bei Open Food Facts.

### 5.2 Geprüfte Bedingungen von Anthropic (07.11.2026)

| Quelle | Aussage | geprüft |
|---|---|---|
| Commercial Terms of Service, gültig ab 17.06.2025 (anthropic.com/legal/commercial-terms) | „Anthropic may not train models on Customer Content from Services.“ Die Bedingungen gelten für die Nutzung von API-Schlüsseln. | direkt gelesen |
| API and data retention (platform.claude.com/docs/en/manage-claude/api-and-data-retention) | „Retained data is never used for model training without your express permission.“ Gesprächsinhalte (Eingaben und Antworten) werden standardmäßig nicht aufbewahrt; Ausnahme sind die „Covered Models“ (Fable 5, Fable 5.1, Mythos 5, Mythos 5.1) mit 30 Tagen. Opus 5.5 und Sonnet 5.5 gehören nicht dazu. Unabhängig davon: Markieren die automatischen Sicherheitsprüfungen eine Anfrage, kann Anthropic Eingaben und Antworten bis zu 2 Jahre aufbewahren; außerdem, wo das Gesetz es verlangt. | direkt gelesen |
| Commercial data retention policy (privacy.claude.com, Artikel 7996866) | Eingaben und Antworten der API werden innerhalb von 30 Tagen gelöscht, außer in den genannten Ausnahmen. | **nicht direkt gelesen:** das Netz dieser Arbeitsumgebung sperrt privacy.claude.com; Aussage aus dem Suchergebnis zu dieser Seite |

Für den Text heißt das: Kein Training. Aufbewahrung höchstens 30 Tage, das ist die strengere der beiden Angaben und stimmt mit beiden. Dazu die Ausnahme für markierte Anfragen (bis 2 Jahre), weil sie zur ehrlichen Antwort gehört. Vor dem Einbau lese ich die Seiten noch einmal; den Datenschutz-Artikel direkt, wenn du privacy.claude.com für die Umgebung freigibst.

### 5.3 Einwilligungstext (Vorschlag, wörtlich)

> **Fotos von Mahlzeiten auswerten**
>
> Damit FORM erkennt, was auf deinem Teller liegt, schickt es das Foto verkleinert an Anthropic (Claude). Es geht über deinen eigenen Dienst bei Supabase, der es nur weiterreicht.
>
> - FORM speichert das Foto nicht, weder auf dem Gerät noch auf dem Server.
> - Mitgeschickt wird nur das Foto, nicht dein Name, dein Tagebuch oder deine Ziele.
> - Anthropic verarbeitet das Foto nach seinen Bedingungen für die API: Es trainiert damit keine Modelle und löscht Foto und Antwort spätestens nach 30 Tagen. Markieren die automatischen Sicherheitsprüfungen von Anthropic eine Anfrage, kann Anthropic sie bis zu 2 Jahre aufbewahren.
> - Die Nährwerte kommen aus den Lebensmitteln in FORM, nicht von der KI. Du prüfst alles, bevor es ins Tagebuch kommt.
>
> Du kannst die Zustimmung jederzeit unter „Meine Lebensmittel“ zurücknehmen. Ohne Zustimmung bleibt alles wie heute.
>
> [Zustimmen] [Nicht jetzt]

Dazu: Zeile auf „Über die App“ (`de-more.ts`, bisher „Open Food Facts beim Scannen und die Schritte aus dem Dashboard“), Zeile in `docs/data-sources.md` Abschnitt 8 und Abschnitt in `docs/known-limitations.md`.

### 5.4 Weitere Punkte

- Kamera: nur nach der Frage des Systems; Fotoauswahl geht ohne Kamerazugriff.
- Nur du: Allowlist auf dem Server. Sollen später weitere Personen FORM nutzen, braucht es vorher eine Datenschutzerklärung (Q-20, Gesundheitsdaten nach DSGVO).
- Keine Fotos fürs Training irgendwo, keine Telemetrie.

## 6. Modell als Einstellung und Vergleich

### 6.1 Einstellung

„Einstellungen → Ernährung → Modell für Fotos“: Claude Opus 5.5 oder Claude Sonnet 5.5, mit Kosten je Foto und dem Ergebnis des Vergleichs. Die App schickt die Wahl mit; die Edge Function nimmt nur Modelle aus ihrer Allowlist. Ein neues Modell kommt so ohne neue App-Version dazu: Allowlist in der Funktion erweitern, Eintrag in der Einstellung.

### 6.2 Kosten (Schätzung, gemessen wird im Vergleich)

Preise je 1 Mio. Token (Anthropic, Stand der Unterlagen vom 06.10.2026): Opus 5.5 4 $ Eingabe, 20 $ Ausgabe; Sonnet 5.5 2 $ und 10 $.

| je Foto | Opus 5.5 | Sonnet 5.5 |
|---|---|---|
| Eingabe: Bild bei 1568 px Kantenlänge rund 2.500 Token (Faustregel Breite × Höhe / 750), dazu Prompt und Schema rund 1.500 | ca. 1,6 Cent | ca. 0,8 Cent |
| Ausgabe mit Denken: 1.000 bis 3.000 Token | 2 bis 6 Cent | 1 bis 3 Cent |
| **zusammen** | **ca. 4–8 Cent** | **ca. 2–4 Cent** |
| 3 Fotos am Tag, 30 Tage | ca. 3,60–7,20 $ | ca. 1,80–3,60 $ |

Gerechnet werden die echten Werte aus `usage` jeder Antwort. Größere Bilder (bis 2576 px, bis rund 4.800 Bild-Token) testen wir nur, wenn die Erkennung mit 1568 px nicht reicht.

### 6.3 Vergleichstest (Plan; Ergebnis folgt, sobald dein Test-Schlüssel und die Fotos da sind)

- **Fotos:** 15 bis 20, am besten deine eigenen Mahlzeiten mit gewogenen Bestandteilen (Küchenwaage), dazu die schwierigen Fälle aus dem Auftrag: Hähnchen mit Reis, Lachs mit Gemüse, Eier mit Avocado, Nudeln mit Soße, Curry mit Reis, Burger mit Pommes, Salat mit Dressing, Pizza, eine Verpackung mit Nährwerttabelle, eine mit verdecktem Etikett, ein dunkles, ein unscharfes Foto, ein Foto ohne Essen. Ohne eigene Fotos ginge es mit frei lizenzierten Bildern (Wikimedia Commons), dafür bräuchte die Umgebung eine Freigabe; Gewichte gäbe es dann nicht.
- **Ablauf:** dasselbe Foto, derselbe Prompt, dasselbe Schema, je Modell zwei Läufe (Streuung), Denkstufe `low` und `medium`.
- **Gemessen:**
  - Erkennung: richtig, teilweise, falsch, übersehen, erfunden, je Posten gegen deine Liste;
  - Portion: Abweichung in Prozent zum gewogenen Wert, und ob die Spanne den echten Wert enthält;
  - Ehrlichkeit: meldet das Modell, was nicht sichtbar ist (Öl, Soße, Brust oder Keule, Marke), statt zu raten;
  - Dauer: Median und langsamster Lauf;
  - Kosten: Token aus `usage`, mal Preis.
- **Ergebnis:** Tabelle je Foto und Summe je Modell, mit Empfehlung für den Standard. Die Läufe gehen über deinen Test-Schlüssel mit niedrigem Limit; vorher nenne ich die erwarteten Kosten (rund 1 bis 2 $ für 20 Fotos, 2 Modelle, 2 Läufe, 2 Denkstufen).

## 7. Nährwerttabellen auf dem Gerät auslesen, ohne Dritte

### 7.1 Zuerst der Barcode

Für Verpackungen bleibt der Barcode der beste Weg: eigenes Lebensmittel oder Open Food Facts. Das Auslesen der Tabelle hilft, wenn Open Food Facts nichts oder Unvollständiges hat, ohne dass das Foto das Gerät verlässt.

### 7.2 Im Web (heutige PWA)

- **Tesseract.js** (Apache 2.0), Texterkennung in WebAssembly, läuft ganz im Browser. Alles lässt sich selbst ausliefern (`workerPath`, `corePath`, `langPath`); die CSP erlaubt WebAssembly schon (`'wasm-unsafe-eval'`), der Worker muss von der eigenen Adresse kommen (`worker-src 'self'`).
- Kosten: mehrere MB (vier Varianten des Kerns, dazu die deutschen Sprachdaten), nur beim ersten Gebrauch geladen und dann offline; die Startansicht bleibt unberührt.
- Grenzen: Auf glänzenden, gewölbten Verpackungen ist die Erkennung mittelmäßig; die Größe der Sprachdaten und die Genauigkeit wären zu messen.
- Die Shape-Detection-API (`TextDetector`) scheidet aus: Safari bietet sie nicht.

### 7.3 Auf dem iPhone (Expo-App)

- **Apple Vision** (`VNRecognizeTextRequest`), Teil von iOS, läuft auf dem Gerät; Deutsch wird ab Revision 2 unterstützt (genau und schnell). Die unterstützten Sprachen fragt die App zur Laufzeit ab.
- Einbindung: ein kleines eigenes Expo-Modul (Swift, Expo Modules API) oder ein vorhandenes Paket wie `expo-text-extractor` (Apple Vision auf iOS, Google ML Kit auf Android; Pflege und Lizenz vor dem Einbau prüfen). Für „ohne Dritte“ zählt auf dem iPhone nur Apple Vision.
- Vorteil gegenüber dem Web: deutlich bessere Erkennung, kein Download, schnell.

### 7.4 Tabelle auswerten (gemeinsamer Parser)

Die Nährwertdeklaration nach der EU-Lebensmittelinformationsverordnung (LMIV, VO 1169/2011) hat feste Zeilen, die genau den acht Nährwerten in FORM entsprechen: Brennwert (kJ/kcal), Fett, davon gesättigte Fettsäuren, Kohlenhydrate, davon Zucker, Ballaststoffe (freiwillig), Eiweiß, Salz, je 100 g oder 100 ml. Ein Parser im gemeinsamen Kern:

- nimmt die Spalte „je 100 g/ml“, nicht „je Portion“ oder „% RI“;
- erkennt Schreibweisen (Komma, „<0,5 g“, „davon“) auf Deutsch und Englisch;
- prüft die Plausibilität: kJ ≈ 4,184 × kcal, Zucker ≤ Kohlenhydrate, gesättigte ≤ Fett, kcal ≈ 4 × Eiweiß + 4 × Kohlenhydrate + 9 × Fett (wie `kcalMismatch`);
- füllt das Formular „Eigenes Lebensmittel“ vor, wie heute bei unvollständigen Treffern von Open Food Facts. Du prüfst jeden Wert; gespeichert wird `source: 'custom'`, `quality: 'user'` mit dem Hinweis „von der Verpackung abgelesen“. Kein neues Feld nötig.

### 7.5 Empfehlung

Machbar, ohne Dritte. **Auf dem iPhone mit Apple Vision, also mit der Expo-App;** im Web nur, wenn die Oberfläche des Scanners dort entsteht (Abschnitt 8.2), weil Tesseract.js viel lädt und schlechter erkennt. Der Parser entsteht in jedem Fall im gemeinsamen Kern und wird mit echten Fotos von Verpackungen getestet.

## 8. iOS: React Native mit Expo

### 8.1 Was für Web und App gleich ist

| Teil | gleich, weil |
|---|---|
| Server (Edge Function) | eine Funktion, ein Schlüssel, eine Allowlist; beide Oberflächen rufen sie mit dem Anmeldetoken auf |
| Datenmodell | Einträge und Lebensmittel wie heute (Zod-Schemas), die Einstellung und die Einwilligung; die Speicherung (Dexie im Web, z. B. SQLite in Expo) liegt darunter und ändert die Schemas nicht |
| Prüfung der KI-Antwort | dasselbe Zod-Schema auf dem Server und im Gerät |
| Berechnung | `scaleNutrients`, `sumEntries`, Portionen und Parser im gemeinsamen Kern, ohne React, DOM oder Dexie |
| Texte | ein deutscher Textkatalog für beide |

Die Regel aus `CLAUDE.md` (`model/` und `calc/` ohne React und Dexie) passt dazu; der Scanner hält sie streng ein.

### 8.2 Oberfläche: im Web oder erst nativ?

**Empfehlung: erst nativ in Expo.** Vorher, direkt nach dem Merge von #54, entstehen der gemeinsame Kern und die Edge Function mit Tests und dem Vergleich der Modelle. Beides braucht keine Oberfläche und nützt Web und App gleich.

Gründe:

- Die Migration beginnt nach #54; eine Web-Oberfläche entstünde zweimal (Kamera, Karten, Rückfragen, Zusammenfassung).
- Die Kamera ist nativ deutlich besser: Die installierte Web-App fragt unter Umständen bei jedem Start nach der Kamera (`docs/known-limitations.md`), nativ einmal; `expo-image-picker` und `expo-image-manipulator` erledigen Aufnahme, Auswahl und Verkleinern.
- Das Auslesen von Verpackungen geht ohne Dritte gut nur mit Apple Vision, also nativ.

Ausnahme: Dauert die Migration länger als etwa zwei Monate, lohnt eine schlanke Web-Oberfläche (Foto wählen, Karten, Speichern). Sie nutzt denselben Kern; nur die Darstellung entstünde später nativ neu.

### 8.3 Folgen der Migration für den Scanner

- Die Anmeldung (Token) muss in der App genauso verfügbar sein; heute exportiert das Modul `sync` sie nicht. Der Scanner bekommt eine kleine, gemeinsame Schnittstelle „Token holen“.
- Die BLS-Grundauswahl (`basicFoods.json`) wird in der App mitgeliefert wie im Web.
- Tests: Kern und Funktion mit Vitest; Oberfläche im Web mit Playwright, nativ mit den Werkzeugen der Migration.

## 9. Fehlerfälle

| Fall | Verhalten |
|---|---|
| keine Einwilligung | nichts wird gesendet; Suche und Barcode wie heute |
| Kamera abgelehnt | Hinweis wie beim Barcode, Foto auswählen geht weiter |
| Foto unscharf, dunkel, verdeckt | Hinweis aus `image_quality`, neues Foto anbieten; erkannte Posten bleiben mit niedriger Sicherheit sichtbar |
| kein Essen auf dem Foto | „Ich konnte kein Essen erkennen.“ |
| unsichere Erkennung | Karte mit „Lebensmittel wählen“, keine erfundene Zuordnung |
| keine Nährwerte für einen Posten | nichts geraten; wählen, anlegen oder Schnelleintrag (geschätzt) |
| nicht angemeldet, offline, Server oder Anthropic nicht erreichbar, Zeitlimit | klare Meldung, nichts geht verloren, Suche bleibt offen |
| ungültige Antwort der KI | wird nicht angezeigt und nicht gespeichert; Meldung und neuer Versuch |
| zu großes oder falsches Format | Verkleinern im Gerät; sonst Meldung |
| Abbrechen | Anfrage wird verworfen, späte Antworten werden ignoriert (wie `BarcodeFlow`) |
| Ablehnung durch Anthropic | Ausweichmodell laut 4.3; sonst Meldung, manuelle Eingabe |

## 10. Tests

- **Unit:** Schema (gültig, ungültig, fehlende Felder, Zahlen statt `null`, erfundene Nährwertfelder werden abgelehnt), Zuordnung, Portionen, Rechnen, Parser für Nährwerttabellen mit echten Texten aus der Erkennung.
- **Edge Function:** Zugang (ohne Token, fremdes Konto, falsches Modell, zu großes Bild), Weitergabe nur geprüfter Antworten, keine Inhalte im Protokoll.
- **E2E (Web, falls dort gebaut):** Einwilligung, Foto wählen, nachgestellte Antworten der Funktion (`page.route`), Karten, Rückfragen, Speichern, keine doppelten Einträge, Fehlerfälle; WebKit in der CI.
- **Echte Aufrufe:** der Vergleich aus 6.3, dazu Fälle, in denen das Modell nicht raten darf: Brust oder Keule nicht zu unterscheiden, Öl nicht zu sehen, Soße unbekannt, Portion nicht bestimmbar, Marke nicht prüfbar.

## 11. Annahmekriterien (Vorschlag, kommen als AK in `docs/requirements.md`)

1. Foto aufnehmen oder auswählen geht; ohne Einwilligung wird nichts gesendet.
2. Die Auswertung läuft über die eingerichtete Edge Function mit dem gewählten Modell, getestet mit echten Fotos.
3. Mehrere Posten auf einem Teller werden einzeln erkannt.
4. Jede Portion zeigt Schätzung, Spanne und Sicherheit oder „nicht bestimmbar“.
5. Nährwerte kommen nur aus Quellen in FORM; die Quelle steht am Posten.
6. Kein Wert der KI erscheint als geprüft; die App zeigt keine Nährwerte der KI.
7. Korrigieren geht (Lebensmittel, Menge, Zubereitung), die Summen rechnen sich neu.
8. Gespeichert wird erst nach „Zum Tagebuch hinzufügen“, ohne Doppel.
9. Tagessumme und Makros stimmen danach.
10. Fehlerfälle aus Abschnitt 9 sind abgedeckt.
11. Kein Schlüssel im Code oder in der App; nur dein Konto kommt durch.
12. Texte deutsch, nach den Markenleitplanken.
13. Bestehende Ernährungsfunktionen bleiben unverändert (alle bisherigen Tests grün).
14. Grenzen stehen ehrlich in `docs/known-limitations.md`.

## 12. Schritte nach dem Merge von #54

| Paket | Inhalt | Ergebnis |
|---|---|---|
| 1 | Branch `form-essensscanner` von `main`, Entwurfs-PR, NU-14 in Anforderungen und Funktionsmatrix wieder aufnehmen | Plan im Repository |
| 2 | Gemeinsamer Kern: Schemas, Zuordnung, Portionen, Rechnen, Parser, mit Unit-Tests | ohne Oberfläche, für Web und App |
| 3 | Edge Function mit Tests; Vergleich Opus 5.5 und Sonnet 5.5 mit deinen Fotos über den Test-Schlüssel | Tabelle zu Genauigkeit, Dauer, Kosten; deine Wahl des Standards |
| 4 | Einspielen der Edge Function nach deinem OK; du trägst Schlüssel und Allowlist als Secrets ein | erster echter Aufruf vom Server |
| 5 | Oberfläche (Empfehlung: in Expo, sonst schlank im Web) mit Einwilligung, Karten, Rückfragen, Speichern | Gerätetest |
| 6 | Verpackung auslesen mit Apple Vision und dem Parser | Gerätetest |

Jedes Paket mit D-Nummer, Commit, Push, Tests und Bericht wie bisher.

## 13. Was du einrichten musst

- **Test-Schlüssel** (dein eigener, mit niedrigem Ausgabelimit): Sag Bescheid, wenn er da ist. Dann öffne ich das sichere Formular für `api.anthropic.com`. Gespeichert wird er in deiner Umgebung „Default“, also für alle Sitzungen, die sie nutzen; soll er nur für dieses Repository gelten, lege ich auf deinen Wunsch eine eigene Umgebung dafür an. Ich sehe den Schlüssel nie.
- **Fotos** für den Vergleich (Abschnitt 6.3), am besten mit gewogenen Mengen.
- **Für den Betrieb**, nach deinem OK zum Einspielen: einen eigenen Schlüssel für den Betrieb als Secret `ANTHROPIC_API_KEY` in Supabase (Edge Functions → Secrets), dazu `SCANNER_ALLOWED_USERS` mit deiner `user_id`; ein Ausgabelimit in der Konsole von Anthropic.
- Optional: privacy.claude.com für die Umgebung freigeben, damit ich den Datenschutz-Artikel direkt lese.

## 14. Grenzen und offene Punkte

- Portionen aus einem Foto bleiben Schätzungen; ohne Waage oder Bezugsgröße ist die Sicherheit selten hoch.
- Der Scanner braucht Netz und Anmeldung; offline gibt es Suche, Barcode (bekannte Produkte) und Schnelleintrag wie heute.
- Die Grundauswahl hat 361 Lebensmittel; was dort fehlt, ordnest du selbst zu oder legst es an. Der ÖNWT-Import erweitert sie, wenn du ihn nutzt.
- Die Bedingungen von Anthropic können sich ändern; der Text wird vor jeder Veröffentlichung geprüft.
- Kosten und Genauigkeit in Abschnitt 6 sind Schätzungen bis zum Vergleich.

## Quellen

- Anthropic, Commercial Terms of Service, gültig ab 17.06.2025: https://www.anthropic.com/legal/commercial-terms (gelesen am 07.11.2026)
- Anthropic, API and data retention: https://platform.claude.com/docs/en/manage-claude/api-and-data-retention (gelesen am 07.11.2026)
- Anthropic, How long do you store my organization's data (commercial data retention policy): https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data (nicht erreichbar aus der Arbeitsumgebung; Inhalt laut Suchergebnis)
- Supabase, Edge Functions Limits: https://supabase.com/docs/guides/functions/limits
- Tesseract.js, Local Installation: https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/docs/local-installation.md
- Apple Developer Forums zu `VNRecognizeTextRequest` und den unterstützten Sprachen: https://developer.apple.com/forums/thread/121048
- `expo-text-extractor` (README): https://socket.dev/npm/package/expo-text-extractor
- Verordnung (EU) Nr. 1169/2011 (LMIV), Anhang XV (Nährwertdeklaration)
