# Symbole (Noto Emoji, Apache-2.0-Lizenz) nach web\emoji\ holen
#
# Sucht in web\index.html, web\app.js und web\data.js alle Emojis, lädt für jedes noch
# fehlende Emoji das passende Bild von Google Noto Emoji (2D/svg) und schreibt die Liste
# web\emoji\emoji.js. Im Programm werden Emojis dann als diese Bilder gezeigt – Emojis
# ohne Bild erscheinen wie bisher mit der Emoji-Schrift von Windows.
#
# Aufruf:  python symbole-holen.py [weitere Emojis ...]
#   z. B.  python symbole-holen.py 🍕 🎮     (zusätzliche Bilder, etwa für die Mitteil-Tafel)
# Braucht nur beim Hinzufügen neuer Symbole Internet; die Bilder liegen im Quellcode.
import os, re, sys, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.join(HERE, "web")
OUT = os.path.join(WEB, "emoji")
URL = "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/2D/svg/emoji_u{}.svg"

# Emoji = Bildzeichen, optional mit Varianten-Wahl (FE0F), Hautfarbe oder ZWJ-Verbindung
PIC = r"[←-⇿⌀-⏿①-➿⤀-⥿⬀-⯿〰〽㊗㊙\U0001F000-\U0001FAFF]"
EMOJI = re.compile(PIC + r"(?:️|[\U0001F3FB-\U0001F3FF])?(?:‍" + PIC + r"️?)*")


def key(e):
    """Dateiname wie im Programm: Codepunkte hexadezimal, mit _ verbunden, ohne FE0F."""
    return "_".join("%x" % ord(c) for c in e if c != "️")


def main():
    text = "".join(open(os.path.join(WEB, f), encoding="utf-8").read() for f in ("index.html", "app.js", "data.js"))
    found = {key(m.group(0)) for m in EMOJI.finditer(text + " ".join(sys.argv[1:]))}
    os.makedirs(OUT, exist_ok=True)
    have, missing = set(), []
    for k in sorted(found):
        path = os.path.join(OUT, k + ".svg")
        if not os.path.exists(path):
            try:
                data = urllib.request.urlopen(URL.format(k), timeout=30).read()
            except Exception:
                missing.append(k)            # kein Noto-Bild (z. B. reine Textzeichen wie ▲ →)
                continue
            open(path, "wb").write(data)
        have.add(k)
    # auch früher geholte Bilder behalten (z. B. für eigene Felder der Mitteil-Tafel)
    have |= {f[:-4] for f in os.listdir(OUT) if f.endswith(".svg")}
    with open(os.path.join(OUT, "emoji.js"), "w", encoding="utf-8", newline="\n") as f:
        f.write("// Erzeugt von symbole-holen.py – Emojis, für die ein Bild in diesem Ordner liegt\n")
        f.write('window.EMOJI_FILES = "%s".split(" ");\n' % " ".join(sorted(have)))
    print("%d Symbole vorhanden, ohne Bild (bleiben Text): %s" % (len(have), " ".join(missing) or "keine"))


if __name__ == "__main__":
    main()
