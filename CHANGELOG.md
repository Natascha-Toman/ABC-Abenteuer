# Änderungsprotokoll – ABC-Abenteuer

Alle wichtigen Änderungen, die neueste Version steht oben.

## 4.7 – 21.11.2026

**Verbessert**
- Symbol „Anfang und Ende“ mittig und größer.
- Anfang und Ende: die Frage nach dem Endbuchstaben gibt es jetzt in allen drei Stufen.
- Bei der Lösung wird der Buchstabenname nie extra genannt (nur der Laut).
- Einstellung „Erst zuhören, dann antworten“ mit verständlicher Erklärung.

## 4.6 – 21.11.2026

**Verbessert**
- Verwechselbare Buchstaben (g/k/c/z, b/p, d/t, m/n, y, f/v) mit Erklärung: „Das ist der Buchstabe g.
  Manchmal wird dieser Buchstabe aber auch so ausgesprochen: Ge.“ – einzeln angeschaut nur Laut und Name.
- Selbstlaute (a, e, i, o, u) und „Buchstaben entdecken“: der Name wird nie wiederholt.
- Eigenes Symbol für „Anfang und Ende“.
- Beenden: „Möchtest du aufhören? Dann schau noch einmal auf die Tür.“
- Silben klatschen: neue Einstellung „Wort in Silben vorsagen und vorklatschen“ (abschaltbar, alle Stufen).

## 4.5 – 21.11.2026

**Verbessert**
- Neue Bilder im Noto-Stil: Jause (Jausenbox mit Brot, Apfel und Trinkflasche), Iglu, Fluss,
  Brot und Creme (Tube).
- Wo ist der Buchstabe, Stufe 3, kindgerechter: „Hör gut zu! Der Buchstabe macht so: … Und er heißt: …“
- Leicht verwechselbare Buchstaben (g/k/c/z, b/p, d/t, m/n, i/y, f/v, e/ä) spricht Emil als Laut
  und mit Namen („i – Ypsilon“).
- Spiel „Womit fängt es an?“ heißt jetzt „Anfang und Ende“; Stufe 3 fragt „Welcher Buchstabe
  fehlt am Ende?“ statt „Hör genau auf das Ende!“.
- Mitteil-Tafel: „Alles löschen? Dann wähl den Mülleimer noch einmal.“ und Emils Nachfrage
  („Was möchtest du sagen?“ / „Möchtest du noch etwas sagen?“) mit Emils Stimme; die Eule
  wiederholt nicht mehr den Satz des Kindes.
- Einstellungen: „Stimme des Kindes (Mitteil-Tafel)“ mit „▶ Stimme testen“ und Erklärung;
  „Felder vorlesen, sobald der Blick oder die Maus darauf ruht“; kürzere Verweilen-Option mit
  größeren Kästchen; Pfeiltasten blättern sofort nach dem Öffnen.
- Vorlesen beim Anschauen (Knöpfe, Spielnamen, Stufen) mit Emils Stimme statt Windows-Stimme.
- Sticker-Ansage „Du hast schon … Sticker gesammelt!“ als Tondatei bis 100.
- Beim Start holt sich das Programm in den Vordergrund – auch wenn es aus einem anderen
  Programm gestartet wird –, damit die Augensteuerung sofort aktiv ist.

## 4.4 – 21.11.2026

**Verbessert**
- Neue Bilder im Noto-Stil: Engel, Cowboy und Junge als ganze Figuren, Nudeln (Farfalle in
  einer Schüssel), Comic-Heft; Zahn weißer mit Umriss, Socke nur noch eine.
- Wo ist der Buchstabe, Stufe 3: „Hör genau hin: So klingt der Buchstabe … Und so heißt der
  Buchstabe …“ – erst der Laut, dann der Name.
- Mitteil-Tafel spricht immer mit der Windows-Stimme (keine ElevenLabs-Tondateien mehr dafür).

## 4.3 – 21.11.2026

**Verbessert**
- Alle Sätze und Spielanweisungen als fertige Tondateien (ElevenLabs).
- Silben und einige Wörter/Laute nach Gehör ausgewählt (`silben-auswahl.py`: mehrere Fassungen
  erzeugen, die beste übernehmen). Laute C, V, Y jetzt als Laut (k, f, i), D und O gedehnt.
- Begrüßung immer gleich („Hallo! Ich bin Emil, die Eule. …“), ohne Namen des Kindes.
- Buchstaben entdecken: dezente Anzeige „2 / 5“, welches Bild von wie vielen.
- Sterne in den Spielen wie auf der Startseite: in einer hellen Pille, etwas größer.

## 4.2 – 19.11.2026

**Verbessert**
- Silben: Die Stimme spricht erst das ganze Wort und dann langsam die Silben („Hase. Ha – se.“);
  die Silben werden an den Pausen herausgeschnitten (`web/audio/silben/*.wav`). So klingen sie
  deutsch und natürlich – die Lautschrift für Silben ist wieder entfernt.
- Stimme: Laute und Silben werden mit Lautschrift (IPA, `<phoneme>`) erzeugt, damit die Stimme
  richtig deutsch spricht: „l“ statt „el“, „e“ statt „ei“, „ks“ statt „Kirchenstraße“, „se“ mit
  Murmel-e statt „see“, „ma“ statt „Maria“, „Rose“ deutsch statt englisch usw.
  Mitlaute klingen kurz gedehnt (l, m, n, f, s, r) oder mit ganz kurzem Murmel-e (b, d, g, k, p, t).
- Neue Bilder: Fluss (passend zu den anderen Zeichnungen), Nudeln (Penne auf einem Teller),
  Computer (Bildschirm statt Laptop).
- Sterne auf den Menü-Kacheln stehen optisch mittig im weißen Feld.

## 4.1 – 19.11.2026

**Neu**
- Neue Wörter mit Bild: Aufgabe, Aufzug, Brief, Chor, Comic, Creme, Dach, Dose, Flasche, Fluss,
  Gabel, Glas, Glocke, Irrgarten, Jause, Lampe, Leiter, Ofen, Video, Wald (eigene Bilder u. a. für
  Chor, Comic, Creme, Dach, Irrgarten, Ofen, Gabel, Video, Flasche, Lampe, Wald und ein leeres Glas).

**Verbessert**
- Stimme: Buchstaben (Laut und Name) werden einzeln und kurz gesprochen, nicht mehr langgezogen.
  Silben werden genau so gesprochen, wie sie geschrieben sind (kein zusätzliches „h“).
- Buchstaben-Kacheln: jeder Buchstabe steht optisch genau in der Mitte (auch a, m, g, p, y).
- Menü: Sterne auf den Kacheln etwas höher und besser sichtbar (auf hellem Feld).
- Spiele: Stufen-Sterne und Fortschritts-Sterne oben haben dieselbe Form und Größe.
- Neben dem Zahnrad steht klein „Einstellungen“.
- Vase und Video zählen nicht mehr als Wörter, die mit dem Laut „f“ anfangen.

**Entfernt**
- Wörter Cap, Clown, Cupcake, Diamant, Donut, Giraffe, Ingwer, Jojo, Ochse, Vier und ihre
  Tondateien. `stimmen-erzeugen.py --los` löscht nicht mehr gebrauchte Tondateien selbst;
  mit `--bis-gruppe 0` werden nur Buchstaben, Wörter und Silben erzeugt.

## 4.0 – 19.11.2026

**Neu**
- **Neue Stimme:** Buchstaben, alle Wörter, Silben, die Sätze aus „Sätze lesen“, Spielanweisungen
  und Lob sind fertige Tondateien mit einer natürlichen Stimme (ElevenLabs, „Eleven v4“).
  Für alles andere (z. B. selbst geschriebene Texte) spricht weiter die Windows-Stimme.
- **Buchstaben als Laut:** Zum Lesenlernen spricht die Eule „l“, „m“, „k“ statt „el“, „em“, „ka“.
  Einstellung „Buchstaben sprechen als“: Laut oder Buchstabenname.
- **Buchstaben entdecken:** mindestens 5 Wörter mit Bild für jeden Buchstaben (Q, X, Y weniger),
  z. B. Computer, Cowboy, Donut, Esel, Gorilla, Iglu, Jojo, Nilpferd, Otter, Unterhose, U-Boot,
  Vollmond. Neue eigene Bilder: Iglu, U-Boot, U-Bahn, Vier, Joghurt, Nudeln, Jacke.
- **Eindeutige Bilder:** Spaghetti 🍝 und Nudeln, Mantel 🧥 und Jacke, Blüte 🌸 und Blume 🌷,
  Zylinder 🎩 und Hut 👒 haben jetzt je ein eigenes, unverwechselbares Bild.
- Mitteil-Tafel, große Textanzeige: Beim Vorlesen wird das gerade gesprochene Wort markiert.
- Mitteil-Tafel: neue Einstellungen „jedes Wort“ und „nur fertiger Satz“ (liest nur den Satz
  vor, wenn er mit Punkt oder Fragezeichen fertig ist).
- Neues Eulen-Symbol überall (Programm, Startsymbol, Anleitung, Store-Bilder).
- `erstellen.ps1 -OhneZip`: baut das Programm zum Testen, ohne ZIP-Datei.

**Verbessert**
- Menü: einheitliche Symbole in hellen Kreisen, immer an derselben Stelle; eigene Symbole für
  „Buchstaben entdecken“ (ABC) und „Memory“ (zwei Karten). Sterne auf den Kacheln dezenter.
- Einstellungen: nur noch ein kleines graues Zahnrad ⚙ unten rechts.
- Pause: Der Hinweis steht jetzt klein und dezent in der Anzeige unten links („⏸ Pause – weiter mit ▶️“).
- Tastatur: Buchstaben stehen optisch mittig und werden nicht mehr abgeschnitten; lange
  Wortvorschläge werden kleiner geschrieben, damit sie ins Feld passen. Lupe mittig in der Zeile.
- Mitteil-Tafel: „Mieder anziehen/ausziehen“ und „Schaukeln“ sind nicht mehr voreingestellt
  (auch aus bestehenden Tafeln entfernt; eigene Felder bleiben möglich).

**Entfernt**
- Die alten Silben-Tondateien (Windows-Stimme „Katja“) und `silben-erzeugen.py`.

## 3.6 – 17.11.2026

**Neu**
- Mitteil-Tafel, Tastatur: Lupe 🔍 rechts im Textfeld. Sie zeigt den ganzen geschriebenen Text groß
  in einem eigenen Fenster (die Schrift passt sich der Textlänge an), mit „Vorlesen“ und „Zurück“.

**Verbessert**
- Umschalten zwischen Bildern und Tastatur: eigene, klare Symbole mit Beschriftung
  („Tastatur“: Tasten mit A B C, „Bilder“: vier bunte Bildkarten).

## 3.5 – 17.11.2026

**Verbessert**
- Das neue, klare Lautsprecher-Symbol steht jetzt überall im Programm (z. B. „Vorlesen“,
  „Wort hören“ beim Sticker, Meldungen), nicht nur beim Knopf Ton an/aus.
- Alle Sterne ⭐ im Programm haben einen leichten Schlagschatten (auch auf den Spiele-Kacheln,
  bei der Stufenwahl und bei der Belohnung).
- Mitteil-Tafel: Die Wortvorschläge sind größer.
- Mitteil-Tafel: Nomen werden nach dem Schreiben automatisch großgeschrieben („hunger“ → „Hunger“),
  wenn das Wort im Wortschatz steht.

## 3.4 – 17.11.2026

**Verbessert**
- Mitteil-Tafel, Tastatur: „Alles löschen“ 🗑️ sitzt jetzt oben links neben dem Zurück-Knopf und
  muss zweimal ausgewählt werden (wie die Tür). Wer einfach weiter hinschaut, bestätigt nach
  der Verweilzeit – wegschauen ist nicht nötig.
- Ton an/aus hat ein eigenes, klares Symbol: Lautsprecher mit grünen Schallwellen bzw. mit rotem Kreuz.
- Die Knöpfe oben haben je nach Aufgabe eine eigene, sanfte Farbe (Haus/Zurück orange, Eule gelb,
  Ton grün, Mitteil-Tafel blau, Tür und Löschen rot).
- Die Fortschritts-Sterne haben einen leichten Schlagschatten.
- Sticker-Album: Nach dem Anschauen eines Stickers sagt die Eule beim Zurückgehen nicht mehr
  jedes Mal „Toll, du hast schon … Sticker gesammelt“.

## 3.3 – 17.11.2026

**Verbessert**
- Mitteil-Tafel, Tastatur: Die Buchstabentasten sind größer. Dafür sind Eingabezeile,
  Wortvorschläge und die untere Reihe (Leertaste, Löschen, Alles weg, Vorlesen) etwas flacher.

## 3.2 – 17.11.2026

**Verbessert**
- Erreichte Sterne oben im Spiel sind dezent hellgrün hinterlegt.
- Mitteil-Tafel, Tastatur: Der Umschalter ABC / QWERTZ sitzt jetzt oben rechts neben den Knöpfen.
- Auf jeder Taste steht nur noch ein Buchstabe. Bei „Groß und klein“ wechselt die Tastatur von
  selbst: am Satzanfang groß, sonst klein.

**Behoben**
- Der Beistrich (Komma) auf der Tastatur war unten abgeschnitten.

## 3.1 – 17.11.2026

**Neu**
- Mitteil-Tafel, Tastatur: **Wortvorschläge** über den Buchstaben. Sie passen zum angefangenen
  Wort und schlagen nach einem fertigen Wort logische Folgewörter vor („ich“ → „möchte“,
  „habe“, „bin“ …). Die Tafel **lernt mit**: Jeder vorgelesene Text wird pro Profil gemerkt, oft
  benutzte Wörter und Wortfolgen rücken nach vorne. „Gelernte Wörter vergessen“ in den Einstellungen.
- Tastatur mit den Satzzeichen **, . ?** (Satzanfänge werden automatisch groß geschrieben).
- Einstellung „Beim Schreiben vorlesen“: Buchstaben und Wörter, nur Buchstaben, nur Wörter
  oder nur den fertigen Text.

**Verbessert**
- Die Mitteil-Tafel merkt sich, ob zuletzt die Bilder oder die Tastatur offen waren.
- Größere Schrift auf allen Tasten der Tastatur.
- Die Fortschritts-Sterne oben im Spiel haben einen hellen runden Hintergrund und sind gut zu erkennen.

## 3.0 – 17.11.2026

**Neu**
- Mitteil-Tafel mit **Tastatur**: Über den Knopf ⌨️ oben rechts kann das Kind selbst schreiben,
  was es sagen möchte. Jeder Buchstabe wird vorgelesen, „🔊 Vorlesen“ spricht den ganzen Text.
  Dazu Leertaste, Löschen und „Alles weg“. Die Buchstaben stehen wahlweise in ABC-Reihenfolge
  oder wie auf der Computer-Tastatur (QWERTZ), umschaltbar auf der Tastatur selbst oder in den
  Einstellungen. Selbstlaute sind farbig, Ä, Ö, Ü und ß sind dabei.
- **Freie Symbole statt Windows-Emojis**: Alle Bilder (auch Emil, die Eule) kommen jetzt aus
  „Noto Emoji“ von Google (Apache-2.0-Lizenz) und liegen im Programm. Das Programm sieht damit
  auf jedem Rechner gleich aus. Selbst eingetragene Emojis ohne Noto-Bild erscheinen wie bisher.

**Verbessert**
- Sticker-Album: Der Knopf „zurück zum Album“ ist vom grünen Haken ✅ unten rechts nach
  **oben links** gewandert, wo sonst das Haus steht. Solange ein Sticker groß gezeigt wird,
  wird das Haus zum Pfeil ⬅️ und führt zurück zu den Stickern, nicht ins Menü.
  Die Eule 🦉 oben rechts liest den Sticker noch einmal vor.
- Memory: Eine aus Versehen aufgedeckte erste Karte lässt sich durch nochmaliges Auswählen
  wieder umdrehen.

## 2.5 – 15.11.2026

**Verbessert**
- Sticker-Album: Die Sticker sind wieder größer, die Emojis werden nicht mehr abgeschnitten.
  Die Blätter-Knöpfe ▲ ▼ erscheinen wieder, wenn nicht alle Sticker auf eine Seite passen.
- Beim „Wörter schreiben“ wird jetzt auch der letzte Buchstabe vorgelesen, danach kommt das Lob.
- Die Download-Datei trägt die Versionsnummer im Namen (z. B. `ABC-Abenteuer-2.5.zip`).

**Behoben**
- Einzelne Buchstaben klingen jetzt richtig (z. B. wurde „E“ wie „I“ gesprochen). Alle
  Buchstabennamen A–Z, Ä, Ö, Ü haben eigene Tondateien mit exakter Lautschrift.
- „Krake“, „Blüte“ und „Funkelstern“ werden in der Sticker-Ansicht richtig ausgesprochen.

## 2.4 – 15.11.2026

**Neu**
- Einstellungen → Buchstaben: Schnellauswahl mit Knöpfen „Alle auswählen“, „Alle abwählen“,
  „Nur Selbstlaute“, „+ Selbstlaute dazunehmen“ und „Start-Buchstaben“. Selbstlaute sind
  farbig markiert, darunter steht, welche Buchstaben gerade geübt werden.
- Sticker-Album zum Anschauen und Anhören: Ein Sticker erscheint groß mit Wort und Artikel,
  orange markiertem Anfangsbuchstaben und farbigen Silben. Die Eule liest alles vor, die
  Knöpfe 🔊, Anfangsbuchstabe und 👏 wiederholen einzelne Teile.
- Jeder der 36 Sticker hat ein Wort. 12 neue Wörter mit eigenen Silben-Tondateien.

**Verbessert**
- Das Warnfenster beim Abwählen von Buchstaben ist ersetzt durch einen Hinweis im Fenster.

## 2.3 – 14.11.2026

**Neu**
- Einstellung „Auswählen durch Verweilen mit dem Mauszeiger“ (auch Taste F9) für Kinder
  mit Kopfmaus oder einer anderen Augensteuerung.
- Veröffentlichung auf GitHub: README, MIT-Lizenz, Lizenzen der Fremdkomponenten
  (`THIRD-PARTY-LICENSES.md`, Ordner `lizenzen`), Datenschutzerklärung.
- `silben-erzeugen.py`: erzeugt alle Silben-Tondateien aus der Lautschrift neu.
- Vorbereitung für den Microsoft Store (`erstellen-store.ps1`, Ordner `store`).

**Verbessert**
- Die Verbindung zur Tobii-Augensteuerung wird ohne Begrenzung alle 15 Sekunden neu versucht,
  solange das Programm läuft.
- Lädt die Oberfläche nicht, erscheint eine verständliche Fehlermeldung.
- Anleitung: Installation über GitHub, Tipp „Zulassen“ gegen die Windows-Warnung,
  Bedienung ohne Augensteuerung.

**Behoben**
- Auf einem PC ohne Tobii-Software blieb das Programm beim Start hängen. Jetzt läuft es
  mit Maus und Touch weiter.

**Sicherheit**
- Strengere Prüfung, welche Adressen das Programm öffnen darf (genaue Adresse statt nur
  Textanfang).

## 2.2 – 14.11.2026

**Verbessert**
- Sticker-Album zeigt alle Sticker, mit großen Knöpfen ▲ ▼ zum Blättern.
- Einstellungsfenster breiter, nichts ragt mehr seitlich heraus.
- Bildschirmtastatur: Das Fenster rückt nach oben, die Tastatur sitzt direkt darunter und
  verdeckt nichts. Die Zeile mit dem Eingabe-Strich bleibt sichtbar.
- Farben mischen: deutlichere Sätze („Blau und Gelb zusammen ergibt Grün“).

**Behoben**
- Silben klatschen: Text wurde abgeschnitten.
- „Orange“ wird als Farbe ausgesprochen, nicht wie das Obst.

## 2.1 – 14.11.2026

**Sicherheit und Zuverlässigkeit**
- Das Programm öffnet nur seine eigene Oberfläche und nimmt nur Nachrichten von ihr an;
  alle Nachrichten werden auf gültige Werte geprüft. Sicherheitsrichtlinie für die Oberfläche.
- Die Bildschirmtastatur wird nur geschlossen, wenn das Programm sie selbst geöffnet hat.
- Fehlerprotokoll unter `%LOCALAPPDATA%\ABC-Abenteuer\protokoll.txt`.
- Sprachausgabe und Blickdaten-Übertragung robuster bei Fehlern.
- Gespeicherte Einstellungen, Profile und Lernstände werden beim Laden geprüft;
  Speicherfehler werden angezeigt.

**Neu**
- Sichern und Wiederherstellen aller Profile, Lernstände und Einstellungen in eine Datei.
- Alle Kinderprofile und Daten vollständig löschen.

**Verbessert**
- Quellcode (`ABC-Quellcode`) und fertiges Programm (`ABC-Lernprogramm`) sind getrennt;
  `erstellen.ps1` baut alles.
- Startparameter werden richtig an das Programm weitergegeben.

## 2.0 – 14.11.2026

Erste Version mit Versionsnummer (in den Einstellungen unter „Über“, in der Anleitung und
klein auf dem Startbildschirm). Ausgangsstand:

- Eigenes Windows-Programm mit direkter Anbindung der Tobii-Augensteuerung, auch mit Maus
  und Touch bedienbar.
- 11 Spiele in drei Stufen: Buchstaben entdecken, Womit fängt es an?, Hör genau!,
  Wörter lesen, Sätze lesen, Wörter schreiben, Silben klatschen, Silben-Puzzle, Memory,
  Ballon-Jagd, Farben malen – dazu das Sticker-Album.
- Bedienung mit den Augen: Verweilzeit, „Magnet“ bei ungenauem Zielen, Lupe für die Knöpfe
  oben, Pause-Knopf, „Erst zuhören“, Klicks von TD Control gesperrt.
- Mitteil-Tafel, Profile für bis zu 12 Kinder, eigene Wörter, Lernstand.
- Silben als Tondateien mit exakter Lautschrift.
