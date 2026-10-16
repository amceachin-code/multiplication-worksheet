// Tests for the shared worksheet logic. Run with: node --test tests/*.test.js
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const C = require("../worksheet-core.js");

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

test("divisionWidths grows with the biggest numbers", () => {
  const small = C.divisionWidths(C.divisionFacts([4], 1, 10));
  const big = C.divisionWidths(C.divisionFacts([12], 1, 99));
  assert.equal(small.cols.length, 5);
  assert.ok(big.total > small.total);
});

test("layout keeps default sheets on one page and splits tall ones", () => {
  const times = { emPerCol: 3.4, emPerRow: 4.6, maxFont: 26 };
  assert.equal(C.layout(10, 10, times).pages, 1);
  const tall = C.layout(12, 40, times);
  assert.equal(tall.pages, 4);
  assert.ok(tall.rowsPerPage * tall.pages >= 40);

  const divEm = C.divisionWidths(C.divisionFacts([4], 1, 10)).total + 1.2;
  const div = C.layout(4, 10, { emPerCol: divEm, emPerRow: 2.6, maxFont: 24 });
  assert.equal(div.pages, 1);
  assert.ok(div.font >= 14);
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
  const times = { emPerCol: 3.4, emPerRow: 4.6, maxFont: 26 };
  for (const [cols, rows] of [[10, 10], [12, 40], [15, 60], [1, 1], [7, 33]]) {
    const L = C.layout(cols, rows, times);
    const pages = C.pageSlices([...Array(cols * rows).keys()], cols, L.rowsPerPage);
    assert.equal(pages.length, L.pages, `${cols} x ${rows}`);
  }
});

test("coverageText describes how often facts repeat", () => {
  assert.equal(C.coverageText(5, 10), "Uses 5 of 10 facts, each once.");
  assert.equal(C.coverageText(10, 10), "Each fact appears 1 time.");
  assert.equal(C.coverageText(40, 10), "Each fact appears 4 times.");
  assert.equal(C.coverageText(45, 10), "Each fact appears 4 or 5 times.");
});

test("maxColsFor keeps wide division sheets at 11 pt or more", () => {
  const em = (divisors, to) => C.divisionWidths(C.divisionFacts(divisors, 0, to)).total + 1.2;
  const narrow = C.maxColsFor(em([4], 10));
  const wide = C.maxColsFor(em([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 12));
  assert.ok(wide < narrow);
  for (const [cols, e] of [[narrow, em([4], 10)], [wide, em([12], 12)]]) {
    const font = C.layout(cols, 60, { emPerCol: e, emPerRow: 2.6, maxFont: 24 }).font;
    assert.ok(font >= 11, `font ${font} too small at ${cols} per row`);
  }
  assert.equal(C.maxColsFor(1000), 1);
});
