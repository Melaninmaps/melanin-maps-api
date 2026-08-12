# Mapping With Melanin — Read-Only Business Addition, Claim, Verification, and Outreach Revision

**Status:** Design review only. **No implementation is authorized by this document.**

## Founder direction adopted

Mapping With Melanin is community-powered. A legitimate business, independent provider, entrepreneur, creator, professional, organization, or informal community service provider may be listed before its owner joins. A formal LLC, EIN, corporate registration, storefront, website, or license is not universally required for listing. The platform must never invent missing facts or misrepresent an unverified provider as licensed, incorporated, credentialed, or vetted.

The platform must keep these concepts separate:

```text
Listing origin      = who supplied the public record and why it may appear
Ownership control   = who may manage the MWM profile
MWM verification    = a separately reviewed platform designation
Outreach            = a logged invitation to the owner through a public channel
```

> **A listing may be Community Added + Unclaimed + Unverified. A person may claim it and become Claimed by Owner + Unverified. Claiming never sets verified=true.**

---

# 1. Read-only current-state findings

## 1.1 Current database fields already supporting the model

| Concept | Existing model | Current state |
| --- | --- | --- |
| Listing visibility | `businesses.status`, `listing_status` | Present. `live_unclaimed` is already used for community-listed listings. |
| Community-listing UI state | `businesses.profile_status` | Present. Schema comments define `community_listed`, `claimed`, and `participating`. |
| Community origin/provenance | Raw `businesses.data_source` column populated by route SQL | Partially present in the database but absent from the typed Drizzle schema. Existing values include `community_submission` and `admin_entry`. |
| Public location and service information | `address`, `city`, `state`, `country`, `website`, social-link fields | Present, but `address`, `description`, latitude, and longitude are currently non-nullable in the typed schema. |
| Community submitter | `submitted_by_id` | Present but currently used as an ownership-control key, which is incorrect for community-added listings. |
| Claim request | `business_claims` | Present: owner name, email, website, social handle, status, notes. |
| Owner relationship | `business_owner_links` | Present: user, business, role, pending/verified link status. |
| MWM verification request | `verification_requests` and `businesses.verified` | Present: separate request model with basic/ownership/certified levels and admin review. |
| Owner outreach/invitation | `business_invites` | Present but limited: social handle/platform/status; current route uses it for email outreach only. |
| Community safety/quality reporting | `flag_count`, `flag_status`, feedback/review data | Present; must remain separate from ownership/verification. |

## 1.2 Current fields and behavior that are conflated

| Finding | Current behavior | Why it conflicts with founder direction |
| --- | --- | --- |
| Community submitter equals profile owner | `POST /businesses` writes `submitted_by_id = req.user.id`; owner management queries only that field. | A community member who adds a barber, caterer, artist, or realtor immediately gains owner-style control over someone else’s profile. |
| Claim approval equals MWM verification | Current `claims.ts` approval writes `verified=true`, `profile_status='owner_confirmed'`, and `submitted_by_id`. | A claimant establishing profile control must not automatically receive an MWM verified designation. |
| Verification request resolves the first claim by user | Verification flow looks up the first `business_claims` row for the caller. | It can connect a verification request to the wrong business when a member has multiple claims. |
| Two claim handlers for the same route | `claims.ts` and `community-impact.ts` both implement `POST /businesses/:id/claim`. | The two paths create different records and enforcement; one authoritative workflow is required. |
| Admin claim review lacks explicit admin guard | Current `claims.ts` review routes test signed-in state, not established admin authorization. | Ordinary members must never list, approve, reject, or revoke claims. |
| Community addition requires physical address | Member listing route requires name, category, address, city, and state; inserts zero coordinates. | This excludes legitimate mobile, home-service, online, informal, or service-area providers and creates non-mappable placeholder coordinates. |
| Existing owner-control read/write path | `/businesses/mine` and owner profile edits use `submitted_by_id`. | It cannot distinguish a community submitter, owner-added creator, co-owner, or approved manager. |
| Outreach invitation model | Current outreach accepts email only and only for `black_owned` records; stores email in a social-handle field. | It does not model web-contact, Instagram, Facebook, opt-out, source, consent/basis, or a non-sending draft state. |

## 1.3 Current user-interface behavior

| Surface | Current behavior | Required revision |
| --- | --- | --- |
| Business detail claim panel | Always displays “Is this your business?” and says a claim lets the user “manage your profile, respond to reviews, and get verified.” | Render state-aware copy. Replace “and get verified” with “request profile management; MWM verification is separate.” |
| Claim form | Collects name, email, phone, website, Instagram, role, and notes. | Retain appropriate evidence fields; add an ownership-control attestation, claim state, and privacy-safe status view. |
| Community/member add-business route | Requires address and immediately writes submitter ID. | Support exact address **or** service area/city; preserve contributor separately; never grant owner access until a claim is approved. |
| For Business Owners page | General early-access/contact form. | Replace or supplement with a member-authenticated **Add My Business / Service** path and a find-existing-listing / claim path. |
| Verification page | Separate verification application exists. | Keep separate. It must target one explicit business ID selected by the user, not a user’s first claim. |
| Admin outreach | Sends email immediately when route is invoked. | Store outreach preparation and approval state first; do not automatically send any outreach in this release. |

---

# 2. Revised approved design (implementation pending founder approval)

## 2.1 Four independent state dimensions

### A. Listing origin

| `listing_origin` | Meaning |
| --- | --- |
| `community_added` | A member, curator, or admin added a real provider using attributable public information. |
| `owner_added` | The future owner added their own business/service while signed in. |
| `admin_added` | An authorized MWM administrator added a record from an approved source. |
| `imported` | A governed dataset/import created the record; provenance is retained. |

### B. Ownership control

| `ownership_control_status` | Meaning |
| --- | --- |
| `unclaimed` | No authorized MWM profile manager. |
| `claim_pending` | A specific member has an ownership/control request under review. |
| `claimed` | A member has been approved to manage designated profile fields. |
| `ownership_disputed` | A claim or ownership relationship requires review; owner editing is paused. |

### C. MWM verification

| `verification_status` | Meaning |
| --- | --- |
| `not_requested` | No verification application exists. |
| `pending` | Separate MWM verification review is underway. |
| `verified` | MWM granted the specific approved designation. |
| `not_verified` | Review completed without a verified designation, or information is insufficient. |
| `revoked` | A prior MWM verified designation was revoked with audit history. |

### D. Listing publication

| `publication_status` | Meaning |
| --- | --- |
| `pending_review` | Enough information was submitted for review but public availability is not yet approved. |
| `live` | Real listing is discoverable under its applicable safety/privacy rules. |
| `removed` | Not publicly available; historical audit record retained. |
| `under_review` | Public rendering follows moderation decision; no automatic claims accepted. |

`listing_status` may be retained as a compatibility field during migration, but the application must derive its behavior from the four dimensions rather than assigning overlapping business meaning to a single string.

---

# 3. Community-added listing process

## 3.1 Who may add a provider

A signed-in community member, approved curator, or administrator may propose a listing for a real:

- business;
- independent service provider;
- entrepreneur or creator;
- professional;
- community organization;
- informal/community-based provider.

The intake must use language such as **Business / Service / Provider**, not language that implies every record is incorporated or licensed.

## 3.2 Minimum viable public evidence

A proposed community listing must have enough public information to identify the provider without invention:

| Field | Requirement |
| --- | --- |
| Display name | Required. Public provider/business/service name. |
| Category | Required. Include `independent_provider` / `community_entrepreneur` where appropriate. |
| City or service area | Required. A public address is optional. |
| Country/region | Required. |
| At least one public source | Required: official site, public social profile, booking page, reputable directory, public contact page, or verified local reference. |
| Source URL and source type | Required; stored internally as provenance. |
| Public description | Optional; factual and attributable. |
| Contact information | Optional; public channel only. |
| Exact map coordinate | Optional and allowed only for an approved public location. |

No LLC, EIN, business license, storefront, website, or corporate registration is required unless a later category-specific verification request requires it.

## 3.3 Publication behavior

A community-added record begins:

```text
listing_origin             = community_added
ownership_control_status   = unclaimed
verification_status        = not_requested
publication_status         = pending_review OR live
profile_status             = community_listed (compatibility display state)
submitted_by_id            = NULL
contributed_by_user_id     = community member who suggested it
```

Whether it becomes `live` immediately must be governed by source sufficiency and moderation rules—not by whether the owner has joined.

For a legitimate service-area provider with no public storefront, display **Service area: [city/region]** and do not create a false map pin. A person can still be searchable and claimable without a precise pin.

---

# 4. Owner-added listing process

A signed-in member may choose **Add My Business / Service** without first finding a community listing.

1. The owner chooses `Add My Business / Service`.
2. The system runs duplicate/near-match checks against name, city/service area, public URL, and public social handle.
3. If a likely existing listing appears, the owner is directed to claim that listing; they may report a false match.
4. If no real match appears, create a new record as:

```text
listing_origin             = owner_added
ownership_control_status   = claim_pending
verification_status        = not_requested
publication_status         = pending_review
contributed_by_user_id     = NULL
```

5. An approved ownership-control review creates the owner relationship and changes `ownership_control_status` to `claimed`.
6. This approval **does not** change `verification_status` to `verified` and does not grant a verification badge.

The basic owner-added listing and ownership-control request are free. No checkout, subscription, or claim fee may block the flow.

---

# 5. Revised claim process

## 5.1 Public and signed-in behavior

| Visitor | Required behavior |
| --- | --- |
| Unauthenticated | May see a static prompt: **“Own this business? Sign in or join to claim it.”** No claimant, owner, evidence, or review state is exposed. |
| Signed-in member, unclaimed live listing | May open a claim form and create one pending ownership-control request. |
| Signed-in member with own pending claim | Sees `pending_for_you` and can add requested information or withdraw. |
| Signed-in member, other person’s pending claim | Sees a neutral ownership-review message; no claimant data is exposed. |
| Claimed listing | Sees **Ownership issue?**; no second owner link is created. |

## 5.2 Claim approval result

Admin approval must be one database transaction that:

1. locks the listing and claim record;
2. verifies the listing is not already claimed or disputed;
3. marks the claim approved;
4. creates one approved `business_owner_links` relationship;
5. sets `ownership_control_status='claimed'` and `profile_status='claimed'`;
6. assigns appropriate owner or manager editing rights;
7. leaves `businesses.verified=false`, `verification_status='not_requested'`, and all `verified_designations` unchanged;
8. logs the administrator, decision basis, and timestamp;
9. sends a post-commit claim approval notification.

A claim approval establishes **profile control only**. It must not set `verified=true`, `verified_designations`, `black_owned`, licensed/credentialed labels, ratings, community feedback, safety statistics, or promotional status.

---

# 6. Separate MWM verification process

The existing `verification_requests` table is a useful foundation, but verification must require an explicit selected `business_id` and must no longer infer the business from the user’s first historical claim.

| Verification principle | Required design |
| --- | --- |
| Relationship to claim | An approved claim can make a member eligible to request verification; it does not preapprove it. |
| Scope | Verification covers only the designation and evidence approved by MWM. |
| Informal providers | May remain listed and claimed while unverified. They are not excluded for lacking corporate documents. |
| Category-specific requirements | Apply only when relevant—for example, licenses for regulated professional claims, not for every creator or independent service provider. |
| Public copy | Use **Claimed by Owner** and **Not yet verified by Mapping With Melanin™** where appropriate. |
| Approval effect | Only verification-review approval may set a verified designation. |

---

# 7. Required data-model revision

This is a proposed additive migration, not implementation authorization.

## 7.1 `businesses` additions / clarifications

| Field | Purpose |
| --- | --- |
| `listing_origin` | `community_added`, `owner_added`, `admin_added`, `imported`. |
| `publication_status` | `pending_review`, `live`, `removed`, `under_review`. |
| `ownership_control_status` | `unclaimed`, `claim_pending`, `claimed`, `ownership_disputed`. |
| `verification_status` | `not_requested`, `pending`, `verified`, `not_verified`, `revoked`. |
| `contributed_by_user_id` | Community contributor who suggested a record; never grants control. |
| `source_summary` | Small public-safe explanation, e.g., “Community-added from public Instagram.” |
| `service_area` | Public service area for mobile/online/informal providers. |
| `public_location_kind` | `address`, `service_area`, `online`, `unknown`; controls map behavior. |
| `public_contact_channel` | `email`, `website_contact`, `instagram`, `facebook`, `other`, `none`. |
| `public_contact_value` | Public channel/URL only; validated and non-sensitive. |

Retain existing `submitted_by_id` only during migration. After transition, owner access must be resolved from an approved `business_owner_links` record, not from `submitted_by_id` alone.

## 7.2 `business_claims` additions

Add `claim_type`, `attested_at`, `reviewed_by`, `reviewed_at`, `decision_reason`, `evidence_summary`, `evidence_url`, `withdrawn_at`, and one open-claim uniqueness constraint per member/business. This table records ownership-control requests, not verification applications.

## 7.3 `business_owner_links` additions

Add `claim_id`, `approved_by`, `approved_at`, `revoked_by`, `revoked_at`, and `revocation_reason`. Enforce one active primary owner per business; support later manager/co-owner roles only through an approved primary owner or admin path.

## 7.4 Provenance table

Create `business_listing_sources` rather than a single opaque source string:

| Field | Purpose |
| --- | --- |
| `id`, `business_id` | Relationship. |
| `source_type` | `official_website`, `public_social`, `booking_page`, `public_directory`, `community_reference`, `admin_research`, `owner_submission`. |
| `source_url` | Original public source URL. |
| `source_label` | Human-readable source title/account. |
| `captured_at`, `captured_by_user_id` | Audit trail. |
| `field_coverage` | Fields supported by the source. |
| `confidence` | `high`, `medium`, `low`; does not equal verified. |
| `is_current` | Current/retired source state. |

## 7.5 Outreach table

Expand/rework `business_invites` into an append-only `business_owner_outreach` model. Store preparations even when no outreach is sent:

| Field | Purpose |
| --- | --- |
| `business_id` | Listing. |
| `channel` | `email`, `website_contact`, `instagram`, `facebook_messenger`, `other`. |
| `public_destination` | Public business contact address/URL/handle; never a private contact. |
| `source_id` | Provenance of the contact channel. |
| `status` | `draft`, `approved_to_send`, `sent`, `delivered`, `responded`, `bounced`, `opted_out`, `closed`. |
| `prepared_by`, `approved_by`, timestamps | Accountability. |
| `template_version`, `message_snapshot` | Auditability. |
| `opt_out_reason` | Respect owner preference. |

**No automatic outreach is authorized in this phase.** The system should only store and review possible owner-contact channels. Any future sending workflow must use platform-policy-compliant, founder-approved channels and honor opt-outs.

---

# 8. Security and impersonation safeguards

| Risk | Required safeguard |
| --- | --- |
| Community submitter takes over a provider page | Never use `contributed_by_user_id` as owner authorization. Owner access requires approved claim link. |
| Random member claims a real business | Claim review, public-channel/evidence checks, attestation, one open claim constraint, and admin approval. |
| Unauthorized person approves claims | `isAdmin`/established admin guard on every claim queue, decision, and revocation endpoint; non-admin 403 tests are mandatory. |
| Duplicate claim handlers drift | Retire the duplicate route and use one authoritative claim API. |
| Race between two claim approvals | Single DB transaction with row locks and unique active-owner constraint. |
| Claim implies verification | No claim code may update `verified`, `verified_designations`, or `verification_status='verified'`. |
| Sensitive owner evidence leaks | Private object storage, signed admin-only URLs, redacted logs, and no evidence/claimant data in public APIs. |
| False location/pin | Exact public address only when owner/source permits; service-area records have no false coordinate. |
| External outreach abuse | Draft-only default, admin approval, public channel provenance, rate limits, opt-out handling, and no automatic DMs/emails. |
| Fuzzy false match | Duplicate/alias disambiguation before claim; no claim against an unrelated search result. |

---

# 9. Required UI language

Use clear, non-deceptive language:

| State | Approved display copy |
| --- | --- |
| Community listing | **Community Added · Unclaimed · Not Verified by MWM** |
| Owner-controlled profile | **Claimed by Owner · Not Verified by MWM** |
| Verified designation | **Claimed by Owner · Verified by MWM** with the specific verified designation only. |
| Informal provider | **Independent Provider** or **Community Entrepreneur** when appropriate; never imply incorporation or licensure. |
| Unauthenticated claim prompt | **Own this business? Sign in or join to claim it.** |

---

# 10. Founder-approval gate before implementation

Before Replit writes code or changes data, the founder must approve these decisions:

1. Whether community submissions may go live immediately with sufficient public provenance or must enter a curator queue by default.
2. Which member roles may suggest community listings.
3. Which public source types are sufficient for each listing category.
4. Whether any categories require a moderation hold due to harm, legal, medical, financial, or safety sensitivity.
5. The exact public badge/copy language.
6. The initial owner-control evidence threshold and reviewer SLA.
7. Whether the first release stores outreach drafts only (recommended) or permits approved sending in a later release.
8. The owner-edit field policy: which fields publish immediately, which require moderation, and which never alter community content.

## Final recommendation

Approve the revised model **only after** separating contributor identity, owner control, and MWM verification in code and data. This is the correct structure for the inclusive community-powered platform described by the founder: community members can help surface real providers, informal entrepreneurs are not excluded, owners can later claim and manage their representation for free, and MWM verification retains its own meaning.

**No database, route, UI, listing, outreach, or claim changes were made during this review.**
