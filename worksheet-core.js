/*
 * Pure logic shared by the times table and division worksheet pages:
 * parsing, fact building, dealing, labels, and layout math.
 * No DOM here, so Node tests can load it (tests/worksheet-core.test.js).
 * In the browser it attaches to window.WorksheetCore; in Node it is module.exports.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.WorksheetCore = api;
})(this, function () {
  "use strict";

  // Sheet geometry in points (72 pt = 1 in). Letter page, 0.5 in margins.
  const GRID_W = 7.5 * 72;                    // 540 pt
  const GRID_H = (10 - 1.05 - 0.15) * 72;     // 633.6 pt below the header
  const MIN_ONE_PAGE_FONT = 11;               // below this, split across pages instead
  const PAGED_FONT = 13;                      // font size once a sheet splits

  // Division problem widths, in em.
  const DIGIT_EM = 0.62;                      // one tabular digit in Andika
  const SIGN_EM = 1.1;                        // ÷ or = with a little air on each side

  /** Small seeded generator so editing the title doesn't reshuffle the sheet. */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** In-place Fisher-Yates shuffle driven by the given random function. */
  function shuffle(arr, rand) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Parse a list of whole numbers up to 99: "4", "3, 4, 6", or "2-5".
   * Returns { numbers } sorted and unique, or { error } where error is
   * "empty", "format", or "below" (a number under `min`). Each page turns
   * the error code into its own wording.
   */
  function parseNumberList(str, min) {
    const cleaned = String(str).replace(/\s*[-–]\s*/g, "-").trim();
    if (!cleaned) return { error: "empty" };
    const out = new Set();
    for (const tok of cleaned.split(/[,\s]+/).filter(Boolean)) {
      const m = /^(\d{1,2})(?:-(\d{1,2}))?$/.exec(tok);
      if (!m) return { error: "format" };
      let a = +m[1], b = m[2] === undefined ? a : +m[2];
      if (a > b) [a, b] = [b, a];
      if (a < min) return { error: "below" };
      for (let n = a; n <= b; n++) out.add(n);
    }
    return { numbers: [...out].sort((x, y) => x - y) };
  }

  /**
   * Times table facts as [top, bottom, product]. With onTop, the table number is
   * the top factor: 4 x 1, 4 x 2, ... The product is computed here, once, so the
   * answer key prints the answer that travels with each problem.
   */
  function multiplicationFacts(tables, from, to, onTop) {
    const facts = [];
    for (const t of tables) for (let m = from; m <= to; m++) facts.push(onTop ? [t, m, t * m] : [m, t, m * t]);
    return facts;
  }

  /**
   * Division facts as [dividend, divisor, quotient]. Each is a times-table
   * fact run backward, so every answer is a whole number with no remainder.
   */
  function divisionFacts(divisors, from, to) {
    const facts = [];
    for (const d of divisors) for (let q = from; q <= to; q++) facts.push([d * q, d, q]);
    return facts;
  }

  /**
   * Deal `total` items from `facts` in shuffled rounds so every fact shows up
   * about equally, and the same problem never appears twice in a row. Items are
   * compared by identity, so the pages deal their fact arrays directly: each
   * dealt problem is the fact itself, with its answer attached.
   */
  function dealProblems(facts, total, rand) {
    const out = [];
    if (!facts.length) return out;           // nothing to deal; avoids an endless loop
    while (out.length < total) {
      const round = shuffle(facts.slice(), rand);
      const last = out[out.length - 1];
      if (last !== undefined && round.length > 1 && round[0] === last) {
        const k = 1 + Math.floor(rand() * (round.length - 1));
        [round[0], round[k]] = [round[k], round[0]];
      }
      out.push(...round);
    }
    return out.slice(0, total);
  }

  /**
   * Readable list of numbers, each followed by `suffix`. Runs of 3 or more
   * collapse to a range. With "s": "4s", "2s–5s", "3s, 4s, and 6s".
   * With "": "4", "2–5", "3 and 6".
   */
  function listLabel(nums, suffix) {
    const parts = [];
    for (let i = 0; i < nums.length; ) {
      let j = i;
      while (j + 1 < nums.length && nums[j + 1] === nums[j] + 1) j++;
      if (j - i >= 2) parts.push(nums[i] + suffix + "–" + nums[j] + suffix);
      else for (let k = i; k <= j; k++) parts.push(nums[k] + suffix);
      i = j + 1;
    }
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return parts[0] + " and " + parts[1];
    return parts.slice(0, -1).join(", ") + ", and " + parts[parts.length - 1];
  }

  /**
   * Column widths in em for one division problem, sized to the largest numbers
   * on the sheet so every problem lines up: [dividend, ÷, divisor, =, blank].
   * The blank is at least 2 digits wide so small answers still have room.
   */
  function divisionWidths(facts) {
    const digits = (n) => String(n).length;
    let dd = 1, dv = 1, q = 1;
    for (const [a, b, c] of facts) {
      dd = Math.max(dd, digits(a)); dv = Math.max(dv, digits(b)); q = Math.max(q, digits(c));
    }
    const cols = [dd * DIGIT_EM, SIGN_EM, dv * DIGIT_EM, SIGN_EM, Math.max(2, q) * DIGIT_EM + 1.0];
    return { cols, total: cols.reduce((s, w) => s + w, 0) };
  }

  /**
   * Pick a font size (pt) and pagination for a cols x rows grid.
   * emPerCol and emPerRow are the room one problem needs, in em; maxFont caps
   * the size on small grids. Stays on one page while the font is readable,
   * otherwise splits across pages at a fixed size.
   */
  function layout(cols, rows, { emPerCol, emPerRow, maxFont }) {
    const widthFont = Math.min(maxFont, GRID_W / (cols * emPerCol));
    const oneFont = Math.min(widthFont, GRID_H / (rows * emPerRow));
    if (oneFont >= Math.min(MIN_ONE_PAGE_FONT, widthFont)) {
      return { font: oneFont, rowsPerPage: rows, pages: 1 };
    }
    const font = Math.min(widthFont, PAGED_FONT);
    const rowsPerPage = Math.max(1, Math.floor(GRID_H / (font * emPerRow)));
    return { font, rowsPerPage, pages: Math.ceil(rows / rowsPerPage) };
  }

  /**
   * Most problems per row that still fit at a readable size. Splitting pages
   * only fixes height, so width alone must not push the font under minFont (pt).
   */
  function maxColsFor(emPerCol, minFont = MIN_ONE_PAGE_FONT) {
    return Math.max(1, Math.floor(GRID_W / (minFont * emPerCol)));
  }

  /** Sentence saying how often each fact appears, for the summary line. */
  function coverageText(total, factCount) {
    const each = Math.floor(total / factCount), extra = total % factCount;
    if (total < factCount) return "Uses " + total + " of " + factCount + " facts, each once.";
    if (extra === 0) return "Each fact appears " + each + (each === 1 ? " time." : " times.");
    return "Each fact appears " + each + " or " + (each + 1) + " times.";
  }

  /*
   * ---------- Answer key checks ----------
   * The answer key must never be wrong. Answers are made once, with their facts,
   * and the worksheet and key pages are built from the same dealt list. Then,
   * before anything goes on screen, the page reads its own text back and
   * verifySheets confirms every problem. Any doubt throws, and the page leaves
   * the key out rather than show one it could not confirm.
   */

  /**
   * True only when `answer` is right for `a op b`, where op is "×" or "÷".
   * Every value must be a whole number. Division is checked by multiplying back,
   * so a remainder can never pass, and dividing by 0 always fails.
   */
  function checkAnswer(op, a, b, answer) {
    const whole = (n) => Number.isSafeInteger(n) && n >= 0;
    if (!whole(a) || !whole(b) || !whole(answer)) return false;
    if (op === "×") return a * b === answer;
    if (op === "÷") return b >= 1 && b * answer === a;
    return false;
  }

  /**
   * A printed number read strictly: plain digits with no sign, space, decimal
   * point, or leading zero. NaN otherwise. Number() alone is too forgiving:
   * it reads "" as 0, and " 28" and "0x1C" as 28.
   */
  function readWhole(s) {
    return typeof s === "string" && /^(0|[1-9]\d*)$/.test(s) ? Number(s) : NaN;
  }

  /**
   * Split dealt problems into pages of rowsPerPage rows. The worksheet and the
   * answer key both use this, so page 2 of the key always holds page 2's problems.
   */
  function pageSlices(problems, cols, rowsPerPage) {
    const per = cols * rowsPerPage;
    if (!Number.isInteger(per) || per < 1) throw new RangeError("pageSlices needs at least 1 problem per page");
    const pages = [];
    for (let i = 0; i < problems.length; i += per) pages.push(problems.slice(i, i + per));
    return pages;
  }

  // Digits and consonants that are hard to misread: no 0 or O, 1 or I or L,
  // 2 or Z, 5 or S, 8 or B, G, Q, or X (it looks like a times sign). No vowels,
  // so a code never spells a word. 18 characters give 104,976 codes.
  const CODE_CHARS = "34679CDFHJKMNPRTVW";

  /**
   * Four-character code printed on every worksheet and key page, so anyone can
   * match a key to the sheet in hand, even across shuffles or later visits. It
   * covers everything that decides what lands where: the operation, the grid
   * width, the page split, and every problem's numbers in order.
   */
  function sheetCode(op, cols, rowsPerPage, problems) {
    let s = op + "|" + cols + "|" + rowsPerPage;
    for (const p of problems) s += "|" + p[0] + "," + p[1];
    // FNV-1a: a small, well-mixed 32-bit string hash.
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
    h >>>= 0;
    let code = "";
    for (let i = 0; i < 4; i++) {
      code += CODE_CHARS[h % CODE_CHARS.length];
      h = Math.floor(h / CODE_CHARS.length);
    }
    return code;
  }

  // What each problem must contain, in order, as data-part names. Signs must be
  // exactly these characters, so a division sheet can never pass as times tables.
  const PARTS = { "×": ["a", "sign", "b", "answer"], "÷": ["a", "sign", "b", "sign", "answer"] };
  const SIGNS = { "×": ["×"], "÷": ["÷", "="] };

  /**
   * Check one problem as read from the page: the right parts in the right order,
   * the right signs, no text outside the marked parts, and readable numbers.
   * Returns the printed { a, b, answer } strings. Throws otherwise.
   */
  function readProblem(op, cell, where) {
    const parts = cell && Array.isArray(cell.parts) ? cell.parts : [];
    const names = parts.map((p) => p[0]).join(" ");
    if (names !== PARTS[op].join(" ")) throw new Error(where + ": unexpected parts (" + names + ")");
    if (cell.text !== parts.map((p) => p[1]).join("")) throw new Error(where + ": text outside the marked parts");
    const signs = parts.filter((p) => p[0] === "sign").map((p) => p[1]).join(" ");
    if (signs !== SIGNS[op].join(" ")) throw new Error(where + ": unexpected signs (" + signs + ")");
    const get = (name) => parts.find((p) => p[0] === name)[1];
    const a = get("a"), b = get("b");
    if (Number.isNaN(readWhole(a)) || Number.isNaN(readWhole(b))) throw new Error(where + ": unreadable number");
    if (op === "÷" && b === "0") throw new Error(where + ": divides by 0");
    return { a, b, answer: get("answer") };
  }

  /**
   * The read-back check, run on the built pages before they go on screen.
   * sheet: { op, cols, rows, rowsPerPage } from the settings and layout.
   * sheetPages and keyPages: pages read back as plain text, each
   *   { grid, codes: [code text], cells: [{ text, parts: [[name, text], ...] }] }.
   * keyPages is null when the answer key is off; the worksheet is checked either way.
   * Returns nothing. Throws an Error naming the first problem it finds. It passes
   * only when it positively confirms every problem, so empty or partial input fails.
   */
  function verifySheets(sheet, sheetPages, keyPages) {
    const { op, cols, rows, rowsPerPage } = sheet;
    const fail = (where, what) => { throw new Error(where + ": " + what); };
    const count = (n) => Number.isInteger(n) && n >= 1;
    if (!PARTS[op]) fail("sheet", "unknown operation " + op);
    if (!count(cols) || !count(rows) || !count(rowsPerPage)) fail("sheet", "bad grid size");
    const total = cols * rows, per = cols * rowsPerPage, pageCount = Math.ceil(rows / rowsPerPage);
    const hasCode = (page, code) => page && Array.isArray(page.codes) && page.codes.length === 1 && page.codes[0] === code;

    // The worksheet: every problem readable, every answer spot empty, and
    // exactly cols x rows problems split the way the layout says.
    if (!Array.isArray(sheetPages) || sheetPages.length !== pageCount) fail("worksheet", "expected " + pageCount + " pages");
    const printed = [];
    sheetPages.forEach((page, p) => {
      const want = Math.min(per, total - p * per);
      if (!page || !Array.isArray(page.cells) || page.cells.length !== want) {
        fail("worksheet page " + (p + 1), "expected " + want + " problems");
      }
      page.cells.forEach((cell, i) => {
        const where = "worksheet page " + (p + 1) + ", problem " + (i + 1);
        const { a, b, answer } = readProblem(op, cell, where);
        if (answer !== "") fail(where, "an answer is showing");
        printed.push([a, b]);
      });
    });
    const code = sheetCode(op, cols, rowsPerPage, printed);
    sheetPages.forEach((page, p) => { if (!hasCode(page, code)) fail("worksheet page " + (p + 1), "sheet code doesn't match"); });
    if (keyPages === null) return;

    // The key: same pages, same grid, same numbers in the same spots, and every
    // answer confirmed from the numbers printed beside it.
    if (!Array.isArray(keyPages) || keyPages.length !== pageCount) fail("answer key", "expected " + pageCount + " pages");
    keyPages.forEach((page, p) => {
      const where = "answer key page " + (p + 1), sheetPage = sheetPages[p];
      if (!page || typeof page.grid !== "string" || !page.grid || page.grid !== sheetPage.grid) {
        fail(where, "grid differs from the worksheet");
      }
      if (!hasCode(page, code)) fail(where, "sheet code doesn't match");
      if (!Array.isArray(page.cells) || page.cells.length !== sheetPage.cells.length) {
        fail(where, "expected " + sheetPage.cells.length + " problems");
      }
      page.cells.forEach((cell, i) => {
        const at = where + ", problem " + (i + 1);
        const { a, b, answer } = readProblem(op, cell, at);
        const [sa, sb] = printed[p * per + i];
        if (a !== sa || b !== sb) fail(at, a + " " + op + " " + b + " differs from the worksheet's " + sa + " " + op + " " + sb);
        if (!checkAnswer(op, readWhole(a), readWhole(b), readWhole(answer))) {
          fail(at, a + " " + op + " " + b + " shows " + JSON.stringify(answer));
        }
      });
    });
  }

  return {
    GRID_H, mulberry32, parseNumberList, multiplicationFacts, divisionFacts,
    dealProblems, listLabel, divisionWidths, layout, maxColsFor, coverageText,
    checkAnswer, readWhole, pageSlices, sheetCode, verifySheets
  };
});
