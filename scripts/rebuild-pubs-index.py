"""Rebuild publications/index.json from JSON files in publications/.

Scans *.json (skips index.json and template.json), sorts by year desc then title.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUB_DIR = ROOT / "publications"
INDEX = PUB_DIR / "index.json"
SKIP = {"index.json", "template.json"}


def main() -> None:
    entries = []
    for path in sorted(PUB_DIR.glob("*.json")):
        if path.name in SKIP:
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        entries.append(
            {
                "file": path.name,
                "id": data.get("id") or path.stem,
                "type": data.get("type") or "journal",
                "year": int(data.get("year") or 0),
                "title": data.get("title") or "",
            }
        )

    entries.sort(key=lambda e: (-e["year"], e["title"].lower()))
    INDEX.write_text(
        json.dumps([e["file"] for e in entries], indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
        newline="\n",
    )
    print(f"Wrote {INDEX.relative_to(ROOT)} ({len(entries)} papers)")


if __name__ == "__main__":
    main()
