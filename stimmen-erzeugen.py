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
#   python stimmen-erzeugen.py --los --neu laut/b silben/affe   diese Dateien neu erzeugen
#   Silben: die Stimme spricht "Affe. Af – fe." – das Skript schneidet die Silben an den Pausen
#   heraus (web\audio\silben\affe-1.wav, affe-2.wav).
#   Modell: "Eleven v4" (eleven_v4), anderes mit --modell <id>
#
# Der API-Schlüssel steht in elevenlabs-key.txt (eine Zeile) neben diesem Skript – diese Datei
# ist in .gitignore eingetragen und wird nie veröffentlicht.
import argparse, array, concurrent.futures, hashlib, math, threading, json, os, re, subprocess, sys, tempfile, time, urllib.error, urllib.request, wave

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
    for k, x in s["silben"].items(): jobs.append((f"silben/{k}", x["text"], 0))
    for x in s["satz"]:
        h = hashlib.sha1(satz_key(x["text"]).encode("utf-8")).hexdigest()[:10]
        jobs.append(("satz/" + h, x.get("say", x["text"]), x["gruppe"]))
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


# ---- Silben aus "Wort. Sil – be." herausschneiden ----
SR = 22050                                          # pcm_22050: 16 Bit, mono


def silben_anzahl(t):
    return t.split(". ", 1)[1].count("–") + 1 if ". " in t else 1


def silben_dateien(i, t):
    return [os.path.join(AUDIO, f"{i}-{k}.wav") for k in range(1, silben_anzahl(t) + 1)]


def vorhanden(i, t):
    if i.startswith("silben/"): return all(os.path.exists(f) for f in silben_dateien(i, t))
    return os.path.exists(os.path.join(AUDIO, i + ".mp3"))


def silben_schneiden(a, n):
    """Teilt die Aufnahme an den n größten Pausen: [Wort] | Silbe 1 | ... | Silbe n. None, wenn es nicht passt."""
    fr = int(SR * 0.01)
    rms = [math.sqrt(sum(x * x for x in a[i:i + fr]) / max(1, len(a[i:i + fr]))) for i in range(0, len(a), fr)]
    if not rms or max(rms) == 0: return None
    thr, low = max(rms) * 0.04, max(rms) * 0.012
    regs, i = [], 0
    while i < len(rms):
        if rms[i] > thr:
            j = i
            while j < len(rms) and rms[j] > thr: j += 1
            while i > 0 and rms[i - 1] > low: i -= 1              # leise Ränder (f, s, h) mitnehmen
            while j < len(rms) and rms[j] > low: j += 1
            if regs and i <= regs[-1][1]: regs[-1][1] = j
            else: regs.append([i, j])
            i = j
        else: i += 1
    regs = [r for r in regs if r[1] - r[0] >= 4]                    # Knackser unter 40 ms weg
    if len(regs) < n + 1: return None
    gaps = sorted(range(len(regs) - 1), key=lambda k: regs[k + 1][0] - regs[k][1], reverse=True)[:n]
    if min(regs[k + 1][0] - regs[k][1] for k in gaps) < 18: return None   # Pausen unter 180 ms: unsicher
    teile, start = [], 0
    for k in sorted(gaps): teile.append((regs[start][0], regs[k][1])); start = k + 1
    teile.append((regs[start][0], regs[-1][1]))
    return [(s0 * 0.01, e0 * 0.01) for s0, e0 in teile[1:]]          # ohne das ganze Wort am Anfang


def wav_schreiben(a, s0, e0, fn, pad=0.05):
    i, j = max(0, int((s0 - pad) * SR)), min(len(a), int((e0 + pad) * SR))
    c = array.array("h", a[i:j]); f = min(int(0.008 * SR), len(c) // 2)
    for k in range(f): c[k] = int(c[k] * k / f); c[-1 - k] = int(c[-1 - k] * k / f)
    os.makedirs(os.path.dirname(fn), exist_ok=True)
    w = wave.open(fn, "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(c.tobytes()); w.close()


def alte_silben(i):
    """alte Silben-Dateien eines Wortes (mp3 oder wav)"""
    d, w = os.path.dirname(os.path.join(AUDIO, i)), os.path.basename(i)
    if not os.path.isdir(d): return []
    return [os.path.join(d, f) for f in os.listdir(d) if re.fullmatch(re.escape(w) + r"-\d+\.(mp3|wav)", f)]


def manifest():
    """web\\audio\\audio.js: welche Tondateien vorhanden sind (nur die, die es wirklich gibt)"""
    done = json.load(open(DONE, encoding="utf-8")) if os.path.exists(DONE) else {}
    m = {"laut": [], "name": [], "wort": [], "silben": {}, "satz": {}}
    for i, info in sorted(done.items()):
        if not vorhanden(i, info["text"]): continue
        kind, name = i.split("/", 1)
        if kind in ("laut", "name", "wort"): m[kind].append(name)
        elif kind == "silben": m["silben"][name] = silben_anzahl(info["text"])   # nur, wenn alle Silben da sind
        elif kind == "satz": m["satz"][satz_key(info["text_orig"])] = name
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
        if kind != last:
            if last: rows.append("</section>")
            rows.append(f'<section><h2>{namen[kind]} <button class="sec">▶ diese abspielen</button></h2>'); last = kind
        shown = orig.get(i, t)
        # Lautschrift sichtbar machen: <phoneme ph="lː">l</phoneme> -> l [lː]
        shown = re.sub(r'<phoneme alphabet="ipa" ph="([^"]+)">([^<]*)</phoneme>', r"\2 <b>[\1]</b>", shown)
        t = re.sub(r'<phoneme alphabet="ipa" ph="([^"]+)">([^<]*)</phoneme>', r"\2 [\1]", t)
        anders = shown.replace("<b>", "").replace("</b>", "") != t
        if kind == "silben":                         # jede Silbe eine eigene Zeile
            sy = t.split(". ", 1)[1].rstrip(".").split(" – ") if ". " in t else [t]
            for k, x in enumerate(sy, 1):
                rows.append(f'<div class="r"><audio controls preload="none" src="../web/audio/{i}-{k}.wav"></audio>'
                            f'<code>{i}-{k}</code><span>{x}</span> <i>({t.split(". ")[0]})</i></div>')
            continue
        rows.append(f'<div class="r"><audio controls preload="none" src="../web/audio/{i}.mp3"></audio>'
                    f'<code>{i}</code><span>{shown}</span>{f" <i>(gesprochen als: {t})</i>" if anders else ""}</div>')
    if last: rows.append("</section>")
    page = ("<!doctype html><meta charset='utf-8'><title>ABC-Abenteuer – Tondateien anhören</title>"
            "<style>body{font-family:Segoe UI,sans-serif;margin:0 20px 20px;background:#fdf6e3}.r{display:flex;gap:12px;align-items:center;margin:3px 0;padding:2px 6px;border-radius:8px}"
            "audio{height:30px}code{width:160px;color:#777}i{color:#b25e00}.r.on{background:#ffe066}"
            ".bar{position:sticky;top:0;background:#fdf6e3;padding:10px 0;border-bottom:2px solid #e8dcc0;display:flex;gap:10px;align-items:center;z-index:1}"
            "button{font:inherit;font-size:16px;padding:6px 14px;border-radius:8px;border:1px solid #c9b98f;background:#fff;cursor:pointer}"
            "h2 button{font-size:13px;padding:3px 10px;margin-left:10px;vertical-align:middle}#jetzt{color:#555}</style>"
            "<div class='bar'><button id='alle'>▶ Alle abspielen</button><button id='weiter'>⏯ ab hier weiter</button><button id='stopp'>⏹ Stopp</button>"
            "<label><input type='checkbox' id='langsam'> längere Pause</label><span id='jetzt'></span></div>"
            "<h1>Tondateien anhören</h1><p>Klingt etwas falsch, in <code>stimmen\texte-anpassen.txt</code> eine Zeile "
            "<code>id = anderer Text</code> eintragen (z. B. <code>laut/b = bö.</code>) und <code>python stimmen-erzeugen.py --los</code> "
            "erneut starten – nur geänderte Dateien werden neu erzeugt. Eine Tondatei anklicken (abspielen) und dann "
            "„ab hier weiter“ spielt alle folgenden. <b>Leertaste</b> = Pause / weiter.</p>" + "".join(rows) + r"""<script>
const rows = [...document.querySelectorAll('.r')];
let list = [], pos = 0, timer = null, cur = null, last = 0, paused = false;
rows.forEach((r, k) => r.querySelector('audio').addEventListener('play', () => { last = k; if (!list.length) mark(r); }));
function mark(r) { rows.forEach(x => x.classList.remove('on')); if (r) { r.classList.add('on'); r.scrollIntoView({block: 'center', behavior: 'smooth'});
  document.getElementById('jetzt').textContent = r.querySelector('code').textContent + ' – ' + r.querySelector('span').textContent; } }
function stop() { paused = false; clearTimeout(timer); if (cur) { cur.pause(); cur.onended = cur.onerror = null; } list = []; cur = null; }
function next() {
  if (pos >= list.length) { stop(); document.getElementById('jetzt').textContent = 'fertig'; return; }
  const r = list[pos++]; mark(r); cur = r.querySelector('audio'); cur.currentTime = 0;
  const go = () => { timer = setTimeout(next, document.getElementById('langsam').checked ? 1200 : 450); };
  cur.onended = go; cur.onerror = go; cur.play().catch(go);
}
function start(l) { stop(); list = l; pos = 0; next(); }
document.getElementById('alle').onclick = () => start(rows);
document.getElementById('weiter').onclick = () => start(rows.slice(last));
document.getElementById('stopp').onclick = () => { stop(); mark(null); document.getElementById('jetzt').textContent = ''; };
// Leertaste: Pause / weiter (ohne Liste: ab der zuletzt gespielten Datei weiter)
document.addEventListener('keydown', e => {
  if (e.code !== 'Space' || e.target.tagName === 'INPUT' && e.target.type !== 'checkbox') return;
  e.preventDefault(); e.stopPropagation();
  if (list.length && !paused) {
    paused = true; clearTimeout(timer); if (cur) cur.pause();
    document.getElementById('jetzt').textContent = '⏸ Pause (Leertaste: weiter) – ' + document.getElementById('jetzt').textContent;
  } else if (paused) {
    paused = false; const r = list[pos - 1]; mark(r);
    if (cur && !cur.ended && cur.currentTime > 0) cur.play().catch(next); else next();
  } else start(rows.slice(last));
}, true);
document.addEventListener('keyup', e => { if (e.code === 'Space') e.preventDefault(); }, true);
document.querySelectorAll('button.sec').forEach(b => b.onclick = () => start([...b.closest('section').querySelectorAll('.r')]));
</script>""")
    open(os.path.join(ST, "anhoeren.html"), "w", encoding="utf-8").write(page)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--los", action="store_true", help="Tondateien wirklich erzeugen")
    ap.add_argument("--max-zeichen", type=int, default=0)
    ap.add_argument("--modell", default="")
    ap.add_argument("--neu", nargs="*", default=[], help="diese ids neu erzeugen")
    ap.add_argument("--bis-gruppe", type=int, default=99, help="nur Gruppen 0..N erzeugen (0 = Buchstaben, Wörter, Silben)")
    a = ap.parse_args()

    s = sammeln()
    jobs = auftraege(s)
    orig = {}
    for k, t in s["laut"].items(): orig["laut/" + k] = t
    satz_orig = {"satz/" + hashlib.sha1(satz_key(x["text"]).encode()).hexdigest()[:10]: x["text"] for x in s["satz"]}
    done = json.load(open(DONE, encoding="utf-8")) if os.path.exists(DONE) else {}
    # nach einem Abbruch: schon erzeugte Dateien übernehmen (nicht noch einmal bezahlen)
    for i, t, g in jobs:
        if i not in done and i not in a.neu and vorhanden(i, t):
            done[i] = {"text": t, "text_orig": satz_orig.get(i, t), "modell": "?"}
    # Tondateien für Texte, die es nicht mehr gibt (z. B. gelöschte Wörter), entfernen
    ids = {i for i, _, _ in jobs}
    alt = [i for i in done if i not in ids]
    if a.los and alt:
        for i in alt:
            p = os.path.join(AUDIO, i + ".mp3")
            if os.path.exists(p): os.remove(p)
            if i.startswith("silben/") and i.rsplit("-", 1)[0] not in ids:   # Silben eines gelöschten Wortes
                for f in alte_silben(i): os.remove(f)
            del done[i]
        json.dump(done, open(DONE, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
        print(f"{len(alt)} nicht mehr gebrauchte Tondateien gelöscht.")
    elif alt:
        print(f"{len(alt)} Tondateien werden nicht mehr gebraucht (werden mit --los gelöscht).")
    todo = [(i, t, g) for i, t, g in jobs
            if g <= a.bis_gruppe and (i in a.neu or done.get(i, {}).get("text") != t or not vorhanden(i, t))]
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

        fehl = []

        def silben(job):
            i, t, g = job
            body = {"text": t, "model_id": modell, "language_code": "de"}
            for versuch in range(3):                   # jede Aufnahme klingt etwas anders – sonst neu versuchen
                a = array.array("h")
                a.frombytes(api(f"/v1/text-to-speech/{VOICE}?output_format=pcm_22050", key, body, raw=True))
                teile = silben_schneiden(a, silben_anzahl(t))
                if teile: break
            else:
                fehl.append(i); return None
            for f in alte_silben(i): os.remove(f)
            for (s0, e0), fn in zip(teile, silben_dateien(i, t)): wav_schreiben(a, s0, e0, fn)
            return job

        def eine(job):
            i, t, g = job
            if i.startswith("silben/"): return silben(job)
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
                if not job: continue
                i, t, g = job
                with lock:
                    done[i] = {"text": t, "text_orig": satz_orig.get(i, t), "modell": modell}
                    n += 1
                    if n % 50 == 0:
                        json.dump(done, open(DONE, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
                        print(f"  {n}/{len(plan)} erzeugt", flush=True)
        json.dump(done, open(DONE, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
        print(f"{n} Tondateien erzeugt, {used} Zeichen verbraucht.")
        if fehl: print(f"Silben nicht sauber getrennt (später erneut starten): {', '.join(fehl)}")
    elif not a.los:
        print("Zum Erzeugen: python stimmen-erzeugen.py --los")
    print(f"audio.js: {manifest()} Einträge. Anhören: stimmen\\anhoeren.html")


if __name__ == "__main__":
    main()
