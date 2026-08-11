---
name: Kinfolk Adaptive Delivery & Audience Filter
description: Implementation location, test coverage, and governing rules for the adaptive tone and audience eligibility system.
---

## What was built
- `artifacts/api-server/src/kinfolk/adaptive-tone-and-audience-filter.ts` — Railway pg version of the reference implementation. Exports: `buildDeliveryInstructions`, `buildAdaptiveAnswerSystemPrompt`, `evaluateAudienceEligibility`, `loadAdaptiveDeliveryProfile`, `createAdaptiveDeliveryMiddleware`.
- `artifacts/api-server/src/kinfolk/__tests__/adaptive-tone-and-audience-filter.test.ts` — 14 vitest tests (all green).
- `scripts/validate-search-to-brick-staging.ts` — Supabase RLS + k-anonymity Search-to-Brick staging validation (requires staging env vars; does not run against Railway).

## Governing rules (permanent)
- Detail level (quick/standard/deep) is ALWAYS an explicit member choice — never inferred from location, education, or message style.
- High-stakes intents (medical, legal, financial, safety_emergency) override regional/slang tone regardless of member preference.
- `evaluateAudienceEligibility` controls only PROACTIVE push — it never restricts what a member can ask.
- Safety alert exception: official + current safety alerts bypass cadence rules but still return `allowedPresentation` for the UI.

## Why (critical)
A 13-year-old and a PhD are not separate identity classes. Depth comes from explicit preferences, not assumed ability. This is a founder-locked principle.

## DB table needed (not yet in Railway)
`kinfolk_delivery_profiles` — the staging validation and `loadAdaptiveDeliveryProfile` reference this table. Startup migration needed before production use.
