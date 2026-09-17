from __future__ import annotations

import csv
import hashlib
import ipaddress
import json
import re
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[2]
SOURCE_DIR = ROOT / "data/founder-imports/2026-09-16-55-city-research/cities"
OUTPUT_DIR = ROOT / "data/founder-imports/2026-09-16-55-city-research"
MERGED_CSV = OUTPUT_DIR / "source-backed-candidates.csv"
MANIFEST = OUTPUT_DIR / "source-backed-candidates.jsonl"
SUMMARY = OUTPUT_DIR / "research-consolidation-summary.json"
README = OUTPUT_DIR / "README.md"

REQUIRED_COLUMNS = [
    "name", "address", "city", "state", "postal_code", "country", "category",
    "subcategory", "services_search_terms", "description", "website", "instagram_url",
    "facebook_url", "tiktok_url", "source_url", "source_name", "ownership_designations",
    "ownership_evidence_url", "notes",
]
OUTPUT_COLUMNS = [
    *REQUIRED_COLUMNS,
    "normalized_category",
    "target_kind",
    "review_status",
    "review_gates",
    "dedupe_key",
    "source_file",
]

CATEGORY_RULES = [
    (r"beauty|barber|braid|hair|nail|spa|esthetic", "Beauty & Personal Care"),
    (r"food|restaurant|cafe|café|bakery|dessert|catering|nightlife|bar|lounge", "Food & Drink"),
    (r"health|medical|wellness|fitness|therapy|dental|doula", "Health & Wellness"),
    (r"law|legal", "Legal & Government Services"),
    (r"finance|account|tax|credit|financial", "Financial & Business Services"),
    (r"child|family|day care|daycare", "Children & Family"),
    (r"home|trade|hvac|plumb|electric|repair", "Home & Property Services"),
    (r"retail|book|marketplace|shop|fashion|grocery", "Shopping & Retail"),
    (r"travel|hotel|tour", "Travel & Hospitality"),
    (r"art|creative|theatre|museum|culture", "Arts, Culture & Entertainment"),
    (r"community|nonprofit|non-profit", "Community & Nonprofit"),
]
REGULATED_CATEGORY = re.compile(r"health|medical|law|legal|finance|account|tax|childcare|child care|home trades|hvac", re.I)
ADDRESS_HAS_NUMBER = re.compile(r"\b\d{1,6}\b")
NO_ADDRESS = re.compile(r"(?:not publicly listed|no street address|service area|local pickup|delivery only|appointment-based.*no|not published)", re.I)


def compact(value: object) -> str:
    return "" if value is None else re.sub(r"\s+", " ", str(value)).strip()


def normalized(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def safe_public_url(value: str) -> str:
    value = compact(value)
    if not value:
        return ""
    try:
        parsed = urlparse(value)
        if parsed.scheme not in {"https", "http"} or not parsed.hostname or parsed.username or parsed.password:
            return ""
        hostname = parsed.hostname.lower().rstrip(".")
        if hostname == "localhost" or hostname.endswith(".localhost") or hostname.endswith(".local"):
            return ""
        try:
            if not ipaddress.ip_address(hostname).is_global:
                return ""
        except ValueError:
            pass
        return value
    except ValueError:
        return ""


def classify_category(category: str, subcategory: str) -> str:
    source = f"{category} {subcategory}".lower()
    for expression, target in CATEGORY_RULES:
        if re.search(expression, source):
            return target
    return "Other Services"


def canonical_designations(value: str) -> list[str]:
    """Keep only an explicitly supplied designation, mapped to app filter labels.

    This maps text already captured from the cited source. It never derives a
    designation from a business name, category, address, image, or city.
    """
    source = normalized(value)
    labels: list[tuple[str, str]] = [
        (r"\bblack\b.*\b(?:owned|led|operated|founded)\b", "Black / African American-Owned"),
        (r"\blatino|\blatina|\bhispanic", "Latino / Hispanic-Owned"),
        (r"\bafro latino", "Afro-Latino-Owned"),
        (r"\bafrican\b.*\b(?:owned|led|operated|founded)\b", "African-Owned"),
        (r"\bcaribbean|\bwest indian", "Caribbean / West Indian-Owned"),
        (r"\bindigenous|\bnative american", "Indigenous / Native-Owned"),
        (r"\basian(?: american)?\b.*\b(?:owned|led|operated|founded)\b", "Asian American-Owned"),
        (r"\bwoman|\bwomen|\bfemale", "Woman-Owned"),
        (r"\blgbtqia|\blgbtq|\bqueer", "LGBTQIA+-Owned"),
        (r"\bveteran", "Veteran-Owned"),
        (r"\bdisability|\bdisabled", "Disability-Owned"),
        (r"\bfamily\b.*\b(?:owned|operated)", "Family-Owned"),
        (r"\bcooperative|\bworker owned", "Cooperative / Worker-Owned"),
    ]
    return sorted({label for expression, label in labels if re.search(expression, source)})


def review_fields(row: dict[str, str]) -> tuple[str, str, list[str]]:
    category = f"{row['category']} {row['subcategory']}"
    gates: list[str] = ["source_url_and_address_manual_confirmation_required", "geocode_before_public_pin"]
    if row["ownership_designations"]:
        gates.append("ownership_evidence_manual_confirmation_required")
    if REGULATED_CATEGORY.search(category):
        gates.append("regulated_or_age_governed_service_review_required")
    target_kind = "regulated_review" if REGULATED_CATEGORY.search(category) else "business"
    status = "needs_research" if len(gates) > 2 else "pending_review"
    return target_kind, status, sorted(gates)


def validate(row: dict[str, str]) -> str | None:
    if not row["name"] or not row["city"] or not row["state"]:
        return "missing_identity_or_geography"
    if not row["address"] or NO_ADDRESS.search(row["address"]) or not ADDRESS_HAS_NUMBER.search(row["address"]):
        return "missing_public_street_address"
    if not row["source_url"] or not safe_public_url(row["source_url"]):
        return "missing_safe_source_url"
    if not any(safe_public_url(row[field]) for field in ["website", "instagram_url", "facebook_url", "tiktok_url"]):
        return "missing_public_business_destination"
    return None


def main() -> None:
    files = sorted(SOURCE_DIR.glob("*.csv"))
    if len(files) != 56:
        raise RuntimeError(f"Expected 56 city files, found {len(files)}")

    accepted: list[dict[str, str]] = []
    held = Counter()
    source_count = 0
    seen: set[str] = set()
    duplicate_count = 0

    for file in files:
        with file.open("r", encoding="utf-8", newline="") as handle:
            reader = csv.DictReader(handle)
            if reader.fieldnames != REQUIRED_COLUMNS:
                raise RuntimeError(f"Unexpected header in {file.name}: {reader.fieldnames}")
            for raw in reader:
                source_count += 1
                row = {column: compact(raw.get(column)) for column in REQUIRED_COLUMNS}
                for field in ["website", "instagram_url", "facebook_url", "tiktok_url", "source_url", "ownership_evidence_url"]:
                    row[field] = safe_public_url(row[field])
                reason = validate(row)
                if reason:
                    held[reason] += 1
                    continue
                dedupe_key = "|".join(normalized(row[field]) for field in ["name", "address", "city", "state"])
                if dedupe_key in seen:
                    duplicate_count += 1
                    continue
                seen.add(dedupe_key)
                normalized_category = classify_category(row["category"], row["subcategory"])
                target_kind, review_status, gates = review_fields(row)
                accepted.append({
                    **row,
                    "normalized_category": normalized_category,
                    "target_kind": target_kind,
                    "review_status": review_status,
                    "review_gates": ";".join(gates),
                    "dedupe_key": dedupe_key,
                    "source_file": file.name,
                })

    accepted.sort(key=lambda row: (row["state"], row["city"], row["normalized_category"], row["name"]))
    with MERGED_CSV.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=OUTPUT_COLUMNS)
        writer.writeheader()
        writer.writerows(accepted)

    with MANIFEST.open("w", encoding="utf-8") as handle:
        for index, row in enumerate(accepted, start=1):
            gates = row["review_gates"].split(";") if row["review_gates"] else []
            record = {
                "sourceRow": index,
                "sourceWorkbook": "2026-09-16-55-city-research",
                "sourceFile": row["source_file"],
                "targetKind": row["target_kind"],
                "status": row["review_status"],
                "dedupeKey": row["dedupe_key"],
                "name": row["name"],
                "city": row["city"],
                "state": row["state"],
                "country": row["country"],
                "category": row["normalized_category"],
                "subcategory": row["subcategory"],
                "address": row["address"],
                "postalCode": row["postal_code"] or None,
                "website": row["website"] or None,
                "sourceUrl": row["source_url"],
                "sourceName": row["source_name"],
                "ownershipDesignations": canonical_designations(row["ownership_designations"]),
                "ownershipEvidence": row["ownership_evidence_url"] or None,
                "regulatedProfession": row["target_kind"] == "regulated_review",
                "sourceStatus": "source_backed_2026_09_16",
                "instagramUrl": row["instagram_url"] or None,
                "facebookUrl": row["facebook_url"] or None,
                "tiktokUrl": row["tiktok_url"] or None,
                "notes": row["notes"] or None,
                "rawRecord": {
                    "description": row["description"],
                    "searchTags": [item.strip() for item in row["services_search_terms"].split(";") if item.strip()],
                    "publicSearchTagEvidence": "workbook_category_services_and_reviewed_offerings_only",
                    "reviewGates": gates,
                },
            }
            handle.write(json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n")

    status_counts = Counter(row["review_status"] for row in accepted)
    target_counts = Counter(row["target_kind"] for row in accepted)
    city_counts = Counter(f"{row['city']}, {row['state']}" for row in accepted)
    summary = {
        "cityFiles": len(files),
        "researchedRows": source_count,
        "candidateRowsAfterMandatoryPublicLocationAndSourceChecks": len(accepted),
        "heldRows": dict(sorted(held.items())),
        "duplicateRowsRemoved": duplicate_count,
        "statusCounts": dict(sorted(status_counts.items())),
        "targetKindCounts": dict(sorted(target_counts.items())),
        "citiesRepresented": len(city_counts),
        "minimumCandidatesPerCity": min(city_counts.values()) if city_counts else 0,
        "maximumCandidatesPerCity": max(city_counts.values()) if city_counts else 0,
        "sha256": {
            "sourceBackedCandidatesCsv": hashlib.sha256(MERGED_CSV.read_bytes()).hexdigest(),
            "sourceBackedCandidatesJsonl": hashlib.sha256(MANIFEST.read_bytes()).hexdigest(),
        },
    }
    SUMMARY.write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    README.write_text(
        "# 55-city source-backed business candidate package\n\n"
        "This package combines one research file per configured Kinfolk launch city. A row is included only when it retained a public street address, an attributable source URL, and an official business destination (website or official social profile). Rows that did not meet those requirements were held out rather than fabricated.\n\n"
        "The JSONL manifest is deliberately a **candidate** import, not a direct production write. Before publication, the existing founder directory workflow must: check duplicate identity; validate current links; confirm any ownership designation against its evidence URL; validate required regulated-service credentials; obtain an address-backed coordinate; and record the review decision. The current public business lifecycle, authentication, and business-claim controls remain unchanged.\n\n"
        "Ordinary business candidates may proceed after those checks. Regulated or age-governed candidates are flagged as `regulated_review`; candidates with identity designations have a separate ownership-evidence gate. This preserves searchable, truthful directory results without treating sourced data as MWM verification.\n",
        encoding="utf-8",
    )
    print(json.dumps(summary, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
