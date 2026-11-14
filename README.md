# 🦉 ABC-Abenteuer

Ein spielerisches Lese- und Schreiblernprogramm für Kinder, die mit den **Augen steuern**
(z. B. mit einer Tobii-Augensteuerung). Es lässt sich genauso mit Maus oder Touch bedienen.
Das Kind schaut auf eine Kachel, ein Kreis füllt sich, und die Kachel ist ausgewählt.
Eine Eule liest alle Aufgaben vor.

*Idee und Umsetzung: Natascha Toman, selbst UK-Nutzerin · umgesetzt mithilfe von KI*

---

## Was das Programm kann

- **11 Spiele** in drei Schwierigkeitsstufen: Buchstaben entdecken, Womit fängt es an?,
  Hör genau!, Wörter lesen, Sätze lesen, Wörter schreiben, Silben klatschen, Silben-Puzzle,
  Memory, Ballon-Jagd und Farben malen. Dazu ein **Sticker-Album** als Belohnung.
- **Für die Augensteuerung gemacht:** große Kacheln, einstellbare Verweilzeit, „Magnet“ für
  ungenaues Zielen, Lupe für die kleinen Knöpfe, Pause-Knopf für das Kind. Solange die Eule
  vorliest, wird nichts ausgewählt.
- **Klicks von TD Control werden gesperrt.** Betreuungspersonen können trotzdem jederzeit
  mit der Maus klicken.
- **Mitteil-Tafel** 💬 mit eigenen Einträgen, damit das Kind sich jederzeit mitteilen kann.
- **Profile** für bis zu 12 Kinder, eigene Wörter, Sichern und Wiederherstellen.
- **Kein Internet, keine Installation, keine Datenweitergabe.** Alle Daten bleiben auf dem Rechner.

## Voraussetzungen

| | |
|---|---|
| Betriebssystem | Windows 10 oder 11, **64 Bit** |
| Laufzeit | .NET Framework 4.8 und Microsoft Edge WebView2 Runtime (bei aktuellem Windows 10/11 schon vorhanden) |
| Augensteuerung (optional) | Tobii-Augensteuerung, die mit dem Tobii Core SDK arbeitet, mit installierter Tobii-Software (z. B. Tobii Experience). Entwickelt und getestet mit einer **Tobii I-16**. |
| Stimme | eine deutsche Windows-Stimme (Windows-Einstellungen → Zeit und Sprache → Sprache → Deutsch → Sprachpaket mit Sprachausgabe) |

## Installation

Keine Installation nötig, das Programm läuft direkt aus seinem Ordner.

1. Rechts unter **Releases** die Datei `ABC-Abenteuer.zip` herunterladen.
2. Vor dem Entpacken: Rechtsklick auf die ZIP-Datei → **Eigenschaften** → Haken bei
   **„Zulassen“** → **OK**. Sonst zeigt Windows beim ersten Start die Warnung „Der Computer
   wurde durch Windows geschützt“, weil das Programm nicht digital signiert ist. (Kommt sie
   trotzdem: „Weitere Informationen“ → „Trotzdem ausführen“.)
3. Die ZIP-Datei entpacken (Rechtsklick → „Alle extrahieren …“), z. B. in `Dokumente`.
4. Im entpackten Ordner **`ABC-Abenteuer.exe`** (Eulen-Symbol) doppelklicken.

Den Ordner immer vollständig kopieren, also `ABC-Abenteuer.exe` zusammen mit dem Ordner
`files`.

## Benutzung

- Auf **„Los geht's!“** schauen oder klicken, im Menü ein Spiel auswählen.
- **⚙ Einstellungen**: Verweilzeiten, Stimme, Profile, Mitteil-Tafel, Sichern.
- **Beenden**: im Menü zweimal die Tür 🚪 auswählen oder <kbd>Alt</kbd>+<kbd>F4</kbd>.

Die ausführliche Anleitung mit Bildern liegt als **`Anleitung.html`** im Programmordner. Sie
lässt sich auch im Programm unter Einstellungen öffnen.

**Gespeicherte Daten** (Profile, Lernstand) liegen in `%LOCALAPPDATA%\ABC-Abenteuer\WebView2`,
das Fehlerprotokoll in `%LOCALAPPDATA%\ABC-Abenteuer\protokoll.txt`.

## Selbst bauen (für Entwicklerinnen und Entwickler)

Benötigt: Windows 10/11, [.NET SDK](https://dotnet.microsoft.com/download) (6 oder neuer),
Python 3 und PowerShell.

```powershell
git clone <Adresse dieses Repositorys>
cd <Ordner des Repositorys>
powershell -ExecutionPolicy Bypass -File erstellen.ps1
```

`erstellen.ps1` baut beide Programme, holt die Pakete (WebView2, Tobii.Interaction) über
NuGet und erzeugt daneben den Ordner `ABC-Lernprogramm` sowie `ABC-Abenteuer.zip`.
Die Silben-Tondateien sind nicht im Repository. Beim ersten Bauen erzeugt das Skript sie
mit der Windows-Stimme „Microsoft Katja“, die dafür installiert sein muss (deutsches
Sprachpaket mit Sprachausgabe).

| Ordner/Datei | Inhalt |
|---|---|
| `web/` | Oberfläche: `index.html`, `app.js`, `style.css`, `data.js` (Wörter und Sätze), Schrift, Silben-Töne |
| `ABC-Abenteuer/` | Hauptprogramm (C#, .NET Framework 4.8, WebView2, Tobii Core SDK) |
| `Starter/` | kleines Start-Programm mit dem Eulen-Symbol |
| `Anleitung-Vorlage.html`, `anleitung-bilder/` | Anleitung, wird zu `Anleitung.html` mit eingebetteten Bildern |
| `erstellen-store.ps1`, `store/` | vorbereitet für eine spätere Veröffentlichung im Microsoft Store (MSIX-Paket, Kachelbilder, Screenshots, Einreich-Anleitung) |
| `silben-erzeugen.py` | erzeugt die Silben-Tondateien aus `web/silben/lautschrift.txt` neu |
| `lizenzen/` | Lizenztexte der Fremdkomponenten |

Zum Testen ohne Augensteuerung kennt das Hauptprogramm die Schalter `--selftest`,
`--fakegaze`, `--quittest` und `--evaljs` (siehe `ABC-Abenteuer/Program.cs`).

## Lizenz

Eigener Quellcode: **MIT-Lizenz**, © 2026 Natascha Toman, siehe [`LICENSE`](LICENSE).

Datenschutz: [`DATENSCHUTZ.md`](DATENSCHUTZ.md). Das Programm sammelt keine Daten.

Fremdkomponenten (WebView2, Tobii Core SDK, Schrift Andika, Silben-Tondateien) haben eigene
Lizenzen, siehe [`THIRD-PARTY-LICENSES.md`](THIRD-PARTY-LICENSES.md). Die Tobii-Bibliotheken
sind keine Open-Source-Software. Sie liegen nicht in diesem Repository, sondern werden beim
Bauen von NuGet geladen.

„Tobii“ ist eine Marke der Tobii AB. Dieses Projekt ist privat und steht in keiner Verbindung
zu Tobii oder Microsoft.
