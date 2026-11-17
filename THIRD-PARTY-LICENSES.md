# Fremdkomponenten und Lizenzen

Das ABC-Abenteuer nutzt die folgenden Bestandteile anderer Hersteller. Die vollständigen
Lizenztexte liegen im Ordner [`lizenzen/`](lizenzen/). Im fertigen Programm liegt dieser
Ordner neben der `ABC-Abenteuer.exe`.

| Bestandteil | Version | Mitgeliefert im fertigen Programm | Lizenz |
|---|---|---|---|
| Microsoft Edge WebView2 SDK | 1.0.2792.45 | ja: `Microsoft.Web.WebView2.Core.dll`, `Microsoft.Web.WebView2.WinForms.dll`, `WebView2Loader.dll` | BSD-artige Microsoft-Lizenz, siehe unten |
| Tobii Core SDK (Tobii.Interaction) | 0.7.3 | ja: `Tobii.Interaction.Net.dll`, `Tobii.Interaction.Model.dll`, `Tobii.EyeX.Client.dll` | proprietär, kostenlos, siehe unten |
| Schrift „Andika“ (SIL) | Google Fonts v27 | ja: `files/fonts/andika-400.woff2`, `andika-700.woff2` | SIL Open Font License 1.1 |
| Symbole „Noto Emoji“ (Google) | GitHub `googlefonts/noto-emoji`, Stand 26.10.2026 | ja: `files/emoji/*.svg` | Apache License 2.0, siehe unten |
| Silben-Tondateien | – | ja: `files/silben/*.wav` (203 Dateien) | siehe Abschnitt „Silben-Tondateien“ |
| Microsoft Edge WebView2 Runtime | – | nein, ist in Windows 10/11 enthalten | Microsoft-Software-Lizenz |
| .NET Framework 4.8, System.Speech | – | nein, ist Teil von Windows | Microsoft-Software-Lizenz |
| Windows-Stimmen (SAPI/OneCore), Bildschirmtastatur (`osk.exe`), Emoji-Schrift „Segoe UI Emoji“ (nur noch für selbst eingetragene Emojis ohne Noto-Bild) | – | nein, nur auf dem Rechner vorhandene Windows-Bestandteile werden benutzt | Microsoft-Software-Lizenz |
| Tobii Experience / Tobii-Treiber | – | nein, muss vom Gerätehersteller installiert sein | Tobii |
| Microsoft.NETFramework.ReferenceAssemblies | 1.0.3 | nein, nur zum Bauen | MIT |

---

## Microsoft Edge WebView2 SDK

Quelle: NuGet-Paket `Microsoft.Web.WebView2` 1.0.2792.45. Die Weitergabe der drei
DLL-Dateien ist erlaubt, wenn der folgende Hinweis mitgeliefert wird. Die zusätzlichen
Hinweise des Pakets (verwendete Open-Source-Teile) stehen in
[`lizenzen/WebView2-NOTICE.txt`](lizenzen/WebView2-NOTICE.txt).

```
Copyright (C) Microsoft Corporation. All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are
met:

   * Redistributions of source code must retain the above copyright
notice, this list of conditions and the following disclaimer.
   * Redistributions in binary form must reproduce the above
copyright notice, this list of conditions and the following disclaimer
in the documentation and/or other materials provided with the
distribution.
   * The name of Microsoft Corporation, or the names of its contributors
may not be used to endorse or promote products derived from this
software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

---

## Tobii Core SDK (Tobii.Interaction 0.7.3)

Copyright © Tobii AB (publ). Alle Rechte vorbehalten. Die Tobii-Dateien sind **keine
Open-Source-Software**. Es gilt der *License Agreement for Tobii Core SDK and Tobii Gaming
SDK* (Dokumentversion 1.2), beigefügt als
[`lizenzen/Tobii-Core-SDK-License-Agreement.pdf`](lizenzen/Tobii-Core-SDK-License-Agreement.pdf).

Die für dieses Projekt wichtigen Punkte, zusammengefasst (maßgeblich ist nur der Originaltext):

- **Weitergabe erlaubt** (Ziffern 3.1 und 3.3): Die Tobii-DLL-Dateien dürfen kostenlos als
  Teil eines eigenen Programms weitergegeben werden, und zwar unverändert und nur als
  Maschinencode zusammen mit diesem Programm.
- **Nur zur Blicksteuerung** („Gaze Interaction Use“, Ziffern 1.4, 3.1, 3.6): Das
  ABC-Abenteuer nutzt den Blick nur zum Auswählen. Blickdaten werden weder gespeichert
  noch an andere Geräte oder ins Internet gesendet. Gespeichert werden nur Lernfortschritte
  (z. B. gelöste Aufgaben, Sticker), keine Blickpositionen.
- **Keine Veränderung** der DLL-Dateien und keine eigene Programmierschnittstelle auf
  Grundlage der Tobii-Funktionen (Ziffer 3.2). Hinweise auf Urheberrechte und Marken dürfen
  nicht entfernt werden (Ziffer 5).
- **Kein Medizinprodukt** (Ziffer 3.7): Die Tobii-Bestandteile dürfen nicht in
  medizinisch klassifizierten oder lebenswichtigen Anwendungen verwendet werden. Das
  ABC-Abenteuer ist ein Lern- und Spielprogramm und kein Medizinprodukt.
- **Ohne Gewähr** (Ziffern 11 und 12). Tobii kann die Bedingungen ändern oder den Vertrag
  mit 6 Monaten Frist kündigen. Bereits veröffentlichte Programmversionen dürfen danach
  weiter verteilt und benutzt werden (Ziffer 9.5).

Im **Quellcode-Archiv (GitHub)** liegen die Tobii-Dateien **nicht**. Beim Bauen lädt
NuGet sie automatisch aus dem offiziellen Paket `Tobii.Interaction` 0.7.3. Wer das Programm
selbst baut und weitergibt, wird damit selbst Lizenznehmer bei Tobii.

---

## Schrift „Andika“

Copyright (c) 2004-2022 SIL International (http://www.sil.org/),
with Reserved Font Names "Andika" and "SIL".

Lizenz: SIL Open Font License, Version 1.1. Der vollständige Lizenztext liegt neben den
Schriftdateien ([`web/fonts/OFL.txt`](web/fonts/OFL.txt)) und in
[`lizenzen/Andika-OFL.txt`](lizenzen/Andika-OFL.txt). Die Schriftdateien
`andika-400.woff2` und `andika-700.woff2` stammen unverändert von Google Fonts (Andika v27,
lateinischer Zeichensatz).

---

## Symbole „Noto Emoji“ (`web/emoji/*.svg`)

Copyright 2013 Google, Inc. All Rights Reserved.

Lizenz: Apache License, Version 2.0. Der vollständige Lizenztext liegt in
[`lizenzen/Noto-Emoji-Apache-2.0.txt`](lizenzen/Noto-Emoji-Apache-2.0.txt), der Hinweis
zusätzlich neben den Bildern ([`web/emoji/LICENSE.txt`](web/emoji/LICENSE.txt)).
Quelle: https://github.com/googlefonts/noto-emoji, Ordner `2D/svg`. Die Bilder sind
inhaltlich unverändert, nur die Dateinamen sind gekürzt (`emoji_u1f989.svg` → `1f989.svg`).
Mit `python symbole-holen.py` werden fehlende Bilder für neu verwendete Emojis geholt.
Ausnahme: Der Lautsprecher (`1f50a.svg`, `1f507.svg`) ist eine eigene Zeichnung des
ABC-Abenteuers (MIT-Lizenz) und ersetzt das Noto-Bild, weil er für Kinder leichter zu erkennen ist.

Im Programm stehen die Emojis weiterhin als Zeichen im Code; beim Anzeigen werden sie
durch diese Bilder ersetzt. So sieht das Programm auf jedem Rechner gleich aus und hängt
nicht von der Emoji-Schrift von Windows ab.

---

## Silben-Tondateien (`web/silben/*.wav`)

Die 203 kurzen Silben-Tondateien sind **keine Aufnahmen einer Person**. Sie wurden mit
der Windows-Sprachausgabe erzeugt: Stimme „Microsoft Katja“ aus dem deutschen
Windows-Sprachpaket, genaue Aussprache über Lautschrift (IPA). Die Lautschrift steht in
`web/silben/lautschrift.txt`. Mit `python silben-erzeugen.py` lassen sich alle Dateien
jederzeit auf einem Windows-Rechner mit deutscher Stimme neu erzeugen.

**Hinweis zur Rechtslage:** Die Windows-Lizenzbedingungen regeln nicht ausdrücklich, ob
mit einer Windows-Stimme erzeugte Tonaufnahmen weitergegeben werden dürfen. Das ist noch
nicht abschließend geklärt. Deshalb liegen die Tondateien **nicht im Quellcode-Archiv**.
Beim Bauen erzeugt `erstellen.ps1` sie automatisch mit der Windows-Stimme des eigenen
Rechners. Nur das fertige Download-ZIP enthält sie, damit das Programm ohne Zusatzschritt
läuft. Sie fallen nicht unter die MIT-Lizenz dieses Projekts. Bei Bedarf können sie durch
eigene Aufnahmen ersetzt werden (gleiche Dateinamen, WAV mono).

---

## Microsoft.NETFramework.ReferenceAssemblies

Wird nur beim Bauen gebraucht und nicht mit dem Programm verteilt. Lizenz: MIT,
https://github.com/Microsoft/dotnet/blob/master/LICENSE
