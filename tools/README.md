# Publication tools

## EndNote → JSON

```powershell
python tools/bibtex_to_json.py "C:\Users\sunji\Downloads\siyu"
python tools/bibtex_to_json.py "C:\path\to\one.enw"
```

Reads Google Scholar / EndNote tagged (`.enw`) files. Writes
`publications/<surname>-<year>-<journal>.json`.

- Missing fields stay empty (`doi`, `bibtex`, abstracts, year if absent).
- `image` is reserved as `img/journals/<id>.jpg` (Cover thumbnail; add the file later).
- Duplicate titles in the same run are skipped.
- Does **not** rebuild `index.json` (run `rebuild_index.py` separately when ready).

## Rebuild index only

```powershell
python tools/rebuild_index.py
```

Scans all publication JSON files and rewrites `publications/index.json`
sorted by date (year, newest first; missing year last).
