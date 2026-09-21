# Publications data

One JSON file per paper in this folder. The site only shows **English** metadata (authors / title / citation). Abstracts support **en** + **zh** and follow the page language toggle.

> **GitHub Pages note:** Do not name files with a leading `_` (e.g. `_index.json`). Jekyll skips those unless `.nojekyll` is present. This repo uses `index.json` / `template.json` and includes `.nojekyll`.

## Add a new paper

1. Copy `template.json` → `your-slug.json` (e.g. `liu-2024-organic.json`).
2. Fill the fields (see below). Put the cover image under `img/pubs/` and set `"image"`.
3. Run:

```bash
python scripts/rebuild-pubs-index.py
```

This refreshes `index.json` (all `*.json` except `template.json` / `index.json`, newest year first).

4. Refresh `publications.html` (serve over `http://`, not `file://`).

## Fields

| Field | Required | Notes |
|-------|----------|--------|
| `id` | yes | Unique slug; usually same as filename without `.json` |
| `type` | yes | `"journal"` or `"preprint"` |
| `year` | yes | Number, used for sorting |
| `authors` | yes | English |
| `title` | yes | English |
| `citation` | yes | English venue line |
| `doi` | no | Full URL preferred |
| `image` | no | Path relative to site root, e.g. `img/pubs/foo.jpg`. Leave empty or omit → placeholder shown |
| `abstract.en` / `abstract.zh` | no | Shown in the abstract overlay |
| `bibtex` | no | Shown in the cite overlay |

## Image

Reserve a cover with `"image": "img/pubs/<slug>.jpg"`. If the file is missing, the page shows a placeholder box until you add the image.
