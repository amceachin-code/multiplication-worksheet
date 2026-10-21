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

  /**
   * An element marked with data-part ("a", "b", "sign", or "answer"), so the
   * answer key check can read a printed problem back piece by piece.
   */
  function part(tag, cls, name, text) {
    const n = el(tag, cls, text);
    n.dataset.part = name;
    return n;
  }

  /**
   * One stacked problem, as both pages print it: the top number, then the sign
   * and the bottom number over a rule, then the answer spot (see .stacked in
   * worksheet.css). `problem` is [top, bottom, answer]. The answer prints only
   * on answer key pages: showAnswer must be exactly true, so a stray argument
   * can't leak answers onto a worksheet.
   */
  function stackedProblem(sign, [a, b, answer], showAnswer) {
    const p = el("div", "stacked");
    const n2 = el("div", "n2");
    n2.append(part("span", "", "sign", sign), part("span", "", "b", String(b)));
    p.append(part("div", "", "a", String(a)), n2, part("div", "ans", "answer", showAnswer === true ? String(answer) : ""));
    return p;
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

  const MAX_SHEETS = 40;

  /**
   * Check how many worksheets to print. Returns the count, or null after
   * showing the error.
   */
  function readSheetCount() {
    const n = readInt("sheets", 1, MAX_SHEETS);
    const err = n === null ? "Worksheets: use 1 to " + MAX_SHEETS + "." : "";
    setMsg($("sheets-msg"), err, !!err, [$("sheets")]);
    return n;
  }

  /** "1 worksheet", "3 worksheets". */
  const sheetsText = (n) => n + (n === 1 ? " worksheet" : " worksheets");

  /**
   * Sheet header. Worksheet pages get Name and Date lines. Answer key pages get
   * an "Answer key" label instead, so the two can't be mixed up. Both show the
   * sheet code, marked with data-code so the answer key check can confirm it.
   */
  function buildHeader(title, meta, code, isKey) {
    const head = el("header", "ws-head");
    const fields = el("div", "ws-fields");
    if (isKey) fields.append(el("span", "ws-key-label", "Answer key"));
    else for (const [cls, lab] of [["name", "Name"], ["date", "Date"]]) {
      const f = el("div", "ws-field " + cls);
      f.append(el("span", "", lab), el("span", "blank"));
      fields.append(f);
    }
    const sheet = el("span", "ws-code", "Sheet ");
    const value = el("span", "", code);
    value.dataset.code = "";
    sheet.append(value);
    sheet.setAttribute("translate", "no");
    fields.append(sheet);
    const row = el("div", "ws-title");
    row.append(el("h2", "", title), el("span", "ws-meta", meta));
    head.append(fields, row);
    return head;
  }

  /**
   * Read one built page back as plain text for WorksheetCore.verifySheets: its
   * grid styles, its sheet code, and each problem's text and marked parts. It
   * reads every child of the grid, so anything stray there fails the check.
   */
  function readPage(wrap) {
    const grid = wrap.querySelector(".ws-grid");
    return {
      grid: grid ? grid.style.cssText : "",
      codes: [...wrap.querySelectorAll("[data-code]")].map((n) => n.textContent),
      cells: grid ? [...grid.children].map((cell) => ({
        text: cell.textContent,
        parts: [...cell.querySelectorAll("[data-part]")].map((n) => [n.dataset.part, n.textContent])
      })) : []
    };
  }

  const SHEET_FAILED = "This sheet didn't pass its double-check, so it isn't shown. Try other settings, or click Shuffle again.";
  const KEY_FAILED = "The answer key didn't pass its double-check, so it was left out and printing is off. " +
    "Turn off Answer key to print the worksheet alone.";

  /**
   * Draw the summary line and every page of each worksheet, then the answer
   * key pages when the Answer key switch is on: all the worksheets first, then
   * their keys in the same order. Each worksheet has its own problems, its own
   * header on every page, and its own sheet code.
   * opts: op ("×" or "÷"), format (how buildProblem draws a problem,
   * "stacked", "horizontal", or "long", so the check knows what to expect),
   * worksheets (one list of dealt problems per worksheet, each problem
   * [a, b, answer]), factCount, cols, rows,
   * layout (from WorksheetCore.layout), title, rangeText,
   * buildProblem(problem, showAnswer) -> element, and gridVars (CSS custom
   * properties set on each grid).
   *
   * Pages are built off screen, read back, and checked with
   * WorksheetCore.verifySheets, one worksheet at a time, each key against its
   * own worksheet. Only pages that pass go on screen, all in one
   * step, so no print path (the button, Cmd+P, the browser menu) can reach a key
   * that wasn't confirmed, and a worksheet never sits beside another shuffle's key.
   * Returns "ok", or "failed" when a check failed (the summary says so).
   */
  function renderSheets(opts) {
    const { op, format, worksheets, factCount, cols, rows, layout: L, title, rangeText, buildProblem, gridVars = {} } = opts;
    const withKey = $("answer-key").checked;
    const count = worksheets.length;
    const total = cols * rows;
    const rowH = C.GRID_H / L.rowsPerPage;
    const sheet = { op, format, cols, rows, rowsPerPage: L.rowsPerPage };

    // One page of worksheet s. The worksheet and its key both come through
    // here with the same slice, code, and grid; only isKey differs.
    function buildPage(slice, s, p, code, isKey) {
      const wrap = el("section", "sheet-wrap");
      const where = L.pages > 1 ? "page " + (p + 1) + " of " + L.pages : "";
      // Preview-only label above the page (print hides it; CSS sets it in capitals).
      const which = count > 1 ? " " + (s + 1) + " of " + count : "";
      const label = withKey || count > 1 ? (isKey ? "Answer key" : "Worksheet") + which + (where && ", " + where) : where;
      if (label) wrap.append(el("p", "page-label", label));
      const paper = el("div", "paper");
      paper.append(buildHeader(title, rangeText + "  ·  " + total + " problems" + (where ? "  ·  " + where : ""), code, isKey));

      const grid = el("div", "ws-grid");
      grid.setAttribute("translate", "no");   // browser translation must not rewrite the numbers
      grid.style.gridTemplateColumns = "repeat(" + cols + ", 1fr)";
      grid.style.gridTemplateRows = "repeat(" + slice.length / cols + ", calc(var(--in) * " + (rowH / 72).toFixed(4) + "))";
      grid.style.fontSize = "calc(var(--in) * " + (L.font / 72).toFixed(4) + ")";
      for (const [k, v] of Object.entries(gridVars)) grid.style.setProperty(k, v);
      for (const problem of slice) grid.append(buildProblem(problem, isKey));
      paper.append(grid);
      wrap.append(paper);
      return wrap;
    }

    // The worksheets first. If any fails its check, show nothing at all.
    let built;
    try {
      if (count < 1) throw new Error("no worksheets");
      built = worksheets.map((problems, s) => {
        const slices = C.pageSlices(problems, cols, L.rowsPerPage);
        const code = C.sheetCode(op, cols, L.rowsPerPage, problems);
        const wraps = slices.map((slice, p) => buildPage(slice, s, p, code, false));
        const read = wraps.map(readPage);
        C.verifySheets(sheet, read, null);
        return { slices, code, wraps, read };
      });
    } catch (e) {
      console.error("Worksheet check failed:", e);
      $("preview").replaceChildren();
      $("summary").textContent = SHEET_FAILED;
      return "failed";
    }
    const sheetWraps = built.flatMap((b) => b.wraps);

    // Then the keys, from the same slices, each checked against its worksheet
    // as it was read back. If any fails, the worksheets still show and no key does.
    let keyWraps = [];
    if (withKey) {
      try {
        keyWraps = built.flatMap((b, s) => {
          const wraps = b.slices.map((slice, p) => buildPage(slice, s, p, b.code, true));
          C.verifySheets(sheet, b.read, wraps.map(readPage));
          return wraps;
        });
      } catch (e) {
        console.error("Answer key check failed:", e);
        $("preview").replaceChildren(...sheetWraps);
        $("summary").textContent = KEY_FAILED;
        return "failed";
      }
    }
    $("preview").replaceChildren(...sheetWraps, ...keyWraps);

    const pages = count * L.pages;
    const pagesText = withKey
      ? " Fills " + pages + (pages === 1 ? " page" : " pages") + ", plus " + pages + " for the answer " + (count === 1 ? "key." : "keys.")
      : pages > 1 ? " Fills " + pages + " pages." : "";
    const facts = [el("strong", "", total + " problems"), document.createTextNode(" from "),
      el("strong", "", factCount + (factCount === 1 ? " fact" : " facts"))];
    $("summary").replaceChildren(
      ...(count > 1 ? [el("strong", "", sheetsText(count)), document.createTextNode(", each with ")] : []),
      ...facts, document.createTextNode(". " + C.coverageText(total, factCount) + pagesText)
    );
    return "ok";
  }

  /**
   * Run a worksheet page. render(seed) draws the sheet and returns "ok",
   * "failed" (a check failed and the summary says so), or "invalid" (a setting
   * needs fixing). render reads how many worksheets to make with
   * readSheetCount. Valid settings are saved: text inputs listed in `fields` by
   * id, and anything else (like radio buttons) through getExtra/applyExtra.
   * The Answer key switch is never saved, so each visit starts with it off and
   * nobody prints a key by accident. Storage is optional and ignored if blocked.
   */
  function start({ storeKey, fields, render, getExtra = () => ({}), applyExtra = () => {} }) {
    const newSeed = () => (Math.random() * 2 ** 32) >>> 0;
    let seed = newSeed();
    let timer = null;   // pending redraw after typing, or null

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
      clearTimeout(timer);
      timer = null;
      const status = render(seed);
      $("print").disabled = status !== "ok";
      // While the count needs fixing, the disabled button keeps its last label.
      const count = readInt("sheets", 1, MAX_SHEETS), key = $("answer-key").checked;
      if (count === 1) $("print").textContent = key ? "Print worksheet and key" : "Print worksheet";
      else if (count) $("print").textContent = "Print " + sheetsText(count) + (key ? " and keys" : "");
      // A setting that needs fixing leaves the last good sheet up, dimmed, and
      // keeps it from printing (see .stale in worksheet.css).
      $("preview").classList.toggle("stale", status === "invalid");
      if (status === "invalid") $("summary").textContent = "Fix the highlighted setting to update the sheet.";
      else save();
    }

    $("settings").addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(run, 120); });
    $("settings").addEventListener("submit", (e) => e.preventDefault());
    $("shuffle").addEventListener("click", () => { seed = newSeed(); run(); });
    $("print").addEventListener("click", () => window.print());
    // Cmd+P or the browser menu can come inside the 120 ms wait after typing.
    // Draw first, so the printout always matches the settings on screen.
    window.addEventListener("beforeprint", () => { if (timer !== null) run(); });

    restore();
    run();
  }

  window.WorksheetUI = { $, el, part, stackedProblem, setMsg, readRange, readGrid, readSheetCount, renderSheets, start };
})();
