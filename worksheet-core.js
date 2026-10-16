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
   * Times table facts as [top, bottom]. With onTop, the table number is the
   * top factor: 4 x 1, 4 x 2, ...
   */
  function multiplicationFacts(tables, from, to, onTop) {
    const facts = [];
    for (const t of tables) for (let m = from; m <= to; m++) facts.push(onTop ? [t, m] : [m, t]);
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
   * about equally, and the same problem never appears twice in a row.
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

  return {
    GRID_H, mulberry32, parseNumberList, multiplicationFacts, divisionFacts,
    dealProblems, listLabel, divisionWidths, layout, maxColsFor, coverageText
  };
});
