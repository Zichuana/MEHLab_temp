/* Load experimental bases from data/bases.json */
(function () {
  var DATA_URL = "data/bases.json";
  var cached = null;

  function esc(text) {
    var d = document.createElement("div");
    d.textContent = text == null ? "" : String(text);
    return d.innerHTML;
  }

  function pick(field, lang) {
    if (!field) return "";
    if (typeof field === "string") return field;
    return (lang === "zh" ? field.zh : field.en) || field.zh || field.en || "";
  }

  function photoLabel(lang) {
    var dict = (window.MEH_I18N && window.MEH_I18N[lang]) || {};
    return dict.photoPlaceholder || (lang === "zh" ? "照片" : "Photo");
  }

  function renderGallery(images, lang) {
    var label = esc(photoLabel(lang));
    var list = (images || []).filter(Boolean);
    if (!list.length) {
      return (
        '<div class="base-gallery">' +
        '<div class="base-photo">' +
        '<span class="base-photo-fallback">' +
        label +
        "</span></div></div>"
      );
    }
    return (
      '<div class="base-gallery">' +
      list
        .map(function (src) {
          return (
            '<div class="base-photo">' +
            '<img src="' +
            esc(src) +
            '" alt="" onerror="this.remove()" />' +
            '<span class="base-photo-fallback">' +
            label +
            "</span></div>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function renderBase(item, lang) {
    var location = pick(item.location, lang);
    return (
      '<article class="base-item" data-base-id="' +
      esc(item.id || "") +
      '">' +
      '<div class="base-body">' +
      '<h3 class="base-name">' +
      esc(pick(item.name, lang)) +
      "</h3>" +
      (location
        ? '<p class="base-location"><span class="contact-icon">📍</span> ' +
          esc(location) +
          "</p>"
        : "") +
      '<p class="base-desc">' +
      esc(pick(item.desc, lang)) +
      "</p>" +
      "</div>" +
      renderGallery(item.images, lang) +
      "</article>"
    );
  }

  function mount(list, lang) {
    var el = document.getElementById("bases-list");
    if (!el) return;
    if (!list || !list.length) {
      var dict = (window.MEH_I18N && window.MEH_I18N[lang]) || {};
      el.innerHTML =
        '<p class="pub-empty">' +
        esc(dict.basesEmpty || (lang === "zh" ? "暂无实验基地。" : "No experimental bases yet.")) +
        "</p>";
      return;
    }
    el.innerHTML = list
      .map(function (item) {
        return renderBase(item, lang);
      })
      .join("");
  }

  function syncBasesLang(lang) {
    if (!cached) return;
    mount(cached, lang || document.body.getAttribute("data-lang") || "zh");
  }

  function loadBases() {
    if (document.body.getAttribute("data-page") !== "bases") {
      return Promise.resolve();
    }

    return fetch(DATA_URL)
      .then(function (r) {
        if (!r.ok) throw new Error("Cannot load " + DATA_URL);
        return r.json();
      })
      .then(function (data) {
        cached = Array.isArray(data) ? data : [];
        syncBasesLang(document.body.getAttribute("data-lang") || "zh");
      })
      .catch(function (err) {
        console.error(err);
        var el = document.getElementById("bases-list");
        if (el) {
          el.innerHTML =
            '<p class="pub-load-error">Failed to load bases. Please open via a local HTTP server and check data/bases.json.</p>';
        }
      });
  }

  window.MEH_loadBases = loadBases;
  window.MEH_syncBasesLang = syncBasesLang;
})();
