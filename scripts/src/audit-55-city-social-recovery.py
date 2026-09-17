#!/usr/bin/env python3
"""Audit one accepted-candidate file per researched city without altering data."""

from __future__ import annotations

import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path("/home/ubuntu/melanin-maps-inventory-staging")
PRIMARY = ROOT / "data/founder-imports/2026-09-17-55-city-social-recovery/cities"
SECONDARY = Path("/home/ubuntu/founder-imports/2026-09-17-55-city-social-recovery/cities")
OUTPUT = ROOT / "data/founder-imports/2026-09-17-55-city-social-recovery/city-social-recovery-audit.json"
INPUT_LIST = ROOT / "data/founder-imports/2026-09-17-55-city-social-recovery/accepted-city-inputs.txt"
FIELDS = {
    "name", "address", "city", "state", "postal_code", "country", "category",
    "subcategory", "services_search_terms", "description", "website", "phone",
    "instagram_url", "facebook_url", "tiktok_url", "source_url", "source_name",
    "ownership_designations", "ownership_evidence_url", "regulated_profession", "notes",
    "source_file", "source_row", "dedupe_key", "target_kind",
}
REQUIRED_NONEMPTY = {"name", "address", "city", "country", "category", "source_url", "source_name", "dedupe_key", "target_kind"}
ALLOWED_KINDS = {"business", "community_resource", "cultural_place", "regulated_review"}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def choose_city_file(city_id: str) -> Path | None:
    candidates = [
        PRIMARY / f"{city_id}-candidates.jsonl",
        SECONDARY / f"{city_id}-candidates.jsonl",
    ]
    for path in candidates:
        if path.is_file() and path.stat().st_size > 0:
            return path
    return None


def main() -> None:
    choices: list[dict[str, object]] = []
    problems: list[dict[str, object]] = []
    dedupe_locations: defaultdict[str, list[dict[str, object]]] = defaultdict(list)
    target_counts: Counter[str] = Counter()
    category_counts: Counter[str] = Counter()
    total_rows = 0

    for index in range(1, 56):
        city_id = f"{index:02d}"
        path = choose_city_file(city_id)
        if path is None:
            problems.append({"city_id": city_id, "reason": "missing_accepted_candidate_file"})
            continue
        row_count = 0
        with path.open(encoding="utf-8") as handle:
            for line_number, line in enumerate(handle, start=1):
                if not line.strip():
                    continue
                row_count += 1
                total_rows += 1
                try:
                    row = json.loads(line)
                except json.JSONDecodeError as error:
                    problems.append({"city_id": city_id, "file": str(path), "line": line_number, "reason": "invalid_json", "detail": str(error)})
                    continue
                if not isinstance(row, dict):
                    problems.append({"city_id": city_id, "file": str(path), "line": line_number, "reason": "not_an_object"})
                    continue
                missing = sorted(FIELDS - row.keys())
                extras = sorted(row.keys() - FIELDS)
                blank = sorted(field for field in REQUIRED_NONEMPTY if not isinstance(row.get(field), str) or not row[field].strip())
                social = any(isinstance(row.get(field), str) and row[field].strip() for field in ("instagram_url", "facebook_url", "tiktok_url"))
                if missing or extras or blank or not social or row.get("target_kind") not in ALLOWED_KINDS:
                    problems.append({
                        "city_id": city_id,
                        "file": str(path),
                        "line": line_number,
                        "reason": "schema_or_eligibility_violation",
                        "missing": missing,
                        "extras": extras,
                        "blank_required": blank,
                        "has_official_social": social,
                        "target_kind": row.get("target_kind"),
                    })
                    continue
                key = row["dedupe_key"].strip().lower()
                dedupe_locations[key].append({"city_id": city_id, "file": str(path), "line": line_number, "name": row["name"]})
                target_counts[row["target_kind"]] += 1
                category_counts[row["category"].strip()] += 1
        choices.append({"city_id": city_id, "file": str(path), "rows": row_count, "sha256": sha256(path)})

    duplicate_keys = [
        {"dedupe_key": key, "rows": rows}
        for key, rows in sorted(dedupe_locations.items())
        if len(rows) > 1
    ]
    payload = {
        "scope": "Research-only audit of completed 55-city social-recovery candidate files.",
        "chosen_city_files": choices,
        "cities_with_chosen_file": len(choices),
        "total_candidate_rows": total_rows,
        "valid_rows": sum(target_counts.values()),
        "schema_or_eligibility_issues": len(problems),
        "problems": problems,
        "cross_city_duplicate_dedupe_keys": len(duplicate_keys),
        "duplicate_rows": duplicate_keys,
        "target_kind_counts": dict(sorted(target_counts.items())),
        "category_counts": dict(sorted(category_counts.items())),
        "publication": "NOT PUBLISHED. This audit does not write database records, map pins, resources, user records, authentication records, access records, or waitlist records.",
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    INPUT_LIST.write_text("\n".join(str(item["file"]) for item in choices) + ("\n" if choices else ""), encoding="utf-8")
    print(json.dumps({
        "cities_with_chosen_file": payload["cities_with_chosen_file"],
        "total_candidate_rows": payload["total_candidate_rows"],
        "valid_rows": payload["valid_rows"],
        "schema_or_eligibility_issues": payload["schema_or_eligibility_issues"],
        "cross_city_duplicate_dedupe_keys": payload["cross_city_duplicate_dedupe_keys"],
        "target_kind_counts": payload["target_kind_counts"],
        "audit": str(OUTPUT),
        "input_list": str(INPUT_LIST),
    }, indent=2))


if __name__ == "__main__":
    main()
