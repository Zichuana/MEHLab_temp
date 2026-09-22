# Publications data

One JSON file per paper in this folder. The site only shows **English** metadata (authors / title / citation). Abstracts support **en** + **zh** and follow the page language toggle.

> **GitHub Pages note:** Do not name files with a leading `_` (e.g. `_index.json`). Jekyll skips those unless `.nojekyll` is present. This repo uses `index.json` / `template.json` and includes `.nojekyll`.

## Add a new paper

1. Prefer `python tools/bibtex_to_json.py path\to\folder` (EndNote `.enw` → JSON, named `<surname>-<year>-<journal>.json`). Or copy `template.json` manually.
2. Fill the fields (see below). Put the cover image under `img/journals/<id>.jpg`.
3. Run:

```bash
python tools/rebuild_index.py
```

This refreshes `index.json` (all `*.json` except `template.json` / `index.json`, newest year first).

4. Refresh `publications.html` (serve over `http://`, not `file://`).

## Fields

| Field | Required | Notes |
|-------|----------|--------|
| `id` | yes | Same as filename without `.json` (`surname-year-journal`) |
| `type` | yes | `"journal"` or `"preprint"` |
| `year` | yes | Number, used for sorting |
| `authors` | yes | English |
| `title` | yes | English |
| `citation` | yes | English venue line |
| `doi` | no | Full URL preferred |
| `image` | no | Cover path, e.g. `img/journals/<id>.jpg`. Missing file → Cover placeholder |
| `abstract.en` / `abstract.zh` | no | Shown in the abstract overlay |
| `bibtex` | no | Shown in the cite overlay |

## Image

Covers live in `img/journals/`, named after the paper `id`. Missing file → Cover placeholder.
