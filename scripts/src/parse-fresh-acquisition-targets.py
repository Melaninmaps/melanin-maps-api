from __future__ import annotations

import json
import re
from pathlib import Path

SOURCE = Path("/home/ubuntu/upload/pasted_content_3.txt")
OUTPUT = Path("data/founder-imports/2026-09-17-fresh-37910-acquisition/target-scope.json")


def integer(value: str) -> int:
    return int(re.sub(r"[^0-9]", "", value))


def main() -> None:
    rows = []
    for line in SOURCE.read_text(encoding="utf-8").splitlines():
        if not line.startswith("|"):
            continue
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        label = re.sub(r"[*_`]", "", cells[0]).strip()
        if len(cells) != 4 or label in {"City", "U.S. total"} or set(cells[0]) == {"-"}:
            continue
        if not re.search(r"\d", cells[1]):
            continue
        rows.append({
            "market": label,
            "city_target": integer(cells[1]),
            "surrounding_target": integer(cells[2]),
            "new_business_target": integer(cells[3]),
        })
    scope = {
        "assignment": "Fresh acquisition: do not count, subtract, or rely on prior supplied lists.",
        "us_markets": rows,
        "us_market_count": len(rows),
        "us_target": sum(row["new_business_target"] for row in rows),
        "international_target": 2500,
        "total_target": sum(row["new_business_target"] for row in rows) + 2500,
        "quality_gate": {
            "active": True,
            "exact_pinnable_public_location": True,
            "working_website_or_attributable_official_social_destination": True,
            "attributable_official_social_destination_required": True,
            "documented_ownership_claim_only": True,
            "not_already_in_production_database": True,
            "city_and_surrounding_counts_reported_separately": True,
        },
        "catchment_rule": "Assign every surrounding municipality and commercial corridor to exactly one named market. City-specific catchment lists must be documented before counting begins.",
        "enrichment_specification": "FRESH_CANDIDATE_ENRICHMENT_SPEC.md",
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(scope, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({key: scope[key] for key in ("us_market_count", "us_target", "international_target", "total_target")}, indent=2))


if __name__ == "__main__":
    main()
