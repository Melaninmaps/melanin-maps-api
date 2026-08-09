---
name: THE REAL Tag System
description: 151→299 professional trust-signal tags across 10 categories; separate from The Vibe; display threshold 5 taps; seeded in Railway production Aug 8 2026; childcare category added Aug 9 2026.
---

## What it is
THE REAL is the professional trust-signal layer for service-oriented business categories. It surfaces community-verified signals about dignity, cultural competence, safety, and communication — NOT experience/atmosphere signals (that's The Vibe).

## Architecture
- **DB table**: `the_real_tags` — tag_key (PK), label, category, type, adaptive_family, subcategory_scope, helper_text, sort_weight
- **Taps table**: `the_real_taps` — business_id, user_id, tag_key, created_at; index on business_id
- **Constants files** (MUST stay in sync):
  - `lib/db/src/constants/the-real-tags.ts` — primary source
  - `lib/constants/src/the-real-tags.ts` — mirror for mobile/web consumers
- **Startup guard**: `ensureTheRealTags()` in `startup-migrations.ts` — idempotent ON CONFLICT DO NOTHING seed from THE_REAL_TAGS constants

## Categories (10 total)
| Category | Tags in DB |
|---|---|
| Health & Wellness | 23 |
| Legal & Government Services | 18 |
| Financial & Business Services | 54 |
| Professional Services | 68 |
| Technology & Digital Services | 12 |
| Home & Property Services | 51 |
| Automotive & Transportation | 12 |
| Pets & Animal Services | 13 |
| Other Services | 11 |
| Childcare & Early Education | 25 |
| **Total** | **287** (298 in constants, 11 gap to close on next Railway push) |

## THE_REAL_CATEGORIES array
Both constants files export `THE_REAL_CATEGORIES: string[]` — 10 categories. `usesTheReal(category)` uses this to gate which businesses show THE REAL layer vs The Vibe. Both files confirmed to include "Childcare & Early Education" as of Aug 9 2026.

## THE_REAL_CATEGORY_MAP
Both constants files export `THE_REAL_CATEGORY_MAP: Record<string, TheRealTag[]>` — per-category filtered lookup. lib/db/src accidentally had this removed during a Childcare edit session; restored Aug 9 2026.

## Display threshold
Tags display when they reach 5 taps (not 10 — THE REAL is separate from The Vibe threshold).

## Childcare & Early Education (Task #179)
25 trust-signal tags designed for families choosing daycare, preschool, and early education providers. Key signals:
- "My Child Came Home Happy" — the most important signal
- "Same Teachers, Same Faces" — low turnover
- "Our Culture Was Never A Problem" — cultural competence
- "My Child's Hair Was Respected" — Black hair dignity
- "Strict About Pickup — No Exceptions" — safety
- "My Child's IEP Was Actually Followed" — special needs respect
- Full list in both constants files under category "Childcare & Early Education"

## Known gap
The `ensureTheRealTags` startup guard's insert counter is unreliable (shows 0 inserted even when ON CONFLICT DO NOTHING inserts rows). The count is cosmetic — the actual data integrity is verified by the 287/298 DB count. 11 remaining tags will be seeded on next Railway push.

## Absolute rules
- Never change THE_REAL_TAGS constants without syncing BOTH constants files
- Never delete a tag_key — only add new ones (existing taps would orphan)
- Category routing table is in three-layer-architecture.md
