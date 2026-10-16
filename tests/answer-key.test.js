// Tests for the answer key: every possible fact, the answer check, and the
// read-back check that guards the key. Run with: node --test tests/*.test.js
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const C = require("../worksheet-core.js");

const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

// Expected answers come from repeated addition and subtraction, not * or /,
// so a slip in the code's arithmetic can't hide behind the same slip here.
function slowProduct(a, b) {
  let sum = 0;
  for (let i = 0; i < b; i++) sum += a;
  return sum;
}
function slowDivide(dividend, divisor) {
  let q = 0, r = dividend;
  while (r >= divisor) { r -= divisor; q++; }
  return { q, r };
}

test("every times table fact, 0 to 99 by 0 to 99, has the right product", () => {
  for (const onTop of [true, false]) {
    const facts = C.multiplicationFacts(range(0, 99), 0, 99, onTop);
    const pairs = new Set(facts.map(([a, b]) => a + "x" + b));
    assert.equal(facts.length, 10000);
    assert.equal(pairs.size, 10000);   // every pair exactly once
    for (const [a, b, product] of facts) {
      if (product !== slowProduct(a, b)) assert.fail(`${a} × ${b} gave ${product}`);
    }
  }
});

test("every division fact, dividing by 1 to 99 with answers 0 to 99, divides evenly to its answer", () => {
  const facts = C.divisionFacts(range(1, 99), 0, 99);
  assert.equal(facts.length, 9900);
  for (const [dividend, divisor, quotient] of facts) {
    const { q, r } = slowDivide(dividend, divisor);
    if (r !== 0 || q !== quotient) assert.fail(`${dividend} ÷ ${divisor} gave ${quotient}`);
  }
});

test("checkAnswer accepts every right answer and rejects its neighbors", () => {
  const sets = [["×", C.multiplicationFacts(range(0, 99), 0, 99, true)], ["÷", C.divisionFacts(range(1, 99), 0, 99)]];
  for (const [op, facts] of sets) {
    for (const [a, b, answer] of facts) {
      if (!C.checkAnswer(op, a, b, answer)) assert.fail(`rejected ${a} ${op} ${b} = ${answer}`);
      if (C.checkAnswer(op, a, b, answer + 1)) assert.fail(`accepted ${a} ${op} ${b} = ${answer + 1}`);
      if (C.checkAnswer(op, a, b, answer - 1)) assert.fail(`accepted ${a} ${op} ${b} = ${answer - 1}`);
    }
  }
});

test("checkAnswer rejects division by 0, remainders, negatives, fractions, and non-numbers", () => {
  assert.equal(C.checkAnswer("÷", 0, 0, 0), false);
  assert.equal(C.checkAnswer("÷", 5, 0, 0), false);
  assert.equal(C.checkAnswer("÷", 7, 2, 3), false);
  assert.equal(C.checkAnswer("÷", 7, 2, 3.5), false);
  assert.equal(C.checkAnswer("×", -2, 3, -6), false);
  assert.equal(C.checkAnswer("×", 2.5, 2, 5), false);
  assert.equal(C.checkAnswer("×", NaN, 2, NaN), false);
  assert.equal(C.checkAnswer("×", 4, 7, Infinity), false);
  assert.equal(C.checkAnswer("×", "4", "7", "28"), false);
  assert.equal(C.checkAnswer("+", 2, 2, 4), false);
  assert.equal(C.checkAnswer("×", 2 ** 30, 2 ** 30, 2 ** 60), false);   // past exact whole numbers
});

test("readWhole reads plain digits only", () => {
  for (const [s, n] of [["0", 0], ["7", 7], ["28", 28], ["9801", 9801]]) assert.equal(C.readWhole(s), n);
  const odd = ["", " ", "00", "028", "-0", "-3", "+28", " 28", "28 ", "2 8", "28.0", "2.8e1", "0x1C", "٢٨", "28a", "Infinity", "NaN"];
  for (const s of odd) assert.ok(Number.isNaN(C.readWhole(s)), JSON.stringify(s));
  assert.ok(Number.isNaN(C.readWhole(28)));   // the check reads printed text, never numbers
});

// ---------- Read-back fixtures ----------
// Pages shaped like the browser's read-back: each problem's marked parts in
// DOM order, and its full text equal to those parts joined, as the page markup
// has it. Every check below runs on all three printed forms.

const KINDS = [
  { op: "×", format: "stacked" },
  { op: "×", format: "horizontal" },
  { op: "÷", format: "stacked" },
  { op: "÷", format: "long" }
];
const DIVISION_KINDS = KINDS.filter((k) => k.op === "÷");
const kindName = (k) => k.op + " " + k.format;

// One problem's parts in the order the pages build them: a stacked problem
// reads top, sign, bottom, answer; a one-line problem reads the same with an
// = sign before the answer; long division reads divisor, answer, dividend.
function cellFor({ op, format }, [a, b, answer], showAnswer) {
  const ans = showAnswer ? String(answer) : "";
  const parts = format === "long" ? [["b", String(b)], ["answer", ans], ["a", String(a)]]
    : format === "horizontal" ? [["a", String(a)], ["sign", op], ["b", String(b)], ["sign", "="], ["answer", ans]]
    : [["a", String(a)], ["sign", op], ["b", String(b)], ["answer", ans]];
  return { text: parts.map((p) => p[1]).join(""), parts };
}

function pagesFor(kind, problems, cols, rowsPerPage, showAnswer) {
  const code = C.sheetCode(kind.op, cols, rowsPerPage, problems);
  return C.pageSlices(problems, cols, rowsPerPage).map((slice) => ({
    grid: "cols " + cols + ", rows " + slice.length / cols,
    codes: [code],
    cells: slice.map((p) => cellFor(kind, p, showAnswer))
  }));
}

function deal(facts, total, seed) {
  return C.dealProblems(facts, total, C.mulberry32(seed));
}

// A real three-page sheet (rows of 4, 4, and 1), with 0 answers in the mix.
function baseSheet(kind) {
  const facts = kind.op === "×" ? C.multiplicationFacts([0, 3, 7, 12], 0, 12, true) : C.divisionFacts([1, 4, 9, 12], 0, 12);
  const problems = deal(facts, 54, 7);
  return {
    facts, problems,
    sheet: { op: kind.op, format: kind.format, cols: 6, rows: 9, rowsPerPage: 4 },
    sheetPages: pagesFor(kind, problems, 6, 4, false),
    keyPages: pagesFor(kind, problems, 6, 4, true)
  };
}

const keyCells = (s) => s.keyPages.flatMap((p) => p.cells);
// Parts are found by name, not position, since the forms order them differently.
const partOf = (cell, name) => cell.parts.find((p) => p[0] === name)[1];
const answerOf = (cell) => partOf(cell, "answer");

// Set one part's text and keep the problem's full text in step with it, so
// only the check under test can catch the change.
function setPart(cell, name, value) {
  cell.parts.find((p) => p[0] === name)[1] = value;
  cell.text = cell.parts.map((p) => p[1]).join("");
}

// Replace a problem's parts, again keeping its full text in step.
function setParts(cell, parts) {
  cell.parts = parts;
  cell.text = parts.map((p) => p[1]).join("");
}

// Apply one change to a freshly built good sheet, then require the check to
// reject it on purpose: a plain Error from the check itself, not a TypeError
// from code tripping over the bad input.
function rejects(kind, label, change) {
  const s = baseSheet(kind);
  change(s);
  assert.throws(() => C.verifySheets(s.sheet, s.sheetPages, s.keyPages), (e) => e.constructor === Error, kindName(kind) + ": " + label);
}

test("verifySheets passes the base sheets, with and without the key", () => {
  for (const kind of KINDS) {
    const s = baseSheet(kind);
    assert.equal(s.sheetPages.length, 3);
    assert.ok(keyCells(s).some((c) => answerOf(c) === "0"), "the base sheet should include 0 answers");
    C.verifySheets(s.sheet, s.sheetPages, s.keyPages);
    C.verifySheets(s.sheet, s.sheetPages, null);
  }
});

test("verifySheets passes real sheets across hundreds of settings and seeds", () => {
  const rand = C.mulberry32(2026);
  const pick = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
  for (let n = 0; n < 300; n++) {
    const kind = KINDS[n % KINDS.length], op = kind.op;
    const nums = [...new Set(Array.from({ length: pick(1, 4) }, () => pick(op === "÷" ? 1 : 0, 99)))];
    const from = pick(0, 99), to = pick(from, Math.min(99, from + pick(0, 15)));
    const facts = op === "×" ? C.multiplicationFacts(nums, from, to, rand() < 0.5) : C.divisionFacts(nums, from, to);
    const cols = pick(1, op === "×" ? 15 : 10), rows = pick(1, 60), rowsPerPage = pick(1, rows);
    const problems = deal(facts, cols * rows, pick(0, 2 ** 31));
    const sheetPages = pagesFor(kind, problems, cols, rowsPerPage, false);
    assert.match(sheetPages[0].codes[0], /^[34679CDFHJKMNPRTVW]{4}$/);
    C.verifySheets({ ...kind, cols, rows, rowsPerPage }, sheetPages, pagesFor(kind, problems, cols, rowsPerPage, true));
  }
});

test("verifySheets rejects any single answer that is off by one or blank", () => {
  for (const kind of KINDS) {
    for (let i = 0; i < 54; i++) {
      for (const delta of [1, -1]) {
        rejects(kind, `answer ${i} ${delta > 0 ? "+" : "-"}1`, (s) => {
          const cell = keyCells(s)[i];
          setPart(cell, "answer", String(Number(answerOf(cell)) + delta));
        });
      }
      rejects(kind, `answer ${i} blank`, (s) => setPart(keyCells(s)[i], "answer", ""));
    }
  }
});

test("verifySheets rejects answers that only look like numbers", () => {
  for (const kind of KINDS) {
    const cells = keyCells(baseSheet(kind));
    const big = cells.reduce((best, c, j) => (Number(answerOf(c)) > Number(answerOf(cells[best])) ? j : best), 0);
    const zero = cells.findIndex((c) => answerOf(c) === "0");
    const n = Number(answerOf(cells[big])), s = String(n);
    assert.ok(n >= 10);
    const odd = ["0" + s, s[0] + " " + s.slice(1), s + ".0", " " + s, s + " ", "+" + s,
      "0x" + n.toString(16), n.toExponential(), s.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d])];
    for (const v of odd) rejects(kind, "answer " + JSON.stringify(v), (t) => setPart(keyCells(t)[big], "answer", v));
    for (const v of ["", "-0", "00", " 0", "O"]) rejects(kind, "0 answer " + JSON.stringify(v), (t) => setPart(keyCells(t)[zero], "answer", v));
  }
});

test("verifySheets rejects a key that doesn't line up with its worksheet", () => {
  for (const kind of KINDS) {
    const { op } = kind;
    rejects(kind, "two neighbors swapped", (s) => {
      const cells = s.keyPages[0].cells;
      const j = cells.findIndex((c, k) => k + 1 < cells.length && c.text !== cells[k + 1].text);
      [cells[j], cells[j + 1]] = [cells[j + 1], cells[j]];
    });
    // For times tables the product is still right, so only the pairing can catch it.
    rejects(kind, "top and bottom swapped", (s) => {
      const cell = keyCells(s).find((c) => partOf(c, "a") !== partOf(c, "b"));
      const [a, b] = [partOf(cell, "a"), partOf(cell, "b")];
      setPart(cell, "a", b);
      setPart(cell, "b", a);
    });
    // Every answer is right for its own problem, but the problems are another shuffle's.
    rejects(kind, "key from another shuffle", (s) => { s.keyPages = pagesFor(kind, deal(s.facts, 54, 8), 6, 4, true); });
    rejects(kind, "key from another shuffle, code copied", (s) => {
      s.keyPages = pagesFor(kind, deal(s.facts, 54, 8), 6, 4, true);
      for (const p of s.keyPages) p.codes = s.sheetPages[0].codes.slice();
    });
    rejects(kind, "key pages swapped", (s) => { [s.keyPages[0], s.keyPages[1]] = [s.keyPages[1], s.keyPages[0]]; });
    rejects(kind, "key page missing", (s) => { s.keyPages.pop(); });
    rejects(kind, "extra key page", (s) => { s.keyPages.push(structuredClone(s.keyPages[2])); });
    rejects(kind, "problem missing from the key", (s) => { s.keyPages[1].cells.pop(); });
    rejects(kind, "problem missing from both", (s) => { s.sheetPages[2].cells.pop(); s.keyPages[2].cells.pop(); });
    rejects(kind, "same problems split 3 rows per page", (s) => { s.keyPages = pagesFor(kind, s.problems, 6, 3, true); });
    rejects(kind, "same problems in 9 columns", (s) => { s.keyPages = pagesFor(kind, s.problems, 9, 4, true); });
    rejects(kind, "key grid differs", (s) => { s.keyPages[0].grid += "; font-size: 12pt"; });
    rejects(kind, "key number changed, answer to match", (s) => {
      const cell = keyCells(s)[5];
      const a = Number(partOf(cell, "a")), b = Number(partOf(cell, "b"));
      if (op === "×") { setPart(cell, "a", String(a + 1)); setPart(cell, "answer", String((a + 1) * b)); }
      else { setPart(cell, "a", String(a + b)); setPart(cell, "answer", String((a + b) / b)); }
    });
    rejects(kind, "worksheet number changed", (s) => {
      const cell = s.sheetPages[0].cells[3];
      setPart(cell, "b", String(Number(partOf(cell, "b")) + 1));
    });
  }
});

test("verifySheets rejects answers on the worksheet, bad codes, stray text, and bad layouts", () => {
  const other = (code) => (code === "3333" ? "4444" : "3333");
  for (const kind of KINDS) {
    const { op, format } = kind;
    rejects(kind, "answer on the worksheet", (s) => setPart(s.sheetPages[0].cells[0], "answer", answerOf(keyCells(s)[0])));
    rejects(kind, "answer on the worksheet, key off", (s) => {
      setPart(s.sheetPages[1].cells[0], "answer", "5");
      s.keyPages = null;
    });
    rejects(kind, "key code differs", (s) => { s.keyPages[1].codes = [other(s.keyPages[1].codes[0])]; });
    rejects(kind, "worksheet code differs", (s) => { s.sheetPages[2].codes = [other(s.sheetPages[2].codes[0])]; });
    rejects(kind, "code missing", (s) => { s.keyPages[0].codes = []; });
    rejects(kind, "two codes", (s) => { s.sheetPages[0].codes.push(s.sheetPages[0].codes[0]); });
    rejects(kind, "stray text on the key", (s) => { keyCells(s)[2].text += "1"; });
    rejects(kind, "stray text on the worksheet", (s) => { s.sheetPages[0].cells[2].text += "1"; });
    rejects(kind, "parts out of order", (s) => { const cell = keyCells(s)[0]; setParts(cell, cell.parts.slice().reverse()); });
    // Stacked problems print exactly one sign, the right one, and one-line
    // problems print the sign and then =. Long division prints none, so a sign
    // there means the problem isn't what the check expects.
    rejects(kind, "extra sign", (s) => { const cell = keyCells(s)[0]; setParts(cell, [...cell.parts, ["sign", op]]); });
    if (format !== "long") {
      rejects(kind, "missing sign", (s) => { const cell = keyCells(s)[0]; setParts(cell, cell.parts.filter((p) => p[0] !== "sign")); });
      rejects(kind, "look-alike sign", (s) => setPart(keyCells(s)[0], "sign", op === "×" ? "x" : ":"));
      rejects(kind, "the other operation's sign", (s) => setPart(keyCells(s)[0], "sign", op === "×" ? "÷" : "×"));
    }
    if (format === "horizontal") {
      // The = sign is the second "sign" part; setPart only reaches the first.
      const setEquals = (cell, v) => { cell.parts.filter((p) => p[0] === "sign")[1][1] = v; setParts(cell, cell.parts); };
      rejects(kind, "equals sign changed", (s) => setEquals(keyCells(s)[0], "-"));
      rejects(kind, "equals sign missing", (s) => { const cell = keyCells(s)[0]; setParts(cell, cell.parts.filter((p) => p[1] !== "=")); });
      rejects(kind, "signs in the wrong order", (s) => { const cell = s.sheetPages[0].cells[0]; setPart(cell, "sign", "="); setEquals(cell, "×"); });
    }
    if (format === "long") {
      rejects(kind, "division sign added", (s) => { const cell = keyCells(s)[0]; setParts(cell, [cell.parts[0], ["sign", "÷"], ...cell.parts.slice(1)]); });
    }
    rejects(kind, "checked as the other operation", (s) => { s.sheet.op = op === "×" ? "÷" : "×"; });
    // Each operation's other format: times tables have stacked and one line,
    // division has stacked and long. (A format the operation lacks is covered below.)
    const otherFormat = format !== "stacked" ? "stacked" : op === "×" ? "horizontal" : "long";
    rejects(kind, "checked as the other format", (s) => { s.sheet.format = otherFormat; });
  }
});

test("verifySheets rejects unknown operations and formats with its own error", () => {
  const cases = [["÷", undefined], ["÷", "symbol"], ["÷", "constructor"], ["÷", "__proto__"], ["×", "long"], ["÷", "horizontal"],
    ["+", "stacked"], ["toString", "stacked"], ["__proto__", "stacked"], [undefined, undefined]];
  for (const [op, format] of cases) {
    const s = baseSheet(DIVISION_KINDS[0]);
    Object.assign(s.sheet, { op, format });
    assert.throws(() => C.verifySheets(s.sheet, s.sheetPages, s.keyPages),
      (e) => e.constructor === Error && /unknown operation or format/.test(e.message), `${op} ${format}`);
  }
});

test("verifySheets rejects wrong totals and empty input", () => {
  for (const kind of KINDS) {
    rejects(kind, "one more row than printed", (s) => { s.sheet.rows += 1; });
    rejects(kind, "one more column than printed", (s) => { s.sheet.cols += 1; });
    rejects(kind, "different rows per page", (s) => { s.sheet.rowsPerPage = 3; });
    rejects(kind, "zero rows", (s) => { s.sheet.rows = 0; });
    rejects(kind, "no pages at all", (s) => { s.sheetPages = []; s.keyPages = []; });
    rejects(kind, "no key pages", (s) => { s.keyPages = []; });
    rejects(kind, "key pages undefined", (s) => { s.keyPages = undefined; });
    rejects(kind, "empty problems", (s) => { s.keyPages[0].cells = s.keyPages[0].cells.map(() => ({})); });
    rejects(kind, "empty parts", (s) => { s.keyPages[0].cells[0] = { text: "", parts: [] }; });
  }
});

test("verifySheets rejects division by 0 even when every page agrees", () => {
  for (const kind of DIVISION_KINDS) {
    const s = baseSheet(kind);
    for (const pages of [s.sheetPages, s.keyPages]) setPart(pages[0].cells[0], "b", "0");
    setPart(s.keyPages[0].cells[0], "answer", "0");
    // Re-code every page from the changed numbers, so only the 0 can trip the check.
    const printed = s.sheetPages.flatMap((p) => p.cells.map((c) => [partOf(c, "a"), partOf(c, "b")]));
    const code = C.sheetCode("÷", 6, 4, printed);
    for (const p of [...s.sheetPages, ...s.keyPages]) p.codes = [code];
    assert.throws(() => C.verifySheets(s.sheet, s.sheetPages, s.keyPages), /divides by 0/, kindName(kind));
    assert.throws(() => C.verifySheets(s.sheet, s.sheetPages, null), /divides by 0/, kindName(kind));
  }
});

test("verifySheets names the page and problem it stopped at", () => {
  for (const kind of KINDS) {
    const s = baseSheet(kind);
    setPart(s.keyPages[1].cells[4], "answer", "9999");
    assert.throws(() => C.verifySheets(s.sheet, s.sheetPages, s.keyPages), /answer key page 2, problem 5/, kindName(kind));
  }
});

test("sheetCode is stable and changes with any number, the order, or the grid", () => {
  const { problems } = baseSheet(KINDS[0]);
  const code = C.sheetCode("×", 6, 4, problems);
  assert.match(code, /^[34679CDFHJKMNPRTVW]{4}$/);
  assert.equal(C.sheetCode("×", 6, 4, problems.map((p) => p.slice())), code);
  // The printed text gives the same code as the numbers it came from.
  assert.equal(C.sheetCode("×", 6, 4, problems.map(([a, b]) => [String(a), String(b)])), code);
  assert.notEqual(C.sheetCode("÷", 6, 4, problems), code);
  assert.notEqual(C.sheetCode("×", 9, 4, problems), code);
  assert.notEqual(C.sheetCode("×", 6, 3, problems), code);
  // With 104,976 codes two sheets can share one in principle; these cases don't.
  for (let i = 0; i < problems.length; i++) {
    const changed = problems.map((p) => p.slice());
    changed[i][1] += 1;
    assert.notEqual(C.sheetCode("×", 6, 4, changed), code, `problem ${i}`);
  }
  for (let i = 0; i + 1 < problems.length; i++) {
    if (problems[i][0] === problems[i + 1][0] && problems[i][1] === problems[i + 1][1]) continue;
    const swapped = problems.slice();
    [swapped[i], swapped[i + 1]] = [swapped[i + 1], swapped[i]];
    assert.notEqual(C.sheetCode("×", 6, 4, swapped), code, `swap ${i}`);
  }
});
