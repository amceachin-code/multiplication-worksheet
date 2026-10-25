/*
 * The kit for drawing Color by Number pictures. Each picture is a drawing
 * file in this folder that uses these helpers; jack-o-lantern.js is the
 * first. Run a drawing file to write its picture:
 *
 *   node tools/color-by-number/jack-o-lantern.js
 *   node tools/color-by-number/jack-o-lantern.js --preview picture.svg   (also writes a colored preview)
 *
 * That writes color-by-number/pictures/<name>.js, the file the page loads.
 * Nothing to install, and the page never runs these files.
 *
 * How it works. A drawing gives its line work: the outlines of its shapes and
 * any dividing lines, each cut where it would be hidden (clip does that). The
 * kit splits the lines wherever they meet and joins them into a planar map,
 * and every closed area of that map is one space to color. The drawing's
 * colorAt says each space's color, from the shape it's in. A space's label
 * goes at the center of the biggest box of the label's shape that fits inside
 * it, clear of every line. Shared borders are smoothed once and reused by
 * both spaces beside them, so neighbors always meet exactly.
 *
 * Every picture is W by H, in hundredths of an inch: 7.5 in by 6.6 in, the
 * room the page leaves below the color key.
 *
 * To add a picture: copy jack-o-lantern.js, give it its own name and title,
 * draw its shapes, and run it. Then add a script tag for its file in
 * color-by-number/pictures/ to color-by-number/index.html. The tests check
 * every picture in that folder: that its spaces cover it exactly, that every
 * border is drawn, that every space holds a label, and that the file is what
 * its drawing makes. Colors must be ones the page's palette has
 * (color-by-number/color-by-number.js).
 *
 * A run stops with an error, writing nothing, if any space is too small for a
 * label of LABEL_PT points.
 */
"use strict";
const fs = require("fs");
const path = require("path");

const W = 750, H = 660;

// Every space must hold the widest label, "99 × 99", at LABEL_PT. LABEL_EM is
// that label's box in em: its width (four digits and the × sign with its
// padding, 3.37 em in Andika) plus air on each side, and one line plus air
// above and below. The page sets labels at LABEL_PT, and the tests hold every
// space to this box.
const LABEL_PT = 12;
const LABEL_EM = { w: 4.04, h: 1.6 };

// The picture's edge, as a closed line every drawing starts from.
const frame = [[0, 0], [W, 0], [W, H], [0, H], [0, 0]];
const inFrame = (p) => p[0] > 0 && p[0] < W && p[1] > 0 && p[1] < H;

// ---------- Geometry ----------

const STEP = 1.2;            // spacing of points along curves
const OVERSHOOT = 0.4;       // a cut line runs this far past the line it stops at
const SMOOTH = 0.15;         // how far a smoothed border may move

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** Points along a path of absolute M, L, C, and Z commands. */
function pathPoints(d) {
  const tok = d.match(/[MLCZ]|-?\d*\.?\d+/g);
  const pts = [];
  let i = 0, cmd = null, cur = null, start = null;
  const num = () => +tok[i++];
  while (i < tok.length) {
    if (/^[MLCZ]$/.test(tok[i])) cmd = tok[i++];
    if (cmd === "M") { cur = start = [num(), num()]; pts.push(cur); cmd = "L"; }
    else if (cmd === "L") { cur = [num(), num()]; pts.push(cur); }
    else if (cmd === "C") {
      const c1 = [num(), num()], c2 = [num(), num()], p = [num(), num()];
      const n = Math.max(4, Math.ceil((dist(cur, c1) + dist(c1, c2) + dist(c2, p)) / STEP));
      for (let k = 1; k < n; k++) {
        const t = k / n, u = 1 - t;
        pts.push([0, 1].map((j) => u * u * u * cur[j] + 3 * u * u * t * c1[j] + 3 * u * t * t * c2[j] + t * t * t * p[j]));
      }
      pts.push(p);
      cur = p;
    } else if (cmd === "Z") {
      if (cur[0] !== start[0] || cur[1] !== start[1]) pts.push([start[0], start[1]]);
      cur = start;
    } else throw new Error("unknown path command near " + tok[i]);
  }
  return pts;
}

/** A closed ellipse. */
function ellipse(cx, cy, rx, ry) {
  const n = Math.max(24, Math.ceil((2 * Math.PI * Math.sqrt((rx * rx + ry * ry) / 2)) / STEP));
  const pts = [];
  for (let k = 0; k < n; k++) pts.push([cx + rx * Math.cos((2 * Math.PI * k) / n), cy + ry * Math.sin((2 * Math.PI * k) / n)]);
  pts.push([pts[0][0], pts[0][1]]);
  return pts;
}

/** Even-odd test: is point p inside the closed ring? */
function inside(p, ring) {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

function bbox(pts) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return [x0, y0, x1, y1];
}

/** Where segments ab and cd cross, as [t along ab, u along cd], or null. */
function cross(a, b, c, d) {
  const rx = b[0] - a[0], ry = b[1] - a[1], sx = d[0] - c[0], sy = d[1] - c[1];
  const den = rx * sy - ry * sx;
  if (Math.abs(den) < 1e-12) return null;
  const qx = c[0] - a[0], qy = c[1] - a[1];
  const t = (qx * sy - qy * sx) / den, u = (qx * ry - qy * rx) / den;
  return t < -1e-12 || t > 1 + 1e-12 || u < -1e-12 || u > 1 + 1e-12 ? null : [t, u];
}

/** b moved OVERSHOOT further along the direction from a to b. */
function extend(a, b) {
  const L = dist(a, b);
  return L === 0 ? b : [b[0] + ((b[0] - a[0]) / L) * OVERSHOOT, b[1] + ((b[1] - a[1]) / L) * OVERSHOOT];
}

/**
 * The parts of a line where keep(point) is true. The line is split wherever
 * it crosses one of the `cutters` rings, so each part is all kept or all not.
 * A kept part that ends at a cut runs OVERSHOOT past it, so the line it stops
 * at meets it in a clean crossing; the stub past that line is pruned later.
 */
function clip(pts, cutters, keep) {
  const cutSegs = cutters.flatMap((ring) => ring.slice(1).map((q, k) => [ring[k], q, bbox([ring[k], q])]));
  const runs = [];
  let run = null;
  for (let k = 0; k + 1 < pts.length; k++) {
    const a = pts[k], b = pts[k + 1], bb = bbox([a, b]);
    const ts = [0, 1];
    for (const [c, d, cb] of cutSegs) {
      if (cb[0] > bb[2] || cb[2] < bb[0] || cb[1] > bb[3] || cb[3] < bb[1]) continue;
      const hit = cross(a, b, c, d);
      if (hit && hit[0] > 1e-9 && hit[0] < 1 - 1e-9) ts.push(hit[0]);
    }
    ts.sort((x, y) => x - y);
    for (let m = 0; m + 1 < ts.length; m++) {
      if (ts[m + 1] - ts[m] < 1e-12) continue;
      const p = m === 0 ? a : lerp(a, b, ts[m]);
      const q = m + 2 === ts.length ? b : lerp(a, b, ts[m + 1]);
      if (keep(lerp(p, q, 0.5))) {
        if (!run) run = { pts: [p], cutStart: !(k === 0 && m === 0) };   // any start but the line's own is a cut
        run.pts.push(q);
      } else if (run) { run.cutEnd = true; runs.push(run); run = null; }
    }
  }
  if (run) runs.push(run);
  return runs.map(({ pts: p, cutStart, cutEnd }) => {
    if (cutStart) p[0] = extend(p[1], p[0]);
    if (cutEnd) p[p.length - 1] = extend(p[p.length - 2], p[p.length - 1]);
    return p;
  });
}

/**
 * The planar map of a set of lines: every line split wherever it meets
 * another, as vertices and undirected edges, with dangling ends pruned (the
 * overshoot stubs, and any line that doesn't close a space).
 */
function planarMap(lines) {
  const segs = [];
  for (const pts of lines) {
    for (let k = 0; k + 1 < pts.length; k++) {
      const a = pts[k], b = pts[k + 1];
      if (a[0] === b[0] && a[1] === b[1]) continue;
      segs.push({ a, b, splits: [], x0: Math.min(a[0], b[0]), x1: Math.max(a[0], b[0]), y0: Math.min(a[1], b[1]), y1: Math.max(a[1], b[1]) });
    }
  }
  const same = (p, q) => p[0] === q[0] && p[1] === q[1];
  segs.sort((s, t) => s.x0 - t.x0);
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    for (let j = i + 1; j < segs.length && segs[j].x0 <= s.x1; j++) {
      const t = segs[j];
      if (t.y0 > s.y1 || t.y1 < s.y0) continue;
      if (same(s.a, t.a) || same(s.a, t.b) || same(s.b, t.a) || same(s.b, t.b)) continue;   // neighbors on one line
      const hit = cross(s.a, s.b, t.a, t.b);
      if (!hit) continue;
      const [ts, tu] = hit, E = 1e-9;
      // A crossing at an end point reuses that point, so both lines get the same vertex.
      const pt = ts < E ? s.a : ts > 1 - E ? s.b : tu < E ? t.a : tu > 1 - E ? t.b : lerp(s.a, s.b, ts);
      s.splits.push([ts, pt]);
      t.splits.push([tu, pt]);
    }
  }
  const ids = new Map(), verts = [], adj = new Map();
  const idOf = (p) => {
    const key = p[0] + "," + p[1];
    if (!ids.has(key)) { ids.set(key, verts.length); verts.push(p); adj.set(verts.length - 1, new Set()); }
    return ids.get(key);
  };
  for (const s of segs) {
    const pts = [[0, s.a], ...s.splits.sort((x, y) => x[0] - y[0]), [1, s.b]].map((x) => idOf(x[1]));
    for (let k = 0; k + 1 < pts.length; k++) {
      if (pts[k] === pts[k + 1]) continue;
      adj.get(pts[k]).add(pts[k + 1]);
      adj.get(pts[k + 1]).add(pts[k]);
    }
  }
  for (let pruned = true; pruned; ) {
    pruned = false;
    for (const [v, ns] of adj) {
      if (ns.size > 1) continue;
      for (const w of ns) adj.get(w).delete(v);
      adj.delete(v);
      pruned = true;
    }
  }
  return { verts, adj };
}

function signedArea(ring) {
  let a = 0;
  for (let k = 0; k + 1 < ring.length; k++) a += ring[k][0] * ring[k + 1][1] - ring[k + 1][0] * ring[k][1];
  return a / 2;
}

/**
 * The closed areas of a planar map, each a cycle of vertex ids, with the
 * holes it contains: the outer edges of anything drawn inside it that
 * touches nothing else, like the nose.
 */
function closedAreas({ verts, adj }) {
  const around = new Map();
  for (const [v, ns] of adj) {
    const [x, y] = verts[v];
    const angle = (w) => Math.atan2(verts[w][1] - y, verts[w][0] - x);
    around.set(v, [...ns].sort((a, b) => angle(a) - angle(b)));
  }
  // Walk each side of each edge, turning the same way at every vertex.
  const seen = new Set(), cycles = [];
  for (const [u, list] of around) {
    for (const v of list) {
      if (seen.has(u + ">" + v)) continue;
      const ids = [];
      for (let a = u, b = v; ; ) {
        seen.add(a + ">" + b);
        ids.push(a);
        const l = around.get(b);
        [a, b] = [b, l[(l.indexOf(a) - 1 + l.length) % l.length]];
        if (a === u && b === v) break;
      }
      const ring = ids.map((id) => verts[id]).concat([verts[ids[0]]]);
      cycles.push({ ids, ring, area: signedArea(ring) });
    }
  }
  // The frame's outside is the biggest cycle. Closed areas wind the other way;
  // the other cycles that wind its way are holes.
  const outer = cycles.reduce((best, c) => (Math.abs(c.area) > Math.abs(best.area) ? c : best));
  const areas = cycles.filter((c) => Math.sign(c.area) !== Math.sign(outer.area));
  for (const f of areas) f.holes = [];
  for (const h of cycles) {
    if (h === outer || Math.sign(h.area) !== Math.sign(outer.area)) continue;
    const own = new Set(h.ids);
    const outside = areas.filter((f) => !f.ids.some((id) => own.has(id)) && inside(h.ring[0], f.ring));
    if (!outside.length) throw new Error("a hole with no area around it");
    outside.reduce((best, f) => (Math.abs(f.area) < Math.abs(best.area) ? f : best)).holes.push(h);
  }
  return areas;
}

/** Distance from p to segment ab. */
function segDist(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy;
  const t = L2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2)) : 0;
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}

/** Douglas-Peucker smoothing that keeps both ends. */
function smooth(pts) {
  const keep = pts.map((_, k) => k === 0 || k === pts.length - 1);
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [i, j] = stack.pop();
    let far = 0, idx = -1;
    for (let k = i + 1; k < j; k++) {
      const d = segDist(pts[k], pts[i], pts[j]);
      if (d > far) { far = d; idx = k; }
    }
    if (far > SMOOTH) { keep[idx] = true; stack.push([i, idx], [idx, j]); }
  }
  return pts.filter((_, k) => keep[k]);
}

/**
 * Borders: runs of edges between junctions (vertices with other than two
 * neighbors), each smoothed once. Returns the borders and a lookup from each
 * directed edge to its border and direction.
 */
function borders({ verts, adj }) {
  const junction = (v) => adj.get(v).size !== 2;
  const byEdge = new Map(), list = [];
  function walk(u, v) {
    const ids = [u, v];
    for (let a = u, b = v; !junction(b) && b !== u; ) {
      [a, b] = [b, [...adj.get(b)].find((w) => w !== a)];
      ids.push(b);
    }
    const border = { ids, pts: smooth(ids.map((id) => verts[id])), sides: [] };
    list.push(border);
    for (let k = 0; k + 1 < ids.length; k++) {
      byEdge.set(ids[k] + ">" + ids[k + 1], { border, forward: true });
      byEdge.set(ids[k + 1] + ">" + ids[k], { border, forward: false });
    }
  }
  for (const [u, ns] of adj) if (junction(u)) for (const v of ns) if (!byEdge.has(u + ">" + v)) walk(u, v);
  for (const [u, ns] of adj) for (const v of ns) if (!byEdge.has(u + ">" + v)) walk(u, v);   // closed loops
  return { list, byEdge, junction };
}

/** A cycle rebuilt from smoothed borders, noting `owner` as a side of each border it uses. */
function smoothRing(ids, B, owner) {
  const start = Math.max(0, ids.findIndex((id) => B.junction(id)));
  const cyc = ids.slice(start).concat(ids.slice(0, start));
  const ring = [];
  for (let i = 0; i < cyc.length; ) {
    const { border, forward } = B.byEdge.get(cyc[i] + ">" + cyc[(i + 1) % cyc.length]);
    const pts = forward ? border.pts : border.pts.slice().reverse();
    ring.push(...(ring.length ? pts.slice(1) : pts));
    border.sides.push(owner);
    i += border.ids.length - 1;
  }
  return ring;
}

/**
 * The biggest box `aspect` times wider than tall around p that stays clear
 * of segment ab: its half-height, an L-infinity distance with x squeezed by
 * `aspect`. The distance is convex along the segment, so its minimum is at an
 * end or where one of |dx| and |dy| meets zero or the other.
 */
function boxRoom(p, a, b, aspect) {
  const ax = (a[0] - p[0]) / aspect, ay = a[1] - p[1];
  const dx = (b[0] - a[0]) / aspect, dy = b[1] - a[1];
  let best = Infinity;
  for (const t of [0, 1, -ax / dx, -ay / dy, (ay - ax) / (dx - dy), -(ax + ay) / (dx + dy)]) {
    if (t >= 0 && t <= 1) best = Math.min(best, Math.max(Math.abs(ax + t * dx), Math.abs(ay + t * dy)));
  }
  return best;
}

/**
 * Where a space's label goes: the center of the biggest box of the label's
 * shape that fits inside the space, clear of its borders and holes. A coarse
 * grid finds the spot, and two finer ones home in on it.
 */
function labelSpot(ring, holes) {
  const aspect = LABEL_EM.w / LABEL_EM.h;
  const segs = [ring, ...holes].flatMap((r) => r.slice(1).map((q, k) => [r[k], q]));
  const room = (p) => segs.reduce((s, [a, b]) => Math.min(s, boxRoom(p, a, b, aspect)), Infinity);
  const inSpace = (p) => inside(p, ring) && !holes.some((h) => inside(p, h));
  let best = null;
  const scan = (x0, y0, x1, y1, step) => {
    for (let y = y0; y <= y1; y += step) {
      for (let x = x0; x <= x1; x += step) {
        if (!inSpace([x, y])) continue;
        const s = room([x, y]);
        if (!best || s > best.s) best = { x, y, s };
      }
    }
  };
  const [x0, y0, x1, y1] = bbox(ring);
  scan(x0 + 1, y0 + 1, x1 - 1, y1 - 1, 4);
  if (!best) return null;
  for (const step of [1, 0.25]) scan(best.x - 4 * step, best.y - 4 * step, best.x + 4 * step, best.y + 4 * step, step);
  // The file keeps tenths, so measure the box again around the rounded center
  // and round it down a little, which keeps it inside the space.
  const x = Math.round(best.x * 10) / 10, y = Math.round(best.y * 10) / 10;
  const s = room([x, y]), down = (v) => Math.floor(v * 10 - 0.5) / 10;
  return { x, y, w: down(2 * s * aspect), h: down(2 * s) };
}

// ---------- Build, check, and write ----------

/**
 * Build a drawing's picture: its spaces (each with its ring, holes, color, and
 * label spot) and its lines, thick (outline) where the color changes and thin
 * (inner) between spaces of one color.
 */
function build(drawing) {
  const map = planarMap(drawing.lineWork());
  const B = borders(map);
  const spaces = closedAreas(map).map((area) => {
    const ring = smoothRing(area.ids, B, area);
    const holes = area.holes.map((h) => smoothRing(h.ids, B, area));
    const spot = labelSpot(ring, holes);
    if (!spot) throw new Error("a space too thin to hold any label, near " + bbox(ring).map(Math.round));
    area.color = drawing.colorAt([spot.x, spot.y]);
    return { color: area.color, ring, holes, ...spot };
  });
  // Reading order, top to bottom, by label.
  spaces.sort((a, b) => a.y - b.y || a.x - b.x);

  const em = (LABEL_PT * 100) / 72;
  const tooSmall = spaces.filter((s) => s.w < LABEL_EM.w * em || s.h < LABEL_EM.h * em);
  for (const s of tooSmall) console.error("Too small for a " + LABEL_PT + " pt label: the " + s.color + " space at " + Math.round(s.x) + ", " + Math.round(s.y));
  if (tooSmall.length) throw new Error(tooSmall.length + " spaces are too small");

  // Thick lines where the color changes, thin ones between spaces of one color.
  let outline = "", inner = "";
  for (const border of B.list) {
    const d = "M" + border.pts.map(xy).join(" ");
    const [a, b] = border.sides;
    if (border.sides.length === 2 && a.color === b.color) inner += d; else outline += d;
  }
  return { spaces, outline, inner };
}

const num = (n) => String(Math.round(n * 10) / 10);
const xy = (p) => num(p[0]) + " " + num(p[1]);
const ringPath = (ring) => "M" + ring.slice(0, -1).map(xy).join(" ") + "Z";

/** The text of the picture file, color-by-number/pictures/<name>.js. */
function fileText(drawing, { spaces, outline, inner }) {
  const regions = spaces.map((s, i) => "    " + JSON.stringify({
    id: "r" + (i + 1), color: s.color, x: +num(s.x), y: +num(s.y), w: +num(s.w), h: +num(s.h),
    d: [s.ring, ...s.holes].map(ringPath).join("")
  }));
  return `/*
 * "${drawing.title}", a picture for the Color by Number page. Made by
 * tools/color-by-number/${drawing.name}.js: change the drawing there and run
 * it again, rather than editing this file.
 *
 * Units are hundredths of an inch. Each region is one space to color: its
 * color, its outline (d, an SVG path), and its label spot, the center (x, y)
 * of the biggest label box that fits inside it, w by h. Every space holds the
 * widest label, "99 × 99", at labelPt points. outline holds the lines where
 * the color changes, drawn thick; inner, the lines between spaces of one
 * color, drawn thin.
 */
(function (root, picture) {
  if (typeof module === "object" && module.exports) module.exports = picture;
  else (root.ColorByNumberPictures = root.ColorByNumberPictures || []).push(picture);
})(this, {
  "name": ${JSON.stringify(drawing.name)},
  "title": ${JSON.stringify(drawing.title)},
  "width": ${W},
  "height": ${H},
  "labelPt": ${LABEL_PT},
  "labelEm": ${JSON.stringify(LABEL_EM)},
  "regions": [
${regions.join(",\n")}
  ],
  "outline": ${JSON.stringify(outline)},
  "inner": ${JSON.stringify(inner)}
});
`;
}

/** A colored SVG of the picture, with each label box outlined, for checking a change by eye. */
function preview({ spaces, outline, inner }, file) {
  const fills = Object.fromEntries(require("../../color-by-number/color-by-number.js").PALETTE.map((p) => [p.color, p.fill]));
  const em = (LABEL_PT * 100) / 72, bw = LABEL_EM.w * em, bh = LABEL_EM.h * em;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * 1.5}" height="${H * 1.5}">`;
  for (const s of spaces) svg += `<path d="${[s.ring, ...s.holes].map(ringPath).join("")}" fill="${fills[s.color]}" fill-rule="evenodd"/>`;
  svg += `<g fill="none" stroke="#111" stroke-linejoin="round" stroke-linecap="round"><path d="${inner}" stroke-width="1.6"/><path d="${outline}" stroke-width="2.8"/></g>`;
  for (const s of spaces) svg += `<rect x="${num(s.x - bw / 2)}" y="${num(s.y - bh / 2)}" width="${num(bw)}" height="${num(bh)}" fill="none" stroke="#000" stroke-dasharray="3 2"/>`;
  fs.writeFileSync(file, svg + "</svg>\n");
}

/**
 * Write a drawing's picture file, and a colored preview if the command line
 * says --preview and a file name. Drawing files call this when run as a script.
 */
function run(drawing) {
  const built = build(drawing);
  const out = path.join(__dirname, "..", "..", "color-by-number", "pictures", drawing.name + ".js");
  fs.writeFileSync(out, fileText(drawing, built));
  const counts = {};
  for (const s of built.spaces) counts[s.color] = (counts[s.color] || 0) + 1;
  console.log("Wrote " + path.relative(process.cwd(), out) + ": " + built.spaces.length + " spaces", counts);
  const at = process.argv.indexOf("--preview");
  if (at > 0 && process.argv[at + 1]) preview(built, process.argv[at + 1]);
}

module.exports = { W, H, LABEL_PT, LABEL_EM, frame, inFrame, pathPoints, ellipse, inside, clip, build, fileText, run };
