# Silben-Tondateien neu erzeugen (web\silben\*.wav und web\silben\silben.js)
#
# Quelle ist web\silben\lautschrift.txt (Wort = Silbe|Silbe|..., Lautschrift IPA).
# Jede Silbe wird mit der Windows-Stimme "Microsoft Katja" (Windows-Sprachpaket Deutsch)
# über SSML <phoneme alphabet="ipa"> gesprochen, Stille vorne/hinten wird abgeschnitten.
#
# Aufruf:  python silben-erzeugen.py [Zielordner]
#          ohne Zielordner wird web\silben überschrieben.
import os, re, struct, subprocess, sys, tempfile, wave, json

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "web", "silben", "lautschrift.txt")
SRC2 = os.path.join(HERE, "web", "silben", "einzeln.txt")
OUT = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.join(HERE, "web", "silben")
VOICE, RATE = "Microsoft Katja", "-10%"

PS = r'''param([string]$jobs)
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Media.SpeechSynthesis.SpeechSynthesizer,Windows.Media.SpeechSynthesis,ContentType=WindowsRuntime]
$null = [Windows.Storage.Streams.DataReader,Windows.Storage.Streams,ContentType=WindowsRuntime]
$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | ? { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
function Await($op, [Type]$t) { $task = $asTask.MakeGenericMethod($t).Invoke($null, @($op)); $task.Wait() | Out-Null; $task.Result }
$syn = New-Object Windows.Media.SpeechSynthesis.SpeechSynthesizer
foreach ($line in [IO.File]::ReadAllLines($jobs, [Text.Encoding]::UTF8)) {
  if (!$line) { continue }
  $p = $line -split "`t"
  $ssml = '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="de-DE"><voice name="__VOICE__"><prosody rate="__RATE__"><phoneme alphabet="ipa" ph="' + $p[1] + '">x</phoneme></prosody></voice></speak>'
  $stream = Await ($syn.SynthesizeSsmlToStreamAsync($ssml)) ([Windows.Media.SpeechSynthesis.SpeechSynthesisStream])
  $size = [uint32]$stream.Size
  $reader = New-Object Windows.Storage.Streams.DataReader($stream.GetInputStreamAt(0))
  $null = Await ($reader.LoadAsync($size)) ([uint32])
  $bytes = New-Object byte[] $size
  $reader.ReadBytes($bytes)
  [IO.File]::WriteAllBytes($p[0], $bytes)
}
"FERTIG"
'''.replace("__VOICE__", VOICE).replace("__RATE__", RATE)


def slug(w):
    w = w.lower().replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")
    return re.sub(r"[^a-z]", "", w)


def main():
    words = []
    for line in open(SRC, encoding="utf-8"):
        if "=" in line:
            w, v = (x.strip() for x in line.split("=", 1))
            words.append((w, v.split("|")))
    tmp = tempfile.mkdtemp(prefix="abc-silben-")
    jobs = [(os.path.join(tmp, f"{slug(w)}-{i + 1}.wav"), syl) for w, syls in words for i, syl in enumerate(syls)]
    # einzelne Tondateien: Buchstabennamen und ganze Wörter (web\silben\einzeln.txt, "name = Lautschrift")
    singles = []
    if os.path.exists(SRC2):
        for line in open(SRC2, encoding="utf-8"):
            m = re.match(r"^\s*([a-z0-9-]+)\s*=\s*(\S.*?)\s*$", line)
            if m: singles.append(m.group(1)); jobs.append((os.path.join(tmp, m.group(1) + ".wav"), m.group(2)))
    jf, pf = os.path.join(tmp, "jobs.txt"), os.path.join(tmp, "sprechen.ps1")
    open(jf, "w", encoding="utf-8").write("\n".join(f"{p}\t{s}" for p, s in jobs))
    open(pf, "w", encoding="utf-8-sig").write(PS)
    r = subprocess.run(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", pf, jf], capture_output=True, text=True)
    if "FERTIG" not in r.stdout:
        sys.exit("Sprachausgabe fehlgeschlagen (ist die Stimme '%s' installiert?)\n%s" % (VOICE, r.stdout + r.stderr))

    os.makedirs(OUT, exist_ok=True)
    total = 0
    for path, syl in jobs:
        w = wave.open(path); fr, n = w.getframerate(), w.getnframes(); data = w.readframes(n); w.close()
        s = struct.unpack("<%dh" % n, data)
        thr = 400                                            # Stille vorne/hinten abschneiden
        a = next((i for i, x in enumerate(s) if abs(x) > thr), 0)
        b = n - next((i for i, x in enumerate(reversed(s)) if abs(x) > thr), 0)
        seg = s[max(0, a - int(.03 * fr)):min(n, b + int(.06 * fr))]
        out = os.path.join(OUT, os.path.basename(path))
        o = wave.open(out, "wb"); o.setnchannels(1); o.setsampwidth(2); o.setframerate(fr)
        o.writeframes(struct.pack("<%dh" % len(seg), *seg)); o.close()
        total += os.path.getsize(out)
        d = len(seg) / fr
        if d < .12 or d > 1.2: print("auffällige Länge:", os.path.basename(out), syl, round(d, 2), "s")
        os.remove(path)

    counts = {w: len(syls) for w, syls in words}
    with open(os.path.join(OUT, "silben.js"), "w", encoding="utf-8") as f:
        f.write('// Automatisch erzeugt: Silben als Tondateien (Stimme "Katja", exakte Lautschrift).\n')
        f.write("// Wort -> Anzahl Silben. Datei: silben/<wort>-<nr>.wav\n")
        f.write("window.SYL_AUDIO = " + json.dumps(counts, ensure_ascii=False) + ";\n")
        f.write("// Einzelne Tondateien: Buchstabennamen (buchstabe-x) und ganze Wörter (wort-...). Datei: silben/<name>.wav\n")
        f.write("window.CLIPS = " + json.dumps(singles) + ";\n")
    print(f"{len(jobs)} Tondateien ({len(singles)} einzeln), {total // 1024} KB -> {OUT}")


if __name__ == "__main__":
    main()
