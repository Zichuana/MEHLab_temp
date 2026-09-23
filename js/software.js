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
        return link && link.url;
      })
      .map(function (link) {
        return (
          '<a href="' +
          esc(link.url) +
          '" target="_blank" rel="noopener">' +
          esc(pick(link.label, lang)) +
          "</a>"
        );
      })
      .join("");

    return (
      '<article class="content-card">' +
      "<h3>" +
      esc(pick(item.title, lang)) +
      "</h3>" +
      "<p>" +
      esc(pick(item.desc, lang)) +
      "</p>" +
      (links ? '<p class="content-meta">' + links + "</p>" : "") +
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
