# LexTeam website (lexteam.mk)

This repository is the **single source of truth** for lexteam.mk. **The repository is PUBLIC** (since 24.11.2026; Netlify's free plan builds private repos only for a single contributor): never commit passwords, API keys, form submissions or other private data. The folder `site/` is the **source**: every page holds all three languages. On every deploy Netlify runs `node tools/build-lang.js`, which writes `dist/` (not in git) with one static page per language: `/page.html` (mk), `/en/page.html`, `/sq/page.html`, each with its own `<html lang>`, title, canonical, hreflang and sitemap entries (since 25.11.2026). Pages whose text exists only in Macedonian (most of `mediumi/`, `publikacii/`) get `noindex` in en/sq; an article written only in English is indexed at `/en/`. Netlify (project `splendorous-frangipane-c2dfe6`, team ivan-bres) publishes `dist/` as configured in `netlify.toml`.

Owner: Ivan Breshkovski. Talk to him in **Macedonian**, plainly. He is a lawyer, not a developer. The full working guide (both websites, history, open points) is `LEXTEAM-UPATSTVO-ZA-CLAUDE.md` on his Google Drive (account breshkovskylaw@gmail.com); read it before larger work.

## Workflow (both the office computer and cloud sessions)
1. `git pull` first. Never start from a local copy, a zip, or the old folder `C:\Users\ivanb\Downloads\web page ivan\Ivan Website\`: publishing from an old copy erased changes on 23.11.2026.
2. Edit files in `site/` directly (the old Node generator is retired; its output is what lives here).
3. Run `node tools/build-lang.js`, serve `dist/` (`python3 -m http.server -d dist 8765`) and check the changed pages in all three languages (`/`, `/en/`, `/sq/`) and at phone width (no horizontal scroll). Never edit `dist/`; edit `site/`.
4. Show Ivan what changes; publish only after he says **„објави“**.
5. Commit and push to `main`. **Netlify is linked to this repository (since 24.11.2026): every push to `main` publishes the site automatically.** Do not deploy with the Netlify CLI, drag and drop or the API any more; a manual deploy bypasses the repository and the next push overwrites it. For a preview before „објави“, push to another branch (Netlify builds a branch/deploy preview) or show local screenshots.
6. Write a line in the changelog of the Drive guide.

When you change `site/css/styles.css`, `site/js/main.js` or `site/js/i18n.js`, update the `?v=` version in every HTML file that links them (CSS and JS are cached for 7 days).

## Hard rules
1. **No em dashes (U+2014)** anywhere in the site.
2. **Every visible string exists in Macedonian, English and Albanian** (`data-lang-block` spans, `js/i18n.js` keys).
3. **Bar Association Code, art. 5**: no client names, case showcases, results, prices, testimonials or self-praise on lexteam.mk.
4. **No tracking cookies.** Maps and video load only after a click.
5. **Blog posts**: the goal is that readers contact LexTeam, not do procedures themselves. Never write "you can do it yourself". End every post with the contact call (form, +389 75 851 918, info@lexteam.mk); the disclaimer comes from `blog.disclaimer`.
6. **Every blog post has its own topic illustration** in the site's flat style (green brand colours: #127B65 background, #0A0F1A ink, #2DD4AF accent), saved as `assets/img/<slug>-ilustracija.webp` (1400x788), `-sm.webp` (720x405) and `-og.jpg` (1200x630). The same illustration in blue goes on breshkovski-law.mk.
7. A new post must also be added to: `blog/index.html` (feature + cards), `index.html` (3 latest), the area page's "Поврзани водичи", `sitemap.xml`, `blog/feed.xml`, `llms.txt`, and the previous post's pager.

## Blog posts: Ivan's rules (23.11.2026, apply on every computer and in every session)
- **Only when Ivan asks.** Never create scheduled or automatic tasks that write blog posts. The only scheduled task he wants is the weekly reminder for Google and Bing indexing (Sunday 21:00); create no other recurring tasks without his explicit order.
- **Review first, as a Google Doc in Macedonian only.** Every draft goes to Ivan as a Google Doc (Drive account breshkovskylaw@gmail.com, title `НАЦРТ блог: <MK title> (<date>, МК, верзија N)`) so he can share it with colleagues. No EN/SQ in the review Doc: translate to English and Albanian only after „објави“, from the final approved Macedonian text. Before publishing, read the Doc with its comments and apply them.
- **Old review versions:** there is no editor for existing Docs, so every change means a new Doc ("верзија N+1"). After creating and checking it, move the previous review version(s) of that draft to the Drive trash without asking, and tell Ivan in one line. Only review Docs Claude made for that draft.
- **Basic information only.** No step-by-step instructions, deadlines or forms that let a reader run the procedure alone ("не да ги учиме целосно"). Where a procedure is described, recommend consulting a lawyer, not "check the law yourself".
- **No sources line in published posts.** Keep the sources only internally (in the review Doc as "Извори: само за проверка, не се објавуваат").
- **Quoting and copyright.** Only laws may be quoted word for word, and citing articles is encouraged: quote key provisions exactly in „...“ and put the article after statements based on the law. **Every article citation names its law, every time**: „(член 39 од Законот за семејството)“, „Според член 40 од Законот за семејството: „...““ (EN „Article 39 of the Law on Family“, SQ „neni 39 i Ligjit për familjen“). Check every quote against the law text. Anything from a handbook, book or article is reworded in our own words, never copied.
- **No "not legal advice" sentence inside the post text**: the standard note (`blog.disclaimer`) is printed under every post; add it at the end of the review Doc too.
- **Sources for content:** handbooks, guides and publications of institutions (courts, academy, ministries, OSCE, Council of Europe, NGOs) and the laws (Drive folder „КНИГИ И ПРИРАЧНИЦИ“, the Law on Family etc. are on Drive). Never court decisions, client or case documents, other law firms' or news articles.
- **Both sites:** when Ivan wants a post on breshkovski-law.mk too, publish it in WordPress (wp-admin > Posts > Add Post, classic editor, **Code** tab with the MK HTML, category „Блог“, language „македонски јазик“, contact link https://breshkovski-law.mk/kontakti/, disclaimer at the end, blue illustration as Featured image), then check the live URL. Claude never types passwords: on the office computer Ivan signs in himself in the app's Browser pane; cloud sessions use the REST access described in the Drive guide.

## Decisions by Ivan (keep them)
- Under the logo: "Адвокатска канцеларија" / "Law office" / "Zyrë avokatore" (`logo.tag`).
- No "Адвокатски тим · Скопје" line above the home title.
- Buttons say "Закажи консултација" (never "бесплатна").
- Team phones: Ivan +389 75 851 918, Neda +389 77 699 411.
