---
name: Schema repair + community location tags
description: Two production column gaps fixed; community location/tag pipeline established; release status endpoints added.
---

## Production column gaps repaired (Aug 2026)

Two failures observed in Railway prod logs:
- `reviews.author_id does not exist` → PL/pgSQL boot migration adds column + copies from user_id/member_id/reviewer_id/created_by + creates index. Idempotent.
- `business_identity.age_restriction_reasons does not exist` → ALTER TABLE ADD COLUMN IF NOT EXISTS TEXT[]. (audience_type, environment_tags, amenity_tags already existed.)

Both applied as startup-migrations entries — Railway applies them on every first boot of the new revision.

## Community location + dynamic tag pipeline (Aug 2026)

13 new startup-migration entries, all idempotent:
- `community_locations` — canonical city/state/neighborhood records
- `community_location_aliases` — approved local phrases → explicit location (e.g. "Uptown" → "Uptown Charlotte" only in Charlotte NC)
- `community_tag_definitions` — slug-validated, `is_medical_claim BOOLEAN DEFAULT FALSE`, constrained to FALSE
- `business_location_contexts` — business ↔ location join (no FK enforced — MWM pattern)
- `business_location_community_tags` — per-location confirmed_member_count / confidence
- `community_tag_submissions` — private moderation inbox; never exposed to API
- `approved_location_community_tags` VIEW — confirmed_member_count >= 3 gate, approved status only
- `growing-hands` seed definition — is_medical_claim=FALSE, approved

**Files**:
- `artifacts/api-server/src/communityTags/postgresLocationTagRepository.ts` — listApprovedTags from VIEW; degrades gracefully (42P01/42703)
- `artifacts/api-server/src/lib/dynamicResponseCache.ts` — `sendDynamicJson()` sets no-store + removes ETag; NOT yet wired to routes (task #351)

## Release status endpoints

- `GET /api/version` → `{release: APP_RELEASE_SHA, deployedAt: APP_DEPLOYED_AT}`, no-store
- `GET /api/system/schema-status` → protected by `SCHEMA_STATUS_TOKEN` header; lists applied migration ledger; returns 404 when token absent (not enumerable)
- File: `artifacts/api-server/src/ops/registerReleaseStatusRoutes.ts`

## Kinfolk hair-loss detection

`HAIR_LOSS_RE` shortcut in `kinfolk.ts` (line ~2668) runs after `classifyKinfolkRequest`, before the LLM call. Returns `intentClass: "hair_loss_care"` + `hairLossCarePlan` — no generic salon search. Client rendering of `KinfolkHairLossCarePaths` still pending (task #349).

## Why
Railway production logs showed two column-missing errors stopping review and business-identity queries cold. 304 responses on map/listing endpoints were masking fresh data. The community tag pipeline is the foundation for location-specific "growing hands" and other moderated community signals.
