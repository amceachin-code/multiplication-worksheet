# Times Table Worksheets

**Use it online:** https://www.andrew-mceachin.com/multiplication-worksheet/

A one-page web app that builds printable multiplication worksheets.

**Division worksheets:** https://www.andrew-mceachin.com/multiplication-worksheet/division/

A partner page in `division/` builds division sheets the same way. Problems can be stacked like the times table sheet or set up as long division, and every answer is a whole number.

## Use it

1. Open the link above, or open `index.html` in any browser (double-click it).
2. Set the times tables (`4`, `3, 4, 6`, or `2-5`), the range to multiply by, the layout, and the grid size.
3. Optional: switch on **Answer key** to print a key after the worksheet. Print one-sided.
4. Click **Print worksheet**. Only the sheet prints (plus the key, if it's on), on letter paper.

## How it works

- Each page has a name and date line at the top.
- The Sheet section has a **Layout** choice: **Stacked** (the default) or **One line**. Stacked puts one number over the other, then a rule, with the answer below. One line prints each problem as `4 × 7 = ___`. The = signs and answer lines line up down every column.
- Picking a layout resets the grid to that layout's starting size: 10 per row by 10 rows for Stacked, 5 per row by 20 rows for One line. Either way that's 100 problems on one page. You can still change both numbers.
- On one line, the "Times-table number goes" buttons read **First** and **Second** instead of **On top** and **On bottom**.
- Stacked allows up to 15 problems per row. One line allows as many as fit at 11 pt or more: 6 for 0 to 10 facts, 5 for wide ones like 99 × 99 = 9801, and more for small numbers (7 for 4s times 1 to 10), never over 15. Asking for too many shows "Problems per row: use 1 to 6 on one line with these numbers."
- Facts are dealt in shuffled rounds, so each one appears about equally often and never twice in a row.
- **Shuffle again** makes a new order. Changing the title keeps the current order.
- Large grids split across pages automatically. Small grids get bigger numbers.
- Settings, including the layout, are remembered in your browser between visits.
- While a setting is invalid, the last good sheet stays up, dimmed, and won't print.

## Division page

- `division/index.html` is the page.
- Set the numbers to divide by (`4`, `3, 4, 6`, or `2-5`; zero is refused) and the range of answers. Each fact is a times-table fact run backward, so there are no remainders.
- The Sheet section has a **Layout** choice: **Division symbol** (the default) or **Long division**. Division symbol stacks problems like the times table sheet: the dividend on top, then ÷ and the divisor under it, then a rule, with the answer written below.
- Long division shows the divisor, then a bracket with a bar over the dividend, and the answer goes above the bar. The dividend sits right after the bracket, and the bar is as long as the number under it. It shows the same facts a different way, so there are no remainders here either.
- Problems per row go up to 10, so 10 rows of 10 (100 problems) fit on one letter page in either layout. Long division with very wide numbers (4-digit dividends, like 9801 ÷ 99) allows up to 9 per row, so the type stays at 11 pt or more. The default is 4 per row by 10 rows.
- Settings, including the layout, are stored under their own key, separate from the times table page.

## Answer key

- Both pages have an **Answer key** switch in the Sheet section. It starts off on every visit and isn't saved with the other settings, so nobody prints a key by accident.
- With it on, all worksheet pages print first, then matching key pages in the same order. A one-page worksheet prints 2 pages, and a three-page one prints 6. The button reads **Print worksheet and key**.
- Print one-sided, or the key lands on the back of the worksheet.
- Key pages look like the worksheet with the answers filled in, in bold black. The Name and Date line becomes an "Answer key" label. Stacked answers (times tables and division symbol) sit under the rule, lined up on the right. One-line answers sit on the answer line, which stays put. Long division answers sit above the bar, with the answer's last digit over the dividend's last digit. Nothing on the page moves between the worksheet and the key.
- Every worksheet and key page shows a short sheet code at the right end of the Name and Date line, like "Sheet K7HF". It comes from the problems, their order, and the grid and page split, so a key can always be matched to the sheet in hand, even one printed on another day.
- On both pages, the code doesn't depend on the layout. The same problems in the same spots get the same code either way, because each answer goes with the same spot on the grid. So a key printed in one layout works for a worksheet printed in the other if the codes match.

How the key stays right:

- Each answer is made once, with its problem. One dealt list feeds both the worksheet and the key.
- Before anything goes on screen, the page reads its own text back and checks every problem with `WorksheetCore.verifySheets`: the same numbers in the same spots as the worksheet, every answer right for the numbers printed beside it, no answers on the worksheet, and matching codes.
- If the key fails, the worksheet still shows, but the key is left out and the print button turns off. If the worksheet fails, nothing shows. Only checked pages reach the screen, so no print path (the button, Cmd+P, or the browser menu) can print an unchecked one.

## Files

Both pages share three files at the repo root:

- `worksheet.css`: colors, panel, paper, and print styles, plus the stacked problem and the two-choice switch (segmented control) that both pages use. Each page keeps only its own layout styles inline: the one-line problem (`.horiz`) on the times table page, and long division on the division page.
- `worksheet-core.js`: parsing, fact building, dealing, layout math, sizing for long division and one-line problems (`longDivisionSize`, `horizontalSize`), and the answer key checks for all four printed forms (stacked times tables, one-line times tables, stacked division, and long division). No DOM, so Node can test it.
- `worksheet-ui.js`: builds the sheet and key in the page (including the stacked problem for both pages), saves settings, and wires up the buttons.

Run the 33 tests (Node 18 or later, nothing to install): `node --test tests/*.test.js`

- `tests/worksheet-core.test.js` covers parsing, fact building, dealing, and layout. It also checks that both division layouts fit 10 rows of 10 on one page, that one-line times tables fit 5 per row by 20 rows on one page, and that one-line widths grow with the biggest numbers.
- `tests/answer-key.test.js` covers the answer key checks. It checks every possible fact (all 20,000 times table facts, 0 to 99 by 0 to 99 in both orders, and all 9,900 division facts) using repeated addition and subtraction rather than `*` and `/`. It runs every read-back check on all four printed forms. It makes 857 single-change mutations to a sheet and key (214 for stacked times tables, 217 for one-line times tables, 214 for stacked division, and 212 for long division), and the check must reject every one. It also checks that an unknown operation or format is refused.

## Hosting

- GitHub Pages serves the site from `main`, root folder.
- It lives at https://www.andrew-mceachin.com/multiplication-worksheet/ because the user site (`amceachin-code.github.io`) carries that custom domain. Old github.io links redirect there.
- The Students & Guardians page links to both tools: https://www.andrew-mceachin.com/tools/
- `og-image.png` and `division/og-image.png` are the link preview images, 1200x630 light-mode screenshots. Regenerate them when the page design changes.
