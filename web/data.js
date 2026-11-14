// ============================================================
//  Wortschatz für das ABC-Lernprogramm
//  w   = Wort (normale Schreibweise)
//  g   = Artikel (der / die / das)
//  pl  = true bei Mehrzahl-Wörtern (z. B. "die Nudeln")
//  e   = Bild (Emoji oder ein eigenes Bild aus PICS, z. B. PICS.qualle)
//  s   = Silben, mit "-" getrennt (für die Anzeige)
//  sp  = (optional) Silben so geschrieben, wie sie gesprochen werden,
//        falls die Sprachausgabe sie sonst falsch vorliest
//  a   = false, wenn der Anfangslaut NICHT dem Buchstaben entspricht
//        (z. B. "Eis" beginnt mit "Ei", "Auto" mit "Au")
//  lg  = true, wenn das Wort lautgetreu ist (gut zum Schreiben)
//  Eigene Wörter können einfach ergänzt werden.
// ============================================================

// Eigene Bilder für Wörter, für die es kein passendes Emoji gibt
const svg = body => `<svg viewBox="0 0 100 100" width="1em" height="1em" style="vertical-align:-0.12em">${body}</svg>`;
// etwas größer dargestellt (engerer Bildausschnitt)
const svgBig = body => `<svg viewBox="16 6 82 94" width="1.15em" height="1.15em" style="vertical-align:-0.2em">${body}</svg>`;
const PICS = {
  qualle: svg(`<path d="M15 55 Q15 15 50 15 Q85 15 85 55 Z" fill="#c792ea" stroke="#6b3fa0" stroke-width="3"/>
    <circle cx="38" cy="38" r="5" fill="#fff"/><circle cx="62" cy="38" r="5" fill="#fff"/>
    <path d="M25 55 q-5 12 2 22 q6 10 -2 18" fill="none" stroke="#9b72cf" stroke-width="5" stroke-linecap="round"/>
    <path d="M42 55 q5 12 -2 22 q-6 10 2 18" fill="none" stroke="#9b72cf" stroke-width="5" stroke-linecap="round"/>
    <path d="M58 55 q-5 12 2 22 q6 10 -2 18" fill="none" stroke="#9b72cf" stroke-width="5" stroke-linecap="round"/>
    <path d="M75 55 q5 12 -2 22 q-6 10 2 18" fill="none" stroke="#9b72cf" stroke-width="5" stroke-linecap="round"/>`),
  quadrat: svg(`<rect x="15" y="15" width="70" height="70" rx="4" fill="#4d96ff" stroke="#1f5fbf" stroke-width="4"/>`),
  xylophon: svg(`<rect x="10" y="30" width="12" height="50" rx="3" fill="#ef6f6c"/><rect x="26" y="34" width="12" height="42" rx="3" fill="#ff9f43"/>
    <rect x="42" y="38" width="12" height="34" rx="3" fill="#ffd93d"/><rect x="58" y="42" width="12" height="26" rx="3" fill="#3cb371"/>
    <rect x="74" y="46" width="12" height="18" rx="3" fill="#4d96ff"/>
    <line x1="60" y1="10" x2="85" y2="28" stroke="#8a5a2b" stroke-width="4" stroke-linecap="round"/><circle cx="58" cy="9" r="6" fill="#d33"/>`),
  schaukel: svg(`<line x1="8" y1="10" x2="92" y2="10" stroke="#8a5a2b" stroke-width="7" stroke-linecap="round"/>
    <line x1="14" y1="10" x2="6" y2="95" stroke="#8a5a2b" stroke-width="6" stroke-linecap="round"/>
    <line x1="86" y1="10" x2="94" y2="95" stroke="#8a5a2b" stroke-width="6" stroke-linecap="round"/>
    <line x1="35" y1="10" x2="40" y2="70" stroke="#555" stroke-width="3"/><line x1="65" y1="10" x2="70" y2="70" stroke="#555" stroke-width="3"/>
    <rect x="34" y="68" width="42" height="8" rx="3" fill="#ef6f6c"/>
    <circle cx="55" cy="40" r="9" fill="#f5c08a"/><path d="M48 50 h14 l2 18 h-18 z" fill="#4d96ff"/>`),
  // Mieder / Korsett – mit grünem Plus (anziehen) bzw. rotem Minus (ausziehen)
  mieder_an: svgBig(korsett() + `<circle cx="80" cy="80" r="15" fill="#2e9e44" stroke="#fff" stroke-width="3"/>
    <path d="M80 71 v18 M71 80 h18" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`),
  mieder_aus: svgBig(korsett() + `<circle cx="80" cy="80" r="15" fill="#e53935" stroke="#fff" stroke-width="3"/>
    <path d="M71 80 h18" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`),
};
function korsett() {
  return `<path d="M24 12 Q50 22 76 12 Q64 50 76 88 Q50 97 24 88 Q36 50 24 12 Z" fill="#cfe3f7" stroke="#3a6ea5" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M36 18 Q42 50 35 90 M64 18 Q58 50 65 90" fill="none" stroke="#7aa6d6" stroke-width="2.5"/>
    <path d="M45 24 L55 31 M55 24 L45 31 M45 36 L55 43 M55 36 L45 43 M45 48 L55 55 M55 48 L45 55 M45 60 L55 67 M55 60 L45 67 M45 72 L55 79 M55 72 L45 79"
      stroke="#e0567a" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M45 20 V84 M55 20 V84" stroke="#3a6ea5" stroke-width="2" stroke-dasharray="2 4"/>`;
}

// ---------------------------------------------------------------------
//  Farben-Spiel: Farbwörter und Bilder zum Ausmalen
//  sim = Farben mit ähnlichem Wortanfang (werden in Stufe 3 als Ablenker genommen)
// ---------------------------------------------------------------------
const COLORS = [
  { w: "rot",     c: "#e53935", sim: ["rosa", "orange"] },
  { w: "blau",    c: "#1e6fd9", sim: ["braun", "lila"] },
  { w: "gelb",    c: "#ffd600", sim: ["grün", "grau"] },
  { w: "grün",    c: "#2e9e44", sim: ["grau", "gelb"] },
  { w: "orange",  c: "#fb8c00", sim: ["rot", "rosa"] },
  { w: "lila",    c: "#8e44ad", sim: ["blau", "rosa"] },
  { w: "rosa",    c: "#f48fb1", sim: ["rot", "lila"] },
  { w: "braun",   c: "#8d5524", sim: ["blau", "grau"] },
  { w: "schwarz", c: "#222222", sim: ["grau", "braun"] },
  { w: "grau",    c: "#9e9e9e", sim: ["grün", "braun"] },
];
// Ausmal-Bilder: alles mit class="paint" wird angemalt
const PAINT = `class="paint" fill="#fff" stroke="#333" stroke-width="2.5" stroke-linejoin="round"`;
const COLOR_PICS = [
  { g: "der", n: "Apfel", w: "Apfel", svg: `<path ${PAINT} d="M50 30 C35 18 12 26 14 52 C16 78 36 94 50 86 C64 94 84 78 86 52 C88 26 65 18 50 30 Z"/>
      <path d="M50 30 Q52 18 58 10" stroke="#6b4423" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M56 16 Q70 6 80 14 Q68 24 56 16 Z" fill="#3cb371" stroke="#2a7a4a" stroke-width="2"/>` },
  { g: "der", n: "Ballon", w: "Ballon", svg: `<ellipse ${PAINT} cx="50" cy="40" rx="27" ry="32"/><path ${PAINT} d="M45 71 L55 71 L50 78 Z"/>
      <path d="M50 78 Q42 86 52 92 Q58 96 50 99" stroke="#555" stroke-width="2" fill="none"/>
      <ellipse cx="40" cy="28" rx="5" ry="9" fill="#fff" opacity=".6"/>` },
  { g: "der", n: "Fisch", w: "Fisch", svg: `<path ${PAINT} d="M12 50 Q38 20 68 40 L88 26 L84 50 L88 74 L68 60 Q38 80 12 50 Z"/>
      <circle cx="28" cy="46" r="4" fill="#333"/><path d="M44 38 Q50 50 44 62" stroke="#333" stroke-width="2" fill="none"/>` },
  { g: "der", n: "Stern", w: "Stern", svg: `<path ${PAINT} d="M50 8 L61 37 L92 38 L67 57 L76 88 L50 70 L24 88 L33 57 L8 38 L39 37 Z"/>` },
  { g: "das", n: "Herz", w: "Herz", svg: `<path ${PAINT} d="M50 88 C20 66 8 48 12 32 C16 16 38 12 50 30 C62 12 84 16 88 32 C92 48 80 66 50 88 Z"/>` },
  { g: "das", n: "Haus", w: "Haus", svg: `<path ${PAINT} d="M14 46 L50 14 L86 46 Z"/><rect ${PAINT} x="22" y="46" width="56" height="44"/>
      <rect x="42" y="64" width="16" height="26" fill="#8d5524" stroke="#333" stroke-width="2"/>
      <rect x="28" y="54" width="10" height="10" fill="#bfe3ff" stroke="#333" stroke-width="2"/><rect x="62" y="54" width="10" height="10" fill="#bfe3ff" stroke="#333" stroke-width="2"/>` },
  { g: "das", n: "Auto", w: "Auto", svg: `<path ${PAINT} d="M8 68 L8 54 Q10 46 20 46 L30 46 L40 30 L66 30 L78 46 L86 46 Q94 48 94 58 L94 68 Z"/>
      <path d="M43 34 L63 34 L71 46 L37 46 Z" fill="#bfe3ff" stroke="#333" stroke-width="2"/>
      <circle cx="28" cy="70" r="10" fill="#333"/><circle cx="74" cy="70" r="10" fill="#333"/>
      <circle cx="28" cy="70" r="4" fill="#ccc"/><circle cx="74" cy="70" r="4" fill="#ccc"/>` },
  { g: "die", n: "Blume", w: "Blume", svg: `<path d="M50 60 Q48 78 50 96" stroke="#2e9e44" stroke-width="4" fill="none"/>
      <path d="M50 82 Q62 70 72 76 Q62 88 50 82 Z" fill="#3cb371"/>
      <circle ${PAINT} cx="50" cy="20" r="13"/><circle ${PAINT} cx="70" cy="34" r="13"/><circle ${PAINT} cx="63" cy="56" r="13"/>
      <circle ${PAINT} cx="37" cy="56" r="13"/><circle ${PAINT} cx="30" cy="34" r="13"/>
      <circle cx="50" cy="40" r="10" fill="#ffcf40" stroke="#333" stroke-width="2.5"/>` },
  { g: "der", n: "Schmetterling", w: "Schmetterling", svg: `<path ${PAINT} d="M48 46 C30 10 4 14 10 38 C14 52 30 52 48 50 Z"/><path ${PAINT} d="M52 46 C70 10 96 14 90 38 C86 52 70 52 52 50 Z"/>
      <path ${PAINT} d="M48 52 C30 56 16 70 26 82 C36 90 46 72 48 56 Z"/><path ${PAINT} d="M52 52 C70 56 84 70 74 82 C64 90 54 72 52 56 Z"/>
      <ellipse cx="50" cy="52" rx="4" ry="22" fill="#333"/>
      <path d="M48 32 Q42 20 36 16 M52 32 Q58 20 64 16" stroke="#333" stroke-width="2" fill="none"/>` },
  { g: "das", n: "T-Shirt", w: "T-Shirt", svg: `<path ${PAINT} d="M34 12 Q50 22 66 12 L92 26 L82 44 L72 38 L72 90 L28 90 L28 38 L18 44 L8 26 Z"/>` },
  { g: "der", n: "Hut", w: "Hut", svg: `<rect ${PAINT} x="30" y="18" width="40" height="46" rx="4"/><ellipse ${PAINT} cx="50" cy="66" rx="40" ry="10"/>
      <rect x="30" y="50" width="40" height="8" fill="#333"/>` },
  { g: "die", n: "Tasse", w: "Tasse", svg: `<path ${PAINT} d="M70 44 Q92 44 90 60 Q88 74 68 72" fill="none" stroke-width="7"/>
      <path ${PAINT} d="M16 30 L74 30 L68 80 Q66 88 58 88 L32 88 Q24 88 22 80 Z"/>
      <path d="M34 22 Q30 14 36 8 M46 22 Q42 14 48 8 M58 22 Q54 14 60 8" stroke="#999" stroke-width="2.5" fill="none"/>` },
  { g: "der", n: "Regenschirm", w: "Regenschirm", svg: `<path ${PAINT} d="M8 50 Q10 12 50 10 Q90 12 92 50 Q83 42 74 50 Q65 42 56 50 Q50 44 44 50 Q35 42 26 50 Q17 42 8 50 Z"/>
      <path d="M50 50 L50 84 Q50 94 40 92 Q34 90 35 84" stroke="#333" stroke-width="4" fill="none" stroke-linecap="round"/>` },
  { g: "das", n: "Blatt", w: "Blatt", svg: `<path ${PAINT} d="M50 92 Q14 70 18 38 Q24 12 50 6 Q76 12 82 38 Q86 70 50 92 Z"/>
      <path d="M50 92 L50 20 M50 40 L34 28 M50 40 L66 28 M50 58 L30 44 M50 58 L70 44" stroke="#333" stroke-width="2" fill="none"/>` },
  { g: "das", n: "Kleid", w: "Kleid", svg: `<path ${PAINT} d="M38 8 L44 8 Q50 16 56 8 L62 8 L64 34 Q80 70 88 92 L12 92 Q20 70 36 34 Z"/>
      <path d="M36 34 L64 34" stroke="#333" stroke-width="2.5"/>` },
  { g: "der", n: "Schuh", w: "Schuh", svg: `<path ${PAINT} d="M10 70 L10 34 Q10 26 18 26 L36 26 Q40 46 58 50 L82 56 Q94 60 92 72 L92 76 L10 76 Z"/>
      <rect x="10" y="74" width="82" height="8" rx="3" fill="#333"/>
      <path d="M38 34 L46 30 M42 40 L50 36 M46 46 L54 42" stroke="#333" stroke-width="2"/>` },
  { g: "die", n: "Krone", w: "Krone", svg: `<path ${PAINT} d="M10 80 L14 26 L32 50 L50 16 L68 50 L86 26 L90 80 Z"/>
      <circle cx="30" cy="68" r="5" fill="#e53935"/><circle cx="50" cy="68" r="5" fill="#1e6fd9"/><circle cx="70" cy="68" r="5" fill="#2e9e44"/>` },
  { g: "der", n: "Drachen", w: "Drachen", svg: `<path ${PAINT} d="M50 6 L80 40 L50 74 L20 40 Z"/><path d="M50 6 L50 74 M20 40 L80 40" stroke="#333" stroke-width="2"/>
      <path d="M50 74 Q40 82 50 88 Q60 94 50 99" stroke="#555" stroke-width="2" fill="none"/>
      <path d="M44 84 L50 80 L44 76 Z M56 94 L50 90 L56 86 Z" fill="#e53935"/>` },
  { g: "die", n: "Schnecke", w: "Schnecke", svg: `<path d="M10 80 Q30 76 46 76 L90 76 Q94 84 86 86 L14 86 Q6 86 10 80 Z" fill="#f5c08a" stroke="#333" stroke-width="2.5"/>
      <circle ${PAINT} cx="50" cy="52" r="26"/><path d="M50 52 m0 -6 a6 6 0 1 1 -6 6 a12 12 0 1 1 12 12 a18 18 0 1 1 -18 -18" stroke="#333" stroke-width="2" fill="none"/>
      <path d="M84 76 L88 58 M88 76 L94 60" stroke="#333" stroke-width="2"/>` },
];

// Farben mischen (Stufe 3): Grundfarben-Töpfe und was beim Mischen herauskommt
const MIX_POTS = [
  { w: "rot", c: "#e53935" }, { w: "gelb", c: "#ffd600" }, { w: "blau", c: "#1e6fd9" },
  { w: "weiß", c: "#ffffff" }, { w: "schwarz", c: "#222222" },
];
// Schlüssel: beide Farben alphabetisch sortiert
const MIXES = {
  "gelb+rot": ["orange", "#fb8c00"], "blau+rot": ["lila", "#8e44ad"], "rot+weiß": ["rosa", "#f48fb1"],
  "blau+gelb": ["grün", "#2e9e44"], "schwarz+weiß": ["grau", "#9e9e9e"], "blau+weiß": ["hellblau", "#8cc4ff"],
  "gelb+weiß": ["hellgelb", "#fff59d"], "rot+schwarz": ["dunkelrot", "#7f1d1d"], "blau+schwarz": ["dunkelblau", "#0d2a5c"],
  "gelb+schwarz": ["dunkelgrün", "#556b2f"],
};
const MIX_TARGETS = [
  { w: "orange", from: ["rot", "gelb"] }, { w: "lila", from: ["rot", "blau"] }, { w: "rosa", from: ["rot", "weiß"] },
  { w: "grün", from: ["blau", "gelb"] }, { w: "grau", from: ["schwarz", "weiß"] },
];

const WORDS = [
  // A
  { w: "Affe",      g: "der", e: "🐒", s: "Af-fe" },
  { w: "Apfel",     g: "der", e: "🍎", s: "Ap-fel" },
  { w: "Ameise",    g: "die", e: "🐜", s: "A-mei-se" },
  { w: "Ananas",    g: "die", e: "🍍", s: "A-na-nas", lg: true },
  { w: "Ampel",     g: "die", e: "🚦", s: "Am-pel", lg: true },
  { w: "Anker",     g: "der", e: "⚓", s: "An-ker" },
  { w: "Auto",      g: "das", e: "🚗", s: "Au-to", a: false, lg: true },
  { w: "Auge",      g: "das", e: "👁️", s: "Au-ge", a: false },
  // B
  { w: "Banane",    g: "die", e: "🍌", s: "Ba-na-ne", lg: true },
  { w: "Baum",      g: "der", e: "🌳", s: "Baum", lg: true },
  { w: "Bär",       g: "der", e: "🐻", s: "Bär" },
  { w: "Biene",     g: "die", e: "🐝", s: "Bie-ne" },
  { w: "Buch",      g: "das", e: "📖", s: "Buch" },
  { w: "Blume",     g: "die", e: "🌼", s: "Blu-me", lg: true },
  { w: "Brot",      g: "das", e: "🍞", s: "Brot", lg: true },
  { w: "Bus",       g: "der", e: "🚌", s: "Bus", lg: true },
  { w: "Bett",      g: "das", e: "🛏️", s: "Bett" },
  { w: "Bein",      g: "das", e: "🦵", s: "Bein", lg: true },
  { w: "Brille",    g: "die", e: "👓", s: "Bril-le" },
  // C
  { w: "Clown",     g: "der", e: "🤡", s: "Clown", sp: "Klaun" },
  // D
  { w: "Dino",      g: "der", e: "🦕", s: "Di-no", lg: true },
  { w: "Delfin",    g: "der", e: "🐬", s: "Del-fin", lg: true },
  { w: "Drache",    g: "der", e: "🐉", s: "Dra-che" },
  // E
  { w: "Ente",      g: "die", e: "🦆", s: "En-te", lg: true },
  { w: "Elefant",   g: "der", e: "🐘", s: "E-le-fant" },
  { w: "Erdbeere",  g: "die", e: "🍓", s: "Erd-bee-re" },
  { w: "Eis",       g: "das", e: "🍦", s: "Eis", a: false, lg: true },
  { w: "Ei",        g: "das", e: "🥚", s: "Ei", a: false, lg: true },
  // F
  { w: "Fisch",     g: "der", e: "🐟", s: "Fisch" },
  { w: "Frosch",    g: "der", e: "🐸", s: "Frosch" },
  { w: "Fuchs",     g: "der", e: "🦊", s: "Fuchs" },
  { w: "Feuer",     g: "das", e: "🔥", s: "Feu-er" },
  { w: "Fee",       g: "die", e: "🧚", s: "Fee", lg: true },
  { w: "Flugzeug",  g: "das", e: "✈️", s: "Flug-zeug" },
  { w: "Fahrrad",   g: "das", e: "🚲", s: "Fahr-rad" },
  // G
  { w: "Gurke",     g: "die", e: "🥒", s: "Gur-ke", lg: true },
  { w: "Giraffe",   g: "die", e: "🦒", s: "Gi-raf-fe" },
  { w: "Geschenk",  g: "das", e: "🎁", s: "Ge-schenk" },
  { w: "Gitarre",   g: "die", e: "🎸", s: "Gi-tar-re" },
  // H
  { w: "Hund",      g: "der", e: "🐕", s: "Hund", lg: true },
  { w: "Haus",      g: "das", e: "🏠", s: "Haus", lg: true },
  { w: "Hase",      g: "der", e: "🐇", s: "Ha-se", lg: true },
  { w: "Herz",      g: "das", e: "❤️", s: "Herz" },
  { w: "Hut",       g: "der", e: "🎩", s: "Hut", lg: true },
  { w: "Hand",      g: "die", e: "✋", s: "Hand", lg: true },
  { w: "Hai",       g: "der", e: "🦈", s: "Hai", lg: true },
  // I
  { w: "Igel",      g: "der", e: "🦔", s: "I-gel", lg: true },
  { w: "Insel",     g: "die", e: "🏝️", s: "In-sel", lg: true },
  // J
  { w: "Jacke",     g: "die", e: "🧥", s: "Ja-cke", sp: "Ja-ke" },
  // K
  { w: "Katze",     g: "die", e: "🐈", s: "Kat-ze" },
  { w: "Kuh",       g: "die", e: "🐄", s: "Kuh" },
  { w: "Käse",      g: "der", e: "🧀", s: "Kä-se" },
  { w: "Krone",     g: "die", e: "👑", s: "Kro-ne", lg: true },
  { w: "Keks",      g: "der", e: "🍪", s: "Keks" },
  { w: "Kerze",     g: "die", e: "🕯️", s: "Ker-ze" },
  { w: "Kamel",     g: "das", e: "🐫", s: "Ka-mel", lg: true },
  { w: "Krokodil",  g: "das", e: "🐊", s: "Kro-ko-dil", lg: true },
  { w: "Koala",     g: "der", e: "🐨", s: "Ko-a-la", lg: true },
  { w: "Kirsche",   g: "die", e: "🍒", s: "Kir-sche" },
  { w: "Kiwi",      g: "die", e: "🥝", s: "Ki-wi", lg: true },
  { w: "Kaktus",    g: "der", e: "🌵", s: "Kak-tus", lg: true },
  { w: "Kamera",    g: "die", e: "📷", s: "Ka-me-ra", lg: true },
  // L
  { w: "Löwe",      g: "der", e: "🦁", s: "Lö-we" },
  { w: "Löffel",    g: "der", e: "🥄", s: "Löf-fel" },
  { w: "Lama",      g: "das", e: "🦙", s: "La-ma", lg: true },
  { w: "Lupe",      g: "die", e: "🔍", s: "Lu-pe", lg: true },
  { w: "Lolli",     g: "der", e: "🍭", s: "Lol-li" },
  { w: "Maus",      g: "die", e: "🐭", s: "Maus", lg: true },
  { w: "Mond",      g: "der", e: "🌙", s: "Mond", lg: true },
  { w: "Milch",     g: "die", e: "🥛", s: "Milch" },
  { w: "Mais",      g: "der", e: "🌽", s: "Mais", lg: true },
  { w: "Melone",    g: "die", e: "🍉", s: "Me-lo-ne", lg: true },
  { w: "Muschel",   g: "die", e: "🐚", s: "Mu-schel" },
  // N
  { w: "Nase",      g: "die", e: "👃", s: "Na-se", lg: true },
  { w: "Nudeln",    g: "die", pl: true, e: "🍝", s: "Nu-deln", lg: true },
  { w: "Nuss",      g: "die", e: "🥜", s: "Nuss" },
  { w: "Nashorn",   g: "das", e: "🦏", s: "Nas-horn" },
  // O
  { w: "Oma",       g: "die", e: "👵", s: "O-ma", lg: true },
  { w: "Opa",       g: "der", e: "👴", s: "O-pa", lg: true },
  { w: "Ohr",       g: "das", e: "👂", s: "Ohr" },
  // P
  { w: "Pilz",      g: "der", e: "🍄", s: "Pilz", lg: true },
  { w: "Pinguin",   g: "der", e: "🐧", s: "Pin-gu-in" },
  { w: "Pferd",     g: "das", e: "🐎", s: "Pferd" },
  { w: "Pizza",     g: "die", e: "🍕", s: "Piz-za", sp: "Pit-tsa" },
  { w: "Panda",     g: "der", e: "🐼", s: "Pan-da", lg: true },
  { w: "Papagei",   g: "der", e: "🦜", s: "Pa-pa-gei", lg: true },
  { w: "Palme",     g: "die", e: "🌴", s: "Pal-me", lg: true },
  { w: "Paket",     g: "das", e: "📦", s: "Pa-ket", lg: true },
  { w: "Pinsel",    g: "der", e: "🖌️", s: "Pin-sel", lg: true },
  // Q
  { w: "Qualle",    g: "die", e: PICS.qualle, s: "Qual-le", sp: "Kwal-le" },
  { w: "Quadrat",   g: "das", e: PICS.quadrat, s: "Qua-drat", sp: "Kwa-drat" },
  // R
  { w: "Rose",      g: "die", e: "🌹", s: "Ro-se", lg: true },
  { w: "Rakete",    g: "die", e: "🚀", s: "Ra-ke-te", lg: true },
  { w: "Ring",      g: "der", e: "💍", s: "Ring" },
  { w: "Regenbogen",g: "der", e: "🌈", s: "Re-gen-bo-gen" },
  { w: "Roller",    g: "der", e: "🛴", s: "Rol-ler" },
  { w: "Roboter",   g: "der", e: "🤖", s: "Ro-bo-ter", lg: true },
  // S
  { w: "Sonne",     g: "die", e: "☀️", s: "Son-ne" },
  { w: "Sofa",      g: "das", e: "🛋️", s: "So-fa", lg: true },
  { w: "Salat",     g: "der", e: "🥗", s: "Sa-lat", lg: true },
  { w: "Socke",     g: "die", e: "🧦", s: "So-cke", sp: "So-ke" },
  { w: "Seife",     g: "die", e: "🧼", s: "Sei-fe", lg: true },
  // T
  { w: "Tomate",    g: "die", e: "🍅", s: "To-ma-te", lg: true },
  { w: "Tiger",     g: "der", e: "🐅", s: "Ti-ger" },
  { w: "Taxi",      g: "das", e: "🚕", s: "Ta-xi", sp: "Ta-ksi" },
  { w: "Teddy",     g: "der", e: "🧸", s: "Ted-dy", sp: "Ted-di" },
  { w: "Trommel",   g: "die", e: "🥁", s: "Trom-mel" },
  { w: "Traktor",   g: "der", e: "🚜", s: "Trak-tor", lg: true },
  { w: "Tür",       g: "die", e: "🚪", s: "Tür" },
  // U
  { w: "Uhr",       g: "die", e: "⌚", s: "Uhr" },
  { w: "Ufo",       g: "das", e: "🛸", s: "U-fo", lg: true },
  // V
  { w: "Vogel",     g: "der", e: "🐦", s: "Vo-gel", sp: "Fo-gel" },
  { w: "Vulkan",    g: "der", e: "🌋", s: "Vul-kan" },
  // W
  { w: "Wal",       g: "der", e: "🐳", s: "Wal", lg: true },
  { w: "Wolke",     g: "die", e: "☁️", s: "Wol-ke", lg: true },
  { w: "Wolf",      g: "der", e: "🐺", s: "Wolf", lg: true },
  { w: "Würfel",    g: "der", e: "🎲", s: "Wür-fel" },
  { w: "Welle",     g: "die", e: "🌊", s: "Wel-le" },
  { w: "Wecker",    g: "der", e: "⏰", s: "We-cker", sp: "We-ker" },
  // X
  { w: "Xylophon",  g: "das", e: PICS.xylophon, s: "Xy-lo-phon", sp: "Xü-lo-fon" },
  // Y
  { w: "Yoga",      g: "das", e: "🧘", s: "Yo-ga", sp: "Jo-ga" },
  // Z
  { w: "Zebra",     g: "das", e: "🦓", s: "Ze-bra", lg: true },
  { w: "Zug",       g: "der", e: "🚂", s: "Zug", lg: true },
  { w: "Zitrone",   g: "die", e: "🍋", s: "Zi-tro-ne", lg: true },
  { w: "Zelt",      g: "das", e: "⛺", s: "Zelt", lg: true },
  { w: "Zahn",      g: "der", e: "🦷", s: "Zahn" },
  { w: "Ziege",     g: "die", e: "🐐", s: "Zie-ge" },
  { w: "Zirkus",    g: "der", e: "🎪", s: "Zir-kus", lg: true },
  { w: "Zauberer",  g: "der", e: "🧙", s: "Zau-be-rer", lg: true },
];

// Alle Buchstaben, die im Programm geübt werden können
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// Typische Reihenfolge in Fibeln – die ersten werden standardmäßig geübt
const DEFAULT_LETTERS = ["M", "A", "L", "I", "O", "S", "E"];

// Buchstabennamen für die Sprachausgabe (klingt bei Einzelbuchstaben besser)
const LETTER_NAMES = {
  A: "A", B: "Beh", C: "Zeh", D: "Deh", E: "E", F: "Eff", G: "Geh", H: "Hah",
  I: "I", J: "Jott", K: "Kah", L: "Ell", M: "Emm", N: "Enn", O: "O", P: "Peh",
  Q: "Kuh", R: "Err", S: "Ess", T: "Teh", U: "U", V: "Fau", W: "Weh", X: "Iks",
  Y: "Üpsilon", Z: "Zett", "Ä": "Ä", "Ö": "Ö", "Ü": "Ü",
};

// Ähnlich aussehende / klingende Buchstaben – werden in höheren Stufen als Ablenker genutzt
const SIMILAR = {
  A: ["E", "H"], B: ["D", "P"], C: ["G", "O"], D: ["B", "T"], E: ["F", "A"], F: ["E", "T"],
  G: ["K", "C"], H: ["N", "A"], I: ["L", "J"], J: ["I", "L"], K: ["G", "H"], L: ["I", "T"],
  M: ["N", "W"], N: ["M", "H"], O: ["U", "Q"], P: ["B", "R"], Q: ["O", "G"], R: ["P", "B"],
  S: ["Z", "C"], T: ["D", "F"], U: ["O", "V"], V: ["W", "U"], W: ["M", "V"], X: ["K", "Y"],
  Y: ["V", "X"], Z: ["S", "N"],
};
// Buchstaben, die (am Wortanfang) gleich klingen – nie gemeinsam als Auswahl anbieten
const SOUND_ALIKE = [["F", "V"], ["K", "C", "Q"], ["J", "Y"], ["X", "K"]];

// Mitteil-Tafel ("Ich möchte sagen …") – in den Einstellungen änderbar
const DEFAULT_TALK = [
  "🔁 ; Nochmal ; Nochmal, bitte!",
  "🏁 ; Fertig ; Ich bin fertig.",
  "👍 ; Ja ; Ja.",
  "👎 ; Nein ; Nein.",
  "[mieder_an] ; Mieder anziehen ; Bitte Mieder anziehen.",
  "[mieder_aus] ; Mieder ausziehen ; Bitte Mieder ausziehen.",
  "[schaukel] ; Schaukeln ; Ich möchte schaukeln.",
  "🥤 ; Durst ; Ich habe Durst.",
  "🍽️ ; Hunger ; Ich habe Hunger.",
  "🚽 ; Klo ; Ich muss aufs Klo.",
  "🔄 ; Etwas anderes ; Ich möchte etwas anderes machen.",
].join("\n");

// Belohnungs-Sticker
const STICKERS = ["🐶","🐱","🦄","🐼","🐨","🦋","🐞","🐠","🦖","🐙","🌟","🚀",
  "🌈","🍓","🎈","🦜","🐬","🐢","🦁","🐸","🍭","🎀","🌻","🐧","🦊","🐰",
  "🍉","🧸","🎠","🏰","⭐","🌸","🐝","🦕","🐳","🍦"];

const PRAISE = ["Super!", "Toll gemacht!", "Prima!", "Klasse!", "Richtig!",
  "Wunderbar!", "Spitze!", "Genau!", "Sehr gut!", "Das hast du toll gemacht!"];

const ENCOURAGE = ["Fast! Probier es nochmal.", "Hmm, schau noch einmal.",
  "Nicht ganz. Versuch es nochmal.", "Das war knapp! Noch einmal."];

// ---------------------------------------------------------------------
//  Sätze lesen: Tiere (Satzanfang) und Dinge, die sie haben.
//  Nur eindeutige Bilder. g = Artikel (der/die/das).
// ---------------------------------------------------------------------
const SENT_ANIMALS = [
  { w: "Maus", g: "die", e: "🐭" }, { w: "Katze", g: "die", e: "🐈" }, { w: "Hund", g: "der", e: "🐕" },
  { w: "Hase", g: "der", e: "🐇" }, { w: "Affe", g: "der", e: "🐒" }, { w: "Bär", g: "der", e: "🐻" },
  { w: "Kuh", g: "die", e: "🐄" }, { w: "Löwe", g: "der", e: "🦁" }, { w: "Igel", g: "der", e: "🦔" },
  { w: "Fuchs", g: "der", e: "🦊" }, { w: "Ente", g: "die", e: "🦆" }, { w: "Frosch", g: "der", e: "🐸" },
];
const SENT_THINGS = [
  { w: "Käse", g: "der", e: "🧀" }, { w: "Banane", g: "die", e: "🍌" }, { w: "Apfel", g: "der", e: "🍎" },
  { w: "Ei", g: "das", e: "🥚" }, { w: "Eis", g: "das", e: "🍦" }, { w: "Brot", g: "das", e: "🍞" },
  { w: "Buch", g: "das", e: "📖" }, { w: "Hut", g: "der", e: "🎩" }, { w: "Ring", g: "der", e: "💍" },
  { w: "Brille", g: "die", e: "👓" }, { w: "Keks", g: "der", e: "🍪" }, { w: "Lolli", g: "der", e: "🍭" },
  { w: "Geschenk", g: "das", e: "🎁" }, { w: "Kerze", g: "die", e: "🕯️" },
];
