# Progress

## 2026-10-26 (Practice online in division)

### Changes

- Slice D of the division plan in `amceachin-code/times-tables-games` (`plans/21-division.md`), done once division was live there. It follows `amceachin-code/times-tables-games#21`, "Division facts", which closed when slice C went live.
- The division page's "Practice online" link now opens Times Tables Games in division, on the sheet's divisors and answers: `https://www.andrew-mceachin.com/times-tables-games/#/?op=div&t=4&from=1&to=10`. The app takes the same answers (0 to 99) but divisors only up to 20. With a bigger divisor in the list it quietly uses the child's own tables, so then the link opens division alone (`#/?op=div`).
- New `WorksheetCore.divisionPracticeLink(divisors, from, to)` builds the link. Each drawn sheet sets it, beside the title placeholder. In the HTML the link starts as division alone, so it opens division before the script runs and when saved settings can't draw a sheet. While a setting needs fixing, the link keeps the last good sheet's numbers, like the dimmed sheet.
- The times table and Color by Number pages still link to the app's home.
- Tests: 63 Node tests pass (was 60). New `tests/practice-link.test.js` (3 tests): the link for one divisor, a list, and all 20 divisors with answers 0 to 99, each left as it is by the browser's address parsing; division alone for a divisor over 20 or none; and on the page, the link starts as division alone and each drawn sheet sets it. Checked that the tests fail on a cap of 19 or 21, a space between divisors, a missing range or `op=div`, a missing call on the page, and the old link.
- Browser check (headless Chromium, both sites served at their real addresses): the link follows the divisors and range, stays put for the layout and grid, keeps the last good numbers while a setting needs fixing, and is division alone for 2 to 21, for 25, and with an unreadable saved setting. Followed from the page, the app opened in division with the sheet's tables picked: 7 with answers 1 to 10, and 3, 4, and 6 with answers 0 to 12 (Other, 0 and 12). 25 opened division on the child's own tables. No console errors, and every request stayed on the site.
- Privacy: the divisors and range ride after the # in the link, which browsers don't send to the server, so the privacy page is unchanged.

### Decisions

- The link is built in `worksheet-core.js`, not the page, so Node can test it.
- `from` and `to` always go in the link, even when they are the app's defaults (1 to 10), so the link means the same thing if those defaults change.
- With a divisor over 20, the link carries nothing from the sheet, as the plan said, rather than the divisors the app takes. Those would be other facts than the sheet's.

### Files touched

- `division/index.html`, `worksheet-core.js`, `tests/practice-link.test.js` (new), `README.md`, `TODO.md`, `PROGRESS.md`

### Next steps

- Merge, then check the live division page's link opens the app on the sheet's divisors.

## 2026-10-25 (color by number)

### Changes

- The user asked for a color-by-number Halloween worksheet: pick the times tables (like 3s, or 3 to 5), and the picture is a classic jack-o'-lantern. The user picked a coloring-book picture over a pixel grid.
- Before merging, the user said this is the first of many color-by-number worksheets, in different formats and not tied to any holiday, and asked for a color-by-number page listed on the Students & Guardians page under Math Worksheets. So the first version, a `halloween/` page, became a general page with a Picture menu, and the jack-o'-lantern became its first picture. Neither version had been merged.
- New page `color-by-number/index.html`, "Color by Number". Settings: times tables, multiply by from and to, the picture, "Times-table number goes" (First, Second, Mixed), title, how many worksheets (1 to 40), and the answer key. Defaults: 3s times 1 to 10 and the first picture. Saved under `color-by-number:v1`. A hint under the Picture menu gives the number of problems and the crayons needed ("38 problems. Crayons: orange, yellow, green, purple, and brown."). A saved picture that's no longer offered falls back to the first.
- The sheet: the usual header, then a color key (1.3 in) and the picture (7.5 in by 6.6 in), in the same 9.25 in as the other pages. The jack-o'-lantern has 38 spaces, each with one problem like `3 × 7` at 12 pt: the pumpkin (10 orange), the eyes, nose, mouth, and moon (5 yellow), the leaves, hills, and ground (9 green), the sky (13 purple), and the stem (1 brown). The sky has rays from behind the pumpkin, as if it glows.
- The color key lists each color's answers, smallest first, only those on the sheet. Every answer goes with exactly one color, so a problem's answer always names its space's color. When several facts make one answer (3 × 4, 4 × 3, 2 × 6), all of them go in spaces of that color.
- `ColorByNumber.planSheet` shares answers among colors by each color's share of the spaces, answers with the most facts first, each to the color furthest below its share. Every color gets at least one answer. Then each color's facts are dealt to its spaces in shuffled rounds with `dealProblems`. 3s times 1 to 10 use every fact, each 1 to 5 times (the brown stem's answer once). With more facts than spaces, no fact appears twice.
- Facts with fewer different answers than the picture has colors are refused: "These facts have only 1 answer, and the picture needs 5, one for each color. Add a times table or widen the range."
- The answer key is the finished picture: every space painted its color, with its answer in bold where the problem was. Colors are SVG fills, so they print even with background graphics off.
- Read-back check, `ColorByNumber.verifySheet`, like the other pages: the same spaces, lines, and label spots as the picture; readable problems; every answer in the color key under its space's color; no answer in two colors and none unused; on the key, every space painted its own color with the right answer; and matching codes. The sheet code covers the picture, every problem, and the color key. Failed worksheets show nothing; a failed key is left out.
- The color key prints at 12 pt, or smaller when a row of answers wouldn't fit on one line (`keyFont`). 99s times 0 to 99 print at 11 to 12 pt, by how many four-digit answers share a row (13 in purple's row is the most, at 11.1 pt).
- Pictures are generated. Each picture is a file in `color-by-number/pictures/` (the page loads each with its own script tag), made by a drawing in `tools/color-by-number/` (Node, nothing to install). The drawings share `tools/color-by-number/kit.js`: it splits all of a drawing's lines where they meet into a planar map, takes every closed area as a space, colors it by the shape it's in, and puts its label at the center of the biggest label box that fits. Shared borders are smoothed once, so neighbors meet exactly. It stops if any space can't hold a 12 pt "99 × 99". The jack-o'-lantern's drawing (`jack-o-lantern.js`) is five lobes (each lobe's edge shows only where no lobe in front covers it), the face (the eyes and mouth reach the side lobes' edges, which splits those lobes into more spaces), stem, two leaves, moon, hills, ground and its dividers, and the rays. Its file is 25 KB.
- Lines are thick (2 pt) where the color changes and thin (1.15 pt) between spaces of one color.
- Shared code: `worksheet-core.js` exports `shuffle` and `codeFor` (the code hash, split out of `sheetCode`; codes are unchanged, checked on 2,000 sheets against the old code). `worksheet-ui.js` exports `buildHeader`, `sheetsText`, and the two check-failed messages. Header comments now mention the new page.
- The times table and division pages link to the new page ("Color by number"), and it links back.
- Privacy page: lists the new storage key, the new page, its scripts (its logic and one file per picture), and the picture choice among the saved settings. "Last updated" moved to October 25, 2026.
- Link preview `color-by-number/og-image.png` shows the answer key's colored picture, which reads better at preview size than the top of a blank sheet. The other pages' previews were not regenerated, as with the last link change.
- Students & Guardians page (repo `amceachin-code/amceachin-code.github.io`, which builds www.andrew-mceachin.com; the notes above call it `academic-site`, its old name): a "Color by Number" subsection under Math Worksheets, after Division, linking to `/multiplication-worksheet/color-by-number/`, plus a test for the link. On a branch, not merged.
- Tests: 60 Node tests pass (was 41). New `tests/color-by-number.test.js` (19 tests): the page loads every picture in `color-by-number/pictures/`, each named for its file; for every picture, its spaces cover it exactly (areas add up, and points on a grid each lie in one space), every border is drawn, thick or thin as it should be, and nothing else is, every space holds the label box clear of its borders, and the file is what its drawing makes; then, with the jack-o'-lantern, planning across 300 random settings, coverage text, key font, sheet code, and the read-back check, which passes 300 random sheets and rejects all 323 single-change mutations. Each mutation was checked to fail for its own reason. `tests/privacy.test.js` now covers the new page and every picture file.
- Browser checks (headless Chromium, local server): 10 settings, including 99s times 0 to 99, Mixed, 0 to 12 by 0 to 12, three worksheets, and two refused settings. Every label lies inside its space and off every line, checked with the browser's own hit tests, and no color key row overflows. A second picture, added for the test only, showed in the menu, redrew the sheet with its own colors and code when picked, came back after a reload, and a saved picture that no longer exists fell back to the first. No console errors. 375 px phone width (no sideways scroll) and dark mode, with the Picture menu styled like the other fields. 40 worksheets with keys from 10,000 facts build and check in about 0.3 s.
- Print checks: 4 PDFs (7 worksheets and 7 keys) print one page per sheet on letter paper and on a page cut to 9.4 in. From `pdftotext` output, all 266 key answers were recomputed from the worksheet's problems, and every printed answer is in the printed color key under its space's color. Pixels sampled from the PDFs showed each key space in its color and each worksheet space white.

### Decisions

- Coloring-book picture over a pixel grid, at the user's choice.
- One Color by Number page with a Picture menu, at the user's direction, rather than a page per picture or a layout inside the times table page. The color key and picture don't fit the grid pages' settings, and pictures can come and go without touching them.
- A menu, not buttons: it holds any number of pictures.
- The key shows answers, not problems: a two-line label (problem over answer) needs spaces too big for the face, and the worksheet's problem is in the same spot.
- Five colors in the palette for now, each light enough to read black numbers on in the key. A new picture can add colors. Black (for bats, say) would hide the numbers.
- Pictures have no grid settings. A fixed picture keeps every label at 12 pt.
- Pictures are generated by drawings rather than drawn by hand: every space is found, colored, and measured the same way, and the tests check each picture.
- Only answers on the sheet go in the color key, so wrong answers often aren't there.
- Built without a separate written plan.

### Files touched

- `color-by-number/index.html`, `color-by-number/color-by-number.js`, `color-by-number/pictures/jack-o-lantern.js`, `color-by-number/og-image.png`, `tools/color-by-number/kit.js`, `tools/color-by-number/jack-o-lantern.js`, `tests/color-by-number.test.js` (all new), `worksheet-core.js`, `worksheet-ui.js`, `worksheet.css` (comment only), `index.html`, `division/index.html`, `privacy/index.html`, `tests/privacy.test.js`, `README.md`, `TODO.md`, `PROGRESS.md`
- In `amceachin-code.github.io`: `site/content/tools/_index.md`, `tests/test_tools_page.py`

### Next steps

- Merge this repo's branch to `main` first, then the website's, so the tools page never links to a page that isn't live yet. Then check both live pages with the key on.
- Print a worksheet and key on a real printer, in color and in black and white, and from a phone.
- More pictures: copy the jack-o'-lantern's drawing and add a script tag (see README, "The pictures").

## 2026-10-21 (several worksheets at once)

### Changes

- The user asked to make several worksheets in one go, each with its own header, while keeping Shuffle again.
- New field in the Sheet section on both pages: "How many worksheets" (1 to 40, starts at 1), with the hint "Each one is shuffled on its own and has its own Name and Date line." It sits under the title, above the Answer key switch. It's saved with the other settings.
- Each worksheet deals from its own seed, from the new `WorksheetCore.sheetSeeds(seed, count)`. The first seed is the saved one, so one worksheet looks exactly as before and saved sheets keep their problems. The rest come from a generator seeded from it, so raising the count keeps the worksheets already showing. Shuffle again picks a new seed, which reshuffles every worksheet. On the times table page, Mixed flips half of each worksheet with that worksheet's own generator.
- Every page of every worksheet has the full header (Name, Date, title, range, sheet code). Each worksheet has its own sheet code.
- `WorksheetUI.renderSheets` takes `worksheets` (one problem list per worksheet) instead of `problems`. It builds and checks each worksheet on its own, and each key against its own worksheet. Any failed worksheet shows nothing; any failed key leaves out all keys and turns printing off.
- Print order with the key on: all worksheets, then their keys in the same order.
- Preview labels read "Worksheet 2 of 3" (plus ", page 1 of 2" on long sheets) and "Answer key 2 of 3". With one worksheet they're unchanged.
- The summary reads "3 worksheets, each with 100 problems from 10 facts. Each fact appears 10 times. Fills 3 pages, plus 3 for the answer keys." The button reads "Print 3 worksheets" or "Print 3 worksheets and keys". With one worksheet, both read as before. While the count is invalid, the disabled button keeps its last label.
- The print note now reads "Prints on letter paper: the worksheets, then their answer keys if the switch is on. Each shuffle makes a new order for every worksheet."
- Privacy page: the saved settings list now names the number of worksheets. "Last updated" moved to October 21, 2026.
- Tests: 41 Node tests pass (was 40). The new one checks that `sheetSeeds` keeps the first seed, gives 20 different seeds, keeps the first ones when the count goes up, and deals different sheets.
- Browser checks (headless Chromium, local server): 1 worksheet has the same code as before; 3 worksheets get 3 headers and 3 different codes, and the first matches the 1-worksheet code; with the key on, 6 pages in the right order with matching codes; 30 rows split into 3 pages per worksheet (18 pages with keys, and an 18-page PDF); one line with Mixed; 0 and 41 show "Worksheets: use 1 to 40." and dim the sheet; the count survives a reload; the division page with 4 long-division worksheets and keys (8-page PDF). No console errors.
- Speed: 30 worksheets of 100 with keys redraw in about 140 ms. The extreme case, 40 worksheets of 15 by 60 with keys (400 pages), takes about 3 seconds.

- Fix after the push: the user saw a blank page between worksheets when printing 5. Cause: each printed sheet was a fixed 10.97 in box on a page that asked for no margins. Browsers and printers that add their own margins anyway (phones, Safari) leave less than 10.97 in, so each sheet ran onto a second page. Chrome on a computer honors the zero margins, which is why the first checks passed, and with one worksheet the extra page came last, so it went unnoticed. Now `@page` asks for 0.5 in margins (0.4 in at the bottom), and the printed paper has no padding and no fixed height. Header, gap, and grid come to exactly 10 in, so smaller printer margins still fit. Headless Chromium reproduced the extra pages with forced top and bottom margins (5 worksheets printed as 10 pages); after the fix, 5, 6, and 18 pages as expected with normal, 0.25 in, and 0.5 in margins, for stacked, one line, long division 10 by 10, and sheets that split across pages, keys on and off. With normal printing, the header and grid sit at the same spots as before.

- Second fix, from the user's iPhone Safari print preview: the last row of a 5 by 20 one-line sheet still ran onto a second page. iPhone Safari prints its own footer (the web address, the date, and "Page 1 of 10") and gave the page only about 9.6 in, short of the sheet's 10 in. `GRID_H` in `worksheet-core.js` is now 579.6 pt (8.05 in, was 8.8 in), so header, gap, and grid come to 9.25 in, with 0.75 in spare. `@page` margins are back to 0.5 in all round. Default sheets still fit on one page: stacked 10 by 10 prints at 12.6 pt (was 13.8), one line 5 by 20 at 14.5 pt, long division 10 by 10 at 15.7 pt (11.5 pt for dividends up to 144). Sheets that split print 9 stacked rows a page instead of 10, so a 30-row sheet takes 4 pages instead of 3. Two tests moved to the new numbers (12 by 40 now splits into 5 pages; the 10 by 10 stacked font floor is 12.5 pt). Headless Chromium with the page cut to 9.4 in prints one page per sheet for stacked, one line, division symbol, long division, and 30-row sheets, keys on.

### Decisions

- A number field rather than a fixed menu, capped at 40 so a class fits with room to spare.
- Keys print after all the worksheets, not after each one, so the worksheets come off the printer as one stack to hand out.
- No "Worksheet 2 of 3" on the printed page. The sheet code already tells worksheets and keys apart, and students don't need the count.

## 2026-10-18 (privacy page and local fonts)

### Changes

- The user asked whether the tool could be hosted on Clever. Answer: yes, as a plain link or bookmark in the Clever Portal. Becoming a listed Clever app would need SSO, a server, and app review, which a tool with no accounts doesn't need. The user then asked for data and privacy information: a short version on the website and a longer one for district admin and IT staff.
- New page `privacy/index.html`, "Privacy and data". It opens with "The short version", a shaded box for teachers and families: nothing typed is collected or sent; no accounts, sign-ins, cookies, ads, analytics, or tracking; settings are saved only in the browser; the tool never asks for names or other personal details (Name and Date are blank lines on paper); and the pages load everything, fonts included, from this site.
- The second part has no heading of its own. It opens "The following covers data and privacy in more detail. The code is public, so you can also check it yourself." It has sections on what the tool is (static pages, no server code or database, public source), information collected (none, including from children under 13; no forms; no network requests after load), what is stored on the device (the localStorage keys `times-table-worksheets:v1` and `division-worksheets:v1`, what's in them, that the Answer key is never saved, a shared-computer note, and how to clear them; no cookies), network requests (only www.andrew-mceachin.com over HTTPS), hosting, web filters and Clever, and changes and contact.
- Hosting section: GitHub Pages serves the site. GitHub logs visitor IP addresses for security, per GitHub's own docs (checked), with a link to the GitHub General Privacy Statement. The site owner gets no visitor logs or analytics.
- Web filters and Clever section: only www.andrew-mceachin.com needs allowing. It works as a plain Clever Portal link, with no SSO, rostering, or LTI. Printing uses the device's own print dialog.
- Contact is amceachin@gmail.com. The page links to the public change history and reads "Last updated October 18, 2026."
- The privacy page uses `worksheet.css` for colors and fonts, plus its own inline styles for a single readable column. It works in light and dark mode and at phone width.
- Both worksheet pages have a small "Privacy and data" link at the very bottom of the settings panel (`.panel-footer` in `worksheet.css`). It is hidden when printing, like the rest of the panel.
- Local fonts: the pages no longer load Google Fonts. New `fonts/` folder with `andika-400.woff2`, `andika-700.woff2`, `atkinson-hyperlegible-400.woff2`, and `atkinson-hyperlegible-700.woff2`. These are the "latin" subsets Google Fonts serves, about 48 KB in all, downloaded with the user's permission from fonts.gstatic.com. `OFL-Andika.txt` and `OFL-AtkinsonHyperlegible.txt` (SIL Open Font License 1.1, from Google's fonts repo) ship with them, as the license requires.
- The `@font-face` rules sit at the top of `worksheet.css`. The Google Fonts preconnect and stylesheet links are gone from `index.html` and `division/index.html`. Characters outside the latin subset fall back to the system fonts already in the font stacks.
- Tests: 40 Node tests pass (was 35). New `tests/privacy.test.js` (5 tests) reads the files as text and holds the site to the privacy page's promises. Pages load nothing from another site (link, script, img, iframe, and media tags, and inline styles). The stylesheet fetches only the four local font files, which exist, and both license files are present. No script, shared or inline, uses fetch, XMLHttpRequest, sendBeacon, WebSocket, EventSource, service workers, cookies, or dynamic import. The privacy page lists exactly the storage keys the pages use, and storage happens only in the save and restore code in `worksheet-ui.js`. Both worksheet pages link to the privacy page.
- Checked that the new tests catch the old Google Fonts link, a protocol-relative script, a `fetch` call, and `document.cookie`.
- Browser checks (local preview): every request went to the site itself, and all four font faces loaded from `fonts/`. The font measures the same as before (digits, ×, and = are 0.586 em, which the layout math assumes). A 0 to 10 one-line sheet at 5 × 20 still fits, with 0 overflow and 0 wrong answers. The privacy page was checked in dark mode, and in light mode at 375 px phone width (no sideways scroll). Its local links load, and its three outside links return 200.
- Print check: a 0 to 10 one-line sheet printed as 2 pages. The PDF embeds Andika and Andika-Bold, and all 100 key answers were right.
- The link preview images were not regenerated. The panel footer sits below the 1200x630 crop, and the fonts are the same files.

- Review pass (the user picked all five findings): reworded "students never enter anything" (students may use the tool themselves, as from Clever) to "never asks for names or other personal details"; made the network-request wording exact (fonts load when text first needs them; the privacy page loads no scripts); limited the device line to what was tested (Chrome on a computer, Safari on iPhone); added link-preview tags to the privacy page (reusing the times table image); and updated the `worksheet.css` header comment, which still said only the division page keeps inline styles.

### Decisions

- A plain Clever Portal link rather than becoming a Clever app partner.
- Serve the fonts from the site (latin subset only) rather than keep Google Fonts. The pages then contact no other site, and school web filters that block Google Fonts don't change how the sheet looks.
- A footer link only on the worksheet pages, with no sentence, at the user's choice. The short version lives at the top of the privacy page.
- Contact: amceachin@gmail.com, the user's choice.
- No legal compliance claims (like "FERPA compliant"). The page states facts, so each district can decide.
- For the record: Andika's license reserves the name "Andika" for unmodified fonts. These files are the same subsets Google Fonts serves, which is common practice. SIL's own web font files are an option if a stricter reading is wanted.

### Files touched

- `privacy/index.html` (new), `fonts/` (six new files: four `.woff2` fonts and two license files), `worksheet.css`, `index.html`, `division/index.html`, `tests/privacy.test.js` (new), `README.md`, `TODO.md`, `PROGRESS.md`

### Next steps

- The user reviews the privacy page wording.
- Commit and push.
- Check that the live pages make no requests to other sites.
- Share the privacy page link with district IT when asking for a Clever link.

## 2026-10-16 (phone keyboard and Mixed)

### Changes

- Phone keyboard fix, both pages. A friend on a phone couldn't type a comma or dash in the times table field. It had `inputmode="numeric"`, which shows the digit pad, and the iPhone digit pad has no comma, dash, or space.
- The list fields (times tables on `index.html`, "Divide by" on `division/index.html`) no longer set `inputmode`, so phones show the regular keyboard. Tap "123" for digits and punctuation. They also set `autocorrect="off"`, `autocapitalize="off"`, and `spellcheck="false"`, so "2 to 5" isn't rewritten while typing. The single-number fields (from, to, per row, rows) keep the digit pad.
- Parser (`parseNumberList`): ranges can use the word "to" in any case, with or without spaces ("2 to 5", "2to5", "2 To 5"). An em dash now works like a hyphen or en dash, since iPhones turn "--" into an em dash. Spaces already separated numbers like commas ("3 4 6"). Forms like "to 5", "2 to", "2 too 5", and "2 through 5" are refused with the format error.
- Hint and error text on both pages now read "One or more, like 4, or 3 4 6, or 2 to 5" (was "like 4 or 3, 4, 6 or 2-5"). Commas and dashes still work.
- Mixed: "Times-table number goes" on the times table page has a third choice, Mixed, after On top and On bottom (First, Second, and Mixed on the one-line layout). It is saved with the other settings.
- New `WorksheetCore.mixOrder(problems, rand)`. After dealing, it flips exactly half (rounded down) of the problems whose two numbers differ, picked at random with the sheet's seed. Squares like 4 × 4 are left out of the count, because they look the same flipped. The answer key follows each flipped problem.
- The same generator deals and then flips, so switching from On top to Mixed keeps the same problems in the same order and only turns half of them around.
- The sheet code covers the printed numbers in order, so a Mixed sheet's code differs from the same sheet On top. That is correct, since their keys differ.
- The segmented control (`.seg` in `worksheet.css`) now gives any number of choices equal columns. It was fixed at two. The division page's two-way Layout control looks the same.
- Tests: 35 Node tests pass (was 33). New: `parseNumberList takes phone-friendly ranges: the word to, and an em dash` and `mixOrder flips exactly half the problems that can flip, keeping each product with its numbers`. The second checks the flipped count, that squares never flip, that each product travels with its numbers, that the input is untouched, that a seed repeats, and that an all-squares sheet is unchanged. The read-back sweep of 300 random sheets now includes Mixed times table sheets. Mutation counts are unchanged (857).
- Browser checks: "2 to 5", "2 To 5", an em dash, and "3 4 6" all work, and "to 5" shows the error. Neither page's list field has `inputmode`. On a 4s sheet (1 to 10, 10 × 10), Mixed put the 4 first on exactly 45 of the 90 non-square problems, with the same facts in the same order as On top. Both layouts had 0 wrong answers with the key on, Print stayed on, and Mixed survived a reload. The three-way control fits on one line at 375 px phone width and in the 330 px desktop panel (its narrowest), with no sideways scroll. On the division page, the new hint shows, "2 to 5" gives "Dividing by 2–5", and the two-way control is unchanged.
- Review pass (the user chose to apply it): one finding. Squares were counted toward the flipped half, which tipped the mix toward the top. Fixed as above.

### Decisions

- The full keyboard over other fixes. A phone pad has no comma or dash on iPhone, and neither does a tel pad. A row of tap buttons for 0 to 12 was offered as a later, bigger option. The user chose to start with the keyboard fix.
- The hint shows "2 to 5" rather than "2-5", since it's easier to type on a phone. Dashes still work.
- Mixed flips exactly half, not a coin flip per problem, so a sheet never comes out lopsided by chance.

### Files touched

- `index.html`, `division/index.html`, `worksheet-core.js`, `worksheet.css`, `tests/worksheet-core.test.js`, `tests/answer-key.test.js`, `README.md`, `TODO.md`, `PROGRESS.md`

### Next steps

- Commit and push.
- Check the live pages on a phone (ideally the friend's iPhone): commas, dashes, and "to" can be typed in the list fields.
- Still open: print on a real printer and from iPhone Safari and an Android phone.

## 2026-10-16 (times table layouts)

### Changes

- Added a Layout choice to the Sheet section of the times table page, above "Times-table number goes": "Stacked" or "One line". It is saved with the other settings, under the page's existing storage key. The default is Stacked, which is unchanged.
- One line prints each problem as `4 × 7 = ___`. "4 × 7" is one group, set right against the = sign, then the = sign, then an answer line. The = signs and answer lines line up down every column. The answer key prints the product in bold on the line, and the line does not move between worksheet and key.
- New `WorksheetCore.horizontalSize(facts)`, like `longDivisionSize`. Widths come from the biggest numbers on the sheet, in three columns (a × b, =, answer line), and reach the page as the CSS variables `--cols` and `--sign-pad`. Signs get 0.22 em of air on each side. The answer line is 0.6 em longer than the longest answer, for room to write. The page-only styles are `.horiz` in an inline style block in `index.html`, the times page's only one.
- Picking a layout resets the grid to that layout's starting size: Stacked 10 per row by 10 rows, One line 5 per row by 20 rows (100 problems on a page). Restoring saved settings on a visit does not reset anything. Both numbers can still be changed.
- On one line, the "Times-table number goes" buttons read "First" and "Second" instead of "On top" and "On bottom".
- Per-row cap: Stacked still allows up to 15. One line allows as many as fit at 11 pt or more: 6 for 0 to 10 facts, 5 for 99 × 99 = 9801, more for small numbers (7 for 4s times 1 to 10), never over 15. Over the cap, the message reads "Problems per row: use 1 to 6 on one line with these numbers."
- Sizes: 0 to 10 facts at 5 × 20 print at 14.1 pt on one page. 4s times 1 to 10 at 5 × 20 print at 15.8 pt, 1 to 12 at 6 × 20 at 11.8 pt, and 99 × 99 at 5 × 20 at 13.0 pt. Stacked 10 × 10 is unchanged at 13.8 pt.
- Answer key check: the table of printed forms gained `× horizontal` (parts a, sign, b, sign, answer, with × then =, both marked "sign"). `÷ horizontal` is refused as an unknown format.
- Tests: 33 Node tests pass (was 31). New core tests: `horizontalSize grows with the biggest numbers` and `one-line times tables fit 5 per row by 20 rows on one page`. The `pageSlices` test now covers the one-line size too. The read-back tests run on four printed forms, with 857 single-change mutations (214 stacked times tables, 217 one-line times tables, 214 stacked division, 212 long division). The one-line form adds three = sign cases: changed, missing, and signs out of order. `÷ horizontal` joined the unknown-format cases.
- Browser checks: 14 settings across both table positions, 1,822 answers, all right. Answer lines did not move between sheet and key, nothing overflowed its cell, and answers cleared the ends of their line by at least 0.31 em. Also checked: the cap message, the reset on a layout switch, the saved layout across a reload, a planted wrong answer (the key was left out and Print turned off), phone width (375 px, no sideways scroll), and the division page in both layouts (unaffected).
- Print checks (headless Chrome): 0 to 10 at 5 × 20 printed as 1 worksheet page and 1 key page on letter paper. 7s and 99s from 0 to 99 at 5 × 45 printed as 2 and 2. All 325 key answers were recomputed correctly from `pdftotext` output, and the worksheet pages had blank answer spots.
- Review pass (the user picked all four findings): fixed a bug where stacked mode briefly capped at 14 per row with the one-line message (the new cap now applies only to one line), used one name for the chosen tables, removed a text-align rule that did nothing, and reflowed two comment lines. Rechecked after.
- Regenerated `og-image.png` (1200x630, light mode, default settings, fresh profile, scrollbars hidden), since the panel gained the Layout control.

### Decisions

- The user asked for stacked or horizontal problems, and asked whether 5 per row by 20 rows fits (it does). 100 per page is mostly for 0 to 10 facts.
- The user chose `8 × 2 = ___` with an answer line over a bare `8 × 2`, and chose to reset the grid on a layout switch.
- "a × b" is one group, set right, the way most printed worksheets set it. A first version gave each factor its own fixed column, which left uneven gaps (`0 × 7    =` next to a cramped `0 × 10=`). One group keeps the spacing even and still lines up the = signs and answer lines.
- One line caps problems per row by width, so type stays at 11 pt or more. Stacked keeps its fixed 15.
- The sheet code still ignores the layout on purpose, so a key in one layout answers a worksheet in the other when the codes match, on both pages now.
- Built without a separate written plan.

### Files touched

- `index.html`, `og-image.png`, `worksheet-core.js`, `worksheet-ui.js` (comment only), `worksheet.css` (comment only), `tests/answer-key.test.js`, `tests/worksheet-core.test.js`, `README.md`, `TODO.md`, `PROGRESS.md`

### Next steps

- Commit and push after the user reviews (nothing is committed yet).
- Check the live times table page in both layouts with the answer key on.
- Print a one-line sheet on a real printer, and from iPhone Safari and an Android phone.

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
