---
name: Business Claims v2 architecture
description: Permanent rules for the claim workflow, data model, and admin approval transaction. Claiming ≠ verification.
---

## The rule
Approving a claim grants ownership control — it does NOT verify the business as Black-owned or minority-owned. These are separate, independent processes.

**Why:** Conflating claim approval with MWM verification would let an owner fraudulently obtain a verification badge just by submitting a claim.

**How to apply:** The approval transaction (`POST /admin/business-claims/:id/approve`) MUST:
- Set `ownership_control_status = 'claimed'`, `profile_status = 'claimed'`, `listing_status = 'live_claimed'`
- Create a `business_owner_links` row with `status = 'approved'` (NOT 'verified')
- NEVER touch `verified`, `verified_designations`, `black_owned`, ratings, safety scores, or community tags

## 4 independent state dimensions on businesses (added Aug 12 2026)
- `listing_origin` — how the listing entered the platform (imported / admin_added / community_added)
- `publication_status` — whether the listing is live for public discovery
- `ownership_control_status` — unclaimed / claim_pending / claimed / ownership_disputed
- `verification_status` — not_requested / pending / verified / rejected

## Key architecture facts
- `claims.ts` is the single authoritative router for all claim endpoints
- `community-impact.ts` previously had a competing `POST /businesses/:id/claim` that created owner links directly without evidence or attestation — REMOVED Aug 12 2026
- Old `GET /admin/claims` and `PATCH /admin/claims/:id` were guarded only by `req.user?.id` (any signed-in user could access) — now properly guarded by `isAdmin()`
- Old `PATCH /admin/claims/:id` approval wrote `verified = true` — wrong; now blocked with a 400 directing callers to the transaction endpoint

## New endpoints (Aug 12 2026)
- `GET /businesses/:id/claim-eligibility` — public, 6 states (not_found / not_claimable / already_claimed / pending_for_you / pending_for_other_user / claimable)
- `POST /businesses/:id/claims` — auth required, evidence required (verificationMethod + attestation + businessEmail + ownerName)
- `GET /me/business-claims` + `PATCH /me/business-claims/:id` — member self-service (withdraw / resubmit)
- `GET /admin/business-claims` + `PATCH /admin/business-claims/:id` — triage (needs_info / rejected only)
- `POST /admin/business-claims/:id/approve` — the ONLY correct way to approve; uses pg client transaction
- `POST /admin/business-claims/:id/revoke` — audit-preserving revocation

## new tables (Aug 12 2026)
- `business_listing_sources` — provenance records per listing
- `business_owner_outreach` — draft-only, sending DISABLED in release 1
