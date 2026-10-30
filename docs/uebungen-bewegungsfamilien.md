# Übungen · Bewegungsfamilien und Quellen der Animationen

Stand: 27.10.2026 · Auftrag `prompts/uebungen-animation-gratis-FORM.md` Abschnitt 3 und 7 (D-411) · Daten `tools/uebungen-3d/familien.json`, Abschnitte 2 bis 8 erzeugt von `python3 tools/uebungen_familien.py`; Abschnitt 8 (Priorität nach Programmen und Vorlagen) Stand 28.10.2026, D-416. Recherche zu CMU und Mixamo nur über Websuche und GitHub, Bewegungsdaten nicht angesehen: Jede Zuordnung zu einer Aufnahme braucht vor dem Einbau eine Sichtprüfung.

## 1. Verfahren

- **Rig:** Alle Übungen laufen über dasselbe IK-Rig (`tools/uebungen-3d/rig.py`, D-407): Füße fest am Boden, Knie folgen den Zehen, Hände im Griff am Gerät, Ellbogen nach der Regel der Übung (etwa Unterarm senkrecht), Hand um die Stange gedreht, bis das Handgelenk gerade ist, Rumpf über Becken und Wirbelsäule.
- **Quelle der Bewegung:** Motion Capture nur, wenn die Aufnahme dieselbe Übung zeigt; bei gleich guter Passung CMU vor Mixamo, weil CMU kein Konto braucht. Sonst baut der Code die Bewegung aus der Familie (Ausgangs-, Zwischen- und Endposition, Minimum-Ruck-Zeitverlauf). Auch bei Motion Capture korrigiert das Rig Hände, Füße und Gerät.
- **Rohdaten nicht ins Repository:** Das Repository ist öffentlich. CMU-Daten dürfen nicht weiterverkauft, Mixamo-Dateien nicht weitergegeben werden; beide werden wie das MakeHuman-Modell beim Rendern geladen (`tools/uebungen-3d/quelle/`, in `.gitignore`). In die App kommen nur die gerenderten Videos. Lizenzen in `licenses-data.md` Abschnitt 7.
- **Familien statt Einzelstücke:** Jede Familie wird einmal biomechanisch sauber gebaut; eine Übung ist eine Variante davon (Gerät, Griff, Winkel, Bewegungsumfang). Keine starre gleiche Haltung für alle.

## 2. Familien

| Familie | Grundmuster | Gelenke und Kennwerte | Übungen | Basis (Std.) |
|---|---|---|---|---|
| Kniebeuge | Hüfte und Knie beugen gleichzeitig; der Rumpf neigt sich so weit, dass Schwerpunkt und Last über der Fußmitte bleiben; aufwärts strecken Knie und Hüfte gemeinsam. Füße fest am Boden (IK, Fußsperre), Knie folgen der Zehenrichtung (Pol-Ziele). Führung der Last: freie Stange auf senkrechter Bahn, Schiene (Multipresse, Hackenschmidt) oder Schlitten (Beinpresse: Körper fix, Plattform bewegt sich). Statisch: Wandsitzen. | Hüfte 0° → 95–115° Beugung; Knie 0° → 100–120° (Oberschenkel waagrecht); oberes Sprunggelenk bis 25–35° Dorsalflexion; Rumpfneigung zur Senkrechten: Rückenkniebeuge 35–45°, Front- und Goblet-Kniebeuge 15–25°, an Hackenschmidt und Beinpresse durch das Polster vorgegeben; Stand schulterbreit, Zehen 15–30° nach außen; Hände per IK an Stange oder Hantel. | 9 | 8 |
| Hüftbeuge | Bewegung aus der Hüfte bei neutraler Wirbelsäule: Becken schiebt nach hinten, Rumpf neigt sich nach vorn, Knie nur leicht gebeugt; Rückweg durch Hüftstreckung. Untermuster: stehend mit Last (Kreuzheben, Rumänisches Kreuzheben, Good Morning, Swing), Rückenlage oder an die Bank gelehnt (Hip Thrust, Brücke), am Gerät (Rückenstrecker, Pull-Through). | Hüfte 0° → 70–100° Beugung; Knie beim Rumänischen Kreuzheben 15–25° fest, beim Kreuzheben vom Boden unten 60–80°, Sumo mehr; Rumpf im Umkehrpunkt 0–45° zur Waagrechten; Wirbelsäule neutral (nur Rückenstrecker mit Wirbelbeugung); Hip Thrust und Brücke: Hüftstreckung aus etwa 90° bzw. 45° Beugung bis 0°, Knie oben etwa 90°; Stange nah am Körper über der Fußmitte. | 13 | 10 |
| Ausfallschritt und einbeinig | Schrittstellung, Gewicht überwiegend auf dem vorderen Bein: vorderes Knie und Hüfte beugen, das hintere Knie senkt sich senkrecht Richtung Boden; Rumpf aufrecht bis leicht vorgeneigt. Varianten mit Schritt (vor, zurück), stationär (Bulgarische Kniebeuge mit erhöhtem hinterem Fuß) und Aufsteigen (Step-up). | Vorderes Knie 0° → etwa 90°, vordere Hüfte 0° → 80–100°; hinteres Knie 0° → etwa 90° (2–5 cm über dem Boden), hintere Hüfte 0–10° Streckung, hinterer Fuß auf dem Ballen; Schrittlänge etwa 0,7–0,9 m; Becken waagrecht; Fußkontakte wechseln (IK-Sperre an und aus). | 4 | 7 |
| Waagrechtes Drücken | Die Arme drücken vom Rumpf weg (Schulter-Horizontalbeugung und Ellbogenstreckung), Schulterblätter stabil. Entweder bewegt sich die Last (Bankdrücken, Brustpresse, Kabel) oder der Körper (Liegestütz, Dips: Hände fest, Rumpf bewegt sich). | Ellbogen 0–10° → 80–100° Beugung; Oberarm 45–70° zum Rumpf (nicht 90°); Unterarme senkrecht unter der Last; Bankdrücken: Stange zur unteren Brust, Bahn leicht schräg; Schrägbank 30–45°; Dips: Schulterstreckung, bis die Oberarme etwa waagrecht sind, Rumpf 10–30° vorgeneigt; Liegestütz: Körper als Brett, Brust 5–10 cm über dem Boden. | 13 | 8 |
| Senkrechtes Drücken | Last von Schulterhöhe senkrecht über den Kopf drücken und kontrolliert zurück; beim Langhanteldrücken weicht der Kopf kurz nach hinten aus; Rumpf stabil, Last endet über Schulter und Fußmitte. | Schulterbeugung und -abduktion von etwa 80–90° auf 170–180°; Ellbogen 90–110° → 0–5°; Unterarme senkrecht; Schulterblatt dreht nach oben (Schlüsselbein-Knochen); stehend Knie und Hüfte gestreckt; Arnold Press zusätzlich Unterarmdrehung um etwa 180° und Außenrotation. | 5 | 5 |
| Waagrechtes Ziehen | Last zum Rumpf ziehen: Schulterstreckung mit Ellbogenbeugung, Schulterblätter ziehen zusammen und lösen sich wieder; der Rumpf ruht (sitzend, brustgestützt) oder wird in Vorbeuge gehalten (Haltung aus der Hüftbeuge-Familie). | Ellbogen 0° → 90–110°; Schulterstreckung, bis der Ellbogen 15–30° hinter dem Rumpf ist; Schulterblätter 2–4 cm zusammen; Vorbeuge-Rudern: Rumpf fest bei 30–60° zur Waagrechten, Knie 15–25°; Face Pull: Ellbogen hoch, Außenrotation, bis die Hände neben dem Kopf sind. | 8 | 6 |
| Senkrechtes Ziehen | Die Arme ziehen von oben nach unten (Schulter-Adduktion und -Streckung mit Ellbogenbeugung), die Schulterblätter senken sich. Entweder bewegt sich der Griff (Latzug, Kabel) oder der Körper (Klimmzug: Hände fest, Wurzel bewegt sich). Überzug: gestreckte Arme, nur die Schulter. | Schulter von 160–180° auf 30–60° Abduktion bzw. Beugung; Ellbogen 0–10° → 90–120°; beim Latziehen Rumpf 10–20° zurückgelehnt; beim Klimmzug hängen die Beine gestreckt oder gekreuzt, Kinn über die Stange; Überzug: Ellbogen 10–20° fest, Schulter 90–120° → 0–10°. | 7 | 7 |
| Arme beugen und strecken | Eingelenkig am Ellbogen (oder Handgelenk): der Oberarm bleibt ruhig, der Unterarm beugt oder streckt; der Griff bestimmt die Unterarmdrehung. Varianten nach Lage des Oberarms: neben dem Rumpf, über dem Kopf, auf dem Polster vor dem Körper, hinter dem Körper an der Schrägbank. | Ellbogen 0–10° ↔ 130–145° (Curls) bzw. 140° → 0° (Trizeps); Unterarm supiniert (Curl), neutral (Hammer) oder proniert (Reverse); Handgelenk bei Handgelenkcurls etwa 40° Beugung ↔ 40° Streckung; Schulter fest (Pushdown: Ellbogen am Rumpf; über Kopf: Oberarm 150–170°). | 18 | 4 |
| Schulter und Brust isoliert | Eingelenkig an der Schulter mit festem, leicht gebeugtem Ellbogen (langer Hebel): der Arm bewegt sich auf einem Bogen in einer Ebene (seitlich, vorn, waagrecht); dazu Schulterheben als reine Schulterblatt-Bewegung. | Ellbogen 10–20° fest; Seitheben: Abduktion 10° → 80–90°; Frontheben: Beugung 0° → 90°; Fliegende und Butterfly: horizontale Adduktion von 10–20° hinter der Körperebene bis 80–90° nach vorn; Reverse Fly: Gegenrichtung, Rumpf 45–90° vorgeneigt oder Brust am Polster; Schulterheben: Schlüsselbein 3–5 cm nach oben. | 10 | 5 |
| Beine isoliert | Eingelenkig am Bein, meist an einer Maschine: das Knie streckt oder beugt gegen ein Polster, das Sprunggelenk hebt die Ferse, die Hüfte spreizt, schließt oder streckt; der übrige Körper ruht und ist an Sitz und Griffe gebunden. | Knie 90° ↔ 0–5° (Beinstrecker) bzw. 0° ↔ 110–130° (Beinbeuger); Sprunggelenk 10–15° Dorsalflexion ↔ 20–30° Plantarflexion (Wadenheben); Hüfte sitzend 0° ↔ 35–45° Abduktion bzw. Adduktion je Seite; Hüftstreckung 0° → 20–30° (Kickback); Nordic Curl: Knie 90° → 0–20° bei gestrecktem Körper. | 12 | 4 |
| Rumpf | Uneinheitliche Familie mit fünf Untermustern: (a) Rumpfbeugung in Rückenlage (Crunch, Sit-up, Kabelcrunch), (b) statischer Stütz (Plank, Seitstütz), (c) Beinheben (liegend, hängend, stehend), (d) Drehung und Seitneigung (Russian Twist, Scheibenwischer, Heel Taps, Bicycle Crunch), (e) Arme und Beine gegengleich bei ruhigem Rumpf (Dead Bug, Bird Dog); dazu Anti-Rotation (Pallof Press) und Rollout (Bauchroller). | Wirbelsäule: Beugung über mehrere Wirbelknochen verteilt (Crunch etwa 30° Anheben des Oberkörpers, Sit-up bis 80–90° mit Hüftbeugung), Drehung bis 30–45° je Seite; Hüfte beim Beinheben 0° → 90°; Stütz: Ellbogen 90°, Körperlinie gerade; Kontakte an Becken, Rücken, Händen und Füßen ohne Durchdringen der Matte. | 16 | 12 |
| Kondition | Zyklische Ganzkörperbewegungen als Schleife: Sprünge (Hampelmann, Seilspringen, Burpee), Stützbewegung (Bergsteiger), Gehen und Laufen auf der Stelle (Laufband, Farmer's Walk) und Cardiogeräte, deren Mechanik die Bewegung vorgibt (Pedale, Rollsitz, Griffe per IK). | Sprünge: Knie und Hüfte federn 20–40°, Flugphase 5–15 cm; Laufen: Hüfte −10° bis +40°, Knie 0–90°, 150–170 Schritte je Minute; Rad: Kurbel 360°, Knie 30–110°; Rudern: Knie 0° ↔ 110–120°, Rumpf 30° vor ↔ 15–20° zurück, Ellbogen 0° ↔ 100°; Crosstrainer: Fußbahn als Ellipse, Arme gegengleich. | 9 | 10 |

## 3. Zuordnung aller 124 Übungen

### Kniebeuge

| Nr. | Übung | Variante | Gerät | Quelle | Std. Übung | Std. neues Gerät | Hinweis |
|---|---|---|---|---|---|---|---|
| 89 | Kniebeuge mit Langhantel | Stange auf dem oberen Rücken, Füße schulterbreit, Zehen leicht nach außen, Tiefe bis die Oberschenkel waagrecht sind | Langhantel mit Scheiben | Familie (Code); Abgleich Mixamo „Back Squat“ | 1.0 | 0.0 | Pilot, neu auf dem IK-Rig gebaut (D-407); Mixamo „Back Squat“ kann den Zeitverlauf gegenprüfen, Stange und Hände bleiben beim Rig. |
| 90 | Frontkniebeuge mit Langhantel | Stange vorn auf den Schultern, Ellbogen hoch, Rumpf aufrechter | Langhantel mit Scheiben | Familie (Code) | 1.0 | 0.0 | Front-Rack-Griff per IK; Mixamo „Air Squat“ oder CMU-Kniebeugen ohne Gewicht als Vorlage möglich. |
| 91 | Goblet Squat | Kurzhantel senkrecht vor der Brust, aufrecht, Ellbogen unten zwischen den Knien (Alias: Fersen erhöht) | Kurzhanteln | Familie (Code) | 1.0 | 0.0 | Kettlebell als Alternative; Mixamo „Air Squat Bent Arms“ oder CMU-Kniebeugen ohne Gewicht (86_02, 14_06) als Vorlage prüfen. |
| 92 | Kniebeuge an der Multipresse | Stange in der Multipresse geführt, Füße etwas vor der Stange | Multipresse | Familie (Code) | 0.75 | 0.0 | – |
| 93 | Beinpresse | Rückenlage im 45°-Schlitten, Füße auf der Plattform; die Plattform bewegt sich mit den Füßen, das Becken bleibt am Polster | Beinpresse 45° | Familie (Code) | 1.25 | 4.0 | Schlitten auf Schienen, Plattform an die Füße gebunden; Knie unten etwa 90°. |
| 94 | Hackenschmidt-Kniebeuge | Rücken am Polster des Schlittens, Schultern unter den Polstern, Kniebeuge entlang der Schiene | Hackenschmidt-Maschine | Familie (Code) | 1.25 | 4.0 | Maschine mit vielen Teilen. |
| 98 | Wandsitzen | statisch, Rücken an der Wand, Knie und Hüfte 90° | Wand | Familie (Code) | 0.5 | 0.2 | Statisch: Schleife mit dezenter Atmung. |
| 99 | Beinpresse, einbeinig | einbeinig an der Beinpresse, der andere Fuß ruht | Beinpresse 45° | Familie (Code) | 0.75 | 0.0 | – |
| 115 | Thruster mit Kurzhanteln | Kurzhanteln auf Schulterhöhe, aus der Kniebeuge ohne Pause über den Kopf drücken | Kurzhanteln | Familie (Code) | 2.0 | 0.0 | Kombination aus Kniebeuge und Schulterdrücken; beide Familien müssen fertig sein. |

### Hüftbeuge

| Nr. | Übung | Variante | Gerät | Quelle | Std. Übung | Std. neues Gerät | Hinweis |
|---|---|---|---|---|---|---|---|
| 13 | Kreuzheben mit Langhantel | Referenz der Familie: Stange vom Boden über der Fußmitte, Start mit der Hüfte über den Knien, Stange gleitet an Schienbeinen und Oberschenkeln hoch bis zum aufrechten Stand | Langhantel mit Scheiben | Familie (Code) | 0.5 | 0.0 | Scheiben (45 cm) stehen am Boden, Stange 22,5 cm hoch; Rücken neutral; Stange und Beine dürfen sich nicht durchdringen. |
| 26 | Rückenstrecken | 45°-Rückenstrecker: Becken auf dem Polster, Fersen unter der Rolle; Rumpf senkt sich und richtet sich bis zur geraden Linie auf (laut Quelle Rückenstreckung, also mit Wirbelsäule) | Rückenstrecker 45° | Familie (Code) | 1.0 | 2.0 | Beugung über mehrere Wirbelknochen verteilen, Kopf in Verlängerung. |
| 80 | Hip Thrust mit Langhantel | Schulterblätter an der Flachbank, Langhantel auf der Hüfte, Hüfte streckt, bis der Rumpf waagrecht ist | Langhantel mit Scheiben + Flachbank | Familie (Code) | 1.5 | 0.0 | Drehpunkt an der Bankkante; Stange liegt auf der Hüfte, die Hände halten sie. |
| 81 | Hip Thrust an der Maschine | an der Maschine mit Rückenpolster und Hüftpolster | Hip-Thrust-Maschine | Familie (Code) | 1.0 | 4.0 | Maschine mit vielen Teilen. |
| 82 | Hüftheben am Boden (Glute Bridge) | Rückenlage am Boden, Füße aufgestellt, Becken heben bis zur Linie Knie–Schulter | Matte | Familie (Code) | 0.75 | 0.0 | – |
| 85 | Kreuzheben Sumo mit Langhantel | weiter Stand, Zehen 30–45° nach außen, Griff innen zwischen den Knien, aufrechterer Rumpf, mehr Kniebeugung | Langhantel mit Scheiben | Familie (Code) | 1.25 | 0.0 | Mixamo „Sumo High Pull“ nur als Referenz (zieht zusätzlich hoch). |
| 87 | Pull-Throughs am Kabel | Rücken zur unteren Rolle, Seil zwischen den Beinen, Hüftbeuge und Streckung nach vorn | Kabelzug: zwei Säulen mit höhenverstellbaren Rollen + Seilgriff (Trizepsseil) | Familie (Code) | 1.25 | 0.0 | Kabel läuft zwischen den Beinen: Durchdringung prüfen. |
| 88 | Hip Thrust mit Kurzhantel | Kurzhantel auf der Hüfte gehalten | Kurzhanteln + Flachbank | Familie (Code) | 0.5 | 0.0 | – |
| 100 | Rumänisches Kreuzheben mit Langhantel | Start im Stand, Knie leicht gebeugt und fest, Hüfte nach hinten, bis die Stange unter Kniehöhe ist | Langhantel mit Scheiben | Familie (Code) | 0.75 | 0.0 | – |
| 101 | Rumänisches Kreuzheben mit Kurzhanteln | Kurzhanteln vor den Oberschenkeln | Kurzhanteln | Familie (Code) | 0.5 | 0.0 | – |
| 102 | Einbeiniges Rumänisches Kreuzheben mit Kurzhantel | einbeinig, das freie Bein streckt nach hinten, Becken bleibt waagrecht, Kurzhantel in der Gegenhand | Kurzhanteln | Familie (Code) | 1.5 | 0.0 | Gleichgewicht auf einem Bein (Schwerpunkt über dem Standfuß). |
| 105 | Good Mornings mit Langhantel | Stange auf dem oberen Rücken, Hüftbeugung, bis der Rumpf fast waagrecht ist, Knie leicht gebeugt | Langhantel mit Scheiben | Familie (Code) | 0.75 | 0.0 | – |
| 114 | Kettlebell Swing | ballistische Hüftbeuge und -streckung, die Kettlebell schwingt zwischen den Beinen nach hinten und bis Brusthöhe nach vorn | Kettlebell | Mixamo „Kettlebell Swing“ | 1.25 | 1.0 | Kettlebell an beiden Händen; ihre Bahn muss zum Schwung passen. |

### Ausfallschritt und einbeinig

| Nr. | Übung | Variante | Gerät | Quelle | Std. Übung | Std. neues Gerät | Hinweis |
|---|---|---|---|---|---|---|---|
| 84 | Step-ups mit Kurzhanteln | einbeinig auf die Flachbank (43 cm) steigen und zurück, Kurzhanteln seitlich | Kurzhanteln + Flachbank | Familie (Code) | 1.5 | 0.0 | Fußkontakt wechselt zwischen Boden und Bank; CMU 111_31 („Stepping up / stepping down“, schwangere Person) nur als Referenz. |
| 86 | Ausfallschritte rückwärts mit Kurzhanteln | Referenz der Familie: Schritt rückwärts, das hintere Knie senkt sich bis knapp über den Boden, zurück in den Stand | Kurzhanteln | Familie (Code) | 0.5 | 0.0 | Fußkontakte schalten (IK-Sperre an und aus); kein Ausfallschritt bei CMU oder Mixamo belegt. |
| 95 | Bulgarische Kniebeuge mit Kurzhanteln | hinterer Fuß auf der Flachbank, das vordere Bein beugt, bis der Oberschenkel waagrecht ist | Kurzhanteln + Flachbank | Familie (Code) | 1.0 | 0.0 | Fußrücken liegt auf der Bank (Kontakt). |
| 96 | Ausfallschritte mit Kurzhanteln | Schritt nach vorn und zurück (Alias abwechselnd) | Kurzhanteln | Familie (Code) | 0.75 | 0.0 | – |

### Waagrechtes Drücken

| Nr. | Übung | Variante | Gerät | Quelle | Std. Übung | Std. neues Gerät | Hinweis |
|---|---|---|---|---|---|---|---|
| 1 | Bankdrücken mit Langhantel | Rückenlage auf der Flachbank, Langhantel etwa 1,5-fach schulterbreit, Stange senkt sich zur unteren Brust und geht zurück | Langhantel mit Scheiben + Flachbank | Familie (Code) | 0.5 | 0.0 | Pilot, neu auf dem IK-Rig gebaut (D-407). Keine Mocap-Quelle (CMU ohne Hanteln, bei Mixamo kein Bankdrücken belegt). |
| 2 | Bankdrücken mit Kurzhanteln | Kurzhanteln statt Stange; Hanteln senken sich seitlich der Brust, Unterarme senkrecht, oben leicht zueinander; beidseitig (Alias auch abwechselnd) | Kurzhanteln + Flachbank | Familie (Code) | 1.0 | 1.0 | Freie Hantelbahn, Hände per IK an den Griffen. |
| 3 | Schrägbankdrücken mit Langhantel | Schrägbank 30–45°, Stange zur oberen Brust | Langhantel mit Scheiben + Schrägbank, verstellbar (auch fast senkrecht) | Familie (Code) | 1.0 | 2.0 | Bankwinkel als Parameter; die Lehne darf Kopf und Schulter nicht verdecken. |
| 4 | Schrägbankdrücken mit Kurzhanteln | Schrägbank 30–45° mit Kurzhanteln | Kurzhanteln + Schrägbank, verstellbar (auch fast senkrecht) | Familie (Code) | 0.75 | 0.0 | Kombination der Varianten Kurzhantel und Schrägbank. |
| 5 | Bankdrücken an der Multipresse | Stange in der Führung der Multipresse, senkrechte Bahn; das Aus- und Einhängen (Drehen der Haken) wird nicht gezeigt | Multipresse + Flachbank | Familie (Code) | 1.0 | 3.0 | Bank so unter die Führung stellen, dass die Stange über der unteren Brust läuft. |
| 6 | Brustpresse an der Maschine | sitzend, Griffe auf Brusthöhe, Hebelarme führen die Hände auf einem Bogen nach vorn | Brustpresse-Maschine | Familie (Code) | 1.5 | 4.0 | Maschine mit vielen Teilen (Sitz, Lehne, Hebel, Gewichtsblock); Griffe drehen um den Hebeldrehpunkt, Hände per IK gebunden, Gewichtsblock hebt sich mit. |
| 7 | Bodendrücken mit Kurzhanteln | Rückenlage am Boden, Knie gebeugt, Ellbogen setzen unten auf (kürzerer Bewegungsumfang) | Kurzhanteln + Matte | Familie (Code) | 1.0 | 0.3 | Bodenübung: Ellbogen berühren die Matte ohne Durchdringen; Kamera etwas höher als Standard. |
| 11 | Liegestütze | Stütz in Bauchlage, Körper als Brett, Hände etwas weiter als schulterbreit am Boden; der Körper bewegt sich, Hände und Füße bleiben fest | keins | Mixamo „Push Up“ | 1.5 | 0.0 | Bodenübung, Kamera seitlich und niedrig; Hände und Fußspitzen per IK am Boden sperren. Keine CMU-Aufnahme (nur Handstand-Liegestütz 88_02). |
| 12 | Schrägbankdrücken am Kabel | Schrägbank zwischen den Kabelsäulen, untere Rollen, Drücken nach oben-vorn (laut Quelle einarmig geführt) | Kabelzug: zwei Säulen mit höhenverstellbaren Rollen + D-Griff + Schrägbank, verstellbar (auch fast senkrecht) | Familie (Code) | 1.5 | 0.0 | Kabel laufen von unten-hinten zu den Händen; Bank mittig zwischen den Säulen. |
| 57 | Enges Bankdrücken | Griff schulterbreit, Ellbogen näher am Körper | Langhantel mit Scheiben + Flachbank | Familie (Code) | 0.5 | 0.0 | Nur Griffbreite und Ellbogenweg ändern sich gegenüber der Referenz. |
| 59 | Dips | Stütz am Barren, Körper senkt sich, bis die Oberarme etwa waagrecht sind, Rumpf leicht vorgeneigt; Hände fest, der Körper bewegt sich | Dipbarren | Familie (Code) | 1.5 | 1.0 | Umgekehrte Kette wie beim Klimmzug; Beine leicht gebeugt. |
| 60 | Dips mit Unterstützung | kniend auf der Plattform der Gegengewichtsmaschine | Gegengewichtsmaschine für Klimmzug und Dip | Familie (Code) | 1.0 | 0.0 | Gleiche Maschine wie Klimmzüge mit Unterstützung. |
| 61 | Dips an der Bank | Hände hinter dem Körper auf der Bankkante, Füße am Boden, Ellbogen beugen nach hinten | Flachbank | Familie (Code) | 1.25 | 0.0 | Becken nah an der Bank; Schulter nicht zu tief. |

### Senkrechtes Drücken

| Nr. | Übung | Variante | Gerät | Quelle | Std. Übung | Std. neues Gerät | Hinweis |
|---|---|---|---|---|---|---|---|
| 30 | Schulterdrücken mit Langhantel, stehend | Referenz der Familie: stehend, Stange von der Schulterablage senkrecht über den Kopf, der Kopf weicht kurz zurück | Langhantel mit Scheiben | Familie (Code) | 0.5 | 0.0 | Stangenbahn senkrecht über der Fußmitte; Schulterblätter drehen mit. |
| 31 | Schulterdrücken mit Kurzhanteln, sitzend | sitzend an fast senkrechter Lehne, Kurzhanteln | Kurzhanteln + Schrägbank, verstellbar (auch fast senkrecht) | Familie (Code) | 1.0 | 0.0 | Lehne der verstellbaren Bank fast senkrecht. |
| 32 | Schulterdrücken an der Maschine | sitzend, Griffe an Hebelarmen | Schulterpresse-Maschine | Familie (Code) | 1.0 | 4.0 | Maschine mit vielen Teilen. |
| 33 | Arnold Press mit Kurzhanteln | sitzend; Start mit den Handflächen zum Gesicht vor dem Kinn, beim Drücken drehen die Unterarme nach außen | Kurzhanteln + Schrägbank, verstellbar (auch fast senkrecht) | Familie (Code) | 2.0 | 0.0 | Unterarmdrehung um etwa 180° braucht Drehknochen im Unterarm, sonst verdreht sich die Haut; neue Bewegungskopplung. |
| 41 | Schulterdrücken mit Kurzhanteln, stehend | stehend mit Kurzhanteln, beidarmig (Alias abwechselnd) | Kurzhanteln | Familie (Code) | 0.75 | 0.0 | – |

### Waagrechtes Ziehen

| Nr. | Übung | Variante | Gerät | Quelle | Std. Übung | Std. neues Gerät | Hinweis |
|---|---|---|---|---|---|---|---|
| 19 | Rudern am Kabel, sitzend | Referenz der Familie: sitzend, Füße an der Fußstütze, Knie leicht gebeugt, Rumpf aufrecht; V-Griff zum Bauch, Schulterblätter zusammen | Kabelrudern-Station (Sitz, Fußstütze, untere Rolle) + V-Griff | Familie (Code) | 0.5 | 2.0 | Weiter Griff und Untergriff (Alias-Namen) nur über einen anderen Griff; Rumpf schaukelt nicht. |
| 20 | Rudern mit Langhantel, vorgebeugt | stehend in Vorbeuge (Rumpf etwa 30–45° zur Waagrechten, Haltung aus der Hüftbeuge-Familie), Obergriff, Zug zum Bauch | Langhantel mit Scheiben | Familie (Code) | 1.5 | 0.0 | Zwei Familien kombiniert (Haltung aus hueftbeuge, Bewegung aus waagrecht_ziehen); Stange bleibt über der Fußmitte. |
| 21 | Rudern mit Kurzhanteln, vorgebeugt | Kurzhanteln, neutraler Griff, beidarmig | Kurzhanteln | Familie (Code) | 1.0 | 0.0 | – |
| 22 | Einarmiges Rudern mit Kurzhantel | einarmig; Knie und Hand der Gegenseite auf der Flachbank, Rumpf waagrecht | Kurzhanteln + Flachbank | Familie (Code) | 1.5 | 0.0 | Asymmetrische Stützhaltung mit drei Kontakten; der Rumpf dreht nicht mit. |
| 23 | T-Bar-Rudern | Langhantel in einer Landmine-Halterung, V-Griff unter dem Stangenende, Vorbeuge; die Stange beschreibt einen Bogen um den Drehpunkt | Langhantel mit Scheiben + Landmine-Halterung + V-Griff | Familie (Code) | 1.5 | 0.5 | Quelle beschreibt die Hebelmaschine; für die freie T-Stange reicht der Drehpunkt am Boden. |
| 24 | Rudern an der Maschine | sitzend, Brust am Polster, Griffe an Hebelarmen | Rudermaschine, brustgestützt | Familie (Code) | 1.0 | 4.0 | Maschine mit vielen Teilen; Hebelbahn als Kreisbogen. |
| 29 | Rudern an der Multipresse, vorgebeugt | Vorbeuge an der Multipresse, Stange senkrecht geführt | Multipresse | Familie (Code) | 0.75 | 0.0 | – |
| 39 | Face Pulls am Kabel | stehend, Kabel auf Gesichtshöhe, Seilgriff, Zug zum Gesicht mit Außendrehung, Ellbogen hoch | Kabelzug: zwei Säulen mit höhenverstellbaren Rollen + Seilgriff (Trizepsseil) | Familie (Code) | 1.5 | 1.0 | Seilenden biegen sich mit den Händen; Außendrehung der Schulter deutlich zeigen. |

### Senkrechtes Ziehen

| Nr. | Übung | Variante | Gerät | Quelle | Std. Übung | Std. neues Gerät | Hinweis |
|---|---|---|---|---|---|---|---|
| 14 | Klimmzüge | hängend, Obergriff etwas weiter als schulterbreit; Hände fest an der Stange, der Körper zieht sich hoch, bis das Kinn über der Stange ist | Klimmzugstange | Familie (Code) | 2.0 | 1.0 | Umgekehrte Kette: Wurzel bewegt sich, Hände fix; Beine hängen gestreckt oder gekreuzt mit leichtem Nachschwingen. Weder CMU (nur Spielplatz 01_12) noch Mixamo („Pull Up“ nicht belegt). |
| 15 | Klimmzüge mit Unterstützung | kniend auf der Plattform der Gegengewichtsmaschine; die Plattform bewegt sich mit den Knien | Gegengewichtsmaschine für Klimmzug und Dip | Familie (Code) | 1.5 | 4.0 | Maschine mit vielen Teilen (Plattform, Griffe, Gewichtsblock); die Einstellung des Gegengewichts ist nicht darstellbar. |
| 16 | Klimmzüge im Untergriff | Untergriff schulterbreit, sonst wie Klimmzug | Klimmzugstange | Familie (Code) | 1.0 | 0.0 | Handflächen zum Körper, Ellbogen bleiben vor dem Körper. |
| 17 | Latziehen | sitzend, Oberschenkel unter der Knierolle, Latzugstange im breiten Obergriff, Zug zur oberen Brust, Oberkörper leicht zurückgelehnt | Latzug mit Kabel und Latzugstange | Familie (Code) | 0.5 | 0.0 | Pilot, neu auf dem IK-Rig gebaut (D-407); Stange und Kabel folgen den Händen. Ansicht hinten-seitlich, weil die arbeitenden Muskeln auf dem Rücken liegen. |
| 18 | Latziehen, enger Griff | V-Griff eng und neutral, Zug zur Brust, Ellbogen nah am Körper | Latzug mit Kabel und Latzugstange + V-Griff | Familie (Code) | 1.0 | 0.5 | V-Griff ersetzt die Latzugstange am Kabel. |
| 25 | Überzüge am Kabel | Überzug: stehend an der oberen Rolle, leicht vorgeneigt, Arme fast gestreckt; Bogen von Augenhöhe bis zu den Oberschenkeln | Kabelzug: zwei Säulen mit höhenverstellbaren Rollen + gerade Kabelstange, kurz | Familie (Code) | 1.0 | 0.3 | Nur die Schulter bewegt sich, Ellbogenwinkel fix. |
| 28 | Einarmiges Latziehen am Kabel, kniend | kniend vor der oberen Rolle, einarmig mit D-Griff, Zug zur Schulter | Kabelzug: zwei Säulen mit höhenverstellbaren Rollen + D-Griff | Familie (Code) | 1.5 | 0.0 | Kniestand als neue Grundhaltung; Kabel kommt schräg von oben. |

### Arme beugen und strecken

| Nr. | Übung | Variante | Gerät | Quelle | Std. Übung | Std. neues Gerät | Hinweis |
|---|---|---|---|---|---|---|---|
| 42 | Bizepscurls mit Langhantel | Referenz der Familie: stehend, Langhantel im Untergriff schulterbreit, Ellbogen am Körper, Beugung bis vor die Schultern | Langhantel mit Scheiben | Familie (Code) | 0.5 | 0.0 | Oberarm ruhig, kein Schwung aus dem Rücken. |
| 43 | Bizepscurls mit Kurzhanteln | Kurzhanteln, Unterarm dreht beim Heben nach außen; Alias abwechselnd | Kurzhanteln | Mixamo „Bicep Curl“ | 1.0 | 0.0 | Prüfen, ob die Mixamo-Animation beidarmig oder abwechselnd ist; Hanteln per IK. |
| 44 | Bizepscurls mit SZ-Stange | SZ-Stange, halb gedrehter Griff | SZ-Stange mit Scheiben | Familie (Code) | 0.75 | 1.0 | SZ-Stange neu (Knicke im Griffteil). |
| 45 | Hammercurls | Kurzhanteln, neutraler Griff (Daumen oben) | Kurzhanteln | Familie (Code) | 0.5 | 0.0 | Aus dem Kurzhantelcurl ableitbar, Unterarmdrehung gesperrt; Mixamo „Bicep Curl“ als Vorlage. |
| 46 | Scottcurls | sitzend an der Scottbank, Oberarme auf dem schrägen Polster, SZ-Stange | SZ-Stange mit Scheiben + Scottbank | Familie (Code) | 1.0 | 1.5 | Oberarm liegt auf dem Polster (Kontakt ohne Durchdringen). |
| 47 | Bizepscurls am Kabel | stehend vor der unteren Rolle, gerade Stange (Alias Bayesian und High Cable nicht dargestellt) | Kabelzug: zwei Säulen mit höhenverstellbaren Rollen + gerade Kabelstange, kurz | Familie (Code) | 0.75 | 0.0 | – |
| 48 | Schrägbank-Curls mit Kurzhanteln | Rücken an der Schrägbank (45–60°), Arme hängen hinter dem Körper, Curl | Kurzhanteln + Schrägbank, verstellbar (auch fast senkrecht) | Familie (Code) | 1.0 | 0.0 | – |
| 49 | Handgelenkcurls | sitzend, Unterarme auf den Oberschenkeln, nur das Handgelenk beugt und streckt | Kurzhanteln + Flachbank | Familie (Code) | 1.0 | 0.0 | Sehr kleine Bewegung: engerer Bildausschnitt oder Ausgangs- und Endposition; Handgelenk und Griffpose müssen sauber sein. |
| 50 | Hammercurls am Kabel mit Seil | untere Rolle, Seilgriff, neutraler Griff | Kabelzug: zwei Säulen mit höhenverstellbaren Rollen + Seilgriff (Trizepsseil) | Familie (Code) | 0.75 | 0.0 | – |
| 51 | Scottcurls mit Kurzhanteln | Scottbank mit Kurzhantel (einarmig oder beidarmig) | Kurzhanteln + Scottbank | Familie (Code) | 0.75 | 0.0 | – |
| 52 | Reverse Curls mit SZ-Stange | SZ-Stange im Obergriff | SZ-Stange mit Scheiben | Familie (Code) | 0.5 | 0.0 | – |
| 53 | Trizepsdrücken am Kabel | stehend an der oberen Rolle, Ellbogen am Körper, Strecken nach unten, gerade Stange | Kabelzug: zwei Säulen mit höhenverstellbaren Rollen + gerade Kabelstange, kurz | Familie (Code) | 0.75 | 0.0 | Alias mit Seil möglich (Seilgriff vorhanden). |
| 54 | Trizepsstrecken über Kopf am Kabel | Rücken zur Rolle, Seil über dem Kopf, Oberarme neben dem Kopf, Strecken nach vorn-oben; Schrittstellung | Kabelzug: zwei Säulen mit höhenverstellbaren Rollen + Seilgriff (Trizepsseil) | Familie (Code) | 1.25 | 0.0 | Kabel läuft über die Schulter: Abstand zum Kopf prüfen. |
| 55 | Trizepsstrecken über Kopf mit Kurzhantel | sitzend, eine Kurzhantel mit beiden Händen hinter dem Kopf (Alias einarmig), Ellbogen zeigen nach oben | Kurzhanteln + Flachbank | Familie (Code) | 1.0 | 0.0 | Hantel darf den Kopf nicht durchdringen. |
| 56 | French Press mit SZ-Stange | Rückenlage auf der Flachbank, SZ-Stange von über der Stirn nach oben strecken, Oberarme leicht nach hinten geneigt und fix | SZ-Stange mit Scheiben + Flachbank | Familie (Code) | 1.0 | 0.0 | – |
| 58 | Trizeps-Kickbacks mit Kurzhantel | vorgebeugt mit Abstützen auf der Bank, Oberarm parallel zum Rumpf und fix, Ellbogen streckt nach hinten (einarmig) | Kurzhanteln + Flachbank | Familie (Code) | 1.0 | 0.0 | Stützhaltung vom einarmigen Rudern übernehmen. |
| 62 | Trizepsdrücken am Kabel, über Kreuz | einarmig, Kabel von der oberen Rolle der Gegenseite, der Arm streckt sich schräg vor dem Körper nach außen | Kabelzug: zwei Säulen mit höhenverstellbaren Rollen + D-Griff | Familie (Code) | 1.0 | 0.0 | Kabel kreuzt vor dem Körper: Durchdringung prüfen. |
| 63 | French Press mit Kurzhanteln | Kurzhanteln, neutraler Griff | Kurzhanteln + Flachbank | Familie (Code) | 0.5 | 0.0 | – |

### Schulter und Brust isoliert

| Nr. | Übung | Variante | Gerät | Quelle | Std. Übung | Std. neues Gerät | Hinweis |
|---|---|---|---|---|---|---|---|
| 8 | Fliegende mit Kurzhanteln | Rückenlage auf der Flachbank, Arme leicht gebeugt und fixiert, Hanteln auf einem Bogen nach außen-unten bis Schulterhöhe und zurück | Kurzhanteln + Flachbank | Familie (Code) | 1.0 | 0.0 | Ellbogenwinkel konstant halten, sonst sieht es wie Drücken aus. |
| 9 | Fliegende am Kabel | stehend zwischen zwei Kabelsäulen, obere Rollen, Schrittstellung, leicht vorgeneigt; Hände treffen sich vor dem unteren Bauch | Kabelzug: zwei Säulen mit höhenverstellbaren Rollen + D-Griff | Familie (Code) | 1.5 | 3.5 | Zwei Kabel mit Verlauf über die Rollen; Schräg- und Negativvarianten (Alias-Namen) nur über die Rollenhöhe; Kabel dürfen den Körper nicht schneiden. |
| 10 | Butterfly an der Maschine | sitzend an der Butterfly-Maschine, Griffe auf Schulterhöhe, Arme auf einem Bogen nach vorn | Butterfly-Maschine (auch für Reverse Butterfly) | Familie (Code) | 1.0 | 4.0 | Hebelarme drehen um senkrechte Achsen; Quelle beschreibt Griffe, nicht Armpolster. |
| 27 | Schulterheben mit Kurzhanteln | stehend, Arme hängen gestreckt, nur die Schultern heben und senken (3–5 cm), keine Kreisbewegung | Kurzhanteln | Familie (Code) | 0.75 | 0.0 | Kleine Bewegung; braucht bewegliche Schlüsselbein-Knochen im Rig; frontale Ansicht zeigt sie besser. |
| 34 | Seitheben mit Kurzhanteln | Referenz der Familie: stehend, Arme seitlich bis Schulterhöhe, Ellbogen leicht gebeugt | Kurzhanteln | Familie (Code) | 0.5 | 0.0 | Alias Spider Lateral Raise (auf der Schrägbank liegend) wird nicht dargestellt; keine Mixamo-Animation belegt. |
| 35 | Seitheben am Kabel | einarmig, Kabel von der unteren Rolle vor dem Körper, D-Griff | Kabelzug: zwei Säulen mit höhenverstellbaren Rollen + D-Griff | Familie (Code) | 1.0 | 0.0 | Freie Hand hält sich an der Säule. |
| 36 | Frontheben mit Kurzhanteln | Arme nach vorn bis Schulterhöhe | Kurzhanteln | Mixamo „Front Raises“ | 1.0 | 0.0 | Mixamo-Figur hält keine Hantel: Griffpose und Hantel per IK ergänzen. |
| 37 | Reverse Flys mit Kurzhanteln | vorgebeugt (Rumpf fast waagrecht, Haltung aus der Hüftbeuge-Familie), Arme seitlich nach oben | Kurzhanteln | Familie (Code) | 1.0 | 0.0 | – |
| 38 | Reverse Butterfly an der Maschine | an der Butterfly-Maschine mit der Brust zum Polster, Arme auf dem Bogen nach hinten | Butterfly-Maschine (auch für Reverse Butterfly) | Familie (Code) | 1.0 | 0.0 | Gleiche Maschine wie Butterfly, andere Sitzrichtung. |
| 40 | Frontheben am Kabel | Rücken zur unteren Rolle, Kabel zwischen den Beinen, gerade Stange, Arme nach vorn bis Schulterhöhe | Kabelzug: zwei Säulen mit höhenverstellbaren Rollen + gerade Kabelstange, kurz | Familie (Code) | 1.0 | 0.0 | Bewegung wie Mixamo „Front Raises“ (Referenz); Alias Spider Cable Front Raise nicht dargestellt. |

### Beine isoliert

| Nr. | Übung | Variante | Gerät | Quelle | Std. Übung | Std. neues Gerät | Hinweis |
|---|---|---|---|---|---|---|---|
| 83 | Kickbacks am Kabel | stehend vor der unteren Rolle, Fußschlaufe am Knöchel, ein Bein streckt nach hinten, Oberkörper leicht vorgeneigt, Hände an der Säule | Kabelzug: zwei Säulen mit höhenverstellbaren Rollen + Fußschlaufe für den Kabelzug | Familie (Code) | 1.25 | 0.5 | Standbein mit Fußsperre; Becken nicht verdrehen. |
| 97 | Beinstrecker | Referenz der Familie: sitzend, Polster vor den Schienbeinen, Knie streckt von 90° bis fast gestreckt | Beinstrecker-Maschine | Familie (Code) | 0.5 | 3.5 | Hebeldrehpunkt auf Höhe der Kniegelenkachse. |
| 103 | Beinbeuger liegend | Bauchlage auf der Maschine, Rolle hinter den Fersen, das Knie beugt | Beinbeuger-Maschine, liegend | Familie (Code) | 1.0 | 3.0 | Liegende Haltung auf schräger Liegefläche. |
| 104 | Beinbeuger sitzend | sitzend, Oberschenkelpolster, Rolle unter den Waden, das Knie beugt nach unten-hinten | Beinbeuger-Maschine, sitzend (vom Beinstrecker abgeleitet) | Familie (Code) | 0.75 | 1.5 | Gerät vom Beinstrecker ableitbar. |
| 106 | Nordic Curls | kniend, Fersen fixiert, Körper gerade nach vorn senken, mit den Händen abfangen und zurückdrücken | Matte + Fersenhalter mit Kniepolster (Nordic Curls) | Familie (Code) | 1.5 | 1.5 | Schwer als Schleife (Rückweg mit Abstoßen der Hände); eventuell Ausgangs- und Endposition mit dezenter Bewegung. |
| 107 | Wadenheben stehend | stehend unter den Schulterpolstern, Fußballen auf der Stufe, Fersen heben und senken | Wadenmaschine, stehend | Familie (Code) | 0.75 | 3.0 | Kleine Bewegung; seitliche Ansicht wichtig. |
| 108 | Wadenheben sitzend | sitzend, Knie unter dem Polster, Fersen heben | Wadenmaschine, sitzend | Familie (Code) | 0.75 | 3.0 | – |
| 109 | Wadenheben an der Beinpresse | an der Beinpresse, Beine gestreckt, nur das Sprunggelenk drückt die Plattform | Beinpresse 45° | Familie (Code) | 0.75 | 0.0 | – |
| 110 | Adduktorenmaschine | sitzend, Polster an der Knie-Innenseite, Beine schließen | Ab-/Adduktorenmaschine | Familie (Code) | 0.75 | 4.0 | Kamera eher frontal. |
| 111 | Abduktorenmaschine | Polster außen, Beine öffnen | Ab-/Adduktorenmaschine | Familie (Code) | 0.5 | 0.0 | Gleiche Maschine, Polster umgesteckt. |
| 112 | Seitliches Gehen mit Widerstandsband | halbe Hocke, Band über den Knien oder Knöcheln, seitliche Schritte | Widerstandsband (Mini-Band, dehnbar) | Familie (Code) | 1.5 | 1.5 | Band dehnt sich mit dem Beinabstand (Verformung); seitliche Fortbewegung als Schleife auf der Stelle oder mit mitlaufender Kamera. |
| 113 | Wadenheben mit Kurzhanteln | stehend, Kurzhanteln seitlich, Fersen heben | Kurzhanteln | Familie (Code) | 0.5 | 0.0 | – |

### Rumpf

| Nr. | Übung | Variante | Gerät | Quelle | Std. Übung | Std. neues Gerät | Hinweis |
|---|---|---|---|---|---|---|---|
| 64 | Unterarmstütz (Plank) | Unterarmstütz statisch, Körperlinie gerade | Matte | Familie (Code) | 0.75 | 0.0 | Statisch: Schleife zeigt Halten mit dezenter Atmung. Aus dem Code statt Mixamo „Plank“ (D-466): Die Dateien brauchen das Konto des Produktinhabers, und eine gehaltene Haltung braucht keine Aufnahme. |
| 65 | Seitstütz | Seitstütz auf einem Unterarm, Körper seitlich gestreckt, statisch | Matte | Familie (Code) | 1.0 | 0.0 | Statisch; frontale Kamera zeigt die Körperlinie besser als die Standardansicht. |
| 66 | Crunches | Referenz für Rumpfbeugung: Rückenlage, Knie gebeugt, Oberkörper rollt etwa 30° ein, Schulterblätter lösen sich vom Boden | Matte | Familie (Code) | 0.5 | 0.0 | Mixamo „Situps“ nur als Vorlage (Bewegungsumfang begrenzen); Beugung über die Wirbel verteilen. |
| 67 | Crunches am Kabel, kniend | kniend vor der oberen Rolle, Seil am Kopf, Rumpf rollt ein, Hüfte bleibt | Kabelzug: zwei Säulen mit höhenverstellbaren Rollen + Seilgriff (Trizepsseil) | Familie (Code) | 1.25 | 0.0 | Kniestand; Hände halten das Seil neben dem Kopf. |
| 68 | Beinheben hängend | hängend an der Klimmzugstange, Beine heben bis waagrecht | Klimmzugstange | Familie (Code) | 1.5 | 0.0 | Hängen wie beim Klimmzug; kein Pendeln, Becken kippt leicht mit. |
| 69 | Beinheben liegend | Rückenlage, gestreckte Beine heben bis senkrecht und senken bis knapp über den Boden | Matte | Familie (Code) | 0.75 | 0.0 | – |
| 70 | Russian Twist | sitzend, Oberkörper etwa 45° zurückgelehnt, Füße leicht angehoben, Drehung nach links und rechts mit Gewicht | Matte + Kurzhanteln | Familie (Code) | 1.25 | 0.0 | Drehung über Brust- und Lendenwirbel verteilen; Gewicht (Kurzhantel) in beiden Händen. |
| 71 | Bauchroller | kniend, der Bauchroller rollt nach vorn, bis der Körper fast gestreckt ist, und zurück | Matte + Bauchroller | Familie (Code) | 1.5 | 0.5 | Rad rollt ohne Rutschen (Drehung aus dem Weg berechnen); Hände per IK am Griff. |
| 72 | Dead Bug | Rückenlage, Arme senkrecht, Hüfte und Knie 90°; gegengleich Arm und Bein strecken | Matte | Familie (Code) | 1.0 | 0.0 | Lendenwirbel bleiben am Boden. |
| 73 | Vierfüßlerstand diagonal (Bird Dog) | Vierfüßlerstand, gegengleich Arm nach vorn und Bein nach hinten strecken | Matte | Familie (Code) | 1.0 | 0.0 | Becken bleibt waagrecht; drei Kontakte am Boden. |
| 74 | Pallof Press am Kabel | seitlich zur Rolle auf Brusthöhe, D-Griff vor der Brust, Arme nach vorn strecken und zurück, Rumpf bleibt gerade | Kabelzug: zwei Säulen mit höhenverstellbaren Rollen + D-Griff | Familie (Code) | 1.0 | 0.0 | Die eigentliche Arbeit (gegen die Drehung halten) ist unsichtbar; der seitliche Kabelzug muss die Idee tragen. |
| 75 | Bicycle Crunches | Rückenlage, Ellbogen zum Gegenknie mit Drehung, Beine radeln | Matte | Mixamo „Bicycle Crunch“ | 1.0 | 0.0 | – |
| 76 | Heel Taps | Rückenlage, Knie gebeugt, Schultern leicht angehoben, Rumpf neigt seitlich, die Hand tippt abwechselnd an die Ferse | Matte | Familie (Code) | 1.0 | 0.0 | Seitneigung statt Drehung. |
| 77 | Sit-ups | Rückenlage, Knie gebeugt, Oberkörper richtet sich ganz auf | Matte | Mixamo „Situps“ | 1.0 | 0.0 | Füße bleiben am Boden (Fußsperre). |
| 78 | Windshield Wipers | Rückenlage, Arme seitlich, Beine senkrecht; die Beine kippen gemeinsam nach links und rechts | Matte | Familie (Code) | 1.25 | 0.0 | Schultern bleiben am Boden; Drehung in Becken und unterem Rücken. |
| 79 | Knieheben stehend | stehend, Knie abwechselnd bis über Hüfthöhe heben | keins | Familie (Code) | 0.75 | 0.0 | Gleichgewicht auf einem Bein; CMU „Marching“ (138_01 bis 138_10) nur als Referenz. |

### Kondition

| Nr. | Übung | Variante | Gerät | Quelle | Std. Übung | Std. neues Gerät | Hinweis |
|---|---|---|---|---|---|---|---|
| 116 | Farmer's Walk | Gehen mit schweren Kurzhanteln in beiden Händen, Rumpf aufrecht, Schultern unten | Kurzhanteln | CMU 35_01; Abgleich Mixamo „Standard Walk“ | 1.5 | 0.0 | Gehen aus CMU auf der Stelle, Arme per IK mit Last; CMU 70_01 bis 70_13 („carry … suitcase“, einseitige Last) als Referenz für den Gang unter Last. |
| 117 | Burpees | Hocke, Hände auf den Boden, Sprung in den Stütz, zurück, Strecksprung | keins | Mixamo „Burpee“ | 1.5 | 0.0 | Kontakte wechseln (Hände, Füße); Mixamo „Burpee Start“ und „Burpee End“ helfen bei der Schleife. |
| 118 | Bergsteiger (Mountain Climbers) | Stütz mit den Händen unter den Schultern, Knie abwechselnd zügig zur Brust | keins | Familie (Code) | 1.5 | 0.0 | Hände fest, Becken ruhig; Ausgangshaltung aus Mixamo „Plank“ oder „Push Up“ ableitbar; als Mixamo-Animation nicht belegt. |
| 119 | Hampelmann | Sprung in die Grätsche mit den Armen über dem Kopf und zurück | keins | CMU 86_05; Abgleich Mixamo „Jumping Jacks“ | 2.0 | 0.0 | Abschnitt aus einer langen Aufnahme schneiden und zur Schleife schließen; Kandidaten in der GIF-Vorschau vergleichen (CMU rät, mit höheren Subject-Nummern zu beginnen). |
| 120 | Seilspringen | kleine Sprünge auf den Fußballen, Handgelenke kreisen, das Seil dreht sich | Springseil | Mixamo „Jumping Rope“ | 1.5 | 2.0 | Seil als Kurve zwischen den Händen, Drehung an die Sprünge gekoppelt (Seil unter den Füßen, wenn sie in der Luft sind). |
| 121 | Rudergerät | Zyklus: Auslage (Knie gebeugt, Arme gestreckt), Beinstoß, Rumpf zurück, Armzug; Rückweg umgekehrt; Rollsitz gleitet, Füße fest im Stemmbrett | Rudergerät | Familie (Code) | 3.0 | 4.0 | Neue mehrphasige Bewegung; Griff und Kette per IK; Verhältnis Zug zu Rückweg etwa 1:2. Keine Mocap-Quelle (CMU 79_95 „rowing“ ist vermutlich Pantomime). |
| 122 | Fahrradergometer | sitzend, Füße an den Pedalen, Kurbel dreht 360°, Hände am Lenker | Fahrradergometer | Familie (Code) | 1.5 | 3.0 | Bewegung vollständig aus dem Kurbelwinkel ableitbar (Fuß-IK an den Pedalen); gute Schleife. |
| 123 | Laufband | Joggen auf der Stelle, das Band läuft | Laufband | CMU 35_17; Abgleich Mixamo „Treadmill Running“ | 1.5 | 3.0 | Vorwärtsbewegung der CMU-Aufnahme entfernen (die Füße gleiten dann wie auf dem Band); Bandtextur mitlaufen lassen. |
| 124 | Crosstrainer | Füße auf den Pedalen (elliptische Bahn), Hände an den beweglichen Griffen, gegengleich | Crosstrainer | Familie (Code) | 2.0 | 5.0 | Die Gerätemechanik (Koppelgetriebe) bestimmt die Bahn; Füße und Hände per IK; gute Schleife. |

## 4. Aufwand

| Posten | Stunden |
|---|---|
| Übungen (Varianten, Prüfung) | 130.5 |
| Neue Geräte (41, je einmal gezählt) | 92.8 |
| Basis der Familien (davon 23 für die drei Familien der Pilot-Übungen) | 86 |
| Einmalig (CMU- und Mixamo-Übertragung, Kabelverlauf, Prüfseiten) | 26 |
| **Summe** | **335.3** |

Die Zahlen je Zeile sind eine Einzelschätzung. Meine Gesamteinschätzung nach dem Pilot: **rund 300 Stunden, Spanne 250 bis 400**, dazu rund 35 Stunden Rechenzeit auf vier CPU-Kernen (etwa 17 Minuten je Übung). Unsicher sind vor allem die Maschinen mit vielen Teilen (Beinpresse, Hackenschmidt, Butterfly, Kabelturm, Cardiogeräte) und Bodenübungen, bei denen Körper und Matte sich berühren. Nicht enthalten: deine Freigabe je Familie.

## 5. Motion Capture

### CMU Graphics Lab Motion Capture Database

| Aufnahme | Beschreibung | passt zu | Beleg |
|---|---|---|---|
| 86_05 | walking, jumping, jumping jacks, jumping on one foot, punching, chopping, | jumping_jack | https://github.com/una-dinosauria/cmu-mocap/blob/master/cmu-mocap-index-text.txt |
| 13_29 | jumping jacks, side twists, bend over, squats | jumping_jack | https://github.com/una-dinosauria/cmu-mocap/blob/master/cmu-mocap-index-text.txt |
| 13_30 | jumping jacks, side twists, squats, jog | jumping_jack | https://github.com/una-dinosauria/cmu-mocap/blob/master/cmu-mocap-index-text.txt |
| 13_31 | jumping jacks, side twists, bend over, jog | jumping_jack | https://github.com/una-dinosauria/cmu-mocap/blob/master/cmu-mocap-index-text.txt |
| 14_06 | jumping jacks, jog, squats, side twists, stretches | jumping_jack | https://github.com/una-dinosauria/cmu-mocap/blob/master/cmu-mocap-index-text.txt |
| 14_14 | jumping jacks, jog, squats, side twists, stretches | jumping_jack | https://github.com/una-dinosauria/cmu-mocap/blob/master/cmu-mocap-index-text.txt |
| 14_20 | jumping jacks, side twists, reach up, bend over | jumping_jack | https://github.com/una-dinosauria/cmu-mocap/blob/master/cmu-mocap-index-text.txt |
| 22_15 / 23_15 | alternating jumping jacks (2 subjects - subject A / subject B) | jumping_jack | https://github.com/una-dinosauria/cmu-mocap/blob/master/cmu-mocap-index-text.txt |
| 22_16 / 23_16 | synchronized jumping jacks (2 subjects - subject A / subject B) | jumping_jack | https://github.com/una-dinosauria/cmu-mocap/blob/master/cmu-mocap-index-text.txt |
| 22_14 / 23_14 | alternating squats (2 subjects - subject A / subject B) |  | https://github.com/una-dinosauria/cmu-mocap/blob/master/cmu-mocap-index-text.txt |
| 86_02 | walk, squats, run, stretch, jumps, punches, and drinking |  | https://github.com/una-dinosauria/cmu-mocap/blob/master/cmu-mocap-index-text.txt |
| 86_08 | walking, squats, stretching, kicking, and punching |  | https://github.com/una-dinosauria/cmu-mocap/blob/master/cmu-mocap-index-text.txt |
| 35_01 bis 35_16, 35_28 bis 35_34 | walk | farmers_walk | https://github.com/una-dinosauria/cmu-mocap/blob/master/cmu-mocap-index-text.txt |
| 07_01 bis 07_12, 08_01 bis 08_11 | walk (auch slow walk, brisk walk, walk/stride) | farmers_walk | https://github.com/una-dinosauria/cmu-mocap/blob/master/cmu-mocap-index-text.txt |
| 35_17 bis 35_26 | run/jog | treadmill | https://github.com/una-dinosauria/cmu-mocap/blob/master/cmu-mocap-index-text.txt |
| 16_35, 16_36, 16_45, 16_46, 16_56 | run/jog | treadmill | https://github.com/una-dinosauria/cmu-mocap/blob/master/cmu-mocap-index-text.txt |
| 70_01 bis 70_13 | carry 5.5lb / 12.5lb / 19.5lb suitcase |  | https://github.com/una-dinosauria/cmu-mocap/blob/master/cmu-mocap-index-text.txt |
| 111_31 | Stepping up / stepping down |  | https://github.com/una-dinosauria/cmu-mocap/blob/master/cmu-mocap-index-text.txt |
| 49_02, 49_03 | jump up and down, hop on one foot |  | https://github.com/una-dinosauria/cmu-mocap/blob/master/cmu-mocap-index-text.txt |
| 138_01 bis 138_10 | Marching |  | https://github.com/una-dinosauria/cmu-mocap/blob/master/cmu-mocap-index-text.txt |
| 01_12 | playground - climb, pull up, dangle, sit, lower self to ground |  | https://github.com/una-dinosauria/cmu-mocap/blob/master/cmu-mocap-index-text.txt |
| 79_93, 79_95 | weight lifting; rowing |  | https://github.com/una-dinosauria/cmu-mocap/blob/master/cmu-mocap-index-text.txt |
| 88_02 | backflips, jump onto platform, handstands, vertical pushups |  | https://github.com/una-dinosauria/cmu-mocap/blob/master/cmu-mocap-index-text.txt |
| 42_01, 77_21, 83_22, 114_10, 86_03, 86_04, 86_07 | stretch / stretching (in Mischaufnahmen) |  | https://github.com/una-dinosauria/cmu-mocap/blob/master/cmu-mocap-index-text.txt |
| 111_38 bis 111_41, 113_28, 113_29 | Yoga |  | https://github.com/una-dinosauria/cmu-mocap/blob/master/cmu-mocap-index-text.txt |

Laut Beschreibung zeigt keine Aufnahme eine Übung mit Langhantel, Kurzhantel oder an einem Gerät (79_93 „weight lifting“ ist nicht näher beschrieben und nicht angesehen). Für die drei Pilot-Übungen gibt es deshalb keine passende CMU-Aufnahme; eine Kniebeuge ohne Gewicht mit vorgestreckten Armen hat eine andere Rumpfneigung als die Kniebeuge mit der Stange auf dem Rücken.

### Mixamo

| Animation | dazu | passt zu | Beleg |
|---|---|---|---|
| Push Up | Idle To Push Up, Push Up To Idle | push_up | https://github.com/hansen1416/video2motion-screenshots/blob/main/anim-player/public/filenames.json |
| Plank | Start Plank, End Plank | plank, mountain_climber, side_plank | https://github.com/hansen1416/video2motion-screenshots/blob/main/anim-player/public/filenames.json |
| Situps | Idle To Situp, Situp To Idle | sit_up, crunch | https://github.com/hansen1416/video2motion-screenshots/blob/main/anim-player/public/filenames.json |
| Bicycle Crunch | Start Bicycle Sit Up | bicycle_crunch | https://github.com/hansen1416/video2motion-screenshots/blob/main/anim-player/public/filenames.json |
| Burpee | Burpee Start, Burpee End | burpee | https://github.com/hansen1416/video2motion-screenshots/blob/main/anim-player/public/filenames.json |
| Jumping Jacks | Start Jumping Jacks, Stop Jumping Jacks | jumping_jack | https://github.com/hansen1416/video2motion-screenshots/blob/main/anim-player/public/filenames.json |
| Jumping Rope |  | jump_rope | https://github.com/hansen1416/video2motion-screenshots/blob/main/anim-player/public/filenames.json |
| Kettlebell Swing |  | kettlebell_swing | https://github.com/hansen1416/video2motion-screenshots/blob/main/anim-player/public/filenames.json |
| Bicep Curl |  | biceps_curl_dumbbell, hammer_curl, biceps_curl_barbell | https://github.com/hansen1416/video2motion-screenshots/blob/main/anim-player/public/filenames.json |
| Front Raises |  | front_raise_dumbbell, front_raise_cable | https://github.com/hansen1416/video2motion-screenshots/blob/main/anim-player/public/filenames.json |
| Back Squat |  | back_squat_barbell, squat_smith | https://github.com/hansen1416/video2motion-screenshots/blob/main/anim-player/public/filenames.json |
| Air Squat |  | front_squat_barbell, thruster_dumbbell, wall_sit | https://github.com/hansen1416/video2motion-screenshots/blob/main/anim-player/public/filenames.json |
| Air Squat Bent Arms |  | goblet_squat | https://github.com/hansen1416/video2motion-screenshots/blob/main/anim-player/public/filenames.json |
| Sumo High Pull |  | sumo_deadlift | https://github.com/hansen1416/video2motion-screenshots/blob/main/anim-player/public/filenames.json |
| Treadmill Running |  | treadmill | https://github.com/QuadrigaProj/Fitage/blob/main/docs/3d/mixamo_export.js |
| Standard Walk |  | farmers_walk | https://github.com/QuadrigaProj/Fitage/blob/main/docs/3d/mixamo_export.js |
| Overhead Squat; Pistol (Beschreibung „Pistol Workout“); Box Jump; Jump Push Up; Circle Crunch; Arm Stretching; Neck Stretching; Warming Up |  |  | https://github.com/hansen1416/video2motion-screenshots/blob/main/anim-player/public/filenames.json |
| Pull Up |  |  | kein Treffer in der Dateiliste (rund 2.355 Namen) und in der GitHub-Codesuche |
| Mountain Climber |  |  | kein Treffer in der Dateiliste und in der GitHub-Codesuche |
| Lunge, Bench Press, Deadlift, Dips, Lat Pulldown, Shoulder Press, Lateral Raise, Crunch (ohne Zusatz), Leg Raise, Glute Bridge, Russian Twist, Rowing (Ergometer), Cycling |  |  | kein Treffer in der Dateiliste |

## 6. Adressen

| Host | Wofür | Stand | Empfehlung |
|---|---|---|---|
| mocap.cs.cmu.edu | Originalseite der CMU (ASF/AMC, C3D, Unterseiten /subjects/…, Sammelarchiv allasfamc.zip) | gesperrt | nur nötig für die Originalformate; die Seite läuft nur über HTTP, das in dieser Umgebung auch nach Freigabe scheitern kann. BVH über GitHub reicht. |
| github.com, raw.githubusercontent.com, media.githubusercontent.com, codeload.github.com | Spiegel der BVH-Umwandlung: github.com/una-dinosauria/cmu-mocap (Pfad data/013/13_29.bvh usw.) und github.com/Shriinivas/cmubvh (ZIP je Aufnahme, GIF-Vorschau) | bereits erreichbar | keine Freigabe nötig; bevorzugter Weg |
| sites.google.com | cgspeed-Seiten von Bruce Hahne (BVH-Umwandlung, READMEFIRST) | gesperrt | nicht nötig, da die gleiche Umwandlung auf GitHub liegt; Downloads führen dort zudem oft auf weitere Google-Hosts (nicht geprüft) |
| data.4tu.nl | FBX-Umwandlung | gesperrt | nicht freigeben (CC BY-NC 4.0) |
| huggingface.co | FBX-Umwandlung gbionics/cmu-fbx | gesperrt | nicht freigeben (Lizenz ungeklärt) |

Für alles bisher Geplante brauche ich keine neue Adresse unter „Network access“: Die CMU-Aufnahmen liegen als BVH auf GitHub, MakeHuman auf `raw.githubusercontent.com`.

## 7. Mixamo: Liste zum Herunterladen

Nur falls du die Familien Rumpf und Kondition freigibst; für die drei Pilot-Übungen brauche ich nichts (in der Namensliste von Mixamo fanden sich weder Bankdrücken noch Latziehen, die Kniebeuge kommt aus dem Rig). Mixamo braucht ein Adobe-Konto; ich lege keines an. Gib mir die Dateien hier im Chat (einzeln oder als ZIP). Sie kommen nach `tools/uebungen-3d/quelle/mixamo/`, nicht ins Repository; in die App kommen nur die gerenderten Videos (Lizenz in `licenses-data.md` Abschnitt 7).

**Einstellungen im Download-Fenster, für jede Datei gleich:**

| Feld | Wert |
|---|---|
| Figur | „Y Bot“ (Standard-Skelett „mixamorig“ mit Fingern); die Figur selbst brauche ich nicht |
| Format | FBX Binary (.fbx) |
| Skin | Without Skin (nur Skelett und Bewegung, kleinere Datei) |
| Frames per Second | 30 |
| Keyframe Reduction | none |
| In Place | anhaken, wo die Option erscheint und die Tabelle „ja“ sagt; sonst aus |
| Regler der Animation | Standardwerte lassen (Overdrive, Character Arm-Space, Trim) |
| Dateiname | wie von Mixamo vorgeschlagen |

| Prio. | Animation (Suchbegriff bei Mixamo) | für | Vorlage für | In Place | Wozu |
|---|---|---|---|---|---|
| 1 | Push Up | Liegestütze | – | nein | Gewichtsverlagerung und Rumpfspannung über die ganze Wiederholung; Hände und Füße setzt das Rig fest auf den Boden |
| 1 | Situps | Sit-ups | Crunches | nein | Abrollen der Wirbelsäule ist im Code schwer natürlich zu bauen |
| 1 | Bicycle Crunch | Bicycle Crunches | – | nein | Wechsel von Rumpfdrehung und Beinen im richtigen Takt |
| 1 | Plank | Unterarmstütz (Plank) | Seitstütz, Bergsteiger (Mountain Climbers) | nein | leichtes Atmen und Nachspannen statt starrer Pose |
| 1 | Burpee | Burpees | – | ja | Ganzkörperablauf mit Sprung, im Code kaum glaubwürdig |
| 1 | Jumping Jacks | Hampelmann | – | ja | Abgleich mit der CMU-Aufnahme 86_05; die bessere wird genommen |
| 1 | Jumping Rope | Seilspringen | – | ja | Sprungrhythmus aus dem Fußgelenk; das Seil baut der Code |
| 1 | Kettlebell Swing | Kettlebell Swing | – | nein | Hüftstreckung mit Schwung; Griff und Kugel setzt das Rig |
| 2 | Bicep Curl | Bizepscurls mit Kurzhanteln | Hammercurls, Bizepscurls mit Langhantel | nein | nur als Vorlage für Takt und Mitbewegung des Rumpfs; die Familie „Arme beugen“ geht auch ohne |
| 2 | Front Raises | Frontheben mit Kurzhanteln | Frontheben am Kabel | nein | wie Bicep Curl: Vorlage, nicht zwingend |
| 2 | Back Squat | – | Kniebeuge mit Langhantel, Kniebeuge an der Multipresse | nein | Gegenprobe zur neuen Kniebeuge (Takt, Rumpfneigung); die Kniebeuge selbst bleibt aus dem Rig |
| 2 | Air Squat | – | Frontkniebeuge mit Langhantel, Thruster mit Kurzhanteln, Wandsitzen | nein | Vorlage für Kniebeugen ohne Stange auf dem Rücken |
| 2 | Air Squat Bent Arms | – | Goblet Squat | nein | Vorlage für die Goblet-Kniebeuge (Armhaltung vor der Brust) |

Priorität 1: Hier bringt eine echte Aufnahme mehr als ein Ablauf aus dem Code (Sprünge, Abrollen, Rhythmus). Priorität 2: nur Vorlage oder Gegenprobe; ohne sie geht es auch. Jede Datei prüfe ich vor dem Einbau (Sichtprüfung, ob sie die Übung wirklich zeigt), Hände, Füße und Gerät korrigiert das Rig.

## 8. Priorität nach Programmen und Vorlagen

Gezählt in `src/modules/training/data/programs.v1.json` (3 Programme) und `src/modules/training/data/sample-templates.v1.json` (4 Vorlagen). **Einheiten** = wie oft die Übung im Verlauf eines Programms drankommt (je Woche die Tage des Plans, über alle Wochen; das rotierende Push/Pull/Beine-Programm steht mit drei Wochen im Plan). **Vorlagen** = Tage in den Vorlagen, an denen sie vorkommt. Übertragen wird zuerst, was in Programmen vorkommt; Übungen nur aus Vorlagen und alle übrigen behalten vorerst Symbol und Muskelkarte. Die Kniebeuge-Familie kommt zuerst (Pilot, Rig und Kamera stehen), danach die Familien nach ihren Einheiten in Programmen.

### 8.1 Familien in Reihenfolge

| Rang | Familie | Einheiten in Programmen | Übungen in Programmen | nur in Vorlagen | übrige (Symbol und Muskelkarte) | Aufwand für die Programm-Übungen (Std.) |
|---|---|---|---|---|---|---|
| 1 | Kniebeuge | 40 | 4 | 0 | 5 | 18.0 |
| 2 | Rumpf | 68 | 11 | 1 | 4 | 25.1 |
| 3 | Waagrechtes Drücken | 66 | 7 | 1 | 5 | 22.8 |
| 4 | Arme beugen und strecken | 57 | 14 | 0 | 4 | 20.1 |
| 5 | Beine isoliert | 54 | 6 | 1 | 5 | 20.2 |
| 6 | Schulter und Brust isoliert | 48 | 7 | 0 | 3 | 17.0 |
| 7 | Hüftbeuge | 44 | 4 | 3 | 6 | 14.0 |
| 8 | Waagrechtes Ziehen | 40 | 5 | 2 | 1 | 18.8 |
| 9 | Kondition | 39 | 1 | 0 | 8 | 15.5 |
| 10 | Senkrechtes Ziehen | 35 | 5 | 1 | 1 | 17.5 |
| 11 | Senkrechtes Drücken | 26 | 3 | 1 | 1 | 12.2 |
| 12 | Ausfallschritt und einbeinig | 9 | 1 | 1 | 2 | 8.8 |

Aufwand je Familie = Basis der Familie + Übungen in Programmen + neue Geräte, die diese Übungen brauchen (jedes Gerät einmal, in der ersten Familie, die es braucht) + 1 Std. Prüfseite; Werte aus Abschnitt 2 bis 4.

### 8.2 Übungen in Programmen und Vorlagen

| Familie | Übung | Einheiten in Programmen | Programme | Tage in Vorlagen | Vorlagen |
|---|---|---|---|---|---|
| Kniebeuge | Beinpresse | 23 | Ganzkörper A/B, 4 Tage, Push/Pull/Beine, rotierend, Winterprogramm 2026 | 3 | Ganzkörper A/B, Oberkörper/Unterkörper, Push/Pull/Beine |
| Kniebeuge | Kniebeuge mit Langhantel | 8 | Push/Pull/Beine, rotierend, Winterprogramm 2026 | 3 | Ganzkörper A/B, Oberkörper/Unterkörper, Push/Pull/Beine |
| Kniebeuge | Beinpresse, einbeinig | 5 | Winterprogramm 2026 | 0 | – |
| Kniebeuge | Goblet Squat | 4 | Winterprogramm 2026 | 1 | Zuhause mit Kurzhanteln |
| Rumpf | Unterarmstütz (Plank) | 22 | Ganzkörper A/B, 4 Tage, Winterprogramm 2026 | 3 | Ganzkörper A/B, Oberkörper/Unterkörper, Zuhause mit Kurzhanteln |
| Rumpf | Crunches | 20 | Ganzkörper A/B, 4 Tage, Winterprogramm 2026 | 0 | – |
| Rumpf | Beinheben liegend | 5 | Winterprogramm 2026 | 0 | – |
| Rumpf | Beinheben hängend | 4 | Push/Pull/Beine, rotierend | 1 | Push/Pull/Beine |
| Rumpf | Russian Twist | 4 | Winterprogramm 2026 | 0 | – |
| Rumpf | Heel Taps | 3 | Winterprogramm 2026 | 0 | – |
| Rumpf | Sit-ups | 3 | Winterprogramm 2026 | 0 | – |
| Rumpf | Knieheben stehend | 3 | Winterprogramm 2026 | 0 | – |
| Rumpf | Bicycle Crunches | 2 | Winterprogramm 2026 | 0 | – |
| Rumpf | Dead Bug | 1 | Winterprogramm 2026 | 0 | – |
| Rumpf | Windshield Wipers | 1 | Winterprogramm 2026 | 0 | – |
| Rumpf | Seitstütz | 0 | – | 2 | Ganzkörper A/B, Zuhause mit Kurzhanteln |
| Waagrechtes Drücken | Schrägbankdrücken mit Kurzhanteln | 23 | Ganzkörper A/B, 4 Tage, Push/Pull/Beine, rotierend, Winterprogramm 2026 | 2 | Oberkörper/Unterkörper, Push/Pull/Beine |
| Waagrechtes Drücken | Bankdrücken mit Kurzhanteln | 22 | Ganzkörper A/B, 4 Tage, Winterprogramm 2026 | 1 | Zuhause mit Kurzhanteln |
| Waagrechtes Drücken | Schrägbankdrücken am Kabel | 7 | Winterprogramm 2026 | 0 | – |
| Waagrechtes Drücken | Bankdrücken mit Langhantel | 4 | Push/Pull/Beine, rotierend | 3 | Ganzkörper A/B, Oberkörper/Unterkörper, Push/Pull/Beine |
| Waagrechtes Drücken | Liegestütze | 4 | Winterprogramm 2026 | 1 | Zuhause mit Kurzhanteln |
| Waagrechtes Drücken | Dips | 4 | Push/Pull/Beine, rotierend | 1 | Push/Pull/Beine |
| Waagrechtes Drücken | Enges Bankdrücken | 2 | Winterprogramm 2026 | 0 | – |
| Waagrechtes Drücken | Bodendrücken mit Kurzhanteln | 0 | – | 1 | Zuhause mit Kurzhanteln |
| Arme beugen und strecken | Trizepsdrücken am Kabel | 8 | Push/Pull/Beine, rotierend, Winterprogramm 2026 | 2 | Oberkörper/Unterkörper, Push/Pull/Beine |
| Arme beugen und strecken | Bizepscurls am Kabel | 6 | Winterprogramm 2026 | 0 | – |
| Arme beugen und strecken | Trizepsdrücken am Kabel, über Kreuz | 6 | Winterprogramm 2026 | 0 | – |
| Arme beugen und strecken | Hammercurls am Kabel mit Seil | 5 | Winterprogramm 2026 | 0 | – |
| Arme beugen und strecken | Hammercurls | 4 | Push/Pull/Beine, rotierend | 2 | Oberkörper/Unterkörper, Push/Pull/Beine |
| Arme beugen und strecken | Bizepscurls mit Langhantel | 4 | Push/Pull/Beine, rotierend | 1 | Push/Pull/Beine |
| Arme beugen und strecken | Scottcurls mit Kurzhanteln | 4 | Winterprogramm 2026 | 0 | – |
| Arme beugen und strecken | Trizepsstrecken über Kopf am Kabel | 4 | Winterprogramm 2026 | 0 | – |
| Arme beugen und strecken | French Press mit SZ-Stange | 4 | Winterprogramm 2026 | 0 | – |
| Arme beugen und strecken | Bizepscurls mit Kurzhanteln | 3 | Winterprogramm 2026 | 2 | Oberkörper/Unterkörper, Zuhause mit Kurzhanteln |
| Arme beugen und strecken | Schrägbank-Curls mit Kurzhanteln | 3 | Winterprogramm 2026 | 0 | – |
| Arme beugen und strecken | Reverse Curls mit SZ-Stange | 3 | Winterprogramm 2026 | 0 | – |
| Arme beugen und strecken | French Press mit Kurzhanteln | 2 | Winterprogramm 2026 | 0 | – |
| Arme beugen und strecken | Trizepsstrecken über Kopf mit Kurzhantel | 1 | Winterprogramm 2026 | 0 | – |
| Beine isoliert | Beinbeuger liegend | 23 | Ganzkörper A/B, 4 Tage, Winterprogramm 2026 | 2 | Ganzkörper A/B, Oberkörper/Unterkörper |
| Beine isoliert | Wadenheben sitzend | 11 | Push/Pull/Beine, rotierend, Winterprogramm 2026 | 1 | Push/Pull/Beine |
| Beine isoliert | Beinstrecker | 7 | Winterprogramm 2026 | 1 | Oberkörper/Unterkörper |
| Beine isoliert | Wadenheben mit Kurzhanteln | 7 | Winterprogramm 2026 | 0 | – |
| Beine isoliert | Beinbeuger sitzend | 4 | Push/Pull/Beine, rotierend | 1 | Push/Pull/Beine |
| Beine isoliert | Wadenheben an der Beinpresse | 2 | Winterprogramm 2026 | 0 | – |
| Beine isoliert | Wadenheben stehend | 0 | – | 1 | Oberkörper/Unterkörper |
| Schulter und Brust isoliert | Seitheben mit Kurzhanteln | 24 | Ganzkörper A/B, 4 Tage, Push/Pull/Beine, rotierend, Winterprogramm 2026 | 2 | Oberkörper/Unterkörper, Push/Pull/Beine |
| Schulter und Brust isoliert | Fliegende am Kabel | 5 | Winterprogramm 2026 | 0 | – |
| Schulter und Brust isoliert | Butterfly an der Maschine | 5 | Winterprogramm 2026 | 0 | – |
| Schulter und Brust isoliert | Seitheben am Kabel | 5 | Winterprogramm 2026 | 0 | – |
| Schulter und Brust isoliert | Reverse Flys mit Kurzhanteln | 4 | Winterprogramm 2026 | 1 | Zuhause mit Kurzhanteln |
| Schulter und Brust isoliert | Frontheben mit Kurzhanteln | 3 | Winterprogramm 2026 | 0 | – |
| Schulter und Brust isoliert | Frontheben am Kabel | 2 | Winterprogramm 2026 | 0 | – |
| Hüftbeuge | Rumänisches Kreuzheben mit Kurzhanteln | 21 | Ganzkörper A/B, 4 Tage, Winterprogramm 2026 | 1 | Zuhause mit Kurzhanteln |
| Hüftbeuge | Rumänisches Kreuzheben mit Langhantel | 9 | Push/Pull/Beine, rotierend, Winterprogramm 2026 | 3 | Ganzkörper A/B, Oberkörper/Unterkörper, Push/Pull/Beine |
| Hüftbeuge | Hip Thrust mit Kurzhantel | 9 | Winterprogramm 2026 | 0 | – |
| Hüftbeuge | Pull-Throughs am Kabel | 5 | Winterprogramm 2026 | 0 | – |
| Hüftbeuge | Kreuzheben mit Langhantel | 0 | – | 1 | Oberkörper/Unterkörper |
| Hüftbeuge | Hip Thrust mit Langhantel | 0 | – | 1 | Oberkörper/Unterkörper |
| Hüftbeuge | Hüftheben am Boden (Glute Bridge) | 0 | – | 1 | Zuhause mit Kurzhanteln |
| Waagrechtes Ziehen | Rudern am Kabel, sitzend | 24 | Ganzkörper A/B, 4 Tage, Push/Pull/Beine, rotierend, Winterprogramm 2026 | 3 | Ganzkörper A/B, Oberkörper/Unterkörper, Push/Pull/Beine |
| Waagrechtes Ziehen | Rudern an der Multipresse, vorgebeugt | 5 | Winterprogramm 2026 | 0 | – |
| Waagrechtes Ziehen | Rudern mit Langhantel, vorgebeugt | 4 | Push/Pull/Beine, rotierend | 2 | Oberkörper/Unterkörper, Push/Pull/Beine |
| Waagrechtes Ziehen | Face Pulls am Kabel | 4 | Push/Pull/Beine, rotierend | 2 | Oberkörper/Unterkörper, Push/Pull/Beine |
| Waagrechtes Ziehen | T-Bar-Rudern | 3 | Winterprogramm 2026 | 0 | – |
| Waagrechtes Ziehen | Rudern mit Kurzhanteln, vorgebeugt | 0 | – | 1 | Zuhause mit Kurzhanteln |
| Waagrechtes Ziehen | Einarmiges Rudern mit Kurzhantel | 0 | – | 1 | Zuhause mit Kurzhanteln |
| Kondition | Laufband | 39 | Winterprogramm 2026 | 0 | – |
| Senkrechtes Ziehen | Latziehen | 17 | Ganzkörper A/B, 4 Tage, Winterprogramm 2026 | 2 | Ganzkörper A/B, Oberkörper/Unterkörper |
| Senkrechtes Ziehen | Klimmzüge mit Unterstützung | 5 | Push/Pull/Beine, rotierend, Winterprogramm 2026 | 0 | – |
| Senkrechtes Ziehen | Einarmiges Latziehen am Kabel, kniend | 5 | Winterprogramm 2026 | 0 | – |
| Senkrechtes Ziehen | Latziehen, enger Griff | 4 | Winterprogramm 2026 | 0 | – |
| Senkrechtes Ziehen | Überzüge am Kabel | 4 | Winterprogramm 2026 | 0 | – |
| Senkrechtes Ziehen | Klimmzüge | 0 | – | 2 | Oberkörper/Unterkörper, Push/Pull/Beine |
| Senkrechtes Drücken | Schulterdrücken an der Maschine | 20 | Ganzkörper A/B, 4 Tage, Winterprogramm 2026 | 0 | – |
| Senkrechtes Drücken | Schulterdrücken mit Langhantel, stehend | 4 | Push/Pull/Beine, rotierend | 1 | Push/Pull/Beine |
| Senkrechtes Drücken | Schulterdrücken mit Kurzhanteln, stehend | 2 | Winterprogramm 2026 | 0 | – |
| Senkrechtes Drücken | Schulterdrücken mit Kurzhanteln, sitzend | 0 | – | 3 | Ganzkörper A/B, Oberkörper/Unterkörper, Zuhause mit Kurzhanteln |
| Ausfallschritt und einbeinig | Ausfallschritte mit Kurzhanteln | 9 | Winterprogramm 2026 | 1 | Zuhause mit Kurzhanteln |
| Ausfallschritt und einbeinig | Bulgarische Kniebeuge mit Kurzhanteln | 0 | – | 2 | Oberkörper/Unterkörper, Zuhause mit Kurzhanteln |

### 8.3 Aufwand der ersten drei Familien

- **Kniebeuge: rund 18 Std.** Basis 8, Übungen 4 (Kniebeuge mit Langhantel (1), Goblet Squat (1), Beinpresse (1.25), Beinpresse, einbeinig (0.75)), neue Geräte 5 (Kurzhanteln (1), Beinpresse 45° (4)), Prüfseite 1.
- **Rumpf: rund 25 Std.** Basis 12, Übungen 10.75 (Unterarmstütz (Plank) (0.75), Crunches (0.5), Beinheben hängend (1.5), Beinheben liegend (0.75), Russian Twist (1.25), Dead Bug (1), Bicycle Crunches (1), Heel Taps (1), Sit-ups (1), Windshield Wipers (1.25), Knieheben stehend (0.75)), neue Geräte 1.3 (Matte (0.3), Klimmzugstange (1)), Prüfseite 1. Bewegung aus Mixamo: Bicycle Crunches, Sit-ups; dafür einmalig die Übertragung aufs Skelett (Abschnitt 4) und bei Mixamo die Dateien von dir, sonst aus der Familie im Code.
- **Waagrechtes Drücken: rund 23 Std.** Basis 8, Übungen 7.25 (Bankdrücken mit Langhantel (0.5), Bankdrücken mit Kurzhanteln (1), Schrägbankdrücken mit Kurzhanteln (0.75), Liegestütze (1.5), Schrägbankdrücken am Kabel (1.5), Enges Bankdrücken (0.5), Dips (1.5)), neue Geräte 6.5 (Schrägbank, verstellbar (auch fast senkrecht) (2), Kabelzug: zwei Säulen mit höhenverstellbaren Rollen (1.75), D-Griff (1.75), Dipbarren (1)), Prüfseite 1. Bewegung aus Mixamo: Liegestütze; dafür einmalig die Übertragung aufs Skelett (Abschnitt 4) und bei Mixamo die Dateien von dir, sonst aus der Familie im Code.

Die Zahlen sind meine Schätzung der Arbeitszeit, ohne Rechenzeit; die Rechenzeit hängt von der gewählten Variante der Figur ab (Renderzeiten in `form-uebungen-report.md` Abschnitt 11).
