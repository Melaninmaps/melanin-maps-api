# MWM Hotel-Stay Ingestion and Manual-Review Configuration

## Purpose

This configuration allows the tour workflow to add ordinary, non-minority hotels from a name and address while preventing invented fields, duplicate records, and false matches.

## Input contract

Accept:

```json
{
  "name": "Hotel name supplied by the traveler",
  "address": "Full street address supplied by the traveler",
  "sourceInput": "hotel_stay"
}
```

The input is a lead. It is not automatically a verified business.

## Resolution requirements

Replit must send the combined query `name, address` to the configured places provider. The provider response must include a stable place ID, matching name, complete formatted address, city, state, country, and a hotel/lodging category. Replit may store phone, website, coordinates, and hours only when the provider returns them. It must not synthesize missing values.

The automatic threshold in the supplied patch is a provider confidence score of at least `0.85`, a name match, complete location evidence, and a hotel-like category. Replit may raise this threshold; it must not lower it without a new test review.

## Manual-review behavior

If any of the following occurs, create a `pending` review item and do not create an active business row:

| Condition | Review reason |
|---|---|
| Provider returns no result | `provider_no_match` |
| Provider name differs materially | `provider_name_mismatch` |
| Address is incomplete | `provider_address_incomplete` |
| Resolved place is not a hotel/lodging business | `resolved_place_not_hotel` |
| Provider score is below 0.85 | `provider_confidence_below_threshold` |
| Multiple plausible hotels match | `ambiguous_provider_match` |
| Provider API is unavailable | `provider_unavailable` |

The review item must contain the original name and address, provider candidates if any, confidence score, reason, source input, and timestamp. It must not be published to public map/list/detail results.

## Review actions

An authorized reviewer can choose:

| Action | Result |
|---|---|
| Approve and add | Re-run the same duplicate-safe transaction and insert only the selected provider result. |
| Update existing | Attach evidence and missing fields to the canonical hotel. |
| Keep both | Only when the reviewer confirms separate physical locations. |
| Reject | Mark the candidate rejected; do not create a business row. |
| Needs more evidence | Leave pending and preserve the supplied lead. |

A reviewer must never be able to approve a raw AI-generated candidate without a provider or user-supplied source record.

## Duplicate rules

Before every insert, compare provider place ID, normalized name plus address, normalized phone, website domain, and coordinates. The database must have a unique index on `dedupe_key`. The transaction must use `ON CONFLICT DO NOTHING` and then return the canonical row. Ten simultaneous submissions of the same hotel must produce one canonical record.

## Road-use safety rules

The mobile flow should show one of three clear outcomes:

```text
Added: verified hotel saved.
Already listed: existing hotel updated; no duplicate created.
Needs review: not added because the address or identity could not be verified.
```

Never show “Added” for a manual-review result. Never display an unverified hotel on the public map. If the network or provider is unavailable, queue the lead locally or server-side for review and show “Needs review”; do not retry indefinitely or fabricate a result.

## Deployment checklist

1. Apply the supplied TypeScript patch to the governed ingestion module.
2. Confirm the `businesses` table has `providerPlaceId`, `normalizedName`, `dedupeKey`, `sourceEvidence`, `status`, `isDuplicate`, and `permanentlyHidden`.
3. Add a unique index on `dedupeKey` after resolving existing collisions.
4. Ensure all hotel, admin, member, screenshot, URL, and social paths call `ingestHotelStay` or the same shared upsert service.
5. Run the hotel test suite in staging.
6. Run the pre-tour health gate.
7. Run one real hotel test in production, repeat it, and confirm one canonical row.
8. Return a redacted commit SHA, test output, before/after row counts, and the manual-review record for one deliberately unresolved address.

## Required user-facing evidence

For each added hotel, show the traveler the name, verified address, source/provider, and any available website/phone/coordinates. For missing fields, show “not available” rather than an invented value. For manual review, show the exact reason and preserve the supplied name and address for later follow-up.
