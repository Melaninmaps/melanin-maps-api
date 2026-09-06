from __future__ import annotations

import concurrent.futures
import hashlib
import json
import ssl
import urllib.error
import urllib.request
from collections import Counter
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
BUNDLE = ROOT / "data/founder-imports/2026-09-06-today-net-new-businesses"
MANIFEST = BUNDLE / "today-net-new-business-candidates.jsonl"
OUTPUT = BUNDLE / "link-validation.json"
SUMMARY = BUNDLE / "link-validation-summary.json"
EXPECTED_ROWS = 3_367
FIELDS = ("website", "sourceUrl", "instagramUrl", "facebookUrl", "tiktokUrl", "socialSourceUrl")
USER_AGENT = "MappingWithMelanin-Staging-LinkAudit/1.0"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def check(url: str) -> dict[str, Any]:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml,*/*;q=0.8"})
    try:
        with urllib.request.urlopen(request, timeout=10, context=ssl.create_default_context()) as response:
            status = int(response.status)
            final_url = response.geturl()
            return {"url": url, "status": status, "finalUrl": final_url, "reachable": 200 <= status < 400}
    except urllib.error.HTTPError as error:
        status = int(error.code)
        return {"url": url, "status": status, "finalUrl": error.geturl(), "reachable": status in {401, 403, 405, 429}}
    except Exception as error:
        return {"url": url, "status": None, "finalUrl": None, "reachable": False, "errorType": type(error).__name__}


def main() -> None:
    rows: list[dict[str, Any]] = []
    with MANIFEST.open(encoding="utf-8") as handle:
        for line in handle:
            if line.strip():
                rows.append(json.loads(line))
    if len(rows) != EXPECTED_ROWS:
        raise RuntimeError("LINK_VALIDATION_COHORT_MISMATCH")
    urls = sorted({row.get(field) for row in rows for field in FIELDS if row.get(field)})
    with concurrent.futures.ThreadPoolExecutor(max_workers=16) as executor:
        results = list(executor.map(check, urls))
    by_url = {row["url"]: row for row in results}
    OUTPUT.write_text(json.dumps(by_url, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    statuses = Counter(str(row["status"]) if row["status"] is not None else row.get("errorType", "error") for row in results)
    candidate_counts = Counter()
    for row in rows:
        direct = [row.get(field) for field in ("website","instagramUrl","facebookUrl","tiktokUrl") if row.get(field)]
        evidence = [row.get(field) for field in ("sourceUrl","socialSourceUrl") if row.get(field)]
        direct_ok = any(by_url[url]["reachable"] for url in direct)
        evidence_ok = any(by_url[url]["reachable"] for url in evidence)
        if direct_ok: candidate_counts["reachable_direct_link"] += 1
        elif evidence_ok: candidate_counts["reachable_evidence_link_only"] += 1
        else: candidate_counts["no_reachable_link"] += 1
    summary = {
        "manifestRows": len(rows),
        "uniqueUrlsChecked": len(results),
        "reachableUrls": sum(1 for row in results if row["reachable"]),
        "unreachableUrls": sum(1 for row in results if not row["reachable"]),
        "statusCounts": dict(sorted(statuses.items())),
        "candidateLinkOutcomes": dict(candidate_counts),
        "output": OUTPUT.name,
        "outputSha256": sha256(OUTPUT),
    }
    SUMMARY.write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
