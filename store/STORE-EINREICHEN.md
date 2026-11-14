# ABC-Abenteuer im Microsoft Store veröffentlichen

Einmalig ca. 1–2 Stunden Arbeit, danach prüft Microsoft einige Tage. Alles ist kostenlos.

## 1. Kostenloses Entwicklerkonto anlegen

1. https://storedeveloper.microsoft.com öffnen und mit dem eigenen Microsoft-Konto anmelden.
2. Kontotyp **„Einzelperson“ (Individual)** wählen. Die Registrierung ist für Einzelpersonen kostenlos.
3. Den **Herausgebernamen** eingeben, z. B. `Natascha Toman`. Er erscheint im Store als Herausgeber.
4. Die Identitätsprüfung abschließen (Ausweis und Selfie). Das kann einige Tage dauern.

## 2. App-Namen reservieren

Im Partner Center: **Apps und Spiele → Neues Produkt → MSIX- oder PWA-App** → Name `ABC-Abenteuer`
(falls vergeben: z. B. `ABC-Abenteuer Augensteuerung`).

## 3. Identität ins Paket übernehmen

Im Partner Center: **Produktverwaltung → Produktidentität**. Dort stehen drei Werte:

| Partner Center | in `store\store-identitaet.txt` eintragen als |
|---|---|
| Package/Identity/Name | `IDENTITY_NAME = …` |
| Package/Identity/Publisher | `PUBLISHER = CN=…` |
| Package/Properties/PublisherDisplayName | `PUBLISHER_DISPLAY_NAME = …` |

Danach im Ordner `ABC-Quellcode`:

```
powershell -ExecutionPolicy Bypass -File erstellen.ps1
powershell -ExecutionPolicy Bypass -File erstellen-store.ps1
```

Das ergibt `ABC-Abenteuer-2.3.0.0.msix` (ohne „-TEST“) neben dem Quellcode-Ordner.

## 4. Einreichung ausfüllen

**Preise und Verfügbarkeit:** Kostenlos, alle Märkte (oder nur deutschsprachige Länder).

**Eigenschaften:**
- Kategorie: **Bildung**
- Datenschutzrichtlinien-URL: Link zu `DATENSCHUTZ.md` im GitHub-Repository
  (auf GitHub die Datei öffnen und die Adresse aus der Adresszeile kopieren)
- Website / Support: Link zum GitHub-Repository bzw. zu dessen „Issues“-Seite
- Barrierefreiheit: Haken bei „Dieses Produkt wurde getestet, um die Richtlinien für
  Barrierefreiheit zu erfüllen“ nur setzen, wenn das zutrifft

**Altersfreigabe:** Fragebogen ausfüllen. Antworten: keine Gewalt, keine Käufe, keine
Kommunikation mit anderen Nutzern, keine Datenweitergabe, kein Internet. Ergebnis: ab 0 bzw. USK 0.

**Pakete:** die `.msix`-Datei hochladen.

**Store-Einträge (Deutsch):**

*Beschreibung:*

> Das ABC-Abenteuer ist ein spielerisches Lese- und Schreiblernprogramm für Kinder, die mit
> den Augen steuern – entwickelt für Tobii-Augensteuerungen, genauso mit Maus oder Touch
> bedienbar. Eine Eule liest alle Aufgaben vor.
>
> 11 Spiele in drei Stufen: Buchstaben entdecken, Womit fängt es an?, Hör genau!, Wörter lesen,
> Sätze lesen, Wörter schreiben, Silben klatschen, Silben-Puzzle, Memory, Ballon-Jagd und
> Farben malen – dazu ein Sticker-Album als Belohnung.
>
> Für die Augensteuerung gemacht: große Kacheln, einstellbare Verweilzeit, Hilfe bei ungenauem
> Zielen, Lupe für kleine Knöpfe und ein Pause-Knopf für das Kind. Klicks von TD Control werden
> gesperrt, Betreuungspersonen können trotzdem jederzeit mit der Maus klicken. Mit Mitteil-Tafel,
> Profilen für bis zu 12 Kinder und eigenen Wörtern.
>
> Kein Internet, keine Werbung, keine Datensammlung.
>
> Idee und Umsetzung: Natascha Toman, selbst UK-Nutzerin – umgesetzt mithilfe von KI.

*Funktionen (je eine Zeile):* Steuerung mit den Augen (Tobii), Maus oder Touch · 11 Lernspiele
in drei Stufen · Alle Aufgaben werden vorgelesen · Mitteil-Tafel · Profile für bis zu 12 Kinder ·
Kein Internet, keine Werbung

*Suchbegriffe:* Augensteuerung, Lesen lernen, Unterstützte Kommunikation, Tobii, Förderschule,
Buchstaben, Silben

*Screenshots:* die sechs fertigen Bilder in `store\Screenshots\` (1920×1080) hochladen.

*Store-Logo:* `store\Bilder\Store-Symbol-300.png`

**Hinweise für die Zertifizierung** (Feld „Notes for certification“, auf Englisch):

> Desktop (WinForms/.NET Framework 4.8) learning app for children who use eye tracking.
> runFullTrust is required because the app uses the Tobii Core SDK to receive gaze data,
> System.Speech for text-to-speech, starts the Windows on-screen keyboard (osk.exe) for text
> entry, and installs a low-level mouse hook that only ignores *injected* (software-generated)
> clicks from the separate eye-tracking software "TD Control" that land on the app's own
> window while it is active, so that the child is not double-selecting. Clicks on other
> windows and all physical mouse clicks are never touched. No network access, no data
> collection. The app also works without an eye tracker (mouse/touch).

## 5. Abschicken

**An den Store senden.** Microsoft prüft meist in 1–3 Werktagen. Danach ist das
ABC-Abenteuer im Microsoft Store zu finden und installiert sich ohne Sicherheitswarnung.

## Neue Version veröffentlichen

1. Versionsnummer erhöhen (siehe `LIES MICH.txt`).
2. `erstellen.ps1` und `erstellen-store.ps1` ausführen.
3. Im Partner Center: **Update** → neues `.msix` hochladen → senden.

Installierte Geräte aktualisieren sich dann automatisch.
