# Times Table Worksheets

**Use it online:** https://www.andrew-mceachin.com/multiplication-worksheet/

A one-page web app that builds printable multiplication worksheets.

**Division worksheets:** https://www.andrew-mceachin.com/multiplication-worksheet/division/

A partner page in `division/` builds division sheets the same way. Problems can be stacked like the times table sheet or set up as long division, and every answer is a whole number.

**Halloween color by number:** https://www.andrew-mceachin.com/multiplication-worksheet/halloween/

A third page in `halloween/` turns the times tables into a color-by-number jack-o'-lantern. Students solve the problem in each space, find the answer in the color key, and color the space.

## Use it

1. Open the link above, or open `index.html` in any browser (double-click it).
2. Set the times tables (`4`, `3 4 6`, or `2 to 5`; commas and dashes work too), the range to multiply by, the layout, and the grid size. On a phone the field opens the regular keyboard, so tap "123" for digits and punctuation.
3. Optional: switch on **Answer key** to print a key after the worksheet. Print one-sided.
4. Click **Print worksheet**. Only the sheet prints (plus the key, if it's on), on letter paper.

## How it works

- Each page has a name and date line at the top.
- The Sheet section has a **Layout** choice: **Stacked** (the default) or **One line**. Stacked puts one number over the other, then a rule, with the answer below. One line prints each problem as `4 × 7 = ___`. The = signs and answer lines line up down every column.
- Picking a layout resets the grid to that layout's starting size: 10 per row by 10 rows for Stacked, 5 per row by 20 rows for One line. Either way that's 100 problems on one page. You can still change both numbers.
- "Times-table number goes" has three choices: **On top**, **On bottom**, or **Mixed**. On one line they read **First**, **Second**, and **Mixed**.
- Mixed flips exactly half of the problems (rounded down), picked at random, so the times-table number is on top for half and on the bottom for the rest. Squares like 4 × 4 look the same either way, so they don't count toward the half. Switching from On top to Mixed keeps the same problems in the same order and only turns half of them around.
- Stacked allows up to 15 problems per row. One line allows as many as fit at 11 pt or more: 6 for 0 to 10 facts, 5 for wide ones like 99 × 99 = 9801, and more for small numbers (7 for 4s times 1 to 10), never over 15. Asking for too many shows "Problems per row: use 1 to 6 on one line with these numbers."
- Facts are dealt in shuffled rounds, so each one appears about equally often and never twice in a row.
- **Shuffle again** makes a new order. Changing the title keeps the current order.
- **How many worksheets** (1 to 40, in the Sheet section, on both pages) prints several different worksheets at once, like one per student. Each one is shuffled on its own and has its own header on every page: Name and Date, title, and its own sheet code. Shuffle again makes a new order for all of them. Raising the number keeps the worksheets already showing and adds new ones after them, and the first worksheet is the same one you'd get with the number at 1. The preview labels them "Worksheet 2 of 3", and the button reads **Print 3 worksheets**.
- Large grids split across pages automatically. Small grids get bigger numbers.
- Each printed sheet uses 9.25 in of the 10 in between the half-inch margins. The spare room at the bottom is for the footer iPhone Safari adds (the web address, date, and page number), so a sheet never runs onto a second page.
- Settings, including the layout and the number of worksheets, are remembered in your browser between visits.
- While a setting is invalid, the last good sheet stays up, dimmed, and won't print.

## Division page

- `division/index.html` is the page.
- Set the numbers to divide by (`4`, `3 4 6`, or `2 to 5`; commas and dashes work too; zero is refused) and the range of answers. Each fact is a times-table fact run backward, so there are no remainders.
- The Sheet section has a **Layout** choice: **Division symbol** (the default) or **Long division**. Division symbol stacks problems like the times table sheet: the dividend on top, then ÷ and the divisor under it, then a rule, with the answer written below.
- Long division shows the divisor, then a bracket with a bar over the dividend, and the answer goes above the bar. The dividend sits right after the bracket, and the bar is as long as the number under it. It shows the same facts a different way, so there are no remainders here either.
- Problems per row go up to 10, so 10 rows of 10 (100 problems) fit on one letter page in either layout. Long division with very wide numbers (4-digit dividends, like 9801 ÷ 99) allows up to 9 per row, so the type stays at 11 pt or more. The default is 4 per row by 10 rows.
- Settings, including the layout, are stored under their own key, separate from the times table page.

## Halloween page

- `halloween/index.html` is the page.
- Set the times tables and the range to multiply by, as on the times table page (`3`, `3 4 6`, or `3 to 5`). There is no grid to set: the sheet is a jack-o'-lantern picture in 38 spaces, each with one problem, like `3 × 7`.
- A color key above the picture lists the answers for each color: orange, yellow, green, purple, and brown. Students solve each problem, find the answer in the key, and color the space that color.
- Every answer goes with exactly one color, so a problem's answer always names one color, the color of its space. When several facts make the same answer (3 × 4, 4 × 3, and 2 × 6 all make 12), all of them go in spaces of that color.
- The key lists only the answers on that sheet, smallest first. A wrong answer is often missing from the key, which tells a student to check the problem again.
- Answers are shared out among the colors by how many spaces each color has, so the facts appear about equally often. One table times 1 to 10 (10 facts) uses every fact, each 1 to 5 times. With more facts than spaces, no fact appears twice.
- The facts need at least 5 different answers, one for each color. The 0s alone make only one, so the page says "These facts have only 1 answer, and the picture needs 5, one for each color. Add a times table or widen the range."
- "Times-table number goes" has **First**, **Second**, and **Mixed**, as on the times table page's one-line layout. Mixed flips exactly half of the problems that can flip.
- **How many worksheets** (1 to 40) works as on the other pages. Each worksheet has its own problems, its own color key, and its own sheet code. **Shuffle again** makes new problems and a new color key for every worksheet.
- Each worksheet prints on one letter page: the header, the color key (1.3 in tall), and the picture (7.5 in by 6.6 in), in the same 9.25 in as the other pages. Problems print at 12 pt. The color key prints at 12 pt too, or a little smaller if a row of answers wouldn't fit on its line (99s times 0 to 99 print at 11 to 12 pt, by how many four-digit answers share a row).
- The colors print as SVG fills, not CSS backgrounds, so the color key's swatches and the answer key's colors print even with the browser's "background graphics" option off. In black and white the swatches print gray, and the color names carry the meaning.
- Settings are stored under their own key, `halloween-worksheets:v1`.

The answer key and its check:

- With **Answer key** on, the key is the finished picture: every space painted its color, with its answer in bold where the problem was. The color key prints on it too. Nothing on the page moves between the worksheet and the key.
- Before anything goes on screen, the page reads its own text back and checks it with `ColorByNumber.verifySheet`: the same spaces, lines, and label spots as the picture; every problem readable; every answer in the color key under its space's color; no answer in two colors and none the sheet doesn't use; on the key, every space painted its own color and showing the right answer to the worksheet's problem there; and matching codes. A failed worksheet shows nothing, and a failed key is left out, as on the other pages.
- The sheet code covers every space's problem and the color key, so a key matches only its own worksheet.

The picture:

- `halloween/jack-o-lantern.js` holds the picture: 38 spaces (10 orange, 5 yellow, 9 green, 13 purple, 1 brown), each with its outline, color, and label spot, plus the lines, drawn thick where the color changes and thin between spaces of one color.
- `tools/jack-o-lantern.js` draws it from shapes: five pumpkin lobes, the carved face, the stem, two leaves, the moon, hills, ground, and rays behind the pumpkin. It cuts the lines that would be hidden, finds every closed space, puts each label where the biggest label box fits, and stops with an error if any space can't hold a 12 pt "99 × 99". After changing the drawing, run `node tools/jack-o-lantern.js` (add `--preview picture.svg` to also write a colored preview). A test fails if the picture file is out of date.

## Answer key

- The times table and division pages have an **Answer key** switch in the Sheet section. It starts off on every visit and isn't saved with the other settings, so nobody prints a key by accident.
- With it on, all worksheet pages print first, then matching key pages in the same order. A one-page worksheet prints 2 pages, and a three-page one prints 6. The button reads **Print worksheet and key**.
- With several worksheets, every worksheet prints first, then one key for each, in the same order (Worksheet 1, 2, 3, then Answer key 1, 2, 3). Each key carries its own worksheet's sheet code. The button reads **Print 3 worksheets and keys**.
- Print one-sided, or the key lands on the back of the worksheet.
- Key pages look like the worksheet with the answers filled in, in bold black. The Name and Date line becomes an "Answer key" label. Stacked answers (times tables and division symbol) sit under the rule, lined up on the right. One-line answers sit on the answer line, which stays put. Long division answers sit above the bar, with the answer's last digit over the dividend's last digit. Nothing on the page moves between the worksheet and the key.
- Every worksheet and key page shows a short sheet code at the right end of the Name and Date line, like "Sheet K7HF". It comes from the problems, their order, and the grid and page split, so a key can always be matched to the sheet in hand, even one printed on another day.
- On both pages, the code doesn't depend on the layout. The same problems in the same spots get the same code either way, because each answer goes with the same spot on the grid. So a key printed in one layout works for a worksheet printed in the other if the codes match.
- The code does follow the printed numbers, so a Mixed times table sheet gets a different code from the same sheet On top. Their keys differ too, since the flipped problems print the other way around.

How the key stays right:

- Each answer is made once, with its problem. One dealt list feeds both the worksheet and the key.
- Before anything goes on screen, the page reads its own text back and checks every problem with `WorksheetCore.verifySheets`: the same numbers in the same spots as the worksheet, every answer right for the numbers printed beside it, no answers on the worksheet, and matching codes.
- Each worksheet is checked on its own, and each key against its own worksheet. If any key fails, the worksheets still show, but every key is left out and the print button turns off. If any worksheet fails, nothing shows. Only checked pages reach the screen, so no print path (the button, Cmd+P, or the browser menu) can print an unchecked one.

## Privacy

- The pages collect nothing. There are no accounts, sign-ins, cookies, ads, analytics, or tracking, and no forms. The tool never asks for names or other personal details: Name and Date are blank lines on the paper.
- Settings are saved only in the visitor's own browser (localStorage). The Answer key switch is never saved.
- The pages load everything, fonts included, from this site. They contact no other site.
- The privacy page has a short version for teachers and families and a longer one for district admin and IT staff: https://www.andrew-mceachin.com/multiplication-worksheet/privacy/ (the file is `privacy/index.html`). All three worksheet pages link to it at the bottom of the settings panel.
- For Clever, add the tool as a plain link or bookmark in the Clever Portal. It needs no SSO, rostering, or LTI. A web filter only needs to allow www.andrew-mceachin.com.

## Files

The worksheet pages share three files at the repo root:

- `worksheet.css`: the `@font-face` rules for the local fonts (at the top), colors, panel, paper, and print styles, the privacy link at the bottom of the panel (`.panel-footer`), plus the stacked problem and the segmented control (the two- and three-choice switches). Each page keeps only its own layout styles inline: the one-line problem (`.horiz`) on the times table page, long division on the division page, and the color key and picture on the Halloween page.
- `worksheet-core.js`: parsing (`parseNumberList` takes commas, spaces, dashes, and the word "to"), fact building, dealing, one seed per worksheet (`sheetSeeds`), the Mixed flip (`mixOrder`), layout math, sizing for long division and one-line problems (`longDivisionSize`, `horizontalSize`), sheet codes (`sheetCode`, and `codeFor` for any text), and the answer key checks for all four printed forms of the grid pages (stacked times tables, one-line times tables, stacked division, and long division). No DOM, so Node can test it.
- `worksheet-ui.js`: builds the grid sheets and keys in the page (including the stacked problem for both grid pages) and the sheet header all three pages use, saves settings, and wires up the buttons.

The Halloween page adds three files of its own in `halloween/`:

- `color-by-number.js`: the colors (`PALETTE`), sharing the answers among the colors and dealing problems to spaces (`planSheet`), the summary line, the color key's font size (`keyFont`), the sheet code, and the read-back check (`verifySheet`). No DOM, so Node can test it.
- `jack-o-lantern.js`: the picture, written by `tools/jack-o-lantern.js`.
- `og-image.png`: its link preview, which shows the answer key's colored picture.

Other files:

- `fonts/`: Andika and Atkinson Hyperlegible, regular and bold, as `.woff2` files (the "latin" subsets Google Fonts serves, about 48 KB in all). Their licenses ship with them: `OFL-Andika.txt` and `OFL-AtkinsonHyperlegible.txt` (SIL Open Font License 1.1). Characters outside the latin subset fall back to the system fonts in the font stacks.
- `privacy/index.html`: the Privacy and data page. It uses `worksheet.css` for colors and fonts, plus its own inline styles for a single readable column.
- `tools/jack-o-lantern.js`: draws the Halloween picture and writes `halloween/jack-o-lantern.js` (see "The picture" above). The pages never load it.

Run the 59 tests (Node 18 or later, nothing to install): `node --test tests/*.test.js`

- `tests/worksheet-core.test.js` covers parsing, fact building, dealing, and layout. It checks that `sheetSeeds` keeps the first worksheet's seed, gives every worksheet a different one, and keeps the first ones when the count goes up. Parsing includes phone-friendly ranges ("2 to 5", "2to5", an em dash) and refuses forms like "to 5" or "2 through 5". It checks that `mixOrder` flips exactly half the problems that can flip, never flips a square, keeps each product with its numbers, and gives the same result for the same seed. It also checks that both division layouts fit 10 rows of 10 on one page, that one-line times tables fit 5 per row by 20 rows on one page, and that one-line widths grow with the biggest numbers.
- `tests/answer-key.test.js` covers the answer key checks. It checks every possible fact (all 20,000 times table facts, 0 to 99 by 0 to 99 in both orders, and all 9,900 division facts) using repeated addition and subtraction rather than `*` and `/`. It runs every read-back check on all four printed forms, and the sweep of 300 random sheets includes Mixed times table sheets. It makes 857 single-change mutations to a sheet and key (214 for stacked times tables, 217 for one-line times tables, 214 for stacked division, and 212 for long division), and the check must reject every one. It also checks that an unknown operation or format is refused.
- `tests/color-by-number.test.js` covers the Halloween page. For the picture: its spaces cover it exactly, with no gaps or overlaps; every border between spaces is drawn, thick where the color changes and thin between spaces of one color; every space holds a 12 pt "99 × 99" clear of its borders; and the picture file is what `tools/jack-o-lantern.js` draws. For planning, across 300 random settings: every answer goes with one color, every space's answer is its own color, the key lists only answers on the sheet, and facts are dealt evenly. It also checks that facts appear about equally often, that a seed repeats, that too few answers are refused, the summary line, the color key's font size, and the sheet code. The read-back check passes 300 random sheets and keys and must reject all 323 single-change mutations (wrong, blank, or look-alike answers; spaces painted wrong; answers moved to another color, doubled, missing, or unused; problems changed, flipped, or swapped; another shuffle's key; misplaced labels; stray text; and bad codes).
- `tests/privacy.test.js` holds the site to the privacy page's promises by reading the files as text. Pages load nothing from another site (in tags or inline styles). The stylesheet fetches only the four local font files, which must exist, and both license files must be there. No script makes network calls, uses service workers or dynamic imports, or touches cookies. The privacy page lists exactly the storage keys the pages use, and storage happens only in the save and restore code in `worksheet-ui.js`. All three worksheet pages link to the privacy page.

## Hosting

- GitHub Pages serves the site from `main`, root folder.
- It lives at https://www.andrew-mceachin.com/multiplication-worksheet/ because the user site (`amceachin-code.github.io`) carries that custom domain. Old github.io links redirect there.
- The Students & Guardians page links to both tools: https://www.andrew-mceachin.com/tools/
- All three worksheet pages link to the companion practice app, Times Tables Games, at https://www.andrew-mceachin.com/times-tables-games/ (its own repo, `amceachin-code/times-tables-games`).
- `og-image.png`, `division/og-image.png`, and `halloween/og-image.png` are the link preview images, 1200x630 light-mode screenshots. The Halloween one shows the answer key's colored picture. Regenerate them when the page design changes.
