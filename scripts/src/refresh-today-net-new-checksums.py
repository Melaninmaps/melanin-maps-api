from __future__ import annotations

import hashlib
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BUNDLE = ROOT / "data/founder-imports/2026-09-06-today-net-new-businesses"
LEDGER = BUNDLE / "SHA256SUMS"
FILES = sorted([
    "GEOCODING_POLICY.md",
    "MWM_TODAY_NET_NEW_BUSINESSES_BUILD022_NYC_LARGE_CUMULATIVE_2026-09-06.xlsx",
    "README.md",
    "census-address-batch-input-summary.json",
    "census-address-batch-input.csv",
    "census-address-batch-output.csv",
    "census-geocode-results.jsonl",
    "census-geocode-summary.json",
    "conversion-summary.json",
    "link-validation-summary.json",
    "link-validation.json",
    "today-net-new-business-candidates.jsonl",
])


def digest(path: Path) -> str:
    value = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            value.update(block)
    return value.hexdigest()


def main() -> None:
    missing = [name for name in FILES if not (BUNDLE / name).is_file()]
    if missing:
        raise RuntimeError(f"Missing checksum artifacts: {','.join(missing)}")
    content = "".join(f"{digest(BUNDLE / name)}  data/founder-imports/2026-09-06-today-net-new-businesses/{name}\n" for name in FILES)
    temporary = LEDGER.with_suffix(".tmp")
    temporary.write_text(content, encoding="utf-8")
    os.replace(temporary, LEDGER)
    print(f"wrote {len(FILES)} unique checksum entries")


if __name__ == "__main__":
    main()
