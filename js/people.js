/* Load people sections from data/people.json */
(function () {
  var DATA_URL = "data/people.json";
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

  function photoHtml(src, placeholder) {
    return (
      '<div class="person-photo">' +
      (src
        ? '<img src="' + esc(src) + '" alt="" onerror="this.remove()" />'
        : "") +
      '<span class="person-photo-fallback">' +
      esc(placeholder) +
      "</span></div>"
    );
  }

  function renderPi(pi, lang, dict) {
    if (!pi) return "";
    var profile = pi.profile || "";
    var linkHtml = profile
      ? '<a class="person-link" href="' +
        esc(profile) +
        '" target="_blank" rel="noopener">' +
        esc(dict.moreProfile || "个人主页 →") +
        "</a>"
      : "";

    return (
      '<article class="person-card person-card--pi">' +
      photoHtml(pi.photo, dict.photoPlaceholder || "照片") +
      '<div class="person-body">' +
      '<h3 class="person-name">' +
      esc(pick(pi.name, lang)) +
      "</h3>" +
      linkHtml +
      '<p class="person-bio">' +
      esc(pick(pi.bio, lang)) +
      "</p></div></article>"
    );
  }

  function renderStudent(person, lang, dict) {
    return (
      '<article class="person-card">' +
      photoHtml(person.photo, dict.photoPlaceholder || "照片") +
      '<div class="person-body">' +
      '<h3 class="person-name">' +
      esc(pick(person.name, lang)) +
      "</h3>" +
      '<div class="person-bio">' +
      '<p class="person-year">' +
      esc(pick(person.year, lang)) +
      "</p>" +
      '<p class="person-topic">' +
      esc(pick(person.topic, lang)) +
      "</p></div></div></article>"
    );
  }

  function renderAlumni(list, lang) {
    return (list || [])
      .map(function (person) {
        return (
          "<li><span class=\"alumni-name\">" +
          esc(pick(person.name, lang)) +
          '</span><span class="alumni-meta">' +
          esc(pick(person.meta, lang)) +
          "</span></li>"
        );
      })
      .join("");
  }

  function mount(data, lang) {
    var dict = (window.MEH_I18N && window.MEH_I18N[lang]) || {};
    var piEl = document.getElementById("people-pi");
    var phdEl = document.getElementById("people-phd");
    var masterEl = document.getElementById("people-master");
    var alumniEl = document.getElementById("alumni-list");

    if (piEl) piEl.innerHTML = renderPi(data.pi, lang, dict);
    if (phdEl) {
      phdEl.innerHTML = (data.phd || [])
        .map(function (p) {
          return renderStudent(p, lang, dict);
        })
        .join("");
    }
    if (masterEl) {
      masterEl.innerHTML = (data.master || [])
        .map(function (p) {
          return renderStudent(p, lang, dict);
        })
        .join("");
    }
    if (alumniEl) alumniEl.innerHTML = renderAlumni(data.alumni, lang);
  }

  function syncPeopleLang(lang) {
    if (!cached) return;
    mount(cached, lang || document.body.getAttribute("data-lang") || "zh");
  }

  function loadPeople() {
    if (document.body.getAttribute("data-page") !== "people") {
      return Promise.resolve();
    }

    return fetch(DATA_URL)
      .then(function (r) {
        if (!r.ok) throw new Error("Cannot load " + DATA_URL);
        return r.json();
      })
      .then(function (data) {
        cached = data;
        syncPeopleLang(document.body.getAttribute("data-lang") || "zh");
      })
      .catch(function (err) {
        console.error(err);
        var phdEl = document.getElementById("people-phd");
        if (phdEl) {
          phdEl.innerHTML =
            '<p class="pub-load-error">Failed to load people data.</p>';
        }
      });
  }

  window.MEH_loadPeople = loadPeople;
  window.MEH_syncPeopleLang = syncPeopleLang;
})();
