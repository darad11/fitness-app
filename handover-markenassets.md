# Übergabe · Markenassets in der App (Icons, Logo, Anmeldung, Startbild)

Stand: 21.10.2026 · Für die nächste Claude-Sitzung · Verbindlich bleiben `CLAUDE.md`, `implementation-plan.md`, `decisions.md` und `form-markenleitplanken.md`; diese Datei beschreibt die Assets und ihre Einbindung. Paket: `form-app-assets.zip` (liegt neben dieser Datei).

## 1. Entscheidungen des Produktinhabers

| Thema | Entscheidung |
|---|---|
| Store-Icon (iOS, Android, PWA-Manifest) | 01 Minimal flach: grünes F auf dunkler Kachel, ohne Glow, nur das F (keine Wortmarke im Icon) |
| Kopfzeile oben links, alle Seiten | F in dunkler Kachel mit 1-px-Rand plus Wortmarke, beide in gleicher Versalhöhe, Gesamthöhe 30 px; Tipp führt wie bisher zu „Heute“ |
| Anmeldung | Logo (Symbol + Wortmarke) mit Claim „FORM YOURSELF.“ und Unterzeile „Werde die Person, die du sein möchtest.“ – Claim und Unterzeile als Text, nicht als Bild |
| Mehr › Über die App | Logo ohne Claim |
| Startbild | Nacht-Fläche #0C1219, Symbol mittig, 24 % der Bildschirmbreite |
| Onboarding-Sequenz mit Manifest | erst mit Q-20 (mehrere Nutzer), jetzt nicht bauen |
| Glow | nirgends in der App-Oberfläche; nur Marketing |

## 2. Wo alles liegt

| Datei im Paket | Zweck | Ziel im Repo (Vorschlag) |
|---|---|---|
| `icons/favicon.svg`, `favicon.ico`, `favicon-16.png`, `favicon-32.png` | Browser-Tab | `public/icons/` |
| `icons/apple-touch-icon.png` (180) | iOS Homescreen | `public/icons/` |
| `icons/icon-192.png`, `icon-512.png`, `icon-maskable-192.png`, `icon-maskable-512.png`, `icon-1024.png` | PWA-Manifest, Store | `public/icons/` |
| `logo/logo-kopfzeile-dunkel.svg`, `-hell.svg` (+ PNG @1x/@2x/@3x) | Kopfzeile | `public/brand/` (als `<img>`, siehe Paket B) |
| `logo/kachel-f.svg` | Platzhalter, Avatar, Tab-Symbol | `public/brand/` |
| `logo/logo-anmeldung-dunkel.svg`, `-hell.svg` (+ PNG @3x) | Anmeldung, Über die App | `public/brand/` |
| `logo/symbol-f-gruen.svg` (+ PNG 24/48/72/240) | kleine Stellen, Ladeanzeige | `public/brand/` |
| `splash/splash.svg`, `splash-1170x2532.png`, `splash-1290x2796.png`, `splash-2048x2732.png`, `splash-1024.png` | Startbild | `public/splash/` |
| `snippets/head.html` | `<link>`-Zeilen für Icons und Manifest | in `index.html` einsetzen |
| `snippets/manifest.webmanifest.json` | Manifest mit Icons und Farben | mit dem bestehenden Manifest zusammenführen (Name, `start_url`, `scope` beibehalten) |
| `snippets/brand.css` | Markenfarben als CSS-Variablen, Klassen für Kopfzeile und Claim | in die bestehenden Tokens übernehmen, nicht doppelt definieren |

Alle SVGs sind echte Vektoren mit benannten Gruppen (`kachel`, `symbol`, `wortmarke`); Farben stehen als `fill` auf den Gruppen.

## 3. Pakete in dieser Reihenfolge

**Paket A · Icons und Manifest.** Dateien nach `public/icons/` kopieren, `snippets/head.html` in den `<head>` übernehmen, Manifest zusammenführen. Nachweis: Safari-Tab und Chrome-Tab zeigen das F; „Zum Home-Bildschirm“ am iPhone zeigt das Icon ohne weißen Rand; Android zeigt das maskable Icon ohne abgeschnittenes F (das F liegt in der sicheren Mitte, 45,7 % der Kachel). Alte Icon-Dateien entfernen.

**Paket B · Kopfzeile.** Das bisherige Logo oben links durch `logo-kopfzeile-dunkel.svg` ersetzen, im Light Mode `logo-kopfzeile-hell.svg`. Als `<img>` aus `public/brand/` laden, nicht inline in die Startansicht – die liegt bei 249,4 KB von 250 KB (D-288), ein Inline-SVG mit rund 15 KB würde sie sprengen. Höhe 30 px, Breite automatisch (rund 155 px), linker Abstand wie die Seiteninhalte, Tipp-Fläche mindestens 44 × 44 px, `alt="FORM – zu Heute"`. Verhalten unverändert: führt zu „Heute“. E2E `steps.spec.ts`, `tasks.spec.ts`, `water.spec.ts` prüfen die Reihenfolge auf „Heute“ und das Logo – Selektoren anpassen, falls die Komponente wechselt.

**Paket C · Anmeldung und Über die App.** Anmeldung: `logo-anmeldung-dunkel.svg`, Breite 64 % des Bildschirms, höchstens 280 px, mittig, bei etwa 30 % der Höhe; darunter der Claim als Text mit den Klassen `.form-claim` und `.form-claim-sub` aus `brand.css` (Inter 17 px halbfett, Unterzeile 13 px, #AAB2BE). Die Statusleistenfarbe bleibt wie in D-281. Über die App: dasselbe Logo ohne Claim, darunter Versionsnummer und „Nach Updates suchen“ wie bisher.

**Paket D · Startbild.** Für die installierte Web-App `apple-touch-startup-image` mit den drei PNGs und passenden `media`-Abfragen (1170×2532 iPhone 14/15, 1290×2796 Pro Max, 2048×2732 iPad); Manifest `background_color` und `theme_color` auf #0C1219. Kein Text auf dem Startbild. Nachweis: Kaltstart der installierten App am iPhone zeigt das Symbol auf dunkler Fläche, kein weißer Blitz.

**Paket E · Tokens abgleichen.** Die Variablen aus `brand.css` neben die bestehenden Design-Tokens legen und in einer Tabelle gegenüberstellen: welche App-Farbe entspricht welcher Markenfarbe, wo weichen sie ab (Akzent, Grundfläche, Kachel). Nichts umfärben, nur dokumentieren; die Entscheidung trifft der Produktinhaber. Ergebnis als `brand-tokens.md` ablegen.

## 4. Regeln, die bei allem gelten

- Pfade und Proportionen der Logos nie ändern, nie skalieren außer über die Höhe; Symbol und Wortmarke nie trennen, außer das F allein wird ausdrücklich verwendet.
- Keine Verläufe, kein Glow, keine Schatten am Logo in der App.
- Grün #C7FF46 ist Akzent, nie Fläche; auf hellen Flächen Text in #4C7A00, das Symbol bleibt grün.
- Wortmarke ohne Punkt. Claims nur mit Unterzeile.
- Alles Weitere in `form-markenleitplanken.md` (Sprache, keine Streaks, keine Beschämung).

## 5. Nachweis vor dem Merge

- [ ] Icons: Tab, Homescreen iOS, Android maskable, Store-Größe 1024 vorhanden
- [ ] Kopfzeile: auf jeder Seite sichtbar, 30 px hoch, Tipp führt zu „Heute“, Light Mode hell
- [ ] Startansicht bleibt unter 250 KB (`pnpm check:bundle`)
- [ ] Anmeldung: Logo plus Claim und Unterzeile als Text, Kontrast geprüft
- [ ] Über die App: Logo ohne Claim
- [ ] Startbild: Kaltstart ohne weißen Blitz
- [ ] E2E grün inklusive WebKit; Entscheidungen als D-Nummern in `decisions.md`

## 6. Offen beim Produktinhaber

1. `brand-tokens.md` nach Paket E durchsehen und entscheiden, ob App-Farben an die Markenfarben angeglichen werden.
2. Ob die Anmeldung zusätzlich das Manifest zeigt – nach Q-20.
3. Light Mode: bleibt er in der App überhaupt erhalten? Falls nein, entfallen die `-hell`-Dateien.
