# Mapping With Melanin — Authoritative Community Business Listing and Free Owner-Claim Implementation Package

**Implementation authority:** This document supersedes prior claim-flow drafts where they conflict with the founder-approved community listing policy.  
**Objective:** Allow every signed-in member to add a real public business/service/provider; allow a future real owner to claim management access for free; keep platform verification separate; and preserve all community feedback as community-controlled.

> **Non-negotiable rule:** A community contributor is never automatically an owner. A claim approval is never an MWM verification. No business receives outreach, email, DM, or contact-form message in this release.

---

# 0. Strict change scope

## Allowed server/data files

```text
lib/db/src/schema/businesses.ts
lib/db/src/schema/business-claims.ts
lib/db/src/schema/business-owner-links.ts
lib/db/src/schema/[new business-listing-sources schema]
lib/db/src/schema/[new business-owner-outreach schema]
artifacts/api-server/src/lib/startup-migrations.ts
artifacts/api-server/src/routes/businesses.ts
artifacts/api-server/src/routes/claims.ts
artifacts/api-server/src/routes/community-impact.ts  (remove duplicate claim route only)
artifacts/api-server/src/routes/verification.ts
artifacts/api-server/src/routes/admin.ts             (claim/outreach admin paths only)
```

## Allowed web files

```text
artifacts/web/src/pages/business-detail.tsx
artifacts/web/src/pages/for-business-owners.tsx
artifacts/web/src/pages/profile*.tsx                 (claim/status view only)
artifacts/web/src/pages/admin*.tsx                   (claim/review queue only)
artifacts/web/src/[typed API hooks used only by these paths]
```

## Explicitly prohibited

Do **not** touch login/session handling, rate-limit behavior unrelated to claim routes, Map rendering, working business external-link components, Kinfolk chat behavior, Library, Safety Hub, community feedback aggregation, search ranking, mobile application, or unrelated business-page visuals.

---

# 1. Four independent business states

Do not encode all behavior in `listing_status`, `submitted_by_id`, or `verified`.

| State dimension | Required values | Meaning |
| --- | --- | --- |
| `listing_origin` | `community_added`, `owner_added`, `admin_added`, `imported` | Where the real public record came from. |
| `publication_status` | `pending_review`, `live`, `under_review`, `removed` | Whether the listing may be publicly discovered. |
| `ownership_control_status` | `unclaimed`, `claim_pending`, `claimed`, `ownership_disputed` | Who may manage owner-controlled fields. |
| `verification_status` | `not_requested`, `pending`, `verified`, `not_verified`, `revoked` | Separate MWM verification outcome. |

### Required public combinations

| Public listing condition | Required badges/copy |
| --- | --- |
| Community record, no owner | **Community Added · Unclaimed · Not Verified by Mapping With Melanin™** |
| Approved owner controls profile, not MWM verified | **Claimed by Owner · Not Verified by Mapping With Melanin™** |
| Approved owner plus separate MWM designation | **Claimed by Owner · Verified by Mapping With Melanin™** plus exact designation |
| Informal provider | **Independent Provider** or **Community Entrepreneur** as applicable |

`verified=true` and `verified_designations` must change **only** in the verification-review flow, never in a claim route.

---

# 2. Additive migration: `community_business_claims_v2`

Use one idempotent startup migration. Run a preflight conflict report before adding unique constraints; never delete claims, owner links, reviews, feedback, or source history silently.

## 2.1 `businesses` fields

```sql
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS listing_origin varchar(30),
  ADD COLUMN IF NOT EXISTS publication_status varchar(30),
  ADD COLUMN IF NOT EXISTS ownership_control_status varchar(30),
  ADD COLUMN IF NOT EXISTS verification_status varchar(30),
  ADD COLUMN IF NOT EXISTS contributed_by_user_id varchar(255),
  ADD COLUMN IF NOT EXISTS source_summary text,
  ADD COLUMN IF NOT EXISTS service_area varchar(255),
  ADD COLUMN IF NOT EXISTS public_location_kind varchar(30),
  ADD COLUMN IF NOT EXISTS public_contact_channel varchar(30),
  ADD COLUMN IF NOT EXISTS public_contact_value text;

-- Real service-area/online providers must not need fake physical data.
ALTER TABLE businesses
  ALTER COLUMN address DROP NOT NULL,
  ALTER COLUMN latitude DROP NOT NULL,
  ALTER COLUMN longitude DROP NOT NULL;
```

Backfill conservatively:

```sql
UPDATE businesses
SET
  listing_origin = COALESCE(listing_origin,
    CASE data_source
      WHEN 'community_submission' THEN 'community_added'
      WHEN 'admin_entry' THEN 'admin_added'
      ELSE 'imported'
    END),
  publication_status = COALESCE(publication_status,
    CASE WHEN status = 'active' THEN 'live' ELSE 'pending_review' END),
  ownership_control_status = COALESCE(ownership_control_status,
    CASE WHEN listing_status = 'live_claimed' THEN 'claimed' ELSE 'unclaimed' END),
  verification_status = COALESCE(verification_status,
    CASE WHEN verified = true THEN 'verified' ELSE 'not_requested' END),
  public_location_kind = COALESCE(public_location_kind,
    CASE
      WHEN latitude IS NOT NULL AND longitude IS NOT NULL
       AND NOT (latitude = 0 AND longitude = 0) THEN 'address'
      ELSE 'unknown'
    END)
WHERE listing_origin IS NULL
   OR publication_status IS NULL
   OR ownership_control_status IS NULL
   OR verification_status IS NULL
   OR public_location_kind IS NULL;
```

**Do not set `contributed_by_user_id` from historic `submitted_by_id` automatically.** Some existing values may represent actual owners, while others may be community submitters. Produce a conflict report and migrate only after an administrator classifies each legacy relationship.

## 2.2 Source provenance table

```sql
CREATE TABLE IF NOT EXISTS business_listing_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id varchar(255) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  source_type varchar(40) NOT NULL,
  source_url text,
  source_label varchar(255),
  field_coverage jsonb NOT NULL DEFAULT '[]'::jsonb,
  confidence varchar(15) NOT NULL DEFAULT 'medium',
  captured_at timestamptz NOT NULL DEFAULT now(),
  captured_by_user_id varchar(255),
  is_current boolean NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS business_listing_sources_business_idx
  ON business_listing_sources (business_id, is_current);
```

Allowed `source_type` values: `official_website`, `public_social`, `booking_page`, `public_directory`, `community_reference`, `admin_research`, `owner_submission`.

## 2.3 Claim and owner-link fields

```sql
ALTER TABLE business_claims
  ADD COLUMN IF NOT EXISTS claim_type varchar(30) NOT NULL DEFAULT 'ownership_control',
  ADD COLUMN IF NOT EXISTS verification_method varchar(40),
  ADD COLUMN IF NOT EXISTS evidence_url text,
  ADD COLUMN IF NOT EXISTS evidence_summary text,
  ADD COLUMN IF NOT EXISTS attested_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by varchar(255),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS decision_reason text,
  ADD COLUMN IF NOT EXISTS withdrawn_at timestamptz;

ALTER TABLE business_owner_links
  ADD COLUMN IF NOT EXISTS claim_id varchar(255),
  ADD COLUMN IF NOT EXISTS approved_by varchar(255),
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_by varchar(255),
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS revocation_reason text;

CREATE UNIQUE INDEX IF NOT EXISTS business_claims_one_open_claim_per_member_business
  ON business_claims (business_id, user_id)
  WHERE status IN ('pending', 'needs_info');

CREATE UNIQUE INDEX IF NOT EXISTS business_owner_links_one_active_primary_owner
  ON business_owner_links (business_id)
  WHERE status = 'approved' AND revoked_at IS NULL AND role = 'owner';
```

Use `approved` for the owner-link state. Do not use the link status word `verified` in new claim logic because it is semantically confused with MWM verification.

## 2.4 Outreach records — draft only

Create `business_owner_outreach` as an append-only draft/audit table. It may store a public source-backed channel but it must **never send** in this release.

```sql
CREATE TABLE IF NOT EXISTS business_owner_outreach (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id varchar(255) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  source_id uuid REFERENCES business_listing_sources(id),
  channel varchar(30) NOT NULL,
  public_destination text NOT NULL,
  status varchar(30) NOT NULL DEFAULT 'draft',
  prepared_by varchar(255),
  approved_by varchar(255),
  template_version varchar(50),
  message_snapshot text,
  opt_out_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

Release-1 invariant:

```text
No route may call email, SMS, DM, Messenger, contact-form, or notification delivery from this table.
Only status=draft may be created in release 1.
```

---

# 3. Community-add and owner-add flows

## 3.1 Community member adds a provider

### Route

```text
POST /api/businesses/submissions
Auth: any signed-in member
```

### Minimum request body

```ts
{
  displayName: string;                 // required
  category: string;                    // required
  cityOrServiceArea: string;           // required
  countryOrRegion: string;             // required
  sourceUrl: string;                   // required public source
  sourceType: "official_website" | "public_social" | "booking_page" |
              "public_directory" | "community_reference";
  description?: string;                // only when source-backed
  publicContact?: string;              // only when source-backed
  publicLocation?: { kind: "address"; address: string; city: string; state?: string } |
                   { kind: "service_area" | "online"; label: string };
  attestation: true;
}
```

### Server behavior

1. Require a real member session and member-keyed create limiter: **maximum three submissions per 24 hours per member and ten per 24 hours per IP**.
2. Validate name, category, city/service area, source URL (`http:`/`https:` only), and attestation.
3. Run duplicate/alias check by normalized name + city/service area + canonical source host/handle. Return possible matches but never auto-merge.
4. Create a record with:

```text
listing_origin             = community_added
publication_status         = pending_review initially
ownership_control_status   = unclaimed
verification_status        = not_requested
profile_status             = community_listed
contributed_by_user_id     = req.user.id
submitted_by_id            = NULL
verified                   = false
rating/reviews/feedback    = empty / real values only
```

5. Store the submitted source in `business_listing_sources` and only write record fields that it supports.
6. Queue a bounded Kinfolk public-source check. It may return `matched`, `ambiguous`, or `not_matched` and create additional source records; it cannot fabricate any field, publish an unsupported fact, claim an owner, set verification, create a coordinate, or send outreach.
7. If one source clearly matches the provider identity and no duplicate/conflict appears, a curator/admin may set `publication_status=live`. If identity is ambiguous, keep `pending_review`.
8. For a service-area/online provider, leave physical address and coordinates null. Set `public_location_kind=service_area` or `online`; never store `0,0`.

## 3.2 Owner adds their own absent business

The UI entry is **Add My Business / Service**.

1. The owner searches for a matching existing business first.
2. If a likely record exists, show the correct existing listing and begin an ownership claim—not a duplicate record.
3. If absent, use the same submission route with `listing_origin=owner_added`, source/attestation, and an attached pending ownership-control claim.
4. The new record begins:

```text
publication_status         = pending_review
ownership_control_status   = claim_pending
verification_status        = not_requested
submitted_by_id            = NULL
```

5. When published and claim approved, create the owner link. It remains **Claimed by Owner · Not Verified by MWM**.

No listing fee, claim fee, subscription, or checkout may appear in either flow.

---

# 4. Kinfolk public-source check

Implement this as a bounded asynchronous job triggered by a new submission—not an unbounded crawler.

| It may do | It must not do |
| --- | --- |
| Inspect submitted public URL and public account; query narrow name + city/service area; detect duplicates; normalize source-backed name/category/location/links; retain provenance. | Invent data; search private profiles; scrape behind logins; infer personal addresses; assign ownership; mark verified/licensed/safe; create map coordinates without a public address; contact the owner. |

Output contract:

```ts
{
  submissionId: string;
  outcome: "matched" | "ambiguous" | "not_matched";
  sourceIds: string[];
  supportedFields: string[];
  candidateDuplicateBusinessIds: string[];
  notesForCurator?: string;
}
```

A public Instagram account is sufficient provenance if it clearly identifies the provider/business name, service/category, and city/service area. It is **not** sufficient to show licensure, MWM verification, incorporation, credentials, ownership control, or safety.

---

# 5. Free owner-claim flow

## 5.1 Member endpoints

| Method | Route | Result |
| --- | --- | --- |
| `GET` | `/api/businesses/:id/claim-eligibility` | Member-only. Returns safe claim state; unauthenticated pages show only static “Sign in or join to claim” copy. |
| `POST` | `/api/businesses/:id/claims` | Creates one pending ownership-control claim. |
| `GET` | `/api/me/business-claims` | Returns only caller’s own claim statuses and private request details. |
| `PATCH` | `/api/me/business-claims/:id` | Adds requested evidence, resubmits from `needs_info`, or withdraws a pending claim. |
| `GET` | `/api/me/businesses` | Resolves approved owner links; never uses `submitted_by_id` as an ownership authorization key. |
| `PATCH` | `/api/me/businesses/:id/owner-profile` | Edits only owner-permitted fields after approved owner-link authorization. |

## 5.2 Eligibility logic

A business is claimable only if:

```text
publication_status       = live
ownership_control_status = unclaimed
no active approved owner link exists
no conflicting open claim exists
requester is authenticated
```

Return exactly one of:

```text
claimable
pending_for_you
pending_for_other_user
already_claimed
not_claimable
not_found
```

Do not use `submitted_by_id IS NULL` as a claimability condition after migration. The community contributor is intentionally separate from owner control.

## 5.3 Claim request requirements

The claimant supplies:

1. public/legal operator name;
2. role: owner, co-owner, manager, or authorized representative;
3. member email;
4. ownership-control attestation with timestamp;
5. one public-channel control signal; and
6. optional private explanation or contact number.

A public-channel control signal can be a business-domain email confirmation, a one-time code acknowledged through a listed official social/booking account, or an administrator’s documented manual reconciliation to a real public source. Do not require an LLC, EIN, storefront, website, or universal license.

## 5.4 Claim copy

| State | Required member copy |
| --- | --- |
| Eligible | **Is this your business? Start a free ownership claim.** |
| Submitted | **Claim submitted. We review clear requests within one business day.** |
| Needs information | **More information is needed to connect you to this public listing.** |
| Approved | **Claimed by Owner. Verification by Mapping With Melanin™ is separate.** |
| Other claimant pending | **An ownership claim is already under review.** |
| Claimed | **Ownership issue?** |

---

# 6. Secure administration and one approval transaction

## 6.1 Retire duplicate claim route

Remove only `POST /businesses/:id/claim` from `community-impact.ts`. Keep all unrelated community-impact code intact. `claims.ts` becomes the one authoritative claims router.

## 6.2 Administrator authorization

Every `/api/admin/business-claims*` route must use the project’s existing `isAdmin` authorization helper. A signed-in tester must receive 403 from:

```text
GET    /api/admin/business-claims
PATCH  /api/admin/business-claims/:id
POST   /api/admin/business-claims/:id/approve
POST   /api/admin/business-claims/:id/revoke
```

## 6.3 Approval transaction pseudocode

```ts
await transaction(async (tx) => {
  assert(isAdmin(request));

  const claim = await tx.query(
    `SELECT * FROM business_claims WHERE id=$1 FOR UPDATE`, [claimId]
  );
  const business = await tx.query(
    `SELECT * FROM businesses WHERE id=$1 FOR UPDATE`, [claim.business_id]
  );

  assert(claim.status === "pending" || claim.status === "needs_info");
  assert(business.publication_status === "live");
  assert(business.ownership_control_status === "unclaimed");
  assertNoActivePrimaryOwnerLink(tx, business.id);

  await tx.query(`UPDATE business_claims
    SET status='approved', reviewed_by=$1, reviewed_at=now(), decision_reason=$2
    WHERE id=$3`, [adminId, reason, claimId]);

  await tx.query(`INSERT INTO business_owner_links
    (business_id, user_id, role, status, claim_id, approved_by, approved_at)
    VALUES ($1,$2,'owner','approved',$3,$4,now())`,
    [business.id, claim.user_id, claim.id, adminId]);

  await tx.query(`UPDATE businesses SET
    ownership_control_status='claimed',
    profile_status='claimed',
    listing_status='live_claimed',
    updated_at=now()
    WHERE id=$1`, [business.id]);

  // Intentionally DO NOT change: verified, verified_designations,
  // verification_status, black_owned, ratings, safety, feedback, or community tags.
});

// Only after commit: notify the claimant inside MWM or email if a later approved
// notification policy permits it. A notification failure never reverses ownership approval.
```

A competing claim creates an ownership dispute; it never creates a second active owner. A manager may be added only by an approved owner or an administrator and cannot displace an owner.

---

# 7. Owner editing, community protection, and outbound traffic

## Immediate owner updates

Approved owner links may update, with standard URL/content validation:

```text
official website / booking link / public social links
services, offerings, appointment availability
owner-provided regular and temporary hours
public contact information
owner bio/story and owner-provided photo
accessibility, language, environment, and appointment details
```

Show **Owner updated** plus a timestamp. Owners may add a separately labeled **Owner-provided** tag.

## Moderator-review updates

```text
public/legal name or brand rename
address, service area, map coordinate, location kind
category/subcategory
licenses, credentials, insurance, regulated claims
ownership-designation claims
images/video and rights-sensitive content
business merge, location relationship, deactivation
sponsored/featured/promotional placement
```

Hours publish immediately as **Owner-provided hours**. A moderator may confirm/correct/request clarification only with a stored reason and audit trail; never silently overwrite the owner.

## Immutable community-controlled data

The owner must never edit, erase, reorder, hide, or manufacture:

```text
community reviews, comments, ratings
Community Vibes / Community Says
safety feedback, safety score, would-return-alone and recommendation measures
community tags and nominations
flags/reports, reporter identity, or moderation history
MWM verification status or verified designations
```

## Learn More and outbound links

A validated owner/business public URL is the external **Official website ↗** / **Learn more ↗** destination. Render only an absolute valid `http(s)` URL using `target="_blank" rel="noopener noreferrer"`. If no validated URL exists, hide the external action. **Learn more on MWM →** is a separate explicitly labeled internal detail-page action.

---

# 8. Sensitive-category disclaimer

A real community-added or owner-added provider in medical/wellness, legal, financial, real estate/housing, childcare/youth, transportation, recovery, safety/security, or another designated high-impact category remains discoverable when legitimate public provenance exists.

If the provider is not MWM verified, display:

> **Important:** This provider is listed from public community information and has not been verified by Mapping With Melanin™. For services affecting your health, legal status, finances, housing, safety, or a child’s care, use heightened caution and independently confirm credentials, licensing where applicable, pricing, availability, and suitability before engaging.

This is neutral platform-status context. It is not an accusation and it does not erase a valid listing.

---

# 9. Required test suite

## Security and state tests

1. Community contributor submits a real provider: contributor cannot call `/api/me/businesses` for that listing or edit it.
2. Owner-added record creates `owner_added + pending_review + claim_pending + not_requested`; it does not become verified.
3. Community added record with valid Instagram provenance can be published as `community_added + live + unclaimed + not_requested`.
4. Service-area provider stores null physical coordinates and has no false map pin.
5. `POST /claims` creates one pending claim and does not modify `verified`, `verification_status`, ratings, tags, safety, or feedback.
6. Non-admin obtains 403 on every admin claim route.
7. Approval transaction creates one `approved` owner link and `claimed` status, while `businesses.verified` remains unchanged.
8. Two parallel approve attempts result in exactly one active owner link.
9. Existing claimed business rejects another claim without revealing owner/claimant data.
10. Verification submission explicitly targets a selected business ID; it does not resolve the claimant’s first historical claim.
11. Draft outreach record never calls any sending/notification function.

## Browser journeys

1. Community member adds a source-backed independent provider and sees a pending/curator state—not an owner workspace.
2. Member opens a live unclaimed record and submits a free ownership claim.
3. Claimant sees pending status in Profile → Business Claims.
4. Admin approves it; claimant receives owner profile access and **Claimed by Owner · Not Verified by Mapping With Melanin™**.
5. Owner updates official link/hours; community reviews/safety controls are absent from their edit page.
6. Owner tries sensitive category/name/address/credential edit and sees moderation submission—not immediate change.
7. Missing-business search opens Add My Business / Service, not an unrelated fuzzy listing claim.
8. Unauthenticated visitor sees only static **Own this business? Sign in or join to claim it.** copy.

---

# 10. Production proof package and independent gate

Replit must submit one coherent proof package after one narrow deployment:

1. Changed-file list; no prohibited module changed.
2. Migration name, preflight legacy conflict report, and safe backfill totals.
3. `/api/version` proof with matching bundle hashes and `stale_bundle=false`.
4. Full automated test output for every test in Section 9.
5. HTTP 403 evidence for ordinary tester against all admin claim endpoints.
6. Transaction proof showing claim approval does **not** modify `businesses.verified` or `verification_status`.
7. Browser proof for community-add, owner-add, claim, approval, owner edit, and no-false-pin journeys.
8. Proof that `business_owner_outreach` stores only `draft` and produces zero delivery calls.
9. Claimability counts by `unclaimed`, `claim_pending`, `claimed`, `ownership_disputed`, plus legacy records needing manual classification.
10. Rollback plan that disables new creation/claim CTA safely without deleting claims, sources, owner links, community feedback, or audit history.

## Completion definition

The claims process is complete only when a real community listing can be added with attributable public information, an owner can later claim it free of charge without falsely becoming verified, only authorized administrators can approve control, and community intelligence remains untouched by owners.

**Do not mark this complete from source review or test fixtures. Independent authenticated production verification is required.**
