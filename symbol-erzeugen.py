# Programmsymbol (Eule) neu erzeugen: ABC-Abenteuer\eule.ico, Starter\eule.ico und store\Bilder\*.png
#
# Grundlage ist die Eule aus web\emoji\1f989.svg (Noto Emoji, wie im Programm) in einem hellen,
# abgerundeten Rahmen mit orangem Rand. Gezeichnet wird mit Microsoft Edge (ohne Fenster),
# verkleinert und gespeichert mit Pillow (pip install pillow).
#
# Aufruf:  python symbol-erzeugen.py
import os, subprocess, tempfile
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
EDGE = next(p for p in [r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
                        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"] if os.path.exists(p))
OWL = open(os.path.join(HERE, "web", "emoji", "1f989.svg"), encoding="utf-8").read()
N = 1024


def render():
    tmp = tempfile.mkdtemp(prefix="abc-symbol-")
    page = os.path.join(tmp, "s.html")
    open(page, "w", encoding="utf-8").write(f"""<!doctype html><html><body style="margin:0;background:transparent">
<div style="position:absolute;left:24px;top:24px;width:{N - 48}px;height:{N - 48}px;box-sizing:border-box;
  border-radius:200px;background:#fdf6e3;border:44px solid #e8891a;display:flex;align-items:center;justify-content:center">
  <div style="width:760px;height:760px">{OWL.replace('<svg', '<svg width="760" height="760"', 1)}</div>
</div></body></html>""")
    out = os.path.join(tmp, "s.png")
    subprocess.run([EDGE, "--headless=new", "--disable-gpu", "--no-first-run", "--user-data-dir=" + os.path.join(tmp, "p"),
                    "--hide-scrollbars", "--default-background-color=00000000", f"--window-size={N},{N}",
                    "--screenshot=" + out, "file:///" + page.replace("\\", "/")], capture_output=True, timeout=120)
    return Image.open(out).convert("RGBA").crop((0, 0, N, N))


def main():
    big = render()
    ico = big.resize((256, 256), Image.LANCZOS)
    for p in ("ABC-Abenteuer", "Starter"):
        ico.save(os.path.join(HERE, p, "eule.ico"), sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    st = os.path.join(HERE, "store", "Bilder")
    for name, size in [("Square44x44Logo.png", 44), ("Square150x150Logo.png", 150), ("Square310x310Logo.png", 310),
                       ("StoreLogo.png", 50), ("Store-Symbol-300.png", 300)]:
        big.resize((size, size), Image.LANCZOS).save(os.path.join(st, name))
    wide = Image.new("RGBA", (310, 150), (0, 0, 0, 0))
    wide.paste(big.resize((130, 130), Image.LANCZOS), (90, 10))
    wide.save(os.path.join(st, "Wide310x150Logo.png"))
    big.resize((256, 256), Image.LANCZOS).save(os.path.join(HERE, "anleitung-bilder", "eule.png"))
    print("Symbole erzeugt.")


if __name__ == "__main__":
    main()
