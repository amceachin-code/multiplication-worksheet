# Times Table Worksheets

**Use it online:** https://www.andrew-mceachin.com/multiplication-worksheet/

A one-page web app that builds printable multiplication worksheets.

**Division worksheets:** https://www.andrew-mceachin.com/multiplication-worksheet/division/

A partner page in `division/` builds division sheets the same way. Problems read `24 ÷ 4 = ___`, and every answer is a whole number.

## Use it

1. Open the link above, or open `index.html` in any browser (double-click it).
2. Set the times tables (`4`, `3, 4, 6`, or `2-5`), the range to multiply by, and the grid size.
3. Optional: switch on **Answer key** to print a key after the worksheet. Print one-sided.
4. Click **Print worksheet**. Only the sheet prints (plus the key, if it's on), on letter paper.

## How it works

- Problems are stacked vertically, with a name and date line at the top.
- Facts are dealt in shuffled rounds, so each one appears about equally often and never twice in a row.
- **Shuffle again** makes a new order. Changing the title keeps the current order.
- Large grids split across pages automatically. Small grids get bigger numbers.
- Settings are remembered in your browser between visits.
- While a setting is invalid, the last good sheet stays up, dimmed, and won't print.

## Division page

- `division/index.html` is the page.
- Set the numbers to divide by (`4`, `3, 4, 6`, or `2-5`; zero is refused) and the range of answers. Each fact is a times-table fact run backward, so there are no remainders.
- Wider problems allow fewer per row (up to 6 for one-digit divisors, 5 for 2 to 12), so the type stays readable.
- Settings are stored under their own key, separate from the times table page.

## Answer key

- Both pages have an **Answer key** switch in the Sheet section. It starts off on every visit and isn't saved with the other settings, so nobody prints a key by accident.
- With it on, all worksheet pages print first, then matching key pages in the same order. A one-page worksheet prints 2 pages, and a three-page one prints 6. The button reads **Print worksheet and key**.
- Print one-sided, or the key lands on the back of the worksheet.
- Key pages look like the worksheet with the answers filled in, in bold black. The Name and Date line becomes an "Answer key" label. Times table answers sit under the rule, lined up on the right. Division answers sit on the blank line, and the line doesn't move.
- Every worksheet and key page shows a short sheet code at the right end of the Name and Date line, like "Sheet K7HF". It comes from the problems, their order, and the grid and page split, so a key can always be matched to the sheet in hand, even one printed on another day.

How the key stays right:

- Each answer is made once, with its problem. One dealt list feeds both the worksheet and the key.
- Before anything goes on screen, the page reads its own text back and checks every problem with `WorksheetCore.verifySheets`: the same numbers in the same spots as the worksheet, every answer right for the numbers printed beside it, no answers on the worksheet, and matching codes.
- If the key fails, the worksheet still shows, but the key is left out and the print button turns off. If the worksheet fails, nothing shows. Only checked pages reach the screen, so no print path (the button, Cmd+P, or the browser menu) can print an unchecked one.

## Files

Both pages share three files at the repo root:

- `worksheet.css`: colors, panel, paper, and print styles. Each page keeps only its own problem layout inline.
- `worksheet-core.js`: parsing, fact building, dealing, layout math, and the answer key checks. No DOM, so Node can test it.
- `worksheet-ui.js`: builds the sheet and key in the page, saves settings, and wires up the buttons.

Run the tests (Node 18 or later, nothing to install): `node --test tests/*.test.js`

- `tests/worksheet-core.test.js` covers parsing, fact building, dealing, and layout.
- `tests/answer-key.test.js` covers the answer key checks. It checks every possible fact (all 20,000 times table facts, 0 to 99 by 0 to 99 in both orders, and all 9,900 division facts) using repeated addition and subtraction rather than `*` and `/`. It also makes 425 single-change mutations to a sheet and key, and the check must reject every one.

## Hosting

- GitHub Pages serves the site from `main`, root folder.
- It lives at https://www.andrew-mceachin.com/multiplication-worksheet/ because the user site (`amceachin-code.github.io`) carries that custom domain. Old github.io links redirect there.
- The Students & Guardians page links to both tools: https://www.andrew-mceachin.com/tools/
- `og-image.png` and `division/og-image.png` are the link preview images, 1200x630 light-mode screenshots. Regenerate them when the layout changes.
