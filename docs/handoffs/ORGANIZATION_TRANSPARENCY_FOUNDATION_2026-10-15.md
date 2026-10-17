# Organization Transparency Foundation — Source-Only Handoff

**Date:** 2026-10-15
**Scope:** bounded intake, experience-policy, owner-boundary, Kinfolk-research, and native-intake foundation
**Release state:** **not deployed, not migrated, not enabled, not built**

## What this slice adds

### 1. Additive data model — approval required

`artifacts/api-server/migrations/20261015_organization_transparency.approval-required.sql` adds these isolated tables:

| Table | Purpose | Public by default? |
|---|---|---|
| `organization_profiles` | factual identity and independently moderated surface states | No |
| `organization_locations` | moderated location facts, separately from map-pin eligibility | No |
| `organization_experiences` | structured workplace, customer, patient, and caregiver experience submissions | No — pending moderation |
| `organization_owner_claims` | human-reviewed ownership/representative claims | No |
| `organization_owner_actions` | correction, public-response, and dispute requests | No — pending moderation |
| `organization_clinical_information_sources` | source-backed clinical-information receipts | No — pending moderation |
| `organization_transparency_audit_events` | append-only workflow receipts | N/A |

The migration is **additive** and contains no data `INSERT`, `UPDATE`, or `DELETE` statement. It does not alter existing business, review, user, source, directory, or membership data.

### 2. Surface separation policy

The server policy makes these states distinct:

- factual search listing;
- map placement;
- Kinfolk research/recommendation eligibility;
- promotion eligibility; and
- member-experience participation.

A member-added organization starts as `pending_moderation` and cannot become public through client input. A factual profile may be searchable without a pin, promotion, or Kinfolk eligibility. Member intake cannot self-assign `verified_minority_owned`; that remains an evidence-review outcome.

### 3. Source-gated API foundation

The API registration is protected by:

```text
ORGANIZATION_TRANSPARENCY_ENABLED === "true"
```

The feature remains **off** unless a future, separately authorized release explicitly enables it after the approved migration and review.

The registered contract covers:

| API surface | Safety boundary |
|---|---|
| exact duplicate candidates | exact name + city/state lookup before intake |
| organization intake | factual review hold, no implicit public listing |
| public organization detail | requires factual + search approval; exposes independent surface state |
| structured experience intake | relationship/context/category validation; no star ratings; moderation hold |
| owner claim | verification hold |
| owner action | approved claim required; action cannot modify/delete experience |
| administrator factual/surface decision | audit reason required; direct Kinfolk/promotion toggles rejected pending dedicated evidence receipts |

### 4. Native iOS/Android source journey

`artifacts/mobile/app/organization-transparency/submit.tsx` supplies a native, accessible foundation for the first member journey:

1. enter name/city/state;
2. run the exact duplicate check;
3. select organization type and member relationship;
4. optionally provide official website/phone and minimal factual context;
5. submit to moderation.

The UI makes these limits explicit:

- it does not show a verified ownership option;
- it does not collect ratings, scores, stars, diagnosis, employment records, or legal strategy;
- it says that submission does not make a record searchable, pinnable, promoted, or Kinfolk-recommended;
- it includes stable native `testID` hooks for future real-device testing.

The screen is intentionally not navigated into existing production navigation while the API flag is off.

### 5. Kinfolk research separation

Kinfolk now recognizes current-turn organization questions and injects an additional bounded policy block for:

- factual organization lookup;
- organization-experience submission help;
- employer research;
- healthcare workplace research; and
- healthcare care research.

The policy prevents blending staff workplace accounts, patient/caregiver context, factual identity, ownership assertions, promotions, clinical-quality claims, and care recommendations. Existing medical, legal, and safety evidence routes remain authoritative.

## Validation evidence

| Check | Result |
|---|---|
| API TypeScript check | Passed |
| focused API/Kinfolk tests | Passed — 17 tests |
| native UI source test | Passed — 4 tests |
| mobile TypeScript check | Passed on retry with an 8 GiB Node heap |
| mobile source pre-build gate | correctly blocked before a build because the working tree was intentionally dirty |
| migration mutation scan | Passed — no `INSERT`, `UPDATE`, or `DELETE` data operation |
| formatting / diff whitespace check | Passed for new source files |

No AWS, EAS, Device Farm, Railway, database, deployment, migration, or production operation occurred.

## Deliberately not implemented in this slice

The following require their own bounded, reviewed source slices before any release:

1. reviewer moderation console and role workflows;
2. identity, ownership, official-presence, location, and clinical-source evidence receipt capture;
3. map coordinate verification/pin publication;
4. Kinfolk’s structured factual retrieval adapter and source citations;
5. existing organization profile UI, correction workflow, owner dashboard, and owner-response/dispute UI;
6. structured experience display and appeal/moderation UI;
7. consented aggregate research/benchmarking pipeline with suppression thresholds;
8. native routing exposure, staging migration, source merge, EAS preview build, and Device Farm tests.

## Required approval sequence before activation

1. Founder reviews and approves this source PR and data model.
2. A reviewer-console/evidence-receipt source slice is completed.
3. Dedicated staging migration authorization is given; migration is run **only** against staging.
4. `ORGANIZATION_TRANSPARENCY_ENABLED=true` is set only in isolated staging after API and moderator workflow review.
5. Native routes are exposed only in a staging build after API readiness.
6. Device Farm iOS and Android evidence is reviewed.
7. Production release requires separate, explicit founder approval.
