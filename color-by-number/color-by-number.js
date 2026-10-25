/*
 * Pure logic for the Color by Number page, for any of its pictures: which
 * answers go with which color, which problem goes in which space, the summary
 * line, the sheet code, and the read-back check of each worksheet and answer
 * key.
 * No DOM here, so Node tests can load it (tests/color-by-number.test.js).
 * Needs worksheet-core.js. In the browser it attaches to window.ColorByNumber;
 * in Node it is module.exports.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("../worksheet-core.js"));
  else root.ColorByNumber = factory(root.WorksheetCore);
})(this, function (C) {
  "use strict";

  // The crayons, in the order the color key lists them. `fill` paints the
  // answer key and the color key's swatches. Each is light enough to read
  // black numbers on. A picture may use any of them; a new picture that needs
  // another color adds it here, with a fill black numbers can be read on.
  const PALETTE = Object.freeze([
    { color: "orange", name: "Orange", fill: "#f5922a" },
    { color: "yellow", name: "Yellow", fill: "#ffd84a" },
    { color: "green", name: "Green", fill: "#6cbf5a" },
    { color: "purple", name: "Purple", fill: "#9f80d4" },
    { color: "brown", name: "Brown", fill: "#b07a45" }
  ].map(Object.freeze));
  const BLANK = "#ffffff";                    // every space on the worksheet

  // The color key, one row per color: a swatch, the color's name, then its
  // answers, on one line. Sizes are in em at the key's font size. KEY_LEAD_EM
  // is everything before the answers: the swatch (1.8), a gap (0.5), the name
  // (4, and the widest, a bold "Orange", is 3.56), and a gap (0.6), as the
  // page's styles (.cbn-row) set them. In Andika a digit is 0.586 em, and so
  // is the ", " between answers; both get a little margin here.
  const KEY_LEAD_EM = 6.9, KEY_DIGIT_EM = 0.62, KEY_GAP_EM = 0.62;
  const KEY_WIDTH_PT = 7.19 * 72;             // the key's 7.5 in, less its border and padding
  const KEY_MAX_PT = 12;

  /** The palette colors the picture uses, in palette order, each with its number of spaces. */
  function pictureColors(picture) {
    return PALETTE.map((p) => ({ ...p, spaces: picture.regions.filter((r) => r.color === p.color).length }))
      .filter((p) => p.spaces > 0);
  }

  /**
   * One worksheet: a problem for every space, and the color key.
   * Each answer the facts can make goes with exactly one color, so a problem's
   * answer always names one color, the color of its space. Answers are shared
   * out so each color gets about its share of the facts (by how many spaces
   * it has), which keeps every fact appearing about equally often. Then each
   * color's facts are dealt to its spaces in shuffled rounds, as on the other
   * pages, so each dealt problem is the fact itself, answer included.
   * facts: [a, b, product] arrays (WorksheetCore.multiplicationFacts).
   * Returns { problems, key }: problems in the picture's region order, and
   * key rows { color, answers } in palette order, listing only the answers on
   * this sheet, smallest first. Returns { error: "answers", answers, colors }
   * when the facts make fewer different answers than the picture has colors.
   */
  function planSheet(picture, facts, rand) {
    const colors = pictureColors(picture);
    const byAnswer = new Map();
    for (const f of facts) {
      if (!byAnswer.has(f[2])) byAnswer.set(f[2], []);
      byAnswer.get(f[2]).push(f);
    }
    if (byAnswer.size < colors.length) return { error: "answers", answers: byAnswer.size, colors: colors.length };

    // Answers with the most facts go first (ties in shuffled order), each to
    // the color furthest below its share. Once only as many answers are left
    // as colors without one, those colors get them.
    const answers = C.shuffle([...byAnswer.keys()], rand).sort((x, y) => byAnswer.get(y).length - byAnswer.get(x).length);
    const share = colors.map((c) => (facts.length * c.spaces) / picture.regions.length);
    const given = colors.map(() => 0);        // facts each color has so far
    const owner = new Map();                  // answer -> index into colors
    answers.forEach((answer, i) => {
      const empty = colors.flatMap((_, k) => (given[k] ? [] : [k]));
      const pool = answers.length - i <= empty.length ? empty : colors.map((_, k) => k);
      const k = pool.reduce((best, j) => (share[j] - given[j] > share[best] - given[best] ? j : best));
      owner.set(answer, k);
      given[k] += byAnswer.get(answer).length;
    });

    const problems = new Array(picture.regions.length);
    const key = colors.map((c, k) => {
      const spots = picture.regions.flatMap((r, i) => (r.color === c.color ? [i] : []));
      const dealt = C.dealProblems(facts.filter((f) => owner.get(f[2]) === k), spots.length, rand);
      spots.forEach((i, n) => { problems[i] = dealt[n]; });
      return { color: c.color, answers: [...new Set(dealt.map((f) => f[2]))].sort((x, y) => x - y) };
    });
    return { problems, key };
  }

  /**
   * Font size (pt) for a color key: KEY_MAX_PT, or less if the longest row of
   * answers wouldn't fit on its line, as with 13 four-digit answers (99s).
   */
  function keyFont(key) {
    const em = (row) => KEY_LEAD_EM + row.answers.reduce((sum, a) => sum + String(a).length * KEY_DIGIT_EM, 0) + (row.answers.length - 1) * KEY_GAP_EM;
    return Math.min(KEY_MAX_PT, KEY_WIDTH_PT / Math.max(...key.map(em)));
  }

  /**
   * Sentence for the summary line: how often each fact appears, true of every
   * worksheet. sheets: each worksheet's planned problems (before Mixed flips
   * any, so each problem is still its fact).
   */
  function coverageText(sheets, factCount) {
    let fewest = Infinity, most = 0, lo = Infinity, hi = 0;
    for (const problems of sheets) {
      const counts = new Map();
      for (const f of problems) counts.set(f, (counts.get(f) || 0) + 1);
      fewest = Math.min(fewest, counts.size);
      most = Math.max(most, counts.size);
      for (const n of counts.values()) { lo = Math.min(lo, n); hi = Math.max(hi, n); }
    }
    const times = lo === hi ? (lo === 1 ? "once" : lo + " times") : lo + (hi === lo + 1 ? " or " : " to ") + hi + " times";
    if (fewest === factCount) return "Each fact appears " + times + ".";
    return "Uses " + (fewest === most ? fewest : fewest + " to " + most) + " of " + factCount + " facts, each " + times + ".";
  }

  /**
   * The code printed on a worksheet and its key. It covers the picture, every
   * space's problem in order, and the color key, so a key matches only its own
   * worksheet. Numbers and their printed text give the same code.
   */
  function sheetCode(picture, problems, key) {
    let s = "color|" + picture.name;
    for (const p of problems) s += "|" + p[0] + "," + p[1];
    for (const row of key) s += "|" + row.color + ":" + row.answers.join(",");
    return C.codeFor(s);
  }

  /**
   * The read-back check, run on each built worksheet and answer key before
   * they go on screen. Pages come read back as plain text:
   *   { codes: [code text],
   *     key: [{ color, name, swatch, text, answers: [answer text] }] (the color key's rows),
   *     lines: [outline path, inner path],
   *     spaces: [{ id, d, fill }] (the picture's spaces, in order),
   *     labels: [{ id, x, y, text, parts: [[name, text], ...] }] (their labels, in order) }.
   * The worksheet's labels are problems (a, sign, b); the key's are answers.
   * keyPage is null when the answer key is off; the worksheet is checked
   * either way. Returns nothing. Throws an Error naming the first problem it
   * finds. It passes only when it positively confirms every space, so empty or
   * partial input fails.
   */
  function verifySheet(picture, sheetPage, keyPage) {
    const fail = (where, what) => { throw new Error(where + ": " + what); };
    const colors = pictureColors(picture);
    const regions = picture.regions;
    const list = (x) => (Array.isArray(x) ? x : []);

    // The color key: one row per color, in order, each with its own name and
    // swatch and at least one answer, written plainly and smallest first, and
    // no answer in two rows. Returns each answer's color.
    function readKey(page, where) {
      const rows = list(page && page.key);
      if (rows.length !== colors.length) fail(where, "the color key should have " + colors.length + " colors");
      const owner = new Map();
      rows.forEach((row, k) => {
        const c = colors[k], at = where + ", color key row " + (k + 1);
        if (!row || row.color !== c.color || row.name !== c.name || row.swatch !== c.fill) fail(at, "should be " + c.name);
        const answers = list(row.answers);
        if (!answers.length) fail(at, "has no answers");
        if (row.text !== c.name + answers.join(", ")) fail(at, "text outside the answers");
        let last = -1;
        for (const a of answers) {
          const n = C.readWhole(a);
          if (Number.isNaN(n)) fail(at, "unreadable answer " + JSON.stringify(a));
          if (n <= last) fail(at, "answers out of order");
          if (owner.has(a)) fail(at, a + " is in two colors");
          owner.set(a, c.color);
          last = n;
        }
      });
      return owner;
    }

    // The picture: the same spaces and lines, every space filled as `fillOf`
    // says, and one label per space at its spot, made of the named parts.
    function readPicture(page, where, fillOf, names) {
      const lines = list(page.lines);
      if (lines.length !== 2 || lines[0] !== picture.outline || lines[1] !== picture.inner) fail(where, "lines differ from the picture");
      const spaces = list(page.spaces), labels = list(page.labels);
      if (spaces.length !== regions.length) fail(where, "expected " + regions.length + " spaces");
      if (labels.length !== regions.length) fail(where, "expected " + regions.length + " labels");
      return regions.map((r, i) => {
        const at = where + ", space " + (i + 1), s = spaces[i], label = labels[i];
        if (!s || s.id !== r.id || s.d !== r.d) fail(at, "differs from the picture");
        if (s.fill !== fillOf(r)) fail(at, "filled " + JSON.stringify(s.fill));
        if (!label || label.id !== r.id || label.x !== String(r.x) || label.y !== String(r.y)) fail(at, "label is out of place");
        const parts = list(label.parts);
        if (parts.map((p) => p[0]).join(" ") !== names.join(" ")) fail(at, "unexpected parts");
        if (label.text !== parts.map((p) => p[1]).join("")) fail(at, "text outside the marked parts");
        return Object.fromEntries(parts);
      });
    }

    // The worksheet: blank spaces, each labeled with a readable problem whose
    // answer is in the color key under the space's own color. Every answer in
    // the key belongs to some space.
    const where = "worksheet";
    const owner = readKey(sheetPage, where);
    const used = new Set();
    const printed = readPicture(sheetPage, where, () => BLANK, ["a", "sign", "b"]).map(({ a, sign, b }, i) => {
      const at = where + ", space " + (i + 1);
      if (sign !== "×") fail(at, "unexpected sign " + JSON.stringify(sign));
      if (Number.isNaN(C.readWhole(a)) || Number.isNaN(C.readWhole(b))) fail(at, "unreadable number");
      const answer = String(C.readWhole(a) * C.readWhole(b));
      if (!owner.has(answer)) fail(at, a + " × " + b + " = " + answer + ", which isn't in the color key");
      if (owner.get(answer) !== regions[i].color) fail(at, a + " × " + b + " = " + answer + " is " + owner.get(answer) + ", but the space is " + regions[i].color);
      used.add(answer);
      return [a, b];
    });
    for (const a of owner.keys()) if (!used.has(a)) fail(where, "the color key lists " + a + ", which no space uses");
    const code = sheetCode(picture, printed, sheetPage.key);
    const hasCode = (page) => list(page.codes).length === 1 && page.codes[0] === code;
    if (!hasCode(sheetPage)) fail(where, "sheet code doesn't match");
    if (keyPage === null) return;

    // The key: the same color key and code, every space painted its own
    // color, and each label the right answer to the worksheet's problem there.
    const k = "answer key";
    readKey(keyPage, k);
    if (JSON.stringify(keyPage.key) !== JSON.stringify(sheetPage.key)) fail(k, "color key differs from the worksheet");
    if (!hasCode(keyPage)) fail(k, "sheet code doesn't match");
    const fill = new Map(colors.map((c) => [c.color, c.fill]));
    readPicture(keyPage, k, (r) => fill.get(r.color), ["answer"]).forEach(({ answer }, i) => {
      const [a, b] = printed[i];
      if (!C.checkAnswer("×", C.readWhole(a), C.readWhole(b), C.readWhole(answer))) {
        fail(k + ", space " + (i + 1), a + " × " + b + " shows " + JSON.stringify(answer));
      }
    });
  }

  return { PALETTE, BLANK, pictureColors, planSheet, keyFont, coverageText, sheetCode, verifySheet };
});
