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

  if (window.MEH_loadPublications) {
    window.MEH_loadPublications().then(function () {
      if (window.MEH_updatePubCounts) window.MEH_updatePubCounts();
    });
  } else if (window.MEH_updatePubCounts) {
    window.MEH_updatePubCounts();
  } else {
    document.querySelectorAll("[data-empty-for]").forEach(function (el) {
      var list = document.querySelector(el.getAttribute("data-empty-for"));
      var n = list ? list.querySelectorAll(".pub-item, .person-card").length : 0;
      el.hidden = n > 0;
    });
  }
})();
