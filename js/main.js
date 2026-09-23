(function () {
  var STORAGE_KEY = "meh-lab-lang";

  function openOverlay(id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove("hidden");
  }

  function closeOverlay(el) {
    var overlay = el.closest(".pub-overlay");
    if (overlay) overlay.classList.add("hidden");
  }

  document.addEventListener("click", function (e) {
    var toggle = e.target.closest(".toggle-overlay");
    if (toggle) {
      e.preventDefault();
      openOverlay(toggle.getAttribute("data-target"));
      return;
    }

    if (e.target.classList.contains("close-overlay")) {
      closeOverlay(e.target);
      return;
    }

    if (e.target.classList.contains("pub-overlay")) {
      e.target.classList.add("hidden");
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      document.querySelectorAll(".pub-overlay:not(.hidden)").forEach(function (el) {
        el.classList.add("hidden");
      });
    }
  });

  function applyI18nLabels(lang) {
    var dict = (window.MEH_I18N && window.MEH_I18N[lang]) || {};
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (dict[key] != null) el.textContent = dict[key];
    });
  }

  function applyLang(lang) {
    var dict = (window.MEH_I18N && window.MEH_I18N[lang]) || {};
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    document.body.setAttribute("data-lang", lang);

    applyI18nLabels(lang);

    document.querySelectorAll("[data-lang-set]").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-lang-set") === lang);
    });

    var page = document.body.getAttribute("data-page") || "home";
    var titleKey = {
      home: "pageTitleHome",
      people: "pageTitlePeople",
      publications: "pageTitlePublications",
      software: "pageTitleSoftware",
      teaching: "pageTitleTeaching",
      outings: "pageTitleOutings"
    }[page];
    if (titleKey && dict[titleKey]) document.title = dict[titleKey];

    if (window.MEH_syncPubAbstracts) window.MEH_syncPubAbstracts(lang);
    if (window.MEH_syncPeopleLang) window.MEH_syncPeopleLang(lang);
    if (window.MEH_syncSoftwareLang) window.MEH_syncSoftwareLang(lang);

    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (err) {
      /* ignore */
    }
  }

  window.MEH_applyI18nLabels = applyI18nLabels;

  document.querySelectorAll("[data-lang-set]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      applyLang(btn.getAttribute("data-lang-set"));
    });
  });

  var initial = "zh";
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "zh" || saved === "en") initial = saved;
  } catch (err) {
    /* ignore */
  }
  applyLang(initial);

  (function bindCvToggle() {
    var btn = document.querySelector(".pi-cv-toggle");
    var panel = document.getElementById("pi-cv");
    if (!btn || !panel) return;
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", open ? "false" : "true");
      panel.hidden = open;
      if (!open) panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  })();

  if (window.MEH_loadPublications) {
    window.MEH_loadPublications().then(function () {
      if (window.MEH_updatePubCounts) window.MEH_updatePubCounts();
    });
  } else if (window.MEH_updatePubCounts) {
    window.MEH_updatePubCounts();
  }

  if (window.MEH_loadPeople) {
    window.MEH_loadPeople();
  }

  if (window.MEH_loadSoftware) {
    window.MEH_loadSoftware();
  }

  (function loadHomePubs() {
    var list = document.getElementById("home-pubs");
    if (!list) return;

    function esc(text) {
      var d = document.createElement("div");
      d.textContent = text == null ? "" : String(text);
      return d.innerHTML;
    }

    fetch("data/highlights.json")
      .then(function (res) { return res.json(); })
      .then(function (entries) {
        return Promise.all(entries.map(function (entry) {
          var file = typeof entry === "string" ? entry : entry.file;
          var figure = typeof entry === "string" ? "" : (entry.figure || "");
          return fetch(file).then(function (res) { return res.json(); }).then(function (pub) {
            pub.figure = figure;
            return pub;
          });
        }));
      })
      .then(function (pubs) {
        function itemHtml(pub) {
          var title = esc(pub.title || "");
          if (pub.doi) {
            title = '<a href="' + esc(pub.doi) + '" target="_blank" rel="noopener">' + title + "</a>";
          }
          return (
            "<li><p class=\"home-pub-title\">" + title + "</p>" +
            '<p class="home-pub-meta">' + esc(pub.authors || "") + " " + esc(pub.citation || "") + "</p></li>"
          );
        }

        var lead = pubs.slice(0, 3);
        var rest = pubs.slice(3);
        var first = lead[0] || {};
        var image = (first.figure || "").trim();
        var img = image ? '<img src="' + esc(image) + '" alt="" />' : "";
        if (img && first.doi) {
          img = '<a href="' + esc(first.doi) + '" target="_blank" rel="noopener">' + img + "</a>";
        }
        var figure = '<div class="home-pub-figure">' + img + "</div>";
        var side = lead.map(itemHtml).join("");
        var below = rest.map(itemHtml).join("");
        list.innerHTML =
          '<div class="home-pub-feature">' + figure +
          '<ul class="home-pub-side">' + side + "</ul></div>" +
          '<ul class="home-pub-list">' + below + "</ul>";
      })
      .catch(function () {
        list.innerHTML = "";
      });
  })();

  document.querySelectorAll("[data-empty-for]").forEach(function (el) {
    var list = document.querySelector(el.getAttribute("data-empty-for"));
    if (!list) return;
    var n = list.querySelectorAll(".pub-item, .person-card").length;
    el.hidden = n > 0;
  });
})();
