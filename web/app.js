"use strict";
// =====================================================================
//  ABC-Abenteuer – Lese- und Schreiblernprogramm für Augensteuerung
// =====================================================================

const $ = s => document.querySelector(s);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const u = n => `calc(${n} * var(--u))`;        // Maß relativ zur Bildflächen-Höhe (wie vh)
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// ---------------------------------------------------------------------
//  Feste Bildfläche passend skalieren (verhindert Auflösungsprobleme)
// ---------------------------------------------------------------------
const STAGE_W = 1920, STAGE_H = 1080;
// Bevorzugt CSS-"zoom" (Browser zeichnet direkt in Zielgröße, keine skalierte
// Grafikebene -> kein Flackern). Nur falls nicht unterstützt: transform.
const USE_ZOOM = window.CSS && CSS.supports && CSS.supports("zoom", "0.5");
let fitQueued = false, lastW = 0, lastH = 0;
function fit() {
  fitQueued = false;
  const w = document.documentElement.clientWidth || window.innerWidth;
  const h = document.documentElement.clientHeight || window.innerHeight;
  if (!w || !h) return;
  lastW = w; lastH = h;
  // auf 1/1000 runden, damit keine "krummen" Zwischenwerte entstehen
  const s = Math.floor(Math.min(w / STAGE_W, h / STAGE_H) * 1000) / 1000;
  const app = $("#app");
  if (USE_ZOOM) {
    app.style.zoom = s;
  } else {
    app.classList.add("use-transform");
    const x = Math.round((w - STAGE_W * s) / 2), y = Math.round((h - STAGE_H * s) / 2);
    app.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
  }
}
function queueFit() { if (!fitQueued) { fitQueued = true; requestAnimationFrame(fit); } }
window.addEventListener("resize", queueFit);
document.addEventListener("fullscreenchange", () => { queueFit(); setTimeout(fit, 300); setTimeout(fit, 1000); });
if (window.visualViewport) visualViewport.addEventListener("resize", queueFit);
// Sicherheitsnetz: Edge meldet beim Wechsel ins Vollbild nicht immer jede Größenänderung
setInterval(() => {
  const w = document.documentElement.clientWidth, h = document.documentElement.clientHeight;
  if (w !== lastW || h !== lastH) fit();
}, 700);
fit();

// ---------------------------------------------------------------------
//  Speicher & Einstellungen
// ---------------------------------------------------------------------
// Programmversion – bei größeren Änderungen erhöhen (erscheint auf dem Startbildschirm, in den Einstellungen und in der Anleitung)
const APP_VERSION = "2.3", APP_DATE = "14.11.2026";
const SETTINGS_VERSION = 6;
const DEFAULTS = {
  v: SETTINGS_VERSION,
  dwell: false,   // Auswahl nur per Klick – das Verweilen übernimmt die Tobii-Software (Linksklick)
  dwellMs: 1200, dwellBigMs: 1800, dot: false, hideCursor: false, mouseGuard: true,
  voice: "", rate: 0.85, hoverSay: true, sfx: true, muted: false,
  round: 5, letterCase: "upper", sylColor: true, allLevels: false,
  manualNext: false, balloonSpeed: 1, autoFull: true, eyeOn: true, eyeClickLock: "td", speechPause: true, lens: true,
  volume: 100, unlockRounds: 3,
  letters: DEFAULT_LETTERS.slice(), talk: DEFAULT_TALK,
};
// Gerätweite Werte (Profil-Liste, aktuelles Profil)
// Meldung ins Fehlerprotokoll des Programms (protokoll.txt) – im Browser nur in die Konsole
function hostLog(text) {
  try { if (window.chrome && window.chrome.webview) window.chrome.webview.postMessage({ t: "log", text: String(text).slice(0, 500) }); else console.warn(text); } catch (e) { }
}
window.JS_ERRORS = 0; window.CSP_VIOLATIONS = 0;
window.addEventListener("error", e => { window.JS_ERRORS++; hostLog("JS-Fehler: " + e.message + " (Zeile " + e.lineno + ")"); });
window.addEventListener("unhandledrejection", e => { window.JS_ERRORS++; hostLog("JS-Fehler (Promise): " + (e.reason && e.reason.message || e.reason)); });
document.addEventListener("securitypolicyviolation", e => { window.CSP_VIOLATIONS++; hostLog("Sicherheitsrichtlinie blockiert: " + e.violatedDirective + " " + e.blockedURI); });

// Speicher: Fehler (voll, gesperrt, nicht verfügbar) werden erkannt und angezeigt
const Store = { ok: true, warned: false };
try { localStorage.setItem("abc__test", "1"); localStorage.removeItem("abc__test"); } catch (e) { Store.ok = false; }
window.STORAGE_OK = Store.ok;
function storageProblem(err, key) {
  Store.ok = false; window.STORAGE_OK = false;
  hostLog("Speichern fehlgeschlagen (" + key + "): " + (err && err.name || err));
  if (Store.warned) return;
  Store.warned = true;
  setTimeout(() => {
    const msg = "⚠ Speichern nicht möglich – Lernstand und Einstellungen gehen beim Beenden verloren. (Speicher voll oder gesperrt)";
    try { toast(msg); } catch (e) { }
    const n = document.getElementById("storageWarn"); if (n) { n.textContent = msg; n.style.display = ""; }
  }, 500);
}
function gload(key, def) {
  let v;
  try { v = localStorage.getItem("abc_" + key); } catch (e) { storageProblem(e, key); return def; }
  if (!v) return def;
  try { return JSON.parse(v); } catch (e) { hostLog("Gespeicherte Daten beschädigt (" + key + ") – Standard wird verwendet"); return def; }
}
function gsave(key, v) {
  try { localStorage.setItem("abc_" + key, JSON.stringify(v)); return true; }
  catch (e) { storageProblem(e, key); return false; }
}
if (!Store.ok) storageProblem("nicht verfügbar", "Start");

// ---------- (12) Profile und gespeicherte Daten beim Laden prüfen ----------
const isObj = x => x && typeof x === "object" && !Array.isArray(x);
const PROFILE_ID = /^(default|[a-z0-9]{1,24})$/;
function cleanProfiles(p) {
  const out = { on: !!(p && p.on), list: [] }, seen = new Set();
  (Array.isArray(p && p.list) ? p.list : []).forEach(x => {
    if (!isObj(x) || typeof x.id !== "string" || !PROFILE_ID.test(x.id) || seen.has(x.id) || out.list.length >= 12) return;
    seen.add(x.id);
    out.list.push({ id: x.id, name: (typeof x.name === "string" && x.name.trim() ? x.name.trim() : "Kind").slice(0, 20),
                    emoji: typeof x.emoji === "string" && x.emoji.trim() ? x.emoji.trim().slice(0, 8) : "🙂" });
  });
  if (!out.list.length) out.list.push({ id: "default", name: "Kind 1", emoji: "🦊" });
  return out;
}
function cleanStats(x) {
  const out = {};
  if (isObj(x)) Object.keys(x).forEach(k => {
    const v = x[k];
    if (/^[A-ZÄÖÜ]$/.test(k) && isObj(v)) out[k] = { r: Math.max(0, Math.floor(+v.r) || 0), w: Math.max(0, Math.floor(+v.w) || 0) };
  });
  return out;
}
const cleanStickers = x => (Array.isArray(x) ? x : []).filter(v => typeof v === "string" && v.length <= 12).slice(-1000);
function cleanLevels(x) {
  const out = {};
  if (isObj(x)) Object.keys(x).forEach(k => {
    const v = x[k];
    if (/^[a-z]{2,12}$/.test(k) && isObj(v)) out[k] = { max: Math.min(3, Math.max(1, Math.floor(+v.max) || 1)), good: Math.min(10, Math.max(0, Math.floor(+v.good) || 0)) };
  });
  return out;
}
function cleanRecent(x) {
  const out = {};
  if (isObj(x)) Object.keys(x).forEach(k => { if (k.length <= 30 && Array.isArray(x[k])) out[k] = x[k].filter(v => typeof v === "string" && v.length <= 60).slice(-80); });
  return out;
}
// Profile (optional): Einstellungen, Lernstand, Stufen, Sticker und Mitteil-Tafel je Kind.
// Das erste Profil ("default") nutzt die bisherigen Speicherplätze – nichts geht verloren.
const PROFILES = cleanProfiles(gload("profiles", null));
let PROFILE = gload("profile", "default");
if (typeof PROFILE !== "string" || !PROFILES.list.some(p => p.id === PROFILE)) PROFILE = PROFILES.list[0].id;
const profileName = () => (PROFILES.list.find(p => p.id === PROFILE) || {}).name || "";
const pkey = key => PROFILE === "default" ? key : "p_" + PROFILE + "_" + key;
function load(key, def) { return gload(pkey(key), def); }
function save(key, v) { gsave(pkey(key), v); }
const SAVED = load("settings", {});
const S = Object.assign({}, DEFAULTS, SAVED);
if ((SAVED.v || 1) < 2) S.dwell = false;
if ((SAVED.v || 1) < 3 && /multilingual/i.test(S.voice || "")) S.voice = "";   // mehrsprachige Stimme zurücksetzen
if ((SAVED.v || 1) < 4 && typeof S.talk === "string")      // Mieder: Korsett-Bild statt Weste
  S.talk = S.talk.replace(/🦺➕/g, "[mieder_an]").replace(/🦺➖/g, "[mieder_aus]");
// v6: neuer Standard für alle – nur Klicks von TD Control sperren, Betreuer dürfen immer klicken
if ((SAVED.v || 1) < 6) S.eyeClickLock = "td";
sanitizeSettings(S);
if ((SAVED.v || 1) < SETTINGS_VERSION) { S.v = SETTINGS_VERSION; save("settings", S); }
let stats = cleanStats(load("stats", {}));
let stickers = cleanStickers(load("stickers", []));
let levels = cleanLevels(load("levels", {}));     // { spielId: { max: 1..3, good: 0..10 } }
let recent = cleanRecent(load("recent", {}));     // zuletzt benutzte Wörter je Spiel (für Abwechslung)

// Jeder gespeicherte Wert wird geprüft – Ungültiges fällt auf den Standard zurück
function sanitizeSettings(o) {
  const num = (k, min, max, int) => { let v = +o[k]; if (!isFinite(v)) v = DEFAULTS[k]; v = Math.min(max, Math.max(min, v)); o[k] = int ? Math.round(v) : v; };
  const oneOf = (k, list) => { if (!list.includes(o[k])) o[k] = DEFAULTS[k]; };
  num("dwellMs", 400, 4000, true); num("dwellBigMs", 400, 4000, true);
  num("rate", 0.5, 1.3); num("volume", 10, 100, true); num("unlockRounds", 1, 5, true);
  oneOf("round", [3, 4, 5, 6, 8, 10]); oneOf("balloonSpeed", [0.4, 0.65, 1, 1.4]);
  oneOf("letterCase", ["upper", "mixed", "lower"]); oneOf("eyeClickLock", ["td", "eyes", "always", false]);
  ["dwell", "dot", "hideCursor", "mouseGuard", "hoverSay", "sfx", "muted", "sylColor", "allLevels", "manualNext", "autoFull", "speechPause", "lens", "eyeOn"]
    .forEach(k => { o[k] = typeof o[k] === "boolean" ? o[k] : DEFAULTS[k]; });
  o.voice = typeof o.voice === "string" ? o.voice.slice(0, 200) : "";
  const L = Array.isArray(o.letters) ? [...new Set(o.letters.filter(x => typeof x === "string" && ALPHABET.includes(x)))] : [];
  o.letters = L.length >= 2 ? L : DEFAULT_LETTERS.slice();
  o.talk = typeof o.talk === "string" && o.talk.length <= 5000 && o.talk.trim() ? o.talk : DEFAULT_TALK;
  return o;
}

function stat(L, ok) {
  if (!L) return;
  L = L.toUpperCase();
  const s = stats[L] || (stats[L] = { r: 0, w: 0 });
  ok ? s.r++ : s.w++;
  save("stats", stats);
}

// ---------------------------------------------------------------------
//  Schreibweise
// ---------------------------------------------------------------------
// Buchstabe zum Sprechen: als Großbuchstabe – eine rein deutsche Stimme liest ihn richtig ("L" -> "Ell")
const LN = L => L.toUpperCase();
function fw(w) { return S.letterCase === "upper" ? w.toUpperCase() : S.letterCase === "lower" ? w.toLowerCase() : w; }
function fl(L) { return S.letterCase === "upper" ? L : S.letterCase === "lower" ? L.toLowerCase() : L + L.toLowerCase(); }
function fc(L) { return S.letterCase === "upper" ? L.toUpperCase() : L.toLowerCase(); }
const art = w => `${w.g} ${w.w}`;                       // "die Maus"
const verb = (w, sg, pl) => w.pl ? pl : sg;              // "fängt" / "fangen"

function sylHTML(o) {
  const parts = o.s.split("-");
  if (!S.sylColor || parts.join("") !== o.w) return esc(fw(o.w));
  return parts.map((p, i) => {
    const txt = S.letterCase === "upper" ? p.toUpperCase() : S.letterCase === "lower" ? p.toLowerCase() : p;
    return `<span style="color:${i % 2 ? "#e0504f" : "#2f6fd6"}">${esc(txt)}</span>`;
  }).join("");
}

// ---------------------------------------------------------------------
//  Wortauswahl & Abwechslung
// ---------------------------------------------------------------------
const first = w => w.w[0].toUpperCase();
const last = w => w.w[w.w.length - 1].toUpperCase();
function letters() { return S.letters && S.letters.length ? S.letters : DEFAULT_LETTERS; }
function anlautWords(L) { return WORDS.filter(w => w.a !== false && first(w) === L); }
function lettersWithWords() {
  const l = letters().filter(L => anlautWords(L).length);
  return l.length ? l : DEFAULT_LETTERS;
}
function onlyKnown(list) { const set = new Set(letters()); return list.filter(w => [...w.w.toUpperCase()].every(c => set.has(c))); }
function soundAlike(L) { const g = SOUND_ALIKE.find(g => g.includes(L)); return g ? g.filter(x => x !== L) : []; }
// Wie viele Buchstaben eines Wortes wurden noch nicht geübt?
function unknownCount(w) { const set = new Set(letters()); return [...w.w.toUpperCase()].filter(c => !set.has(c)).length; }
// Stufenweise Wortauswahl: erst nur bekannte Buchstaben – reicht das nicht für
// genug Abwechslung, sind auch Wörter mit 1 (bzw. 2) neuen Buchstaben erlaubt.
function poolByLevel(list, min) {
  const tiers = G.level === 1 ? [0, 1, 99] : G.level === 2 ? [1, 2, 99] : [99];
  for (const k of tiers) { const p = list.filter(w => unknownCount(w) <= k); if (p.length >= min) return p; }
  return list;
}
function readingWords(maxLen = 99, min = 4) {
  const list = WORDS.filter(w => w.w.length <= maxLen);
  return poolByLevel(list.length >= min ? list : WORDS, Math.max(min, 10));
}
function writeWords(maxLen) {
  const fits = w => w.lg && new Set(w.w.toUpperCase()).size <= 6;   // höchstens 6 Kacheln
  let lg = WORDS.filter(w => fits(w) && w.w.length <= maxLen);
  if (lg.length < 8) lg = WORDS.filter(fits);
  return poolByLevel(lg, 8);
}
// Wort wählen: nicht in dieser Runde und möglichst nicht in den letzten Runden
function pickFresh(arr, used, key = G.game) {
  const rec = (recent[key] || []).filter(x => x !== undefined);
  let cand = arr.filter(w => !used.has(w.w));
  if (!cand.length) cand = arr;
  const fresh = cand.filter(w => !rec.includes(w.w));
  let w;
  if (fresh.length) w = pick(fresh);
  else {
    // alle schon dagewesen: das am längsten nicht mehr benutzte Wort nehmen
    w = cand.reduce((a, b) => rec.lastIndexOf(a.w) <= rec.lastIndexOf(b.w) ? a : b);
  }
  used.add(w.w);
  const i = rec.indexOf(w.w); if (i >= 0) rec.splice(i, 1);
  rec.push(w.w);
  while (rec.length > 80) rec.shift();
  recent[key] = rec;
  save("recent", recent);
  return w;
}
// Buchstaben wählen: nicht zweimal hintereinander, schwierige etwas häufiger
function nextLetter(used) {
  let pool = lettersWithWords().filter(L => !used.has("L:" + L) && L !== G.lastLetter);
  if (!pool.length) pool = lettersWithWords().filter(L => L !== G.lastLetter);
  if (!pool.length) pool = lettersWithWords();
  const weights = pool.map(L => { const s = stats[L] || { r: 0, w: 0 }; return 1 + 2 * s.w / (s.r + s.w + 1); });
  let x = Math.random() * weights.reduce((a, b) => a + b, 0);
  let L = pool[0];
  for (let i = 0; i < pool.length; i++) { x -= weights[i]; if (x <= 0) { L = pool[i]; break; } }
  used.add("L:" + L);
  G.lastLetter = L;
  return L;
}
// Ablenker-Buchstaben: Stufe 1–2 gut unterscheidbar, Stufe 3 ähnlich
function distractLetters(L, n, { similar = false, exclude = [] } = {}) {
  const ex = new Set([L, ...exclude.map(x => x.toUpperCase()), ...soundAlike(L)]);
  const sim = SIMILAR[L] || [];
  let pool = similar ? shuffle(sim.filter(x => !ex.has(x))) : [];
  const allowed = x => !ex.has(x) && !pool.includes(x) && (similar || !sim.includes(x));
  pool = pool.concat(shuffle(letters().filter(allowed)));
  if (pool.length < n) pool = pool.concat(shuffle(ALPHABET.filter(allowed)));
  if (pool.length < n) pool = pool.concat(shuffle(ALPHABET.filter(x => !ex.has(x) && !pool.includes(x))));
  return pool.slice(0, n);
}
// ---------------------------------------------------------------------
//  Schutz vor unpassenden Buchstabenfolgen
//  Liegen Buchstaben nebeneinander (Kacheln, Antworten, Memory), dürfen sie
//  von links nach rechts gelesen keine dieser Folgen ergeben.
// ---------------------------------------------------------------------
const BAD_SEQ = [
  "SS", "SA", "SD", "HH", "HJ", "NS", "KZ", "AH", "18", "88", "KKK",
  "HAIL", "HEIL", "SIEG", "NAZI", "NSDAP", "HITLER", "FÜHRER", "WAFFE", "JUDE", "NEGER", "ZIGEUNER",
  "FICK", "FUCK", "ARSCH", "SEX", "PENIS", "PIMMEL", "MUSCHI", "TITTE", "KACK", "SCHEISS", "SHIT",
  "HURE", "NUTTE", "TOD", "TOT", "KILL", "MORD", "GAS", "BLUT", "DOOF", "BLÖD", "IDIOT", "DUMM",
];
function isBadSeq(str) {
  const s = String(str).toUpperCase().replace(/[^A-ZÄÖÜ0-9]/g, "");
  return BAD_SEQ.some(b => s.includes(b));
}
// Reihenfolge so lange neu mischen, bis keine unpassende Folge entsteht
function safeOrder(arr, toStr = x => x) {
  let a = shuffle(arr);
  for (let i = 0; i < 200 && isBadSeq(a.map(toStr).join("")); i++) a = shuffle(arr);
  return a;
}

// Abwechselnde Aufgabenarten innerhalb einer Runde
function nextMode(modes) {
  if (!G.modeQueue || !G.modeQueue.length) G.modeQueue = shuffle(modes);
  return G.modeQueue.shift();
}

// ---------------------------------------------------------------------
//  Stufen
// ---------------------------------------------------------------------
const LV = {
  anlaut:  [null, { n: 2, modes: ["pic2letter", "letter2pic"] },
                  { n: 3, modes: ["pic2letter", "letter2pic"] },
                  { n: 4, similar: true, modes: ["pic2letter", "letter2pic", "endlaut"] }],
  hear:    [null, { n: 2, pic: true }, { n: 3, pic: true }, { n: 4, similar: true, pic: false }],
  read:    [null, { n: 2, maxLen: 4, modes: ["word2pic"] },
                  { n: 3, maxLen: 6, modes: ["word2pic", "pic2word"] },
                  { n: 4, maxLen: 99, sameStart: true, modes: ["word2pic", "pic2word"] }],
  // Sätze lesen: Stufe 1 "Maus und Käse" (2 Bilder), Stufe 2 "Die Maus hat einen Käse." (3 Bilder),
  // Stufe 3 "Der Fisch ist blau." mit Farbbildern (4 Bilder, nur ein Wort anders)
  sent:    [null, { n: 2, kind: "and" }, { n: 3, kind: "has" }, { n: 4, kind: "color" }],
  write:   [null, { maxLen: 4, template: "always", extra: 1 },
                  { maxLen: 5, template: "hint", extra: 2 },
                  { maxLen: 99, template: "never", extra: 3 }],
  syll:    [null, { n: 2, maxSyl: 2 }, { n: 3, maxSyl: 3 }, { n: 4, maxSyl: 4 }],
  memory:  [null, { pairs: 3, kind: "letter" }, { pairs: 4, kind: "letter" }, { pairs: 6, kind: "word" }],
  // Silben-Puzzle: Stufe 1 zwei Silben mit Vorlage, Stufe 2 bis 3 Silben + 1 falscher Stein,
  // Stufe 3 drei bis vier Silben + 2 ähnliche falsche Steine, ohne Vorlage
  puzzle:  [null, { minSyl: 2, maxSyl: 2, extra: 0, ghost: "always" },
                  { minSyl: 2, maxSyl: 3, extra: 1, ghost: "hint" },
                  { minSyl: 3, maxSyl: 4, extra: 2, ghost: "never", similar: true }],
  balloon: [null, { speed: 0.8 }, { speed: 1.0 }, { speed: 1.4, similar: true }],
  // Farben: Stufe 1 wird das Wort vorgelesen, ab Stufe 2 selbst lesen
  color:   [null, { n: 2, colors: 6, readAloud: true, modes: ["paint", "pick"] },
                  { n: 3, colors: 10, readAloud: false, modes: ["paint", "pick", "word"] },
                  { n: 4, colors: 10, readAloud: false, similar: true, modes: ["mix", "mix", "paint", "word", "pick"] }],
};
const LEVEL_TEXT = ["", "leicht", "mittel", "schwer"];
function maxLevel(id) { return S.allLevels ? 3 : ((levels[id] && levels[id].max) || 1); }
const stars = n => "⭐".repeat(n);

// ---------------------------------------------------------------------
//  Sprachausgabe
// ---------------------------------------------------------------------
const Speech = { voices: [], kind: null, seq: 0 };
const SylAudio = { cur: null };   // gerade laufende Silben-Tondatei
// Stimmen der Windows-Sprachausgabe (SAPI), z. B. die Acapela-Stimmen auf Tobii-Geräten – spricht das Programm selbst
const NativeTTS = { voices: [], cur: null };
function stopClip() {
  const a = SylAudio.cur; SylAudio.cur = null;
  if (a) { try { a.pause(); } catch (e) { } if (a._fin) a._fin(); }
}
function loadVoices() {
  if (!window.speechSynthesis) return;
  const all = speechSynthesis.getVoices();
  Speech.voices = all.filter(v => /^de/i.test(v.lang));
  if (!Speech.voices.length) Speech.voices = all;
  fillVoiceSelect();
}
// Mehrsprachige Stimmen ("Multilingual") raten bei kurzen Silben die Sprache und
// sprechen sie dann oft englisch aus (z. B. "Lu-pi" statt "Lu-pe"). Deshalb werden
// rein deutsche Stimmen bevorzugt.
const isMulti = v => /multilingual|mehrsprachig/i.test(v.name);
function germanVoice() {
  const de = Speech.voices.filter(v => /^de/i.test(v.lang) && !isMulti(v))
    .sort((a, b) => (/de-DE/i.test(b.lang) ? 1 : 0) - (/de-DE/i.test(a.lang) ? 1 : 0));   // Deutschland zuerst
  return de.find(v => /natural/i.test(v.name) && /katja|amala|louisa/i.test(v.name))
    || de.find(v => /natural/i.test(v.name) && /conrad|killian/i.test(v.name))
    || de.find(v => /natural/i.test(v.name))
    || de.find(v => /google/i.test(v.name))
    || de.find(v => /katja|hedda|stefan/i.test(v.name))
    || de[0]
    || Speech.voices.find(v => /^de/i.test(v.lang))
    || Speech.voices[0] || null;
}
function bestVoice() {
  if (S.voice) { const v = Speech.voices.find(v => v.name === S.voice); if (v) return v; }
  return germanVoice();
}
function talking(on) { document.querySelectorAll(".mascot").forEach(m => m.classList.toggle("talking", on)); }
// opts.force: auch bei "Ton aus" sprechen (Mitteil-Tafel). opts.onWord(charIndex): Wortgrenzen
// Aussprache-Korrekturen für die Sprachausgabe (geschrieben bleibt alles richtig)
const SPEAK_FIX = [[/\bLolli\b/g, "Lollie"], [/\b[Oo]range\b/g, "Orangsch"]];   // sonst sprechen die Windows-Stimmen "Lahli"
function speakFix(t) { return SPEAK_FIX.reduce((x, [re, to]) => x.replace(re, to), String(t)); }
function say(text, kind = "talk", rateF = 1, opts = {}) {
  text = text && speakFix(text);
  return new Promise(resolve => {
    if (!text) { resolve(); return; }
    // Ist die Mitteil-Tafel offen, schweigt die Übung (nur die Tafel selbst spricht)
    const talkOpen = !opts.force && $("#talk").classList.contains("show");
    if ((S.muted && !opts.force) || talkOpen || !window.speechSynthesis) {
      setTimeout(resolve, Math.min(1500, 300 + text.length * 25));
      return;
    }
    const my = ++Speech.seq;
    speechSynthesis.cancel();
    stopClip();
    if (NativeTTS.cur) { const c = NativeTTS.cur; NativeTTS.cur = null; Native.post({ t: "stop" }); c.fin(); }
    if (nativeVoice()) {
      // Stimme der Windows-Sprachausgabe (z. B. Tobii/Acapela) – spricht das Programm selbst
      let done = false;
      const fin = () => {
        if (done) return; done = true;
        if (Speech.seq === my) { Speech.kind = null; talking(false); }
        resolve();
      };
      NativeTTS.cur = { id: my, fin, onWord: opts.onWord };
      Native.post({ t: "speak", id: my, text, voice: S.voice.slice(5), rate: S.rate * rateF, volume: Math.round(vol01() * 100) });
      setTimeout(fin, 3000 + text.length * 150 / (S.rate * rateF));
      Speech.kind = kind; talking(true);
      return;
    }
    const ut = new SpeechSynthesisUtterance(text);
    ut.lang = "de-DE";
    // Silben und einzelne Buchstaben immer mit einer rein deutschen Stimme
    const v = (opts.german || text.replace(/[^A-Za-zÄÖÜäöü]/g, "").length <= 2) ? germanVoice() : bestVoice();
    if (v) { ut.voice = v; ut.lang = v.lang; }
    ut.rate = S.rate * rateF;
    ut.pitch = 1.05;
    ut.volume = vol01();
    let done = false;
    const fin = () => {
      if (done) return; done = true;
      if (Speech.seq === my) { Speech.kind = null; talking(false); }
      resolve();
    };
    ut.onend = fin; ut.onerror = fin;
    if (opts.onWord) ut.onboundary = e => { if (Speech.seq === my && (!e.name || e.name === "word")) opts.onWord(e.charIndex); };
    setTimeout(fin, 2500 + text.length * 120 / (S.rate * rateF));
    Speech.kind = kind; talking(true);
    setTimeout(() => { if (Speech.seq === my) speechSynthesis.speak(ut); else fin(); }, 40);
  });
}
function stopSpeech() {
  Speech.seq++; Speech.kind = null; talking(false);
  if (NativeTTS.cur) { const c = NativeTTS.cur; NativeTTS.cur = null; Native.post({ t: "stop" }); c.fin(); }
  if (window.speechSynthesis) speechSynthesis.cancel();
  stopClip();
}
if (window.speechSynthesis) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }

// Silben so vorbereiten, dass sie als Silben (nicht als Buchstaben) gesprochen werden:
//  - offene Silben bekommen ein Dehnungs-h:  "Lu" -> "Luh", "pe" -> "Peh", "bee" -> "Beh"
//  - einzelne Vokale ebenso:                  "A" -> "Ah", "I" -> "Ih"
//  - alles in EINEM Satz mit Pausen, großer Anfangsbuchstabe, rein deutsche Stimme
function sylSpeak(p) {
  let x = p.toLowerCase().replace(/^ck/, "k");
  if (/ee$/.test(x)) x = x.slice(0, -2) + "eh";
  else if (/(ie|ei|ai|au|eu|äu)$/.test(x)) { /* Doppellaut – bleibt */ }
  else if (/[aeiouäöü]$/.test(x)) x += "h";
  return x.charAt(0).toUpperCase() + x.slice(1);
}
function sylTokens(w) {
  return (w.sp || w.s).split("-").map(sylSpeak);
}
// Silben aus Tondateien (silben/*.wav, mit exakter Lautschrift erzeugt) – klingen immer richtig.
// Für Wörter ohne Tondatei wird die Sprachausgabe benutzt.
const slugW = s => s.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z]/g, "");
function playClip(src) {
  return new Promise(res => {
    const a = new Audio(src);
    a.volume = vol01();
    SylAudio.cur = a;
    let done = false;
    const fin = ok => { if (done) return; done = true; res(ok); };
    a._fin = () => fin(true);
    a.onended = () => fin(true);
    a.onerror = () => fin(false);
    a.play().catch(() => fin(false));
    setTimeout(() => fin(true), 2500);
  });
}
async function saySyllables(w, onIdx) {
  const n = window.SYL_AUDIO && SYL_AUDIO[w.w];
  const talkOpen = $("#talk").classList.contains("show");
  if (n && !S.muted && !talkOpen) {
    stopSpeech();
    const my = Speech.seq;
    talking(true); Speech.kind = "talk";
    let i = 0;
    for (; i < n; i++) {
      if (Speech.seq !== my) break;
      if (onIdx) onIdx(i);
      const ok = await playClip(`silben/${slugW(w.w)}-${i + 1}.wav`);
      if (!ok && i === 0) break;                 // Datei fehlt -> Sprachausgabe
      if (Speech.seq !== my) break;
      if (i < n - 1) await sleep(380);
    }
    if (Speech.seq === my) { talking(false); Speech.kind = null; }
    if (i >= n || Speech.seq !== my) return n - 1;
  }
  return saySyllablesTTS(w, onIdx);
}
async function saySyllablesTTS(w, onIdx) {
  const toks = sylTokens(w);
  let text = "";
  const starts = [];
  toks.forEach((t, i) => { if (i) text += " ... "; starts.push(text.length); text += t; });
  let lastIdx = -1;
  await say(text, "talk", 0.8, {
    german: true,
    onWord: ci => {
      let idx = 0;
      for (let i = 0; i < starts.length; i++) if (ci >= starts[i]) idx = i;
      if (idx !== lastIdx) { lastIdx = idx; if (onIdx) onIdx(idx); }
    },
  });
  return lastIdx;
}

// ---------------------------------------------------------------------
//  Geräusche (werden erzeugt, keine Dateien nötig)
// ---------------------------------------------------------------------
let actx = null;
function audio() {
  if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
  if (actx.state === "suspended") actx.resume();
  return actx;
}
const vol01 = () => Math.max(0, Math.min(1, (S.volume == null ? 100 : S.volume) / 100));
function tone(f, t0, dur, type = "sine", vol = .15, f2 = null) {
  if (!S.sfx || S.muted) return;
  const c = audio(); if (!c) return;
  const t = c.currentTime + t0;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol * vol01()), t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(c.destination);
  o.start(t); o.stop(t + dur + .05);
}
function noise(t0, dur, vol = .3) {
  if (!S.sfx || S.muted) return;
  const c = audio(); if (!c) return;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  const src = c.createBufferSource(), g = c.createGain(), fil = c.createBiquadFilter();
  fil.type = "bandpass"; fil.frequency.value = 1500;
  src.buffer = buf; g.gain.value = vol * vol01();
  src.connect(fil); fil.connect(g); g.connect(c.destination);
  src.start(c.currentTime + t0);
}
const SFX = {
  select: () => tone(880, 0, .08, "triangle", .07),
  success: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * .08, .3, "triangle", .15)),
  wrong: () => { tone(300, 0, .18, "sine", .15, 200); tone(200, .16, .3, "sine", .12, 150); },
  pop: () => { noise(0, .12, .5); tone(700, 0, .1, "square", .06, 150); },
  flip: () => tone(500, 0, .12, "triangle", .1, 800),
  clap: () => noise(0, .09, .6),
  fanfare: () => [[523, 0], [523, .15], [523, .3], [659, .45], [784, .75], [659, .95], [784, 1.1], [1047, 1.3]]
    .forEach(([f, t]) => tone(f, t, .38, "triangle", .15)),
};

// ---------------------------------------------------------------------
//  Auswahl: Klick (Standard) – optional programmeigenes Verweilen
// ---------------------------------------------------------------------
const GRACE = 220;
const Gaze = { x: -1, y: -1, target: null, start: 0, lostAt: 0, firedEl: null, lastFire: 0, hoverTimer: null, last: 0 };
function onSelect(el, fn) { el._onSelect = fn; return el; }

// ---------------------------------------------------------------------
//  Eigenständiges Programm (ABC-Abenteuer.exe): Blick kommt DIREKT von der Tobii-Kamera.
//  Dann reicht Anschauen (ohne Zeiger, ohne Klick); die Maus wählt nur per Klick aus.
// ---------------------------------------------------------------------
const Native = { on: !!(window.chrome && window.chrome.webview), eye: false, lastEye: 0, n: 0, paused: false };
Native.post = msg => { try { window.chrome.webview.postMessage(msg); } catch (e) { } };
const eyeMode = () => Native.eye;          // Augensteuerung ist immer aktiv (Pause nur über ⏸️)
// Klick-Regel: "td" = nur Klicks von TD Control sperren (Betreuer-Klicks immer erlaubt; filtert das Programm),
// "eyes" = alle Klicks sperren, solange Augen erkannt werden, "always" = immer sperren, "off" = erlauben
const clickMode = () => S.eyeClickLock === false ? "off" : S.eyeClickLock === "always" ? "always" : S.eyeClickLock === true || S.eyeClickLock === "eyes" ? "eyes" : "td";
function sendClickPolicy() { if (Native.on) Native.post({ t: "clickpolicy", mode: clickMode(), eye: eyeMode() }); }
const eyesSeen = () => eyeMode() && performance.now() - Native.lastEye < 600;
const nativeVoice = () => Native.on && S.voice && S.voice.indexOf("sapi:") === 0 && NativeTTS.voices.some(v => "sapi:" + v.name === S.voice);
const dwellOn = () => S.dwell || eyeMode();
if (Native.on) {
  document.documentElement.classList.add("native");
  window.chrome.webview.addEventListener("message", ev => {
    const m = ev.data;
    if (!m) return;
    if (m.t === "toast") { toast(m.text); return; }
    if (m.t === "backupdone") { if (m.ok) toast("💾 Sicherung gespeichert"); else if (!m.cancelled) toast("⚠ Sicherung fehlgeschlagen: " + (m.error || "")); return; }
    if (m.t === "restoredata") { if (m.ok) restoreBackup(m.data); else toast("⚠ Sicherung konnte nicht gelesen werden: " + (m.error || "")); return; }
    if (m.t === "blocked") { Native.blocked = m.n; return; }
    if (m.t === "focus") {
      Native.active = !!m.active;
      if (!m.active) { Gaze.x = -1; Gaze.y = -1; Mouse.hist.length = 0; if (Gaze.target) { Gaze.target.style.setProperty("--dwell", 0); setTarget(null, performance.now()); } }
      return;
    }
    if (m.t === "voices") { NativeTTS.voices = m.list || []; fillVoiceSelect(); return; }
    if (m.t === "config") { const cb = $("#setNoGpu"); if (cb) cb.checked = !!m.nogpu; return; }
    if (m.t === "word") { const c = NativeTTS.cur; if (c && c.id === m.id && Speech.seq === m.id && c.onWord) c.onWord(m.pos); return; }
    if (m.t === "end") { const c = NativeTTS.cur; if (c && c.id === m.id) { NativeTTS.cur = null; c.fin(); } return; }
    if (m.t !== "gaze") return;
    const now = performance.now();
    Native.n++; Native.lastEye = now;
    if (!Native.eye) { Native.eye = true; applyS(); sendClickPolicy(); toast("👁 Augensteuerung verbunden – Anschauen wählt aus"); }
    const x = m.x * window.innerWidth, y = m.y * window.innerHeight;
    Gaze.x = x; Gaze.y = y;
    Mouse.hist.push({ t: now, x, y });
    while (Mouse.hist.length && Mouse.hist[0].t < now - 800) Mouse.hist.shift();
    if (S.dot) { const d = $("#gazeDot"); d.style.left = x + "px"; d.style.top = y + "px"; }
  });
  // keine Augen erkannt (weggeschaut, Kopf gedreht): Blick gilt als "nirgends"
  setInterval(() => { if (eyeMode() && performance.now() - Native.lastEye > 350) { Gaze.x = -1; Gaze.y = -1; } }, 150);
}

// Maus-Erkennung (nur relevant, wenn das programmeigene Verweilen an ist)
const SEG = 100, SEG_DIST = 0.045, SEG_COUNT = 4, MOUSE_PAUSE = 1500;
const Mouse = { hist: [], until: 0, needMove: false };
function mouseActive(now) { return !eyeMode() && S.mouseGuard && (now < Mouse.until || Mouse.needMove); }
function posAt(t) { const h = Mouse.hist; for (let i = h.length - 1; i >= 0; i--) if (h[i].t <= t) return h[i]; return null; }
function detectMouse(now) {
  const h = Mouse.hist, minD = window.innerWidth * SEG_DIST, p0 = h[h.length - 1], p1 = posAt(now - SEG);
  if (!p1) return;
  const lastMove = Math.hypot(p0.x - p1.x, p0.y - p1.y) > minD;
  if (lastMove && now < Mouse.until) { Mouse.until = now + MOUSE_PAUSE; Mouse.needMove = true; return; }
  if (!lastMove) return;
  let prev = p0;
  for (let k = 1; k <= SEG_COUNT; k++) {
    const p = posAt(now - k * SEG);
    if (!p || Math.hypot(prev.x - p.x, prev.y - p.y) < minD) return;
    prev = p;
  }
  Mouse.until = now + MOUSE_PAUSE; Mouse.needMove = true;
}
document.addEventListener("pointermove", e => {
  if (eyeMode()) return;          // Augensteuerung liefert den Blick – die Maus wählt nur per Klick aus
  const now = performance.now();
  Gaze.x = e.clientX; Gaze.y = e.clientY;
  if (S.dot) { const d = $("#gazeDot"); d.style.left = e.clientX + "px"; d.style.top = e.clientY + "px"; }
  Mouse.hist.push({ t: now, x: e.clientX, y: e.clientY });
  while (Mouse.hist.length && Mouse.hist[0].t < now - 800) Mouse.hist.shift();
  if (Mouse.needMove && now >= Mouse.until) Mouse.needMove = false;
  detectMouse(now);
}, { passive: true });
document.addEventListener("mouseout", e => { if (!eyeMode() && !e.relatedTarget) { Gaze.x = -1; Gaze.y = -1; } });
document.addEventListener("pointerdown", () => audio());

let toastTimer = null;
function toast(text) {
  if ($("#settings").classList.contains("show")) {        // Einstellungen offen: Meldung oben im Fenster zeigen
    const n = $("#savedNote"); n.textContent = text; n.classList.remove("flash"); void n.offsetWidth; n.classList.add("flash");
  }
  const t = $("#toast");
  t.textContent = text;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2500);
}
const Badge = { off: null, mouse: null };
function updateBadges(now) {
  const off = !!dwellOn(), mouse = dwellOn() && mouseActive(now);
  if (off !== Badge.off) {
    Badge.off = off; $("#badgeOff").classList.toggle("show", off);
    $("#badgeOff").textContent = eyeMode() ? "👁 Augensteuerung" : "👁 Verweilen";
    $("#badgeOff").title = eyeMode() ? "Augensteuerung aktiv (F9)" : "Programm-Verweilen an (F9)";
  }
  if (mouse !== Badge.mouse) { Badge.mouse = mouse; $("#badgeMouse").classList.toggle("show", mouse); }
}
function togglePause() {
  Native.paused = !Native.paused;
  document.body.classList.toggle("eye-paused", Native.paused);
  $("#badgeOff").textContent = Native.paused ? "⏸ Augensteuerung pausiert" : "👁 Augensteuerung";
  document.querySelectorAll(".pausebtn").forEach(b => { b.textContent = Native.paused ? "▶️" : "⏸️"; });
  if (Gaze.target) { Gaze.target.style.setProperty("--dwell", 0); setTarget(null, performance.now()); }
  say(Native.paused ? "Pause. Schau auf den Knopf, wenn es weitergehen soll." : "Weiter geht's!", "info", 1, { force: true });
}
document.querySelectorAll(".pausebtn").forEach(b => onSelect(b, togglePause));

function toggleDwell() {
  if (Native.eye) { toast("👁 Die Augensteuerung ist immer aktiv – pausieren mit ⏸️"); return; }
  S.dwell = !S.dwell;
  saveS();
  const cb = $("#setDwell"); if (cb) cb.checked = dwellOn();
  toast(dwellOn() ? "👁 Auswahl durch Verweilen AN" : "🖱 Auswahl per Klick");
}

const okGaze = g => g && !g.classList.contains("disabled") && !g.classList.contains("done") && !g.classList.contains("matched") && !g.classList.contains("notyet");
// Oberste sichtbare Ebene (Mitteil-Tafel, Belohnung, Entdecken oder der aktuelle Bildschirm)
function gazeLayer() {
  for (const sel of ["#quitAsk.show", "#talk.show", "#reward.show", "#explore.show"]) { const e = $(sel); if (e) return e; }
  return document.querySelector(".screen.active");
}
// Blickpunkt beruhigen: Mittelwert der letzten Zeigerpositionen (Augen zittern immer ein wenig)
function smoothPos() {
  const now = performance.now(), h = Mouse.hist.filter(p => p.t >= now - 200);
  if (h.length < 2) return { x: Gaze.x, y: Gaze.y };
  const m = { x: h.reduce((a, p) => a + p.x, 0) / h.length, y: h.reduce((a, p) => a + p.y, 0) / h.length };
  // großer Blicksprung: sofort der neuen Stelle folgen (kein "Zwischenpunkt" auf einer fremden Kachel)
  return Math.hypot(m.x - Gaze.x, m.y - Gaze.y) > window.innerWidth * 0.05 ? { x: Gaze.x, y: Gaze.y } : m;
}
// Lupe: Schaut das Kind in den Bereich der Knöpfe oben, werden diese vergrößert und
// die großen Kacheln darunter zählen kurz nicht – so lassen sich die kleinen Knöpfe sicher treffen.
const Lens = { on: false, since: 0, out: 0 };
function activeTopbar() {
  if ($("#quitAsk.show") || $("#reward.show") || $("#explore.show")) return null;
  if ($("#talk.show")) return $("#talk .topbar");
  const scr = document.querySelector(".screen.active");
  return scr ? scr.querySelector(".topbar") : null;
}
function setLens(on) {
  if (Lens.on === on) return;
  Lens.on = on;
  document.body.classList.toggle("lens", on);
}
function updateLens(pt, now) {
  const tb = S.lens === false || !dwellOn() ? null : activeTopbar();
  if (!tb || pt.x < 0) { Lens.since = 0; if (!tb) setLens(false); return; }
  const r = tb.getBoundingClientRect();
  // an: Blick im oberen Streifen (Leiste + ein kleines Stück darunter) – aus: deutlich darunter
  const zone = r.bottom + r.height * (Lens.on ? 0.55 : 0.12);
  if (pt.y < zone) {
    Lens.out = 0;
    if (!Lens.on) { if (!Lens.since) Lens.since = now; if (now - Lens.since > 220) setLens(true); }
  } else {
    Lens.since = 0;
    if (Lens.on) { if (!Lens.out) Lens.out = now; if (now - Lens.out > 350) setLens(false); }
  }
}
function gazeEl() {
  if (Gaze.x < 0 || $("#settings").classList.contains("show")) return null;
  if (Native.paused) {
    // Pause: nur ▶️ reagiert. Die Lupe erscheint nur, wenn der Blick wirklich auf ▶️ liegt.
    const p0 = smoothPos(), now = performance.now();
    const tb = activeTopbar(), pb = tb && tb.querySelector(".pausebtn");
    if (!pb || !pb.offsetParent || p0.x < 0) { Lens.since = 0; setLens(false); return null; }
    const r = pb.getBoundingClientRect();
    const d = Math.hypot(Math.max(r.left - p0.x, 0, p0.x - r.right), Math.max(r.top - p0.y, 0, p0.y - r.bottom));
    const onBtn = d < window.innerWidth * (Lens.on ? 0.04 : 0.012);
    if (S.lens !== false && onBtn) { Lens.out = 0; if (!Lens.on) { if (!Lens.since) Lens.since = now; if (now - Lens.since > 220) setLens(true); } }
    else { Lens.since = 0; if (Lens.on) { if (!Lens.out) Lens.out = now; if (now - Lens.out > 350) setLens(false); } }
    return onBtn ? pb : null;
  }
  const pt = dwellOn() ? smoothPos() : { x: Gaze.x, y: Gaze.y };
  updateLens(pt, performance.now());
  if (Lens.on) {
    // nur die (vergrößerten) Knöpfe oben zählen – mit großzügigem Magnet
    const tb = activeTopbar();
    const hit = document.elementFromPoint(pt.x, pt.y);
    const hb = hit && hit.closest(".gaze");
    if (hb && tb && tb.contains(hb) && okGaze(hb)) return hb;
    let best = null, bestD = window.innerWidth * 0.06;
    if (tb) tb.querySelectorAll(".gaze").forEach(c => {
      if (!okGaze(c) || !c.offsetParent) return;
      const r = c.getBoundingClientRect();
      const d = Math.hypot(Math.max(r.left - pt.x, 0, pt.x - r.right), Math.max(r.top - pt.y, 0, pt.y - r.bottom));
      if (d < bestD) { bestD = d; best = c; }
    });
    return best;
  }
  const el = document.elementFromPoint(pt.x, pt.y);
  const g = el && el.closest(".gaze");
  if (g) return okGaze(g) ? g : null;
  if (!dwellOn()) return null;
  // Magnet: Blick knapp daneben (z. B. in der Lücke zwischen zwei Kacheln) -> nächste Kachel zählt
  return nearestGaze(pt.x, pt.y, window.innerWidth * 0.045, false);
}
function nearestGaze(x, y, snap, skipTopbar) {
  const pt = { x, y };
  const layer = gazeLayer(); if (!layer) return null;
  let best = null, bestD = snap;
  layer.querySelectorAll(".gaze").forEach(c => {
    if (!okGaze(c) || (skipTopbar && c.closest(".topbar"))) return;
    const r = c.getBoundingClientRect();
    if (!r.width) return;
    const dx = Math.max(r.left - pt.x, 0, pt.x - r.right), dy = Math.max(r.top - pt.y, 0, pt.y - r.bottom);
    const d = Math.hypot(dx, dy);
    if (d < bestD) { bestD = d; best = c; }
  });
  return best;
}
// Zwei Verweilzeiten: Knöpfe oben (🏠 🔊 ⏸️ …) und große Kacheln (Antworten, Menü …)
function dwellTime(el) {
  if (el.closest(".topbar")) return S.dwellMs;
  if (el.dataset.fast) return S.dwellMs * 0.8;           // Ballons fliegen weg – etwas schneller
  return (S.dwellBigMs || 1800) * (el.dataset.slow ? 1.6 : 1);
}
function setTarget(el, now) {
  const old = Gaze.target;
  if (old) { old.classList.remove("looking"); if (dwellOn()) old.style.setProperty("--dwell", 0); }
  if (Gaze.firedEl && Gaze.firedEl !== el) Gaze.firedEl = null;
  Gaze.target = el; Gaze.start = now; Gaze.lostAt = 0;
  clearTimeout(Gaze.hoverTimer);
  if (!el) return;
  el.classList.add("looking");
  if (S.hoverSay && el.dataset.say && !el.dataset.nosay && !el.closest("#game .topbar")) {
    Gaze.hoverTimer = setTimeout(() => {
      if (Gaze.target === el && Speech.kind !== "talk" && !(dwellOn() && mouseActive(performance.now()))) say(el.dataset.say, "hover");
    }, 300);
  }
}
function fire(el) {
  const now = performance.now();
  if (now - Gaze.lastFire < 400) return;
  Gaze.lastFire = now; Gaze.firedEl = el;
  (window.FIRELOG = window.FIRELOG || []).push({ t: now, what: el.dataset.say || el.id || el.textContent.trim().slice(0, 20) });
  // Nach einer Auswahl: wer einfach weiter auf dieselbe Stelle schaut, wählt auf dem nächsten
  // Bildschirm nicht sofort wieder aus – erst wenn der Blick weiterwandert, gilt die normale Verweilzeit.
  Gaze.cool = true; Gaze.fx = Gaze.x; Gaze.fy = Gaze.y;
  if (dwellOn()) el.style.setProperty("--dwell", 0);
  SFX.select();
  if (el._onSelect) el._onSelect(el);
}
let lastDwellShown = null;
// Während eine Aufgabe vorgelesen wird (Ton an), wird nichts ausgewählt. Ausnahmen: Pause-Knopf, Mitteil-Tafel.
function speechHold(el) {
  if (S.speechPause === false || S.muted || Speech.kind !== "talk") return false;
  if (!$("#game").classList.contains("active") || $("#reward.show") || $("#quitAsk.show")) return false;
  if (el && (el.classList.contains("pausebtn") || el.closest("#talk"))) return false;
  return !$("#talk").classList.contains("show");
}
function gazeLoop(now) {
  const dt = Gaze.last ? now - Gaze.last : 16;
  Gaze.last = now;
  const el = gazeEl();
  if (Gaze.target && !Gaze.target.isConnected) setTarget(null, now);
  if (el !== Gaze.target) {
    if (!Gaze.target) setTarget(el, now);
    else {
      if (!Gaze.lostAt) Gaze.lostAt = now;
      Gaze.start += dt;
      // Blick auf eine ANDERE Kachel: schnell wechseln; Blick ins Leere: Kachel noch kurz behalten
      if (now - Gaze.lostAt > (dwellOn() && !el ? 700 : GRACE)) setTarget(el, now);
    }
  } else if (el && dwellOn()) {
    Gaze.lostAt = 0;
    if (mouseActive(now)) {
      Gaze.start = now;
      if (lastDwellShown !== 0) { el.style.setProperty("--dwell", 0); lastDwellShown = 0; }
    } else if (speechHold(el)) {
      Gaze.start = now;                          // erst zuhören – der Kreis wartet
      if (lastDwellShown !== 0) { el.style.setProperty("--dwell", 0); lastDwellShown = 0; }
    } else if (el !== Gaze.firedEl) {
      let need = dwellTime(el);
      if (Gaze.cool) {
        if (Gaze.x >= 0 && Math.hypot(Gaze.x - Gaze.fx, Gaze.y - Gaze.fy) > window.innerWidth * 0.06) Gaze.cool = false;
        else need *= el.classList.contains("pausebtn") ? 1.5 : 2.5;
      }
      const p = Math.min(1, (now - Gaze.start) / need);
      const ps = p.toFixed(2);
      if (ps !== lastDwellShown) { el.style.setProperty("--dwell", ps); lastDwellShown = ps; }
      if (p >= 1) fire(el);
    }
  } else if (el) {
    Gaze.lostAt = 0;
  }
  updateBadges(now);
  const hold = dwellOn() && !Native.paused && speechHold(Gaze.target);
  if (hold !== Gaze.holdShown) {
    Gaze.holdShown = hold;
    document.body.classList.toggle("speech-hold", hold);
    $("#badgeOff").textContent = Native.paused ? "⏸ Augensteuerung pausiert" : hold ? "🔊 Erst zuhören …" : eyeMode() ? "👁 Augensteuerung" : "👁 Verweilen";
  }
  requestAnimationFrame(gazeLoop);
}
requestAnimationFrame(gazeLoop);

// Nur die linke Maustaste (bzw. Tobii-Klick / Tippen) wählt aus
document.addEventListener("contextmenu", e => e.preventDefault());
document.addEventListener("click", e => {
  if (e.button !== 0) return;
  let g = e.target.closest(".gaze");
  // Augensteuerung aktiv und Augen erkannt: ausgewählt wird nur per Blick (sonst würde der
  // Verweil-Klick von TD Control zusätzlich – und schneller – auslösen). Pause-Knopf geht immer.
  if (eyeMode() && !Native.paused && !(g && (g.classList.contains("pausebtn") || g.closest("#btnQuit, #quitAsk")))) {
    const mode = clickMode();
    const age = performance.now() - Native.lastEye;
    if (mode === "always" || (mode === "eyes" && age < 3000)) { Native.blocked = (Native.blocked || 0) + 1; return; }
    Native.allowed = (Native.allowed || 0) + 1;
  }
  // Magnet auch für Klicks (z. B. Verweil-Klick der Tobii-Software): Klick knapp neben eine Kachel
  // oder in die Lücke zählt für die nächste Kachel. Die kleinen Knöpfe oben nur bei direktem Treffer.
  if (!g && !e.target.closest("button, input, select, textarea, label, #settings"))
    g = nearestGaze(e.clientX, e.clientY, window.innerWidth * 0.06, true);
  if (!g || g.classList.contains("disabled") || g.classList.contains("done") || g.classList.contains("notyet")) return;
  if (S.autoFull) enterFullscreen();     // ein Klick ist nötig, damit der Browser Vollbild erlaubt
  if (g === Gaze.firedEl && performance.now() - Gaze.lastFire < 1500) return;
  fire(g);
});
// Vollbild über die Seite selbst (nicht F11): Edge blendet dann beim Blick
// an den oberen Rand KEINE Adressleiste ein – das verhindert das Flackern.
// Wichtig: nur EINMAL automatisch anfordern (nicht bei jedem Klick) und nicht,
// wenn das Fenster schon bildschirmfüllend ist – sonst springt Edge hin und her.
let fullTried = false;
function isScreenFilled() {
  return window.innerWidth >= screen.width - 2 && window.innerHeight >= screen.height - 2;
}
function enterFullscreen(auto = true) {
  if (Native.on) return;                 // das Programmfenster ist schon bildschirmfüllend
  const d = document.documentElement;
  if (auto && fullTried) return;
  fullTried = true;
  if (document.fullscreenElement || !d.requestFullscreen) return;
  if (auto && isScreenFilled()) return;
  d.requestFullscreen({ navigationUI: "hide" }).catch(() => { });
}
function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
  else enterFullscreen(false);
}
document.addEventListener("keydown", e => {
  if (e.key === "F9") { e.preventDefault(); toggleDwell(); return; }
  if (e.key === "F8") { e.preventDefault(); toggleMute(); return; }
  if ($("#dlg").classList.contains("show")) { if (e.key === "Escape") { e.preventDefault(); $("#dlgCancel").click(); } return; }
  if ($("#settings").classList.contains("show")) {
    if (e.key === "Enter" && e.ctrlKey) { e.preventDefault(); saveSettingsNow(); }
    else if (e.key === "Escape") { e.preventDefault(); closeSettings(); }
    return;
  }
  if ((e.key === " " || e.key === "Enter") && Gaze.target) { e.preventDefault(); fire(Gaze.target); }
});

// ---------------------------------------------------------------------
//  Ton an / aus
// ---------------------------------------------------------------------
function updateMuteButtons() {
  document.querySelectorAll(".mutebtn").forEach(b => {
    b.textContent = S.muted ? "🔇" : "🔊";
    b.classList.toggle("off", !!S.muted);
    b.dataset.say = S.muted ? "" : "Ton ausschalten";
  });
  const cb = $("#setMuted"); if (cb) cb.checked = !!S.muted;
}
function toggleMute() {
  S.muted = !S.muted;
  saveS();
  if (S.muted) { stopSpeech(); toast("🔇 Ton aus"); }
  else { toast("🔊 Ton an"); say("Der Ton ist wieder an."); }
}

// ---------------------------------------------------------------------
//  Bildschirme
// ---------------------------------------------------------------------
function show(id) { document.querySelectorAll(".screen").forEach(s => s.classList.toggle("active", s.id === id)); }
const G = { token: 0, game: null, level: 1, cfg: {}, repeat: null, errors: 0, lastLetter: null, modeQueue: [] };

function setProgress(n, total) {
  let h = LV[G.game] ? `<span class="lvl">${stars(G.level)}</span>` : "";
  for (let i = 0; i < total; i++) h += `<span class="${i < n ? "got" : ""}">⭐</span>`;
  $("#progress").innerHTML = h;
}
function setTitle(text) {
  $("#progress").innerHTML = `<span class="got" style="font-size:${u(5)};font-weight:700;animation:none">${esc(text)}</span>`;
}
function hideOverlays() {
  $("#reward").classList.remove("show");
  $("#explore").classList.remove("show");
  document.querySelectorAll(".nextbtn").forEach(b => b.remove());
}
function goMenu(speak = true) {
  G.token++; G.game = null; G.repeat = null;
  stopSpeech();
  hideOverlays();
  buildMenu();
  show("menu");
  if (speak) say("Was möchtest du spielen?");
}

const GAMES = [
  { id: "explore", ico: "🔤", name: "Buchstaben entdecken" },
  { id: "anlaut",  ico: "🍎", name: "Womit fängt es an?" },
  { id: "hear",    ico: "👂", name: "Hör genau!" },
  { id: "read",    ico: "📖", name: "Wörter lesen" },
  { id: "sent",    ico: "📜", name: "Sätze lesen" },
  { id: "write",   ico: "✏️", name: "Wörter schreiben" },
  { id: "syll",    ico: "👏", name: "Silben klatschen" },
  { id: "puzzle",  ico: "🧩", name: "Silben-Puzzle" },
  { id: "memory",  ico: "🃏", name: "Memory" },
  { id: "balloon", ico: "🎈", name: "Ballon-Jagd" },
  { id: "color",   ico: "🎨", name: "Farben malen" },
  { id: "album",   ico: "🏆", name: "Meine Sticker" },
];
const gameName = id => (GAMES.find(g => g.id === id) || {}).name || "";
function buildMenu() {
  const grid = $("#menuGrid");
  grid.innerHTML = "";
  GAMES.forEach(g => {
    const d = document.createElement("div");
    d.className = "gaze tile";
    d.dataset.say = g.name;
    d.innerHTML = `<div class="ico">${g.ico}</div><div>${g.name}</div><div class="stars">${LV[g.id] ? stars(maxLevel(g.id)) : ""}</div>`;
    onSelect(d, () => g.id === "album" ? openAlbum() : openGame(g.id));
    grid.appendChild(d);
  });
}

// ---------------------------------------------------------------------
//  Spielablauf
// ---------------------------------------------------------------------
const TASKS = { anlaut: taskAnlaut, hear: taskHear, read: taskRead, write: taskWrite, syll: taskSyll, color: taskColor, puzzle: taskPuzzle, sent: taskSent };

function openGame(id) {
  if (LV[id] && maxLevel(id) > 1) showLevelSelect(id);
  else startGame(id, 1);
}
function showLevelSelect(id) {
  G.token++; G.game = id; stopSpeech(); hideOverlays();
  show("game");
  setTitle(gameName(id));
  const max = maxLevel(id);
  $("#stage").innerHTML = `<div class="levels" id="lv"></div>`;
  [1, 2, 3].forEach(l => {
    const d = document.createElement("div");
    d.className = "gaze" + (l > max ? " locked" : "");
    d.innerHTML = `<div class="st">${stars(l)}${l > max ? "<br>🔒" : ""}</div><div>Stufe ${l}</div><div style="font-size:${u(3)}">${LEVEL_TEXT[l]}</div>`;
    d.dataset.say = l > max ? `Stufe ${l} ist noch gesperrt` : `Stufe ${l}, ${LEVEL_TEXT[l]}`;
    onSelect(d, () => l > max
      ? say("Diese Stufe ist noch gesperrt. Schaffe erst die Stufe davor.")
      : startGame(id, l));
    $("#lv").appendChild(d);
  });
  G.repeat = () => say("Welche Stufe möchtest du spielen?");
  G.repeat();
}

async function startGame(id, level = 1) {
  G.token++; const t = G.token;
  G.game = id; G.level = level; G.cfg = LV[id] ? LV[id][level] : {};
  G.repeat = null; G.errors = 0; G.modeQueue = [];
  stopSpeech();
  hideOverlays();
  $("#stage").innerHTML = "";
  show("game");
  if (id === "explore") return runExplore(t);
  if (id === "memory") return runMemory(t);
  if (id === "balloon") return runBalloon(t);
  const used = new Set();
  setProgress(0, S.round);
  for (let i = 0; i < S.round; i++) {
    await waitTalkClosed(t);
    await TASKS[id](t, used);
    if (t !== G.token) return;
    setProgress(i + 1, S.round);
    if (S.manualNext) await nextButton(t, i + 1 >= S.round);
    else await sleep(800);
    if (t !== G.token) return;
  }
  await waitTalkClosed(t);
  finishRound(t);
}
// Während die Mitteil-Tafel offen ist, geht die Übung nicht weiter
async function waitTalkClosed(t) {
  while (t === G.token && $("#talk").classList.contains("show")) await sleep(200);
}
// "Weiter"-Knopf: Das Ergebnis bleibt stehen, bis das Kind weiterklickt
function nextButton(t, lastOne) {
  return new Promise(resolve => {
    const box = $("#stage .options") || $("#stage .tiles");
    if (!box) { resolve(); return; }
    // falsche Antworten ausblenden – die richtige bleibt (in der Mitte) stehen
    [...box.children].forEach(ch => { if (!ch.classList.contains("correct")) ch.remove(); });
    const b = document.createElement("div");
    b.className = "gaze nextbtn";   // sitzt fest am rechten Rand
    b.dataset.say = lastOne ? "Fertig" : "Weiter";
    b.innerHTML = `<span class="ico">${lastOne ? "🏁" : "➡️"}</span>${lastOne ? "Fertig" : "Weiter"}`;
    onSelect(b, () => { if (t === G.token) { b.remove(); resolve(); } });
    $("#game").appendChild(b);
    G.repeat = () => say(lastOne ? "Schau auf Fertig." : "Schau auf Weiter, dann kommt die nächste Aufgabe.");
  });
}

// Text in Kacheln/Kästen so lange verkleinern, bis er ganz hineinpasst (lange Wörter, Groß-/Kleinschreibung)
function fitText(root = document) {
  const run = () => root.querySelectorAll(".opt.word, .opt.colorw, .sentence, .bigword, .tiles .opt").forEach(el => {
    if (el.dataset.fitOrig === undefined) el.dataset.fitOrig = el.style.fontSize || "";
    el.style.fontSize = el.dataset.fitOrig;      // Ausgangsgröße (z. B. kleiner gesetzt beim Silbenklatschen)
    // Breite des Textes messen (nicht des Kastens) und mit dem Kasten vergleichen – 8 % Rand lassen
    const tooBig = () => {
      const box = el.getBoundingClientRect(), rg = document.createRange();
      rg.selectNodeContents(el);
      const tx = rg.getBoundingClientRect();
      return box.width > 0 && (tx.width > box.width * 0.92 || tx.height > box.height * 0.98);
    };
    for (let i = 0; i < 25 && tooBig(); i++) el.style.fontSize = (parseFloat(getComputedStyle(el).fontSize) * 0.92) + "px";
  });
  requestAnimationFrame(run);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => requestAnimationFrame(run));
}
function promptHTML(content, bubble) {
  return `<div class="prompt"><div class="mascot">🦉</div>${bubble ? `<div class="bubble">${bubble}</div>` : ""}${content || ""}</div>`;
}

// Allgemeine Auswahl-Aufgabe: eine richtige Antwort unter mehreren
function choiceTask(t, cfg) {
  return new Promise(resolve => {
    const stage = $("#stage");
    stage.innerHTML = promptHTML(cfg.content, cfg.bubble) + `<div class="options"></div>`;
    const box = stage.querySelector(".options");
    let busy = false, errors = 0;
    const els = cfg.options.map(o => {
      const d = document.createElement("div");
      d.className = "gaze opt " + (o.cls || "");
      d.innerHTML = o.html;
      if (o.say && !cfg.nosay) d.dataset.say = o.say; else d.dataset.nosay = "1";
      d._opt = o;
      box.appendChild(d);
      return d;
    });
    G.repeat = cfg.speak;
    els.forEach(d => onSelect(d, async () => {
      if (busy || t !== G.token) return;
      busy = true;
      const o = d._opt;
      if (o.correct) {
        d.classList.remove("hint");
        d.classList.add("correct");
        SFX.success();
        els.forEach(e => { if (e !== d) e.classList.add("done"); });
        if (cfg.letter) stat(cfg.letter, errors === 0);
        G.repeat = null;
        await (cfg.onRight ? cfg.onRight(d) : say(pick(PRAISE)));
        if (t !== G.token) return;
        resolve(true);
      } else {
        errors++; G.errors++;
        d.classList.add("wrong");
        SFX.wrong();
        if (cfg.letter && errors === 1) stat(cfg.letter, false);
        await sleep(500);
        d.classList.remove("wrong");
        d.classList.add("disabled");
        if (errors >= 2) els.find(e => e._opt.correct).classList.add("hint");
        busy = false;
        const fb = cfg.onWrong ? cfg.onWrong(o, errors) : pick(ENCOURAGE);
        if (typeof fb === "function") fb(); else say(fb);
      }
    }));
    fitText($("#stage"));
    cfg.speak();
  });
}

// ---- Spiel: Womit fängt es an? ----
function taskAnlaut(t, used) {
  const c = G.cfg;
  const mode = nextMode(c.modes);
  if (mode === "letter2pic") return anlautLetter2Pic(t, used, c);
  if (mode === "endlaut") { const r = anlautEnd(t, used, c); if (r) return r; }
  return anlautPic2Letter(t, used, c);
}
// Bild -> Anfangsbuchstabe
function anlautPic2Letter(t, used, c) {
  const L = nextLetter(used);
  const w = pickFresh(anlautWords(L), used);
  const word = fw(w.w);
  const opts = safeOrder([L, ...distractLetters(L, c.n - 1, { similar: c.similar })]);
  const fv = verb(w, "fängt", "fangen");
  return choiceTask(t, {
    content: `<div style="display:flex;flex-direction:column;align-items:center;gap:${u(1)}">
        <div class="bigpic">${w.e}</div>
        <div class="bigword" style="font-size:${u(9)}"><span id="aq" style="color:var(--orange)">?</span>${esc(word.slice(1))}</div></div>`,
    bubble: "Womit fängt das Wort an?", letter: L,
    options: opts.map(x => ({ html: esc(fl(x)), say: LN(x), correct: x === L })),
    speak: () => say(`Womit ${fv} ${art(w)} an?`),
    onWrong: () => `${pick(ENCOURAGE)} Hör genau: ${art(w)}.`,
    onRight: async () => { $("#aq").textContent = word[0]; await say(`${pick(PRAISE)} ${cap(art(w))} ${fv} mit dem Buchstaben ${LN(L)} an.`); },
  });
}
// Buchstabe -> passendes Bild
function anlautLetter2Pic(t, used, c) {
  const L = nextLetter(used);
  const w = pickFresh(anlautWords(L), used);
  const bad = new Set([L, ...soundAlike(L)]);
  let pool = WORDS.filter(x => x.a !== false && !bad.has(first(x)) && x.e !== w.e);
  if (c.similar) {
    const sim = pool.filter(x => (SIMILAR[L] || []).includes(first(x)));
    pool = shuffle(sim).concat(shuffle(pool.filter(x => !sim.includes(x))));
  } else pool = shuffle(pool);
  const others = [];
  for (const x of pool) { if (others.length >= c.n - 1) break; if (!others.some(o => first(o) === first(x))) others.push(x); }
  const opts = shuffle([w, ...others]);
  return choiceTask(t, {
    content: `<div class="bigletter">${esc(fl(L))}</div>`,
    bubble: "Was fängt mit diesem Buchstaben an?", letter: L,
    options: opts.map(o => ({ html: o.e, cls: "pic", say: art(o), correct: o === w, w: o })),
    speak: () => say(`Was fängt mit dem Buchstaben ${LN(L)} an?`),
    onWrong: o => `${cap(art(o.w))} ${verb(o.w, "fängt", "fangen")} mit dem Buchstaben ${LN(first(o.w))} an. Wir suchen den Buchstaben ${LN(L)}.`,
    onRight: () => say(`${pick(PRAISE)} ${cap(art(w))} ${verb(w, "fängt", "fangen")} mit dem Buchstaben ${LN(L)} an.`),
  });
}
// Bild -> Endbuchstabe (nur Stufe 3)
function anlautEnd(t, used, c) {
  const set = new Set(letters());
  const okEnd = w => w.lg && !"DGBH".includes(last(w)) && w.w.length >= 3;
  let pool = WORDS.filter(w => okEnd(w) && set.has(last(w)));
  if (pool.length < 3) pool = WORDS.filter(okEnd);
  if (!pool.length) return null;
  const w = pickFresh(pool, used);
  const L = last(w);
  const word = fw(w.w);
  const opts = safeOrder([L, ...distractLetters(L, c.n - 1, { similar: c.similar })]);
  const hv = verb(w, "hört", "hören");
  return choiceTask(t, {
    content: `<div style="display:flex;flex-direction:column;align-items:center;gap:${u(1)}">
        <div class="bigpic">${w.e}</div>
        <div class="bigword" style="font-size:${u(9)}">${esc(word.slice(0, -1))}<span id="aq" style="color:var(--orange)">?</span></div></div>`,
    bubble: "Hör genau auf das Ende! Womit hört das Wort auf?", letter: L,
    options: opts.map(x => ({ html: esc(fl(x)), say: LN(x), correct: x === L })),
    speak: () => say(`Hör genau auf das Ende! Womit ${hv} ${art(w)} auf?`),
    onWrong: () => `${pick(ENCOURAGE)} Hör genau: ${w.w}.`,
    onRight: async () => { $("#aq").textContent = word[word.length - 1]; await say(`${pick(PRAISE)} ${cap(art(w))} ${hv} mit dem Buchstaben ${LN(L)} auf.`); },
  });
}

// ---- Spiel: Hör genau! ----
function taskHear(t, used) {
  const c = G.cfg;
  const L = nextLetter(used);
  const w = pickFresh(anlautWords(L), used);
  const opts = safeOrder([L, ...distractLetters(L, c.n - 1, { similar: c.similar })]);
  return choiceTask(t, {
    content: c.pic ? `<div class="bigpic">${w.e}</div>` : "",
    bubble: "Wo ist der Buchstabe? Hör genau!", letter: L, nosay: true,
    options: opts.map(x => ({ html: esc(fl(x)), say: LN(x), correct: x === L, L: x })),
    speak: () => say(c.pic ? `Wo ist der Buchstabe ${LN(L)}? ${LN(L)} wie ${w.w}.` : `Wo ist der Buchstabe ${LN(L)}?`),
    onWrong: (o, n) => `Das ist der Buchstabe ${LN(o.L)}. Wir suchen den Buchstaben ${LN(L)}${n >= 2 ? `, wie ${w.w}` : ""}.`,
    onRight: () => say(`${pick(PRAISE)} Das ist der Buchstabe ${LN(L)}.`),
  });
}

// ---- Spiel: Wörter lesen ----
function taskRead(t, used) {
  const c = G.cfg;
  const mode = nextMode(c.modes);
  const pool = readingWords(c.maxLen, c.n + 2);
  const w = pickFresh(pool, used);
  let cand = shuffle((pool.length > c.n + 2 ? pool : WORDS).filter(x => x.e !== w.e && x.w !== w.w));
  if (c.sameStart) {
    const same = cand.filter(x => first(x) === first(w));
    cand = same.concat(cand.filter(x => !same.includes(x)));
  } else {
    const diff = cand.filter(x => first(x) !== first(w));
    cand = diff.concat(cand.filter(x => !diff.includes(x)));
  }
  const others = [];
  for (const x of cand) { if (others.length >= c.n - 1) break; if (!others.some(o => o.e === x.e)) others.push(x); }
  const opts = shuffle([w, ...others]);
  const hearSyl = async () => { await say("Hör mal."); if (t === G.token) await saySyllables(w); };
  if (mode === "pic2word") {
    return choiceTask(t, {
      content: `<div class="bigpic">${w.e}</div>`,
      bubble: "Welches Wort passt zum Bild?", letter: first(w), nosay: true,
      options: opts.map(o => ({ html: `<div>${sylHTML(o)}</div>`, cls: "word" + (o.w.length > 7 ? " long" : ""), correct: o === w, w: o })),
      speak: () => say(`Wo steht ${w.w}? Lies genau.`),
      onWrong: (o, n) => n >= 2 ? hearSyl : `Da steht ${o.w.w}. Lies noch einmal.`,
      onRight: () => say(`${pick(PRAISE)} Da steht ${w.w}.`),
    });
  }
  return choiceTask(t, {
    content: `<div class="bigword">${sylHTML(w)}</div>`,
    bubble: "Lies das Wort. Welches Bild passt?", letter: first(w),
    options: opts.map(o => ({ html: o.e, cls: "pic", say: art(o), correct: o === w, w: o })),
    speak: () => say("Lies das Wort. Welches Bild passt?"),
    onWrong: (o, n) => n >= 2 ? hearSyl : `Das Bild ist ${art(o.w)}. Lies noch einmal genau.`,
    onRight: () => say(`${pick(PRAISE)} Da steht ${w.w}.`),
  });
}

// ---- Spiel: Silben klatschen ----
const NUMS = ["", "eine Silbe", "zwei Silben", "drei Silben", "vier Silben"];
async function taskSyll(t, used) {
  const c = G.cfg;
  const nSyl = w => w.s.split("-").length;
  const set = new Set(letters());
  let base = WORDS.filter(w => nSyl(w) <= c.maxSyl && set.has(first(w)));
  if (base.length < 6) base = WORDS.filter(w => nSyl(w) <= c.maxSyl);
  const want = 1 + rnd(c.maxSyl);            // zufällige Silbenzahl für Abwechslung
  const withN = base.filter(w => nSyl(w) === want);
  const w = pickFresh(withN.length >= 2 ? withN : base, used);
  const parts = w.s.split("-");
  const n = parts.length;
  const maxOpt = Math.max(c.maxSyl, 3);
  const range = [1, 2, 3, 4].filter(x => x <= Math.max(maxOpt, n));
  const nums = c.n >= range.length ? range
    : shuffle(range.filter(x => x !== n)).slice(0, c.n - 1).concat(n).sort((a, b) => a - b);
  return choiceTask(t, {
    content: `<div style="display:flex;flex-direction:column;align-items:center;gap:${u(1)}">
        <div class="bigpic" style="font-size:${u(22)}">${w.e}</div>
        <div class="bigword" style="font-size:${u(8)}" id="sylw">${esc(fw(w.w))}</div></div>`,
    bubble: "Wie viele Silben hörst du? Klatsch mit!",
    options: nums.map(k => ({ html: `<div class="claps">${"👏".repeat(k)}</div><div style="font-size:${u(9)}">${k}</div>`, cls: "small", say: NUMS[k], correct: k === n })),
    speak: async () => {
      await say(`Wie viele Silben hat ${art(w)}?`);
      if (t !== G.token) return;
      await sleep(200);
      await saySyllables(w, () => SFX.clap());
    },
    onWrong: () => "Hör noch einmal genau und klatsch mit.",
    onRight: async () => {
      const el = $("#sylw");
      el.className = "sylrow";
      el.innerHTML = parts.map(p => `<span>${esc(fw(p))}</span>`).join("");
      const spans = [...el.children];
      await saySyllables(w, i => { if (spans[i]) { spans[i].classList.add("on"); SFX.clap(); } });
      spans.forEach(s => s.classList.add("on"));
      if (t !== G.token) return;
      await say(`${pick(PRAISE)} ${cap(art(w))} hat ${NUMS[n]}.`);
    },
  });
}

// ---- Spiel: Farben malen ----
// Abwechselnde Aufgaben:  paint = Wort lesen -> Farbtopf wählen, das Bild wird ausgemalt
//                         pick  = Wort lesen -> das Bild in dieser Farbe finden
//                         word  = buntes Bild -> passendes Farbwort finden
//                         mix   = (Stufe 3) zwei Farbtöpfe mischen, damit die gesuchte Farbe entsteht
const ACC = { der: "den", die: "die", das: "das" };
const picNom = p => `${p.g} ${p.n}`;          // "der Ballon"
const picAcc = p => `${ACC[p.g]} ${p.n}`;     // "den Ballon"
const colorById = n => COLORS.find(x => x.w === n);
function colorWord(c) { return S.letterCase === "upper" ? c.w.toUpperCase() : c.w; }
function paintedSVG(p, col) { return svg(col ? p.svg.replace(/class="paint" fill="#fff"/g, `class="paint" fill="${col}"`) : p.svg); }
const sayG = txt => say(txt, "talk", 1, { german: true });
function otherColors(col, pool, n, similar) {
  let rest = shuffle(pool.filter(x => x !== col));
  if (similar) {
    const sim = shuffle(col.sim.map(colorById).filter(x => x && x !== col));
    rest = sim.concat(rest.filter(x => !sim.includes(x)));
  }
  return rest.slice(0, n);
}
function colorBox(word, pic, extra = "") {
  return `<div class="colorbox">${word ? `<div class="bigword colorword">${esc(word)}</div>` : ""}
    ${pic || extra ? `<div class="colorrow">${pic ? `<div class="colorpic" id="cpic">${pic}</div>` : ""}${extra}</div>` : ""}</div>`;
}
const freshPic = used => pickFresh(COLOR_PICS, used, "colorpic");
function taskColor(t, used) {
  const c = G.cfg;
  const mode = nextMode(c.modes);
  if (mode === "mix") return colorMix(t, used, c);
  const pool = COLORS.slice(0, c.colors);
  // nicht zweimal hintereinander dieselbe Farbe
  const col = pickFresh(pool.filter(x => x.w !== G.lastColor), used);
  G.lastColor = col.w;
  const pic = freshPic(used);
  const opts = shuffle([col, ...otherColors(col, pool, c.n - 1, c.similar)]);
  const wrongEnd = n => n >= 2 || c.readAloud ? ` Hier steht ${col.w}.` : " Lies noch einmal genau.";

  if (mode === "pick") {
    const otherPics = shuffle(COLOR_PICS.filter(p => p !== pic));
    let k = 0;
    const items = opts.map(o => ({ col: o, p: o === col ? pic : otherPics[k++] }));
    return choiceTask(t, {
      content: colorBox(colorWord(col), ""),
      bubble: c.readAloud ? "Welches Bild hat diese Farbe?" : "Lies das Wort. Welches Bild hat diese Farbe?",
      nosay: true,
      options: items.map(it => ({ html: paintedSVG(it.p, it.col.c), cls: "pic", correct: it.col === col, it })),
      speak: () => sayG(c.readAloud ? `Hier steht ${col.w}. Welches Bild ist ${col.w}?` : "Lies das Wort. Welches Bild hat diese Farbe?"),
      onWrong: (o, n) => `${cap(picNom(o.it.p))} ist ${o.it.col.w}.` + wrongEnd(n),
      onRight: () => sayG(`${pick(PRAISE)} ${cap(picNom(pic))} ist ${col.w}.`),
    });
  }
  if (mode === "word") {
    return choiceTask(t, {
      content: colorBox("", paintedSVG(pic, col.c)),
      bubble: `Welche Farbe hat ${picNom(pic)}? Lies genau!`,
      nosay: true,
      options: opts.map(o => ({ html: esc(colorWord(o)), cls: "colorw", correct: o === col, col: o })),
      speak: () => sayG(`Welche Farbe hat ${picNom(pic)}? Lies die Wörter genau.`),
      onWrong: (o, n) => `Da steht ${o.col.w}.` + (n >= 2 ? ` ${cap(picNom(pic))} ist ${col.w}.` : " Schau noch einmal."),
      onRight: () => sayG(`${pick(PRAISE)} ${cap(picNom(pic))} ist ${col.w}.`),
    });
  }
  // paint
  return choiceTask(t, {
    content: colorBox(colorWord(col), paintedSVG(pic)),
    bubble: c.readAloud ? `Mal ${picAcc(pic)} an!` : `Lies das Wort. Mal ${picAcc(pic)} an!`,
    nosay: true,   // Farbtöpfe nicht vorlesen – sonst wäre die Lösung verraten
    options: opts.map(o => ({ html: `<div class="pot" style="--pc:${o.c}"></div>`, cls: "colorpot", correct: o === col, col: o })),
    speak: () => sayG(c.readAloud ? `Hier steht ${col.w}. Mal ${picAcc(pic)} ${col.w} an!` : `Lies das Wort. Mit welcher Farbe malst du ${picAcc(pic)} an?`),
    onWrong: (o, n) => `Das ist ${o.col.w}.` + wrongEnd(n),
    onRight: async () => {
      document.querySelectorAll("#cpic .paint").forEach(p => p.style.fill = col.c);
      SFX.pop();
      await sayG(`${pick(PRAISE)} ${cap(picNom(pic))} ist jetzt ${col.w}.`);
    },
  });
}
// Farben mischen: zwei Töpfe nacheinander wählen – die Schüssel zeigt, was herauskommt
function colorMix(t, used, c) {
  return new Promise(resolve => {
    const target = pickFresh(MIX_TARGETS.filter(m => m.w !== G.lastColor), used, "colormix");
    G.lastColor = target.w;
    const col = colorById(target.w);
    const pic = freshPic(used);
    const bowl = `<div class="mixbox"><div class="bowl" id="bowl"></div><div class="mixlabel" id="mixlabel"></div></div>`;
    $("#stage").innerHTML = promptHTML(colorBox(colorWord(col), paintedSVG(pic), bowl), `Welche zwei Farben brauchst du, damit ${picNom(pic)} ${col.w} wird?`)
      + `<div class="options"></div>`;
    const box = $("#stage .options");
    const pots = shuffle(MIX_POTS.slice()).map(m => {
      const d = document.createElement("div");
      d.className = "gaze opt colorpot";
      d.innerHTML = `<div class="pot" style="--pc:${m.c}"></div>`;
      d.dataset.say = m.w;
      d._opt = { correct: target.from.includes(m.w) };
      d._m = m;
      box.appendChild(d);
      return d;
    });
    let sel = [], busy = false, errors = 0;
    const setBowl = (color, label) => { $("#bowl").style.setProperty("--bc", color || "transparent"); $("#mixlabel").textContent = label || ""; };
    const speak = () => sayG(`Mische ${col.w}! Welche zwei Farben brauchst du, damit ${picNom(pic)} ${col.w} wird?`);
    G.repeat = speak;
    pots.forEach(d => onSelect(d, async () => {
      if (busy || t !== G.token) return;
      if (sel.includes(d)) { sel = sel.filter(x => x !== d); d.classList.remove("picked"); setBowl(sel[0] && sel[0]._m.c); return; }
      sel.push(d); d.classList.add("picked"); SFX.pop();
      if (sel.length === 1) { setBowl(d._m.c); sayG(d._m.w); return; }
      busy = true;
      const [a, b] = sel.map(x => x._m.w);
      const mix = MIXES[[a, b].sort().join("+")];
      setBowl(mix[1], colorWord({ w: mix[0] }));
      await sleep(700);
      if (t !== G.token) return;
      if (mix[0] === col.w) {
        sel.forEach(x => { x.classList.remove("picked", "hint"); x.classList.add("correct"); });
        pots.forEach(x => { if (!sel.includes(x)) x.classList.add("done"); });
        document.querySelectorAll("#cpic .paint").forEach(p => p.style.fill = col.c);
        SFX.success();
        G.repeat = null;
        await sayG(`${pick(PRAISE)} ${cap(a)} und ${cap(b)} zusammen ergibt ${cap(col.w)}. ${cap(picNom(pic))} ist jetzt ${col.w}.`);
        if (t === G.token) resolve(true);
      } else {
        errors++; G.errors++;
        SFX.wrong();
        await sayG(`${cap(a)} und ${cap(b)} zusammen ergibt ${cap(mix[0])}. Wir brauchen ${cap(col.w)}. Versuch es noch einmal.`);
        if (t !== G.token) return;
        sel.forEach(x => x.classList.remove("picked"));
        sel = []; setBowl();
        if (errors >= 2) pots.filter(x => x._opt.correct).forEach(x => x.classList.add("hint"));
        busy = false;
      }
    }));
    speak();
  });
}

// ---- Spiel: Sätze lesen ----
// Ein kurzer Satz – welches Bild passt? Die falschen Bilder unterscheiden sich nur in EINEM Wort,
// man muss also den ganzen Satz lesen.
const INDEF = { der: "einen", die: "eine", das: "ein" };
const capFirst = x => x.charAt(0).toUpperCase() + x.slice(1);
function sentText(t) { return S.letterCase === "upper" ? t.toUpperCase() : S.letterCase === "lower" ? t.toLowerCase() : t; }
function sceneHTML(a, b) { return `<span class="scene"><span class="s1">${a}</span><span class="s2">${b}</span></span>`; }
function taskSent(t, used) {
  const c = G.cfg;
  let sentence, spoken, right, others = [];
  if (c.kind === "color") {
    const pool = COLORS.slice(0, 6);
    const col = pick(pool), pic = pickFresh(COLOR_PICS, used, "sentpic");
    sentence = `${capFirst(pic.g)} ${pic.n} ist ${col.w}.`;
    right = { html: paintedSVG(pic, col.c) };
    const otherCols = shuffle(pool.filter(x => x !== col)), otherPics = shuffle(COLOR_PICS.filter(x => x !== pic));
    // gleiches Bild andere Farbe, gleiche Farbe anderes Bild, und eins von beidem
    others = [{ html: paintedSVG(pic, otherCols[0].c) }, { html: paintedSVG(otherPics[0], col.c) }, { html: paintedSVG(otherPics[1], otherCols[1].c) }];
  } else {
    const an = pickFresh(SENT_ANIMALS, used, "sentanimal"), th = pick(SENT_THINGS);
    sentence = c.kind === "and" ? `${an.w} und ${th.w}` : `${capFirst(an.g)} ${an.w} hat ${INDEF[th.g]} ${th.w}.`;
    right = { html: sceneHTML(an.e, th.e) };
    const an2 = shuffle(SENT_ANIMALS.filter(x => x !== an)), th2 = shuffle(SENT_THINGS.filter(x => x !== th));
    // anderes Ding / anderes Tier / beides anders
    others = [{ html: sceneHTML(an.e, th2[0].e) }, { html: sceneHTML(an2[0].e, th.e) }, { html: sceneHTML(an2[1].e, th2[1].e) }];
  }
  spoken = sentence;
  if (c.n === 2) others = [pick(others.slice(0, 2))];   // Stufe 1: mal ist das Tier, mal das Ding anders
  const opts = shuffle([Object.assign(right, { correct: true }), ...others.slice(0, c.n - 1)]);
  return choiceTask(t, {
    content: `<div class="sentence">${esc(sentText(sentence))}</div>`,
    bubble: "Welches Bild passt?", letter: null, nosay: true,
    options: opts.map(o => ({ html: o.html, cls: "pic scenepic", correct: !!o.correct })),
    speak: () => say(c.kind === "and" ? "Lies die beiden Wörter. Welches Bild passt?" : "Lies den Satz. Welches Bild passt?"),
    onWrong: (o, n) => n >= 2 ? `Hör zu: ${spoken}` : c.kind === "and" ? "Das passt noch nicht. Lies beide Wörter noch einmal genau." : "Das passt noch nicht. Lies den Satz noch einmal genau.",
    onRight: () => say(`${pick(PRAISE)} ${spoken}`),
  });
}

// ---- Spiel: Silben-Puzzle ----
// Ein Bild wird gezeigt; das Kind legt die Silbensteine in der richtigen Reihenfolge aneinander.
// Jeder richtig gelegte Stein spricht seine Silbe (Tondatei), am Ende das ganze Wort.
const PIECE_COLORS = ["#4d96ff", "#ef6f6c", "#3cb371", "#ff9f43", "#9b72cf"];
// Schrift so wählen, dass auch lange Silben (SCHENK) ganz in den Stein passen
// room = nutzbare Steinbreite / Zeichenbreite – je breiter der Stein, desto größer darf die Schrift sein
const pieceFont = (txt, base, room = 32) => `font-size:${u(Math.min(base, room / Math.max(1, txt.length)))}`;
function sylDisplay(w) {
  // Silben in der eingestellten Schrift (bei "Groß und klein" bleibt die erste Silbe groß)
  return w.s.split("-").map(p => S.letterCase === "upper" ? p.toUpperCase() : S.letterCase === "lower" ? p.toLowerCase() : p);
}
async function playOneSyllable(w, i) {
  const n = window.SYL_AUDIO && SYL_AUDIO[w.w];
  if (n && !S.muted) { stopSpeech(); const ok = await playClip(`silben/${slugW(w.w)}-${i + 1}.wav`); if (ok) return; }
  await say(sylTokens(w)[i] || "", "talk", 0.8, { german: true });
}
function taskPuzzle(t, used) {
  return new Promise(resolve => {
    const c = G.cfg;
    const nSyl = w => w.s.split("-").length;
    const fits = w => nSyl(w) >= c.minSyl && nSyl(w) <= c.maxSyl && w.s.split("-").join("") === w.w;
    let pool = WORDS.filter(fits);
    const known = poolByLevel(pool, 6);
    if (known.length >= 4) pool = known;
    const w = pickFresh(pool, used);
    const parts = sylDisplay(w);
    // falsche Steine: Silben anderer Wörter (Stufe 3: möglichst mit gleichem Anfangsbuchstaben)
    const low = new Set(parts.map(p => p.toLowerCase()));
    let cand = [...new Set(WORDS.filter(x => x !== w && nSyl(x) > 1).flatMap(x => sylDisplay(x)))]
      .filter(p => !low.has(p.toLowerCase()) && p.length >= 2);
    cand = shuffle(cand);
    if (c.similar) {
      const starts = new Set(parts.map(p => p[0].toLowerCase()));
      const sim = cand.filter(p => starts.has(p[0].toLowerCase()));
      cand = sim.concat(cand.filter(p => !sim.includes(p)));
    }
    const extra = cand.slice(0, c.extra).map(p => (S.letterCase === "mixed" ? p.toLowerCase() : p));
    const stones = safeOrder(parts.map((p, i) => ({ txt: p, idx: i })).concat(extra.map(p => ({ txt: p, idx: -1 }))), o => o.txt);
    const stage = $("#stage");
    // Aufbau: oben Eule + Bild, Mitte die Puzzle-Reihe, unten die Steine zum Auswählen
    stage.innerHTML = promptHTML(`<div class="bigpic" style="font-size:${u(17)}">${w.e}</div>`, "Lege das Wort aus den Steinen!")
      + `<div class="pzslots" id="pzslots"></div><div class="tiles pztiles n${stones.length}" id="pztiles"></div>`;
    let pos = 0, errs = 0, busy = false, firstTry = true;
    const colorOf = i => PIECE_COLORS[i % PIECE_COLORS.length];
    const showGhost = i => c.ghost === "always" || (c.ghost === "hint" && i === pos && errs >= 1);
    function drawSlots() {
      $("#pzslots").innerHTML = parts.map((p, i) => i < pos
        ? `<div class="pzslot filled" style="z-index:${20 - i}"><div class="piece" style="--pc:${colorOf(i)};${pieceFont(p, 8)}">${esc(p)}</div></div>`
        : `<div class="pzslot${i === pos ? " next" : ""}" style="z-index:${20 - i}"><span class="ghost" style="${pieceFont(p, 8)}">${showGhost(i) ? esc(p) : ""}</span></div>`).join("");
    }
    drawSlots();
    const els = stones.map((o, k) => {
      const d = document.createElement("div");
      d.className = "gaze stone";
      d.dataset.nosay = "1";
      d.innerHTML = `<div class="piece" style="--pc:${PIECE_COLORS[(k + 2) % PIECE_COLORS.length]};${pieceFont(o.txt, stones.length > 4 ? 8 : 9, stones.length > 5 ? 27 : stones.length > 4 ? 31 : 34)}">${esc(o.txt)}</div>`;
      d._o = o;
      $("#pztiles").appendChild(d);
      return d;
    });
    G.repeat = () => say(`Lege das Wort ${w.w}. Welcher Stein kommt ${pos === 0 ? "zuerst" : "als Nächstes"}?`);
    els.forEach(d => onSelect(d, async () => {
      if (busy || t !== G.token || d.classList.contains("placed")) return;
      const o = d._o;
      // richtig ist jeder Stein mit der passenden Silbe (wichtig bei doppelten Silben wie PA-PA-GEI)
      if (o.idx >= 0 && parts[o.idx].toLowerCase() === parts[pos].toLowerCase()) {
        busy = true;
        els.forEach(e => e.classList.remove("hint"));
        d.classList.add("placed", "correct");
        SFX.pop();
        pos++; errs = 0;
        drawSlots();
        setTimeout(() => { d.style.visibility = "hidden"; }, 250);
        await playOneSyllable(w, pos - 1);
        if (t !== G.token) return;
        if (pos >= parts.length) {
          G.repeat = null;
          SFX.success();
          stat(first(w), firstTry);
          els.forEach(e => { if (!e.classList.contains("placed")) e.classList.add("done"); });
          $("#pzslots").classList.add("complete");
          await sleep(300);
          await saySyllables(w);
          if (t !== G.token) return;
          await say(`${pick(PRAISE)} Das ist ${art(w)}!`);
          if (t === G.token) resolve(true);
          return;
        }
        busy = false;
      } else {
        errs++; firstTry = false; G.errors++;
        d.classList.add("wrong");
        SFX.wrong();
        setTimeout(() => d.classList.remove("wrong"), 500);
        drawSlots();
        if (errs >= 2) {
          const right = els.find(e => !e.classList.contains("placed") && e._o.idx >= 0 && parts[e._o.idx].toLowerCase() === parts[pos].toLowerCase());
          if (right) right.classList.add("hint");
          say("Schau, dieser Stein passt jetzt.");
        } else say(o.idx < 0 ? "Der gehört nicht zu diesem Wort." : "Der kommt erst später. Welcher passt jetzt?");
      }
    }));
    G.repeat();
  });
}

// ---- Spiel: Wörter schreiben ----
function taskWrite(t, used) {
  return new Promise(resolve => {
    const c = G.cfg;
    const w = pickFresh(writeWords(c.maxLen), used);
    const target = [...fw(w.w)];
    const uniq = [...new Set(target)];
    const MAX_TILES = 6;   // große Kacheln mit viel Abstand
    const nExtra = Math.max(0, Math.min(c.extra, MAX_TILES - uniq.length));
    const extra = distractLetters(target[0].toUpperCase(), nExtra, { exclude: uniq }).map(fc);
    const tiles = safeOrder(uniq.concat(extra));
    const stage = $("#stage");
    stage.innerHTML = promptHTML(
      `<div class="bigpic" style="font-size:${u(20)}">${w.e}</div><div class="slots" id="slots"></div>`, "") +
      `<div class="tiles" id="tiles"></div>`;
    let pos = 0, errs = 0, busy = false, firstTry = true;
    const slots = $("#slots");
    const showTpl = i => c.template === "always" || (c.template === "hint" && i === pos && errs >= 1);
    function drawSlots() {
      slots.innerHTML = target.map((ch, i) =>
        `<div class="slot ${i < pos ? "filled" : ""} ${i === pos ? "next" : ""}">${i < pos ? esc(ch) : (showTpl(i) ? esc(ch) : "")}</div>`).join("");
    }
    drawSlots();
    const tileEls = tiles.map(ch => {
      const d = document.createElement("div");
      d.className = "gaze opt";
      d.textContent = ch;
      d.dataset.say = LN(ch);
      d._ch = ch;
      $("#tiles").appendChild(d);
      return d;
    });
    const nT = tileEls.length, tw = Math.min(13, (94 - (nT - 1) * 2) / nT);   // in Bildschirmbreite-Einheiten
    $("#tiles").style.gap = `calc(${nT > 6 ? 2 : 3} * var(--w))`;
    tileEls.forEach(d => { d.style.width = `calc(${tw} * var(--w))`; });
    fitText($("#stage"));
    G.repeat = () => say(`Schreib das Wort ${w.w}.`);
    tileEls.forEach(d => onSelect(d, async () => {
      if (busy || t !== G.token) return;
      if (d._ch === target[pos]) {
        tileEls.forEach(e => e.classList.remove("hint"));
        d.classList.add("correct");
        setTimeout(() => d.classList.remove("correct"), 600);
        pos++; errs = 0;
        drawSlots();
        if (pos >= target.length) {
          busy = true; G.repeat = null;
          SFX.success();
          stat(first(w), firstTry);
          await say(`${pick(PRAISE)} Du hast ${w.w} geschrieben!`);
          if (t === G.token) resolve(true);
        } else say(LN(d._ch));
      } else {
        errs++; firstTry = false; G.errors++;
        d.classList.add("wrong");
        SFX.wrong();
        setTimeout(() => d.classList.remove("wrong"), 500);
        drawSlots();
        const need = target[pos];
        if (errs >= 2) {
          tileEls.find(e => e._ch === need).classList.add("hint");
          say(`Wir brauchen jetzt den Buchstaben ${LN(need)}.`);
        } else say(`Hör genau: ${w.w}. Was kommt jetzt?`, "talk", .85);
      }
    }));
    G.repeat();
  });
}

// ---- Spiel: Buchstaben entdecken ----
const EX = { L: null, words: [], i: 0 };
function runExplore(t) {
  setTitle("Buchstaben entdecken");
  const list = ALPHABET.filter(L => anlautWords(L).length);
  const cols = list.length > 24 ? 7 : list.length > 18 ? 6 : 5;
  $("#stage").innerHTML = `<div class="lettergrid" id="lg" style="grid-template-columns:repeat(${cols},1fr)"></div>`;
  const known = new Set(letters());
  list.forEach(L => {
    const d = document.createElement("div");
    d.className = "gaze opt";
    d.textContent = fl(L);
    d.dataset.say = LN(L);
    if (known.has(L)) d.style.background = "#fff1c9";
    onSelect(d, () => openExplore(L));
    $("#lg").appendChild(d);
  });
  G.repeat = () => say("Schau einen Buchstaben an. Ich zeige dir ein Bild dazu.");
  G.repeat();
}
function openExplore(L) {
  EX.L = L; EX.words = shuffle(anlautWords(L)); EX.i = 0;
  $("#explore").classList.add("show");
  showExplore();
}
function showExplore() {
  const w = EX.words[EX.i % EX.words.length];
  const word = fw(w.w);
  $("#exLetter").textContent = fl(EX.L);
  const pic = $("#exPic");
  pic.innerHTML = w.e;
  pic.style.animation = "none"; void pic.offsetWidth; pic.style.animation = "";
  $("#exWord").innerHTML = `<span style="color:var(--orange)">${esc(word[0])}</span>${esc(word.slice(1))}`;
  say(`${LN(EX.L)} wie ${w.w}.`);
}

// ---- Spiel: Memory ----
function runMemory(t) {
  const c = G.cfg;
  const pairs = c.pairs;
  const cards = [];
  if (c.kind === "word") {
    // Stufe 3: Bild + geschriebenes Wort
    let pool = shuffle(readingWords(7, pairs + 2));
    const chosen = [];
    for (const w of pool) { if (chosen.length >= pairs) break; if (!chosen.some(x => x.e === w.e)) chosen.push(w); }
    chosen.forEach(w => {
      cards.push({ key: w.w, w, html: esc(fw(w.w)), say: w.w, cls: "wordcard" });
      cards.push({ key: w.w, w, html: w.e, say: art(w) });
    });
  } else {
    let Ls = shuffle(lettersWithWords()).slice(0, pairs);
    if (Ls.length < pairs) Ls = Ls.concat(shuffle(ALPHABET.filter(L => !Ls.includes(L) && anlautWords(L).length)).slice(0, pairs - Ls.length));
    Ls.forEach(L => {
      const w = pick(anlautWords(L));
      cards.push({ key: L, L, w, html: esc(fl(L)), say: LN(L) });
      cards.push({ key: L, L, w, html: w.e, say: art(w) });
    });
  }
  // Reihenfolge prüfen: Buchstaben-/Wortkarten nebeneinander dürfen nichts Unpassendes ergeben
  const deck = safeOrder(cards, cd => cd.L ? cd.L : (cd.cls ? cd.w.w : " "));
  const cols = pairs <= 4 ? pairs : 4;
  $("#stage").innerHTML = `<div class="memgrid" id="mem" style="grid-template-columns:repeat(${cols},1fr)"></div>`;
  setProgress(0, pairs);
  let open = [], matched = 0, lock = false;
  deck.forEach(cd => {
    const d = document.createElement("div");
    d.className = "gaze card";
    d.dataset.nosay = "1";
    d.innerHTML = `<span class="back">❓</span>`;
    d._c = cd;
    onSelect(d, async () => {
      if (lock || t !== G.token || d.classList.contains("open")) return;
      d.classList.add("open");
      if (cd.cls) d.classList.add(cd.cls);
      d.innerHTML = cd.html;
      SFX.flip();
      open.push(d);
      if (open.length < 2) { say(cd.say); return; }
      lock = true;
      const [a, b] = open;
      await say(cd.say);
      if (t !== G.token) return;
      if (a._c.key === b._c.key) {
        a.classList.add("matched"); b.classList.add("matched");
        SFX.success();
        if (cd.L) stat(cd.L, true);
        matched++;
        setProgress(matched, pairs);
        await say(cd.L ? `${pick(PRAISE)} ${LN(cd.L)} wie ${cd.w.w}.` : `${pick(PRAISE)} Da steht ${cd.w.w}.`);
        if (t !== G.token) return;
        if (matched === pairs) { await sleep(400); finishRound(t); return; }
      } else {
        await sleep(900);
        if (t !== G.token) return;
        [a, b].forEach(x => { x.classList.remove("open", "wordcard"); x.innerHTML = `<span class="back">❓</span>`; });
      }
      open = []; lock = false;
    });
    $("#mem").appendChild(d);
  });
  G.repeat = () => say(c.kind === "word" ? "Finde immer ein Wort und das passende Bild." : "Finde immer einen Buchstaben und das passende Bild.");
  G.repeat();
}

// ---- Spiel: Ballon-Jagd ----
const BALLOON_COLORS = ["#ef6f6c", "#4d96ff", "#3cb371", "#ff9f43", "#9b72cf", "#ff7eb6", "#20b2aa"];
function runBalloon(t) {
  const c = G.cfg;
  const L = nextLetter(new Set());
  const w = pick(anlautWords(L));
  const goal = S.round;
  const distract = distractLetters(L, 3, { similar: c.similar });
  let count = 0, done = false;
  $("#stage").innerHTML = `<div class="prompt" style="flex:0 0 auto">
      <div class="mascot" style="font-size:${u(9)}">🦉</div>
      <div class="bubble">Lass alle <b style="color:var(--blue);font-size:${u(7)}">${esc(fl(L))}</b>-Ballons platzen!</div>
      <div style="font-size:${u(10)}">${w.e}</div></div>
    <div id="balloonField"></div>`;
  setProgress(0, goal);
  G.repeat = () => say(`Lass alle Ballons mit dem Buchstaben ${LN(L)} platzen! ${LN(L)} wie ${w.w}.`);
  G.repeat();
  const field = $("#balloonField");
  const balloons = [];
  const BW = 22 * 10.8;   // Ballonbreite in Bildflächen-Pixeln
  let lastSpawn = -99999, lastT = 0, sinceTarget = 0;

  const BH = 27 * 10.8;   // Ballonhöhe
  function spawn() {
    const fw_ = field.clientWidth, fh = field.clientHeight;
    const isT = sinceTarget >= 1 || Math.random() < 0.5;
    const ch = isT ? L : pick(distract);
    // Zwei gleiche Buchstaben nie auf gleicher Höhe nebeneinander (z. B. "S S")
    if (balloons.some(b => b.alive && b.ch === ch && b.y > fh - BH * 1.2)) return false;
    sinceTarget = isT ? 0 : sinceTarget + 1;
    let x = 0;
    for (let k = 0; k < 15; k++) {
      x = Math.random() * Math.max(1, fw_ - BW);
      if (balloons.every(b => !b.alive || b.y < fh * 0.45 || Math.abs(b.x - x) > BW * 1.2)) break;
    }
    const el = document.createElement("div");
    el.className = "gaze balloon notyet";
    el.textContent = fl(ch);
    el.style.background = pick(BALLOON_COLORS);
    el.dataset.say = LN(ch);
    el.dataset.fast = "1";
    const b = { el, ch, x, y: fh + 10, ph: Math.random() * 6, alive: true };
    el.style.left = x + "px"; el.style.top = b.y + "px";
    onSelect(el, () => hit(b));
    field.appendChild(el);
    balloons.push(b);
    return true;
  }
  function hit(b) {
    if (!b.alive || done || t !== G.token) return;
    if (b.ch === L) {
      b.alive = false;
      b.el.classList.add("popped");
      SFX.pop();
      stat(L, true);
      count++;
      setProgress(count, goal);
      setTimeout(() => b.el.remove(), 400);
      if (count >= goal) {
        done = true;
        setTimeout(() => { if (t === G.token) finishRound(t); }, 800);
      } else if (count % 2 === 0) say(pick(PRAISE));
    } else {
      G.errors++;
      SFX.wrong();
      b.el.classList.add("wrong");
      setTimeout(() => b.el.classList.remove("wrong"), 500);
      say(`Das ist der Buchstabe ${LN(b.ch)}. Wir suchen den Buchstaben ${LN(L)}.`);
    }
  }
  function frame(now) {
    if (t !== G.token) return;
    const dt = lastT ? Math.min(100, now - lastT) / 1000 : 0;
    lastT = now;
    const paused = $("#talk").classList.contains("show");
    if (!done && !paused) {
      const fh = field.clientHeight;
      const sp = c.speed * (S.balloonSpeed || 1);       // Stufe × eingestelltes Tempo
      const speed = fh / (12 / sp);                     // etwas schneller als zuvor (16 -> 12 s pro Feldhöhe)
      const alive = balloons.filter(b => b.alive).length;
      if (alive < 4 && now - lastSpawn > 2300 / sp && spawn()) lastSpawn = now;
      balloons.forEach(b => {
        if (!b.alive) return;
        b.y -= speed * dt;
        b.el.style.top = b.y + "px";
        b.el.style.left = (b.x + Math.sin(b.ph + now / 900) * 12) + "px";
        // erst anwählbar, wenn der Buchstabe (Mitte des Ballons) ganz zu sehen ist
        b.el.classList.toggle("notyet", b.y + BH * 0.78 > fh || b.y + BH * 0.2 < 0);
        if (b.y < -STAGE_H * 0.3) { b.alive = false; b.el.remove(); }
      });
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------------
//  Belohnung & Freischalten
// ---------------------------------------------------------------------
async function finishRound(t) {
  if (t !== G.token) return;
  G.repeat = null;
  const id = G.game, lvl = G.level;
  let unlocked = false;
  if (LV[id] && !S.allLevels) {
    const p = levels[id] || (levels[id] = { max: 1, good: 0 });
    if (lvl === p.max && p.max < 3 && G.errors <= 2) {
      p.good++;
      if (p.good >= (S.unlockRounds || 3)) { p.max++; p.good = 0; unlocked = true; }
    }
    save("levels", levels);
  }
  const s = pick(STICKERS);
  stickers.push(s);
  save("stickers", stickers);
  $("#rewardSticker").textContent = s;
  $("#rewardMsg").textContent = unlocked
    ? `Neue Stufe freigeschaltet! ${stars(lvl + 1)}`
    : "Super gemacht! Ein neuer Sticker für dich!";
  const canNext = LV[id] && lvl < maxLevel(id);
  $("#rewNext").classList.toggle("show", !!canNext);
  $("#rewNextStars").textContent = stars(Math.min(3, lvl + 1));
  $("#reward").classList.add("show");
  SFX.fanfare();
  confetti();
  await sleep(900);
  if (t !== G.token) return;
  say(unlocked
    ? "Wow! Du hast einen Sticker bekommen und eine neue Stufe freigeschaltet!"
    : "Super gemacht! Du hast einen neuen Sticker bekommen! Möchtest du nochmal spielen?");
}

function confetti() {
  const cv = $("#confetti");
  const ctx = cv.getContext("2d");
  const W = cv.width, H = cv.height;
  const cols = ["#ef6f6c", "#4d96ff", "#3cb371", "#ffd93d", "#ff9f43", "#9b72cf", "#ff7eb6"];
  const parts = Array.from({ length: 160 }, () => ({
    x: Math.random() * W, y: -Math.random() * H * .5,
    vx: (Math.random() - .5) * 3, vy: 2 + Math.random() * 4,
    r: 8 + Math.random() * 12, a: Math.random() * 6, va: (Math.random() - .5) * .3, c: pick(cols),
  }));
  const t0 = performance.now();
  (function draw(now) {
    ctx.clearRect(0, 0, W, H);
    parts.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.a += p.va;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a);
      ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
      ctx.restore();
    });
    if (now - t0 < 3500) requestAnimationFrame(draw); else ctx.clearRect(0, 0, W, H);
  })(t0);
}

// ---------------------------------------------------------------------
//  Mitteil-Tafel ("Ich möchte sagen …")
// ---------------------------------------------------------------------
const Talk = { last: null, prevRepeat: null };
function parseTalk(txt) {
  return String(txt || "").split(/\r?\n/).map(l => l.trim()).filter(Boolean).slice(0, 12).map(l => {
    const [ico = "", label = "", text = ""] = l.split(";").map(x => x.trim());
    return { ico, label, text: text || label };
  }).filter(x => x.label);
}
function talkIcon(ico) {
  const m = ico.match(/^\[(\w+)\]$/);
  if (m && PICS[m[1].toLowerCase()]) return PICS[m[1].toLowerCase()];
  return esc(ico);
}
function buildTalk() {
  const grid = $("#talkGrid");
  grid.innerHTML = "";
  parseTalk(S.talk).forEach(it => {
    const d = document.createElement("div");
    d.className = "gaze";
    if (/^ja$/i.test(it.label)) d.classList.add("yes");
    if (/^nein$/i.test(it.label)) d.classList.add("no");
    d.dataset.nosay = "1";
    d.innerHTML = `<div class="ico">${talkIcon(it.ico)}</div><div>${esc(it.label)}</div>`;
    onSelect(d, () => {
      grid.querySelectorAll(".said").forEach(x => x.classList.remove("said"));
      d.classList.add("said");
      Talk.last = it;
      const title = $("#talkSaid");
      title.innerHTML = `${talkIcon(it.ico)} ${esc(it.text)}`;
      title.classList.remove("said"); void title.offsetWidth; title.classList.add("said");
      say(it.text, "talk", 1, { force: true });
    });
    grid.appendChild(d);
  });
}
function openTalk() {
  stopSpeech();
  buildTalk();
  Talk.last = null;
  const title = $("#talkSaid");
  title.textContent = "Ich möchte sagen …";
  title.classList.remove("said");
  $("#talk").classList.add("show");
  say("Was möchtest du sagen?", "talk", 1, { force: true });
}
function closeTalk() {
  $("#talk").classList.remove("show");
  stopSpeech();
  // zurück in der Übung: Aufgabe noch einmal vorlesen
  if ($("#game").classList.contains("active") && G.repeat) setTimeout(() => G.repeat && G.repeat(), 300);
}

// ---------------------------------------------------------------------
//  Sticker-Album
// ---------------------------------------------------------------------
function openAlbum() {
  G.token++; G.game = null; stopSpeech();
  show("album");
  const box = $("#stickers");
  box.innerHTML = stickers.length
    ? stickers.map(s => `<div>${esc(s)}</div>`).join("")
    : `<div class="empty">Noch keine Sticker. Spiel eine Runde, dann bekommst du deinen ersten Sticker! 🌟</div>`;
  box.scrollTop = box.scrollHeight;          // die neuesten Sticker zuerst zeigen
  updateAlbumScroll();
  albumSay();
}
// Passen nicht alle Sticker auf eine Seite, erscheinen rechts zwei große Knöpfe zum Blättern
function updateAlbumScroll() {
  const box = $("#stickers"), up = $("#stkUp"), down = $("#stkDown");
  const more = box.scrollHeight > box.clientHeight + 4;
  $("#album").classList.toggle("scrollable", more);
  up.classList.toggle("disabled", !more || box.scrollTop <= 2);
  down.classList.toggle("disabled", !more || box.scrollTop + box.clientHeight >= box.scrollHeight - 2);
}
function albumScroll(dir) {
  const box = $("#stickers");
  const from = box.scrollTop, to = Math.max(0, Math.min(box.scrollHeight - box.clientHeight, from + dir * box.clientHeight * 0.85));
  const t0 = performance.now(), dur = 380;
  const step = now => {                          // sanft blättern
    const k = Math.min(1, (now - t0) / dur);
    box.scrollTop = from + (to - from) * (1 - Math.pow(1 - k, 3));
    if (k < 1) requestAnimationFrame(step); else updateAlbumScroll();
  };
  requestAnimationFrame(step);
}
function albumSay() {
  const n = stickers.length;
  say(n === 0 ? "Du hast noch keine Sticker. Spiel eine Runde!" : n === 1 ? "Du hast schon einen Sticker!" : `Toll! Du hast schon ${n} Sticker gesammelt!`);
}

// ---------------------------------------------------------------------
//  Einstellungen
// ---------------------------------------------------------------------
function saveS() { save("settings", S); applyS(); }
function applyS() {
  document.body.classList.toggle("hide-cursor", !!S.hideCursor);
  document.body.classList.toggle("no-dwell", !dwellOn());
  $("#gazeDot").style.display = S.dot ? "block" : "none";
  if (!dwellOn() && Gaze.target) Gaze.target.style.setProperty("--dwell", 0);
  updateMuteButtons();
}
function fillVoiceSelect() {
  const sel = $("#setVoice");
  if (!sel) return;
  const best = bestVoice();
  const sapi = NativeTTS.voices.map(v => `<option value="sapi:${esc(v.name)}">🔊 ${esc(v.name)} (${esc(v.lang)}) – Windows/Tobii-Sprachausgabe</option>`).join("");
  sel.innerHTML = sapi + (Speech.voices.map(v => `<option value="${esc(v.name)}">${esc(v.name)} (${esc(v.lang)})${isMulti(v) ? " – mehrsprachig, nicht empfohlen" : ""}</option>`).join("")
    || (sapi ? "" : `<option value="">Keine Stimme gefunden</option>`));
  sel.value = S.voice || (best ? best.name : "");
}
// ---------------------------------------------------------------------
//  Eingabe-Dialog (für Erwachsene): Bildschirmtastatur öffnet sich automatisch,
//  beim Bild-Feld zusätzlich die Windows-Emoji-Auswahl
// ---------------------------------------------------------------------
const DLG_EMOJI = ["🍎","🍌","🍓","🥤","🍽️","🍦","🍪","🥨","🚽","🛁","🛏️","😴","🎵","📺","📖","🧸","⚽","🎨","🚗","🌳","☀️","🌧️",
  "👍","👎","🔁","🏁","⏸️","❓","❤️","😊","😢","😡","🤒","🤕","🥶","🥵","👋","🙏","🦊","🐻","🐼","🦁","🐸","🐰","🐱","🐶","🦄","🐧"];
const Dlg = { osk: false, emojiOpened: false };
// Während die Tastatur offen ist, wird das Einstellungs-/Eingabefenster kleiner und rückt nach oben;
// die Tastatur dockt direkt darunter an (über die volle Breite) und überdeckt nichts.
function oskLayout(on) {
  document.body.classList.toggle("kb-open", on);
}
function keepCaretVisible(ta) {
  // Zeile mit dem Eingabe-Strich sichtbar halten (im Textfeld UND im Einstellungsfenster)
  const before = ta.value.slice(0, ta.selectionStart || 0);
  const line = before.split("\n").length - 1;
  const lh = parseFloat(getComputedStyle(ta).lineHeight) || 22;
  const caretY = line * lh;
  if (caretY < ta.scrollTop || caretY > ta.scrollTop + ta.clientHeight - lh) ta.scrollTop = Math.max(0, caretY - ta.clientHeight / 2);
  const panel = $("#settings .panel"), pr = panel.getBoundingClientRect(), tr = ta.getBoundingClientRect();
  const yInPanel = tr.top - pr.top + (caretY - ta.scrollTop);
  if (yInPanel < 60 || yInPanel > panel.clientHeight - 40) panel.scrollTop += yInPanel - panel.clientHeight / 2;
}
function oskAnchor() {
  // Unterkante des Knopfs "⌨ Bildschirmtastatur ein/aus" (bzw. des Textfelds der Mitteil-Tafel)
  // Tastatur beginnt unter dem Knopf bzw. unter dem ganzen Eingabefenster und ist darunter zentriert
  const dlg = $("#dlg").classList.contains("show");
  const box = (dlg ? document.querySelector("#dlg .dlgbox") : $("#settings .panel")).getBoundingClientRect();
  return { top: (box.bottom + 8) / window.innerHeight, left: 0, right: 1, dock: true };
}
function oskShow(on, force) {
  if (!Native.on || (Dlg.osk === on && !force)) return;
  Dlg.osk = on;
  oskLayout(on);
  // erst das Fenster verkleinern (Layout), dann die Tastatur darunter andocken
  setTimeout(() => Native.post(Object.assign({ t: "osk", show: on }, on ? oskAnchor() : {})), on ? 60 : 0);
}
function openDialog(title, fields, okText = "Übernehmen") {
  return new Promise(resolve => {
    $("#dlgTitle").textContent = title;
    $("#dlgOk").textContent = okText;
    Dlg.emojiOpened = false;
    const box = $("#dlgFields");
    box.innerHTML = "";
    fields.forEach(f => {
      const d = document.createElement("div");
      d.className = "fld";
      d.innerHTML = `<label for="dlg_${f.id}">${esc(f.label)}</label><input id="dlg_${f.id}" class="${f.type === "emoji" ? "emoji" : ""}" maxlength="${f.type === "emoji" ? 8 : 80}" autocomplete="off">`
        + (f.type === "emoji" ? `<div class="emojis">${DLG_EMOJI.map(e => `<button type="button">${e}</button>`).join("")}</div>
           <div class="note">Weitere Bilder: Windows-Emoji-Auswahl mit <span class="kbd">Windows-Taste</span> + <span class="kbd">.</span> (Punkt) – öffnet sich beim ersten Antippen des Feldes automatisch.</div>` : "");
      const inp = d.querySelector("input");
      inp.value = f.value || "";
      if (f.placeholder) inp.placeholder = f.placeholder;
      inp.addEventListener("focus", () => {
        oskShow(true);
        if (f.type === "emoji" && !Dlg.emojiOpened && Native.on) { Dlg.emojiOpened = true; inp.select(); Native.post({ t: "emojipanel" }); }
      });
      inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); $("#dlgOk").click(); } });
      d.querySelectorAll(".emojis button").forEach(b => b.onclick = () => { inp.value = b.textContent; inp.focus(); });
      box.appendChild(d);
    });
    $("#dlgHint").innerHTML = Native.on ? "Die Bildschirmtastatur öffnet sich automatisch und lässt sich mit „⌨ Bildschirmtastatur ein/aus“ oder ihrem eigenen ✕ wieder schließen." : "";
    $("#dlgKb").style.display = Native.on ? "" : "none";
    const close = val => {
      $("#dlg").classList.remove("show");
      oskShow(false);
      resolve(val);
    };
    $("#dlgOk").onclick = () => {
      const val = {};
      fields.forEach(f => { val[f.id] = $("#dlg_" + f.id).value.trim(); });
      const miss = fields.find(f => f.required && !val[f.id]);
      if (miss) { $("#dlg_" + miss.id).focus(); toast("Bitte „" + miss.label + "“ ausfüllen"); return; }
      close(val);
    };
    $("#dlgCancel").onclick = () => close(null);
    $("#dlgKb").onclick = () => oskShow(!Dlg.osk, true);
    $("#dlg").classList.add("show");
    setTimeout(() => { const first = box.querySelector("input"); if (first) first.focus(); }, 50);
  });
}

// ---------------------------------------------------------------------
//  Profile
// ---------------------------------------------------------------------
const PROFILE_EMOJI = ["🦊", "🐻", "🐼", "🦁", "🐸", "🐰", "🐱", "🐶", "🦄", "🐧", "🐢", "🦋"];
function saveProfiles() { gsave("profiles", PROFILES); }
// Profil wechseln: alles Aktuelle ist schon gespeichert – neu laden und gleich loslegen
function switchProfile(id, autostart = true) {
  if (id !== PROFILE) {
    gsave("profile", id);
    try { if (autostart) sessionStorage.setItem("abc_autostart", "1"); } catch (e) { }
    stopSpeech();
    location.reload();
  } else if (autostart) startApp();
}
function renderProfiles() {
  const box = $("#profileList");
  $("#setProfilesOn").checked = !!PROFILES.on;
  $("#profileArea").style.display = PROFILES.on ? "" : "none";
  box.innerHTML = PROFILES.list.map(p => `<div class="prow${p.id === PROFILE ? " cur" : ""}">
      <span class="pname">${esc(p.emoji)} ${esc(p.name)}${p.id === PROFILE ? " <b>(aktiv)</b>" : ""}</span>
      ${p.id === PROFILE ? "" : `<button data-act="use" data-id="${p.id}">Wechseln</button>`}
      <button data-act="ren" data-id="${p.id}">Umbenennen</button>
      ${p.id === PROFILE ? "" : `<button data-act="del" data-id="${p.id}">Löschen</button>`}
    </div>`).join("");
  box.querySelectorAll("button").forEach(b => b.onclick = () => {
    const p = PROFILES.list.find(x => x.id === b.dataset.id);
    if (b.dataset.act === "use") { saveSettingsNow(); switchProfile(p.id, false); }
    if (b.dataset.act === "ren") {
      openDialog("👤 Profil ändern", [
        { id: "name", label: "Name des Kindes", value: p.name, required: true },
        { id: "emoji", label: "Bild (ein Emoji)", type: "emoji", value: p.emoji },
      ]).then(v => {
        if (!v) return;
        p.name = v.name.slice(0, 20) || p.name;
        if (v.emoji) p.emoji = v.emoji;
        saveProfiles(); renderProfiles(); renderStartProfiles(); buildMenuTitle();
      });
    }
    if (b.dataset.act === "del") {
      if (!confirm(`Profil „${p.name}“ mit Lernstand, Stickern und Einstellungen löschen?`)) return;
      removeProfileData(p.id);
      PROFILES.list = PROFILES.list.filter(x => x !== p);
      saveProfiles(); renderProfiles(); renderStartProfiles();
      toast(`🗑 Profil „${p.name}“ gelöscht`);
    }
  });
}
// alle gespeicherten Daten eines Profils entfernen ("default" nutzt die Speicherplätze ohne Vorsilbe)
const PROFILE_KEYS = ["settings", "stats", "stickers", "levels", "recent"];
function removeProfileData(id) {
  PROFILE_KEYS.forEach(k => { try { localStorage.removeItem("abc_" + (id === "default" ? k : "p_" + id + "_" + k)); } catch (e) { storageProblem(e, k); } });
}
// Alles löschen: alle Kinderprofile mit Lernstand, Stufen, Stickern, Einstellungen und Mitteil-Tafel
function deleteAllData() {
  if (!confirm("Wirklich ALLE Kinderprofile löschen – mit Lernstand, Stufen, Stickern, Einstellungen und Mitteil-Tafel?\n\nTipp: Vorher eine Sicherung speichern.")) return;
  if (!confirm("Letzte Rückfrage: Alles unwiderruflich löschen?")) return;
  try {
    Object.keys(localStorage).filter(k => k.indexOf("abc_") === 0).forEach(k => localStorage.removeItem(k));
    hostLog("Alle Profile und Daten gelöscht");
  } catch (e) { storageProblem(e, "alles löschen"); return; }
  stopSpeech();
  location.reload();
}

// ---------- (13) Lernfortschritt sichern und wiederherstellen ----------
// Sicherung = alle gespeicherten ABC-Abenteuer-Daten (alle Profile) als JSON-Datei
function collectBackup() {
  const data = {};
  Object.keys(localStorage).filter(k => k.indexOf("abc_") === 0 && k !== "abc__test").forEach(k => { data[k] = localStorage.getItem(k); });
  return JSON.stringify({ app: "ABC-Abenteuer", format: 1, version: APP_VERSION, created: new Date().toISOString(), data }, null, 1);
}
function backupName() { const d = new Date(); return `ABC-Abenteuer-Sicherung-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function saveBackup() {
  saveSettingsNow();
  let json;
  try { json = collectBackup(); } catch (e) { storageProblem(e, "Sicherung"); toast("⚠ Sicherung nicht möglich"); return; }
  if (Native.on) { Native.post({ t: "backup", data: json, name: backupName() }); return; }
  const a = document.createElement("a");           // Browser: als Datei herunterladen
  a.href = URL.createObjectURL(new Blob([json], { type: "application/json" }));
  a.download = backupName() + ".json"; document.body.appendChild(a); a.click(); a.remove();
}
function loadBackup() {
  if (Native.on) { Native.post({ t: "restore" }); return; }
  const inp = document.createElement("input"); inp.type = "file"; inp.accept = ".json,application/json";
  inp.onchange = () => { const f = inp.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => restoreBackup(String(r.result)); r.readAsText(f); };
  inp.click();
}
// Sicherung prüfen und übernehmen – nur eigene Daten, jeder Eintrag muss gültiges JSON sein
function restoreBackup(text) {
  let b;
  try { b = JSON.parse(text); } catch (e) { toast("⚠ Das ist keine gültige Sicherungsdatei."); return; }
  if (!isObj(b) || b.app !== "ABC-Abenteuer" || !isObj(b.data)) { toast("⚠ Das ist keine Sicherung des ABC-Abenteuers."); return; }
  const entries = Object.entries(b.data).filter(([k, v]) => /^abc_[A-Za-z0-9_]{1,60}$/.test(k) && typeof v === "string" && v.length < 2000000);
  for (const [k, v] of entries) { try { JSON.parse(v); } catch (e) { toast("⚠ Die Sicherung ist beschädigt (" + k + ")."); return; } }
  if (!entries.length) { toast("⚠ Die Sicherung enthält keine Daten."); return; }
  const when = b.created ? new Date(b.created).toLocaleDateString("de-DE") : "?";
  if (!confirm(`Sicherung vom ${when} laden?\n\nAlle jetzigen Profile, Lernstände, Sticker und Einstellungen werden dadurch ersetzt.`)) return;
  try {
    Object.keys(localStorage).filter(k => k.indexOf("abc_") === 0).forEach(k => localStorage.removeItem(k));
    entries.forEach(([k, v]) => localStorage.setItem(k, v));
    hostLog("Sicherung geladen (" + entries.length + " Einträge, vom " + when + ")");
  } catch (e) { storageProblem(e, "Sicherung laden"); toast("⚠ Die Sicherung konnte nicht vollständig geladen werden."); return; }
  stopSpeech();
  location.reload();
}

const MAX_PROFILES = 12;
async function addProfile() {
  if (PROFILES.list.length >= MAX_PROFILES) { toast(`Es sind schon ${MAX_PROFILES} Profile angelegt – bitte erst eines löschen`); return; }
  const used = new Set(PROFILES.list.map(p => p.emoji));
  const v = await openDialog("👤 Neues Profil", [
    { id: "name", label: "Name des Kindes", required: true, placeholder: "z. B. Lena" },
    { id: "emoji", label: "Bild (ein Emoji)", type: "emoji", value: PROFILE_EMOJI.find(e => !used.has(e)) || "🙂" },
  ], "Profil anlegen");
  if (!v) return;
  const p = { id: "k" + Date.now().toString(36), name: v.name.slice(0, 20), emoji: v.emoji || PROFILE_EMOJI.find(e => !used.has(e)) || "🙂" };
  // Einstellungen des aktuellen Profils übernehmen (Lernstand, Stufen und Sticker beginnen leer)
  gsave("p_" + p.id + "_settings", Object.assign({}, S));
  PROFILES.list.push(p); PROFILES.on = true;
  saveProfiles(); renderProfiles(); renderStartProfiles();
  toast(`👤 Profil „${p.name}“ angelegt`);
}
// Startbildschirm: "Wer spielt?" mit einer Kachel pro Kind
function renderStartProfiles() {
  const box = $("#startProfiles");
  const on = PROFILES.on && PROFILES.list.length > 0;
  box.style.display = on ? "" : "none";
  $("#btnStart").style.display = on ? "none" : "";
  if (!on) return;
  box.innerHTML = `<div class="who">Wer spielt?</div><div class="ptiles"></div>`;
  // bis 5 Kinder: große Kacheln in einer Reihe; ab 6: zwei Reihen à 6, kleinere Kacheln, Eule ausgeblendet
  document.body.classList.toggle("many-profiles", PROFILES.list.length > 5);
  PROFILES.list.forEach(p => {
    const d = document.createElement("div");
    d.className = "gaze ptile" + (p.id === PROFILE ? " cur" : "");
    d.dataset.say = p.name;
    d.innerHTML = `<div class="pe">${esc(p.emoji)}</div><div>${esc(p.name)}</div>`;
    onSelect(d, () => switchProfile(p.id, true));
    box.querySelector(".ptiles").appendChild(d);
  });
}
function buildMenuTitle() {
  const t = $("#menu .topbar .title");
  if (t) t.textContent = PROFILES.on && profileName() ? `Was möchtest du spielen, ${profileName()}? 🦉` : "Was möchtest du spielen? 🦉";
}

function renderStats() {
  const rows = Object.keys(stats).sort().map(L => {
    const s = stats[L], tot = s.r + s.w, pct = tot ? Math.round(100 * s.r / tot) : 0;
    const col = pct >= 80 ? "#d9f7e4" : pct >= 50 ? "#fff1c9" : "#ffe3e2";
    return `<tr><td><b>${L}</b></td><td>${s.r}</td><td>${s.w}</td><td style="background:${col}">${pct} %</td></tr>`;
  }).join("");
  $("#stats").innerHTML = rows
    ? `<table><tr><th>Buchstabe</th><th>auf Anhieb richtig</th><th>mit Fehler</th><th>Quote</th></tr>${rows}</table>
       <div class="note">Buchstaben mit niedriger Quote werden in den Spielen automatisch etwas häufiger geübt. Gesammelte Sticker: ${stickers.length}</div>`
    : `<div class="note">Noch keine Daten.</div>`;
  $("#levelInfo").innerHTML = `<table><tr><th>Spiel</th><th>freigeschaltet</th></tr>` +
    GAMES.filter(g => LV[g.id]).map(g => `<tr><td>${g.ico} ${g.name}</td><td>${stars(maxLevel(g.id))}</td></tr>`).join("") + `</table>`;
}
function bindSettings() {
  const sel = (id, key, num) => { const el = $(id); el.value = String(S[key]); el.onchange = () => { S[key] = num ? +el.value : el.value; saveS(); }; };
  const chk = (id, key, after) => { const el = $(id); el.checked = !!S[key]; el.onchange = () => { S[key] = el.checked; saveS(); if (after) after(); }; };
  chk("#setLens", "lens", () => { if (S.lens === false) setLens(false); });
  chk("#setDot", "dot"); chk("#setHideCursor", "hideCursor"); chk("#setSpeechPause", "speechPause");
  const cl = $("#setEyeClickLock");
  cl.value = clickMode();
  cl.onchange = () => { S.eyeClickLock = cl.value === "off" ? false : cl.value; saveS(); sendClickPolicy(); };
  $("#setNoGpu").onchange = e => { Native.post({ t: "setgpu", off: e.target.checked }); toast("Wirkt beim nächsten Start des Programms"); };
  setInterval(() => {
    const e = $("#eyeStatus"); if (!e) return;
    e.textContent = !Native.eye ? "nicht gefunden (läuft die Tobii-Software?)"
      : Native.active === false ? "ruht (Programm nicht im Vordergrund)"
      : Native.paused ? "pausiert (⏸️)"
      : performance.now() - Native.lastEye < 500 ? "aktiv – Augen erkannt ✔" : "aktiv – gerade keine Augen erkannt";
    e.textContent += ` (Klicks gesperrt: ${Native.blocked || 0}, durchgelassen: ${Native.allowed || 0})`;
  }, 500);
  chk("#setHoverSay", "hoverSay"); chk("#setSfx", "sfx"); chk("#setSylColor", "sylColor"); chk("#setMuted", "muted");
  chk("#setAllLevels", "allLevels", renderStats);

  const vo = $("#setVolume"), vv = $("#valVolume");
  vo.value = S.volume; vv.textContent = S.volume + " %";
  vo.oninput = () => { S.volume = +vo.value; vv.textContent = S.volume + " %"; saveS(); };
  vo.onchange = () => say("So laut spreche ich jetzt.", "talk", 1, { force: true });
  sel("#setUnlock", "unlockRounds", true);
  renderProfiles();
  const dwb = $("#setDwellBigMs"), vdb = $("#valDwellBig");
  dwb.value = S.dwellBigMs; vdb.textContent = (S.dwellBigMs / 1000).toFixed(1) + " s";
  dwb.oninput = () => { S.dwellBigMs = +dwb.value; vdb.textContent = (S.dwellBigMs / 1000).toFixed(1) + " s"; saveS(); };
  const dw = $("#setDwellMs"), vd = $("#valDwell");
  dw.value = S.dwellMs; vd.textContent = (S.dwellMs / 1000).toFixed(1) + " s";
  dw.oninput = () => { S.dwellMs = +dw.value; vd.textContent = (S.dwellMs / 1000).toFixed(1) + " s"; saveS(); };

  const rt = $("#setRate"), vr = $("#valRate");
  rt.value = S.rate; vr.textContent = S.rate.toFixed(2);
  rt.oninput = () => { S.rate = +rt.value; vr.textContent = S.rate.toFixed(2); saveS(); };

  sel("#setRound", "round", true); sel("#setCase", "letterCase", false); sel("#setBalloonSpeed", "balloonSpeed", true);
  const mn = $("#setManualNext");
  mn.value = S.manualNext ? "1" : "0";
  mn.onchange = () => { S.manualNext = mn.value === "1"; saveS(); };
  $("#setVoice").onchange = e => { S.voice = e.target.value; saveS(); };
  $("#btnTestVoice").onclick = () => say("Hallo! Ich bin Emil, die Eule. Womit fängt die Maus an?", "talk", 1, { force: true });

  const lb = $("#setLetters");
  lb.innerHTML = "";
  ALPHABET.forEach(L => {
    const lab = document.createElement("label");
    const cb = document.createElement("input");
    cb.type = "checkbox"; cb.checked = S.letters.includes(L);
    cb.onchange = () => {
      if (cb.checked) S.letters = ALPHABET.filter(x => x === L || S.letters.includes(x));
      else if (S.letters.length <= 2) { cb.checked = true; alert("Bitte mindestens 2 Buchstaben auswählen."); return; }
      else S.letters = S.letters.filter(x => x !== L);
      saveS();
    };
    lab.appendChild(cb);
    lab.appendChild(document.createTextNode(" " + L));
    lb.appendChild(lab);
  });

  const ta = $("#setTalk");
  ta.value = S.talk;
  $("#btnTalkSave").onclick = () => { S.talk = ta.value; saveS(); toast("💬 Mitteil-Tafel gespeichert"); };
  $("#btnTalkAdd").onclick = async () => {
    if (parseTalk(ta.value).length >= 12) { toast("Die Mitteil-Tafel hat schon 12 Felder – bitte erst eines löschen"); return; }
    const v = await openDialog("💬 Neues Feld für die Mitteil-Tafel", [
      { id: "emoji", label: "Bild (ein Emoji)", type: "emoji", required: true },
      { id: "label", label: "Beschriftung (steht auf dem Feld)", required: true, placeholder: "z. B. Musik" },
      { id: "text", label: "Satz, der gesprochen wird (leer = Beschriftung)", placeholder: "z. B. Ich möchte Musik hören." },
    ], "Feld hinzufügen");
    if (!v) return;
    const clean = x => x.replace(/;/g, ",");
    ta.value = ta.value.replace(/\s*$/, "") + "\n" + [clean(v.emoji), clean(v.label), clean(v.text || v.label)].join(" ; ");
    S.talk = ta.value; saveS(); buildTalk();
    toast(`💬 Feld „${v.label}“ hinzugefügt`);
  };
  ta.addEventListener("focus", () => {
    oskShow(true, true);
    setTimeout(() => keepCaretVisible(ta), 120);   // die angeklickte Zeile bleibt sichtbar
  });
  ["click", "keyup"].forEach(ev => ta.addEventListener(ev, () => { if (document.body.classList.contains("kb-open")) keepCaretVisible(ta); }));
  ta.addEventListener("blur", () => setTimeout(() => { if (!$("#dlg").classList.contains("show") && document.activeElement !== ta) oskShow(false); }, 300));
  $("#btnTalkReset").onclick = () => { ta.value = DEFAULT_TALK; S.talk = DEFAULT_TALK; saveS(); };

  $("#btnResetLevels").onclick = () => { if (confirm("Alle Stufen wieder sperren?")) { levels = {}; save("levels", levels); renderStats(); } };
  $("#btnResetStats").onclick = () => { if (confirm("Lernstand wirklich löschen?")) { stats = {}; save("stats", stats); renderStats(); } };
  $("#btnResetStickers").onclick = () => { if (confirm("Alle Sticker löschen?")) { stickers = []; save("stickers", stickers); renderStats(); } };
  $("#btnSettings").onclick = () => {
    renderStats(); fillVoiceSelect();
    $("#setMuted").checked = !!S.muted; ta.value = S.talk;
    $("#setBalloonSpeed").value = String(S.balloonSpeed); mn.value = S.manualNext ? "1" : "0";
    $("#savedNote").textContent = "";
    $("#settings").classList.add("show");
    $("#settings .panel").scrollTop = 0;
  };
  $("#btnSaveSettings").onclick = saveSettingsNow;
  $("#btnManual").onclick = () => { if (Native.on) Native.post({ t: "manual" }); else window.open("../Anleitung.html", "_blank"); };
  $("#btnCloseSettings").onclick = closeSettings;
  $("#btnFullscreen").onclick = toggleFullscreen;
}
// Speichern (Strg+Enter): alle Eingaben inkl. Mitteil-Tafel übernehmen
function saveSettingsNow() {
  oskShow(false);
  S.talk = $("#setTalk").value;
  S.round = +$("#setRound").value;
  S.letterCase = $("#setCase").value;
  S.balloonSpeed = +$("#setBalloonSpeed").value;
  S.manualNext = $("#setManualNext").value === "1";
  saveS();
  const n = $("#savedNote");
  n.textContent = "✔ Gespeichert " + new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return true;
}
// Beenden (Esc): speichert ebenfalls, damit nichts verloren geht, und schließt
function closeSettings() {
  saveSettingsNow();
  $("#settings").classList.remove("show");
  $("#savedNote").textContent = "";
  if ($("#menu").classList.contains("active")) buildMenu();
}

// ---------------------------------------------------------------------
//  Start
// ---------------------------------------------------------------------
function showVersion() {
  const v = `Version ${APP_VERSION}`;
  const a = $("#startVersion"); if (a) a.textContent = v;
  const b = $("#setVersion"); if (b) b.textContent = `${v} (Stand ${APP_DATE})`;
}
async function startApp() {
  audio();
  show("menu");
  const n = PROFILES.on ? profileName() : "";
  await say(n ? `Hallo ${n}! Schön, dass du da bist. Such dir ein Spiel aus.`
              : "Hallo! Ich bin Emil, die Eule. Lass uns zusammen lesen und schreiben lernen! Such dir ein Spiel aus.");
}
function init() {
  showVersion();
  buildMenu();
  bindSettings();
  applyS();
  onSelect($("#btnStart"), startApp);
  onSelect($("#stkUp"), () => albumScroll(-1));
  onSelect($("#stkDown"), () => albumScroll(1));
  $("#stickers").addEventListener("scroll", () => { clearTimeout(G.albT); G.albT = setTimeout(updateAlbumScroll, 120); }, { passive: true });
  renderStartProfiles(); buildMenuTitle();
  $("#setProfilesOn").onchange = e => { PROFILES.on = e.target.checked; saveProfiles(); renderProfiles(); renderStartProfiles(); buildMenuTitle(); };
  $("#btnAddProfile").onclick = addProfile;
  $("#btnDeleteAll").onclick = deleteAllData;
  $("#btnBackup").onclick = saveBackup;
  $("#btnRestore").onclick = loadBackup;
  try { if (sessionStorage.getItem("abc_autostart")) { sessionStorage.removeItem("abc_autostart"); setTimeout(startApp, 300); } } catch (e) { }
  onSelect($("#btnMenuSay"), () => say("Was möchtest du spielen? Such dir ein Bild aus."));
  // Beenden: Tür zweimal auswählen (oder mit der Maus doppelklicken) -> Ja/Nein-Abfrage
  let quitArmed = -1e9;
  const quitAsk = () => {
    quitArmed = -1e9; $("#btnQuit").classList.remove("armed");
    $("#quitAsk").classList.add("show");
    G.prevRepeat = G.repeat;
    G.repeat = () => say("Möchtest du das ABC-Abenteuer beenden? Ja oder nein?", "info", 1, { force: true });
    G.repeat();
  };
  onSelect($("#btnQuit"), () => {
    const b = $("#btnQuit"), now = performance.now();
    if (now - quitArmed < 8000) { quitAsk(); return; }
    quitArmed = now;
    b.classList.add("armed");
    // wer einfach weiter auf die Tür schaut, löst nach der normalen Verweilzeit das zweite Mal aus
    Gaze.firedEl = null; Gaze.cool = false; Gaze.start = performance.now();
    toast("🚪 Zum Beenden noch einmal auf die Tür");
    say("Möchtest du aufhören? Dann noch einmal die Tür.", "info", 1, { force: true });
    setTimeout(() => { if (performance.now() - quitArmed >= 7900) b.classList.remove("armed"); }, 8000);
  });
  $("#btnQuit").addEventListener("dblclick", e => { e.preventDefault(); if (!$("#quitAsk").classList.contains("show")) quitAsk(); });
  onSelect($("#quitYes"), () => {
    say("Tschüss! Bis bald!", "talk", 1, { force: true }).then(() => {
      if (Native.on) Native.post({ t: "quit" }); else toast("Bitte das Fenster schließen (Alt + F4)");
    });
  });
  onSelect($("#quitNo"), () => {
    $("#quitAsk").classList.remove("show");
    G.repeat = G.prevRepeat || null;
    say("Schön, dann spielen wir weiter!", "talk", 1, { force: true });
  });
  document.querySelectorAll(".mutebtn").forEach(b => onSelect(b, toggleMute));
  document.querySelectorAll(".talkbtn").forEach(b => onSelect(b, openTalk));
  onSelect($("#talkBack"), closeTalk);
  onSelect($("#talkRepeat"), () => Talk.last
    ? say(Talk.last.text, "talk", 1, { force: true })
    : say("Was möchtest du sagen?", "talk", 1, { force: true }));
  onSelect($("#btnHome"), () => goMenu());
  onSelect($("#btnAlbumHome"), () => goMenu());
  onSelect($("#btnAlbumSay"), albumSay);
  onSelect($("#btnRepeat"), () => { if (G.repeat) G.repeat(); });
  onSelect($("#rewAgain"), () => startGame(G.game, G.level));
  onSelect($("#rewNext"), () => startGame(G.game, Math.min(3, G.level + 1)));
  onSelect($("#rewMenu"), () => goMenu());
  onSelect($("#exAgain"), () => { const w = EX.words[EX.i % EX.words.length]; say(`${LN(EX.L)} wie ${w.w}.`); });
  onSelect($("#exNext"), () => { EX.i++; showExplore(); });
  onSelect($("#exBack"), () => { $("#explore").classList.remove("show"); stopSpeech(); });
}
init();
