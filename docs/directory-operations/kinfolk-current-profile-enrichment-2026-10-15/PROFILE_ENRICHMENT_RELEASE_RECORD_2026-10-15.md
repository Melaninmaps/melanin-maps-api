# Kinfolk Current Profile Enrichment — Release Record

**Prepared:** 2026-10-15

## Purpose

Publish missing, source-receipted profile information found on verified official business websites for the current Kinfolk Current catalog. The batch is additive and field-scoped; it does not alter business identity, address, ownership, category, membership, lifecycle, coordinates, media, pricing, or eligibility.

## Reviewed current-scope manifests

- **Manifest format:** `profile-enrichment-v2`
- **Scope:** `kinfolk_current`
- **Candidate businesses:** **2,364**
- **Bounded manifests:** **24** (100 businesses maximum per manifest; final manifest has 64)
- **Manifest directory:** `apply-manifests-v2/`
- **Manifest index:** `apply-manifests-v2/manifest-index.json`
- **Generation timestamp:** `2026-10-15T22:02:50.000Z`

Each manifest is SHA-256 fingerprinted and includes a current business identity snapshot plus one field receipt for every proposed field. The production apply route locks and rechecks every row before a change.

## Proposed factual fields

| Field | Candidate count |
|---|---:|
| Description | 1,829 |
| Hours | 786 |
| Phone | 1,386 |
| Service tags | 783 |
| Instagram | 395 |
| TikTok | 127 |
| Facebook | 472 |
| X/Twitter | 531 |
| YouTube | 422 |
| Pinterest | 119 |
| Website | 0 |

The counts overlap: one business can have more than one proposed field.

## Enforced write behavior

1. **Identity and scope recheck:** current name, city, state, official website, public lifecycle, and Kinfolk Current membership must match the manifest at application time.
2. **First-party receipts:** every changed field requires exactly one official-source receipt.
3. **Missing fields only:** existing non-empty public facts are never overwritten.
4. **Service tags:** only new tags are appended.
5. **Generic descriptions:** 1,782 high-confidence description proposals are permitted to replace only a closed list of short, generic import labels (for example `Barber` or `Beauty & Hair`). A substantive description is never overwritten; that description field is skipped while other independently safe fields may still be applied.
6. **Automatic hold:** changed identities, queued Delete Review records, non-public listings, missing receipts, unsupported values, or material contact conflicts are skipped and recorded rather than changed.
7. **Auditability:** every applied field creates a field receipt and an Admin profile-edit audit event.

## Exclusions

This package does not activate provider connections, modify member information, change directory eligibility, publish records that are not already public, create map pins, modify ownership designations, or replace a substantive profile field.

## Production state at preparation

No profile changes are made by building these manifests. Production publication requires the validated API release to be live and then applies these exact committed manifests through the authenticated Admin route.
