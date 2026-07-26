---
name: Verification architecture gap
description: No third-party identity verification vendor exists. Self-built photo upload + admin review only. Key architectural bugs and contradictions documented.
---

## The rule
No external identity verification service (Persona, Veriff, Onfido, Jumio, Stripe Identity, or any KYC provider) has ever been integrated, contracted, or configured. The $1.50 per-verification figure cited in a prior AI planning session was a planning estimate for a hypothetical vendor — never implemented.

## How to apply
Before any future session assumes a vendor is configured or that $1.50 charges exist: there is nothing to pause, cancel, or configure. The verification system is entirely self-built.

## What is actually built
- `community-verified.tsx` (598 lines): fully built mobile screen, 8 states, no navigation entry point from profile/settings
- `artifacts/api-server/src/routes/trust.ts`: identity_verifications table + admin review routes (PATCH sets trustLevel=2 on approval)
- `artifacts/api-server/src/routes/verification.ts`: `POST /verification/upload-document` — BUSINESS document upload endpoint, reused by member identity verification

## Critical bugs
1. `community-verified.tsx` line 149: both selfie AND gov_id paths submit `docType: "government_issued_id"` (copy-paste error — selfie is mislabeled)
2. `membership.tsx` line 1063 says verification is free; `trust.ts` line 85 returns 403 for free members — live production contradiction
3. `getTrustProgress()` advertises "Live selfie / liveness check" and "Government-issued ID" — neither service exists

## Architectural confusion
The mobile member verification flow reuses the BUSINESS document upload endpoint (`POST /api/verification/upload-document`), storing personal selfie images in `verification-docs/` alongside business documents.

## Why
No navigation entry point was ever added to community-verified.tsx. The screen is only reachable via direct route. Trust Level badge was never surfaced on the profile UI.

## Build 97 decision
- Community Member identity display (label on profile, nav entry point): INCLUDE — no schema change needed
- Verified Community Member paid workflow: DEFER — missing consent, no notification, architectural bugs, no vendor
