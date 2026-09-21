/* Load publication cards from publications/*.json via publications/index.json */
(function () {
  var INDEX_URL = "publications/index.json";

  function esc(text) {
    var d = document.createElement("div");
    d.textContent = text == null ? "" : String(text);
    return d.innerHTML;
  }

  function syncAbstractLang(lang) {
    document.querySelectorAll("[data-abstract-en]").forEach(function (el) {
      var en = el.getAttribute("data-abstract-en") || "";
      var zh = el.getAttribute("data-abstract-zh") || "";
      el.textContent = lang === "zh" && zh ? zh : en || zh;
    });
  }

  function renderCard(pub, index) {
    var id = pub.id || "pub-" + index;
    var parity = index % 2 === 0 ? "pub-odd" : "pub-even";
    var doi = pub.doi || "";
    var image = (pub.image || "").trim();
    var hasAbs = !!(pub.abstract && (pub.abstract.en || pub.abstract.zh));
    var hasBib = !!(pub.bibtex && String(pub.bibtex).trim());
    var urlsId = "urls-" + id;
    var absId = "abs-" + id;
    var bibId = "bib-" + id;

    var thumbHtml =
      '<div class="pub-thumb-frame">' +
      (image
        ? '<img src="' +
          esc(image) +
          '" alt="" class="pub-thumb" onerror="this.remove()" />'
        : "") +
      '<span class="pub-thumb-placeholder">Cover</span></div>';

    var actions = "";
    if (doi) {
      actions +=
        '<button class="action-btn toggle-overlay" data-target="' +
        urlsId +
        '" title="Links" type="button">🔗</button>';
    }
    if (hasAbs) {
      actions +=
        '<button class="action-btn toggle-overlay" data-target="' +
        absId +
        '" title="Abstract" type="button">☰</button>';
    }
    if (hasBib) {
      actions +=
        '<button class="action-btn toggle-overlay" data-target="' +
        bibId +
        '" title="Cite" type="button">❞</button>';
    }

    var titleHtml = doi
      ? '<a href="' + esc(doi) + '" target="_blank" rel="noopener">' + esc(pub.title || "") + "</a>"
      : esc(pub.title || "");

    var overlays = "";
    if (doi) {
      overlays +=
        '<div id="' +
        urlsId +
        '" class="pub-overlay hidden"><div class="overlay-content">' +
        '<button class="close-overlay" type="button">&times;</button>' +
        '<h3 data-i18n="linksTitle">Links</h3>' +
        '<ul class="overlay-links-list"><li><a href="' +
        esc(doi) +
        '" target="_blank" rel="noopener">' +
        esc(doi) +
        "</a></li></ul></div></div>";
    }
    if (hasAbs) {
      overlays +=
        '<div id="' +
        absId +
        '" class="pub-overlay hidden"><div class="overlay-content">' +
        '<button class="close-overlay" type="button">&times;</button>' +
        '<h3 data-i18n="absTitle">Abstract</h3>' +
        '<p class="abstract-text" data-abstract-en="' +
        esc(pub.abstract.en || "") +
        '" data-abstract-zh="' +
        esc(pub.abstract.zh || "") +
        '"></p></div></div>';
    }
    if (hasBib) {
      overlays +=
        '<div id="' +
        bibId +
        '" class="pub-overlay hidden"><div class="overlay-content">' +
        '<button class="close-overlay" type="button">&times;</button>' +
        '<h3 data-i18n="bibTitle">BibTeX</h3>' +
        '<pre class="bibtex-box"><code>' +
        esc(pub.bibtex) +
        "</code></pre></div></div>";
    }

    return (
      '<li class="pub-item ' +
      parity +
      '" data-pub-id="' +
      esc(id) +
      '">' +
      '<div class="pub-thumbnail-col">' +
      thumbHtml +
      "</div>" +
      '<div class="pub-content-col">' +
      '<p class="pub-authors">' +
      esc(pub.authors || "") +
      "</p>" +
      '<h2 class="pub-title">' +
      titleHtml +
      "</h2>" +
      '<p class="pub-citation">' +
      esc(pub.citation || "") +
      "</p>" +
      "</div>" +
      '<div class="pub-actions-col">' +
      actions +
      "</div>" +
      overlays +
      "</li>"
    );
  }

  function updateCounts() {
    document.querySelectorAll("[data-pub-count]").forEach(function (el) {
      var list = document.querySelector(el.getAttribute("data-pub-count"));
      el.textContent = list ? list.querySelectorAll(".pub-item").length : 0;
    });
    document.querySelectorAll("[data-empty-for]").forEach(function (el) {
      var list = document.querySelector(el.getAttribute("data-empty-for"));
      var n = list ? list.querySelectorAll(".pub-item, .person-card").length : 0;
      el.hidden = n > 0;
    });
  }

  function showPanel(name) {
    document.querySelectorAll(".pub-filter").forEach(function (btn) {
      var on = btn.getAttribute("data-pub-panel") === name;
      btn.classList.toggle("active", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
    document.querySelectorAll(".pub-panel").forEach(function (panel) {
      var on = panel.id === "panel-" + name;
      panel.hidden = !on;
    });
  }

  function bindFilters() {
    document.querySelectorAll(".pub-filter").forEach(function (btn) {
      btn.addEventListener("click", function () {
        showPanel(btn.getAttribute("data-pub-panel"));
      });
    });
  }

  function mount(pubs) {
    var journalEl = document.getElementById("journal-pub-list");
    var preprintEl = document.getElementById("preprint-list");
    if (!journalEl || !preprintEl) return;

    var journals = [];
    var preprints = [];
    (pubs || []).forEach(function (p) {
      if ((p.type || "journal") === "preprint") preprints.push(p);
      else journals.push(p);
    });

    journalEl.innerHTML = journals
      .map(function (p, i) {
        return renderCard(p, i);
      })
      .join("");
    preprintEl.innerHTML = preprints
      .map(function (p, i) {
        return renderCard(p, i);
      })
      .join("");

    var lang = document.body.getAttribute("data-lang") || "zh";
    syncAbstractLang(lang);
    if (window.MEH_applyI18nLabels) window.MEH_applyI18nLabels(lang);
    updateCounts();
  }

  function loadPublications() {
    if (document.body.getAttribute("data-page") !== "publications") {
      return Promise.resolve();
    }

    bindFilters();

    return fetch(INDEX_URL)
      .then(function (r) {
        if (!r.ok) throw new Error("Cannot load " + INDEX_URL);
        return r.json();
      })
      .then(function (files) {
        if (!Array.isArray(files) || !files.length) {
          mount([]);
          return;
        }
        return Promise.all(
          files.map(function (name) {
            return fetch("publications/" + name).then(function (r) {
              if (!r.ok) throw new Error("Cannot load publications/" + name);
              return r.json();
            });
          })
        ).then(mount);
      })
      .catch(function (err) {
        console.error(err);
        var journalEl = document.getElementById("journal-pub-list");
        if (journalEl) {
          journalEl.innerHTML =
            '<li class="pub-load-error">Failed to load publications. Please open the site via a local HTTP server (not file://) and check publications/index.json.</li>';
        }
        updateCounts();
      });
  }

  window.MEH_syncPubAbstracts = syncAbstractLang;
  window.MEH_loadPublications = loadPublications;
  window.MEH_updatePubCounts = updateCounts;
})();
