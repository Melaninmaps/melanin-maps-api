from __future__ import annotations

import csv
import hashlib
import json
import re
from collections import Counter, defaultdict
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[2]
INPUT = ROOT / "data/founder-imports/2026-09-17-10k-expansion/cities"
OUTPUT_DIR = ROOT / "data/founder-imports/2026-09-17-10k-expansion"
EXPECTED_HEADERS = [
    "name", "address", "city", "state", "postal_code", "country", "category", "subcategory",
    "services_search_terms", "description", "website", "phone", "instagram_url", "facebook_url",
    "tiktok_url", "source_url", "source_name", "ownership_designations", "ownership_evidence_url",
    "regulated_profession", "notes",
]
REQUIRED = ["name", "address", "city", "state", "country", "category", "source_url"]


def normalized(value: str | None) -> str:
    return re.sub(r"\s+", " ", (value or "").strip()).casefold()


def valid_http_url(value: str | None) -> bool:
    try:
        parsed = urlparse((value or "").strip())
        return parsed.scheme in {"https", "http"} and bool(parsed.netloc)
    except ValueError:
        return False


DIRECTORY_SOURCE_WORDS = {
    "alliance", "chamber", "city", "directory", "downtown", "guide", "list",
    "magazine", "partnership", "tourism", "travel", "visit",
}


def has_attributable_destination(row: dict[str, str]) -> bool:
    social_fields = ("instagram_url", "facebook_url", "tiktok_url")
    if any(valid_http_url(row.get(field)) for field in social_fields):
        return True
    if not valid_http_url(row.get("website")):
        return False
    if normalized(row.get("website")) != normalized(row.get("source_url")):
        return True
    source_name_words = set(re.findall(r"[a-z]+", normalized(row.get("source_name"))))
    return not bool(source_name_words & DIRECTORY_SOURCE_WORDS)


def row_key(row: dict[str, str]) -> str:
    return "|".join([normalized(row.get("name")), normalized(row.get("address")), normalized(row.get("city")), normalized(row.get("state"))])


def main() -> None:
    city_reports: list[dict] = []
    valid_rows: list[dict[str, str]] = []
    failures: list[dict] = []
    duplicate_keys: dict[str, list[dict]] = defaultdict(list)
    source_urls: set[str] = set()

    for path in sorted(INPUT.glob("*.csv")):
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            actual = reader.fieldnames or []
            if actual != EXPECTED_HEADERS:
                failures.append({"file": path.name, "kind": "header_mismatch", "actual": actual})
                continue
            rows = list(reader)
        file_failures = []
        for number, row in enumerate(rows, start=2):
            missing = [field for field in REQUIRED if not (row.get(field) or "").strip()]
            destination = has_attributable_destination(row)
            source_ok = valid_http_url(row.get("source_url"))
            if missing or not source_ok or not destination:
                reason = {
                    "missing": missing,
                    "source_url_valid": source_ok,
                    "has_attributable_destination": destination,
                }
                file_failures.append({"row": number, "name": row.get("name"), "reason": reason})
                continue
            row["source_file"] = path.name
            row["source_row"] = str(number)
            row["dedupe_key"] = row_key(row)
            valid_rows.append(row)
            duplicate_keys[row["dedupe_key"]].append(row)
            source_urls.add(row["source_url"].strip())
        city_reports.append({
            "file": path.name,
            "rows_read": len(rows),
            "valid_candidate_rows": len(rows) - len(file_failures),
            "held_rows": len(file_failures),
            "failures": file_failures,
        })

    duplicate_groups = {key: rows for key, rows in duplicate_keys.items() if len(rows) > 1}
    unique_rows = []
    seen = set()
    for row in valid_rows:
        if row["dedupe_key"] in seen:
            continue
        seen.add(row["dedupe_key"])
        unique_rows.append(row)

    manifest = OUTPUT_DIR / "source-backed-domestic-candidates.jsonl"
    with manifest.open("w", encoding="utf-8") as handle:
        for row in unique_rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")

    summary = {
        "city_files_seen": len(list(INPUT.glob("*.csv"))),
        "city_files_with_expected_schema": len(city_reports),
        "rows_read": sum(item["rows_read"] for item in city_reports),
        "valid_candidate_rows_before_batch_dedupe": len(valid_rows),
        "unique_candidate_rows": len(unique_rows),
        "duplicate_rows_removed": len(valid_rows) - len(unique_rows),
        "duplicate_groups": len(duplicate_groups),
        "unique_source_urls": len(source_urls),
        "held_rows": sum(item["held_rows"] for item in city_reports),
        "schema_failures": failures,
        "city_reports": city_reports,
        "manifest": str(manifest),
        "manifest_sha256": hashlib.sha256(manifest.read_bytes()).hexdigest(),
        "next_gate": "Run public-link validation, then stage only in the guarded directory-review environment. Existing-record matches must be address-enrichment review candidates, not duplicate creates.",
    }
    summary_path = OUTPUT_DIR / "domestic-research-validation-summary.json"
    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({key: summary[key] for key in summary if key not in {"city_reports", "schema_failures"}}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
