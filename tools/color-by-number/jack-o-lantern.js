#!/usr/bin/env node
/*
 * The jack-o'-lantern, the first Color by Number picture. After changing the
 * drawing, run it to write color-by-number/pictures/jack-o-lantern.js:
 *
 *   node tools/color-by-number/jack-o-lantern.js
 *
 * kit.js explains how a drawing becomes a picture. This one is made of five
 * pumpkin lobes, the carved face, the stem, two leaves, the moon, hills,
 * ground, and rays behind the pumpkin, as if it glows: 38 spaces.
 */
"use strict";
const { frame, inFrame, pathPoints, ellipse, inside, clip, run } = require("./kit.js");

// Five lobes, front to back: the middle one, then the two beside it, then the
// two at the sides. A lobe's edge shows only where no lobe in front covers it.
const lobes = [
  { ring: ellipse(375, 390, 98, 220), depth: 0 },
  { ring: ellipse(293, 395, 122, 205), depth: 1 },
  { ring: ellipse(457, 395, 122, 205), depth: 1 },
  { ring: ellipse(186, 402, 104, 185), depth: 2 },
  { ring: ellipse(564, 402, 104, 185), depth: 2 }
];
const pumpkin = lobes.map((l) => l.ring);

// The carved face. The eyes and the mouth reach the edges of the side lobes,
// which splits those lobes into more spaces.
const leftEye = pathPoints("M 266 258 L 340 362 L 168 362 Z");
const rightEye = pathPoints("M 484 258 L 582 362 L 410 362 Z");
const nose = pathPoints("M 375 374 L 445 442 L 305 442 Z");

/** A wide grin: two teeth hanging from the top lip and one standing on the bottom lip. */
function grin() {
  const half = 207, top = 450;
  const bow = (x) => 1 - ((x - 375) / half) ** 2;
  const upper = (x) => top + 26 * bow(x), lower = (x) => top + 104 * bow(x);
  const pts = [[375 - half, top]];
  let x = 375 - half + 2;
  for (const [a, b] of [[236, 266], [484, 514]]) {
    for (; x < a; x += 2) pts.push([x, upper(x)]);
    pts.push([a, upper(a)], [a, upper(a) + 28], [b, upper(b) + 28], [b, upper(b)]);
    x = b + 2;
  }
  for (; x < 375 + half; x += 2) pts.push([x, upper(x)]);
  pts.push([375 + half, top]);
  for (x = 375 + half - 2; x > 393; x -= 2) pts.push([x, lower(x)]);
  pts.push([393, lower(393)], [393, lower(393) - 30], [357, lower(357) - 30], [357, lower(357)]);
  for (x = 355; x > 375 - half; x -= 2) pts.push([x, lower(x)]);
  pts.push([375 - half, top]);
  return pts;
}
const face = [leftEye, rightEye, nose, grin()];

const stem = pathPoints("M 334 200 C 342 160 348 110 352 72 C 372 64 392 62 414 66 C 410 110 410 160 418 200 C 395 214 358 214 334 200 Z");
const leaves = [
  pathPoints("M 414 122 C 452 74 522 54 608 76 C 574 126 502 160 416 160 Z"),
  pathPoints("M 340 162 C 300 118 252 110 198 130 C 230 186 292 210 346 206 Z")
];
const moon = ellipse(112, 100, 68, 68);

// Hills behind the pumpkin, and the ground in front of them. `hills` and
// `ground` close each top line around the bottom of the picture, so inside()
// can tell whether a point is below it.
const hill = pathPoints("M -10 476 C 150 436 600 436 760 470");
const hills = hill.concat([[760, 680], [-10, 680], hill[0]]);
const groundTop = pathPoints("M -10 556 C 120 540 230 572 375 560 C 520 548 640 572 760 552");
const ground = groundTop.concat([[760, 680], [-10, 680], groundTop[0]]);
const groundDividers = [
  "M 110 530 C 118 580 104 620 112 680",
  "M 268 560 C 262 600 274 640 266 680",
  "M 482 560 C 488 600 476 640 484 680",
  "M 640 530 C 632 580 646 620 638 680"
].map(pathPoints);

// The sky: rays from behind the pumpkin, as if it glows, every 18 degrees
// from due left, over the top, to due right.
const rays = [];
for (let deg = -180; deg <= 0; deg += 18) {
  const a = (deg * Math.PI) / 180;
  rays.push([[375, 390], [375 + 1400 * Math.cos(a), 390 + 1400 * Math.sin(a)]]);
}

const inAny = (p, rings) => rings.some((r) => inside(p, r));

/** The color of whatever is in front at point p. */
function colorAt(p) {
  if (inside(p, moon)) return "yellow";
  if (inside(p, stem)) return "brown";
  if (inAny(p, leaves)) return "green";
  if (inAny(p, face)) return "yellow";
  if (inAny(p, pumpkin)) return "orange";
  if (inside(p, hills)) return "green";
  return "purple";
}

function lineWork() {
  const lines = [frame, moon, stem, ...face];
  // The stem is in front of the leaves, and both are in front of the pumpkin.
  for (const leaf of leaves) lines.push(...clip(leaf, [stem], (p) => !inside(p, stem)));
  for (const lobe of lobes) {
    const front = lobes.filter((o) => o.depth < lobe.depth).map((o) => o.ring);
    lines.push(...clip(lobe.ring, [...front, ...face, stem, ...leaves],
      (p) => !inAny(p, front) && !inAny(p, face) && !inside(p, stem) && !inAny(p, leaves)));
  }
  const open = (p) => inFrame(p) && !inAny(p, pumpkin);
  lines.push(...clip(hill, [frame, ...pumpkin, ground], (p) => open(p) && !inside(p, ground)));
  lines.push(...clip(groundTop, [frame, ...pumpkin], open));
  for (const d of groundDividers) lines.push(...clip(d, [frame, ...pumpkin, ground], (p) => open(p) && inside(p, ground)));
  const sky = (p) => open(p) && !inside(p, moon) && !inside(p, stem) && !inAny(p, leaves) && !inside(p, hills);
  for (const r of rays) lines.push(...clip(r, [frame, moon, ...pumpkin, stem, ...leaves, hills], sky));
  return lines;
}

const drawing = { name: "jack-o-lantern", title: "Jack-o'-lantern", lineWork, colorAt };
if (require.main === module) run(drawing);
module.exports = drawing;
