#!/usr/bin/env python3
"""Generate the immutable, deployable national-master import dataset.

This generator deliberately validates the supplied file before copying only the
business fields needed for a public MWM directory profile. It does not call an
API, database, geocoder, worker, or publication endpoint.
"""
from __future__ import annotations

import csv
import hashlib
import json
from pathlib import Path

SOURCE = Path('/home/ubuntu/upload/MWM-CUMULATIVE-NATIONAL-DIASPORA-MASTER-18294.csv')
OUTPUT = Path(__file__).resolve().parents[1] / 'artifacts/api-server/src/data/national-diaspora-master-18294.json'
EXPECTED_SHA256 = 'ecc8aa355ef785a172b235d27afb5d003e92675760f96c5abd6e0788e4905bb4'
EXPECTED_ROWS = 18_294

FIELDS = {
    'name', 'city', 'state', 'category', 'subcategory', 'cultural_specialty',
    'address', 'phone', 'website', 'source_url', 'source_name', 'source_status',
    'ownership_or_identity_evidence', 'regulated_profession',
    'public_display_recommendation', 'notes', 'audit_date',
    'offline_production_name_match', 'replit_action', 'price_range',
    'price_basis', 'price_last_checked', 'location_model', 'brand_or_franchise',
    'mobile_route_notes', 'nearby_cultural_sites_tags',
}


def clean(value: str | None) -> str:
    return (value or '').strip()


def main() -> None:
    digest = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
    if digest != EXPECTED_SHA256:
        raise SystemExit(f'Unexpected master checksum: {digest}')

    with SOURCE.open('r', encoding='utf-8-sig', newline='') as stream:
        reader = csv.DictReader(stream)
        rows = []
        for source_row, raw in enumerate(reader, start=2):
            record = {field: clean(raw.get(field)) for field in FIELDS}
            if not record['name'] or not record['city'] or not record['state']:
                raise SystemExit(f'Required name/city/state missing on CSV line {source_row}')
            record['source_row'] = source_row
            rows.append(record)

    if len(rows) != EXPECTED_ROWS:
        raise SystemExit(f'Unexpected master row count: {len(rows)}')

    payload = {
        'sourceFile': SOURCE.name,
        'sourceSha256': digest,
        'rowCount': len(rows),
        'generatedAt': '2026-09-24',
        'records': rows,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    print(json.dumps({'output': str(OUTPUT), 'rows': len(rows), 'sha256': digest}, indent=2))


if __name__ == '__main__':
    main()
