# Mapping With Melanin — Universal Business-Owner Claim Process

**Purpose:** Every **real, active, live-unclaimed** business listing must be claimable by a future owner after the owner creates or signs into a member account. No business is auto-claimed today. A claim is a verified request that remains pending until an authorized administrator approves it.

**Launch rule:** A traveler should be able to meet a business owner on tour, invite that owner to join Mapping With Melanin, find the existing business listing, submit a claim **for free**, and receive owner access only after a safe review. If the business is missing, the owner must be offered a real listing-submission path; the system must never fabricate a record to make the claim button work.

**Free-claim and open-traffic rule:** Claiming, verification, and the baseline owner profile are free. A verified owner keeps control of their official public website and social links. MWM must direct **Learn more** to that owner-controlled canonical URL in a safe external tab; it must not substitute an MWM blank route, redirect chain, or paywall. MWM is a community-discovery bridge, not a traffic trap.

> This is not a redesign. It is a narrow claim-flow unification and security repair. It must not modify login, sessions, Kinfolk, Library, maps, safety scoring, community feedback, business-search ranking, mobile flows, or any unrelated feature.

---

## 1. Current-state audit — why the existing process is incomplete

The repository currently contains two competing handlers for the same route:

| Current path | Current behavior | Required disposition |
| --- | --- | --- |
| `artifacts/api-server/src/routes/claims.ts` → `POST /businesses/:id/claim` | Collects owner contact fields into `business_claims`; blocks only `submitted_by_id` already set; admin endpoints are not role-protected. | Keep as the starting point, secure it, and make it authoritative. |
| `artifacts/api-server/src/routes/community-impact.ts` → `POST /businesses/:id/claim` | Creates a separate pending `business_owner_links` row with only a role; no evidence, no listing-status validation, no review process. | Remove this duplicate route. Do **not** leave two handlers for the same method and path. |
| `GET /admin/claims` and `PATCH /admin/claims/:id` in `claims.ts` | Checks only that a user is signed in, not that the user is an administrator. | **P0 security correction:** both must require the established admin-role guard. |

Because `claimsRouter` is registered before `communityImpactRouter`, the first matching handler likely wins today; relying on that ordering is unsafe. There must be **one** server-side claim contract, one review queue, one approval transaction, and one public owner-access outcome.

---

## 2. Universal claimability contract

A listing is claimable **only** when every condition below is true:

| Condition | Required value | Reason |
| --- | --- | --- |
| Listing exists | Matching `businesses.id` exists | A missing business must be submitted, not claimed. |
| Visibility | `status = 'active'` | Inactive/removed records are not owner-acquisition candidates. |
| Claim state | `listing_status = 'live_unclaimed'` | Ensures the public listing is intentionally claimable. |
| Existing primary owner | `submitted_by_id IS NULL` and no approved/verified owner link | Prevents competing owners. |
| Claimant session | `req.user.id` exists | Claims must be attached to a real signed-in member. |
| Claimant evidence | At least one verifiable method and truthful attestation | Prevents ownership takeover. |
| No unresolved competing claim | No open pending/needs-info claim from a different user, unless staff reassigns it | Avoids dueling claims. |

The claim-eligibility endpoint must return one of these exact outcomes:

| Status | Member-facing message | Action |
| --- | --- | --- |
| `claimable` | “Is this your business? Start a secure ownership claim.” | Open claim form. |
| `pending_for_you` | “Your ownership claim is being reviewed.” | Show status, evidence requirement, and cancel option. |
| `pending_for_other_user` | “An ownership claim is already being reviewed.” | Show contact/support path only; do not reveal claimant data. |
| `already_claimed` | “This business has a verified owner.” | Show report-ownership-issue path; no duplicate claim. |
| `not_claimable` | “This listing is not currently eligible for claim.” | Show a neutral support/contact path. |
| `not_found` | “We could not find this business.” | Offer **Add your business** using real submitted details. |

---

## 3. Required owner experience

### A. Existing business listing

The business detail page must show a visible **“Is this your business?”** call to action only when the eligibility response is `claimable`.

1. The owner signs in or creates a member account.
2. The owner searches the exact business and opens the real listing.
3. The owner selects **“Is this your business?”**.
4. The app calls `GET /api/businesses/:id/claim-eligibility`.
5. If `claimable`, the owner completes a short claim form:

| Required form field | Validation |
| --- | --- |
| Legal or public owner/operator name | Required; 2–255 characters. |
| Business role | Owner, co-owner, authorized manager, or representative. |
| Business email | Required; valid email. |
| Verification method | Required: domain email, official website/social match, business document, or manual review. |
| Official business URL | Required if the business has a website; otherwise a verified public social/booking URL is required. This becomes the owner-controlled **Learn more** destination after approval. |
| Verified social/booking links | At least one public Instagram, Facebook, TikTok, booking, or other official link; optional if an official website is supplied. |
| Ownership attestation | Required checkbox and timestamp. |
| Optional phone and notes | Optional; never public by default. |

6. The owner submits once. The UI displays **“Claim submitted — pending verification”**. It does not show ownership badges or management controls yet.
7. The owner can visit **Profile → Business claims** to see `pending`, `needs_info`, `approved`, or `rejected` status and only their own claim details.
8. An authorized administrator reviews the claim, asks for more information, approves, or rejects with a private reason.
9. On approval, owner access becomes active immediately and the business page indicates verified ownership without exposing private evidence.
10. The verified owner can maintain their official website, public social/booking links, and a concise business announcement. Updates are saved as owner-submitted changes; they do not overwrite community feedback or create false ratings.

### B. Missing business

If the owner cannot find a real listing, the directory must show a clearly separate **“Add your business”** entry point. This creates a `staged` or `pending_review` listing submission with source/evidence, not a false claim against a different business. Once staff confirms it is real, it becomes `live_unclaimed`; the submitter may then submit the same claim process.

### C. Owner-controlled outbound traffic and sharing

The approved `website` or verified `public_link` is the canonical **Learn more** target. Render it only after URL validation (`https:` preferred; no `javascript:`, data, localhost, or malformed values). The outbound link must use a direct absolute URL with `target="_blank"` and `rel="noopener noreferrer"`; it must never route through an empty internal page. If no validated destination exists, hide the link rather than emitting a broken button.

A verified owner may also publish a short, clearly labeled business update (for example, a new menu, event, appointment availability, or public announcement) to their MWM business page and share the canonical MWM business URL with their audience. This repair does **not** authorize automatic posting to Instagram, TikTok, Facebook, or any third-party account. Such cross-posting requires a separate opt-in integration and owner authorization.

### D. Already claimed business

Do not render an active claim button. Render **“Ownership issue?”**. This creates a private dispute/request for staff—not a second owner link. It must never reveal the existing owner’s email, user identity, or evidence.

---

## 4. Single authoritative data and state model

Use `business_claims` as the authoritative claim/review record. Keep `business_owner_links` as the post-approval relationship/read model only. Do not create a second independent claim workflow.

### Claim state machine

```text
claimable listing
  → pending
  → needs_info → pending
  → approved → verified owner link + business owner access
  → rejected (terminal; resubmission permitted only after a cooling-off/changed-evidence rule)
  → withdrawn (claimant cancels before decision)
```

### Migration — additive and idempotent

Create one named migration, for example `business_claim_workflow_v1`. It must not alter existing user logins, business content, reviews, feedback, or map data.

```sql
BEGIN;

ALTER TABLE business_claims
  ADD COLUMN IF NOT EXISTS verification_method varchar(40),
  ADD COLUMN IF NOT EXISTS verification_status varchar(30) NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS evidence_url text,
  ADD COLUMN IF NOT EXISTS attested_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by varchar(255),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS decision_reason text,
  ADD COLUMN IF NOT EXISTS withdrawn_at timestamptz;

ALTER TABLE business_owner_links
  ADD COLUMN IF NOT EXISTS claim_id varchar(255),
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_by varchar(255),
  ADD COLUMN IF NOT EXISTS revocation_reason text;

CREATE UNIQUE INDEX IF NOT EXISTS business_claims_one_open_claim_per_member_business
  ON business_claims (business_id, user_id)
  WHERE status IN ('pending', 'needs_info');

CREATE UNIQUE INDEX IF NOT EXISTS business_owner_links_one_verified_owner_per_business
  ON business_owner_links (business_id)
  WHERE status = 'verified' AND revoked_at IS NULL AND role = 'owner';

CREATE INDEX IF NOT EXISTS business_claims_review_queue_idx
  ON business_claims (status, created_at DESC);

COMMIT;
```

If current data contains conflicting duplicate open claims or owner links, **do not silently delete anything**. Produce a pre-migration conflict report, resolve it manually, then apply the unique indexes.

### Approval transaction

Approval must occur inside one database transaction with a row lock on the business:

1. Lock claim and business row (`FOR UPDATE`).
2. Confirm the approver is an administrator.
3. Confirm claim is `pending` or `needs_info`; confirm business is `active` and `live_unclaimed`; confirm no active verified owner link exists.
4. Update the claim to `approved`, `verification_status='verified'`, with reviewer and decision time.
5. Insert the `business_owner_links` row as `verified`, linked to `claim_id`.
6. Update the business: `submitted_by_id = claim.user_id`, `verified = true`, `profile_status = 'owner_confirmed'`, and `listing_status = 'live_claimed'`.
7. Commit, then send notifications after commit. Failed email must not undo approval.

Use a `manager` owner-link role only when a verified owner or administrator adds that manager later. A manager claim must never displace a verified owner.

---

## 5. Surgical API contract

### Retire duplicate behavior

`community-impact.ts` must no longer register `POST /businesses/:id/claim`. Remove only the duplicate claim handler; preserve unrelated community-impact endpoints.

### Required member endpoints

| Method and route | Auth | Result |
| --- | --- | --- |
| `GET /api/businesses/:id/claim-eligibility` | Member | Returns the safe eligibility state and neutral public message. |
| `POST /api/businesses/:id/claims` | Member | Creates one evidence-backed `pending` claim. 201 on new claim; 409 for conflicting claim or claimed business. |
| `GET /api/me/business-claims` | Member | Returns only the caller’s claims and status. |
| `PATCH /api/me/business-claims/:id` | Member | Allows claimant to add requested evidence, resubmit from `needs_info`, or withdraw a pending claim. |
| `POST /api/businesses/submissions` | Member | Existing/new submit flow for a business that is genuinely absent; creates no owner access until reviewed. |

### Required administrator endpoints

All `/api/admin/business-claims*` endpoints must use the **existing administrator-role authorization helper** and return HTTP 403 for an ordinary tester. Signed-in alone is not enough.

| Method and route | Required action |
| --- | --- |
| `GET /api/admin/business-claims?status=pending` | List the review queue; private evidence only for admins. |
| `PATCH /api/admin/business-claims/:id` | `needs_info`, `approve`, or `reject`, with non-empty reviewer reason for `needs_info` and `reject`. |
| `POST /api/admin/business-claims/:id/approve` | Performs the single transaction above; idempotent response if already approved. |
| `POST /api/admin/business-claims/:id/revoke` | Revokes a verified relationship with a reason; never deletes audit history. |

### Validation and rate limits

1. Retain IP-based abuse controls for anonymous traffic and login.
2. Use an authenticated member-keyed limiter for claim creation; recommended limit: 3 claim submissions per 24 hours per member plus 10 per 24 hours per IP.
3. Validate and normalize website URLs and social handles; strip HTML from free-text notes.
4. Never expose `email`, phone, evidence URL, admin notes, or claimant identity on public business APIs.
5. Claims must be excluded from recommendations, Library growth, notifications, community feedback, and analytics fan-out until approved; load-test accounts must not create claim side effects.

---

## 6. Required frontend scope

Allowed frontend files should be limited to the current business detail page, profile/business-claims surface, owner admin review surface, and typed API client/hook files required to call the endpoints. Do not touch the map, login, Kinfolk, Library, Safety Hub, or unrelated business-page content.

| Surface | Required behavior |
| --- | --- |
| Business detail page | Show claim status-aware CTA and form only after `claim-eligibility` confirms `claimable`. Disable submit while pending; preserve submitted form state. |
| Directory search | If no exact match, offer an explicit Add-your-business option; do not present unrelated fuzzy result as claimable. |
| Profile | “My business claims” with owner-only status and private review outcome. |
| Admin | Secure review queue showing evidence, decision history, and explicit approval/rejection controls. |
| Business owner workspace | Appear only after verified approval, never immediately after form submission. It includes validated official website/social/booking links and an owner announcement field, never community feedback controls. |
| Learn more link | Resolves only to the validated public owner URL in a new safe tab; hide it if no valid public destination exists. |

---

## 7. Required tests and production acceptance gate

### Server tests

| Test | Required pass result |
| --- | --- |
| Live unclaimed business, authenticated claimant | Eligibility is `claimable`; valid submission creates one `pending` claim. |
| Missing business | Eligibility is `not_found`; no claim row can be created. |
| Staged/inactive business | Eligibility is `not_claimable`; no claim row can be created. |
| Claimed business | Eligibility is `already_claimed`; second claim returns 409. |
| Competing claim | Different member receives `pending_for_other_user`; no claimant data exposed. |
| Non-admin reads admin queue | HTTP 403. |
| Non-admin tries approval/rejection/revocation | HTTP 403; no database mutation. |
| Admin approval | Claim, owner link, and business fields change together in one transaction. |
| Duplicate approve retry | Idempotent; one verified link only. |
| Rejected/needs-info flow | Claimant can view only their own outcome and resubmit only as allowed. |
| Existing UI claim route | Exactly one handler serves it; no conflict with `community-impact.ts`. |
| Free owner claim | No checkout, membership gate, subscription requirement, or claim fee appears before claim submission or approval. |
| External Learn more | A validated official owner URL opens externally; an invalid/missing URL never produces an internal white page. |
| Owner announcement | Approved owner can publish an announcement on their own MWM page; it does not overwrite community content or cross-post externally. |

### Browser tests

Run these without submitting a real claim in production:

1. A tester opens three real `live_unclaimed` listings from different cities/categories and sees the correct claim CTA and form.
2. A tester opens a known claimed/owner-linked listing and cannot create a duplicate claim.
3. A tester searches a missing business and sees Add-your-business rather than an unrelated fuzzy result being presented as a match.
4. A non-admin receives no admin claim queue/menu and gets a safe 403 if calling the endpoint directly.

### Production proof package

Replit must provide all of the following after **one narrow deployment**:

1. Changed-file list and migration name, proving the allowed scope only.
2. `/api/version` with matching bundle hashes and `stale_bundle: false`.
3. Migration output including any pre-existing data conflicts; no silent deletion.
4. Full server-test output for every case above.
5. Browser-test screenshot/video or Playwright output for all four browser paths.
6. Exact admin authorization proof: non-admin 403 and admin success (tokens/cookies redacted).
7. Counts by claimability state: `live_unclaimed`, `live_claimed`, staged/inactive, approved owner links, open claims, and conflicts.
8. Rollback plan: disable new claim CTA/route if needed; do not delete claim history or owner links.

---

## 8. Tour-ready owner invitation script

Use this exact member-facing wording once the process passes:

> “Your business is already listed on Mapping With Melanin. Create or sign into your member account, open your listing, and choose **‘Is this your business?’**. Submit the secure ownership claim with your public business contact information. We review the request before giving you owner controls, so no one can take over a business page without verification.”

If the business is absent:

> “We do not see a matching listing yet. Choose **‘Add your business’** and submit the real public details. Once the listing is reviewed and live, you can complete the same secure ownership claim.”

---

## 9. Completion definition

The feature is complete only when all real active `live_unclaimed` listings can enter the secure claim flow; only authorized administrators can approve claims; no business is auto-claimed; no second owner can overwrite a verified owner; missing businesses use the separate real-submission path; and independent browser/API tests pass.

**Do not mark complete from source inspection alone.** Submit the proof package above for independent verification.
