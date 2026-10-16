# Progress

## 2026-10-16 (division layouts)

### Changes

- The division page allows up to 10 problems per row (it was 6, or 5 for numbers like 144 ÷ 12). 10 rows of 10 now fit on one letter page in both layouts.
- Added a Layout choice to the Sheet section: "Division symbol" or "Long division". It is saved with the other settings. The default is Division symbol.
- Division symbol problems are now stacked like the times table sheet: the dividend, then "÷ divisor" over a rule, with the answer below. The one-line `24 ÷ 4 = ___` format is gone. At 10 × 10, stacked problems print at about 13.8 pt (the same as the times table page).
- Long division: the divisor, then a bracket and bar over the dividend, with the answer spot above the bar. The dividend sits next to the bracket, the bar fits the number, and the answer's last digit sits over the dividend's last digit. At 10 × 10 it prints at about 15.8 pt on the default sheet (÷ 4, answers 1 to 10), and 11.6 pt with every divisor from 1 to 12 and answers 0 to 12. With 4-digit dividends (like 9801 ÷ 99) it allows 9 per row, so type stays at 11 pt or more.
- The bracket is drawn in CSS (the right border of a half-ellipse), so it needs no font glyph and looks the same in any font. The bar and the bracket are drawn from the same top edge, because browsers round border widths to whole pixels and a first version left the bracket sitting slightly above the bar.
- Shared code: both pages now use one stacked-problem builder (`WorksheetUI.stackedProblem`), one set of stacked styles and the two-choice switch in `worksheet.css`, and one size (`WorksheetCore.STACKED_SIZE`). The times table page has no inline styles left. Before-and-after snapshots of 4 times table settings matched exactly: every number in the same spot.
- Answer key check: `verifySheets` now takes the problem format. Its table of printed forms covers `× stacked`, `÷ stacked`, and `÷ long`. Long division prints no sign text, so the check knows it by the order of its parts (divisor, answer, dividend). An unknown operation or format fails the check. `longDivisionSize` replaces `divisionWidths`. It returns the column widths and the CSS variables the page uses for long-division spacing, so the spacing lives in one place.
- Tests: 31 Node tests pass. The read-back tests run on all three printed forms: 640 single-change mutations (214 times tables, 214 division stacked, 212 long division), plus unknown operations and formats. New core tests check that both division layouts fit 10 rows of 10 on one page, that 4-digit long division caps at 9 per row at 11 pt or more, and that the spacing variables match the column widths.
- Browser checks (headless Chrome): a sweep of 234 runs and 35,760 answers across both layouts, 5 ranges of facts (1- to 4-digit dividends), 9 grid sizes (including both sides of each page break), and 3 fonts: Andika, Avenir Next, and Verdana Bold (a deliberately wide font). Every answer was right, stayed in its own cell, and lined up (stacked: under the ones digit; long division: over the dividend's last digit). The divisor sat level with the dividend, and no rule or bar moved between worksheet and key. Answers cleared the rule by at least 0.26 em (stacked) and the bar by at least 0.18 em (long division). The sweep refused 36 settings as designed (10 per row with 4-digit long division asks for 1 to 9).
- Print checks: four PDFs (a one-page and a three-page sheet in each layout). All 797 printed answers were recomputed correctly from `pdftotext` output, with worksheet pages first. With the page's own check switched off and a wrong answer planted, the PDF check caught it in both layouts.
- Fault tests with the page's check on: a wrong answer in either layout left the key out and turned off Print. An answer on the worksheet, or long-division settings with problems built stacked, hid the whole sheet.
- The layout choice survives a reload, the answer key still starts off, and the page works at phone width (375 px) and in dark mode.
- Review pass (the user picked all four findings): removed two unused classes from the stacked builder, flattened the table of printed forms to one lookup, moved long-division spacing to one source (CSS variables from `longDivisionSize`), and read the layout setting in one place. Snapshots of both pages matched before and after, and the sweep and PDF checks reran clean.
- Regenerated `division/og-image.png` (1200x630, light mode, default settings, scrollbars hidden), since the panel gained the Layout control and the problems are now stacked.

### Decisions

- Stacked ÷ instead of one line. One-line problems are too wide for 10 per row at a readable size (about 9 pt, with answer lines about 0.2 in long). The user picked stacked over two other options: keep one line and offer 10 × 10 only in long division, or one line in smaller type.
- The cap is exactly 10 per row, as asked. The default grid stays 4 per row by 10 rows.
- The sheet code ignores the layout on purpose. The same problems in the same spots have the same answers, so a key in either layout answers a worksheet in the other, and matching codes say so.
- Long division is another way to show the same facts (no remainders). There is no extra work space beyond the row height. Fewer rows make taller rows, which leaves more room.
- Dividends sit next to the bracket, with a bar that fits the number, rather than lined up on the right under a bar of fixed length (that left gaps like `3)    75`).
- Built without a separate written plan, at the user's choice.

### Files touched

- `division/index.html`, `division/og-image.png`, `index.html`, `worksheet.css`, `worksheet-core.js`, `worksheet-ui.js`, `tests/answer-key.test.js`, `tests/worksheet-core.test.js`, `README.md`, `TODO.md`, `PROGRESS.md`

### Next steps

- Commit and push after the user reviews (nothing is committed yet).
- Check the live division page in both layouts with the answer key on.
- Print both layouts on a real printer, and from iPhone Safari and an Android phone.
- Maybe mention the long-division option on the Students & Guardians tools page in `academic-site`.


## 2026-10-16 (answer key)

### Changes

- Added an Answer key switch to both pages. With it on, printing gives all worksheet pages, then matching key pages in the same order. Key pages replace the Name and Date line with an "Answer key" label; answers print in bold black (times tables under the rule, right-aligned; division on the blank line, which does not move).
- Every worksheet and key page shows a 4-character sheet code (digits and consonants, no look-alikes, no vowels) computed from the operation, grid width, page split, and every problem in order, so a key can be matched to its sheet.
- Accuracy design: answers are made once with their facts (times table facts are now `[top, bottom, product]`); one dealt list feeds both the worksheet and the key; before anything goes on screen, the page reads its own text back and `WorksheetCore.verifySheets` checks every problem (same numbers in the same spots, each answer right for the printed numbers, no answers on the worksheet, matching codes, same grid). It fails closed: a failed key is left out and Print turns off; a failed worksheet shows nothing. Unchecked pages never enter the page, so no print path can reach them.
- A `beforeprint` handler draws any pending change first, so Cmd+P right after typing prints the current settings. While a setting is invalid, the last good sheet is dimmed and hidden from print.
- New core functions: `checkAnswer`, `readWhole`, `pageSlices`, `sheetCode`, `verifySheets`.
- Tests: 29 Node tests pass. New `tests/answer-key.test.js` checks all 20,000 times table facts (0 to 99 by 0 to 99, both orders) by repeated addition and all 9,900 division facts by repeated subtraction, checks that `checkAnswer` rejects every answer plus or minus 1, passes 300 random real sheets, and makes 425 single-change mutations (wrong, blank, or look-alike answers; swapped, missing, or extra problems and pages; another shuffle's key; different splits or columns; bad codes; stray text; division by 0) that `verifySheets` must reject.
- Browser checks: a scripted sweep of 99 runs and 24,099 answers on both pages, at 1 to 5 pages, in Andika, Avenir Next, and Verdana Bold (a deliberately wide font). Every answer was right, stayed in its own cell, and cleared its rule or line (times table digits by at least 0.27 em, division digits by at least 0.11 em). Lines did not move between worksheet and key. Seven deliberate faults (wrong product, key reversed, key split differently, bad code, answer leaked onto the worksheet, stray text, a crash while building) each withheld the key or the whole sheet.
- Print checks: four PDFs from headless Chrome (one-page and three-page sheets on each page). All 760 printed answers recomputed correctly from `pdftotext` output, with worksheet pages first and key pages after. With the page's own check switched off and a wrong answer planted, the PDF check still caught it.
- Review pass: removed an unused class, built the page label once, trimmed repeated hint text, simplified a test helper, dealt facts directly instead of through indices (proven identical across 5,000 sheets, so saved seeds keep their problems), and dropped a redundant redraw after fonts load.
- Regenerated `og-image.png` and `division/og-image.png` (1200x630, light mode), since the panel gained the switch.

### Decisions

- The switch starts off on every visit and is not saved, so nobody prints a key by accident.
- Two-sided printing would put a one-page key on the back of the worksheet. Chose a hint under the switch ("Print one-sided, or the key lands on the back of the worksheet.") over a blank padding page.
- The sheet code shows on every worksheet, even with the key off, so a key printed later can be matched.
- Answers are bold black, not colored, so keys print clearly in black and white.
- Fail closed: a missing key is acceptable; a wrong one is not.
- The approved plan lives in `PROJECTPLAN.md` and local task tracking in `tasks/`. Both stay local and are gitignored.

### Files touched

- `worksheet-core.js`, `worksheet-ui.js`, `worksheet.css`, `index.html`, `division/index.html`, `tests/worksheet-core.test.js`, `tests/answer-key.test.js` (new), `.gitignore`, `og-image.png`, `division/og-image.png`, `README.md`, `TODO.md`, `PROGRESS.md`

### Next steps

- Commit and push after review, then check both live pages with the key on.
- Print a sheet and key on a real printer, and from iPhone Safari and an Android phone.
- Maybe mention answer keys on the Students & Guardians tools page in `academic-site`.


## 2026-10-15 (division)

### Changes

- Added a division worksheet at `division/`. Problems read `24 ÷ 4 = ___`.
- Review pass: both pages now share `worksheet.css`, `worksheet-core.js` (pure logic), and `worksheet-ui.js` (DOM). Each page keeps only its own problem layout, field wording, and sizes. The times table page went from 602 lines to 189.
- Node tests in `tests/worksheet-core.test.js` cover both pages' logic (11 tests, all passing).
- Fixed tiny type on wide division sheets. 2 to 12 with answers to 12 at 8 per row printed at about 7.7 pt. Problems per row is now capped by problem width so type stays at 11 pt or more: up to 6 per row for one-digit divisors, 5 for 2 to 12. Asking for more shows "use 1 to 5 with these numbers."
- Checked the refactor against a snapshot: for the same seeds, both pages render exactly the same problems, titles, summaries, font sizes, and page splits as before.
- Removed dead code: unused exports, an unused CSS selector, a duplicate `"use strict"`. Ignored `.claude/`.
- Linked the two pages to each other.
- Added `division/og-image.png` and refreshed `og-image.png` to show the new link.
- Added a Division Worksheets section to the Students & Guardians page in `academic-site` (`site/content/tools/_index.md`), plus a test.

### Decisions

- The division page lives in this repo as a subfolder, so it needs no new repo or Pages setup.
- Horizontal problems, not long-division brackets. That matches how fact drills usually show division.
- Facts are times-table facts run backward, so there are never remainders. Dividing by zero is refused.
- The column cap applies only to division. The times table page keeps its fixed limit of 15, which prints at about 10.6 pt at the maximum.
- Shared code over self-contained pages. Neither page is a single file anymore, so the root files must deploy with them (GitHub Pages serves the whole repo, so this is automatic).

### Files touched

- `division/index.html`, `division/og-image.png`, `worksheet.css`, `worksheet-core.js`, `worksheet-ui.js`, `tests/worksheet-core.test.js`, `index.html`, `og-image.png`, `.gitignore`, `README.md`, `TODO.md`, `PROGRESS.md`
- In `academic-site`: `site/content/tools/_index.md`, `tests/test_tools_page.py`

### Next steps

- Commit and push both repos, then check the live division page and the tools page.


## 2026-10-15

### Changes

- Added a meta description, Open Graph and Twitter tags, and an inline SVG favicon.
- Added a note for parents: "Pick the times tables, then click Print worksheet."
- Added `og-image.png` for link previews.
- Created the public repo `amceachin-code/multiplication-worksheet`. Commits use the GitHub noreply address to keep my personal email out of the history.
- Turned on GitHub Pages.
- Moved links to www.andrew-mceachin.com after the user site rename (commit 5e75b75).

### Decisions

- The OG image is rendered in light mode, so previews look the same everywhere.
- The page collects nothing. Settings live only in the visitor's localStorage. The one outside request is Google Fonts.

### Files touched

- `index.html`, `og-image.png`, `README.md`, `TODO.md`, `PROGRESS.md`

### Next steps

- Confirm Print works on the live site.
- Test on iPhone Safari and an Android phone.
- Optional answer key page.
- MIT license file.
