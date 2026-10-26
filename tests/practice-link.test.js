// Tests for the division page's "Practice online" link into Times Tables Games,
// the companion practice app, in division on the sheet's divisors and answers.
// Run with: node --test tests/*.test.js
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const C = require("../worksheet-core.js");

const GAMES = "https://www.andrew-mceachin.com/times-tables-games/";
const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

test("divisionPracticeLink carries the sheet's divisors and answers", () => {
  const cases = [
    [[4], 1, 10, "#/?op=div&t=4&from=1&to=10"],
    [[3, 4, 6], 0, 12, "#/?op=div&t=3,4,6&from=0&to=12"],
    // Every divisor the app takes, and the widest range of answers.
    [range(1, 20), 0, 99, "#/?op=div&t=" + range(1, 20).join(",") + "&from=0&to=99"]
  ];
  for (const [divisors, from, to, hash] of cases) {
    const link = C.divisionPracticeLink(divisors, from, to);
    assert.equal(link, GAMES + hash);
    // The browser keeps the address as it is, so the app reads exactly this.
    assert.equal(new URL(link).href, link);
  }
});

test("divisionPracticeLink opens division alone for a divisor over 20, or none", () => {
  // The app takes divisors up to 20. With a bigger one it would drop the whole list.
  for (const divisors of [[21], [4, 25], [99], range(1, 99), []]) {
    assert.equal(C.divisionPracticeLink(divisors, 1, 10), GAMES + "#/?op=div", JSON.stringify(divisors));
  }
});

test("the division page's link starts as division alone and follows each drawn sheet", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "division", "index.html"), "utf8");
  const link = /<a id="practice-link" href="([^"]+)">Practice online<\/a>/.exec(html);
  assert.ok(link, "the division page has the Practice online link");
  // Before the script runs, or when no sheet can be drawn, it still opens division.
  assert.equal(link[1], C.divisionPracticeLink([]));
  assert.match(html, /\$\("practice-link"\)\.href = C\.divisionPracticeLink\(divisors, range\.from, range\.to\);/);
});
