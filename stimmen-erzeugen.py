# Tondateien mit ElevenLabs erzeugen (web\audio\ und web\audio\audio.js)
#
# Ablauf:
#   1. Alle zu sprechenden Texte sammeln (stimmen\sammeln.html, über Edge ohne Fenster):
#      Buchstaben-Laute und -Namen, Wörter, Silben, Sätze und Spielanweisungen.
#   2. Eigene Anpassungen aus stimmen\texte-anpassen.txt übernehmen (falsche Aussprache korrigieren).
#   3. Fehlende oder geänderte Tondateien bei ElevenLabs erzeugen (schon vorhandene werden nicht
#      neu bezahlt). Wichtige Texte zuerst – reicht das Guthaben nicht, später einfach erneut starten.
#   4. web\audio\audio.js (Verzeichnis für das Programm) und stimmen\anhoeren.html (zum Prüfen) schreiben.
#
# Aufruf:
#   python stimmen-erzeugen.py                nur sammeln, Liste und Anhör-Seite schreiben, Kosten anzeigen
#   python stimmen-erzeugen.py --los          Tondateien erzeugen (braucht elevenlabs-key.txt)
#   python stimmen-erzeugen.py --los --max-zeichen 20000    höchstens so viele Zeichen verbrauchen
#   python stimmen-erzeugen.py --los --neu laut/b silben/affe-2   diese Dateien neu erzeugen
#   Modell: "Eleven v4" (eleven_v4), anderes mit --modell <id>
#
# Der API-Schlüssel steht in elevenlabs-key.txt (eine Zeile) neben diesem Skript – diese Datei
# ist in .gitignore eingetragen und wird nie veröffentlicht.
import argparse, concurrent.futures, hashlib, threading, json, os, re, subprocess, sys, tempfile, time, urllib.error, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.join(HERE, "web")
AUDIO = os.path.join(WEB, "audio")
ST = os.path.join(HERE, "stimmen")
KEYFILE = os.path.join(HERE, "elevenlabs-key.txt")
DONE = os.path.join(ST, "erzeugt.json")          # welche Datei mit welchem Text erzeugt wurde
VOICE = "mmOXzpKbn8xfIqiOB9FO"
FORMAT = "mp3_44100_64"
API = "https://api.elevenlabs.io"
EDGE = [r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe", r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"]


def satz_key(t):
    return re.sub(r"[^a-zäöüß0-9]+", " ", t.lower()).strip()


def sammeln():
    edge = next((p for p in EDGE if os.path.exists(p)), None)
    if not edge:
        sys.exit("Microsoft Edge nicht gefunden – wird zum Sammeln der Texte gebraucht.")
    url = "file:///" + os.path.join(ST, "sammeln.html").replace("\\", "/")
    prof = tempfile.mkdtemp(prefix="abc-sammeln-")
    r = subprocess.run([edge, "--headless=new", "--disable-gpu", "--no-first-run", "--user-data-dir=" + prof,
                        "--virtual-time-budget=5000", "--dump-dom", url], capture_output=True, timeout=120)
    html = r.stdout.decode("utf-8", "replace")
    m = re.search(r"SAMMLUNG:(\{.*\})</pre>", html, re.S)
    if not m:
        sys.exit("Texte konnten nicht gesammelt werden (Fehler in web\\data.js oder stimmen\\sammeln.js?)")
    import html as h
    return json.loads(h.unescape(m.group(1)))


def auftraege(s):
    """Liste aller Tondateien: (id, Text, Gruppe). id = Pfad unter web\\audio ohne .mp3"""
    jobs = []
    for k, t in s["laut"].items(): jobs.append(("laut/" + k, t, 0))
    for k, t in s["name"].items(): jobs.append(("name/" + k, t, 0))
    for k, t in s["wort"].items(): jobs.append(("wort/" + k, t, 0))
    for k, syl in s["silben"].items():
        for i, t in enumerate(syl): jobs.append((f"silben/{k}-{i + 1}", t, 0))
    for x in s["satz"]:
        h = hashlib.sha1(satz_key(x["text"]).encode("utf-8")).hexdigest()[:10]
        jobs.append(("satz/" + h, x["text"], x["gruppe"]))
    # eigene Anpassungen: "id = Text" (id wie in stimmen\anhoeren.html angezeigt)
    over = {}
    f = os.path.join(ST, "texte-anpassen.txt")
    if os.path.exists(f):
        for line in open(f, encoding="utf-8"):
            if "=" in line and not line.lstrip().startswith("#"):
                a, b = line.split("=", 1)
                over[a.strip()] = b.strip()
    jobs = [(i, over.get(i, t), g) for i, t, g in jobs]
    jobs.sort(key=lambda j: j[2])
    return jobs


def api(path, key, data=None, raw=False):
    req = urllib.request.Request(API + path, data=json.dumps(data).encode() if data else None,
                                 headers={"xi-api-key": key, "Content-Type": "application/json"})
    for versuch in range(6):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                b = r.read()
                return b if raw else json.loads(b)
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", "replace")
            if e.code in (429, 500, 502, 503) and versuch < 5:
                time.sleep(3 * (versuch + 1)); continue
            raise RuntimeError(f"ElevenLabs {e.code}: {body[:400]}")
        except urllib.error.URLError:
            if versuch < 5: time.sleep(3); continue
            raise


def modell_waehlen(key, wunsch):
    try:
        models = api("/v1/models", key)
    except RuntimeError:                               # Schlüssel darf nur Sprache erzeugen (sicherer) -> Standard
        return wunsch or "eleven_v4"
    ids = [m["model_id"] for m in models]
    if wunsch:
        if wunsch not in ids: sys.exit(f"Modell {wunsch} nicht gefunden. Verfügbar: {', '.join(ids)}")
        return wunsch
    for m in models:                                   # "Eleven v4"
        if "v4" in m["model_id"].lower() or "v4" in m.get("name", "").lower():
            return m["model_id"]
    sys.exit("Kein Modell „Eleven v4“ gefunden. Mit --modell angeben. Verfügbar: " + ", ".join(ids))


def manifest():
    """web\\audio\\audio.js: welche Tondateien vorhanden sind (nur die, die es wirklich gibt)"""
    done = json.load(open(DONE, encoding="utf-8")) if os.path.exists(DONE) else {}
    have = lambda i: os.path.exists(os.path.join(AUDIO, i + ".mp3"))
    m = {"laut": [], "name": [], "wort": [], "silben": {}, "satz": {}}
    for i, info in sorted(done.items()):
        if not have(i): continue
        kind, name = i.split("/", 1)
        if kind in ("laut", "name", "wort"): m[kind].append(name)
        elif kind == "silben":
            w, n = name.rsplit("-", 1)
            m["silben"][w] = max(m["silben"].get(w, 0), int(n))
        elif kind == "satz": m["satz"][satz_key(info["text_orig"])] = name
    # Silben nur, wenn alle Silben eines Wortes vorhanden sind
    m["silben"] = {w: n for w, n in m["silben"].items() if all(have(f"silben/{w}-{k}") for k in range(1, n + 1))}
    os.makedirs(AUDIO, exist_ok=True)
    with open(os.path.join(AUDIO, "audio.js"), "w", encoding="utf-8", newline="\n") as f:
        f.write("// Erzeugt von stimmen-erzeugen.py – vorhandene Tondateien (Stimme: ElevenLabs)\n")
        f.write("window.AUDIO = " + json.dumps(m, ensure_ascii=False, separators=(",", ":")) + ";\n")
    return sum(len(v) for v in m.values())


def anhoerseite(jobs, orig):
    rows, last = [], None
    namen = {"laut": "Buchstaben als Laut", "name": "Buchstabennamen", "wort": "Wörter", "silben": "Silben", "satz": "Sätze und Anweisungen"}
    for i, t, g in jobs:
        kind = i.split("/")[0]
        if kind != last: rows.append(f"<h2>{namen[kind]}</h2>"); last = kind
        shown = orig.get(i, t)
        rows.append(f'<div class="r"><audio controls preload="none" src="../web/audio/{i}.mp3"></audio>'
                    f'<code>{i}</code><span>{shown}</span>{"" if shown == t else f" <i>(gesprochen als: {t})</i>"}</div>')
    page = ("<!doctype html><meta charset='utf-8'><title>ABC-Abenteuer – Tondateien anhören</title>"
            "<style>body{font-family:Segoe UI,sans-serif;margin:20px;background:#fdf6e3}.r{display:flex;gap:12px;align-items:center;margin:3px 0}"
            "audio{height:30px}code{width:160px;color:#777}i{color:#b25e00}</style>"
            "<h1>Tondateien anhören</h1><p>Klingt etwas falsch, in <code>stimmen\\texte-anpassen.txt</code> eine Zeile "
            "<code>id = anderer Text</code> eintragen (z. B. <code>laut/b = bö.</code>) und <code>python stimmen-erzeugen.py --los</code> "
            "erneut starten – nur geänderte Dateien werden neu erzeugt.</p>" + "".join(rows))
    open(os.path.join(ST, "anhoeren.html"), "w", encoding="utf-8").write(page)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--los", action="store_true", help="Tondateien wirklich erzeugen")
    ap.add_argument("--max-zeichen", type=int, default=0)
    ap.add_argument("--modell", default="")
    ap.add_argument("--neu", nargs="*", default=[], help="diese ids neu erzeugen")
    a = ap.parse_args()

    s = sammeln()
    jobs = auftraege(s)
    orig = {}
    for k, t in s["laut"].items(): orig["laut/" + k] = t
    satz_orig = {"satz/" + hashlib.sha1(satz_key(x["text"]).encode()).hexdigest()[:10]: x["text"] for x in s["satz"]}
    done = json.load(open(DONE, encoding="utf-8")) if os.path.exists(DONE) else {}
    # nach einem Abbruch: schon erzeugte Dateien übernehmen (nicht noch einmal bezahlen)
    for i, t, g in jobs:
        if i not in done and i not in a.neu and os.path.exists(os.path.join(AUDIO, i + ".mp3")):
            done[i] = {"text": t, "text_orig": satz_orig.get(i, t), "modell": "?"}
    todo = [(i, t, g) for i, t, g in jobs
            if i in a.neu or done.get(i, {}).get("text") != t or not os.path.exists(os.path.join(AUDIO, i + ".mp3"))]
    zeichen = sum(len(t) for _, t, _ in todo)
    print(f"{len(jobs)} Tondateien insgesamt, davon {len(todo)} zu erzeugen ({zeichen} Zeichen).")
    anhoerseite(jobs, orig)
    os.makedirs(ST, exist_ok=True)
    json.dump([{"id": i, "text": t, "gruppe": g} for i, t, g in jobs], open(os.path.join(ST, "liste.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)

    if a.los and todo:
        if not os.path.exists(KEYFILE): sys.exit("elevenlabs-key.txt fehlt (eine Zeile mit dem API-Schlüssel).")
        key = open(KEYFILE, encoding="utf-8-sig").read().strip()
        modell = modell_waehlen(key, a.modell)
        try:
            sub = api("/v1/user/subscription", key)
            rest = sub.get("character_limit", 0) - sub.get("character_count", 0)
            print(f"Modell {modell}, Stimme {VOICE}. Guthaben: noch {rest} Zeichen.")
        except Exception as e:
            rest = 10 ** 9; print("Guthaben unbekannt:", e)
        limit = min(rest, a.max_zeichen or rest)
        # Auswahl im Rahmen des Guthabens, dann mehrere Dateien gleichzeitig erzeugen
        plan, used = [], 0
        for j in todo:
            if used + len(j[1]) > limit: break
            plan.append(j); used += len(j[1])
        if len(plan) < len(todo): print(f"Zeichen-Grenze: {len(todo) - len(plan)} Dateien bleiben für später.")
        lock, n = threading.Lock(), 0

        def eine(job):
            i, t, g = job
            body = {"text": t, "model_id": modell, "language_code": "de"}
            try:
                mp3 = api(f"/v1/text-to-speech/{VOICE}?output_format={FORMAT}", key, body, raw=True)
            except RuntimeError as e:
                if "language" not in str(e).lower(): raise
                body.pop("language_code"); mp3 = api(f"/v1/text-to-speech/{VOICE}?output_format={FORMAT}", key, body, raw=True)
            path = os.path.join(AUDIO, i + ".mp3")
            os.makedirs(os.path.dirname(path), exist_ok=True)
            open(path, "wb").write(mp3)
            return job

        with concurrent.futures.ThreadPoolExecutor(4) as ex:
            for job in ex.map(eine, plan):
                i, t, g = job
                with lock:
                    done[i] = {"text": t, "text_orig": satz_orig.get(i, t), "modell": modell}
                    n += 1
                    if n % 50 == 0:
                        json.dump(done, open(DONE, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
                        print(f"  {n}/{len(plan)} erzeugt", flush=True)
        json.dump(done, open(DONE, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
        print(f"{n} Tondateien erzeugt, {used} Zeichen verbraucht.")
    elif not a.los:
        print("Zum Erzeugen: python stimmen-erzeugen.py --los")
    print(f"audio.js: {manifest()} Einträge. Anhören: stimmen\\anhoeren.html")


if __name__ == "__main__":
    main()
