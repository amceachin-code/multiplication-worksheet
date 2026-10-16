# TODO

Goal: publish this page on GitHub Pages so families in my son's class can use it from a link.

## Current state

- `index.html` (times tables) and `division/index.html` share `worksheet.css`, `worksheet-core.js`, and `worksheet-ui.js`. No build step.
- Tested in headless Chrome: default settings (4s, ×1 to 10, 10×10) print on one letter page. 250 problems across 3 tables split onto 3 pages. Each fact appears equally often, with no back-to-back repeats.
- Fonts (Andika, Atkinson Hyperlegible) load from Google Fonts. Offline, the page falls back to system fonts.
- Live at https://www.andrew-mceachin.com/multiplication-worksheet/ (public repo `amceachin-code/multiplication-worksheet`, Pages from `main` root).
- Link previews use `og-image.png`, a 1200x630 light-mode screenshot of the page. Regenerate it if the layout changes.
- The page collects nothing. Settings live only in the visitor's localStorage. The one outside request is Google Fonts, which sees the visitor's IP like any font CDN.

## 1. Create the public repo

- [x] `git init` in this folder, default branch `main`.
- [x] Set commit author to my GitHub noreply address (`<id>+amceachin-code@users.noreply.github.com`) so my personal email stays out of a public history.
- [x] Commit `index.html`, `README.md`, and this file.
- [x] Create the repo and push: `gh repo create amceachin-code/multiplication-worksheet --public --source . --push --description "Printable times table worksheets"`

## 2. Turn on GitHub Pages

- [x] Serve from `main`, root folder: `gh api -X POST repos/amceachin-code/multiplication-worksheet/pages -f "source[branch]=main" -f "source[path]=/"`
- [x] Wait for the first build: `gh api repos/amceachin-code/multiplication-worksheet/pages/builds/latest`
- [ ] Open https://www.andrew-mceachin.com/multiplication-worksheet/ and confirm the sheet renders and Print works.
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

## Later, maybe

- [ ] Answer key page (optional checkbox, prints after the worksheet).
- [ ] MIT license file.
