---
name: Business dedup architecture
description: Schema, soft-mark logic, review queue, and governed ingestion pipeline for business deduplication.
---

## Schema additions (all via ensureBusinessDedupSchema, boot-safe)
New columns on `businesses`:
- `normalized_name` text — accent-stripped, lowercase, non-alnum removed
- `dedupe_key` text — canonical identity key (name|geo or name|city|state|addr)
- `duplicate_of_id` uuid — FK to canonical row when is_duplicate=true
- `is_duplicate` boolean NOT NULL DEFAULT false
- `duplicate_reason` text
- `duplicate_marked_at` timestamptz
- `source_provider` text — where the record came from (google-places, url-jsonld, etc.)
- `source_url` text
- `retrieved_at` timestamptz
- `evidence` jsonb — array of Evidence objects from ingestion pipeline

Partial unique index: `businesses_active_dedupe_key_unique ON businesses(dedupe_key) WHERE NOT is_duplicate AND status NOT IN ('duplicate','permanently_hidden') AND dedupe_key IS NOT NULL`

## business_review_items table
Holds candidates that need human review before publication.
Fields: id, review_type (possible_duplicate|ownership_unverified|insufficient_evidence), status (pending|approved|rejected|merged|keep_both|needs_research), candidate_* fields, matched_business_id, score, reason, requested_attribute, evidence jsonb, resolved_by, resolved_at.

## Soft-mark logic
- `ensureBusinessDeduplication()` — idempotent, runs every boot
  - 17 confirmed non-Duke pairs from Manus full-DB audit (Aug 2026): sets is_duplicate=true, duplicate_of_id, status='duplicate' (preserves 'permanently_hidden' if already set)
  - Duke's Cafe: 93 rows already permanently_hidden → backfills is_duplicate=true, canonical=056404ec-1890-4bbd-aa1c-3e293c80ad92

## Manual review queue (8 rows seeded)
4 pairs in business_review_items with review_type='possible_duplicate':
- Busy Bee Cafe/Café (Atlanta) — same address, different coords
- Mrs. White's Golden Rule Cafe/Café (Phoenix) — different addresses
- Roscoe's House of Chicken & Waffles (LA) — 1514 vs 1518 N Gower St
- Scotchies Jerk Centre (Kingston) — 2 different addresses

## Governed ingestion pipeline (POST /api/businesses/ingest, admin-only)
- Kinds: query (Google Places), url (JSON-LD scrape), image (OpenAI vision gpt-4o)
- Evidence scoring: name(15) + address+city+state(20) + website(10) + phone(10) + coords(10) + maps source(15) + official_website source(15) + directory/web_search(5) → max 100
- Gate: score < 70 → NEEDS_REVIEW (business_review_items); ownership not verified → NEEDS_REVIEW
- Dedup: exact dedupe_key match OR 90% token similarity at same location → UPDATED_EXISTING
- Ownership: requires explicit evidence with confidence >= 0.8; never infers from name/photo/neighborhood

## Admin review UI
- Route: GET/PATCH /admin/business-review
- Web page: /admin/business-review (admin-business-review.tsx)
- Actions: Approve & Add, Reject, Merge into existing, Keep both, Needs more research

## Key files
- `artifacts/api-server/src/lib/business-dedup.ts` — dedupeKey, normalizeText, tokenSimilarity, sameLocation, evidenceScore
- `artifacts/api-server/src/routes/business-ingest.ts` — POST /api/businesses/ingest
- `artifacts/api-server/src/routes/admin.ts` — GET/PATCH /admin/business-review
- `artifacts/web/src/pages/admin-business-review.tsx` — review queue UI

**Why:** Manus audited all 2,736 businesses and found 110 confirmed duplicates across 17 groups. All cleanup is soft (reversible). New businesses are never blind-inserted — dedup gate prevents future duplicates at insert time.
