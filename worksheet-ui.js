/*
 * Browser-side helpers shared by the times table and division worksheet pages:
 * small DOM builders, the sheet renderer, saved settings, and event wiring.
 * Attaches to window.WorksheetUI. Needs worksheet-core.js loaded first.
 */
(function () {
  "use strict";

  const C = window.WorksheetCore;
  const $ = (id) => document.getElementById(id);

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  /** Whole number from an input, or null if blank, not a number, or out of range. */
  function readInt(id, min, max) {
    const v = $(id).value.trim();
    if (!/^\d+$/.test(v)) return null;
    const n = +v;
    return n >= min && n <= max ? n : null;
  }

  /** Show a hint or error under a field and flag the related inputs. */
  function setMsg(msgEl, text, isError, inputs) {
    msgEl.textContent = text;
    msgEl.hidden = !text;
    msgEl.className = isError ? "err" : "hint";
    inputs.forEach((i) => i.setAttribute("aria-invalid", isError ? "true" : "false"));
  }

  /** Check the from/to pair. Returns { from, to } or null after showing the error. */
  function readRange() {
    const from = readInt("from", 0, 99), to = readInt("to", 0, 99);
    let err = "";
    if (from === null || to === null) err = "Use whole numbers from 0 to 99.";
    else if (from > to) err = "The first number should be less than or equal to the second.";
    setMsg($("range-msg"), err, !!err, [$("from"), $("to")]);
    return err ? null : { from, to };
  }

  /**
   * Check the grid size. Returns { cols, rows } or null after showing the error.
   * `why` is optional wording added when maxCols depends on the numbers chosen.
   */
  function readGrid(maxCols, why = "") {
    $("cols").max = maxCols;
    const cols = readInt("cols", 1, maxCols), rows = readInt("rows", 1, 60);
    let err = "";
    if (cols === null) err = "Problems per row: use 1 to " + maxCols + (why ? " " + why : "") + ".";
    else if (rows === null) err = "Rows: use 1 to 60.";
    setMsg($("grid-msg"), err, !!err, [$("cols"), $("rows")]);
    return err ? null : { cols, rows };
  }

  function buildHeader(title, meta) {
    const head = el("header", "ws-head");
    const fields = el("div", "ws-fields");
    for (const [cls, lab] of [["name", "Name"], ["date", "Date"]]) {
      const f = el("div", "ws-field " + cls);
      f.append(el("span", "", lab), el("span", "blank"));
      fields.append(f);
    }
    const row = el("div", "ws-title");
    row.append(el("h2", "", title), el("span", "ws-meta", meta));
    head.append(fields, row);
    return head;
  }

  /**
   * Draw the summary line and every page of the sheet.
   * opts: problems (already dealt), factCount, cols, rows, layout (from
   * WorksheetCore.layout), title, rangeText, buildProblem(problem) -> element,
   * and gridVars (CSS custom properties set on each grid).
   */
  function renderSheets(opts) {
    const { problems, factCount, cols, rows, layout: L, title, rangeText, buildProblem, gridVars = {} } = opts;
    const total = problems.length;
    const rowH = C.GRID_H / L.rowsPerPage;

    $("summary").replaceChildren(
      el("strong", "", total + " problems"), document.createTextNode(" from "),
      el("strong", "", factCount + (factCount === 1 ? " fact" : " facts")),
      document.createTextNode(". " + C.coverageText(total, factCount) + (L.pages > 1 ? " Fills " + L.pages + " pages." : ""))
    );

    const frag = document.createDocumentFragment();
    for (let p = 0; p < L.pages; p++) {
      const wrap = el("section", "sheet-wrap");
      if (L.pages > 1) wrap.append(el("p", "page-label", "Page " + (p + 1) + " of " + L.pages));
      const paper = el("div", "paper");
      const meta = rangeText + "  ·  " + total + " problems" + (L.pages > 1 ? "  ·  page " + (p + 1) + " of " + L.pages : "");
      paper.append(buildHeader(title, meta));

      const grid = el("div", "ws-grid");
      const startRow = p * L.rowsPerPage;
      const pageRows = Math.min(L.rowsPerPage, rows - startRow);
      grid.style.gridTemplateColumns = "repeat(" + cols + ", 1fr)";
      grid.style.gridTemplateRows = "repeat(" + pageRows + ", calc(var(--in) * " + (rowH / 72).toFixed(4) + "))";
      grid.style.fontSize = "calc(var(--in) * " + (L.font / 72).toFixed(4) + ")";
      for (const [k, v] of Object.entries(gridVars)) grid.style.setProperty(k, v);
      for (let i = startRow * cols; i < (startRow + pageRows) * cols; i++) grid.append(buildProblem(problems[i]));
      paper.append(grid);
      wrap.append(paper);
      frag.append(wrap);
    }
    $("preview").replaceChildren(frag);
  }

  /**
   * Run a worksheet page. render(seed) draws the sheet and returns true when
   * the settings were valid; only valid settings are saved. Text inputs listed
   * in `fields` are saved by id; getExtra/applyExtra handle anything else
   * (like radio buttons). Storage is optional and ignored if blocked.
   */
  function start({ storeKey, fields, render, getExtra = () => ({}), applyExtra = () => {} }) {
    const newSeed = () => (Math.random() * 2 ** 32) >>> 0;
    let seed = newSeed();

    function save() {
      try {
        const d = Object.assign({}, getExtra(), { seed });
        for (const k of fields) d[k] = $(k).value;
        localStorage.setItem(storeKey, JSON.stringify(d));
      } catch (e) { /* storage unavailable */ }
    }
    function restore() {
      try {
        const d = JSON.parse(localStorage.getItem(storeKey) || "null");
        if (!d) return;
        for (const k of fields) if (typeof d[k] === "string") $(k).value = d[k];
        applyExtra(d);
        if (Number.isInteger(d.seed)) seed = d.seed >>> 0;
      } catch (e) { /* storage unavailable */ }
    }
    function run() {
      const ok = render(seed);
      $("print").disabled = !ok;
      if (ok) save();
      else $("summary").textContent = "Fix the highlighted setting to update the sheet.";
    }

    let timer;
    $("settings").addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(run, 120); });
    $("settings").addEventListener("submit", (e) => e.preventDefault());
    $("shuffle").addEventListener("click", () => { seed = newSeed(); run(); });
    $("print").addEventListener("click", () => window.print());

    restore();
    run();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(run);
  }

  window.WorksheetUI = { $, el, setMsg, readRange, readGrid, renderSheets, start };
})();
