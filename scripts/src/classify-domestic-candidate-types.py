from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
INPUT = ROOT / "data/founder-imports/2026-09-17-10k-expansion/source-backed-domestic-candidates.jsonl"
OUTPUT_DIR = INPUT.parent

RESOURCE_TERMS = {
    "community center", "community organisation", "community organization", "nonprofit", "non-profit",
    "foundation", "food pantry", "food bank", "legal aid", "mutual aid", "public library",
    "workforce development", "resource center", "referral service", "social service", "free clinic",
    "government", "city department", "county department",
}
CULTURAL_TERMS = {
    "museum", "monument", "historic site", "heritage center", "cultural center", "cultural centre",
    "memorial", "archives", "visitor center", "visitor centre",
}


def normalized(row: dict) -> str:
    return " ".join(str(row.get(field) or "") for field in (
        "name", "category", "subcategory", "services_search_terms", "description", "notes"
    )).casefold()


def classify(row: dict) -> str:
    text = normalized(row)
    resource = any(term in text for term in RESOURCE_TERMS)
    cultural = any(term in text for term in CULTURAL_TERMS)
    if resource and cultural:
        return "manual_review"
    if resource:
        return "community_resource"
    if cultural:
        return "cultural_place"
    return "business"


rows = [json.loads(line) for line in INPUT.read_text(encoding="utf-8").splitlines() if line.strip()]
for row in rows:
    row["target_kind"] = classify(row)

by_kind: dict[str, list[dict]] = {kind: [] for kind in ("business", "community_resource", "cultural_place", "manual_review")}
for row in rows:
    by_kind[row["target_kind"]].append(row)

for kind, group in by_kind.items():
    path = OUTPUT_DIR / f"source-backed-domestic-{kind}-candidates.jsonl"
    path.write_text("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in group), encoding="utf-8")

summary = {
    "input_rows": len(rows),
    "counts": {kind: len(group) for kind, group in by_kind.items()},
    "rules": {
        "business": "Default for commercial service and retail providers.",
        "community_resource": "Public-help, nonprofit, government, and referral entities; not commercial Map pins.",
        "cultural_place": "Museum, monument, historic, heritage, and cultural-place entities; separate discovery layer.",
        "manual_review": "Mixed signals requiring a reviewer before publication.",
    },
    "note": "This deterministic first pass does not infer ownership. Reviewers may correct target_kind with source evidence before publication.",
}
(OUTPUT_DIR / "domestic-candidate-type-summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps(summary, ensure_ascii=False, indent=2))
