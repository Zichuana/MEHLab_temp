"""Fill publication DOI fields interactively, following index.json order.

Usage (from repo root):

    python tools/fill_dois.py

Paste bare DOIs such as 10.1021/envhealth.6c00303 — they are stored as
https://doi.org/... in each paper JSON.

Commands at the prompt:
  <doi>   save DOI for this paper
  Enter   skip (keep current value)
  :s      skip papers that already have a DOI (toggle / one-shot: use --skip-filled)
  :q      quit
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUB_DIR = ROOT / "publications"
INDEX = PUB_DIR / "index.json"
EXIT_COMMANDS = {":q", ":quit", ":exit"}


def normalize_doi(raw: str) -> str:
    value = raw.strip()
    if not value:
        return ""
    value = re.sub(r"^https?://(?:dx\.)?doi\.org/", "", value, flags=re.I)
    if value.lower().startswith("doi:"):
        value = value[4:].strip()
    value = value.strip().strip("/")
    if not value:
        return ""
    return f"https://doi.org/{value}"


def load_index() -> list[str]:
    files = json.loads(INDEX.read_text(encoding="utf-8"))
    if not isinstance(files, list):
        raise ValueError("index.json must be a JSON array of filenames")
    return [str(name) for name in files]


def save_json(path: Path, data: dict) -> None:
    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
        newline="\n",
    )


def short(text: str, limit: int = 100) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) <= limit:
        return text
    return text[: limit - 1] + "…"


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Fill DOIs for publications listed in index.json."
    )
    parser.add_argument(
        "--skip-filled",
        action="store_true",
        help="Skip papers that already have a non-empty doi",
    )
    args = parser.parse_args()

    try:
        files = load_index()
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        print(f"Cannot read {INDEX.relative_to(ROOT)}: {exc}", file=sys.stderr)
        sys.exit(1)

    print("MEH Lab fill DOIs")
    print(f"Index: {INDEX.relative_to(ROOT)} ({len(files)} papers)")
    print("Enter bare DOI (e.g. 10.1021/envhealth.6c00303).")
    print("Empty = skip, :quit = stop.\n")

    updated = 0
    skipped = 0

    try:
        for i, name in enumerate(files, start=1):
            path = PUB_DIR / name
            if not path.is_file():
                print(f"[{i}/{len(files)}] MISSING FILE: {name}")
                skipped += 1
                continue

            try:
                data = json.loads(path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError) as exc:
                print(f"[{i}/{len(files)}] Skip {name}: {exc}")
                skipped += 1
                continue

            current = str(data.get("doi") or "").strip()
            if args.skip_filled and current:
                print(f"[{i}/{len(files)}] already has DOI — skip {name}")
                skipped += 1
                continue

            year = data.get("year") or "????"
            title = short(str(data.get("title") or "(no title)"))
            authors = short(str(data.get("authors") or ""), 80)

            print(f"[{i}/{len(files)}] {year}  {name}")
            print(f"  {authors}")
            print(f"  {title}")
            print(f"  current doi: {current or '(empty)'}")

            try:
                raw = input("doi> ").strip()
            except EOFError:
                print("\nStopped.")
                break

            if raw.lower() in EXIT_COMMANDS:
                print("Stopped.")
                break
            if not raw:
                print("  skipped\n")
                skipped += 1
                continue

            doi_url = normalize_doi(raw)
            if not doi_url:
                print("  empty after normalize — skipped\n")
                skipped += 1
                continue

            data["doi"] = doi_url
            try:
                save_json(path, data)
            except OSError as exc:
                print(f"  Error writing {name}: {exc}\n")
                skipped += 1
                continue

            updated += 1
            print(f"  saved: {doi_url}\n")
    except KeyboardInterrupt:
        print("\nStopped.")

    print(f"Done: {updated} updated, {skipped} skipped")


if __name__ == "__main__":
    main()
