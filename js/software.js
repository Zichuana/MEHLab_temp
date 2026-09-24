/* Load software cards from data/software.json */
(function () {
  var DATA_URL = "data/software.json";
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

  function renderCard(item, lang) {
    var links = (item.links || [])
      .filter(function (link) {
        return link && pick(link.label, lang);
      })
      .map(function (link) {
        var label = esc(pick(link.label, lang));
        var url = (link.url || "").trim();
        if (url) {
          return (
            '<a class="content-meta-link" href="' +
            esc(url) +
            '" target="_blank" rel="noopener">' +
            label +
            "</a>"
          );
        }
        return '<span class="content-meta-pending">' + label + "</span>";
      });

    return (
      '<article class="content-card">' +
      "<h3>" +
      esc(pick(item.title, lang)) +
      "</h3>" +
      "<p>" +
      esc(pick(item.desc, lang)) +
      "</p>" +
      (links.length
        ? '<div class="content-meta">' +
          links.join('<span class="content-meta-sep">;</span>') +
          "</div>"
        : "") +
      "</article>"
    );
  }

  function mount(list, lang) {
    var el = document.getElementById("software-list");
    if (!el) return;
    el.innerHTML = (list || [])
      .map(function (item) {
        return renderCard(item, lang);
      })
      .join("");
  }

  function syncSoftwareLang(lang) {
    if (!cached) return;
    mount(cached, lang || document.body.getAttribute("data-lang") || "zh");
  }

  function loadSoftware() {
    if (document.body.getAttribute("data-page") !== "software") {
      return Promise.resolve();
    }

    return fetch(DATA_URL)
      .then(function (r) {
        if (!r.ok) throw new Error("Cannot load " + DATA_URL);
        return r.json();
      })
      .then(function (data) {
        cached = data;
        syncSoftwareLang(document.body.getAttribute("data-lang") || "zh");
      })
      .catch(function (err) {
        console.error(err);
        var el = document.getElementById("software-list");
        if (el) {
          el.innerHTML = '<p class="pub-load-error">Failed to load software data.</p>';
        }
      });
  }

  window.MEH_loadSoftware = loadSoftware;
  window.MEH_syncSoftwareLang = syncSoftwareLang;
})();
