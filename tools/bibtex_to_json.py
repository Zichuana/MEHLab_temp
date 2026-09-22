"""Convert EndNote tagged (.enw) exports into publication JSON files.

Usage (from repo root):

    python tools/bibtex_to_json.py path/to/folder
    python tools/bibtex_to_json.py path/to/file.enw

Reads Google Scholar / EndNote tagged format. Missing fields are left empty
(no invented DOI, abstract, BibTeX, or year). Filenames / ids use
first-author surname + year + journal (slugified).

Does not rebuild publications/index.json.
"""
from __future__ import annotations

import argparse
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUB_DIR = ROOT / "publications"

# EndNote tag → logical field (multi-value tags collected as lists)
MULTI_TAGS = {"%A", "%E", "%K"}
TAG_MAP = {
    "%0": "ref_type",
    "%T": "title",
    "%A": "authors",
    "%J": "journal",
    "%B": "booktitle",
    "%D": "year",
    "%V": "volume",
    "%N": "number",
    "%P": "pages",
    "%I": "publisher",
    "%U": "url",
    "%R": "doi",
    "%X": "abstract",
    "%Z": "notes",
}


def clean_space(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def decode_text(value: str) -> str:
    """Normalize common export quirks (LaTeX-ish & encoding leftovers)."""
    replacements = {
        r"\&": "&",
        "~": " ",
        "--": "–",
        "\uFFFD": "",
    }
    for old, new in replacements.items():
        value = value.replace(old, new)
    return clean_space(value)


def read_text(path: Path) -> str:
    raw = path.read_bytes()
    for encoding in ("utf-8-sig", "utf-8", "cp1252", "latin-1"):
        try:
            return raw.decode(encoding)
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", errors="replace")


def parse_enw(text: str) -> list[dict[str, object]]:
    """Parse one or more EndNote tagged records from text."""
    records: list[dict[str, object]] = []
    current: dict[str, object] | None = None

    for raw_line in text.splitlines():
        line = raw_line.rstrip("\r\n")
        if not line.strip():
            continue

        tag = line[:2] if len(line) >= 2 and line.startswith("%") else ""
        if tag and (len(line) == 2 or line[2:3] in (" ", "\t")):
            value = decode_text(line[3:] if len(line) > 3 else "")
            if tag == "%0":
                if current:
                    records.append(current)
                current = {"ref_type": value, "authors": []}
                continue
            if current is None:
                current = {"authors": []}
            field = TAG_MAP.get(tag)
            if not field:
                continue
            if tag in MULTI_TAGS:
                authors = current.setdefault("authors", [])
                if isinstance(authors, list) and value:
                    authors.append(value)
            else:
                current[field] = value
        elif current is not None:
            # Continuation line: append to last string field written
            cont = decode_text(line)
            if not cont:
                continue
            for key in ("title", "abstract", "notes", "journal"):
                if key in current and isinstance(current[key], str):
                    current[key] = clean_space(f"{current[key]} {cont}")
                    break

    if current:
        records.append(current)
    return records


def format_author(author: str) -> str:
    author = decode_text(author)
    if "," not in author:
        return author
    parts = [part.strip() for part in author.split(",") if part.strip()]
    if len(parts) == 2:
        return f"{parts[1]} {parts[0]}"
    if len(parts) >= 3:
        return f"{parts[2]} {parts[0]}, {parts[1]}"
    return author


def format_authors(authors: list[str]) -> str:
    names = [format_author(a) for a in authors if a.strip()]
    return (", ".join(names) + ".") if names else ""


def slugify(value: str) -> str:
    ascii_value = (
        unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    )
    slug = "-".join(re.findall(r"[a-z0-9]+", ascii_value.lower()))
    return slug[:90].strip("-") or "publication"


def first_author_surname(authors: list[str]) -> str:
    if not authors:
        return "author"
    first = decode_text(authors[0])
    if "," in first:
        return first.split(",", 1)[0].strip() or "author"
    parts = first.split()
    return parts[-1] if parts else "author"


def venue_for_filename(fields: dict[str, object]) -> str:
    venue = str(
        fields.get("journal")
        or fields.get("booktitle")
        or fields.get("publisher")
        or "unknown"
    )
    venue = re.sub(r"^(the|a|an)\s+", "", venue, flags=re.I).strip()
    return venue or "unknown"


def year_int(fields: dict[str, object]) -> int | None:
    year_text = str(fields.get("year") or "")
    match = re.search(r"\b(?:19|20)\d{2}\b", year_text)
    return int(match.group(0)) if match else None


def make_base_id(fields: dict[str, object]) -> str:
    authors = fields.get("authors")
    author_list = authors if isinstance(authors, list) else []
    surname = slugify(first_author_surname(author_list)) or "author"
    year = year_int(fields)
    venue = slugify(venue_for_filename(fields)) or "venue"
    if year is not None:
        return f"{surname}-{year}-{venue}"
    return f"{surname}-{venue}"


def publication_type(fields: dict[str, object]) -> str:
    text = " ".join(
        str(fields.get(k) or "")
        for k in ("ref_type", "journal", "booktitle", "notes", "publisher")
    ).lower()
    if "preprint" in text or "ssrn" in text or "biorxiv" in text or "arxiv" in text:
        return "preprint"
    return "journal"


def citation(fields: dict[str, object]) -> str:
    venue = str(
        fields.get("journal")
        or fields.get("booktitle")
        or fields.get("publisher")
        or ""
    )
    if not venue:
        return ""

    volume = str(fields.get("volume") or "")
    number = str(fields.get("number") or "")
    year = year_int(fields)
    pages = str(fields.get("pages") or "")

    result = venue
    if volume:
        result += f", {volume}"
    if number:
        result += f" ({number})"
    if year is not None:
        result += f" ({year})"
    if pages:
        result += f": {pages}"
    return result.rstrip(".") + "."


def doi_url(fields: dict[str, object]) -> str:
    doi = str(fields.get("doi") or "").strip()
    if doi:
        doi = re.sub(r"^https?://(?:dx\.)?doi\.org/", "", doi, flags=re.I)
        if doi.lower().startswith("doi:"):
            doi = doi[4:].strip()
        return f"https://doi.org/{doi}" if doi else ""
    url = str(fields.get("url") or "").strip()
    return url


def unique_path(base_id: str) -> tuple[str, Path]:
    candidate = base_id
    number = 2
    while (PUB_DIR / f"{candidate}.json").exists():
        candidate = f"{base_id}-{number}"
        number += 1
    return candidate, PUB_DIR / f"{candidate}.json"


def title_key(title: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", title.lower())


def build_payload(fields: dict[str, object]) -> tuple[dict[str, object], Path]:
    title = str(fields.get("title") or "").strip()
    if not title:
        raise ValueError("Entry has no title (%T)")

    authors_raw = fields.get("authors")
    authors_list = authors_raw if isinstance(authors_raw, list) else []
    if not authors_list:
        raise ValueError("Entry has no authors (%A)")

    year = year_int(fields)
    base_id = make_base_id(fields)
    pub_id, path = unique_path(base_id)

    abstract_en = str(fields.get("abstract") or "")
    payload: dict[str, object] = {
        "id": pub_id,
        "type": publication_type(fields),
        "year": year if year is not None else "",
        "authors": format_authors(authors_list),
        "title": title,
        "citation": citation(fields),
        "doi": doi_url(fields),
        "image": f"img/journals/{pub_id}.jpg",
        "abstract": {"en": abstract_en, "zh": ""},
        "bibtex": "",
    }
    return payload, path


def collect_enw_paths(target: Path) -> list[Path]:
    if target.is_file():
        if target.suffix.lower() != ".enw":
            raise ValueError(f"Not an .enw file: {target}")
        return [target]
    if target.is_dir():
        return sorted(target.glob("*.enw"))
    raise ValueError(f"Path not found: {target}")


def import_path(target: Path) -> int:
    paths = collect_enw_paths(target)
    if not paths:
        print(f"No .enw files in {target}")
        return 0

    PUB_DIR.mkdir(parents=True, exist_ok=True)
    seen_titles: set[str] = set()
    created = 0
    skipped = 0

    for path in paths:
        try:
            records = parse_enw(read_text(path))
        except OSError as exc:
            print(f"Skip {path.name}: {exc}")
            skipped += 1
            continue

        if not records:
            print(f"Skip {path.name}: no EndNote records found")
            skipped += 1
            continue

        for fields in records:
            title = str(fields.get("title") or "")
            key = title_key(title)
            if key and key in seen_titles:
                print(f"Skip duplicate title from {path.name}")
                skipped += 1
                continue

            try:
                payload, out = build_payload(fields)
            except ValueError as exc:
                print(f"Skip {path.name}: {exc}")
                skipped += 1
                continue

            out.write_text(
                json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
                newline="\n",
            )
            if key:
                seen_titles.add(key)
            created += 1
            year = payload["year"] if payload["year"] != "" else "????"
            print(f"Created: {out.relative_to(ROOT)}  ({year})")

    print(f"\nDone: {created} created, {skipped} skipped")
    return created


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Convert EndNote .enw exports to publication JSON files."
    )
    parser.add_argument(
        "path",
        type=Path,
        help="Folder of .enw files, or a single .enw file",
    )
    args = parser.parse_args()
    print("MEH Lab EndNote → JSON")
    print(f"Output directory: {PUB_DIR}")
    import_path(args.path.resolve())


if __name__ == "__main__":
    main()
