# Progress

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
