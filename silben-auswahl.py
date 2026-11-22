# Silben einzelner Wörter in mehreren Fassungen erzeugen und die beste auswählen
#
#   python silben-auswahl.py Affe Auto Biene      je 4 Fassungen erzeugen (stimmen\auswahl\),
#                                                 dann stimmen\silben-auswahl.html öffnen und anhören
#   python silben-auswahl.py --uebernehmen affe=2 auto=4 biene=0
#                                                 gewählte Fassung nach web\audio\silben\ kopieren
#                                                 (0 = bisherige behalten)
#
# Fassungen:  1, 2  "Affe. Af – fe. Affe."   (Wort am Ende: letzte Silbe klingt nicht fragend/gedehnt)
#             3     "Affe. Af – fe."          (wie bisher, neue Aufnahme)
#             4     wie 1, mit Lautschrift für schwierige Silben (HILFE unten), sonst neue Aufnahme
# Braucht elevenlabs-key.txt. Über das PowerShell-Fenster starten (Edge sammelt die Texte).
import argparse, array, html, importlib, json, os, re, shutil, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
se = importlib.import_module("stimmen-erzeugen")
AUSWAHL = os.path.join(se.ST, "auswahl")

# Lautschrift für einzelne Silben: Wort -> {Silbe (1, 2, ...): IPA}
HILFE = {
    "auto": {2: "ˈto"}, "dino": {2: "ˈno"}, "gorilla": {1: "ˈɡo"}, "einhorn": {1: "ˈaɪ̯n"},
    "funkelstern": {1: "ˈfʊŋ"}, "paket": {2: "ˈkeːt"}, "kamel": {2: "ˈmeːl"}, "krokodil": {3: "ˈdiːl"},
    "zylinder": {1: "ˈtsi", 2: "ˈlɪn"}, "teddy": {2: "ˈdi"}, "taxi": {2: "ˈksi"}, "zebra": {1: "ˈtseː"},
    "rakete": {2: "ˈkeː"}, "junge": {1: "ˈjʊŋ"}, "hase": {1: "ˈhaː"}, "erdbeere": {2: "ˈbeː"},
    "delfin": {2: "ˈfiːn"},
    # Vorschläge des Aussprache-Prüfers (21.11.2026)
    "baum": {1: "ˈbaʊm"}, "comic": {1: "ˈkɔ"}, "drache": {2: "ˈxə"}, "glocke": {2: "ˈkə"},
    "kirsche": {1: "ˈkɪʁ", 2: "ˈʃə"}, "loewe": {2: "ˈvə"}, "orange": {1: "ˈo", 3: "ˈʒə"},
    "unterhose": {3: "ˈhoː", 4: "ˈzə"}, "video": {2: "ˈde", 3: "ˈo"},
}


# Runde 2 (--runde 2, Fassungen 5–8):
#   5  mit Kommas: "Hase. Ha, se, Hase."
#   6  ohne Punkt nach der letzten Silbe: "Hase. Ha – se – Hase."
#   7  wie 1, Lautschrift für die schwierige Silbe (HILFE2, betontes Murmel-e)
#   8  wie 1, mit Regieanweisung "langsam und deutlich"
# SCHREIB: andere Schreibweise einer Silbe nur für die Stimme (Runde 2)
SCHREIB = {"jacke": {2: "ke"}, "wecker": {2: "ker"}, "taxi": {2: "ksi"}}
HILFE2 = {
    "hase": {2: "ˈzə"}, "jause": {2: "ˈzə"}, "nase": {2: "ˈzə"}, "junge": {2: "ˈɡə"}, "ziege": {2: "ˈɡə"},
    "lampe": {2: "ˈpə"}, "krone": {2: "ˈnə"}, "melone": {3: "ˈnə"}, "sonne": {2: "ˈnə"}, "ente": {2: "ˈtə"},
    "erdbeere": {2: "ˈbeː", 3: "ˈʁə"}, "jacke": {2: "ˈkə"}, "wecker": {2: "ˈkɐ"}, "dino": {2: "ˈnoː"},
    "taxi": {2: "ˈksiː"},
}


def mit_ipa(syl, h):
    return [f'<phoneme alphabet="ipa" ph="{h[k]}">{x}</phoneme>' if k in h else x for k, x in enumerate(syl, 1)]


def fassungen2(slug, t):
    wort, syl = teile_text(t)
    syl = [SCHREIB.get(slug, {}).get(k, x) for k, x in enumerate(syl, 1)]
    s7 = mit_ipa(syl, HILFE2.get(slug, {}))
    return [(f"{wort}. {', '.join(syl)}, {wort}.", True),
            (f"{wort}. {' – '.join(syl)} – {wort}.", True),
            (f"{wort}. {' – '.join(s7)}. {wort}.", True),
            (f"[langsam und deutlich] {wort}. {' – '.join(syl)}. {wort}.", True)]


# Runde 3 (--runde 3, Fassungen 9–12): Schreibweisen der Nutzerin
#   9, 10  "[langsam und deutlich] Hase. Ha – s:. Hase."   11  ohne Anweisung   12  wie 9 mit Lautschrift
SCHREIB3 = {"wecker": {2: "KAh"}, "melone": {3: "n:"}, "krone": {2: "n:"}, "jacke": {2: "K:"},
            "hase": {2: "s:"}, "erdbeere": {2: "beh"}, "ente": {2: "t:"}}
HILFE3 = {"wecker": {2: "ˈka"}, "melone": {3: "nː"}, "krone": {2: "nː"}, "jacke": {2: "kː"},
          "hase": {2: "zː"}, "erdbeere": {2: "ˈbeː"}, "ente": {2: "tː"}}


def fassungen3(slug, t):
    wort, syl = teile_text(t)
    syl = [SCHREIB3.get(slug, {}).get(k, x) for k, x in enumerate(syl, 1)]
    s12 = mit_ipa(syl, HILFE3.get(slug, {}))
    lang = f"[langsam und deutlich] {wort}. {' – '.join(syl)}. {wort}."
    return [(lang, True), (lang, True), (f"{wort}. {' – '.join(syl)}. {wort}.", True),
            (f"[langsam und deutlich] {wort}. {' – '.join(s12)}. {wort}.", True)]


# Runde 4 (--runde 4 --sprich "Wecker=Wek – ker"): eigene Silben-Schreibweise für die Stimme
#   13, 14 mit "langsam und deutlich"   15 ohne   16 mit Kommas
SPRICH = {}

# Runde 5 (--runde 5): Lautschrift-Hilfen aus dem Bericht des Aussprache-Prüfers (22.11.2026),
#   nummeriert nach der höchsten vorhandenen Fassung:
#   a) langsam und deutlich + Lautschrift   b) Lautschrift   c) langsam und deutlich   d) neue Aufnahme
HILFE5 = {}


def fassungen5(slug, t):
    wort, syl = teile_text(t)
    s5 = " – ".join(mit_ipa(syl, HILFE5.get(slug, {})))
    s = " – ".join(syl)
    return [(f"[langsam und deutlich] {wort}. {s5}. {wort}.", True), (f"{wort}. {s5}. {wort}.", True),
            (f"[langsam und deutlich] {wort}. {s}. {wort}.", True), (f"{wort}. {s}. {wort}.", True)]


NEU_AB = {}                                        # Seite: nur "bisher" und die neuen Fassungen zeigen


def fassungen4(slug, t):
    wort, syl = teile_text(t)
    s = SPRICH.get(slug, " – ".join(syl))
    lang = f"[langsam und deutlich] {wort}. {s}. {wort}."
    return [(lang, True), (lang, True), (f"{wort}. {s}. {wort}.", True),
            (f"[langsam und deutlich] {wort}. {s.replace(' – ', ', ')}, {wort}.", True)]


def teile_text(t):
    """'Affe. Af – fe.' -> ('Affe', ['Af', 'fe'])"""
    wort, rest = t.split(". ", 1)
    return wort, rest.rstrip(".").split(" – ")


def fassungen(slug, t):
    wort, syl = teile_text(t)
    hinten = f"{wort}. {' – '.join(syl)}. {wort}."
    h = HILFE.get(slug)
    if h:
        s2 = [f'<phoneme alphabet="ipa" ph="{h[k]}">{x}</phoneme>' if k in h else x for k, x in enumerate(syl, 1)]
        vier = f"{wort}. {' – '.join(s2)}. {wort}."
    else:
        vier = hinten
    return [(hinten, True), (hinten, True), (t, False), (vier, True)]


def schneiden(a, n, hinten):
    """wie se.silben_schneiden, aber mit dem ganzen Wort auch am Ende"""
    if not hinten: return se.silben_schneiden(a, n)
    r = se.silben_schneiden(a, n + 1)
    return r[:-1] if r else None


DATEIEN = os.path.join(AUSWAHL, "_dateien")     # Fassungen für Laute, Namen, Wörter (mp3)
LETZTE_DATEIEN = []


def datei_ordner(i):
    return os.path.join(DATEIEN, i.replace("/", "_"))


def datei_zeilen(ids):
    rows = []
    for i in ids:
        d = datei_ordner(i)
        texte = json.load(open(os.path.join(d, "texte.json"), encoding="utf-8"))
        cells = [f"<td><label><input type='radio' name='{i}' value='0' checked> bisher</label><br>"
                 f"<button class='all' data-f='../web/audio/{i}.mp3'>▶</button></td>"]
        for v, t in sorted(texte.items(), key=lambda x: int(x[0])):
            ext = "wav" if os.path.exists(os.path.join(d, f"{v}.wav")) else "mp3"
            shown = re.sub(r'<phoneme alphabet="ipa" ph="([^"]+)">([^<]*)</phoneme>', r"\2 [\1]", t)
            cells.append(f"<td><label><input type='radio' name='{i}' value='{v}'> {v}</label> <small>{html.escape(shown)}</small><br>"
                         f"<button class='all' data-f='auswahl/_dateien/{i.replace('/', '_')}/{v}.{ext}'>▶</button></td>")
        rows.append(f"<tr><th>{i}</th>{''.join(cells)}</tr>")
    return rows



# Tastatur auf der Auswahlseite: Zahl = Fassung anhören (0 = bisher, 1 = erste Spalte daneben …),
# Enter = zuletzt angehörte Fassung auswählen, Tab / Umschalt+Tab = nächstes / voriges Wort
TASTEN_JS = ("const rows=[...document.querySelectorAll('table tr')];let row=0,col=null;"
    "function go(i){rows[row].classList.remove('cur');row=Math.max(0,Math.min(rows.length-1,i));col=null;"
    "rows[row].classList.add('cur');rows[row].scrollIntoView({block:'center'});"
    "rows[row].querySelectorAll('td.pick').forEach(t=>t.classList.remove('pick'));}"
    "document.addEventListener('keydown',e=>{if(e.target.id==='out')return;"
    "if(e.key==='Tab'){e.preventDefault();go(row+(e.shiftKey?-1:1));return;}"
    "if(/^[0-9]$/.test(e.key)){e.preventDefault();const td=rows[row].querySelectorAll('td')[+e.key];if(!td)return;"
    "rows[row].querySelectorAll('td.pick').forEach(t=>t.classList.remove('pick'));td.classList.add('pick');col=+e.key;"
    "const b=td.querySelector('button.all');if(b)b.click();return;}"
    "if(e.key==='Enter'&&col!==null){e.preventDefault();const r=rows[row].querySelectorAll('td')[col].querySelector('input');"
    "if(r){r.checked=true;upd();rows[row].classList.add('done');}}});"
    "rows.forEach((r,i)=>r.addEventListener('click',()=>{if(i!==row)go(i);}));go(0);")
TASTEN_CSS = ("tr.cur{outline:4px solid #4d96ff;outline-offset:-2px;background:#eef5ff}td.pick{background:#ffe066}"
    "tr.done th::after{content:' ✓';color:#2e9e44}.keys{background:#fff;border:1px solid #e0d4b4;border-radius:8px;padding:6px 12px;display:inline-block}"
    "kbd{border:1px solid #aaa;border-bottom-width:3px;border-radius:4px;padding:0 5px;background:#fafafa}")
TASTEN_HILFE = ("<p class='keys'>Tastatur: <kbd>Tab</kbd> nächstes Wort, <kbd>Umschalt</kbd>+<kbd>Tab</kbd> voriges Wort, "
    "<kbd>0</kbd> bisher anhören, <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> … Fassungen von links nach rechts anhören, "
    "<kbd>Enter</kbd> die zuletzt angehörte Fassung auswählen.</p>")

def seite(woerter, dateien=()):
    rows = datei_zeilen(dateien)
    for slug, t in woerter:
        wort, syl = teile_text(t)
        n = len(syl)
        cells = []
        nf = os.path.join(AUSWAHL, slug, "namen.json")            # Beschriftung geliehener Fassungen
        namen = json.load(open(nf, encoding="utf-8")) if os.path.exists(nf) else {}
        for v in range(0, 40):
            if v > 4 and not os.path.exists(os.path.join(AUSWAHL, slug, f"{v}-1.wav")): continue
            if v and slug in NEU_AB and v < NEU_AB[slug]: continue
            d = f"../web/audio/silben/{slug}-" if v == 0 else f"auswahl/{slug}/{v}-"
            if v and not os.path.exists(os.path.join(AUSWAHL, slug, f"{v}-1.wav")):
                cells.append(f"<td class='x'>{v}: –</td>"); continue
            files = [f"{d}{k}.wav" for k in range(1, n + 1)]
            btns = "".join(f"<button class='s' data-f='{f}'>{x}</button>" for f, x in zip(files, syl))
            cells.append(f"<td><label><input type='radio' name='{slug}' value='{v}'{' checked' if v == 0 else ''}> "
                         f"{'bisher' if v == 0 else v}{' ' + namen[str(v)] if str(v) in namen else ''}</label><br><button class='all' data-f='{'|'.join(files)}'>▶</button>{btns}</td>")
        rows.append(f"<tr><th>{wort}</th>{''.join(cells)}</tr>")
    page = ("<!doctype html><meta charset='utf-8'><title>Silben auswählen</title><style>"
            "body{font-family:Segoe UI,sans-serif;margin:20px;background:#fdf6e3}table{border-collapse:collapse}"
            "td,th{border:1px solid #e0d4b4;padding:6px 10px;text-align:left;vertical-align:top}th{font-size:18px}"
            "button{font:inherit;padding:3px 8px;margin:2px;border-radius:6px;border:1px solid #c9b98f;background:#fff;cursor:pointer}"
            "button.on{background:#ffe066}td.x{color:#aaa}#out{width:100%;font:16px monospace;margin-top:10px}" + TASTEN_CSS + "</style>"
            "<h1>Silben auswählen</h1><p>▶ spielt alle Silben einer Fassung, die Silben-Knöpfe einzeln. "
            "Die beste Fassung ankreuzen (bisher = nichts ändern), dann unten den Text kopieren und Claude schicken.</p>" + TASTEN_HILFE +
            "<table>" + "".join(rows) + "</table><textarea id='out' rows='3' readonly></textarea>"
            "<button id='copy'>Auswahl kopieren</button><script>"
            "let cur=null;function play(l,b){if(cur)cur.pause();document.querySelectorAll('.on').forEach(x=>x.classList.remove('on'));"
            "b.classList.add('on');let i=0;const nx=()=>{if(i>=l.length){b.classList.remove('on');return;}"
            "cur=new Audio(l[i++]);cur.onended=()=>setTimeout(nx,350);cur.onerror=nx;cur.play();};nx();}"
            "document.querySelectorAll('button.s,button.all').forEach(b=>b.onclick=()=>play(b.dataset.f.split('|'),b));"
            "function upd(){document.getElementById('out').value=[...document.querySelectorAll('input:checked')]"
            ".filter(r=>r.value!=='0').map(r=>r.name+'='+r.value).join(' ')||'(nichts geändert)';}"
            "document.querySelectorAll('input').forEach(r=>r.onchange=upd);upd();"
            "document.getElementById('copy').onclick=()=>{const o=document.getElementById('out');o.select();"
            "navigator.clipboard.writeText(o.value).catch(()=>document.execCommand('copy'));};" + TASTEN_JS + "</script>")
    open(os.path.join(se.ST, "silben-auswahl.html"), "w", encoding="utf-8").write(page)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("woerter", nargs="*")
    ap.add_argument("--uebernehmen", nargs="*", default=None)
    ap.add_argument("--runde", type=int, default=1)
    ap.add_argument("--leihen", nargs="*", default=None)
    ap.add_argument("--sprich", nargs="*", default=[])
    ap.add_argument("--vorschlaege", default="", help="ElevenLabs-Vorschlaege.txt des Aussprache-Prüfers")
    ap.add_argument("--ids", nargs="*", default=[], help="nur diese ids (z. B. wort/apfel) aus --vorschlaege")
    ap.add_argument("--nur-seite", action="store_true", help="--vorschlaege: schon erzeugte Fassungen nur auf die Seite setzen")
    ap.add_argument("--hilfe", default="", help="HILFE-Zeilen (Prüfer-Bericht) für Runde 5")
    a = ap.parse_args()
    if a.hilfe:
        for z in open(a.hilfe, encoding="utf-8"):
            m = re.match(r'\s*HILFE: "(\w+)": \{(\d+): "([^"]+)"\}', z)
            if m: HILFE5.setdefault(m.group(1), {})[int(m.group(2))] = m.group(3)
    for x in a.sprich:
        w, s_ = x.split("=", 1)
        SPRICH[w.lower()] = " – ".join(p.strip() for p in s_.split("-"))     # "Wek-ker" -> "Wek – ker"
    s = se.sammeln()
    texte = {k: x["text"] for k, x in s["silben"].items()}
    done = json.load(open(se.DONE, encoding="utf-8")) if os.path.exists(se.DONE) else {}

    if a.uebernehmen is not None:
        for x in a.uebernehmen:
            slug, v = x.split("="); v = int(v)
            if v == 0: continue
            wav = os.path.join(datei_ordner(slug), f"{v}.wav") if "/" in slug else ""
            if wav and os.path.exists(wav):              # Laut aus einer Silbe (WAV): neben die mp3 legen, das Programm nimmt die WAV
                shutil.copy(wav, os.path.join(se.AUDIO, slug + ".wav"))
                print("übernommen (WAV):", slug, v); continue
            if "/" in slug:                              # Laut/Name/Wort: mp3 + Zeile in texte-anpassen.txt
                t = json.load(open(os.path.join(datei_ordner(slug), "texte.json"), encoding="utf-8"))[str(v)]
                shutil.copy(os.path.join(datei_ordner(slug), f"{v}.mp3"), os.path.join(se.AUDIO, slug + ".mp3"))
                ta = os.path.join(se.ST, "texte-anpassen.txt")
                zeilen = open(ta, encoding="utf-8").read().splitlines() if os.path.exists(ta) else []
                zeilen = [z for z in zeilen if z.split("=", 1)[0].strip() != slug] + [f"{slug} = {t}"]
                open(ta, "w", encoding="utf-8", newline="\n").write("\n".join(zeilen) + "\n")
                done[slug] = {"text": t, "text_orig": t, "modell": f"eleven_v4 (Auswahl {v})"}
                print("übernommen:", slug, v); continue
            t = texte[slug]; n = len(teile_text(t)[1])
            src = [os.path.join(AUSWAHL, slug, f"{v}-{k}.wav") for k in range(1, n + 1)]
            if not all(os.path.exists(f) for f in src): print("fehlt:", slug, v); continue
            for f in se.alte_silben("silben/" + slug): os.remove(f)
            for k, f in enumerate(src, 1): shutil.copy(f, os.path.join(se.AUDIO, "silben", f"{slug}-{k}.wav"))
            done["silben/" + slug] = {"text": t, "text_orig": t, "modell": f"eleven_v4 (Auswahl {v})"}
            print("übernommen:", slug, v)
        json.dump(done, open(se.DONE, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
        print(f"audio.js: {se.manifest()} Einträge.")
        return

    if a.leihen:                       # "hase:2=nase,dose": Silbe 2 von Hase aus Nase bzw. Dose (kostenlos)
        neu = []
        for x in a.leihen:
            ziel, spender = x.split("=")
            slug, k = ziel.split(":"); k = int(k); n = len(teile_text(texte[slug])[1])
            d = os.path.join(AUSWAHL, slug); os.makedirs(d, exist_ok=True)
            nf = os.path.join(d, "namen.json")
            namen = json.load(open(nf, encoding="utf-8")) if os.path.exists(nf) else {}
            v = max([12] + [int(f.split("-")[0]) for f in os.listdir(d) if f.endswith("-1.wav")]) + 1
            for sp in spender.split(","):
                sl, sk = (sp.split(":") + [None])[:2]
                syl = teile_text(texte[sl])[1]
                sk = int(sk) if sk else next(j for j, y in enumerate(syl, 1) if y.lower() == teile_text(texte[slug])[1][k - 1].lower())
                for j in range(1, n + 1):
                    src = os.path.join(se.AUDIO, "silben", f"{sl}-{sk}.wav" if j == k else f"{slug}-{j}.wav")
                    shutil.copy(src, os.path.join(d, f"{v}-{j}.wav"))
                namen[str(v)] = f"({syl[sk - 1]} aus {teile_text(texte[sl])[0]})"; v += 1
            json.dump(namen, open(nf, "w", encoding="utf-8"), ensure_ascii=False)
            neu.append(slug)
        seite([(k, texte[k]) for k in sorted(set(neu))])
        print("Anhören: stimmen\\silben-auswahl.html"); return

    if a.vorschlaege:                  # Fassungen für laut/…, name/…, wort/… aus einer Vorschlags-Datei
        key = open(se.KEYFILE, encoding="utf-8-sig").read().strip()
        vor = {}
        for z in open(a.vorschlaege, encoding="utf-8"):
            m = re.match(r"((?:laut|name|wort|satz)/\w+) = (.+)$", z.strip())
            if m and (not a.ids or m.group(1) in a.ids): vor.setdefault(m.group(1), []).append(m.group(2))
        used = 0
        for i, kand in ({} if a.nur_seite else vor).items():
            d = datei_ordner(i); os.makedirs(d, exist_ok=True)
            tj = {}
            for v, t in enumerate(kand, 1):
                mp3 = se.api(f"/v1/text-to-speech/{se.VOICE}?output_format={se.FORMAT}", key,
                             {"text": t, "model_id": "eleven_v4", "language_code": "de"}, raw=True)
                open(os.path.join(d, f"{v}.mp3"), "wb").write(mp3); tj[str(v)] = t; used += len(t)
            json.dump(tj, open(os.path.join(d, "texte.json"), "w", encoding="utf-8"), ensure_ascii=False)
        print(f"{used} Zeichen verbraucht.")
        global LETZTE_DATEIEN
        LETZTE_DATEIEN = list(vor)
        if not a.woerter:
            seite([], LETZTE_DATEIEN); print("Anhören: stimmen\\silben-auswahl.html"); return

    slugs = []
    for w in a.woerter:
        k = re.sub(r"[^a-z]", "", w.lower().replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss"))
        if k not in texte: sys.exit(f"Wort nicht gefunden: {w}")
        slugs.append(k)
    key = open(se.KEYFILE, encoding="utf-8-sig").read().strip()
    used, fehl = 0, []
    import concurrent.futures

    def eine(slug):
        nonlocal used
        t = texte[slug]; n = len(teile_text(t)[1])
        d = os.path.join(AUSWAHL, slug); os.makedirs(d, exist_ok=True)
        liste = {1: fassungen, 2: fassungen2, 3: fassungen3, 4: fassungen4, 5: fassungen5}[a.runde](slug, t)
        erste = 4 * a.runde - 3
        if a.runde >= 4:                                          # nach den geliehenen Fassungen
            erste = max([12] + [int(f.split("-")[0]) for f in os.listdir(d) if f.endswith("-1.wav")]) + 1
        for v, (text, hinten) in enumerate(liste, erste):
            for versuch in range(3):
                a_ = array.array("h")
                a_.frombytes(se.api(f"/v1/text-to-speech/{se.VOICE}?output_format=pcm_22050", key,
                                    {"text": text, "model_id": "eleven_v4", "language_code": "de"}, raw=True))
                used += len(text)
                teile = schneiden(a_, n, hinten)
                if teile: break
            else:
                fehl.append(f"{slug} {v}"); continue
            for f in os.listdir(d):
                if f.startswith(f"{v}-"): os.remove(os.path.join(d, f))
            for k, (s0, e0) in enumerate(teile, 1): se.wav_schreiben(a_, s0, e0, os.path.join(d, f"{v}-{k}.wav"))
        print("fertig:", slug, flush=True)

    if a.runde == 5:
        for slug in slugs:
            d = os.path.join(AUSWAHL, slug)
            NEU_AB[slug] = max([12] + [int(f.split("-")[0]) for f in os.listdir(d) if f.endswith("-1.wav")]) + 1 if os.path.isdir(d) else 13
    with concurrent.futures.ThreadPoolExecutor(4) as ex: list(ex.map(eine, slugs))
    print(f"{used} Zeichen verbraucht.")
    if fehl: print("nicht sauber getrennt:", ", ".join(fehl))
    seite([(k, texte[k]) for k in sorted(slugs)], LETZTE_DATEIEN)   # nur die Wörter dieses Durchgangs
    print("Anhören: stimmen\\silben-auswahl.html")


if __name__ == "__main__":
    main()
