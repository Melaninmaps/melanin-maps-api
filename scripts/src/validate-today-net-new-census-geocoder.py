from __future__ import annotations

import csv
import hashlib
import json
import re
from collections import Counter
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
BUNDLE = ROOT / "data/founder-imports/2026-09-06-today-net-new-businesses"
MANIFEST = BUNDLE / "today-net-new-business-candidates.jsonl"
RAW_OUTPUT = BUNDLE / "census-address-batch-output.csv"
OUTPUT = BUNDLE / "census-geocode-results.jsonl"
SUMMARY = BUNDLE / "census-geocode-summary.json"
EXPECTED_ROWS = 3_367
POLICY_VERSION = "founder-census-exact-address-v1"


def text(value: Any) -> str:
    return "" if value is None else str(value).strip()


def norm(value: Any) -> str:
    return re.sub(r"[^a-z0-9]+", " ", text(value).lower()).strip()


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def source_zip(address: str) -> str:
    match = re.search(r"\b(\d{5})(?:-\d{4})?\b", address)
    return match.group(1) if match else ""


def house_number(address: str) -> str:
    match = re.match(r"\s*(\d+[A-Za-z]?(?:-\d+[A-Za-z]?)?)\b", address)
    return norm(match.group(1)) if match else ""


def matched_parts(address: str) -> tuple[str, str, str, str]:
    parts = [part.strip() for part in address.rsplit(",", 3)]
    if len(parts) != 4:
        return "", "", "", ""
    street, city, state, postal = parts
    return street, city, state.upper(), postal[:5]


def coordinate(value: str) -> tuple[float, float] | None:
    try:
        longitude_raw, latitude_raw = [part.strip() for part in value.split(",", 1)]
        longitude = float(longitude_raw)
        latitude = float(latitude_raw)
    except (ValueError, TypeError):
        return None
    if not (-180 <= longitude <= 180 and -90 <= latitude <= 90) or (longitude == 0 and latitude == 0):
        return None
    return longitude, latitude


def main() -> None:
    candidates: dict[int, dict[str, Any]] = {}
    with MANIFEST.open(encoding="utf-8") as handle:
        for line in handle:
            if not line.strip():
                continue
            row = json.loads(line)
            candidates[int(row["sourceRow"])] = row
    if len(candidates) != EXPECTED_ROWS:
        raise RuntimeError(f"Expected {EXPECTED_ROWS} manifest identities, received {len(candidates)}")

    results: list[dict[str, Any]] = []
    seen: set[int] = set()
    with RAW_OUTPUT.open(encoding="utf-8-sig", newline="") as handle:
        for fields in csv.reader(handle):
            if len(fields) not in {3, 8}:
                raise RuntimeError(f"Unexpected Census output column count: {len(fields)}")
            source_row = int(fields[0])
            if source_row in seen or source_row not in candidates:
                raise RuntimeError(f"Unexpected or duplicate Census source row: {source_row}")
            seen.add(source_row)
            candidate = candidates[source_row]
            match_status = fields[2].strip()
            match_type = fields[3].strip() if len(fields) == 8 else ""
            matched_address = fields[4].strip() if len(fields) == 8 else ""
            coords = coordinate(fields[5]) if len(fields) == 8 else None
            matched_street, matched_city, matched_state, matched_zip = matched_parts(matched_address)
            expected_state = text(candidate.get("state")).upper()
            expected_city = text(candidate.get("city"))
            expected_zip = source_zip(text(candidate.get("address")))
            expected_house = house_number(text(candidate.get("address")))
            actual_house = house_number(matched_street)
            reasons: list[str] = []
            if match_status != "Match": reasons.append("not_matched")
            if match_type != "Exact": reasons.append("not_exact")
            if coords is None: reasons.append("invalid_coordinates")
            if matched_state != expected_state: reasons.append("state_mismatch")
            if expected_zip:
                if matched_zip != expected_zip: reasons.append("postal_mismatch")
            elif norm(matched_city) != norm(expected_city):
                reasons.append("city_mismatch_without_postal")
            if not expected_house or expected_house != actual_house:
                reasons.append("house_number_mismatch")
            accepted = not reasons
            longitude, latitude = coords if coords else (None, None)
            results.append({
                "sourceRow": source_row,
                "targetKind": candidate["targetKind"],
                "accepted": accepted,
                "reasons": reasons,
                "matchStatus": match_status,
                "matchType": match_type,
                "matchedAddress": matched_address or None,
                "latitude": latitude,
                "longitude": longitude,
                "tigerLineId": fields[6].strip() or None if len(fields) == 8 else None,
                "tigerSide": fields[7].strip() or None if len(fields) == 8 else None,
                "provider": "US Census Geocoder",
                "benchmark": "Public_AR_Current",
                "policyVersion": POLICY_VERSION,
                "coordinatePrecision": "interpolated_address_range",
                "verifiedBusinessLocation": False,
            })
    if len(results) != EXPECTED_ROWS or seen != set(candidates):
        raise RuntimeError("Census output did not cover the exact manifest cohort")

    results.sort(key=lambda row: row["sourceRow"])
    OUTPUT.write_text("".join(json.dumps(row, sort_keys=True) + "\n" for row in results), encoding="utf-8")
    reason_counts = Counter(reason for row in results for reason in row["reasons"])
    target_counts = Counter(row["targetKind"] for row in results if row["accepted"])
    summary = {
        "policyVersion": POLICY_VERSION,
        "inputRows": EXPECTED_ROWS,
        "rawOutputSha256": sha256(RAW_OUTPUT),
        "acceptedExactAddressMatches": sum(1 for row in results if row["accepted"]),
        "heldOrUnmatched": sum(1 for row in results if not row["accepted"]),
        "acceptedByTargetKind": dict(sorted(target_counts.items())),
        "rejectionReasons": dict(sorted(reason_counts.items())),
        "coordinatePrecision": "interpolated_address_range",
        "verifiedBusinessLocation": False,
        "results": OUTPUT.name,
        "resultsSha256": sha256(OUTPUT),
    }
    SUMMARY.write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
