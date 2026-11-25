#!/usr/bin/env node
/* LexTeam: builds the published site in dist/ from the trilingual source in site/.

   The source pages hold all three languages (data-lang-block spans, data-i18n keys).
   This script writes one static page per language, so search engines see each language
   at its own address:
     /page.html      Macedonian
     /en/page.html   English
     /sq/page.html   Albanian
   Each output page contains only its own language, with the right <html lang>, title,
   description, canonical and hreflang links. Netlify runs it on every deploy
   (netlify.toml: command = "node tools/build-lang.js", publish = "dist").
   Local check: node tools/build-lang.js && python3 -m http.server -d dist 8765
   No dependencies: plain Node.js. */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "site");
const OUT = path.join(ROOT, "dist");
const BASE = "https://lexteam.mk";
const LANGS = ["mk", "en", "sq"];
const PREFIX = { mk: "", en: "en/", sq: "sq/" };
const LOCALE = { mk: "mk_MK", en: "en_GB", sq: "sq_AL" };
const MONTHS = {
  mk: ["јануари", "февруари", "март", "април", "мај", "јуни", "јули", "август", "септември", "октомври", "ноември", "декември"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  sq: ["janar", "shkurt", "mars", "prill", "maj", "qershor", "korrik", "gusht", "shtator", "tetor", "nëntor", "dhjetor"]
};
const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);

// ---------- translations from js/i18n.js
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(SRC, "js/i18n.js"), "utf8"), sandbox);
const DICT = sandbox.window.LEX_I18N;
const t = (lang, key) => (DICT[lang] && DICT[lang][key]) || (DICT.mk && DICT.mk[key]) || "";

// ---------- small HTML helpers (the source is our own, well-formed markup)
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s) => esc(s).replace(/"/g, "&quot;");
const unescAttr = (s) => String(s).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

/* End index of the element whose start tag begins at `start` (index just after its closing tag). */
function elementEnd(html, start) {
  const open = /^<([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*>/.exec(html.slice(start));
  if (!open) throw new Error("not a start tag at " + start);
  const name = open[1].toLowerCase();
  let i = start + open[0].length;
  if (VOID.has(name) || open[0].endsWith("/>")) return i;
  const re = new RegExp("<(/?)" + name + "\\b[^>]*>", "gi");
  re.lastIndex = i;
  let depth = 1, m;
  while ((m = re.exec(html))) {
    if (m[1]) { if (--depth === 0) return re.lastIndex; }
    else if (!m[0].endsWith("/>")) depth++;
  }
  throw new Error("unclosed <" + name + "> at " + start);
}
const startTag = (html, start) => html.slice(start, html.indexOf(">", start) + 1);
const attr = (tag, name) => { const m = new RegExp("\\s" + name + '="([^"]*)"').exec(tag); return m ? unescAttr(m[1]) : null; };
function setAttr(tag, name, val) {
  const re = new RegExp("(\\s" + name + '=")[^"]*(")');
  if (re.test(tag)) return tag.replace(re, (_, a, b) => a + escAttr(val) + b);
  return tag.replace(/(\/?>)$/, " " + name + '="' + escAttr(val) + '"$1');
}
const dropAttr = (tag, name) => tag.replace(new RegExp("\\s" + name + '(="[^"]*")?(?=[\\s/>])'), "");

/* Replace the inner content of every element carrying attribute `name`. fn(tag) returns new inner HTML or null. */
function replaceInner(html, name, fn) {
  const re = new RegExp("<[a-zA-Z][a-zA-Z0-9-]*\\b[^>]*\\s" + name + '="[^"]*"[^>]*>', "g");
  let out = "", pos = 0, m;
  while ((m = re.exec(html))) {
    const tag = m[0];
    const inner = fn(tag);
    if (inner === null) continue;
    const s = m.index, e = elementEnd(html, s);
    const close = html.lastIndexOf("</", e - 1);
    out += html.slice(pos, s) + tag + inner + html.slice(close, e);
    pos = e;
    re.lastIndex = e;
  }
  return out + html.slice(pos);
}

/* Keep one language of each group of data-lang-block siblings; fall back to Macedonian. */
function pickBlocks(html, lang) {
  const re = /<[a-zA-Z][a-zA-Z0-9-]*\b[^>]*\sdata-lang-block="([a-z]+)"[^>]*>/g;
  const blocks = [];
  let m;
  while ((m = re.exec(html))) {
    const e = elementEnd(html, m.index);
    blocks.push({ s: m.index, e, lang: m[1], tag: m[0] });
    re.lastIndex = m.index + m[0].length; // nested blocks are not used, but stay safe
  }
  // group: consecutive blocks separated only by whitespace
  const groups = [];
  blocks.forEach((b) => {
    const g = groups[groups.length - 1];
    if (g && b.s >= g[g.length - 1].e && /^\s*$/.test(html.slice(g[g.length - 1].e, b.s))) g.push(b);
    else groups.push([b]);
  });
  let out = "", pos = 0;
  groups.forEach((g) => {
    const show = g.some((b) => b.lang === lang) ? lang : g.some((b) => b.lang === "mk") ? "mk" : g[0].lang;
    out += html.slice(pos, g[0].s);
    const kept = g.find((b) => b.lang === show);
    let tag = dropAttr(kept.tag, "hidden");
    out += tag + html.slice(kept.s + kept.tag.length, kept.e);
    pos = g[g.length - 1].e;
  });
  return out + html.slice(pos);
}

// ---------- URLs
const pageUrl = (rel, lang) => BASE + "/" + PREFIX[lang] + rel.replace(/(^|\/)index\.html$/, "$1");
const isPage = (p) => /\.html$/.test(p) || p.endsWith("/") || p === "" || p === "." || p === "..";

/* In /en/ and /sq/ pages, links to files (css, js, images, pdf, feed) point to the shared root copy. */
function absolutize(html, rel) {
  const dir = path.posix.dirname("/" + rel);
  const fix = (u) => {
    if (!u || /^([a-z]+:|\/|#|\?|data:)/i.test(u)) return u;
    const [p, rest] = u.split(/(?=[?#])/);
    if (isPage(p)) return u;
    return path.posix.normalize(path.posix.join(dir, p)) + (rest || "");
  };
  html = html.replace(/(\s(?:href|src|poster|data-src)=")([^"]*)(")/g, (_, a, u, b) => a + fix(u) + b);
  html = html.replace(/(\ssrcset=")([^"]*)(")/g, (_, a, v, b) => a + v.split(",").map((part) => {
    const [u, ...d] = part.trim().split(/\s+/);
    return [fix(u), ...d].join(" ");
  }).join(", ") + b);
  html = html.replace(/url\((["']?)([^)"']+)\1\)/g, (_, q, u) => "url(" + q + fix(u) + q + ")");
  return html;
}

// ---------- pages whose main text exists in one language only (media articles, publications)
function soleLanguage(src) {
  // returns the language of a page whose main text exists in one language only, else null
  if (!/<div class="prose"/.test(src)) return null;
  if (/<div class="prose"[^>]*data-lang-block=/.test(src)) return null;
  const m = /<div class="prose" lang="([a-z]+)"/.exec(src);
  return m ? m[1] : null;
}

/* Share of Cyrillic words in <main>: a page translated only in its frame (menus) but not in its text. */
function cyrillicShare(html) {
  const m = /<main\b[\s\S]*<\/main>/.exec(html);
  const text = (m ? m[0] : html).replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ");
  const words = text.match(/[\p{L}]{3,}/gu) || [];
  const cyr = words.filter((w) => /[\u0400-\u04FF]/.test(w)).length;
  return words.length ? cyr / words.length : 0;
}

function buildPage(src, rel, lang, sole) {
  let h = src;
  // the indexable version of a one-language article is the one whose interface matches it
  const home = sole === "en" ? "en" : "mk";
  const indexable = !sole || lang === home;

  h = pickBlocks(h, lang);
  h = replaceInner(h, "data-i18n", (tag) => { const v = t(lang, attr(tag, "data-i18n")); return v ? esc(v) : null; });
  h = replaceInner(h, "data-i18n-html", (tag) => t(lang, attr(tag, "data-i18n-html")) || null);
  const ogAlt = /<meta property="og:image:alt" content="([^"]*)">/.exec(h);
  if (ogAlt && lang !== "mk") {
    const img = [...h.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]).find((tag) => attr(tag, "alt") === unescAttr(ogAlt[1]) && attr(tag, "data-alt-" + lang));
    if (img) h = h.replace(ogAlt[0], '<meta property="og:image:alt" content="' + escAttr(attr(img, "data-alt-" + lang)) + '">');
  }
  if (lang !== "mk") h = h.replace('title="LexTeam Блог"', 'title="LexTeam Blog"');
  h = h.replace(/<img\b[^>]*\sdata-alt-en="[^"]*"[^>]*>/g, (tag) => {
    const v = lang === "mk" ? attr(tag, "alt") : attr(tag, "data-alt-" + lang);
    return v === null ? tag : setAttr(tag, "alt", v);
  });
  h = h.replace(/(<time\b[^>]*\sdatetime="(\d{4})-(\d{2})-(\d{2})"[^>]*>)[^<]*(<\/time>)/g,
    (_, a, y, mo, d, b) => a + parseInt(d, 10) + " " + MONTHS[lang][parseInt(mo, 10) - 1] + " " + y + b);
  h = h.replace(/<([a-z]+)\b[^>]*\sdata-post-lang="([a-z]+)"[^>]*>/g, (tag, n, pl) => (pl === lang ? tag : dropAttr(tag, "hidden")));

  // <html lang>, title, description
  h = h.replace(/<html lang="[a-z]+"/, '<html lang="' + lang + '" data-built');
  const body = /<body\b[^>]*>/.exec(h)[0];
  let title = attr(body, "data-title-" + lang) || attr(body, "data-title-mk");
  let desc = attr(body, "data-desc-" + lang) || attr(body, "data-desc-mk");
  if (!title && attr(body, "data-page") !== "sub") { title = t(lang, "meta.title"); desc = t(lang, "meta.desc"); }
  if (title) {
    h = h.replace(/<title>[^<]*<\/title>/, "<title>" + esc(title) + "</title>");
    h = h.replace(/(<meta (?:property="og:title"|name="twitter:title") content=")[^"]*/g, "$1" + escAttr(title));
  }
  if (desc) h = h.replace(/(<meta (?:name="description"|property="og:description"|name="twitter:description") content=")[^"]*/g, "$1" + escAttr(desc));

  // canonical, hreflang, og
  const self = pageUrl(rel, lang);
  const canon = indexable ? self : pageUrl(rel, home);
  h = h.replace(/<link rel="canonical" href="[^"]*">/, '<link rel="canonical" href="' + canon + '">');
  h = h.replace(/\s*<link rel="alternate" hreflang="[^"]*" href="[^"]*">/g, "");
  const alts = sole ? "" : LANGS.map((l) => '\n  <link rel="alternate" hreflang="' + l + '" href="' + pageUrl(rel, l) + '">').join("") +
    '\n  <link rel="alternate" hreflang="x-default" href="' + pageUrl(rel, "mk") + '">';
  h = h.replace(/(<link rel="canonical" href="[^"]*">)/, "$1" + alts);
  if (!indexable) h = h.replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex, follow">');
  h = h.replace(/(<meta property="og:url" content=")[^"]*/, "$1" + self);
  h = h.replace(/\s*<meta property="og:locale(?::alternate)?" content="[^"]*">/g, "");
  h = h.replace(/(<meta property="og:site_name" content="[^"]*">)/, "$1\n  <meta property=\"og:locale\" content=\"" + LOCALE[lang] + "\">" +
    LANGS.filter((l) => l !== lang).map((l) => '\n  <meta property="og:locale:alternate" content="' + LOCALE[l] + '">').join(""));

  if (lang !== "mk") {
    // structured data: page addresses in this language
    h = h.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/g, (_, a, j, b) =>
      a + j.replace(/https:\/\/lexteam\.mk\/(?!assets\/|en\/|sq\/)([^"#]*)/g, (u, p) => (isPage(p.replace(/\?.*$/, "")) || p === "" ? BASE + "/" + PREFIX[lang] + p : u))
        .replace(/"inLanguage":"mk"/g, '"inLanguage":"' + lang + '"') + b);
    h = absolutize(h, rel);
  }
  return h;
}

// ---------- sitemap: every indexable page in each language, with alternates
function buildSitemap(pages) {
  const src = fs.readFileSync(path.join(SRC, "sitemap.xml"), "utf8");
  const head = src.slice(0, src.indexOf("<url>")).replace(/\s*$/, "\n");
  const urls = [...src.matchAll(/  <url>[\s\S]*?<\/url>\n?/g)].map((m) => m[0]);
  const out = [];
  urls.forEach((u) => {
    const loc = /<loc>([^<]*)<\/loc>/.exec(u)[1];
    let rel = loc.replace(BASE + "/", "");
    if (rel === "" || rel.endsWith("/")) rel += "index.html";
    const info = pages[rel];
    const clean = u.replace(/\s*<xhtml:link [^>]*\/>/g, "").replace(/\n?$/, "\n");
    if (!info) { out.push(clean); return; }
    LANGS.forEach((l) => {
      if (info.sole && l !== info.home) return;
      let x = clean.replace(/<loc>[^<]*<\/loc>/, "<loc>" + pageUrl(rel, l) + "</loc>");
      if (!info.sole) {
        const links = LANGS.map((a) => '    <xhtml:link rel="alternate" hreflang="' + a + '" href="' + pageUrl(rel, a) + '"/>').join("\n") +
          '\n    <xhtml:link rel="alternate" hreflang="x-default" href="' + pageUrl(rel, "mk") + '"/>';
        x = x.replace(/(<\/(?:priority|lastmod)>)(?![\s\S]*<\/(?:priority|lastmod)>)/, "$1\n" + links);
      }
      out.push(x);
    });
  });
  return head + out.join("") + "</urlset>\n";
}

// ---------- run
function walk(dir, base = "") {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(path.join(dir, d.name), base + d.name + "/") : [base + d.name]);
}
fs.rmSync(OUT, { recursive: true, force: true });
const files = walk(SRC);
const pages = {};
let count = 0;
files.forEach((rel) => {
  const from = path.join(SRC, rel);
  if (!rel.endsWith(".html")) {
    fs.mkdirSync(path.dirname(path.join(OUT, rel)), { recursive: true });
    fs.copyFileSync(from, path.join(OUT, rel));
    return;
  }
  const src = fs.readFileSync(from, "utf8");
  let sole = soleLanguage(src);
  // English or Albanian version still mostly in Macedonian: only the Macedonian page is indexed
  if (!sole && ["en", "sq"].some((l) => cyrillicShare(buildPage(src, rel, l, null)) > 0.3)) sole = "mk";
  pages[rel] = { sole, home: sole === "en" ? "en" : "mk" };
  LANGS.forEach((lang) => {
    const to = path.join(OUT, PREFIX[lang], rel);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.writeFileSync(to, buildPage(src, rel, lang, sole));
    count++;
  });
});
fs.writeFileSync(path.join(OUT, "sitemap.xml"), buildSitemap(pages));
if (/—/.test(fs.readFileSync(path.join(OUT, "sitemap.xml"), "utf8"))) throw new Error("em dash");
console.log("build-lang: " + count + " pages in dist/ (" + Object.keys(pages).length + " x " + LANGS.length + ")");
