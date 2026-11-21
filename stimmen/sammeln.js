// =====================================================================
//  Sammelt alle Texte, die als fertige Tondatei gesprochen werden sollen.
//  Wird von stimmen-erzeugen.py über Edge (ohne Fenster) aufgerufen; nutzt ../web/data.js.
//
//  WICHTIG: Die Satzmuster hier entsprechen den Sätzen in web/app.js. Wird dort ein
//  Satz geändert oder ein neues Spiel ergänzt, hier das Muster ebenfalls anpassen.
//  Das Programm zerlegt jeden Satz an Satzzeichen und an einzelnen Buchstaben
//  ("… mit dem Buchstaben | M | an.") – deshalb stehen hier oft nur Satzteile.
// =====================================================================
(function () {
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const art = w => `${w.g} ${w.w}`;
  const verb = (w, sg, pl) => w.pl ? pl : sg;
  const NUMS = ["", "eine Silbe", "zwei Silben", "drei Silben", "vier Silben"];
  const INDEF = { der: "einen", die: "eine", das: "ein" };
  const ACC = { der: "den", die: "die", das: "das" };
  const slug = s => s.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z]/g, "");

  // Aussprache genau vorgeben (Lautschrift IPA) – sonst spricht die Stimme z. B. "l" als "el",
  // "ma" als "Maria" oder "se" als "see". <phoneme> versteht das Modell "Eleven v4".
  const ph = (ipa, t) => `<phoneme alphabet="ipa" ph="${ipa}">${t}</phoneme>.`;
  // Laute zum Lesenlernen: kurz, nicht als Buchstabenname. Mitlaute brauchen ein Dehnungszeichen (lː)
  // oder ein ganz kurzes Murmel-e (bə) – ein einzelner Mitlaut allein bringt die Stimme durcheinander.
  // Lässt sich in stimmen/texte-anpassen.txt für jeden Buchstaben ändern.
  const LAUT_IPA = {
    A: "aː", B: "bə", C: "kə", D: "dː", E: "eː", F: "fː", G: "ɡə", H: "hə", I: "iː", J: "jə",
    K: "kə", L: "lə", M: "mː", N: "nː", O: "oː", P: "pə", Q: "kv", R: "ʁə", S: "sː", T: "tə",
    U: "uː", V: "fə", W: "vː", X: "ks", Y: "iː", Z: "tsə", "Ä": "ɛː", "Ö": "øː", "Ü": "yː",
  };
  // alle als Laut (Wunsch der Nutzerin 20.11.2026): C wie k, V wie f, Y wie i
  const LAUT = {};
  Object.keys(LAUT_IPA).forEach(L => { LAUT[L] = ph(LAUT_IPA[L], L.toLowerCase()); });

  // Wörter, die die Stimme sonst englisch spricht (gilt auch in Sätzen)
  const WORD_IPA = { Rose: "ˈʁoːzə" };
  const wordPh = t => t.replace(/\b(Rose)\b/g, w => `<phoneme alphabet="ipa" ph="${WORD_IPA[w]}">${w}</phoneme>`);

  const out = { laut: {}, name: {}, wort: {}, silben: {}, satz: [] };
  const seen = new Set();
  const key = t => String(t).toLowerCase().replace(/[^a-zäöüß0-9]+/g, " ").trim();
  // gruppe = Reihenfolge beim Erzeugen (wichtige zuerst, falls das Guthaben nicht reicht)
  // wie im Programm: Texte werden an Satzzeichen zerlegt, jedes Stück ist eine eigene Tondatei
  const add = (gruppe, t) => (String(t).match(/[^.!?:]+[.!?:]*/g) || []).forEach(x => {
    x = x.trim(); const k = key(x); if (!k || seen.has(k)) return; seen.add(k);
    const say = wordPh(x);                             // "say" = so gesprochen (mit Lautschrift), "text" = Schlüssel im Programm
    out.satz.push(say === x ? { gruppe, text: x } : { gruppe, text: x, say });
  });

  // ---- Buchstaben: Laut und Name ----
  // Namen, die die Stimme sonst falsch liest (I = "1.", J = "tschai", X = "ex", Y = "i")
  const NAME_IPA = { I: "iː", J: "jɔt", O: "oː", X: "ɪks", Y: "ˈʏpsilɔn" };
  Object.keys(LAUT).forEach(L => { out.laut[slug(L)] = LAUT[L]; out.name[slug(L)] = NAME_IPA[L] ? ph(NAME_IPA[L], L) : L + "."; });

  // ---- Wörter (Lernwörter, Stickerwörter, Artikel) und Silben ----
  const ALL = WORDS.slice();
  Object.entries(STICKER_WORDS).forEach(([e, d]) => { if (typeof d !== "string") ALL.push(Object.assign({ e }, d)); });
  ["der", "die", "das"].forEach(a => { out.wort[a] = a; });
  ALL.forEach(w => {
    out.wort[slug(w.w)] = WORD_IPA[w.w] ? `<phoneme alphabet="ipa" ph="${WORD_IPA[w.w]}">${w.w}</phoneme>.` : w.w + ".";
    // Silben: die Stimme sagt erst das ganze Wort, dann langsam die Silben ("Hase. Ha – se.") –
    // so klingen sie deutsch. stimmen-erzeugen.py schneidet die Silben an den Pausen heraus.
    const syl = w.s.split("-");
    out.silben[slug(w.w)] = { text: `${wordPh(w.w)}. ${syl.join(" – ")}.`, n: syl.length };
  });
  COLORS.forEach(c => { out.wort[slug(c.w)] = cap(c.w) + "."; });

  // ---- feste Sätze: Begrüßung, Menü, Anweisungen, Mitteil-Tafel ----
  [
    "Hallo! Ich bin Emil, die Eule.", "Lass uns zusammen lesen und schreiben lernen!", "Such dir ein Spiel aus.",
"Was möchtest du spielen?", "Such dir ein Bild aus.", "Der Ton ist wieder an.",
    "Welche Stufe möchtest du spielen?", "Diese Stufe ist noch gesperrt.", "Schaffe erst die Stufe davor.",
    "Pause.", "Schau auf den Knopf, wenn es weitergehen soll.", "Weiter geht's!",
    "Möchtest du das ABC-Abenteuer beenden?", "Ja oder nein?", "Möchtest du aufhören?", "Dann noch einmal die Tür.",
    "Tschüss!", "Bis bald!", "Schön, dann spielen wir weiter!",
    "Womit fängt das Wort an?", "Was fängt mit diesem Buchstaben an?", "Welcher Buchstabe fehlt am Ende?",
    "Hör genau!", "Hör mal.", "Hör zu:", "Hör genau:", "Hör noch einmal genau und klatsch mit.",
    "Wo ist der Buchstabe?", "Wo ist der Buchstabe", "Hör gut zu!", "Der Buchstabe macht so:", "Und er heißt:",
"Das ist der Buchstabe", "Wir suchen den Buchstaben",
    "Wir brauchen jetzt den Buchstaben", "Was fängt mit dem Buchstaben", "Lass alle Ballons mit dem Buchstaben", "platzen!",
    "an.", "an?", "auf.", "Was kommt jetzt?", "Lies genau.", "Lies das Wort.", "Welches Bild passt?", "Lies den Satz.",
    "Lies die beiden Wörter.", "Welches Wort passt zum Bild?", "Welches Bild hat diese Farbe?", "Lies die Wörter genau.",
    "Lies das Wort. Welches Bild hat diese Farbe?", "Das passt noch nicht.", "Lies beide Wörter noch einmal genau.",
    "Lies den Satz noch einmal genau.", "Der gehört nicht zu diesem Wort.", "Der kommt erst später.", "Welcher passt jetzt?",
    "Schau, dieser Stein passt jetzt.", "Lege das Wort aus den Steinen!", "Welcher Stein kommt zuerst?",
    "Welcher Stein kommt als Nächstes?", "Wie viele Silben hörst du?", "Klatsch mit!",
    "Finde immer einen Buchstaben und das passende Bild.", "Finde immer ein Wort und das passende Bild.",
    "Schau einen Buchstaben an.", "Ich zeige dir ein Bild dazu.", "Schau auf Weiter, dann kommt die nächste Aufgabe.",
    "Schau auf Fertig.", "Super gemacht!", "Du hast einen neuen Sticker bekommen!", "Möchtest du nochmal spielen?",
    "Ein neuer Sticker für dich!", "Wow!", "Du hast einen Sticker bekommen und eine neue Stufe freigeschaltet!",
    "Du hast noch keine Sticker.", "Spiel eine Runde!", "Du hast schon einen Sticker!",
    "Schau ihn an, dann erzähle ich dir etwas dazu.", "Toll!", "Schau einen an, dann erzähle ich dir etwas dazu.",
    "Was für ein schöner Sticker!", "Versuch es noch einmal.", "Wir brauchen",
    "Was möchtest du sagen?", "Schreib, was du sagen möchtest.", "Schreib zuerst etwas.", "Da steht noch nichts.",
    "Alles gelöscht.", "Alles löschen?", "Dann wähl den Mülleimer noch einmal.", "Möchtest du noch etwas sagen?", "Komma", "Punkt", "Fragezeichen", "scharfes S", "A B C Tastatur", "Quertz Tastatur",
    "Lies noch einmal genau.", "So laut spreche ich jetzt.", "Tastatur", "Bilder", "Zurück", "Vorlesen", "Groß anzeigen",
    // Felder, die beim Anschauen vorgelesen werden (data-say in index.html und app.js)
    "Anfangsbuchstabe", "Fertig", "Weiter", "Ich möchte etwas sagen", "Ja", "Nein", "Noch ein Bild", "Nochmal spielen",
    "Nächste Stufe", "Silben", "Tastatur umschalten", "Ton", "Ton ausschalten", "Wort", "Zum Menü", "Zurück zum Menü",
    "Zurück zum Album", "nach oben", "nach unten", "Sticker",
    "Buchstaben entdecken", "Anfang und Ende", "Wörter lesen", "Sätze lesen", "Wörter schreiben", "Silben klatschen",
    "Silben-Puzzle", "Memory", "Ballon-Jagd", "Farben malen", "Meine Sticker",
    "Stufe 1, leicht", "Stufe 2, mittel", "Stufe 3, schwer", "Stufe 2 ist noch gesperrt", "Stufe 3 ist noch gesperrt",
  ].forEach(t => add(1, t));
  for (let n = 2; n <= 100; n++) add(1, `Du hast schon ${n} Sticker gesammelt!`);
  PRAISE.forEach(t => add(1, t));
  ENCOURAGE.forEach(t => t.split(/(?<=[.!?])\s+/).forEach(x => add(1, x)));
  // Mitteil-Tafel: keine Tondateien – dort spricht immer die Windows-Stimme (Wunsch der Nutzerin)

  // ---- Sätze lesen ----
  SENT_ANIMALS.forEach(an => SENT_THINGS.forEach(th => {
    add(3, `${cap(an.g)} ${an.w} hat ${INDEF[th.g]} ${th.w}.`);
    add(3, `${an.w} und ${th.w}`);
  }));
  COLOR_PICS.forEach(p => COLORS.slice(0, 6).forEach(c => add(3, `${cap(p.g)} ${p.n} ist ${c.w}.`)));

  // ---- Farben malen ----
  COLOR_PICS.forEach(p => {
    add(5, `Welche Farbe hat ${p.g} ${p.n}?`);
    COLORS.forEach(c => { add(5, `${cap(p.g)} ${p.n} ist ${c.w}.`); add(5, `${cap(p.g)} ${p.n} ist jetzt ${c.w}.`); });
    MIX_TARGETS.forEach(m => add(5, `Welche zwei Farben brauchst du, damit ${p.g} ${p.n} ${m.w} wird?`));
  });
  COLORS.forEach(c => { add(5, `Hier steht ${c.w}.`); add(5, `Welches Bild ist ${c.w}?`); add(5, `Da steht ${c.w}.`); add(5, `Das ist ${c.w}.`); });
  COLOR_PICS.forEach(p => {
    add(5, `Mit welcher Farbe malst du ${ACC[p.g]} ${p.n} an?`);
    COLORS.forEach(c => add(5, `Mal ${ACC[p.g]} ${p.n} ${c.w} an!`));
  });
  add(1, "Schau noch einmal.");
  MIX_TARGETS.forEach(m => { add(5, `Mische ${m.w}!`); add(5, `Wir brauchen ${cap(m.w)}.`); });
  Object.entries(MIXES).forEach(([k, [res]]) => { const [a, b] = k.split("+"); add(5, `${cap(a)} und ${cap(b)} zusammen ergibt ${cap(res)}.`); add(5, `${cap(b)} und ${cap(a)} zusammen ergibt ${cap(res)}.`); });

  // ---- Wortbezogene Anweisungen (für jedes Wort) ----
  ALL.forEach(w => {
    const fv = verb(w, "fängt", "fangen"), hv = verb(w, "hört", "hören"), n = (w.s || "").split("-").length;
    add(2, art(w));
    add(2, `Womit ${fv} ${art(w)} an?`);
    add(2, `${cap(art(w))} ${fv} mit dem Buchstaben`);
    add(2, `wie ${w.w}.`);
    add(2, `Da steht ${w.w}.`);
    add(4, `Wo steht ${w.w}?`);
    add(4, `Wie viele Silben hat ${art(w)}?`);
    if (NUMS[n]) add(4, `${cap(art(w))} hat ${NUMS[n]}.`);
    add(4, `Das ist ${art(w)}!`);
    add(4, `Lege das Wort ${w.w}.`);
    add(5, `Schreib das Wort ${w.w}.`);
    add(5, `Du hast ${w.w} geschrieben!`);
    add(5, `Womit ${hv} ${art(w)} auf?`);
    add(5, `${cap(art(w))} ${hv} mit dem Buchstaben`);
    add(5, `${w.w} fängt mit`);
    add(5, n === 1 ? `${w.w} hat eine Silbe.` : `${w.w} hat ${n} Silben.`);
  });

  document.getElementById("out").textContent = "SAMMLUNG:" + JSON.stringify(out);
})();
