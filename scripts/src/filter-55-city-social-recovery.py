#!/usr/bin/env python3
"""Create a strict review-only input from 55-city research without mutating raw files."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path("/home/ubuntu/melanin-maps-inventory-staging")


def option(name: str, default: str | None = None) -> str | None:
    try:
        return sys.argv[sys.argv.index(name) + 1]
    except (ValueError, IndexError):
        return default


RECOVERY = Path(option("--batch-dir", str(ROOT / "data/founder-imports/2026-09-17-55-city-social-recovery"))).resolve()
AUDIT = RECOVERY / "city-inventory-audit.json"
ACCEPTED = RECOVERY / "strict-city-candidates.jsonl"
HELD = RECOVERY / "strict-city-held.jsonl"
SUMMARY = RECOVERY / "strict-city-summary.json"
FIELDS = {
    "name", "address", "city", "state", "postal_code", "country", "category",
    "subcategory", "services_search_terms", "description", "website", "phone",
    "instagram_url", "facebook_url", "tiktok_url", "source_url", "source_name",
    "ownership_designations", "ownership_evidence_url", "regulated_profession", "notes",
    "source_file", "source_row", "dedupe_key", "target_kind",
}
REQUIRED_NONEMPTY = {"name", "address", "city", "country", "category", "source_url", "source_name", "dedupe_key", "target_kind"}
ALLOWED_KINDS = {"business", "community_resource", "cultural_place", "regulated_review"}


def reasons(row: dict[str, object]) -> list[str]:
    result: list[str] = []
    missing = FIELDS - row.keys()
    extras = row.keys() - FIELDS
    if missing:
        result.append("missing_contract_fields:" + ",".join(sorted(missing)))
    if extras:
        result.append("unexpected_contract_fields:" + ",".join(sorted(extras)))
    blank = [field for field in REQUIRED_NONEMPTY if not isinstance(row.get(field), str) or not row[field].strip()]
    if blank:
        result.append("blank_required_fields:" + ",".join(sorted(blank)))
    if not any(isinstance(row.get(field), str) and row[field].strip() for field in ("instagram_url", "facebook_url", "tiktok_url")):
        result.append("missing_attributable_official_social_destination")
    if row.get("target_kind") not in ALLOWED_KINDS:
        result.append("invalid_target_kind")
    return result


def main() -> None:
    audit = json.loads(AUDIT.read_text(encoding="utf-8"))
    accepted: list[dict[str, object]] = []
    held: list[dict[str, object]] = []
    valid_dedupe_keys: set[str] = set()

    for file_metadata in audit["chosen_city_files"]:
        file_path = Path(file_metadata["file"])
        city_id = str(file_metadata["city_id"])
        for line_number, line in enumerate(file_path.read_text(encoding="utf-8").splitlines(), start=1):
            if not line.strip():
                continue
            try:
                row = json.loads(line)
            except json.JSONDecodeError as error:
                held.append({"city_id": city_id, "input_file": str(file_path), "input_line": line_number, "reason": ["invalid_json", str(error)], "raw_line": line})
                continue
            if not isinstance(row, dict):
                held.append({"city_id": city_id, "input_file": str(file_path), "input_line": line_number, "reason": ["row_is_not_object"], "raw_record": row})
                continue
            row_reasons = reasons(row)
            dedupe_key = row.get("dedupe_key") if isinstance(row.get("dedupe_key"), str) else None
            if not row_reasons and dedupe_key and dedupe_key.lower() in valid_dedupe_keys:
                row_reasons.append("duplicate_within_55_city_research")
            if row_reasons:
                held.append({"city_id": city_id, "input_file": str(file_path), "input_line": line_number, "reason": row_reasons, "raw_record": row})
                continue
            valid_dedupe_keys.add(dedupe_key.lower())
            accepted.append(row)

    ACCEPTED.write_text("".join(json.dumps(row, separators=(",", ":")) + "\n" for row in accepted), encoding="utf-8")
    HELD.write_text("".join(json.dumps(row, separators=(",", ":")) + "\n" for row in held), encoding="utf-8")
    payload = {
        "input_city_files": len(audit["chosen_city_files"]),
        "input_candidate_rows": sum(item["rows"] for item in audit["chosen_city_files"]),
        "accepted_strict_review_only_candidates": len(accepted),
        "held_for_contract_or_evidence_research": len(held),
        "accepted_manifest": str(ACCEPTED),
        "held_manifest": str(HELD),
        "publication_status": "NOT PUBLISHED. This filter only creates a strict local review input. It does not write database records, map pins, user records, authentication records, access records, or waitlist records.",
    }
    SUMMARY.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()
