---
name: THE REAL Tag System
description: Professional trust-signal layer for service categories — 151 tags, DB tables, layer routing, seed endpoint. Distinct from The Vibe (atmosphere) and endorsement tags (community praise).
---

## What THE REAL Is

THE REAL is the third community-signal layer in Mapping With Melanin™:
- **The Vibe** → atmosphere/visit type signals (food, retail, arts, experience categories)
- **Endorsement Tags** → community praise signals (universal across all categories)
- **THE REAL** → professional trust signals (service/professional categories only)

THE REAL captures what the Black/minority community specifically experiences differently with professional service providers: being believed, advocated for, receiving culturally competent care, transparent pricing, dignity in the interaction.

## 151 Tags Across 9 Categories

| Category | Tag Count |
|---|---|
| Health & Wellness (clinical subcats only) | 23 |
| Legal & Government Services | 18 |
| Financial & Business Services | ~20 |
| Professional Services | ~18 |
| Home & Property Services | ~18 |
| Automotive & Transportation | ~15 |
| Technology & Digital Services | ~15 |
| Pets & Animal Services | 14 |
| Other Services | 13 |

**Health & Wellness exception**: Fitness & Gyms, Personal Trainers, Yoga & Pilates use The Vibe (movement/experience) — not THE REAL.

## Layer Routing (from Excel "Layer Routing" sheet)
- Professional/service categories → THE REAL
- Food, retail, travel, arts, events, family, faith, recreation → The Vibe

## Tag Types
- `real-specific` — tag stands alone, no adaptive family
- `real-adaptive` — renders culturally via family (same families as endorsement variants: knows_what_we_face, fought_for_me, believed_me, protected_my_privacy, no_predatory_terms, explained_like_i_was_smart)

## Display Threshold
5 community taps (lower than endorsement tags' 10 — professional trust signals are harder to earn and carry more weight).

## Code Locations
- Constants: `lib/db/src/constants/the-real-tags.ts` (1470 lines, all 151 tags)
- DB schema: `lib/db/src/schema/the-real.ts` (the_real_tags + the_real_taps tables)
- Seed endpoint: `POST /admin/seed-the-real-tags` in `artifacts/api-server/src/routes/admin.ts`
- Exported from `@workspace/db`: THE_REAL_TAGS, THE_REAL_CATEGORY_MAP, THE_REAL_CATEGORIES, usesTheReal(), getTheRealTagsForCategory(), THE_REAL_DISPLAY_THRESHOLD, HEALTH_VIBE_SUBCATEGORIES

## Production Status
- Seeded Aug 8 2026: 140 inserted, 11 already existed (total 151 in DB)
- DB tables: the_real_tags, the_real_taps (with UNIQUE constraint: business_id + user_id + tag_key)

## Key Rules (from source-of-truth Excel)
1. Praise only — concerns route to safety/report flow
2. One tap per user per tag per business (unique constraint enforced)
3. Owners cannot tap their own business
4. Adaptive labels roll up to ONE count per tag_key regardless of variant rendered
5. Tag eligibility is driven by business category, never user identity

**Why:** THE REAL was built because professional services (doctors, lawyers, mechanics, financial advisors) generate a completely different type of community signal than restaurants or retail. "This Doctor Listens" and "Believed My Pain" are not atmosphere signals — they're trust records that save lives and money. The Vibe system couldn't hold that weight.
