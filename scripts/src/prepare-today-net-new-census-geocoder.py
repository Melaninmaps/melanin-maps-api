from __future__ import annotations

import csv
import json
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
BUNDLE = ROOT / "data/founder-imports/2026-09-06-today-net-new-businesses"
MANIFEST = BUNDLE / "today-net-new-business-candidates.jsonl"
OUTPUT = BUNDLE / "census-address-batch-input.csv"
SUMMARY = BUNDLE / "census-address-batch-input-summary.json"
EXPECTED_ROWS = 3_367


def text(value: Any) -> str:
    return "" if value is None else str(value).strip()


def street_part(address: str, city: str, state: str) -> str:
    escaped_city = re.escape(city.strip())
    escaped_state = re.escape(state.strip())
    stripped = re.sub(
        rf"\s*,\s*{escaped_city}\s*,\s*{escaped_state}(?:\s+\d{{5}}(?:-\d{{4}})?)?\s*$",
        "",
        address.strip(),
        flags=re.I,
    )
    if stripped == address.strip():
        stripped = re.sub(
            rf"\s+{escaped_city}\s*,?\s*{escaped_state}(?:\s+\d{{5}}(?:-\d{{4}})?)?\s*$",
            "",
            address.strip(),
            flags=re.I,
        )
    return stripped.strip(" ,")


def main() -> None:
    rows: list[dict[str, Any]] = []
    with MANIFEST.open(encoding="utf-8") as handle:
        for line in handle:
            if line.strip():
                rows.append(json.loads(line))
    if len(rows) != EXPECTED_ROWS:
        raise RuntimeError(f"Expected {EXPECTED_ROWS} manifest rows, received {len(rows)}")

    missing_zip = 0
    with OUTPUT.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle, lineterminator="\n")
        for row in rows:
            address = text(row.get("address"))
            city = text(row.get("city"))
            state = text(row.get("state")).upper()
            zip_match = re.search(r"\b(\d{5})(?:-\d{4})?\b", address)
            postal = zip_match.group(1) if zip_match else ""
            if not postal:
                missing_zip += 1
            street = street_part(address, city, state)
            if not street:
                raise RuntimeError(f"No street component for source row {row.get('sourceRow')}")
            writer.writerow([row["sourceRow"], street, city, state, postal])

    summary = {
        "inputRows": len(rows),
        "missingPostalCodes": missing_zip,
        "output": OUTPUT.name,
        "benchmark": "Public_AR_Current",
        "countryScope": "United States, Puerto Rico, and U.S. Island Areas only",
    }
    SUMMARY.write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
