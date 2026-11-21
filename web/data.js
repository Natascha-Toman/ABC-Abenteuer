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
  // eindeutige eigene Bilder (für Wörter ohne passendes Symbol)
  uboot: svg(`<path d="M4 84 Q27 78 50 84 T96 84" stroke="#4d96ff" stroke-width="4" fill="none"/>
    <path d="M58 36 V18 H70" stroke="#666" stroke-width="4" fill="none" stroke-linecap="round"/>
    <rect x="38" y="34" width="26" height="18" rx="5" fill="#ffcf40" stroke="#c99a00" stroke-width="3"/>
    <ellipse cx="52" cy="62" rx="40" ry="15" fill="#ffcf40" stroke="#c99a00" stroke-width="3"/>
    <path d="M12 62 L3 53 V71 Z" fill="#9aa5b8"/>
    <circle cx="34" cy="62" r="5.5" fill="#bfe3ff" stroke="#c99a00" stroke-width="2"/><circle cx="52" cy="62" r="5.5" fill="#bfe3ff" stroke="#c99a00" stroke-width="2"/><circle cx="70" cy="62" r="5.5" fill="#bfe3ff" stroke="#c99a00" stroke-width="2"/>`),
  ubahn: svg(`<rect x="62" y="4" width="32" height="30" rx="5" fill="#1e5fbf"/>
    <text x="78" y="29" font-size="26" font-weight="700" text-anchor="middle" fill="#fff" font-family="Andika, sans-serif">U</text>
    <rect x="8" y="26" width="58" height="60" rx="12" fill="#eef2f7" stroke="#5a6b80" stroke-width="3"/>
    <rect x="15" y="34" width="44" height="22" rx="5" fill="#bfe3ff" stroke="#5a6b80" stroke-width="2"/>
    <rect x="8" y="62" width="58" height="6" fill="#ef6f6c"/>
    <circle cx="20" cy="76" r="4" fill="#ffd93d"/><circle cx="54" cy="76" r="4" fill="#ffd93d"/>
    <path d="M18 86 L10 96 M56 86 L64 96" stroke="#5a6b80" stroke-width="3" stroke-linecap="round"/>`),
  joghurt: svg(`<path d="M68 22 L88 5" stroke="#b9c0cc" stroke-width="5" stroke-linecap="round"/>
    <path d="M22 30 L78 30 L70 90 Q50 95 30 90 Z" fill="#fff" stroke="#9aa5b8" stroke-width="3" stroke-linejoin="round"/>
    <rect x="17" y="22" width="66" height="10" rx="4" fill="#ff7eb6" stroke="#d94f8c" stroke-width="2"/>
    <path d="M25 48 L75 48 L72 74 L28 74 Z" fill="#ffd6e7"/>
    <path d="M50 53 Q61 55 57 66 Q50 74 43 66 Q39 55 50 53 Z" fill="#e53935"/>
    <path d="M44 55 L50 50 L56 55" stroke="#2e9e44" stroke-width="3" fill="none" stroke-linecap="round"/>`),
  jacke: svg(`<path d="M34 14 Q50 4 66 14 L84 24 L93 58 L81 62 L74 42 L74 80 L26 80 L26 42 L19 62 L7 58 L16 24 Z" fill="#ef6f6c" stroke="#a83b39" stroke-width="3" stroke-linejoin="round"/>
    <rect x="26" y="76" width="48" height="8" rx="2" fill="#c94f4c" stroke="#a83b39" stroke-width="2"/>
    <path d="M36 14 Q50 27 64 14" fill="none" stroke="#a83b39" stroke-width="3"/>
    <path d="M50 20 V84" stroke="#ffd93d" stroke-width="3"/>
    <path d="M30 60 H42 M58 60 H70" stroke="#a83b39" stroke-width="3" stroke-linecap="round"/>`),
  chor: svg(`<path d="M8 96 Q8 70 25 68 Q42 70 42 96 Z" fill="#4d96ff"/><path d="M58 96 Q58 70 75 68 Q92 70 92 96 Z" fill="#3cb371"/>
    <path d="M32 96 Q32 62 50 60 Q68 62 68 96 Z" fill="#ef6f6c"/>
    <circle cx="25" cy="52" r="13" fill="#f5c08a" stroke="#a0522d" stroke-width="2"/><circle cx="75" cy="52" r="13" fill="#e0a370" stroke="#a0522d" stroke-width="2"/>
    <circle cx="50" cy="42" r="14" fill="#ffd8a8" stroke="#a0522d" stroke-width="2"/>
    <path d="M13 47 Q25 32 37 47 M62 47 Q75 32 88 47 M37 36 Q50 22 63 36" fill="none" stroke="#6b3a1e" stroke-width="4" stroke-linecap="round"/>
    <circle cx="21" cy="50" r="1.8" fill="#333"/><circle cx="29" cy="50" r="1.8" fill="#333"/><circle cx="71" cy="50" r="1.8" fill="#333"/><circle cx="79" cy="50" r="1.8" fill="#333"/>
    <circle cx="45" cy="40" r="1.8" fill="#333"/><circle cx="55" cy="40" r="1.8" fill="#333"/>
    <ellipse cx="25" cy="58" rx="3" ry="4" fill="#8a2e2e"/><ellipse cx="75" cy="58" rx="3" ry="4" fill="#8a2e2e"/><ellipse cx="50" cy="49" rx="3.5" ry="4.5" fill="#8a2e2e"/>
    <g fill="#333"><ellipse cx="10" cy="22" rx="4.5" ry="3.5"/><path d="M13.5 22 V6 L20 10 V13 L15.5 11 V22 Z"/>
    <ellipse cx="84" cy="18" rx="4.5" ry="3.5"/><path d="M87.5 18 V2 L94 6 V9 L89.5 7 V18 Z"/></g>`),
  dach: svg(`<rect x="62" y="14" width="13" height="30" fill="#b5653a" stroke="#6b3a1e" stroke-width="2.5"/>
    <rect x="12" y="74" width="76" height="12" fill="#f3e3c3" stroke="#b39b70" stroke-width="2"/>
    <path d="M4 76 L50 22 L96 76 Z" fill="#e0504f" stroke="#a83b39" stroke-width="3" stroke-linejoin="round"/>
    <path d="M21 58 H79 M35 42 H65 M30 58 V76 M50 58 V76 M70 58 V76 M42 42 V58 M58 42 V58" stroke="#a83b39" stroke-width="2"/>
    `),
  irrgarten: svg(`<rect x="8" y="8" width="84" height="84" rx="6" fill="#e9f6dc"/>
    <path d="M44 88 H12 V12 H88 V88 H56 M28 28 H72 V72 H44 M28 28 V72 M44 44 H58 V58" fill="none" stroke="#2e9e44" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M50 96 V80 H36 V36 H64 V64 H50 V52" fill="none" stroke="#ef6f6c" stroke-width="2.5" stroke-dasharray="4 4" stroke-linecap="round"/>
    <circle cx="50" cy="51" r="4.5" fill="#ef6f6c"/>`),
  ofen: svg(`<rect x="14" y="8" width="72" height="86" rx="7" fill="#e9edf2" stroke="#5a6b80" stroke-width="3"/>
    <path d="M14 26 H86" stroke="#5a6b80" stroke-width="3"/>
    <circle cx="27" cy="17" r="4.5" fill="#5a6b80"/><circle cx="41" cy="17" r="4.5" fill="#5a6b80"/><rect x="56" y="12" width="22" height="10" rx="2" fill="#2d3540"/>
    <rect x="24" y="33" width="52" height="5" rx="2.5" fill="#5a6b80"/>
    <rect x="23" y="44" width="54" height="40" rx="5" fill="#3a3a3a"/>
    <rect x="27" y="48" width="46" height="32" rx="4" fill="#ff9f43"/>
    <path d="M31 54 Q35 50 39 54 T47 54 T55 54 T63 54 T71 54" fill="none" stroke="#ffd166" stroke-width="2.5"/>
    <path d="M29 72 H71" stroke="#c96f1e" stroke-width="2"/><rect x="38" y="64" width="24" height="8" rx="3" fill="#b5653a"/>`),
  gabel: svg(`<g transform="rotate(28 50 50)" fill="#cdd4de" stroke="#6b7a8f" stroke-width="2" stroke-linejoin="round">
    <rect x="45" y="44" width="10" height="52" rx="5"/>
    <path d="M35 26 H65 V32 Q65 46 54 48 H46 Q35 46 35 32 Z"/>
    <rect x="35" y="4" width="5.5" height="28" rx="2.5"/><rect x="43.2" y="4" width="5.5" height="28" rx="2.5"/><rect x="51.3" y="4" width="5.5" height="28" rx="2.5"/><rect x="59.5" y="4" width="5.5" height="28" rx="2.5"/></g>`),
  video: svg(`<rect x="5" y="14" width="90" height="64" rx="8" fill="#2d3540"/>
    <rect x="11" y="20" width="78" height="52" rx="4" fill="#8cc4ff"/>
    <circle cx="50" cy="44" r="16" fill="#e53935"/><path d="M44 35 L59 44 L44 53 Z" fill="#fff"/>
    <rect x="16" y="64" width="68" height="4" rx="2" fill="#fff"/><rect x="16" y="64" width="26" height="4" rx="2" fill="#e53935"/>
    <path d="M40 78 L35 92 H65 L60 78 Z" fill="#5a6b80"/>`),
  flasche: svg(`<rect x="41" y="4" width="18" height="10" rx="2" fill="#1e6fd9"/>
    <path d="M43 14 H57 V25 Q72 33 72 48 V88 Q72 95 65 95 H35 Q28 95 28 88 V48 Q28 33 43 25 Z" fill="#e3f2ff" stroke="#3a7bd5" stroke-width="3" stroke-linejoin="round"/>
    <path d="M31 56 H69 V88 Q69 92 65 92 H35 Q31 92 31 88 Z" fill="#8cc4ff"/>
    <path d="M36 40 V84" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".9"/>`),
  lampe: svg(`<rect x="47" y="48" width="6" height="34" fill="#8a5a2b"/>
    <ellipse cx="50" cy="86" rx="22" ry="7" fill="#8a5a2b"/>
    <ellipse cx="50" cy="51" rx="9" ry="5" fill="#fff6c4"/>
    <path d="M28 12 H72 L86 50 H14 Z" fill="#ffd166" stroke="#c99a1e" stroke-width="3" stroke-linejoin="round"/>
    <path d="M28 12 H72" stroke="#c99a1e" stroke-width="5" stroke-linecap="round"/>
    <path d="M20 58 L12 68 M50 60 V70 M80 58 L88 68" stroke="#ffcf40" stroke-width="3" stroke-linecap="round"/>`),
  wald: svg(`<rect x="2" y="84" width="96" height="8" rx="4" fill="#8bc34a"/>
    <rect x="46.5" y="52" width="7" height="34" fill="#8a5a2b"/><circle cx="50" cy="36" r="20" fill="#3cb371"/><circle cx="38" cy="44" r="12" fill="#3cb371"/><circle cx="62" cy="44" r="12" fill="#3cb371"/>
    <rect x="20" y="72" width="6" height="14" fill="#8a5a2b"/><path d="M23 20 L37 46 H31 L41 72 H5 L15 46 H9 Z" fill="#2e7d32"/>
    <rect x="74" y="72" width="6" height="14" fill="#8a5a2b"/><path d="M77 24 L91 48 H85 L95 72 H59 L69 48 H63 Z" fill="#2e7d32"/>`),
  glas: svg(`<path d="M24 12 H76 L68 89 Q67 94 62 94 H38 Q33 94 32 89 Z" fill="#eef8ff" stroke="#7fa7d6" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="50" cy="12" rx="26" ry="4" fill="#fff" stroke="#7fa7d6" stroke-width="2.5"/>
    <path d="M33 84 H67" stroke="#b5d3f0" stroke-width="4"/>
    <path d="M33 22 L39 78" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`),
  // Mieder / Korsett – mit grünem Plus (anziehen) bzw. rotem Minus (ausziehen); nur noch für eigene Tafel-Felder
  mieder_an: svgBig(korsett() + `<circle cx="80" cy="80" r="15" fill="#2e9e44" stroke="#fff" stroke-width="3"/>
    <path d="M80 71 v18 M71 80 h18" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`),
  mieder_aus: svgBig(korsett() + `<circle cx="80" cy="80" r="15" fill="#e53935" stroke="#fff" stroke-width="3"/>
    <path d="M71 80 h18" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`),
};

// Symbole im Noto-Stil (flach, ohne schwarze Umrisse): Figuren mit Noto-Kopf (emoji/1f466.svg), Zahn heller, nur eine Socke
const svgV = (vb, body) => `<svg viewBox="${vb}" width="1em" height="1em" style="vertical-align:-0.12em">${body}</svg>`;
const SKIN = "#FFCA28";
Object.assign(PICS, {
  jause: svgV("0 0 100 100", `
    <rect x="73" y="22" width="14" height="9" rx="2.5" fill="#E53935"/><rect x="76" y="18" width="8" height="5" rx="2" fill="#C62828"/>
    <path d="M71 34 Q71 29 76 29 L84 29 Q89 29 89 34 L90 88 Q90 94 84 94 L76 94 Q70 94 70 88 Z" fill="#4FC3F7"/>
    <path d="M70.6 50 H89.4 L89.6 72 H70.4 Z" fill="#FFFFFF"/><circle cx="80" cy="61" r="6" fill="#FF9800"/><path d="M80 55 Q82 52 85 52" stroke="#43A047" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M74 36 V46 M74 76 V88" stroke="#B3E5FC" stroke-width="3" stroke-linecap="round"/>
    <path d="M10 60 L30 33 L50 60 Z" fill="#FFE0B2" stroke="#D7A86E" stroke-width="3" stroke-linejoin="round"/>
    <path d="M13 58 Q18 54 22 58 Q27 54 31 58 Q36 54 40 58 Q45 54 48 58" stroke="#7CB342" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <path d="M16 54 L44 54 L42 50 L18 50 Z" fill="#FFCA28"/>
    <circle cx="57" cy="52" r="11" fill="#E53935"/><circle cx="53" cy="48" r="3" fill="#FF8A80"/>
    <path d="M57 42 Q57 37 59 35" stroke="#6D4C41" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M59 38 Q65 33 68 37 Q63 41 59 38 Z" fill="#7CB342"/>
    <path d="M4 58 H68 L66 86 Q65 94 57 94 L15 94 Q7 94 6 86 Z" fill="#43A047"/>
    <path d="M4 58 H68 L67.6 64 H4.4 Z" fill="#2E7D32"/>
    <path d="M14 72 Q14 86 22 86" stroke="#81C784" stroke-width="3" fill="none" stroke-linecap="round"/>`),
  iglu: svgV("0 0 100 100", `
    <ellipse cx="50" cy="86" rx="47" ry="8" fill="#D6EAF8"/>
    <path d="M7 85 Q7 24 50 24 Q93 24 93 85 Z" fill="#FFFFFF" stroke="#90CAF9" stroke-width="3" stroke-linejoin="round"/>
    <path d="M50 24 Q93 24 93 85 L78 85 Q80 34 50 24 Z" fill="#D6EAF8"/>
    <path d="M8.5 71 H91.5 M12 57 H88 M19 44 H81 M30 33 H70 M28 71 V57 M72 71 V57 M40 57 V44 M60 57 V44 M30 44 V33 M50 44 V33 M70 44 V33 M50 33 V25" stroke="#A8D0F0" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M32 85 V70 Q32 54 50 54 Q68 54 68 70 V85 Z" fill="#F5FAFF"/>
    <path d="M32 85 V70 Q32 54 50 54 Q68 54 68 70 V85" fill="none" stroke="#BBDEFB" stroke-width="2.5"/>
    <path d="M40 85 V71 Q40 62 50 62 Q60 62 60 71 V85 Z" fill="#1E3A5F"/>`),
  fluss: svgV("0 0 100 100", `
    <path d="M2 54 Q20 30 40 46 Q62 24 98 50 L98 60 L2 60 Z" fill="#C5E1A5"/>
    <path d="M2 52 Q50 42 98 52 L98 90 Q98 96 92 96 L8 96 Q2 96 2 90 Z" fill="#8BC34A"/>
    <path d="M46 46 Q36 54 48 62 Q64 72 38 96 L76 96 Q90 70 66 58 Q54 52 56 46 Z" fill="#29B6F6"/>
    <path d="M46 46 Q36 54 48 62 Q64 72 38 96 L46 96 Q70 72 54 62 Q44 54 52 46 Z" fill="#4FC3F7"/>
    <path d="M51 53 q3 -2 6 0 M56 66 q4 -2.5 8 0 M52 84 q5 -3 10 0" stroke="#FFFFFF" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <rect x="17" y="58" width="5" height="14" rx="1.5" fill="#795548"/><circle cx="19.5" cy="54" r="11" fill="#43A047"/><circle cx="16" cy="50" r="4" fill="#66BB6A"/>
    <rect x="80" y="64" width="5" height="12" rx="1.5" fill="#795548"/><circle cx="82.5" cy="60" r="9" fill="#2E7D32"/><circle cx="80" cy="57" r="3" fill="#43A047"/>
    <path d="M26 88 V78 M29 88 V75 M32 88 V79" stroke="#33691E" stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="86" cy="86" r="2.5" fill="#FFEB3B"/><circle cx="12" cy="82" r="2.5" fill="#F48FB1"/>`),
  brot: svgV("0 0 100 100", `
    <path d="M6 66 Q4 34 44 30 Q82 28 92 52 Q96 66 84 72 Q46 82 10 74 Q6 72 6 66 Z" fill="#B86B2C"/>
    <path d="M8 60 Q8 36 44 33 Q80 31 89 52 Q60 44 30 50 Q14 53 8 60 Z" fill="#D9893F"/>
    <path d="M26 40 Q32 46 30 54 M44 36 Q50 43 48 51 M62 36 Q68 43 66 50 M78 41 Q83 47 81 53" stroke="#F2C27E" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M52 66 Q50 52 64 50 Q78 49 80 62 L82 88 Q82 94 76 94 L58 94 Q53 94 53 88 Z" fill="#A65F27"/>
    <path d="M56 66 Q55 55 65 54 Q76 54 77 64 L78 87 Q78 90 75 90 L60 90 Q57 90 57 87 Z" fill="#FFE3B0"/>
    <g fill="#E8C083"><circle cx="63" cy="64" r="1.6"/><circle cx="70" cy="70" r="1.4"/><circle cx="62" cy="78" r="1.5"/><circle cx="72" cy="82" r="1.6"/><circle cx="67" cy="60" r="1.2"/></g>`),
  creme: svgV("0 0 100 100", `
    <g transform="rotate(-24 50 50)">
      <path d="M8 34 L62 37 Q70 38 72 44 L72 56 Q70 62 62 63 L8 66 Z" fill="#FFFFFF" stroke="#B0BEC5" stroke-width="2.5" stroke-linejoin="round"/>
      <rect x="4" y="32" width="9" height="36" rx="2" fill="#CFD8DC"/><path d="M6.5 36 V64 M10 36 V64" stroke="#B0BEC5" stroke-width="1.5"/>
      <path d="M22 43 L60 44.5 L60 55.5 L22 57 Z" fill="#42A5F5"/>
      <path d="M38 45 Q44 50 38 55 Q32 50 38 45 Z" fill="#FFFFFF"/>
      <rect x="72" y="45" width="6" height="10" fill="#E0E0E0"/>
      <rect x="78" y="41" width="16" height="18" rx="3" fill="#1E88E5"/><path d="M82 41 V59 M86 41 V59 M90 41 V59" stroke="#1565C0" stroke-width="1.5"/>
    </g>
    <path d="M50 92 Q40 92 42 86 Q36 82 44 78 Q42 72 52 72 Q56 66 60 72 Q70 72 66 78 Q74 82 68 86 Q70 92 60 92 Z" fill="#FFFFFF" stroke="#CFD8DC" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M48 80 Q54 76 60 80" stroke="#E3EAF0" stroke-width="2.5" fill="none" stroke-linecap="round"/>`),
  zahn: svgV("0 0 128 128", `<path fill="#FFFFFF" stroke="#A9BBC8" stroke-width="4" stroke-linejoin="round" d="M53,7.71c0,0-18.09-5.23-24.78,2.14s-7.030,16.07-7.7,21.43s2.34,16.74,4.35,21.76s5.36,13.39,5.02,19.42s0.76,21.55,1.34,25.11c1.31,8.04,7.37,22.77,13.73,24.44s8.37-1.34,8.37-7.7s2.01-42.52,13.39-41.18c11.38,1.33,10.71,14.72,11.05,21.42c0.33,6.7,3.38,28.41,9.07,27.74s12.69-15.690,13.03-28.41s-3.01-18.410,0-28.12s7.7-19.08,7.7-29.13c0-7.8,0.45-20.57-7.37-26.78c-7.1-5.64-12.1-4.21-15.74-4.02C75.38,6.31,70.36,12.72,53,7.71z"/>
    <path fill="#BFE0EC" d="M67.15,24.05c4.28,0,19.83-7.54,18-9.46c-2.79-2.93-14.74,3.63-19.2,3.34c-4.66-0.3-9.47-2.2-13.97-2.69c-1.55-0.17-3.54,0.33-1.85,2.32C51.360,19,62.87,24.05,67.15,24.05z"/>`),
  socke: svgV("40 16 92 112", `<path style="fill:#C9E3E6;" d="M85.49,24.13c17.85,1.07,20.95,0.08,24.19,0c3.25-0.08,3.1,1.39,3.1,3.1l0.44,40.38c0,0.66,0.13,1.41,0.34,2.22l-7.83,24.98c-1.31,0.65-1.98,1.09-2.67,1.61c-1.1,0.82-22.8,20.96-25.82,23.9c-3.02,2.93-13.31,7.08-20.05-1.1c-5.77-7-2.45-16.08,0-18.95S81.35,73.71,82.73,69.5c1.13-3.46-0.03-32.96-0.33-42.19C82.34,25.57,82.15,23.93,85.49,24.13z"/>
    <path style="fill:#5FB2DE;" d="M117.62,83.98c0.46-6.42-3.52-11.24-4.3-15.25c-3.14,2.47-9.37,6.33-13.35,8.34c-1.36,0.69-1.790,2.39-1.26,3.83c1.36,3.72,4.16,10.02,6.52,14.16c0,0,1.55-0.97,4.11-1.87C111.9,92.28,117.2,89.89,117.62,83.98z"/>
    <path style="fill:#5FB2DE;" d="M55.35,103.43c-1.7,4.09-2.5,10.52,1.84,15.78c5.27,6.39,12.7,5.26,17.14,3.06c0,0-0.31-5.37-5.81-11.87C63.02,103.89,55.35,103.43,55.35,103.43z"/>
    <path style="fill:#F44336;" d="M96,38.92c-6.26,0-10.89-0.59-13.22-0.96l-0.2-5.12c0.13,0.03,12.4,2.76,30.25-0.33l0.05,5.03C106.51,38.57,100.78,38.92,96,38.92z"/>
    <path style="fill:#F44336;" d="M96,48.15c-6.05,0-10.59-0.55-12.99-0.93l-0.14-5.01c2.95,0.52,14.61,2.21,30.05-0.47l0.05,5.02C106.57,47.8,100.81,48.15,96,48.15z"/>`),
  junge: svgV("0 0 100 100", `
    <rect x="37" y="84" width="9" height="10" fill="${SKIN}"/><rect x="54" y="84" width="9" height="10" fill="${SKIN}"/>
    <path d="M33 99 Q33 92 41 92 L47 92 L47 99 Z" fill="#5D4037"/><path d="M67 99 Q67 92 59 92 L53 92 L53 99 Z" fill="#5D4037"/>
    <path d="M35 72 L65 72 L66 87 L52 87 L50 80 L48 87 L34 87 Z" fill="#455A64"/>
    <path d="M27 58 Q25 70 24 76" stroke="${SKIN}" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M73 58 Q75 70 76 76" stroke="${SKIN}" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M36 44 Q50 40 64 44 L75 52 L71 63 L65 59 L65 74 L35 74 L35 59 L29 63 L25 52 Z" fill="#2196F3"/>
    <path d="M44 44 Q50 50 56 44" fill="${SKIN}"/><path d="M35 66 L65 66 L65 74 L35 74 Z" fill="#1E88E5"/>
    <image href="emoji/1f466.svg" x="27" y="0" width="46" height="46"/>`),
  engel: svgV("0 0 100 100", `
    <path d="M36 52 Q8 30 6 50 Q4 66 16 70 Q8 78 20 84 Q30 86 38 70 Z" fill="#E1F5FE" stroke="#B3E5FC" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M64 52 Q92 30 94 50 Q96 66 84 70 Q92 78 80 84 Q70 86 62 70 Z" fill="#E1F5FE" stroke="#B3E5FC" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M38 46 Q50 42 62 46 L72 96 Q50 100 28 96 Z" fill="#FFFFFF" stroke="#CFD8DC" stroke-width="2"/>
    <path d="M44 60 L40 96 M56 60 L60 96" stroke="#ECEFF1" stroke-width="3"/>
    <path d="M40 50 Q32 62 34 72" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" fill="none"/><path d="M60 50 Q68 62 66 72" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" fill="none"/>
    <circle cx="34.5" cy="74" r="3.6" fill="${SKIN}"/><circle cx="65.5" cy="74" r="3.6" fill="${SKIN}"/>
    <image href="emoji/1f466.svg" x="30" y="6" width="40" height="40"/>
    <ellipse cx="50" cy="6" rx="15" ry="4.2" fill="none" stroke="#FFC107" stroke-width="3.4"/>`),
  cowboy: svgV("0 0 100 100", `
    <path d="M37 76 L48 76 L47 92 L38 92 Z" fill="#1565C0"/><path d="M52 76 L63 76 L62 92 L53 92 Z" fill="#1565C0"/>
    <path d="M36 90 L48 90 L48 98 L32 98 Q31 94 36 94 Z" fill="#6D4C41"/><path d="M52 90 L64 90 L68 94 Q69 98 68 98 L52 98 Z" fill="#6D4C41"/>
    <path d="M36 74 L64 74 L64 80 L36 80 Z" fill="#5D4037"/><rect x="47" y="74" width="6" height="6" fill="#FFC107"/>
    <path d="M27 58 Q25 70 25 76" stroke="${SKIN}" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M73 58 Q75 68 74 74" stroke="${SKIN}" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M36 46 Q50 42 64 46 L75 54 L71 64 L65 60 L65 75 L35 75 L35 60 L29 64 L25 54 Z" fill="#E53935"/>
    <path d="M36 50 L44 50 L46 75 L35 75 Z M64 50 L56 50 L54 75 L65 75 Z" fill="#8D6E63"/>
    <path d="M44 46 L50 54 L56 46" fill="#FFF3E0"/>
    <g fill="none" stroke="#B5835A" stroke-width="2.6"><ellipse cx="81" cy="82" rx="9" ry="12"/><ellipse cx="79" cy="82" rx="7" ry="10.5"/><path d="M85 93 Q90 97 88 100"/></g>
    <image href="emoji/1f466.svg" x="29" y="6" width="42" height="42"/>
    <path d="M18 18 Q50 26 82 18 Q84 24 72 26 Q50 30 28 26 Q16 24 18 18 Z" fill="#795548"/>
    <path d="M32 21 Q31 4 42 6 Q50 10 58 6 Q69 4 68 21 Q50 25 32 21 Z" fill="#8D6E63"/>
    <path d="M32 17 Q50 21 68 17 L68 21 Q50 25 32 21 Z" fill="#4E342E"/>`),
  nudeln: svgV("0 0 100 100", `
    <ellipse cx="50" cy="56" rx="44" ry="12" fill="#B3E5FC"/>
    ${[[30,50,-20],[52,46,15],[70,52,-10],[40,40,30],[62,38,-25],[50,30,5],[24,58,10],[76,60,20],[50,56,-5]].map(([x,y,r]) =>
      `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-12 -8 Q-6 -6 -2 -2 Q0 -3 2 -2 Q6 -6 12 -8 Q14 0 12 8 Q6 6 2 2 Q0 3 -2 2 Q-6 6 -12 8 Q-14 0 -12 -8 Z" fill="#FFCA28" stroke="#F9A825" stroke-width="1.4" stroke-linejoin="round"/><path d="M-9 -4 Q-6 0 -9 4 M9 -4 Q6 0 9 4" stroke="#F9A825" stroke-width="1.2" fill="none"/><rect x="-2" y="-3" width="4" height="6" rx="1.5" fill="#F9A825"/></g>`).join("")}
    <path d="M6 56 Q8 92 50 94 Q92 92 94 56 Q90 66 50 68 Q10 66 6 56 Z" fill="#29B6F6"/>
    <path d="M10 64 Q20 86 50 88" stroke="#81D4FA" stroke-width="3" fill="none" stroke-linecap="round"/>`),
  comic: svgV("0 0 100 100", `
    <rect x="20" y="8" width="66" height="88" rx="4" fill="#E0E0E0"/>
    <rect x="15" y="5" width="66" height="88" rx="4" fill="#42A5F5"/>
    <rect x="15" y="5" width="66" height="16" rx="4" fill="#E53935"/><rect x="15" y="15" width="66" height="6" fill="#E53935"/>
    <path d="M22 13 H52 M58 13 H74" stroke="#FFCDD2" stroke-width="4" stroke-linecap="round"/>
    <path d="M48 30 L53 40 L64 36 L59 46 L70 51 L59 55 L63 66 L52 61 L47 72 L43 61 L32 64 L37 54 L26 49 L37 45 L33 35 L43 39 Z" fill="#FFEB3B"/>
    <path d="M48 40 L51 46 L57 44 L54 50 L60 52 L54 55 L56 60 L50 58 L47 64 L45 58 L39 60 L41 54 L35 52 L41 49 L39 43 L45 46 Z" fill="#FF9800"/>
    <ellipse cx="38" cy="78" rx="16" ry="9" fill="#FFFFFF"/><path d="M30 84 L26 92 L37 86 Z" fill="#FFFFFF"/>
    <circle cx="31" cy="78" r="2.2" fill="#455A64"/><circle cx="38" cy="78" r="2.2" fill="#455A64"/><circle cx="45" cy="78" r="2.2" fill="#455A64"/>`),
});
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
  { w: "Aufgabe",   g: "die", e: "📝", s: "Auf-ga-be", a: false },
  { w: "Aufzug",    g: "der", e: "🛗", s: "Auf-zug", a: false },
  // B
  { w: "Banane",    g: "die", e: "🍌", s: "Ba-na-ne", lg: true },
  { w: "Baum",      g: "der", e: "🌳", s: "Baum", lg: true },
  { w: "Bär",       g: "der", e: "🐻", s: "Bär" },
  { w: "Biene",     g: "die", e: "🐝", s: "Bie-ne" },
  { w: "Buch",      g: "das", e: "📖", s: "Buch" },
  { w: "Blume",     g: "die", e: "🌷", s: "Blu-me", lg: true },
  { w: "Blüte",     g: "die", e: "🌸", s: "Blü-te" },
  { w: "Brot",      g: "das", e: PICS.brot, s: "Brot", lg: true },
  { w: "Bus",       g: "der", e: "🚌", s: "Bus", lg: true },
  { w: "Bett",      g: "das", e: "🛏️", s: "Bett" },
  { w: "Bein",      g: "das", e: "🦵", s: "Bein", lg: true },
  { w: "Brille",    g: "die", e: "👓", s: "Bril-le" },
  { w: "Brief",     g: "der", e: "✉️", s: "Brief" },
  // C
  { w: "Computer",  g: "der", e: "🖥️", s: "Com-pu-ter", sp: "Kom-pju-ter" },
  { w: "Cowboy",    g: "der", e: PICS.cowboy, s: "Cow-boy", sp: "Kau-beu" },
  { w: "Chor",      g: "der", e: PICS.chor, s: "Chor", sp: "Kor" },
  { w: "Comic",     g: "der", e: PICS.comic, s: "Co-mic", sp: "Ko-mik" },
  { w: "Creme",     g: "die", e: PICS.creme, s: "Creme" },
  // D
  { w: "Dino",      g: "der", e: "🦕", s: "Di-no", lg: true },
  { w: "Delfin",    g: "der", e: "🐬", s: "Del-fin", lg: true },
  { w: "Drache",    g: "der", e: "🐉", s: "Dra-che" },
  { w: "Dusche",    g: "die", e: "🚿", s: "Du-sche" },
  { w: "Dach",      g: "das", e: PICS.dach, s: "Dach" },
  { w: "Dose",      g: "die", e: "🥫", s: "Do-se", lg: true },
  // E
  { w: "Ente",      g: "die", e: "🦆", s: "En-te", lg: true },
  { w: "Elefant",   g: "der", e: "🐘", s: "E-le-fant" },
  { w: "Erdbeere",  g: "die", e: "🍓", s: "Erd-bee-re" },
  { w: "Engel",     g: "der", e: PICS.engel, s: "En-gel" },
  { w: "Esel",      g: "der", e: "🫏", s: "E-sel", lg: true },
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
  { w: "Flasche",   g: "die", e: PICS.flasche, s: "Fla-sche" },
  { w: "Fluss",     g: "der", e: PICS.fluss, s: "Fluss" },
  // G
  { w: "Gurke",     g: "die", e: "🥒", s: "Gur-ke", lg: true },
  { w: "Geschenk",  g: "das", e: "🎁", s: "Ge-schenk" },
  { w: "Gitarre",   g: "die", e: "🎸", s: "Gi-tar-re" },
  { w: "Gorilla",   g: "der", e: "🦍", s: "Go-ril-la" },
  { w: "Geist",     g: "der", e: "👻", s: "Geist" },
  { w: "Gabel",     g: "die", e: PICS.gabel, s: "Ga-bel", lg: true },
  { w: "Glas",      g: "das", e: PICS.glas, s: "Glas", lg: true },
  { w: "Glocke",    g: "die", e: "🔔", s: "Glo-cke", sp: "Glo-ke" },
  // H
  { w: "Hund",      g: "der", e: "🐕", s: "Hund", lg: true },
  { w: "Haus",      g: "das", e: "🏠", s: "Haus", lg: true },
  { w: "Hase",      g: "der", e: "🐇", s: "Ha-se", lg: true },
  { w: "Herz",      g: "das", e: "❤️", s: "Herz" },
  { w: "Hut",       g: "der", e: "👒", s: "Hut", lg: true },
  { w: "Hand",      g: "die", e: "✋", s: "Hand", lg: true },
  { w: "Hai",       g: "der", e: "🦈", s: "Hai", lg: true },
  // I
  { w: "Igel",      g: "der", e: "🦔", s: "I-gel", lg: true },
  { w: "Insel",     g: "die", e: "🏝️", s: "In-sel", lg: true },
  { w: "Iglu",      g: "das", e: PICS.iglu, s: "I-glu", lg: true },
  { w: "Insekt",    g: "das", e: "🪲", s: "In-sekt", lg: true },
  { w: "Irrgarten", g: "der", e: PICS.irrgarten, s: "Irr-gar-ten" },
  // J
  { w: "Jacke",     g: "die", e: PICS.jacke, s: "Ja-cke", sp: "Ja-ke" },
  { w: "Junge",     g: "der", e: PICS.junge, s: "Jun-ge" },
  { w: "Joghurt",   g: "der", e: PICS.joghurt, s: "Jo-ghurt", sp: "Jo-gurt" },
  { w: "Jaguar",    g: "der", e: "🐆", s: "Ja-gu-ar", lg: true },
  { w: "Jause",     g: "die", e: PICS.jause, s: "Jau-se", lg: true },
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
  { w: "Leiter",    g: "die", e: "🪜", s: "Lei-ter", lg: true },
  { w: "Lampe",     g: "die", e: PICS.lampe, s: "Lam-pe", lg: true },
  // M
  { w: "Maus",      g: "die", e: "🐭", s: "Maus", lg: true },
  { w: "Mond",      g: "der", e: "🌙", s: "Mond", lg: true },
  { w: "Milch",     g: "die", e: "🥛", s: "Milch" },
  { w: "Mais",      g: "der", e: "🌽", s: "Mais", lg: true },
  { w: "Mantel",    g: "der", e: "🧥", s: "Man-tel", lg: true },
  { w: "Melone",    g: "die", e: "🍉", s: "Me-lo-ne", lg: true },
  { w: "Muschel",   g: "die", e: "🐚", s: "Mu-schel" },
  // N
  { w: "Nase",      g: "die", e: "👃", s: "Na-se", lg: true },
  { w: "Nudeln",    g: "die", pl: true, e: PICS.nudeln, s: "Nu-deln", lg: true },
  { w: "Nilpferd",  g: "das", e: "🦛", s: "Nil-pferd" },
  { w: "Nest",      g: "das", e: "🪺", s: "Nest", lg: true },
  { w: "Nuss",      g: "die", e: "🥜", s: "Nuss" },
  { w: "Nashorn",   g: "das", e: "🦏", s: "Nas-horn" },
  // O
  { w: "Oma",       g: "die", e: "👵", s: "O-ma", lg: true },
  { w: "Opa",       g: "der", e: "👴", s: "O-pa", lg: true },
  { w: "Ohr",       g: "das", e: "👂", s: "Ohr" },
  { w: "Otter",     g: "der", e: "🦦", s: "Ot-ter" },
  { w: "Orange",    g: "die", e: "🍊", s: "O-ran-ge", sp: "O-rang-sche" },
  { w: "Ofen",      g: "der", e: PICS.ofen, s: "O-fen", lg: true },
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
  { w: "Socke",     g: "die", e: PICS.socke, s: "So-cke", sp: "So-ke" },
  { w: "Seife",     g: "die", e: "🧼", s: "Sei-fe", lg: true },
  { w: "Spaghetti", g: "die", pl: true, e: "🍝", s: "Spa-ghet-ti", sp: "Schpa-get-ti", a: false },
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
  { w: "Unterhose", g: "die", e: "🩲", s: "Un-ter-ho-se", lg: true },
  { w: "U-Boot",    g: "das", e: PICS.uboot, s: "U-Boot" },
  { w: "U-Bahn",    g: "die", e: PICS.ubahn, s: "U-Bahn" },
  // V
  { w: "Vogel",     g: "der", e: "🐦", s: "Vo-gel", sp: "Fo-gel" },
  { w: "Vulkan",    g: "der", e: "🌋", s: "Vul-kan" },
  { w: "Vollmond",  g: "der", e: "🌕", s: "Voll-mond", sp: "Foll-mond" },
  { w: "Vase",      g: "die", e: "🏺", s: "Va-se", sp: "Wa-se", a: false },
  { w: "Video",     g: "das", e: PICS.video, s: "Vi-de-o", sp: "Wi-de-o", a: false },
  // W
  { w: "Wal",       g: "der", e: "🐳", s: "Wal", lg: true },
  { w: "Wolke",     g: "die", e: "☁️", s: "Wol-ke", lg: true },
  { w: "Wolf",      g: "der", e: "🐺", s: "Wolf", lg: true },
  { w: "Würfel",    g: "der", e: "🎲", s: "Wür-fel" },
  { w: "Welle",     g: "die", e: "🌊", s: "Wel-le" },
  { w: "Wecker",    g: "der", e: "⏰", s: "We-cker", sp: "We-ker" },
  { w: "Wald",      g: "der", e: PICS.wald, s: "Wald" },
  // X
  { w: "Xylophon",  g: "das", e: PICS.xylophon, s: "Xy-lo-phon", sp: "Xü-lo-fon" },
  // Y
  { w: "Yoga",      g: "das", e: "🧘", s: "Yo-ga", sp: "Jo-ga" },
  // Z
  { w: "Zebra",     g: "das", e: "🦓", s: "Ze-bra", lg: true },
  { w: "Zug",       g: "der", e: "🚂", s: "Zug", lg: true },
  { w: "Zitrone",   g: "die", e: "🍋", s: "Zi-tro-ne", lg: true },
  { w: "Zelt",      g: "das", e: "⛺", s: "Zelt", lg: true },
  { w: "Zahn",      g: "der", e: PICS.zahn, s: "Zahn" },
  { w: "Ziege",     g: "die", e: "🐐", s: "Zie-ge" },
  { w: "Zirkus",    g: "der", e: "🎪", s: "Zir-kus", lg: true },
  { w: "Zauberer",  g: "der", e: "🧙", s: "Zau-be-rer", lg: true },
  { w: "Zylinder",  g: "der", e: "🎩", s: "Zy-lin-der", sp: "Zü-lin-der" },
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
  "🥤 ; Durst ; Ich habe Durst.",
  "🍽️ ; Hunger ; Ich habe Hunger.",
  "🚽 ; Klo ; Ich muss aufs Klo.",
  "🔄 ; Etwas anderes ; Ich möchte etwas anderes machen.",
].join("\n");

// Belohnungs-Sticker
const STICKERS = ["🐶","🐱","🦄","🐼","🐨","🦋","🐞","🐠","🦖","🐙","🌟","🚀",
  "🌈","🍓","🎈","🦜","🐬","🐢","🦁","🐸","🍭","🎀","🌻","🐧","🦊","🐰",
  "🍉","🧸","🎠","🏰","⭐","🌸","🐝","🦕","🐳","🍦"];

// Wort zu jedem Sticker (Sticker-Album: antippen -> Wort, Anfangsbuchstabe, Silben).
// Ein Text = Wort aus WORDS (mit Artikel und Silben von dort), sonst eigene Angaben wie bei WORDS.
const STICKER_WORDS = {
  "🐶": "Hund", "🐱": "Katze", "🐼": "Panda", "🐨": "Koala", "🐠": "Fisch", "🦕": "Dino",
  "🚀": "Rakete", "🌈": "Regenbogen", "🍓": "Erdbeere", "🦜": "Papagei", "🐬": "Delfin",
  "🦁": "Löwe", "🐸": "Frosch", "🍭": "Lolli", "🐧": "Pinguin", "🦊": "Fuchs", "🐰": "Hase",
  "🍉": "Melone", "🧸": "Teddy", "🐝": "Biene", "🐳": "Wal", "🍦": "Eis",
  "🦄": { w: "Einhorn",       g: "das", s: "Ein-horn" },
  "🦋": { w: "Schmetterling", g: "der", s: "Schmet-ter-ling" },
  "🐞": { w: "Käfer",         g: "der", s: "Kä-fer" },
  "🦖": { w: "Saurier",       g: "der", s: "Sau-ri-er" },
  "🐙": { w: "Krake",         g: "die", s: "Kra-ke" },
  "🌟": { w: "Funkelstern",   g: "der", s: "Fun-kel-stern" },
  "⭐": { w: "Stern",         g: "der", s: "Stern" },
  "🎈": { w: "Ballon",        g: "der", s: "Bal-lon" },
  "🐢": { w: "Schildkröte",   g: "die", s: "Schild-krö-te" },
  "🎀": { w: "Schleife",      g: "die", s: "Schlei-fe" },
  "🌻": { w: "Sonnenblume",   g: "die", s: "Son-nen-blu-me" },
  "🎠": { w: "Karussell",     g: "das", s: "Ka-rus-sell" },
  "🏰": { w: "Burg",          g: "die", s: "Burg" },
  "🌸": "Blüte",
};

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
  { w: "Ei", g: "das", e: "🥚" }, { w: "Eis", g: "das", e: "🍦" }, { w: "Brot", g: "das", e: PICS.brot },
  { w: "Buch", g: "das", e: "📖" }, { w: "Hut", g: "der", e: "👒" }, { w: "Ring", g: "der", e: "💍" },
  { w: "Brille", g: "die", e: "👓" }, { w: "Keks", g: "der", e: "🍪" }, { w: "Lolli", g: "der", e: "🍭" },
  { w: "Geschenk", g: "das", e: "🎁" }, { w: "Kerze", g: "die", e: "🕯️" },
];

// ---------------------------------------------------------------------
//  Wortvorhersage der Mitteil-Tafel (Tastatur)
//  TALK_VOCAB: Grundwortschatz (dazu kommen alle Wörter aus WORDS und STICKER_WORDS).
//  TALK_NEXT:  typische Folgewörter ("ich" -> "möchte", "habe" …).
//  Beides ist nur der Anfang: Die Tafel lernt aus jedem vorgelesenen Text dazu (pro Profil).
// ---------------------------------------------------------------------
const TALK_VOCAB = `ich du er sie es wir ihr mein meine mich mir dich dir uns
ja nein bitte danke hallo tschüss gut schlecht super toll doof
bin bist ist sind war habe hast hat haben möchte möchtest will willst mag magst kann kannst muss musst darf
mache machen gehen gehe spielen spiele essen esse trinken trinke schlafen schlafe sehen sehe hören höre
schaukeln malen lesen singen tanzen kuscheln baden duschen fahren laufen helfen hilf warten schauen anziehen ausziehen
nicht auch noch mehr nochmal fertig jetzt später heute morgen gestern hier da dort raus rein hoch runter
und oder aber weil wenn mit ohne zu zum zur nach in im auf an aus von bei für
was wer wo wann wie warum welche
der die das ein eine einen dem den
Mama Papa Oma Opa Bruder Schwester Freund Freundin Lehrerin Lehrer Betreuerin Betreuer Hund Katze
Hunger Durst Klo Toilette Pause Ruhe Hilfe Schmerzen Bauchweh Kopfweh Musik Fernseher Tablet Buch Ball Spiel
Wasser Saft Tee Milch Kakao Brot Apfel Banane Nudeln Pizza Eis Keks Schokolade Joghurt
müde traurig froh fröhlich wütend krank kalt warm heiß lustig langweilig
Schule Kindergarten Hause Garten Spielplatz Bett Auto Bus Rollstuhl Mieder
weh tut lieb liebe gerne`;
const TALK_NEXT = {
  ich: ["möchte", "will", "habe", "bin", "muss", "mag", "kann", "brauche"],
  du: ["bist", "hast", "kannst", "sollst"], wir: ["möchten", "gehen", "spielen"],
  möchte: ["spielen", "trinken", "essen", "schaukeln", "schlafen", "raus", "nicht", "nach", "kuscheln", "malen"],
  will: ["spielen", "trinken", "essen", "nicht", "raus", "nach", "schaukeln"],
  mag: ["nicht", "dich", "das", "Musik", "spielen"], muss: ["aufs", "mal", "schlafen"], aufs: ["Klo"],
  habe: ["Hunger", "Durst", "Schmerzen", "Bauchweh", "Kopfweh", "keine", "dich"], hast: ["du"],
  bin: ["müde", "traurig", "froh", "fertig", "krank", "wütend"], ist: ["kalt", "warm", "toll", "doof", "lustig"],
  mir: ["ist", "tut"], tut: ["weh"], kann: ["nicht", "ich"], brauche: ["Hilfe", "eine", "Pause"],
  nach: ["Hause"], zu: ["Hause", "Mama", "Papa"], zum: ["Spielplatz"], in: ["den", "die"],
  ein: ["Eis", "Spiel", "Buch"], eine: ["Pause", "Banane"], einen: ["Keks", "Apfel", "Saft"],
  danke: ["schön"], bitte: ["helfen", "nochmal", "warten"], nochmal: ["bitte"], hab: ["dich"], dich: ["lieb"],
  wo: ["ist", "sind", "bist"], was: ["ist", "machen", "gibt"], wann: ["gehen", "kommt", "ist"],
};
