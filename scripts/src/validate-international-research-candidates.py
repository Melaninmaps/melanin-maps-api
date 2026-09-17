from __future__ import annotations

import csv
import hashlib
import json
import re
from collections import defaultdict
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[2]
INPUT = ROOT / "data/founder-imports/2026-09-17-international-2500-expansion/cities"
DOMESTIC = ROOT / "data/founder-imports/2026-09-17-10k-expansion/source-backed-domestic-candidates.jsonl"
OUTPUT_DIR = INPUT.parent
EXPECTED_HEADERS = [
    "name", "address", "city", "state_or_region", "postal_code", "country", "category", "subcategory",
    "services_search_terms", "description", "website", "phone", "instagram_url", "facebook_url", "tiktok_url",
    "source_url", "source_name", "ownership_designations", "ownership_evidence_url", "regulated_profession",
    "location_type", "languages", "hours", "price_range", "address_enrichment_note", "notes",
]
REQUIRED = ["name", "address", "city", "state_or_region", "country", "category", "source_url", "location_type"]


def normalized(value: str | None) -> str:
    return re.sub(r"\s+", " ", (value or "").strip()).casefold()


def valid_http_url(value: str | None) -> bool:
    try:
        parsed = urlparse((value or "").strip())
        return parsed.scheme in {"https", "http"} and bool(parsed.netloc)
    except ValueError:
        return False


def key(row: dict[str, str], region: str) -> str:
    return "|".join([normalized(row.get("name")), normalized(row.get("address")), normalized(row.get("city")), normalized(region), normalized(row.get("country"))])


def has_destination(row: dict[str, str]) -> bool:
    return any(valid_http_url(row.get(field)) for field in ("website", "instagram_url", "facebook_url", "tiktok_url"))


def domestic_keys() -> set[str]:
    if not DOMESTIC.exists():
        return set()
    rows = (json.loads(line) for line in DOMESTIC.read_text(encoding="utf-8").splitlines() if line.strip())
    return {key(row, row.get("state") or "") for row in rows}


def main() -> None:
    prior_keys = domestic_keys()
    seen: set[str] = set()
    valid: list[dict[str, str]] = []
    reports = []
    city_internal_duplicates = 0
    cross_domestic_matches = 0

    for path in sorted(INPUT.glob("*.csv")):
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            headers = reader.fieldnames or []
            if headers != EXPECTED_HEADERS:
                reports.append({"file": path.name, "schema_ok": False, "expected_headers": EXPECTED_HEADERS, "actual_headers": headers})
                continue
            rows = list(reader)
        held = []
        eligible = 0
        for number, row in enumerate(rows, start=2):
            missing = [field for field in REQUIRED if not (row.get(field) or "").strip()]
            reason = {
                "missing": missing,
                "is_physical": normalized(row.get("location_type")) == "physical",
                "source_url_valid": valid_http_url(row.get("source_url")),
                "has_attributable_destination": has_destination(row),
            }
            if missing or not reason["is_physical"] or not reason["source_url_valid"] or not reason["has_attributable_destination"]:
                held.append({"row": number, "name": row.get("name"), "reason": reason})
                continue
            candidate_key = key(row, row.get("state_or_region") or "")
            if candidate_key in seen:
                city_internal_duplicates += 1
                held.append({"row": number, "name": row.get("name"), "reason": {"duplicate_international_batch": True}})
                continue
            if candidate_key in prior_keys:
                cross_domestic_matches += 1
                row["publication_action"] = "address_enrichment_review"
            else:
                row["publication_action"] = "net_new_review"
            row["source_file"] = path.name
            row["source_row"] = str(number)
            row["dedupe_key"] = candidate_key
            valid.append(row)
            seen.add(candidate_key)
            eligible += 1
        reports.append({"file": path.name, "schema_ok": True, "rows_read": len(rows), "eligible": eligible, "held": len(held), "held_rows": held})

    manifest = OUTPUT_DIR / "source-backed-international-candidates.jsonl"
    manifest.write_text("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in valid), encoding="utf-8")
    summary = {
        "city_files_seen": len(list(INPUT.glob("*.csv"))),
        "city_files_with_expected_schema": sum(1 for report in reports if report.get("schema_ok")),
        "rows_read": sum(report.get("rows_read", 0) for report in reports),
        "eligible_candidates": len(valid),
        "held_rows": sum(report.get("held", 0) for report in reports),
        "duplicate_within_international_batch": city_internal_duplicates,
        "matches_in_domestic_candidate_batch": cross_domestic_matches,
        "net_new_review_candidates": sum(row["publication_action"] == "net_new_review" for row in valid),
        "address_enrichment_review_candidates": sum(row["publication_action"] == "address_enrichment_review" for row in valid),
        "manifest": str(manifest),
        "manifest_sha256": hashlib.sha256(manifest.read_bytes()).hexdigest(),
        "city_reports": reports,
        "next_gate": "Match candidates against the live production directory by normalized name/address and aliases. Matching records become address enrichment review; only approved net-new physical businesses proceed to staging geocoding.",
    }
    (OUTPUT_DIR / "international-research-validation-summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({key: value for key, value in summary.items() if key != "city_reports"}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
