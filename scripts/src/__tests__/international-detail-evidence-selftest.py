from __future__ import annotations

import importlib.util
from pathlib import Path

MODULE_PATH = Path(__file__).resolve().parents[1] / "recover-international-detail-evidence.py"
spec = importlib.util.spec_from_file_location("international_detail_recovery", MODULE_PATH)
assert spec and spec.loader
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def main() -> None:
    rows = module.verified_current_results()
    selected = [row for row in rows if row.get("detailLinkCandidates")]
    urls = {link["url"] for row in selected for link in row["detailLinkCandidates"]}
    assert len(rows) == 1_316
    assert len(selected) == 214
    assert len(urls) == 216

    row = {
        "id": "00000000-0000-4000-8000-000000000001", "name": "Example Cafe",
        "city": "Accra", "country": "Ghana", "sourceUrl": "https://source.example/list",
        "detailLinkCandidates": [{"url": "https://business.example/"}],
    }
    exact_html = b'''<script type="application/ld+json">{"@type":"Restaurant","name":"Example Cafe","address":{"streetAddress":"10 High Street","addressLocality":"Accra","addressCountry":"GH"},"geo":{"latitude":5.55,"longitude":-0.20}}</script>'''
    result = module.detail_result(row, {"https://business.example/": {
        "ok": True, "html": exact_html.decode(), "finalUrl": "https://business.example/",
        "responseSha256": module.recovery.sha256_bytes(exact_html),
    }})
    assert result["status"] == "structured_address_candidate"
    assert result["verificationStatus"] == "candidate_unverified"
    assert result["addressCandidates"][0]["address"]["streetAddress"] == "10 High Street"

    wrong_city = exact_html.replace(b'"Accra"', b'"Kumasi"')
    result = module.detail_result(row, {"https://business.example/": {
        "ok": True, "html": wrong_city.decode(), "finalUrl": "https://business.example/",
        "responseSha256": module.recovery.sha256_bytes(wrong_city),
    }})
    assert result["status"] == "no_strict_structured_address"
    assert result["addressCandidates"] == []

    print("international detail evidence self-test passed")


if __name__ == "__main__":
    main()
