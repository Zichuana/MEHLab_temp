"""One-click rebuild of publications/index.json, newest date first.

Usage (from repo root):

    python tools/rebuild_index.py

Sorts by year (descending). Entries without a year go last; same year → title A–Z.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUB_DIR = ROOT / "publications"
INDEX = PUB_DIR / "index.json"
BUNDLE = PUB_DIR / "all.json"
SKIP = {"index.json", "template.json", "all.json"}


def parse_year(value: object) -> int:
    """Extract a 4-digit year; missing / invalid → 0 (sorted last)."""
    if value is None or value == "":
        return 0
    if isinstance(value, int):
        return value if value > 0 else 0
    match = re.search(r"\b(?:19|20)\d{2}\b", str(value))
    return int(match.group(0)) if match else 0


def rebuild_index(*, quiet: bool = False) -> list[dict]:
    """Scan publication JSON files and write index.json sorted by date desc."""
    entries = []
    for path in PUB_DIR.glob("*.json"):
        if path.name in SKIP:
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            if not quiet:
                print(f"Skip {path.name}: {exc}")
            continue
        year = parse_year(data.get("year"))
        title = str(data.get("title") or "")
        entries.append({"file": path.name, "year": year, "title": title, "data": data})

    # Newest date first; no year → last; same year → title A–Z
    entries.sort(key=lambda e: (-e["year"], e["title"].lower()))

    payload_index = json.dumps([e["file"] for e in entries], indent=2, ensure_ascii=False) + "\n"
    payload_bundle = json.dumps([e["data"] for e in entries], indent=2, ensure_ascii=False) + "\n"
    INDEX.write_text(payload_index, encoding="utf-8")
    BUNDLE.write_text(payload_bundle, encoding="utf-8")

    if not quiet:
        print(f"Wrote {INDEX.relative_to(ROOT)} and {BUNDLE.relative_to(ROOT)} ({len(entries)} papers)\n")
        for e in entries:
            year = e["year"] if e["year"] else "????"
            print(f"  {year}  {e['file']}")

    return entries


def main() -> None:
    rebuild_index(quiet=False)


if __name__ == "__main__":
    main()
