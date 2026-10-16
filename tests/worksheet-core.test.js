// Tests for the shared worksheet logic. Run with: node --test tests/*.test.js
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const C = require("../worksheet-core.js");

const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

test("parseNumberList accepts single numbers, lists, and ranges", () => {
  assert.deepEqual(C.parseNumberList("4", 0), { numbers: [4] });
  assert.deepEqual(C.parseNumberList("6, 3 4", 0), { numbers: [3, 4, 6] });
  assert.deepEqual(C.parseNumberList("2 – 5", 0), { numbers: [2, 3, 4, 5] });
  assert.deepEqual(C.parseNumberList("5-2, 3", 0), { numbers: [2, 3, 4, 5] });
});

test("parseNumberList reports blanks, junk, and numbers under the minimum", () => {
  assert.deepEqual(C.parseNumberList("  ", 0), { error: "empty" });
  assert.deepEqual(C.parseNumberList("four", 0), { error: "format" });
  assert.deepEqual(C.parseNumberList("100", 0), { error: "format" });
  // Times tables allow 0; divisors start at 1.
  assert.deepEqual(C.parseNumberList("0", 0), { numbers: [0] });
  assert.deepEqual(C.parseNumberList("0", 1), { error: "below" });
  assert.deepEqual(C.parseNumberList("3-0", 1), { error: "below" });
});

test("multiplicationFacts puts the table number on top or bottom, with the product", () => {
  assert.deepEqual(C.multiplicationFacts([4], 1, 3, true), [[4, 1, 4], [4, 2, 8], [4, 3, 12]]);
  assert.deepEqual(C.multiplicationFacts([4], 1, 2, false), [[1, 4, 4], [2, 4, 8]]);
  assert.equal(C.multiplicationFacts([2, 3], 0, 12, true).length, 26);
});

test("divisionFacts makes whole-number facts with no remainders", () => {
  const facts = C.divisionFacts([3, 7], 0, 12);
  assert.equal(facts.length, 26);
  for (const [dividend, divisor, quotient] of facts) {
    assert.equal(dividend / divisor, quotient);
    assert.equal(dividend % divisor, 0);
  }
});

test("dealProblems spreads facts evenly with no back-to-back repeats", () => {
  const ids = [...Array(10).keys()];
  const out = C.dealProblems(ids, 45, C.mulberry32(123));
  assert.equal(out.length, 45);
  const counts = ids.map((id) => out.filter((x) => x === id).length);
  assert.ok(Math.max(...counts) - Math.min(...counts) <= 1);
  for (let i = 1; i < out.length; i++) assert.notEqual(out[i], out[i - 1]);
});

test("dealProblems is repeatable for a seed and safe with no facts", () => {
  const ids = [...Array(12).keys()];
  assert.deepEqual(C.dealProblems(ids, 30, C.mulberry32(9)), C.dealProblems(ids, 30, C.mulberry32(9)));
  assert.deepEqual(C.dealProblems([], 5, C.mulberry32(9)), []);
});

test("dealProblems deals facts directly, the same as dealing their indices", () => {
  // The pages used to deal indices and map them back to facts. Dealing the
  // facts themselves must give the very same sheet, so saved seeds keep their problems.
  const sets = [
    C.multiplicationFacts([3, 4, 6], 0, 12, true), C.multiplicationFacts([7], 1, 10, false),
    C.divisionFacts([2, 9], 0, 12), C.multiplicationFacts([5], 4, 4, true)
  ];
  for (const facts of sets) {
    for (const seed of [1, 42, 2026, 4294967295]) {
      const viaIndex = C.dealProblems(facts.map((_, i) => i), 100, C.mulberry32(seed)).map((i) => facts[i]);
      const direct = C.dealProblems(facts, 100, C.mulberry32(seed));
      assert.equal(direct.length, 100);
      direct.forEach((fact, k) => assert.equal(fact, viaIndex[k]));   // the same fact, answer included
    }
  }
});

test("listLabel reads naturally with and without a suffix", () => {
  assert.equal(C.listLabel([4], "s"), "4s");
  assert.equal(C.listLabel([2, 3, 4, 5, 9], "s"), "2s–5s and 9s");
  assert.equal(C.listLabel([3, 4, 6], "s"), "3s, 4s, and 6s");
  assert.equal(C.listLabel([4], ""), "4");
  assert.equal(C.listLabel([3, 6], ""), "3 and 6");
  assert.equal(C.listLabel([2, 3, 4, 5], ""), "2–5");
});

test("longDivisionSize grows with the biggest numbers", () => {
  const small = C.longDivisionSize(C.divisionFacts([4], 1, 10));
  const big = C.longDivisionSize(C.divisionFacts([12], 1, 99));
  // Two columns, divisor and dividend: the answer sits over the dividend.
  assert.equal(small.cols.length, 2);
  assert.ok(big.cols[0] > small.cols[0], "a 2-digit divisor needs a wider column");
  assert.ok(big.cols[1] > small.cols[1], "a 4-digit dividend needs a wider column");
  assert.ok(big.emPerCol > small.emPerCol);
  assert.equal(big.emPerRow, small.emPerRow);   // always two lines, whatever the numbers
  // The page pads with the CSS variables, so they must be the numbers the
  // columns were sized with: with the paddings taken out, each column holds
  // the same room per digit (2-digit dividends over 1-digit divisors here,
  // 4 over 2 in the big one), and --cols is the widths themselves.
  const room = (size, col, pads) => size.cols[col] - pads.reduce((sum, k) => sum + parseFloat(size.vars[k]), 0);
  for (const [size, dividendDigits, divisorDigits] of [[small, 2, 1], [big, 4, 2]]) {
    const perDigit = room(size, 0, ["--divisor-gap"]) / divisorDigits;
    assert.ok(Math.abs(room(size, 1, ["--bracket", "--dividend-pad"]) / dividendDigits - perDigit) < 1e-9);
    assert.equal(size.vars["--cols"], size.cols.map((w) => w.toFixed(3) + "em").join(" "));
  }
});

test("horizontalSize grows with the biggest numbers", () => {
  const small = C.horizontalSize(C.multiplicationFacts([4], 1, 9, true));     // 4 × 1 to 4 × 9
  const big = C.horizontalSize(C.multiplicationFacts([99], 0, 99, false));   // up to 99 × 99 = 9801
  // Three columns: "a × b", =, and the answer line.
  assert.equal(small.cols.length, 3);
  for (const i of [0, 2]) assert.ok(big.cols[i] > small.cols[i], `column ${i} should widen`);
  assert.equal(big.cols[1], small.cols[1]);   // the = sign never changes size
  assert.equal(big.emPerRow, small.emPerRow); // always one line
  // The answer line is longer than the longest answer, so there is room to write:
  // 2-digit answers here, 4-digit in the big one.
  const pad = parseFloat(small.vars["--sign-pad"]);
  const digitRoom = (small.cols[0] - small.cols[1]) / 2;   // "4 × 7" less its sign: two digits, one each
  assert.ok(small.cols[2] > 2 * digitRoom && big.cols[2] > 4 * digitRoom);
  // The = column is a digit-wide sign plus the padding the page gives it on each side.
  assert.ok(Math.abs(small.cols[1] - 2 * pad - digitRoom) < 1e-9);
  assert.equal(big.vars["--cols"], big.cols.map((w) => w.toFixed(3) + "em").join(" "));
  // Which side the table number is on doesn't change the widths.
  assert.deepEqual(C.horizontalSize(C.multiplicationFacts([7], 10, 12, false)).cols,
    C.horizontalSize(C.multiplicationFacts([7], 10, 12, true)).cols);
});

test("one-line times tables fit 5 per row by 20 rows on one page", () => {
  // 0 to 10 facts, the sheet this layout is mostly for: 100 problems, about 14 pt.
  const L = C.layout(5, 20, C.horizontalSize(C.multiplicationFacts(range(0, 10), 0, 10, true)));
  assert.equal(L.pages, 1);
  assert.ok(L.font >= 13.5, `font ${L.font}`);
  // Even 99 × 99 = 9801 fits 5 per row at 11 pt or more.
  const big = C.horizontalSize(C.multiplicationFacts([99], 0, 99, true));
  assert.equal(C.maxColsFor(big.emPerCol), 5);
  const bigL = C.layout(5, 20, big);
  assert.equal(bigL.pages, 1);
  assert.ok(bigL.font >= 11, `font ${bigL.font}`);
});

test("layout keeps default sheets on one page and splits tall ones", () => {
  assert.equal(C.layout(10, 10, C.STACKED_SIZE).pages, 1);
  const tall = C.layout(12, 40, C.STACKED_SIZE);
  assert.equal(tall.pages, 4);
  assert.ok(tall.rowsPerPage * tall.pages >= 40);

  const div = C.layout(4, 10, C.longDivisionSize(C.divisionFacts([4], 1, 10)));
  assert.equal(div.pages, 1);
  assert.ok(div.font >= 14);
});

test("both division layouts fit 10 rows of 10 on one page", () => {
  // Stacked problems are one fixed size, the same as the times table page's.
  assert.ok(C.maxColsFor(C.STACKED_SIZE.emPerCol) >= 10);
  const stacked = C.layout(10, 10, C.STACKED_SIZE);
  assert.equal(stacked.pages, 1);
  assert.ok(stacked.font >= 13, `stacked font ${stacked.font}`);
  // Long division, on the default sheet and with every divisor from 1 to 12
  // and answers from 0 to 12 (dividends up to 144).
  for (const facts of [C.divisionFacts([4], 1, 10), C.divisionFacts(range(1, 12), 0, 12)]) {
    const size = C.longDivisionSize(facts);
    assert.ok(C.maxColsFor(size.emPerCol) >= 10);
    const L = C.layout(10, 10, size);
    assert.equal(L.pages, 1);
    assert.ok(L.font >= 11, `long division font ${L.font}`);
  }
});

test("pageSlices puts every problem on exactly one page, in order", () => {
  const problems = [...Array(54).keys()];
  const pages = C.pageSlices(problems, 6, 4);
  assert.deepEqual(pages.map((p) => p.length), [24, 24, 6]);
  assert.deepEqual(pages.flat(), problems);
  assert.deepEqual(C.pageSlices(problems.slice(0, 48), 6, 4).map((p) => p.length), [24, 24]);
  assert.throws(() => C.pageSlices(problems, 0, 4), RangeError);
});

test("pageSlices makes as many pages as layout says", () => {
  const long = C.longDivisionSize(C.divisionFacts([2, 99], 0, 99));
  const horiz = C.horizontalSize(C.multiplicationFacts([2, 99], 0, 99, true));
  for (const size of [C.STACKED_SIZE, long, horiz]) {
    for (const [cols, rows] of [[10, 10], [12, 40], [15, 60], [1, 1], [7, 33]]) {
      const L = C.layout(cols, rows, size);
      const pages = C.pageSlices([...Array(cols * rows).keys()], cols, L.rowsPerPage);
      assert.equal(pages.length, L.pages, `${cols} x ${rows}`);
    }
  }
});

test("coverageText describes how often facts repeat", () => {
  assert.equal(C.coverageText(5, 10), "Uses 5 of 10 facts, each once.");
  assert.equal(C.coverageText(10, 10), "Each fact appears 1 time.");
  assert.equal(C.coverageText(40, 10), "Each fact appears 4 times.");
  assert.equal(C.coverageText(45, 10), "Each fact appears 4 or 5 times.");
});

test("maxColsFor keeps wide long division at 11 pt or more", () => {
  const narrow = C.longDivisionSize(C.divisionFacts([4], 0, 10));
  const wide = C.longDivisionSize(C.divisionFacts([2, 99], 0, 99));   // 4-digit dividends, like 99)9801
  const narrowCols = C.maxColsFor(narrow.emPerCol), wideCols = C.maxColsFor(wide.emPerCol);
  assert.ok(wideCols < narrowCols);
  // The division page caps rows at 10 problems; only numbers this big lower it, to 9.
  assert.equal(wideCols, 9);
  for (const [cols, size] of [[narrowCols, narrow], [wideCols, wide]]) {
    const font = C.layout(cols, 60, size).font;
    assert.ok(font >= 11, `font ${font} too small at ${cols} per row`);
  }
  assert.equal(C.maxColsFor(1000), 1);
});
