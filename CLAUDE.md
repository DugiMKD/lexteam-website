# LexTeam website (lexteam.mk)

This repository is the **single source of truth** for lexteam.mk. **The repository is PUBLIC** (since 24.11.2026; Netlify's free plan builds private repos only for a single contributor): never commit passwords, API keys, form submissions or other private data. The folder `site/` is exactly what is published. Netlify (project `splendorous-frangipane-c2dfe6`, team ivan-bres) serves `site/` as configured in `netlify.toml`.

Owner: Ivan Breshkovski. Talk to him in **Macedonian**, plainly. He is a lawyer, not a developer. The full working guide (both websites, history, open points) is `LEXTEAM-UPATSTVO-ZA-CLAUDE.md` on his Google Drive (account breshkovskylaw@gmail.com); read it before larger work.

## Workflow (both the office computer and cloud sessions)
1. `git pull` first. Never start from a local copy, a zip, or the old folder `C:\Users\ivanb\Downloads\web page ivan\Ivan Website\`: publishing from an old copy erased changes on 23.11.2026.
2. Edit files in `site/` directly (the old Node generator is retired; its output is what lives here).
3. Check the changed pages in a browser in all three languages (`?lang=mk|en|sq`) and at phone width (no horizontal scroll).
4. Show Ivan what changes; publish only after he says **„објави“**.
5. Commit and push to `main`. **Netlify is linked to this repository (since 24.11.2026): every push to `main` publishes the site automatically.** Do not deploy with the Netlify CLI, drag and drop or the API any more; a manual deploy bypasses the repository and the next push overwrites it. For a preview before „објави“, push to another branch (Netlify builds a branch/deploy preview) or show local screenshots.
6. Write a line in the changelog of the Drive guide.

When you change `site/css/styles.css` or `site/js/i18n.js`, update the `?v=` version in every HTML file that links them (CSS and JS are cached for 7 days).

## Hard rules
1. **No em dashes (U+2014)** anywhere in the site.
2. **Every visible string exists in Macedonian, English and Albanian** (`data-lang-block` spans, `js/i18n.js` keys).
3. **Bar Association Code, art. 5**: no client names, case showcases, results, prices, testimonials or self-praise on lexteam.mk.
4. **No tracking cookies.** Maps and video load only after a click.
5. **Blog posts**: the goal is that readers contact LexTeam, not do procedures themselves. Never write "you can do it yourself". End every post with the contact call (form, +389 75 851 918, info@lexteam.mk); the disclaimer comes from `blog.disclaimer`.
6. **Every blog post has its own topic illustration** in the site's flat style (green brand colours: #127B65 background, #0A0F1A ink, #2DD4AF accent), saved as `assets/img/<slug>-ilustracija.webp` (1400x788), `-sm.webp` (720x405) and `-og.jpg` (1200x630). The same illustration in blue goes on breshkovski-law.mk.
7. A new post must also be added to: `blog/index.html` (feature + cards), `index.html` (3 latest), the area page's "Поврзани водичи", `sitemap.xml`, `blog/feed.xml`, `llms.txt`, and the previous post's pager.

## Decisions by Ivan (keep them)
- Under the logo: "Адвокатска канцеларија" / "Law office" / "Zyrë avokatore" (`logo.tag`).
- No "Адвокатски тим · Скопје" line above the home title.
- Buttons say "Закажи консултација" (never "бесплатна").
- Team phones: Ivan +389 75 851 918, Neda +389 77 699 411.
