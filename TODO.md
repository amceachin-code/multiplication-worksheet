# TODO

Goal: publish this page on GitHub Pages so families in my son's class can use it from a link.

## Current state

- `index.html` is a single self-contained page (HTML, CSS, JS in one file). No build step.
- Tested in headless Chrome: default settings (4s, ×1 to 10, 10×10) print on one letter page. 250 problems across 3 tables split onto 3 pages. Each fact appears equally often, with no back-to-back repeats.
- Fonts (Andika, Atkinson Hyperlegible) load from Google Fonts. Offline, the page falls back to system fonts.
- Not yet a git repo. Nothing is on GitHub yet.

## 1. Create the public repo

- [ ] `git init` in this folder, default branch `main`.
- [ ] Set commit author to my GitHub noreply address (`<id>+amceachin-code@users.noreply.github.com`) so my personal email stays out of a public history.
- [ ] Commit `index.html`, `README.md`, and this file.
- [ ] Create the repo and push: `gh repo create amceachin-code/multiplication-worksheet --public --source . --push --description "Printable times table worksheets"`

## 2. Turn on GitHub Pages

- [ ] Serve from `main`, root folder: `gh api -X POST repos/amceachin-code/multiplication-worksheet/pages -f "source[branch]=main" -f "source[path]=/"`
- [ ] Wait for the first build: `gh api repos/amceachin-code/multiplication-worksheet/pages/builds/latest`
- [ ] Open https://amceachin-code.github.io/multiplication-worksheet/ and confirm the sheet renders and Print works.
- [ ] Add the live link to the top of `README.md` and to the repo's "Website" field.

## 3. Get it ready to share with other families

- [ ] Add `<meta name="description">` and Open Graph tags (title, description, image) so the link shows a clean preview in group texts and class emails.
- [ ] Add a simple favicon (inline SVG data URI is fine).
- [ ] Add a one-line note on the page for parents: "Pick the times tables, then click Print worksheet."
- [ ] Test on an iPhone (Safari) and an Android phone: settings, Shuffle again, and Print.
- [ ] Confirm the page collects nothing. It stores settings only in the visitor's own browser.

## Later, maybe

- [ ] Answer key page (optional checkbox, prints after the worksheet).
- [ ] MIT license file.
