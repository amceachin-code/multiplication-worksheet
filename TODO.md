# TODO

Goal: publish this page on GitHub Pages so families in my son's class can use it from a link.

## Current state

- `index.html` (times tables), `division/index.html`, and `halloween/index.html` (color by number) share `worksheet.css`, `worksheet-core.js`, and `worksheet-ui.js`. No build step. The Halloween picture comes from `tools/jack-o-lantern.js`, run by hand after changing the drawing.
- All three pages can print an answer key. With the Answer key switch on, key pages print after the worksheet pages, and a sheet code matches each key to its sheet. The Halloween key is the finished picture, colored in.
- Tested in headless Chrome: default settings (4s, ×1 to 10, 10×10) print on one letter page. 250 problems across 3 tables split onto 3 pages. Each fact appears equally often, with no back-to-back repeats.
- Node tests live in four files: `tests/worksheet-core.test.js`, `tests/answer-key.test.js`, `tests/color-by-number.test.js`, and `tests/privacy.test.js`.
- Fonts (Andika, Atkinson Hyperlegible) are served from `fonts/` on this site, with their licenses.
- Live at https://www.andrew-mceachin.com/multiplication-worksheet/ (public repo `amceachin-code/multiplication-worksheet`, Pages from `main` root).
- Link previews use `og-image.png`, a 1200x630 light-mode screenshot of the page. Regenerate it if the layout changes.
- The page collects nothing. Settings live only in the visitor's localStorage. The pages make no requests to other sites. The Privacy and data page (`privacy/`) says so for families and for district IT.

## 1. Create the public repo

- [x] `git init` in this folder, default branch `main`.
- [x] Set commit author to my GitHub noreply address (`<id>+amceachin-code@users.noreply.github.com`) so my personal email stays out of a public history.
- [x] Commit `index.html`, `README.md`, and this file.
- [x] Create the repo and push: `gh repo create amceachin-code/multiplication-worksheet --public --source . --push --description "Printable times table worksheets"`

## 2. Turn on GitHub Pages

- [x] Serve from `main`, root folder: `gh api -X POST repos/amceachin-code/multiplication-worksheet/pages -f "source[branch]=main" -f "source[path]=/"`
- [x] Wait for the first build: `gh api repos/amceachin-code/multiplication-worksheet/pages/builds/latest`
- [x] Open https://www.andrew-mceachin.com/multiplication-worksheet/ and confirm the sheet renders and Print works.
- [x] Add the live link to the top of `README.md` and to the repo's "Website" field.

## 3. Get it ready to share with other families

- [x] Add `<meta name="description">` and Open Graph tags (title, description, image) so the link shows a clean preview in group texts and class emails.
- [x] Add a simple favicon (inline SVG data URI is fine).
- [x] Add a one-line note on the page for parents: "Pick the times tables, then click Print worksheet."
- [ ] Test on an iPhone (Safari) and an Android phone: settings, Shuffle again, and Print.
- [x] Confirm the page collects nothing. It stores settings only in the visitor's own browser.

## 4. Division worksheets

- [x] Build `division/index.html` with horizontal `24 ÷ 4 = ___` problems and no remainders.
- [x] Node tests for the shared logic (`tests/worksheet-core.test.js`).
- [x] Review pass: shared CSS and JS for both pages.
- [x] Link the two pages to each other.
- [x] Add the tool to the Students & Guardians page in `academic-site`.
- [ ] Push both repos and check https://www.andrew-mceachin.com/multiplication-worksheet/division/ and https://www.andrew-mceachin.com/tools/

## 5. Answer key

- [x] Add an Answer key switch to both pages. It starts off on every visit.
- [x] Read-back check of every page before it shows. It fails closed: a failed key is left out, and a failed worksheet shows nothing.
- [x] Sheet code on every worksheet and key page, so a key can be matched to its sheet.
- [x] Node tests for every fact plus 425 single-change mutations (`tests/answer-key.test.js`).
- [x] Browser sweep of both pages, plus seven fault tests.
- [x] PDF read-back check: printed answers recomputed from `pdftotext` output.
- [x] Commit and push, then check both live pages with the key on.
- [x] Print a sheet and key on a real printer.
- [ ] Print from iPhone Safari and an Android phone.

## 6. Division layouts

- [x] Allow up to 10 problems per row, so 10 rows of 10 fit on one page.
- [x] Layout choice: Division symbol (stacked, like the times tables) or Long division. Saved between visits.
- [x] Answer key and its read-back check cover both layouts.
- [x] Node tests: 31 pass, with 640 single-change mutations across the three printed forms.
- [x] Browser sweep, PDF read-back, and fault tests for both layouts.
- [x] Review pass.
- [x] Regenerate `division/og-image.png`.
- [ ] Commit and push, then check the live division page in both layouts with the key on.
- [ ] Print both layouts on a real printer and from phones.

## 7. Times table layouts

- [x] Layout choice on the times table page: Stacked or One line (`4 × 7 = ___`). Saved between visits.
- [x] Picking a layout resets the grid: 10 × 10 stacked, 5 per row by 20 rows on one line (100 problems on a page).
- [x] One-line widths come from the biggest numbers, so the = signs and answer lines line up. Per row is capped so type stays at 11 pt or more.
- [x] Answer key and its read-back check cover the one-line form.
- [x] Node tests: 33 pass, with 857 single-change mutations across the four printed forms.
- [x] Browser checks, PDF read-back, and a planted wrong answer.
- [x] Review pass.
- [x] Regenerate `og-image.png`.
- [x] Commit and push, then check the live times table page in both layouts with the key on.
- [ ] Print a one-line sheet on a real printer and from phones.

## 8. Phone keyboard and Mixed

- [x] Full keyboard on phones for the list fields on both pages, so commas, dashes, and spaces can be typed. No autocorrect or auto caps.
- [x] Ranges take the word "to" ("2 to 5", "2to5") and an em dash. The hint reads "like 4, or 3 4 6, or 2 to 5".
- [x] Mixed choice for "Times-table number goes": exactly half the problems flip (squares don't count). Saved between visits.
- [x] The segmented control takes any number of choices.
- [x] Node tests: 35 pass, with the read-back sweep covering Mixed sheets.
- [x] Browser checks on both pages, at phone width and in the desktop panel.
- [x] Review pass.
- [x] Commit and push, then check typing commas, dashes, and "to" on a real phone. Checked on an iPhone.

## 9. Privacy page and local fonts

- [x] Privacy and data page (`privacy/index.html`): a short version for teachers and families, then a longer one for district admin and IT staff. Works in dark mode and at phone width.
- [x] A "Privacy and data" link at the bottom of the settings panel on both pages. Hidden when printing.
- [x] Serve the fonts from `fonts/` (latin subsets, with their OFL licenses) and drop Google Fonts, so the pages contact no other site.
- [x] Node tests: 40 pass. `tests/privacy.test.js` holds the site to the privacy page's promises.
- [x] Browser checks (every request stays on the site, font metrics unchanged, one-line sheet still fits) and a PDF check (fonts embedded, all key answers right).
- [x] Review pass and the user's review of the privacy page wording.
- [x] Commit and push, then check the live pages make no requests to other sites.

## 10. Several worksheets at once

- [x] "How many worksheets" field (1 to 40) on both pages. Each worksheet is shuffled on its own, with its own header and sheet code. Saved between visits.
- [x] Shuffle again stays. It reshuffles every worksheet.
- [x] With the answer key on: all worksheets, then their keys in the same order. Each worksheet and key is checked on its own.
- [x] Node tests: 41 pass (`sheetSeeds`).
- [x] Browser checks on both pages (one line, Mixed, long division, multi-page sheets, bad counts, reload), plus PDF page counts.
- [x] Commit and push, then check the live pages with 3 worksheets and the key on. Checked in the iPhone Safari print preview: one page per worksheet.
- [x] Fix the blank page between worksheets when the browser or printer adds its own margins.
- [x] Leave room for iPhone Safari's print footer, so the last row stays on the page.
- [ ] Print several worksheets on a real printer, from a computer and from a phone.

## 11. Halloween color by number

- [x] A jack-o'-lantern picture in 38 spaces, drawn by `tools/jack-o-lantern.js` (Node, nothing to install). Every space holds a 12 pt "99 × 99".
- [x] Page `halloween/index.html`: times tables, range, First, Second, or Mixed, title, number of worksheets, and the answer key. Saved between visits under `halloween-worksheets:v1`.
- [x] Color key: each answer goes with one color, by how many spaces each color has, and the key lists only the answers on the sheet.
- [x] Answer key: the finished picture, painted, with each answer in bold. Read-back check of each worksheet and key.
- [x] Node tests: 59 pass (18 new in `tests/color-by-number.test.js`, with 323 single-change mutations).
- [x] Browser checks (10 settings, every label inside its space and off the lines, phone width, dark mode, 40 worksheets) and PDF read-back (problems, answers, key colors, and the color key, 7 sheets).
- [x] Links from the other two pages, the privacy page, and a link preview image.
- [ ] Merge to `main`, then check the live page with the key on.
- [ ] Print a worksheet and key on a real printer, in color and in black and white, and from a phone.
- [ ] Maybe add it to the Students & Guardians tools page in `academic-site`.

## Later, maybe

- [x] Answer key page (optional checkbox, prints after the worksheet).
- [ ] MIT license file.
- [ ] Long division with remainders, or room to show the work.
- [ ] A row of tap buttons for 0 to 12 to pick times tables, instead of typing.
