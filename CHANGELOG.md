# Änderungsprotokoll – ABC-Abenteuer

Alle wichtigen Änderungen, die neueste Version steht oben.

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
