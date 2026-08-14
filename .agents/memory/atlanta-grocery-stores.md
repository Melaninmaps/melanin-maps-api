---
name: Atlanta Black-Owned Grocery Stores
description: 4 verified Black-owned grocery stores seeded into businesses table for Atlanta GA (August 2026). Idempotent startup migration; also directly inserted.
---

## The 4 Stores (added August 14, 2026)

| Name | Address | Website | Phone |
|------|---------|---------|-------|
| Wadada Healthy Market & Juice Bar | 878 Ralph David Abernathy Blvd SW, 30310 | https://www.wadadaatl.com | (678) 974-7330 |
| Sevananda Natural Foods Market | 467 Moreland Ave NE, 30307 | https://sevananda.coop | (404) 681-2831 |
| Nourish + Bloom Market — Cascade | 2287 Cascade Rd, 30311 | https://www.nourishandbloommarket.com | None (autonomous) |
| Goodr Community Market on Edgewood | 381 Edgewood Ave SE, 30312 | https://goodr.co | None (contactless) |

## Startup Migration

Function: `ensureAtlantaBlackGroceryStores` in startup-migrations.ts
Registered as: "atlanta black grocery stores v1"
Pattern: ON CONFLICT (name, address, city, state) DO NOTHING — fully idempotent

**Why:** Grocery stores are not in the automated ingestion pipeline; they were manually curated from EatOkra, Storm's Mama directory, Atlanta Voice, AJC. Seed migration ensures they survive Railway redeploys.

## Coordinates Note

Sevananda and Nourish+Bloom: confirmed via Nominatim (OSM)
Wadada and Goodr: derived from road segment/address estimate — accurate to ~1 city block

## Ownership Designations

- Wadada: Black / African American-Owned, Woman-Owned
- Sevananda: Community-Owned Co-op, Black / African American-Owned
- Nourish + Bloom: Black / African American-Owned
- Goodr: Black / African American-Owned, Woman-Owned

## Audit Package

Manus v3 audit package: `attached_assets/manus-audit-package-v3-atlanta-grocery.zip`
Contains: README, 8-query SQL verification suite, full UX test protocol
