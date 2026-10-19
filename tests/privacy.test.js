// Tests that hold the site to what privacy/index.html promises: the pages load
// nothing from other sites, the scripts make no network calls and set no
// cookies, and the storage keys the privacy page lists are the ones the pages
// use. These read the files as text, so a change that breaks a promise fails
// here before it ships. Run with: node --test tests/*.test.js
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const PAGES = ["index.html", "division/index.html", "privacy/index.html"];
const SCRIPTS = ["worksheet-core.js", "worksheet-ui.js"];

/** Inline <script> blocks of a page, so page code is checked like the shared scripts. */
const inlineScripts = (html) => [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);

test("pages load nothing from another site", () => {
  for (const file of PAGES) {
    const html = read(file);
    // Anything the browser fetches as it builds the page: stylesheets,
    // preconnects, icons, scripts, images, frames, and media.
    const tags = html.match(/<(link|script|img|iframe|source|video|audio|embed|object)\b[^>]*>/gi) || [];
    for (const tag of tags) {
      assert.doesNotMatch(tag, /\b(href|src|srcset|data)\s*=\s*["']?\s*(https?:)?\/\//i, `${file}: ${tag}`);
    }
    // Inline styles can fetch too.
    for (const css of html.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || []) {
      assert.doesNotMatch(css, /url\(\s*["']?\s*(https?:)?\/\/|@import/i, `${file}: inline style`);
    }
  }
});

test("the stylesheet fetches only this site's own font files, and they exist", () => {
  const css = read("worksheet.css");
  assert.doesNotMatch(css, /@import/i);
  const urls = [...css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)].map((m) => m[1]);
  assert.equal(urls.length, 4, "two weights of each of two fonts");
  for (const url of urls) {
    assert.match(url, /^fonts\/[\w-]+\.woff2$/, url);
    assert.ok(fs.existsSync(path.join(root, url)), `${url} is missing`);
  }
  // The SIL Open Font License must ship with the fonts.
  for (const license of ["fonts/OFL-Andika.txt", "fonts/OFL-AtkinsonHyperlegible.txt"]) {
    assert.match(read(license), /SIL OPEN FONT LICENSE Version 1\.1/i, license);
  }
});

test("no script makes a network call or touches cookies", () => {
  const sources = [
    ...SCRIPTS.map((file) => [file, read(file)]),
    ...PAGES.flatMap((file) => inlineScripts(read(file)).map((js) => [file + " (inline script)", js]))
  ];
  const banned = /\b(fetch|XMLHttpRequest|sendBeacon|WebSocket|EventSource|importScripts|navigator\.serviceWorker|document\.cookie|cookieStore)\b|new\s+Image\s*\(|\bimport\s*\(/;
  for (const [name, js] of sources) assert.doesNotMatch(js, banned, name);
});

test("the privacy page lists exactly the storage keys the pages use", () => {
  const used = ["index.html", "division/index.html"].map((file) => {
    const m = /storeKey:\s*"([^"]+)"/.exec(read(file));
    assert.ok(m, `${file} has a storeKey`);
    return m[1];
  });
  const privacy = read("privacy/index.html");
  const listed = [...privacy.matchAll(/<code>([\w-]+:v\d+)<\/code>/g)].map((m) => m[1]);
  assert.deepEqual(listed.sort(), used.sort());
  // Storage happens in one place, the shared UI script's save and restore.
  const storageUses = (read("worksheet-ui.js").match(/localStorage/g) || []).length;
  assert.equal(storageUses, 2, "one write and one read");
  for (const file of [...PAGES, "worksheet-core.js"]) {
    for (const js of file.endsWith(".js") ? [read(file)] : inlineScripts(read(file))) {
      assert.doesNotMatch(js, /localStorage|sessionStorage|indexedDB/, file);
    }
  }
});

test("both worksheet pages link to the privacy page", () => {
  assert.match(read("index.html"), /<a href="privacy\/">Privacy and data<\/a>/);
  assert.match(read("division/index.html"), /<a href="\.\.\/privacy\/">Privacy and data<\/a>/);
});
