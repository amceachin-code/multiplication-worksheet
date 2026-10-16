# Times Table Worksheets

**Use it online:** https://www.andrew-mceachin.com/multiplication-worksheet/

A one-page web app that builds printable multiplication worksheets.

**Division worksheets:** https://www.andrew-mceachin.com/multiplication-worksheet/division/

A partner page in `division/` builds division sheets the same way. Problems read `24 ÷ 4 = ___`, and every answer is a whole number.

## Use it

1. Open the link above, or open `index.html` in any browser (double-click it).
2. Set the times tables (`4`, `3, 4, 6`, or `2-5`), the range to multiply by, and the grid size.
3. Click **Print worksheet**. Only the sheet prints, on letter paper.

## How it works

- Problems are stacked vertically, with a name and date line at the top.
- Facts are dealt in shuffled rounds, so each one appears about equally often and never twice in a row.
- **Shuffle again** makes a new order. Changing the title keeps the current order.
- Large grids split across pages automatically. Small grids get bigger numbers.
- Settings are remembered in your browser between visits.

## Division page

- `division/index.html` is the page.
- Set the numbers to divide by (`4`, `3, 4, 6`, or `2-5`; zero is refused) and the range of answers. Each fact is a times-table fact run backward, so there are no remainders.
- Wider problems allow fewer per row (up to 6 for one-digit divisors, 5 for 2 to 12), so the type stays readable.
- Settings are stored under their own key, separate from the times table page.

## Files

Both pages share three files at the repo root:

- `worksheet.css`: colors, panel, paper, and print styles. Each page keeps only its own problem layout inline.
- `worksheet-core.js`: parsing, fact building, dealing, and layout math. No DOM, so Node can test it.
- `worksheet-ui.js`: builds the sheet in the page, saves settings, and wires up the buttons.

Run the tests (Node 18 or later, nothing to install): `node --test tests/*.test.js`

## Hosting

- GitHub Pages serves the site from `main`, root folder.
- It lives at https://www.andrew-mceachin.com/multiplication-worksheet/ because the user site (`amceachin-code.github.io`) carries that custom domain. Old github.io links redirect there.
- The Students & Guardians page links to both tools: https://www.andrew-mceachin.com/tools/
- `og-image.png` and `division/og-image.png` are the link preview images, 1200x630 light-mode screenshots. Regenerate them when the layout changes.
