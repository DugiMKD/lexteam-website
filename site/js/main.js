(function () {
  "use strict";

  var dict = window.LEX_I18N || {};
  var LANGS = ["mk", "en", "sq"];
  var current = "mk";

  function store(key, val) {
    try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; }
  }

  function t(key) {
    return (dict[current] && dict[current][key]) || (dict.mk && dict.mk[key]) || "";
  }

  /* ---------- Language ---------- */
  function setLang(lang, persist) {
    if (LANGS.indexOf(lang) === -1) lang = "mk";
    current = lang;
    document.documentElement.lang = lang;

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var v = t(el.getAttribute("data-i18n"));
      if (v) el.textContent = v;
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      var v = t(el.getAttribute("data-i18n-html"));
      if (v) el.innerHTML = v; // trusted strings from i18n.js only
    });

    // Page title + description: per-page data-title-xx attributes, else the home page keys
    var body = document.body;
    var title = body.getAttribute("data-title-" + lang) || body.getAttribute("data-title-mk");
    var descText = body.getAttribute("data-desc-" + lang) || body.getAttribute("data-desc-mk");
    if (!title && body.dataset.page !== "sub") { title = t("meta.title"); descText = t("meta.desc"); }
    if (title) {
      document.title = title;
      [['meta[name="description"]', descText], ['meta[property="og:description"]', descText], ['meta[property="og:title"]', title]]
        .forEach(function (m) { var el = document.querySelector(m[0]); if (el && m[1]) el.setAttribute("content", m[1]); });
    }

    // Blocks written per language (case pages): show the current one, fall back to Macedonian
    var groups = {};
    document.querySelectorAll("[data-lang-block]").forEach(function (el) {
      var parent = el.parentNode;
      var key = parent.__lexKey || (parent.__lexKey = Math.random().toString(36).slice(2));
      (groups[key] = groups[key] || []).push(el);
    });
    Object.keys(groups).forEach(function (k) {
      var els = groups[k];
      var has = els.some(function (el) { return el.getAttribute("data-lang-block") === lang; });
      var show = has ? lang : "mk";
      els.forEach(function (el) { el.hidden = el.getAttribute("data-lang-block") !== show; });
    });

    document.querySelectorAll("img[data-alt-en]").forEach(function (img) {
      if (!img.hasAttribute("data-alt-mk")) img.setAttribute("data-alt-mk", img.getAttribute("alt") || "");
      img.setAttribute("alt", img.getAttribute("data-alt-" + lang) || img.getAttribute("data-alt-mk"));
    });

    document.querySelectorAll(".lang button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.lang === lang));
    });

    // Month names written out: not every browser ships Macedonian/Albanian date formats
    var MONTHS = {
      mk: ["јануари", "февруари", "март", "април", "мај", "јуни", "јули", "август", "септември", "октомври", "ноември", "декември"],
      en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      sq: ["janar", "shkurt", "mars", "prill", "maj", "qershor", "korrik", "gusht", "shtator", "tetor", "nëntor", "dhjetor"]
    }[lang];
    document.querySelectorAll("time[datetime]").forEach(function (el) {
      var p = (el.getAttribute("datetime") || "").split("-");
      if (p.length === 3) el.textContent = parseInt(p[2], 10) + " " + MONTHS[parseInt(p[1], 10) - 1] + " " + p[0];
    });
    document.querySelectorAll("[data-post-lang]").forEach(function (el) {
      el.hidden = el.getAttribute("data-post-lang") === lang;
    });

    if (persist) {
      store("lexteam-lang", lang);
      var url = new URL(location.href);
      url.searchParams.set("lang", lang);
      history.replaceState(null, "", url);
    }
  }

  document.querySelectorAll(".lang button").forEach(function (b) {
    b.addEventListener("click", function () { setLang(b.dataset.lang, true); });
  });

  var fromUrl = new URLSearchParams(location.search).get("lang");
  setLang(fromUrl || store("lexteam-lang") || "mk", false);

  /* ---------- Mobile nav ---------- */
  var burger = document.getElementById("burger");
  var nav = document.getElementById("nav");

  function closeNav() {
    nav.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("nav-open");
  }
  burger.addEventListener("click", function () {
    var open = !nav.classList.contains("is-open");
    nav.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("nav-open", open);
  });
  nav.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", closeNav); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeNav(); });

  /* ---------- Practice areas dropdown: tap to open (mobile, touch) ---------- */
  document.querySelectorAll(".nav__dd-toggle").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var item = btn.closest(".nav__item--dd");
      var open = !item.classList.contains("is-open");
      item.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
    });
  });

  /* ---------- Header shadow ---------- */
  var header = document.querySelector(".header");
  function onScroll() { header.classList.toggle("is-scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Filter tabs ---------- */
  document.querySelectorAll(".tabs").forEach(function (group) {
    var tabs = group.querySelectorAll(".tab");
    var box = group.nextElementSibling;
    if (!box) return;
    function apply(tab) {
      var f = tab.dataset.filter;
      tabs.forEach(function (x) {
        var on = x === tab;
        x.classList.toggle("is-active", on);
        x.setAttribute("aria-selected", String(on));
      });
      box.querySelectorAll("[data-cat]").forEach(function (item) {
        var cats = (item.dataset.cat || "").split(" ");
        item.classList.toggle("is-hidden", f !== "all" && cats.indexOf(f) === -1);
      });
    }
    tabs.forEach(function (tab) { tab.addEventListener("click", function () { apply(tab); }); });
    var pre = new URLSearchParams(location.search).get("cat");
    var preTab = pre && group.querySelector('[data-filter="' + pre.replace(/[^a-z-]/g, "") + '"]');
    if (preTab) apply(preTab);
  });

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".section__head, .tile, .person, .steps li, .card, .careers__inner, .contact > *, .pub, .area-card, .feature, .pub-row");
  if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { el.classList.add("reveal"); io.observe(el); });
  }

  /* ---------- Contact form: provider from js/config.js (netlify, web3forms or mailto) ---------- */
  var form = document.getElementById("contact-form");
  var status = document.getElementById("form-status");
  var formCfg = (window.LEX_CONFIG && window.LEX_CONFIG.form) || {};
  function setStatus(msg, kind) {
    status.textContent = msg;
    status.className = "form__status" + (kind ? " is-" + kind : "");
  }
  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    var bad = [];
    ["name", "email", "message", "consent"].forEach(function (n) {
      var el = form.elements[n];
      var ok = el.type === "checkbox" ? el.checked : el.value.trim() && el.checkValidity();
      el.classList.toggle("is-invalid", !ok);
      if (!ok) bad.push(el);
    });
    if (bad.length) {
      setStatus(t("f.err"), "error");
      bad[0].focus();
      return;
    }
    var f = form.elements;
    if (f["bot-field"] && f["bot-field"].value) return; // honeypot: bots fill hidden fields
    var area = f.area.value ? f.area.options[f.area.selectedIndex].text : "";
    if (f.language) f.language.value = current;
    var provider = formCfg.provider || "mailto";

    if (provider === "mailto" || (provider === "web3forms" && !formCfg.web3formsKey)) {
      var body = [f.name.value.trim(), f.email.value.trim(), f.phone.value.trim(), area, "", f.message.value.trim()]
        .filter(function (line, i) { return line || i === 4; }).join("\n");
      location.href = "mailto:" + (formCfg.fallbackEmail || "info@lexteam.mk") + "?subject=" + encodeURIComponent(t("f.subject")) + "&body=" + encodeURIComponent(body);
      setStatus(t("f.ok"), "ok");
      return;
    }

    var req;
    if (provider === "netlify") {
      var data = new URLSearchParams(new FormData(form));
      data.set("area", area);
      data.set("subject", t("f.subject"));
      req = fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: data.toString() })
        .then(function (r) { return r.ok; });
    } else {
      req = fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: formCfg.web3formsKey, subject: t("f.subject"), from_name: "LexTeam website",
          name: f.name.value.trim(), email: f.email.value.trim(), phone: f.phone.value.trim(),
          area: area, message: f.message.value.trim(), language: current.toUpperCase()
        })
      }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return r.ok && j.success !== false; }); });
    }

    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    setStatus(t("f.sending"));
    req
      .then(function (ok) {
        if (!ok) throw new Error("rejected");
        form.reset();
        setStatus(t("f.sent"), "ok");
      })
      .catch(function () { setStatus(t("f.fail"), "error"); })
      .then(function () { btn.disabled = false; });
  });

  /* ---------- Map: loads only after a click (no Google request before) ---------- */
  document.querySelectorAll(".map[data-map]").forEach(function (box) {
    var btn = box.querySelector(".map__load");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var f = document.createElement("iframe");
      f.src = box.getAttribute("data-map");
      f.title = "Google Maps";
      f.loading = "lazy";
      f.referrerPolicy = "no-referrer-when-downgrade";
      f.setAttribute("allowfullscreen", "");
      btn.replaceWith(f);
    });
  });

  /* ---------- Video: YouTube loads only after a click ---------- */
  document.querySelectorAll(".video[data-video]").forEach(function (box) {
    var btn = box.querySelector(".video__load");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var f = document.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + box.getAttribute("data-video") + "?autoplay=1&rel=0";
      f.title = "YouTube";
      f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      f.setAttribute("allowfullscreen", "");
      btn.replaceWith(f);
    });
  });

  /* ---------- Share: copy link ---------- */
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var done = btn.closest(".share") && btn.closest(".share").querySelector(".share__done");
      var show = function () { if (done) { done.hidden = false; setTimeout(function () { done.hidden = true; }, 2500); } };
      var url = btn.getAttribute("data-copy");
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(show, show);
      else { var i = document.createElement("input"); i.value = url; document.body.appendChild(i); i.select(); try { document.execCommand("copy"); } catch (e) {} i.remove(); show(); }
    });
  });

  /* ---------- Privacy notice: information only, shown once ---------- */
  var notice = document.getElementById("notice");
  if (notice && !store("lexteam-notice")) {
    notice.hidden = false;
    document.getElementById("notice-ok").addEventListener("click", function () {
      store("lexteam-notice", "1");
      notice.hidden = true;
    });
  }

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
