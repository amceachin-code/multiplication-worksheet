// Tests for the Color by Number page: every picture, how answers and
// problems are shared out, and the read-back check that guards each worksheet
// and answer key. Run with: node --test tests/*.test.js
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const C = require("../worksheet-core.js");
const K = require("../color-by-number/color-by-number.js");
const kit = require("../tools/color-by-number/kit.js");

// Every picture in the folder. The planning and read-back tests use the
// jack-o'-lantern; the picture tests run on each picture.
const PICTURE_DIR = path.join(__dirname, "..", "color-by-number", "pictures");
const PICTURE_FILES = fs.readdirSync(PICTURE_DIR).filter((f) => f.endsWith(".js")).sort();
const PICTURES = PICTURE_FILES.map((f) => require(path.join(PICTURE_DIR, f)));
const P = PICTURES.find((p) => p.name === "jack-o-lantern");

const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

// ---------- The pictures ----------
// Geometry here is written fresh, not shared with tools/color-by-number/kit.js,
// so a slip in the kit can't hide behind the same slip in its check.

/** The closed rings of an SVG path written as "Mx y x y ...Z", one per subpath. */
function rings(d) {
  return d.split("M").filter(Boolean).map((sub) => {
    assert.match(sub, /Z$/, "every ring closes");
    const n = sub.slice(0, -1).trim().split(/\s+/).map(Number);
    const pts = [];
    for (let i = 0; i < n.length; i += 2) pts.push([n[i], n[i + 1]]);
    return pts;
  });
}

/** The polylines of a path of open lines, "Mx y x y ...Mx y ...". */
function polylines(d) {
  return d.split("M").filter(Boolean).map((sub) => {
    const n = sub.trim().split(/\s+/).map(Number);
    const pts = [];
    for (let i = 0; i < n.length; i += 2) pts.push([n[i], n[i + 1]]);
    return pts;
  });
}

/** Segments of a closed ring, wrapping around. */
const ringSegs = (ring) => ring.map((p, i) => [p, ring[(i + 1) % ring.length]]);

function area(ring) {
  let a = 0;
  ring.forEach((p, i) => { const q = ring[(i + 1) % ring.length]; a += p[0] * q[1] - q[0] * p[1]; });
  return Math.abs(a) / 2;
}

function inRing(p, ring) {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

const inRegion = (p, [outer, ...holes]) => inRing(p, outer) && !holes.some((h) => inRing(p, h));

function crosses([a, b], [c, d]) {
  const o = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
  return o(a, b, c) * o(a, b, d) <= 0 && o(c, d, a) * o(c, d, b) <= 0;
}

function segDist(p, [a, b]) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy;
  const t = L2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2)) : 0;
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}

test("the page offers every picture in the folder, each named for its file", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "color-by-number", "index.html"), "utf8");
  const loaded = [...html.matchAll(/<script src="pictures\/([\w-]+\.js)"><\/script>/g)].map((m) => m[1]);
  assert.deepEqual(loaded.slice().sort(), PICTURE_FILES);
  PICTURES.forEach((p, i) => assert.equal(p.name + ".js", PICTURE_FILES[i]));
  assert.equal(new Set(PICTURES.map((p) => p.title)).size, PICTURES.length, "every title differs");
  assert.ok(P, "the jack-o'-lantern is one of them");
});

for (const picture of PICTURES) {
  const name = picture.name;
  const regions = picture.regions.map((r) => ({ ...r, rings: rings(r.d) }));

  test(`${name}: spaces have ids in order and palette colors`, () => {
    assert.deepEqual(picture.regions.map((r) => r.id), picture.regions.map((_, i) => "r" + (i + 1)));
    const palette = K.PALETTE.map((p) => p.color);
    for (const r of picture.regions) assert.ok(palette.includes(r.color), r.id + " " + r.color);
    assert.ok(K.pictureColors(picture).length >= 2);
    assert.deepEqual([picture.width, picture.height], [kit.W, kit.H], "every picture fits the room below the color key");
  });

  test(`${name}: the spaces cover the picture exactly, with no gaps and no overlaps`, () => {
    const total = regions.reduce((s, r) => s + area(r.rings[0]) - r.rings.slice(1).reduce((h, ring) => h + area(ring), 0), 0);
    assert.ok(Math.abs(total - picture.width * picture.height) < 1e-6 * picture.width * picture.height, `area ${total}`);
    // Points on a grid each lie in exactly one space, unless they sit on a border.
    const segs = regions.flatMap((r) => r.rings.flatMap(ringSegs));
    let checked = 0;
    for (let y = 2.5; y < picture.height; y += 5) {
      for (let x = 2.5; x < picture.width; x += 5) {
        const n = regions.filter((r) => inRegion([x, y], r.rings)).length;
        if (n !== 1) assert.ok(segs.some((s) => segDist([x, y], s) < 0.01), `${x}, ${y} is in ${n} spaces`);
        checked++;
      }
    }
    assert.equal(checked, (picture.width / 5) * (picture.height / 5));
  });

  test(`${name}: every border is drawn, thick where the color changes and thin between spaces of one color`, () => {
    const key = (p, q) => p.join(" ") + "|" + q.join(" ");
    const drawn = new Map();
    for (const [kind, d] of [["outline", picture.outline], ["inner", picture.inner]]) {
      for (const line of polylines(d)) {
        for (let i = 0; i + 1 < line.length; i++) {
          drawn.set(key(line[i], line[i + 1]), kind);
          drawn.set(key(line[i + 1], line[i]), kind);
        }
      }
    }
    // Each border segment of a space is a drawn segment, and it borders at most one other space.
    const sides = new Map();
    for (const r of regions) {
      for (const ring of r.rings) {
        for (const [p, q] of ringSegs(ring)) {
          const k = key(p, q);
          assert.ok(drawn.has(k), `${r.id}: border ${k} isn't drawn`);
          const both = [k, key(q, p)].sort()[0];
          sides.set(both, (sides.get(both) || []).concat(r));
        }
      }
    }
    for (const [k, rs] of sides) {
      assert.ok(rs.length === 1 || rs.length === 2, k);
      const onFrame = rs.length === 1;
      const want = onFrame || rs[0].color !== rs[1].color ? "outline" : "inner";
      assert.equal(drawn.get(k), want, `${k} between ${rs.map((r) => r.id + " " + r.color)}`);
      if (onFrame) {
        const [p, q] = k.split("|").map((s) => s.split(" ").map(Number));
        const edge = (v, lim) => v === 0 || v === lim;
        assert.ok((p[0] === q[0] && edge(p[0], picture.width)) || (p[1] === q[1] && edge(p[1], picture.height)), `${k} has one side but isn't on the frame`);
      }
    }
    // And nothing else is drawn.
    assert.equal(drawn.size, sides.size * 2);
  });

  test(`${name}: every space holds the widest label, 99 × 99, at labelPt, clear of its borders`, () => {
    const em = (picture.labelPt * 100) / 72;
    assert.ok(picture.labelPt >= 11, "the sheets' smallest size");
    // The label's box: "99 × 99" is 3.37 em wide in Andika (four digits and the
    // × sign at 0.586 em each, plus 0.22 em of air on each side of the sign).
    assert.ok(picture.labelEm.w >= 4 * 0.586 + 0.586 + 2 * 0.22 + 0.5 && picture.labelEm.h >= 1.2 + 0.3);
    for (const r of regions) {
      assert.ok(r.w >= picture.labelEm.w * em && r.h >= picture.labelEm.h * em, `${r.id}: ${r.w} x ${r.h}`);
      const [x0, y0, x1, y1] = [r.x - r.w / 2, r.y - r.h / 2, r.x + r.w / 2, r.y + r.h / 2];
      const corners = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
      for (const c of corners) assert.ok(inRegion(c, r.rings), `${r.id}: corner ${c} outside`);
      const edges = ringSegs(corners);
      for (const ring of r.rings) {
        for (const s of ringSegs(ring)) {
          assert.ok(!edges.some((e) => crosses(e, s)), `${r.id}: a border crosses the label box`);
          const [p] = s;
          assert.ok(!(p[0] > x0 && p[0] < x1 && p[1] > y0 && p[1] < y1), `${r.id}: a border inside the label box`);
        }
      }
      // The label's center is in its own space and no other.
      assert.deepEqual(regions.filter((o) => inRegion([r.x, r.y], o.rings)).map((o) => o.id), [r.id]);
    }
  });

  test(`${name}: the file is what its drawing makes`, () => {
    const drawing = require(`../tools/color-by-number/${name}.js`);
    const file = fs.readFileSync(path.join(PICTURE_DIR, name + ".js"), "utf8");
    assert.equal(kit.fileText(drawing, kit.build(drawing)), file, `run node tools/color-by-number/${name}.js`);
    assert.equal(drawing.title, picture.title);
    assert.equal(kit.LABEL_PT, picture.labelPt);
    assert.deepEqual(kit.LABEL_EM, picture.labelEm);
  });
}

// ---------- Planning a sheet ----------

const deal = (facts, seed) => K.planSheet(P, facts, C.mulberry32(seed));

/** Check one plan's promises; returns how often each fact appears. */
function checkPlan(plan, facts) {
  assert.equal(plan.problems.length, P.regions.length);
  assert.deepEqual(plan.key.map((row) => row.color), K.pictureColors(P).map((c) => c.color));
  const owner = new Map();
  for (const row of plan.key) {
    assert.ok(row.answers.length >= 1, row.color + " has answers");
    for (let i = 1; i < row.answers.length; i++) assert.ok(row.answers[i - 1] < row.answers[i], "sorted");
    for (const a of row.answers) {
      assert.ok(!owner.has(a), a + " in two colors");
      owner.set(a, row.color);
    }
  }
  const used = new Set();
  const counts = new Map();
  plan.problems.forEach((f, i) => {
    assert.ok(facts.includes(f), "each problem is one of the facts itself");
    assert.equal(owner.get(f[2]), P.regions[i].color, `space ${i + 1}: ${f}`);
    used.add(f[2]);
    counts.set(f, (counts.get(f) || 0) + 1);
  });
  assert.equal(used.size, owner.size, "the key lists only answers on the sheet");
  // Within a color, facts are dealt in rounds, so they appear evenly.
  for (const row of plan.key) {
    const n = [...counts].filter(([f]) => owner.get(f[2]) === row.color).map(([, c]) => c);
    const pool = facts.filter((f) => owner.get(f[2]) === row.color).length;
    if (n.length === pool) assert.ok(Math.max(...n) - Math.min(...n) <= 1, row.color + " deals evenly");
    else assert.ok(n.every((c) => c === 1), row.color + " uses each fact at most once when it has more than it needs");
  }
  return counts;
}

test("planSheet gives each answer one color and each space a problem whose answer is its color", () => {
  const rand = C.mulberry32(31);
  const pick = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
  let planned = 0;
  for (let n = 0; n < 300; n++) {
    const tables = [...new Set(Array.from({ length: pick(1, 4) }, () => pick(0, n % 3 ? 12 : 99)))];
    const from = pick(0, 12), to = from + pick(1, 15);
    const facts = C.multiplicationFacts(tables, from, to, rand() < 0.5);
    const plan = deal(facts, n);
    const answers = new Set(facts.map((f) => f[2])).size;
    if (answers < 5) { assert.deepEqual(plan, { error: "answers", answers, colors: 5 }); continue; }
    checkPlan(plan, facts);
    planned++;
  }
  assert.ok(planned > 200);
});

test("planSheet shares answers out so facts appear about equally often", () => {
  // 3s times 1 to 10: 10 facts for 38 spaces. Every fact is used; the one
  // brown space's answer appears once, and none appears more than 5 times.
  const threes = C.multiplicationFacts([3], 1, 10, true);
  for (let seed = 0; seed < 50; seed++) {
    const counts = checkPlan(deal(threes, seed), threes);
    assert.equal(counts.size, 10);
    assert.ok(Math.max(...counts.values()) <= 5);
  }
  // With more facts than spaces, no fact appears twice.
  const many = C.multiplicationFacts(range(2, 9), 1, 10, true);
  for (let seed = 0; seed < 50; seed++) {
    const counts = checkPlan(deal(many, seed), many);
    assert.equal(counts.size, 38);
  }
  // 3s, 4s, and 5s: 30 facts, each once or twice.
  const mid = C.multiplicationFacts([3, 4, 5], 1, 10, true);
  for (let seed = 0; seed < 50; seed++) assert.ok(Math.max(...checkPlan(deal(mid, seed), mid).values()) <= 2);
});

test("planSheet is repeatable for a seed and refuses facts with too few answers", () => {
  const facts = C.multiplicationFacts([4, 6], 0, 12, true);
  assert.deepEqual(deal(facts, 9), deal(facts, 9));
  assert.notDeepEqual(deal(facts, 9), deal(facts, 10));
  // Different seeds share the answers out differently, not just the problems.
  const keys = new Set(range(0, 19).map((seed) => JSON.stringify(deal(facts, seed).key)));
  assert.ok(keys.size > 15);
  assert.deepEqual(deal(C.multiplicationFacts([0], 1, 10, true), 1), { error: "answers", answers: 1, colors: 5 });
  assert.deepEqual(deal(C.multiplicationFacts([1], 1, 4, true), 1), { error: "answers", answers: 4, colors: 5 });
  const five = C.multiplicationFacts([1], 1, 5, true);
  checkPlan(deal(five, 1), five);
});

test("coverageText is true of every worksheet", () => {
  const f = [[3, 1, 3], [3, 2, 6], [3, 3, 9]];
  assert.equal(K.coverageText([[f[0], f[1], f[2]]], 3), "Each fact appears once.");
  assert.equal(K.coverageText([[f[0], f[1], f[2], f[0], f[1], f[2]]], 3), "Each fact appears 2 times.");
  assert.equal(K.coverageText([[f[0], f[1], f[2], f[0]]], 3), "Each fact appears 1 or 2 times.");
  assert.equal(K.coverageText([[f[0], f[1], f[2], f[0], f[0]], [f[0], f[1], f[2]]], 3), "Each fact appears 1 to 3 times.");
  assert.equal(K.coverageText([[f[0], f[1]]], 3), "Uses 2 of 3 facts, each once.");
  assert.equal(K.coverageText([[f[0], f[1]], [f[2]]], 3), "Uses 1 to 2 of 3 facts, each once.");
  assert.equal(K.coverageText([[f[0], f[1], f[1]]], 3), "Uses 2 of 3 facts, each 1 or 2 times.");
});

test("keyFont keeps every color key on its lines, at 12 pt unless the answers are long", () => {
  const threes = deal(C.multiplicationFacts([3], 1, 10, true), 1).key;
  assert.equal(K.keyFont(threes), 12);
  // The longest key there can be: 13 four-digit answers in purple's row.
  const longest = [{ color: "purple", answers: range(9000, 9012) }];
  const font = K.keyFont(longest);
  assert.ok(font < 12 && font > 11, `font ${font}`);
  // At that size the row fits the key's inside width (7.192 in), measured with
  // Andika's widths: 0.586 em per digit and per ", ", plus the 6.9 em before the answers.
  const em = 6.9 + 13 * 4 * 0.586 + 12 * 0.586;
  assert.ok(em * font <= 7.192 * 72, `${em * font} pt`);
  for (let seed = 0; seed < 30; seed++) {
    const key = deal(C.multiplicationFacts([95, 96, 97, 98, 99], 90, 99, true), seed).key;
    const widest = Math.max(...key.map((row) => 6.9 + (row.answers.join("").length + row.answers.length - 1) * 0.586));
    assert.ok(widest * K.keyFont(key) <= 7.192 * 72);
  }
});

test("sheetCode changes with any problem, the color key, or the picture", () => {
  const facts = C.multiplicationFacts([3, 4], 1, 10, true);
  const { problems, key } = deal(facts, 5);
  const code = K.sheetCode(P, problems, key);
  assert.match(code, /^[34679CDFHJKMNPRTVW]{4}$/);
  assert.equal(K.sheetCode(P, problems.map(([a, b]) => [String(a), String(b)]), key.map((r) => ({ ...r, answers: r.answers.map(String) }))), code);
  assert.notEqual(K.sheetCode({ ...P, name: "other" }, problems, key), code);
  for (let i = 0; i < problems.length; i++) {
    const changed = problems.slice();
    changed[i] = [problems[i][0], problems[i][1] + 1];
    assert.notEqual(K.sheetCode(P, changed, key), code, `problem ${i}`);
  }
  const moved = key.map((r) => ({ ...r, answers: r.answers.slice() }));
  moved[1].answers.push(moved[0].answers.pop());
  assert.notEqual(K.sheetCode(P, problems, moved), code);
});

// ---------- The read-back check ----------
// Pages shaped like the browser's read-back of a worksheet or key (see
// readPage in color-by-number/index.html).

const FILL = new Map(K.PALETTE.map((p) => [p.color, p.fill]));

function pageFor(printed, key, isKey) {
  return {
    codes: [K.sheetCode(P, printed, key)],
    key: key.map((row) => {
      const c = K.PALETTE.find((p) => p.color === row.color), answers = row.answers.map(String);
      return { color: c.color, name: c.name, swatch: c.fill, text: c.name + answers.join(", "), answers };
    }),
    lines: [P.outline, P.inner],
    spaces: P.regions.map((r) => ({ id: r.id, d: r.d, fill: isKey ? FILL.get(r.color) : K.BLANK })),
    labels: P.regions.map((r, i) => {
      const [a, b, product] = printed[i];
      const parts = isKey ? [["answer", String(product)]] : [["a", String(a)], ["sign", "×"], ["b", String(b)]];
      return { id: r.id, x: String(r.x), y: String(r.y), text: parts.map((p) => p[1]).join(""), parts };
    })
  };
}

// A real sheet: 3s to 6s times 0 to 12, Mixed, so there are 0 answers and flipped problems.
function baseSheet(seed = 7) {
  const facts = C.multiplicationFacts([3, 4, 5, 6], 0, 12, true);
  const rand = C.mulberry32(seed);
  const plan = K.planSheet(P, facts, rand);
  const printed = C.mixOrder(plan.problems, rand);
  return { facts, plan, printed, sheet: pageFor(printed, plan.key, false), key: pageFor(printed, plan.key, true) };
}

// Set a label part's text and keep the label's full text in step, so only
// the check under test can catch the change.
function setPart(label, name, value) {
  label.parts.find((p) => p[0] === name)[1] = value;
  label.text = label.parts.map((p) => p[1]).join("");
}
function setParts(label, parts) {
  label.parts = parts;
  label.text = parts.map((p) => p[1]).join("");
}
// The same for a color key row's answers.
function setAnswers(row, answers) {
  row.answers = answers;
  row.text = row.name + answers.join(", ");
}

// Apply one change to a freshly built good sheet and key, then require the
// check to reject it on purpose: a plain Error from the check, not a
// TypeError from code tripping over the bad input.
function rejects(label, change) {
  const s = baseSheet();
  change(s);
  assert.throws(() => K.verifySheet(P, s.sheet, s.key), (e) => e.constructor === Error, label);
}
// A space whose problem's answer isn't 0 or 1 (so changing a number changes its answer).
const plainSpace = (s, from = 0) => s.printed.findIndex((p, i) => i >= from && p[0] > 1 && p[1] > 1);

test("verifySheet passes real sheets and keys across hundreds of settings and seeds", () => {
  const rand = C.mulberry32(2026);
  const pick = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
  let checked = 0;
  for (let n = 0; n < 300; n++) {
    const tables = [...new Set(Array.from({ length: pick(1, 5) }, () => pick(0, n % 4 ? 12 : 99)))];
    const from = pick(0, 50), to = Math.min(99, from + pick(2, 20));
    const facts = C.multiplicationFacts(tables, from, to, rand() < 0.5);
    const plan = K.planSheet(P, facts, rand);
    if (plan.error) continue;
    const printed = rand() < 0.5 ? C.mixOrder(plan.problems, rand) : plan.problems;
    const sheet = pageFor(printed, plan.key, false);
    K.verifySheet(P, sheet, null);
    K.verifySheet(P, sheet, pageFor(printed, plan.key, true));
    checked++;
  }
  assert.ok(checked > 250);
  // The sheets the tests below change, before any change.
  for (const seed of [7, 8]) {
    const s = baseSheet(seed);
    K.verifySheet(P, s.sheet, s.key);
    K.verifySheet(P, s.sheet, null);
    assert.ok(s.key.labels.some((l) => l.parts[0][1] === "0"), "the base sheet includes 0 answers");
    assert.ok(s.printed.some((p, i) => p !== s.plan.problems[i]), "and flipped problems");
  }
});

test("verifySheet rejects any wrong, blank, or look-alike answer on the key", () => {
  for (let i = 0; i < P.regions.length; i++) {
    for (const delta of [1, -1]) {
      rejects(`answer ${i} ${delta}`, (s) => {
        const label = s.key.labels[i];
        setPart(label, "answer", String(Number(label.parts[0][1]) + delta));
      });
    }
    rejects(`answer ${i} blank`, (s) => setPart(s.key.labels[i], "answer", ""));
  }
  const s = baseSheet();
  const big = s.key.labels.findIndex((l) => Number(l.parts[0][1]) >= 10);
  const v = s.key.labels[big].parts[0][1];
  for (const odd of ["0" + v, v + ".0", " " + v, v + " ", "+" + v, v[0] + " " + v.slice(1), v.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d])]) {
    rejects("answer " + JSON.stringify(odd), (t) => setPart(t.key.labels[big], "answer", odd));
  }
  // Another space's answer, even one of the same color.
  rejects("answers swapped within a color", (t) => {
    const j = t.key.labels.findIndex((l, k) => k > big && P.regions[k].color === P.regions[big].color && l.parts[0][1] !== v);
    const w = t.key.labels[j].parts[0][1];
    setPart(t.key.labels[big], "answer", w);
    setPart(t.key.labels[j], "answer", v);
  });
});

test("verifySheet rejects a key that is painted wrong", () => {
  const colors = K.PALETTE.map((p) => p.fill);
  for (let i = 0; i < P.regions.length; i++) {
    const other = colors.find((f) => f !== FILL.get(P.regions[i].color));
    rejects(`space ${i} painted another color`, (s) => { s.key.spaces[i].fill = other; });
    rejects(`space ${i} left blank on the key`, (s) => { s.key.spaces[i].fill = K.BLANK; });
    rejects(`space ${i} colored on the worksheet`, (s) => { s.sheet.spaces[i].fill = FILL.get(P.regions[i].color); });
  }
  rejects("fill written another way", (s) => { s.key.spaces[0].fill = s.key.spaces[0].fill.toUpperCase(); });
  rejects("two spaces' shapes swapped", (s) => { [s.key.spaces[0].d, s.key.spaces[1].d] = [s.key.spaces[1].d, s.key.spaces[0].d]; });
  rejects("a space's shape changed on the worksheet", (s) => { s.sheet.spaces[3].d = s.sheet.spaces[3].d.replace(/\d/, "9"); });
  rejects("spaces out of order", (s) => { s.sheet.spaces.reverse(); });
  rejects("a space missing", (s) => { s.key.spaces.pop(); });
  rejects("an extra space", (s) => { s.sheet.spaces.push({ ...s.sheet.spaces[0] }); });
  rejects("lines missing", (s) => { s.sheet.lines = [P.outline]; });
  rejects("thick and thin lines swapped", (s) => { s.key.lines = [P.inner, P.outline]; });
});

test("verifySheet rejects a color key that sends any answer to the wrong color", () => {
  const { plan } = baseSheet();
  plan.key.forEach((row, k) => {
    row.answers.forEach((_, j) => {
      const to = (k + 1) % plan.key.length;
      // Move one answer to the next color, on both pages, with the codes to match.
      rejects(`answer ${row.answers[j]} moved from ${row.color}`, (s) => {
        for (const page of [s.sheet, s.key]) {
          const from = page.key[k], dest = page.key[to];
          const a = from.answers[j];
          setAnswers(from, from.answers.filter((x) => x !== a));
          setAnswers(dest, dest.answers.concat(a).sort((x, y) => x - y));
        }
        const key = s.sheet.key.map((r) => ({ color: r.color, answers: r.answers }));
        const code = K.sheetCode(P, s.printed, key);
        s.sheet.codes = [code];
        s.key.codes = [code];
      });
    });
  });
  rejects("an answer in two colors", (s) => {
    const a = s.sheet.key[0].answers[0];
    setAnswers(s.sheet.key[1], s.sheet.key[1].answers.concat(a).sort((x, y) => x - y));
  });
  rejects("an answer no space uses", (s) => { setAnswers(s.sheet.key[2], s.sheet.key[2].answers.concat("9999")); });
  rejects("an answer missing", (s) => { setAnswers(s.sheet.key[0], s.sheet.key[0].answers.slice(1)); });
  rejects("answers out of order", (s) => { setAnswers(s.sheet.key[3], s.sheet.key[3].answers.slice().reverse()); });
  rejects("a color with no answers", (s) => { setAnswers(s.sheet.key[4], []); });
  rejects("unreadable answer in the key", (s) => { setAnswers(s.sheet.key[0], ["0" + s.sheet.key[0].answers[0]].concat(s.sheet.key[0].answers.slice(1))); });
  rejects("text outside the answers", (s) => { s.sheet.key[1].text += "!"; });
  rejects("rows swapped", (s) => { [s.sheet.key[0], s.sheet.key[1]] = [s.sheet.key[1], s.sheet.key[0]]; });
  rejects("a row missing", (s) => { s.sheet.key.pop(); });
  rejects("an extra row", (s) => { s.sheet.key.push({ ...s.sheet.key[0] }); });
  rejects("wrong name", (s) => { s.sheet.key[0].name = "Red"; });
  rejects("wrong swatch", (s) => { s.sheet.key[2].swatch = FILL.get("yellow"); });
  rejects("the key's color key differs from the worksheet's", (s) => { setAnswers(s.key.key[0], s.key.key[0].answers.slice(1)); });
});

test("verifySheet rejects problems that don't match their space or their key", () => {
  rejects("a number changed on the worksheet", (s) => {
    const i = plainSpace(s);
    setPart(s.sheet.labels[i], "b", String(Number(s.sheet.labels[i].parts[2][1]) + 1));
  });
  rejects("a number changed, key answer to match", (s) => {
    const i = plainSpace(s), [a, b] = s.printed[i];
    setPart(s.sheet.labels[i], "a", String(a + 1));
    setPart(s.key.labels[i], "answer", String((a + 1) * b));
  });
  rejects("two problems of different colors swapped", (s) => {
    const i = plainSpace(s);
    const j = s.printed.findIndex((p, k) => P.regions[k].color !== P.regions[i].color && p[2] !== s.printed[i][2]);
    [s.sheet.labels[i].parts, s.sheet.labels[j].parts] = [s.sheet.labels[j].parts, s.sheet.labels[i].parts];
    for (const k of [i, j]) setParts(s.sheet.labels[k], s.sheet.labels[k].parts);
  });
  // Same answers and same colors, but the problems moved: only the code can tell.
  rejects("two problems of one color swapped", (s) => {
    const i = plainSpace(s);
    const j = s.printed.findIndex((p, k) => k !== i && P.regions[k].color === P.regions[i].color && (p[0] !== s.printed[i][0] || p[1] !== s.printed[i][1]));
    [s.sheet.labels[i].parts, s.sheet.labels[j].parts] = [s.sheet.labels[j].parts, s.sheet.labels[i].parts];
    for (const k of [i, j]) setParts(s.sheet.labels[k], s.sheet.labels[k].parts);
  });
  rejects("a problem flipped after the code was made", (s) => {
    const i = s.printed.findIndex(([a, b]) => a !== b);
    const [a, b] = s.printed[i];
    setPart(s.sheet.labels[i], "a", String(b));
    setPart(s.sheet.labels[i], "b", String(a));
  });
  rejects("key from another shuffle", (s) => {
    const other = baseSheet(8);
    s.key = other.key;
  });
  rejects("key from another shuffle, code copied", (s) => {
    const other = baseSheet(8);
    s.key = other.key;
    s.key.codes = s.sheet.codes.slice();
  });
  rejects("worksheet and key from another shuffle, code copied", (s) => {
    const other = baseSheet(8);
    s.sheet.labels = other.sheet.labels;
    s.key.labels = other.key.labels;
  });
});

test("verifySheet rejects answers on the worksheet, stray text, misplaced labels, and bad codes", () => {
  rejects("an answer on the worksheet", (s) => { setParts(s.sheet.labels[0], s.sheet.labels[0].parts.concat([["answer", String(s.printed[0][2])]])); });
  rejects("an answer on the worksheet, key off", (s) => {
    setParts(s.sheet.labels[5], s.sheet.labels[5].parts.concat([["answer", String(s.printed[5][2])]]));
    s.key = null;
  });
  rejects("a problem on the key", (s) => { setParts(s.key.labels[0], s.sheet.labels[0].parts.slice()); });
  rejects("stray text on the worksheet", (s) => { s.sheet.labels[2].text += "1"; });
  rejects("stray text on the key", (s) => { s.key.labels[2].text += "1"; });
  rejects("parts out of order", (s) => { setParts(s.sheet.labels[0], s.sheet.labels[0].parts.slice().reverse()); });
  for (const sign of ["x", "X", "*", "÷", "+", "", " × "]) rejects("sign " + JSON.stringify(sign), (s) => setPart(s.sheet.labels[1], "sign", sign));
  for (const n of ["", "03", "3.0", " 3", "٣"]) rejects("number " + JSON.stringify(n), (s) => setPart(s.sheet.labels[1], "a", n));
  rejects("a label out of place", (s) => { s.key.labels[4].x = String(Number(s.key.labels[4].x) + 1); });
  rejects("a label in another space's spot", (s) => { s.sheet.labels[4].y = String(P.regions[5].y); });
  rejects("labels out of order", (s) => { s.key.labels.reverse(); });
  rejects("a label missing", (s) => { s.sheet.labels.pop(); });
  rejects("an extra label", (s) => { s.key.labels.push({ ...s.key.labels[0] }); });
  rejects("an empty label", (s) => { s.key.labels[0] = {}; });
  const other = (code) => (code === "3333" ? "4444" : "3333");
  rejects("worksheet code differs", (s) => { s.sheet.codes = [other(s.sheet.codes[0])]; });
  rejects("key code differs", (s) => { s.key.codes = [other(s.key.codes[0])]; });
  rejects("code missing", (s) => { s.key.codes = []; });
  rejects("two codes", (s) => { s.sheet.codes.push(s.sheet.codes[0]); });
  rejects("empty worksheet", (s) => { s.sheet = { codes: s.sheet.codes, key: [], lines: [], spaces: [], labels: [] }; });
  rejects("empty key", (s) => { s.key = {}; });
  rejects("key undefined", (s) => { s.key = undefined; });
});

test("verifySheet names the space it stopped at", () => {
  const s = baseSheet();
  setPart(s.key.labels[11], "answer", "9999");
  assert.throws(() => K.verifySheet(P, s.sheet, s.key), /answer key, space 12/);
});
