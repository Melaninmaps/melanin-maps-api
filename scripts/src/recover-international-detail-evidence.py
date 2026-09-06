from __future__ import annotations

import concurrent.futures
import importlib.util
import json
from collections import Counter
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
SOURCE_BUNDLE = ROOT / "data/founder-imports/2026-09-06-international-address-recovery"
SOURCE_POINTER = SOURCE_BUNDLE / "source-page-evidence-current.json"
OUTPUT_BUNDLE = ROOT / "data/founder-imports/2026-09-06-international-address-recovery/detail-page-evidence"
MODULE_PATH = Path(__file__).resolve().parent / "recover-international-source-evidence.py"
EXPECTED_BUSINESSES_WITH_LINKS = 214
EXPECTED_UNIQUE_DETAIL_URLS = 216
WORKERS = 4

spec = importlib.util.spec_from_file_location("international_source_recovery", MODULE_PATH)
assert spec and spec.loader
recovery = importlib.util.module_from_spec(spec)
spec.loader.exec_module(recovery)


def verified_current_results() -> list[dict[str, Any]]:
    pointer = json.loads(SOURCE_POINTER.read_text(encoding="utf-8"))
    manifest_path = SOURCE_BUNDLE / pointer["manifest"]
    if recovery.sha256_file(manifest_path) != pointer["manifestSha256"]:
        raise RuntimeError("SOURCE_EVIDENCE_MANIFEST_CHECKSUM_MISMATCH")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    results_path = SOURCE_BUNDLE / manifest["results"]["path"]
    if recovery.sha256_file(results_path) != manifest["results"]["sha256"]:
        raise RuntimeError("SOURCE_EVIDENCE_RESULTS_CHECKSUM_MISMATCH")
    rows = [json.loads(line) for line in results_path.read_text(encoding="utf-8").splitlines() if line.strip()]
    if len(rows) != recovery.EXPECTED_BUSINESSES or len({row["id"] for row in rows}) != recovery.EXPECTED_BUSINESSES:
        raise RuntimeError("SOURCE_EVIDENCE_COHORT_MISMATCH")
    return rows


def detail_result(row: dict[str, Any], pages: dict[str, dict[str, Any]]) -> dict[str, Any]:
    candidates: list[dict[str, Any]] = []
    page_outcomes: list[dict[str, Any]] = []
    for link in row["detailLinkCandidates"]:
        url = link["url"]
        page = pages[url]
        if not page.get("ok"):
            page_outcomes.append({"url": url, "status": "unavailable", "reason": page.get("reason"), "httpStatus": page.get("status")})
            continue
        parser = recovery.EvidenceParser()
        try:
            parser.feed(page["html"])
        except Exception:
            pass
        found = recovery.same_record_candidates(row, parser)
        page_outcomes.append({
            "url": url, "status": "address_candidate" if found else "no_strict_structured_address",
            "sourceFinalUrl": page.get("finalUrl"), "sourceResponseSha256": page.get("responseSha256"),
        })
        for candidate in found:
            candidates.append({**candidate, "detailSourceUrl": url, "detailSourceFinalUrl": page.get("finalUrl"), "detailSourceResponseSha256": page.get("responseSha256")})
    unique: dict[str, dict[str, Any]] = {}
    for candidate in candidates:
        identity = json.dumps({"address": candidate.get("address"), "geo": candidate.get("embeddedCoordinates")}, sort_keys=True)
        unique[identity] = candidate
    unique_candidates = list(unique.values())
    if len(unique_candidates) == 1:
        status = "structured_address_candidate"
    elif len(unique_candidates) > 1:
        status = "ambiguous_structured_address_candidates"
    else:
        status = "no_strict_structured_address"
    return {
        "id": row["id"], "name": row["name"], "city": row["city"], "country": row["country"],
        "sourceUrl": row["sourceUrl"], "status": status, "verificationStatus": "candidate_unverified",
        "addressCandidates": unique_candidates, "detailPageOutcomes": page_outcomes,
    }


def main() -> None:
    rows = verified_current_results()
    selected = [row for row in rows if row.get("detailLinkCandidates")]
    urls = sorted({link["url"] for row in selected for link in row["detailLinkCandidates"]})
    if len(selected) != EXPECTED_BUSINESSES_WITH_LINKS or len(urls) != EXPECTED_UNIQUE_DETAIL_URLS:
        raise RuntimeError("DETAIL_EVIDENCE_LINK_COHORT_MISMATCH")
    pages: dict[str, dict[str, Any]] = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=WORKERS) as executor:
        futures = {executor.submit(recovery.fetch_page, url): url for url in urls}
        for index, future in enumerate(concurrent.futures.as_completed(futures), start=1):
            url = futures[future]
            try:
                pages[url] = future.result()
            except Exception as error:
                pages[url] = {"ok": False, "url": url, "reason": type(error).__name__}
            if index % 20 == 0 or index == len(futures):
                print(f"fetched {index}/{len(futures)} detail pages", flush=True)
    results = [detail_result(row, pages) for row in selected]
    results_payload = "".join(json.dumps(result, ensure_ascii=False, sort_keys=True) + "\n" for result in results).encode()
    statuses = Counter(result["status"] for result in results)
    page_statuses = Counter(page.get("reason", "ok") if not page.get("ok") else "ok" for page in pages.values())
    summary = {
        "sourceBusinessesWithDetailLinks": len(selected), "uniqueDetailUrls": len(urls),
        "detailPageOutcomes": dict(sorted(page_statuses.items())),
        "businessEvidenceOutcomes": dict(sorted(statuses.items())),
        "structuredAddressCandidates": sum(result["status"] == "structured_address_candidate" for result in results),
        "ambiguousStructuredCandidates": sum(result["status"] == "ambiguous_structured_address_candidates" for result in results),
        "embeddedCoordinateCandidates": sum(1 for result in results if result["status"] == "structured_address_candidate" and result["addressCandidates"][0].get("embeddedCoordinates")),
        "verificationStatus": "candidate_unverified", "databaseWrites": 0, "mapPinWrites": 0,
    }
    original_bundle = recovery.BUNDLE
    original_generations = recovery.GENERATIONS
    original_pointer = recovery.CURRENT_GENERATION
    try:
        OUTPUT_BUNDLE.mkdir(parents=True, exist_ok=True)
        recovery.BUNDLE = OUTPUT_BUNDLE
        recovery.GENERATIONS = OUTPUT_BUNDLE / "generations"
        recovery.CURRENT_GENERATION = OUTPUT_BUNDLE / "current.json"
        published = recovery.publish_generation(results_payload, summary)
    finally:
        recovery.BUNDLE = original_bundle
        recovery.GENERATIONS = original_generations
        recovery.CURRENT_GENERATION = original_pointer
    print(json.dumps(published, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
