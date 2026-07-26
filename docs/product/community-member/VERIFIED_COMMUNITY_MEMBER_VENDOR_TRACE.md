# Mapping With Melanin™ — Verified Community Member
# Third-Party Vendor and Configuration Trace
**AUDIT-006B | July 26, 2026 | READ-ONLY | No implementation authorized**  
**Authorization phrase to begin implementation:** "Please implement."

---

## DIRECT ANSWERS — 8 REQUIRED QUESTIONS

**A. Which third-party vendor, if any, was previously selected?**

None. No third-party identity verification vendor was selected, integrated, contracted, or configured at any point in the current codebase, documentation, git history, environment variables, or package dependencies. The $1.50 per-verification figure was stated in a prior AI planning session and was never converted into a vendor selection, contract, API key, SDK installation, or any line of code.

**B. Are any vendor keys, configuration identifiers, packages, routes, or webhook secrets currently attached to the project?**

No. Zero vendor keys, zero SDK imports, zero package.json references, zero environment variables, zero webhook routes, and zero API calls to any external identity verification service exist anywhere in the project.

**C. Is the vendor currently usable in production?**

Not applicable. There is no vendor. There is nothing to use, configure, or activate.

**D. Does the present workflow use selfie/liveness, government ID, or both?**

The mobile screen presents two options labeled "Live Selfie Verification" and "Government Photo ID." Both paths use the same underlying mechanism: expo-image-picker captures or picks an image from the device, uploads it to Replit Object Storage via the platform's own business document upload endpoint, and the object key is submitted for manual admin review. There is no liveness technology and no document processing. The label "Live Selfie Verification" is inaccurate — it is a front-facing camera photo with no liveness detection. The label "Government Photo ID" is inaccurate — it is a photo library pick with no document OCR or validation.

Additionally, there is a confirmed code bug in `community-verified.tsx` line 149: both the selfie and gov_id paths submit `docType: "government_issued_id"` (the ternary condition returns the same value for both branches). Both images are stored with the business document docType rather than a selfie-specific docType.

**E. Does the approximately $1.50 cost remain accurate and what action creates that charge?**

The $1.50 figure does not appear anywhere in the codebase, documentation, agent memory, git history, or any project file. It was stated in a prior AI planning conversation as an approximate estimate for a hypothetical vendor (likely Persona, whose public pricing is approximately $1.25–$1.50 per inquiry). That estimate was never confirmed, contracted, or implemented. No action in the current system creates a per-verification charge. The only costs associated with the current verification system are Replit Object Storage (shared infrastructure already in use) and admin labor for manual review.

**F. Can paid members currently complete verification from beginning to end?**

No. The end-to-end flow is broken at the navigation entry point: there is no path from the standard profile or settings navigation to the `community-verified.tsx` screen. A member can only reach it if they know the route directly or follow a deep link. If they do reach it, the upload and submission flow would function (the routes are live), but no notification is sent when admin approves or rejects, so the member would not know the outcome unless they return to the screen manually. Additionally, no consent statement is shown before the photo is taken, and the footer incorrectly promises a "Verified Member badge" that is not currently displayed anywhere in the app.

**G. What is the safest verification method for Mapping With Melanin™?**

Option A — Selfie/photo review only, with accurate disclosure — is the most appropriate for the current phase. Detailed recommendation in Output 26.

**H. Should Verified Community Member be included in Build 97, or should only free Community Member signup be included now?**

Decision A (free Community Member identity display) — YES, include in Build 97.  
Decision B (Verified Community Member paid workflow) — NO, defer. The twelve inclusion conditions listed in Section 10 of the audit prompt are not met. Detailed analysis in Output 31 and Output 32.

---

## OUTPUT 1 — EXECUTIVE SUMMARY

The prior AI planning conversation referenced approximately $1.50 per verification and discussed a third-party identity verification vendor. That vendor was never selected, contracted, integrated, or configured. No evidence of any external identity verification service exists anywhere in the project — not in packages, environment variables, API calls, webhooks, git history, or documentation.

What was built instead is a fully self-contained internal verification system:
- Mobile screen with two photo capture methods (selfie, photo library)
- Image upload to Replit Object Storage via the platform's own business document upload endpoint
- Manual admin review via a dedicated admin queue
- Trust level update on admin approval (trustLevel = 2)

This system was built without a third-party vendor. It is not equivalent to the $1.50 per-verification workflow that was discussed in planning.

**Four critical findings from this audit:**

1. **No vendor exists.** The $1.50 figure was an AI planning estimate for a hypothetical service. It was never purchased, integrated, or configured.

2. **Architectural confusion.** The mobile member identity verification flow reuses the business document upload endpoint (`POST /api/verification/upload-document`), which was built for business ownership verification. Personal member selfie images are stored alongside business documents in `verification-docs/` object storage.

3. **Code bug in community-verified.tsx.** Both the selfie and gov_id paths submit `docType: "government_issued_id"` (a copy-paste error on line 149). A selfie is mislabeled as a government-issued ID document in storage.

4. **Member-facing labels are inaccurate.** "Live Selfie Verification" implies liveness detection. "Government Photo ID" implies document validation. Neither capability exists. The system performs photo upload and manual admin review only.

Community Member (free base identity) and Verified Community Member (paid tier + manual photo review) are correctly designed as separate products. The Community Member identity can and should be made visible in Build 97. Verified Community Member should be deferred until the workflow is correctly documented, consent language is added, and the architectural confusion between business and member verification is resolved.

---

## OUTPUT 2 — PRIOR VERIFICATION REQUIREMENT FOUND

**What the prior planning conversation established (from the audit prompt):**
- Community Member is the free base membership identity
- Free Community Members do not need to submit a selfie or photo ID simply to join or belong
- Eligible paid members may choose to become Verified Community Members
- Verification is an added trust designation, not a requirement for basic community membership
- Verification does not automatically make someone a Cultural Ambassador
- Personal member verification and business-ownership verification are separate workflows
- A third-party provider with approximately $1.50 per-verification cost was described

**Where each of these is currently documented in the codebase:**

| Stated intent | Current implementation |
|---|---|
| Community Member = free base identity | Trust Level 1, default for all users. Correct in data, invisible in UX. |
| No selfie required to join | Correct. Registration has no verification requirement. |
| Paid tier for Verified status | trust.ts line 76: PAID_TIERS = Navigator+. Correct in code. |
| Verification = optional trust designation | Correct in model. |
| Verification ≠ Ambassador | Correct. Trust Level 2 (Verified) and Level 4 (Ambassador) are independent. |
| Personal ≠ business verification | Incorrect in practice. Same upload endpoint is used for both. |
| ~$1.50 per-verification third-party cost | NOT FOUND ANYWHERE. |

---

## OUTPUT 3 — VENDOR IDENTIFIED OR NOT IDENTIFIED

**VENDOR: NOT IDENTIFIED**

No third-party identity verification vendor is identified because none was integrated. The conclusion is not that a vendor exists but cannot be found — the conclusion is that no vendor was ever contracted, configured, or connected.

**Vendors searched:**
- Persona — not found
- Stripe Identity — not found
- Veriff — not found
- Onfido — not found
- Entrust — not found
- Jumio — not found
- Socure — not found
- Alloy — not found
- Sumsub — not found
- ID.me — not found
- AWS Rekognition — not found
- Any KYC/AML provider — not found

---

## OUTPUT 4 — EVIDENCE SUPPORTING VENDOR IDENTIFICATION

No evidence supporting any vendor identification was found. The exhaustive search below produced zero results for any external verification provider.

| Search location | What was searched | Result |
|---|---|---|
| `artifacts/` source code (all .ts/.tsx) | Vendor names, SDK imports, API hostnames | Zero matches |
| `lib/` source code | Vendor names, SDK imports | Zero matches |
| `docs/` documentation | Vendor names, $1.50, KYC | Zero matches |
| `.agents/memory/` agent memory | Vendor names, $1.50 | Zero matches |
| `package.json` (mobile, api-server, root) | Verification SDK packages | Zero matches |
| `pnpm-lock.yaml` | Vendor packages (persona, veriff, onfido, jumio, sumsub) | Zero matches |
| Environment variables (runtime env) | Vendor API key names | Zero matches |
| Git history (`git log --grep`) | Vendor names, liveness, KYC | Zero matches |
| `artifacts/api-server/src/routes/` | External API calls in verification routes | Zero matches |
| `community-verified.tsx` API calls | External service calls | Zero — only calls internal `/api/` routes |

---

## OUTPUT 5 — PRIOR $1.50 QUOTE TRACE

**The $1.50 figure does not appear anywhere in the project.**

Searched:
- All source code files
- All documentation files
- All agent memory files
- All audit files
- All Future-State Register entries
- pnpm-lock.yaml
- package.json files
- Git commit messages

**Assessment of where the figure originated:**

The $1.50 per-verification figure is consistent with Persona's public pricing (approximately $1.25–$1.50 per inquiry as of 2024). Based on the audit trail, this figure was most likely stated by an AI assistant during a prior planning session as an estimate for a vendor that was being discussed but never selected. AI assistants in planning conversations frequently cite publicly available vendor pricing when discussing integration options. This does not constitute a vendor selection, quote, or commitment.

The $1.50 estimate was:
- A planning-session AI estimate
- Based on publicly available vendor pricing
- Never confirmed with a vendor account
- Never converted into a contract, API key, SDK, or configuration
- Not documented anywhere in the project files

**What action would create a per-verification charge:**
No action in the current system creates a per-verification charge. If a vendor is integrated in the future, the charge model will depend entirely on the vendor and the specific API call made. For Persona: creating an inquiry session creates a charge. For Stripe Identity: creating a VerificationSession creates a charge. Current system: no charge event exists.

---

## OUTPUT 6 — CURRENT PRICING STATUS

**Current cost per verification: $0** (excluding admin labor and object storage, which are shared platform infrastructure)

**Future cost if a vendor is integrated:** Unknown until a vendor is selected and pricing is confirmed from the vendor account or current vendor documentation. The $1.50 estimate should not be used for any planning, budgeting, or member communications until a vendor is confirmed and current pricing is verified.

---

## OUTPUT 7 — ENVIRONMENT VARIABLES AND SECRET NAMES FOUND

**Verification-related environment variables found: ZERO**

No environment variable name related to identity verification, KYC, liveness, or any verification vendor was found in:
- The Replit Secrets configuration (all available secrets confirmed: only Twilio, Stripe, RevenueCat, DocuSign, Google Maps, Resend, Cron, Storage, and Railway keys exist)
- The runtime environment (`env` command output)
- `artifacts/api-server/src/lib/env.ts`
- `eas.json`
- `app.config.js`

**Environment variables that ARE relevant to the upload portion of member verification:**

| Variable name | Purpose | Configured | Required | Status |
|---|---|---|---|---|
| `DEFAULT_OBJECT_STORAGE_BUCKET_ID` | Bucket for image upload | ✅ YES (confirmed in Replit secrets) | YES | Active |

The upload-document route checks `process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID` and returns 500 if unset. This bucket is shared infrastructure used across the platform — selfie images are stored in the same bucket as all other object storage assets, in the `verification-docs/` key prefix.

No vendor-specific keys are needed because no vendor exists. If a vendor is integrated in the future, that vendor's keys would need to be added separately.

---

## OUTPUT 8 — CONFIGURATION STATUS BY ENVIRONMENT

| Environment | Verification vendor configured | Object storage configured | Verification routes live |
|---|---|---|---|
| Development (Replit) | NO | YES | YES |
| Production (Railway) | NO | YES (same bucket) | YES |
| EAS build (iOS/Android) | N/A — client only | N/A | N/A |

The absence of a vendor applies across all environments. The internal verification system (upload + admin review) is functionally the same in all environments.

---

## OUTPUT 9 — PACKAGES AND SDKs FOUND

**Verification-related packages: ZERO**

The following packages do not appear in any `package.json` or `pnpm-lock.yaml` in the project:
- `@persona-kyc/*` — not present
- `@stripe/stripe-js` verification session — not present (Stripe is present for payments; Stripe Identity is not separately configured)
- `veriff-sdk` — not present
- `onfido-sdk-ui` — not present
- Any other KYC/identity SDK — not present

**Packages used for the current self-built verification flow:**
- `multer` (already installed, used for the upload-document endpoint) — for multipart file handling on the server
- `expo-image-picker` (already installed in mobile) — for camera/photo library access
- `expo-secure-store` (already installed) — for token retrieval before API calls
- `expo-haptics` (already installed) — for success haptic feedback
- Replit Object Storage client (already installed, internal library) — for image storage

All these packages are already installed for other purposes. No new packages were added for verification.

---

## OUTPUT 10 — VERIFICATION API ROUTES

**Route 1: POST /api/verification/upload-document** (`artifacts/api-server/src/routes/verification.ts`)  
Purpose: Upload a file to object storage. Returns object storage key.  
Authentication: Required (any authenticated user)  
Rate limiting: None  
Tier check: None  
Notes: This route was built for **business** verification document uploads. It stores files in `verification-docs/` key prefix. The mobile member verification flow reuses this route for personal member selfie/photo uploads. This is an architectural mix of business and personal identity document storage.

**Route 2: POST /api/users/identity-verification** (`artifacts/api-server/src/routes/trust.ts`)  
Purpose: Submit a member identity verification request with a selfieKey.  
Authentication: Required  
Tier check: YES — Navigator, Trailblazer, Community Builder, Founding, Beta, Legacy Member only  
Idempotency: YES — prevents duplicate pending requests and re-verification of already-verified users  
Notes: This route is correctly built for member personal identity verification. It creates a record in `identity_verifications` table and returns a pending status.

**Route 3: GET /api/users/me/trust** (`artifacts/api-server/src/routes/trust.ts`)  
Purpose: Return current trust level, levelInfo, progress requirements, pending verification.  
Authentication: Required  
Notes: Returns trust level with inaccurate requirement labels ("Government-issued ID," "Live selfie / liveness check").

**Route 4: GET /api/admin/identity-verifications** (trust.ts)  
Purpose: Admin queue of all identity verification submissions.  
Authentication: Admin only  
Notes: Correctly joined with user email/name for admin review context.

**Route 5: PATCH /api/admin/identity-verifications/:id** (trust.ts)  
Purpose: Admin approve or reject a verification.  
Authentication: Admin only  
On approve: Sets `identityVerified=true`, `identityVerifiedAt=now()`, `trustLevel=2` (only if currently at Level 1).  
Notes: Level check (`trustLevel=1`) prevents inadvertent downgrade.

**Route 6: GET /api/admin/identity-verifications/:id/selfie-url** (trust.ts)  
Purpose: Generate 15-minute signed URL for admin to view submitted image.  
Authentication: Admin only  
Notes: No prefix validation — any selfieKey value is used. The business document URL route validates `verification-docs/` prefix; this route does not.

**Missing routes:**
- No DELETE route for member or admin to delete verification records
- No member route to cancel/withdraw a pending verification
- No notification route triggered on approval/rejection
- No webhook route (no vendor, so not applicable)

---

## OUTPUT 11 — VERIFICATION WEBHOOKS

**Webhooks: NONE**

No verification webhook routes exist. No webhook is needed because there is no external provider to receive status updates from. If a vendor is integrated in the future, webhook handling would need to be added.

---

## OUTPUT 12 — VERIFICATION DATABASE FIELDS

**Table: identity_verifications** (`lib/db/src/schema/identity-verifications.ts`)

| Column | Type | Default | Notes |
|---|---|---|---|
| id | varchar UUID | generated | Primary key |
| userId | varchar | NOT NULL | Foreign reference to users.id |
| status | varchar enum | "pending" | Values: pending, approved, rejected |
| adminNotes | text | nullable | Admin-provided rejection reason |
| selfieKey | text | nullable | Object storage key (in `verification-docs/` prefix) |
| submittedAt | timestamp | now() | Auto-set |
| reviewedAt | timestamp | nullable | Set on admin PATCH |
| reviewedBy | varchar | nullable | Admin user ID who reviewed |

**Columns that do not exist but should:**

| Missing column | Reason needed |
|---|---|
| method | Cannot distinguish selfie from gov_id submission in DB |
| consentAt | No record that member consented before submitting |
| deletedAt | No soft-delete mechanism |
| retentionExpiresAt | No auto-expiry for stored images |
| notifiedAt | No record of member notification |
| providerReference | Would be needed if a vendor is integrated |
| providerStatus | Would be needed if a vendor is integrated |

**Users table fields related to verification:**

| Column | Type | Default | Notes |
|---|---|---|---|
| trustLevel | integer | 1 | Set to 2 on admin approval |
| identityVerified | boolean | false | Set to true on admin approval |
| identityVerifiedAt | timestamp | nullable | Set on admin approval |

**What the platform stores about member verification:**
- Object storage key pointing to the uploaded image (stored indefinitely — no expiry)
- Verification record (submitted/reviewed timestamps, admin notes, status)
- User trust level and verification flag

**What the platform does NOT store:**
- The actual image content (only the object storage key)
- Legal name, date of birth, address, ID number — none of this is captured
- Biometric templates — none
- Provider response payloads — no provider exists
- Rejection code categories — only free-text adminNotes

---

## OUTPUT 13 — MOBILE VERIFICATION UI

**community-verified.tsx** (598 lines, `artifacts/mobile/app/community-verified.tsx`)

| State | Implemented | User-visible | Notes |
|---|---|---|---|
| loading | ✅ FULLY BUILT | YES | ActivityIndicator while status loads |
| upgrade_required | ✅ FULLY BUILT | YES (if reached) | Shows upgrade prompt; links to /membership |
| already_verified | ✅ FULLY BUILT | YES (if reached) | Confirmed verified state |
| pending | ✅ FULLY BUILT | YES (if reached) | Shows submitted date |
| rejected | ✅ FULLY BUILT | YES (if reached) | Shows adminNotes |
| choose_method | ✅ FULLY BUILT | YES (if reached) | Two option cards: selfie + gov_id |
| capturing | ✅ FULLY BUILT | YES (if reached) | Calls expo-image-picker |
| submitting | ✅ FULLY BUILT | YES (if reached) | Shows ActivityIndicator on button |
| success | ✅ FULLY BUILT | YES (if reached) | Success state, links back |

**Navigation entry point:**  
MISSING. There is no path to this screen from the profile tab, settings screen, or any standard navigation. The screen is only reachable via direct route navigation or a deep link.

**trust-verification.tsx:**  
5-line redirect to community-verified. Same navigation gap applies.

**CODE BUG (line 149 — confirmed):**
```typescript
formData.append("docType", method === "gov_id" ? "government_issued_id" : "government_issued_id");
```
Both branches of the ternary return the same value. A selfie is labeled "government_issued_id" in object storage. This is a copy-paste error. The intended behavior was likely `"selfie"` or `"other"` for the selfie path.

**LABEL INACCURACY (line 283):**
The selfie option is labeled "Live Selfie Verification" — implies liveness detection. No liveness technology exists.

**FOOTER INACCURACY (line 349–352):**
"Once approved, you'll receive a Verified Member or Verified Business badge." No such badge is currently displayed anywhere in the mobile or web app.

**CONSENT GAP:**
No consent statement is shown before the camera or photo library opens. The member has no opportunity to read what they are submitting or agree to it.

---

## OUTPUT 14 — WEB VERIFICATION UI

**No web verification UI exists for member identity verification.**

The web app has a billing screen, a trust-and-safety page, and business verification UI — but no member identity verification screen. The mobile `community-verified.tsx` correctly detects web and shows "Please use the iOS app to complete verification." (line 88–91).

---

## OUTPUT 15 — ADMIN VERIFICATION UI

**Admin queue:** `GET /api/admin/identity-verifications` returns all submissions with member name and email.  
**Admin review:** `PATCH /api/admin/identity-verifications/:id` approves or rejects with notes.  
**Admin selfie view:** `GET /api/admin/identity-verifications/:id/selfie-url` generates 15-minute signed URL.

Whether the admin panel UI renders these endpoints is confirmed only via route inspection. Admin panel code (`artifacts/web/src/pages/admin.tsx`) was grep-searched for "identity-verification" — not found. The admin panel may not have a visible UI panel for identity verification review beyond raw API access.

This should be confirmed: if admin review is happening via direct API calls rather than a UI panel, this is a significant gap.

---

## OUTPUT 16 — MEMBERSHIP-TIER ENFORCEMENT

**Server-side gate (trust.ts line 76–88):**
```typescript
const PAID_TIERS = ["navigator", "trailblazer", "community_builder", "founding", "beta", "legacy_member"];
if (!PAID_TIERS.includes(memberType)) {
  res.status(403).json({ error: "Community Verified is available for Navigator members and above.", code: "UPGRADE_REQUIRED" });
}
```

**Server-side enforcement:** YES — enforced on the POST /users/identity-verification route.  
**Client-side check (community-verified.tsx line 54–55):** YES — same PAID_TIERS list is checked before loading trust status.  
**Idempotency (lines 93–107):** YES — prevents duplicate pending requests and re-verification of already-verified users. This prevents multiple pending submissions but does not prevent a rejected member from resubmitting (retry is allowed, which is correct).

**Live contradiction with membership.tsx:**
`membership.tsx` line 1063 states: "Verification is available at every membership tier — including Community Business (free). It's about trust, not the tier you choose."
This directly contradicts the server-side gate. A free member who reads this copy and navigates to verification will receive HTTP 403.

**Cost and duplicate-charge risks:**
Because there is no third-party vendor, there is no per-verification charge and no duplicate-charge risk today. If a vendor is integrated in the future, the idempotency logic in trust.ts (checking for existing pending records before inserting) would need to be extended to also prevent duplicate sessions from being created at the vendor's API.

**Current abuse prevention:**
- Free members blocked at server level (403)
- Duplicate pending requests blocked (409 PENDING_EXISTS)
- Already-verified members blocked (409 ALREADY_VERIFIED)
- No limit on how many times a member can resubmit after rejection — this is intentional to allow correction but should be documented as deliberate policy

---

## OUTPUT 17 — CURRENT END-TO-END WORKFLOW

Tracing the intended journey step by step:

| Step | Status | Notes |
|---|---|---|
| Paid member navigates to verification | DISCONNECTED | No nav entry point. Screen unreachable from standard navigation. |
| Screen loads and checks membership tier | FULLY BUILT | Free members see upgrade_required state. |
| Member is shown verification explanation | PARTIALLY BUILT | Text exists but no consent/disclosure before photo |
| Member chooses selfie or gov_id method | FULLY BUILT | Two cards with labels |
| Camera or photo library opens | FULLY BUILT | expo-image-picker, correct permissions handling |
| Image is uploaded to object storage | PARTIALLY BUILT | Uses business document upload endpoint; docType bug |
| Image key is submitted to identity-verification endpoint | FULLY BUILT | POST /api/users/identity-verification, idempotent |
| Pending state is shown | FULLY BUILT | Shows submittedAt date |
| Admin receives and reviews submission | PARTIALLY BUILT | Routes exist; admin UI panel status unconfirmed |
| Admin approves or rejects | FULLY BUILT | PATCH endpoint sets trustLevel=2 or adminNotes |
| Member is notified of outcome | MISSING | No push notification or email on status change |
| Member sees Verified status on profile | MISSING | Trust Level 2 is stored but never displayed on profile |
| Verified badge appears on reviews/posts | MISSING | No badge component or display exists |
| Retry after rejection | FULLY BUILT | Rejected state shows adminNotes and retry button |
| Appeal process | MISSING | No appeal route or workflow |
| Verification expiration | MISSING | No expiry mechanism |
| Member or admin deletion | MISSING | No deletion route or mechanism |

---

## OUTPUT 18 — WHAT THE CURRENT PROCESS ACTUALLY VERIFIES

**A. SELFIE OR LIVENESS CHECK**  
What exists: A front-facing camera photo taken by the member. The photo is stored in object storage and an admin manually views it.  
What this confirms: The device has a front-facing camera. A person was present at the time the app ran.  
What this does NOT confirm: The person is alive (no liveness technology). The person matches any identity document. The person is who they claim to be.

**B. GOVERNMENT-ID VERIFICATION**  
What exists: A photo selected from the device's photo library (not required to be a photo of an ID). The image is stored in object storage and an admin manually views it.  
What this confirms: The member was able to navigate to their photo library and select an image.  
What this does NOT confirm: The image is a government-issued ID. The document is authentic. The name or date of birth on any document matches anything in the platform's database.

**C. SELFIE-TO-ID MATCHING**  
Exists: NO. There is no comparison between a selfie and any document.

**D. COMMUNITY TRUST DESIGNATION**  
What the member receives when approved: Trust Level 2 — "Community Verified." This designation currently means: an admin manually reviewed a photo the member submitted and decided to approve it. It does not confirm legal identity, age, address, or any specific attribute beyond the admin's judgment.

**Summary:**
The current process should be described to members accurately: "Submit a selfie or photo for review by the Mapping With Melanin™ team. Our team confirms you are a real person in the community." It should NOT be described as identity verification, liveness verification, or government ID verification.

---

## OUTPUT 19 — WHAT IS FULLY BUILT

| Component | Status |
|---|---|
| Trust Level system (4 levels, labels, weights, computation) | ✅ FULLY BUILT |
| identity_verifications table | ✅ FULLY BUILT |
| POST /api/users/identity-verification (submit + idempotency) | ✅ FULLY BUILT |
| GET /api/users/me/trust | ✅ FULLY BUILT |
| Admin review routes (list, approve/reject, selfie URL) | ✅ FULLY BUILT |
| Admin approval → trustLevel=2 (level-protected) | ✅ FULLY BUILT |
| POST /api/verification/upload-document (image upload) | ✅ FULLY BUILT (business route reused) |
| community-verified.tsx (all 8 states) | ✅ FULLY BUILT |
| Camera permission handling | ✅ FULLY BUILT |
| Photo library permission handling | ✅ FULLY BUILT |
| Image preview + retake flow | ✅ FULLY BUILT |
| Submit button with loading state | ✅ FULLY BUILT |
| Paid-tier gate (server + client) | ✅ FULLY BUILT |
| Duplicate pending request prevention | ✅ FULLY BUILT |
| Already-verified detection | ✅ FULLY BUILT |
| Rejected state with retry | ✅ FULLY BUILT |
| Web platform detection (blocks verification on web) | ✅ FULLY BUILT |

---

## OUTPUT 20 — WHAT IS PARTIALLY BUILT

| Component | What exists | What is missing |
|---|---|---|
| Upload route for member identity docs | Business doc upload route reused | Dedicated member identity upload route; correct docType |
| Member notification on outcome | Status stored in DB | Push notification or email triggered on status change |
| Progress requirements language | getTrustProgress() returns requirements | Requirements inaccurately describe non-existent liveness/ID service |
| Admin UI panel for identity verification | API routes exist | Admin.tsx panel UI status unconfirmed |
| Trust Level badge display | Trust Level computed and stored | Not displayed on member profile or reviews |
| Community Member identity display | Said once in profile-setup | Not persistent on profile or anywhere post-setup |

---

## OUTPUT 21 — WHAT IS DISCONNECTED

| Component | Built | Why disconnected |
|---|---|---|
| community-verified.tsx | YES | No navigation entry point from profile or settings |
| Trust Level label on profile | Data exists | Never added to profile tab UI |
| Verified badge on reviews/posts | Model exists | No badge component built |
| "Verified Member badge" (footer text, line 349) | Promised in UI | Badge does not exist anywhere in app |
| getTrustProgress() requirements | Computed correctly | Requirements describe capabilities that don't exist |
| membership.tsx verification copy | Written | Contradicts server-side paid-tier gate |

---

## OUTPUT 22 — WHAT IS MISSING

1. A third-party verification vendor (no vendor was ever integrated)
2. Liveness detection technology
3. Document OCR or validation
4. Navigation entry point to community-verified.tsx
5. Pre-photo consent disclosure statement
6. Member notification on approval or rejection
7. Trust Level badge display on member profile
8. Trust Level badge display on reviews, posts, or community content
9. Member deletion right for submitted verification data
10. Admin UI panel for identity verification (status unconfirmed)
11. Corrected docType on selfie submissions (line 149 bug)
12. Accurate requirements language in getTrustProgress()
13. Corrected membership.tsx copy (live contradiction with trust.ts)
14. Verification expiry mechanism
15. Member cancellation/withdrawal of pending verification

---

## OUTPUT 23 — CURRENT PRIVACY AND RETENTION BEHAVIOR

**What is stored:**
- Selfie or photo image in Replit Object Storage (`verification-docs/{UUID}.{ext}`)
- Object storage key (`selfieKey`) in `identity_verifications` table
- Verification status, admin notes, submitted/reviewed timestamps
- Admin user ID who reviewed (`reviewedBy`)

**What is NOT stored:**
- The image content itself in the database (only the key)
- Legal name (captured from photo only if admin can read it — not extracted programmatically)
- Date of birth, address, ID number — none captured
- Biometric templates — none
- Provider reference — no provider

**Retention:**
- Images are stored indefinitely in object storage. No automatic expiry.
- Verification records are stored indefinitely in the database. No deletion mechanism.

**Access controls:**
- Images: Admin only, via 15-minute signed URL
- Records: Admin only via API routes
- Member cannot view their own submitted image
- Member cannot delete their submission

**Sensitive data flags:**

| Data item | Retained? | Necessity documented? | Retention schedule? | Deletion process? | Risk |
|---|---|---|---|---|---|
| Selfie image | YES | NO | NONE | NONE | Medium — biometric data risk in some jurisdictions |
| Gov ID image | YES | NO | NONE | NONE | HIGH — sensitive identity document, indefinitely stored |
| Admin notes (rejection reason) | YES | YES | NONE | NONE | Low |
| reviewedBy (admin ID) | YES | YES | NONE | NONE | Low |

**HIGH RISK FLAG:** Government ID images stored indefinitely in object storage without a documented retention schedule, member consent, or deletion mechanism. Even if the image is not technically an "official" government ID (no document validation exists), the intent is to collect such documents, and the indefinite storage without deletion rights creates meaningful legal exposure.

**Biometric data note:** Selfie images used for identity verification purposes may constitute biometric identifiers under Illinois BIPA, Texas CUBI, and similar state laws. No consent, no retention notice, and no deletion right currently exist for these images.

---

## OUTPUT 24 — CURRENT CONSENT EXPERIENCE

**What currently exists:**
- The screen title: "Build Trust Within the Community"
- The screen subtitle: "Verification helps create a safer, more authentic experience for everyone."
- The footer: "Verification is optional, but it helps increase confidence when connecting with others."
- The submit button: "Submit for Review"

**What is missing:**
1. No statement of what is being collected (selfie, photo ID)
2. No identification of who reviews it (Mapping With Melanin team)
3. No explanation of why verification is requested
4. No statement that the submission is optional for platform use (it is — the footer says this, but no opt-in is required before the camera opens)
5. No disclosure of what Mapping With Melanin receives and stores
6. No disclosure of what appears publicly (nothing appears publicly, but this is not stated)
7. No statement of how long the data is kept
8. No explanation of how to request deletion
9. No statement about vendor data retention (no vendor, but this should still be addressed)
10. No explanation of what happens if verification fails (rejection path exists in the UI but the member is not told before starting)
11. No alternative process disclosure for accessibility reasons
12. No affirmative consent action (tap to agree, checkbox, etc.) — the camera opens immediately after tapping a method card

---

## OUTPUT 25 — CURRENT COST AND DUPLICATE-CHARGE RISKS

**Per-verification charge today: $0**  
No vendor exists, so no per-verification charge is created by any user action.

**Duplicate-charge risk today: $0**  
No vendor exists.

**Abuse risk today:**
- A paid member can resubmit after rejection any number of times (no rate limit)
- Object storage accumulates an image per submission — indefinitely
- No per-member limit on total submissions exists

**Future cost protections needed before any vendor is integrated:**

| Protection | Currently exists | Status |
|---|---|---|
| Server-side paid-tier check before any charge event | ✅ | Built |
| Duplicate pending request prevention | ✅ | Built (409 PENDING_EXISTS) |
| One included verification per paid member | ❌ | Not built |
| Cost logging per attempt | ❌ | Not built |
| Admin-authorized additional attempts after exhausting included count | ❌ | Not built |
| Chargeable session confirmation before vendor API call | ❌ | Not built (no vendor) |
| Retry count tracking | ❌ | Not built |
| Vendor session idempotency (prevent double session creation) | ❌ | Not built (no vendor) |

---

## OUTPUT 26 — RECOMMENDED VERIFICATION STANDARD

**Recommended standard for current phase: Option A — Selfie/photo review, accurately disclosed**

**Rationale:**

Mapping With Melanin™ is a community trust platform. The purpose of "Verified Community Member" is to signal that a real person completed a review process — not to establish legal identity. The platform's trust model is community-based, not credential-based. Review weight, safety report credibility, and community signal all benefit from knowing a real person (not a bot) submitted the content. They do not require knowing that person's legal name, date of birth, or document number.

**What Option A provides:**
- Real-person confirmation (admin judgment from photo review)
- A higher trust bar than anonymous accounts
- Low cost (admin labor only)
- No biometric data law exposure if disclosed and retained correctly
- Low friction for members

**What Option A does NOT provide:**
- Legal identity confirmation
- Age verification
- Duplicate-account prevention
- Sybil resistance at scale

**Why Option B (Government ID only) is inappropriate for current phase:**
- A photo library image pick with no document validation is not government ID verification
- Adding document validation requires a third-party service, vendor selection, consent framework, and legal review
- Over-representing the verification level to members damages trust more than under-representing it

**Why Option C (ID + liveness matching) is inappropriate for current phase:**
- Maximum cost, maximum friction, maximum privacy exposure
- Disproportionate to the actual risk profile of the platform's verification needs
- Reviews, safety reports, and community posts do not require full KYC

**Why Option D (tiered) is appropriate as a future state but not for Build 97:**
- The concept of Standard (liveness/selfie) and Enhanced (ID + liveness match) verification tiers is sound
- Enhanced verification would be appropriate for: Cultural Ambassador applications, business claim authority, Kinfolk Circle curation, high-stakes marketplace transactions
- Not needed for: community posts, safety surveys, reviews, mentorship, events
- Too complex to design, build, and consent-document in the Build 97 window

**Recommended immediate action:**
Rename the feature in the member UI. Replace "Live Selfie Verification" with "Photo Review." Replace "Government Photo ID" with "Photo ID Submission." Add a pre-submission disclosure. This is accurate, honest, and does not require any new technology.

---

## OUTPUT 27 — RECOMMENDED PAID-MEMBER ELIGIBILITY

**Current gate: Navigator+ (correct, should be maintained)**

The manual review model — where an admin views a submitted photo and approves — does not scale to the free member base without dedicated staff and a defined SLA. Restricting verification to paid tiers is a defensible and appropriate access model for the current phase.

**Recommended eligibility rules:**

1. **Paid tier required** — Navigator or above (current code is correct)
2. **One included verification per subscription period** — Currently there is no limit; a member could submit indefinitely after each rejection. A policy should be documented even if technical enforcement is added later.
3. **Admin-authorized re-verification** — If a member's identity changes (e.g., legal name change) or their verification is disputed, admin should be the gate for additional verifications, not automated retry.
4. **No charge for initial verification included in Navigator tier** — The verification is an included feature of the paid tier, not an add-on charge. This is the current model.
5. **Membership.tsx must be corrected** — The live contradiction between the copy and the API must be resolved. Copy should say verification is a Navigator+ benefit.

**Recommended cost protections before vendor integration:**
- Maximum 3 total submissions per member per 12-month period (configurable)
- Admin flag to allow additional attempts
- Vendor session created server-side only (never from client)
- Server-side idempotency key passed to vendor session creation to prevent duplicate sessions
- Cost log entry on every vendor session creation (log only — no sensitive data)

---

## OUTPUT 28 — RECOMMENDED BADGE MEANING

**Badge design principle:** A badge should mean exactly what was verified, no more and no less.

**Recommended badge definitions:**

| Identity/Designation | Badge label | What it means (member-visible on tap) | What it does NOT mean |
|---|---|---|---|
| Community Member | No badge (default) | "A registered member of Mapping With Melanin™" | N/A |
| Community Verified | ✔ Verified | "This member completed our photo review process. We confirmed a real person submitted this profile." | Does not confirm legal identity, professional credentials, or safety. |
| Trusted Contributor | ★ Trusted | "This member has been part of the community for 90+ days with consistently helpful contributions." | Does not confirm identity. |
| Cultural Ambassador | 👑 Ambassador | "Recognized by Mapping With Melanin™ as a local leader, creator, or community organizer." | Does not confirm all of the above. |
| Business Owner (unverified) | No badge (claimed) | "Self-reported business connection." | Not verified. |
| Verified Business Owner | ✔ Verified Business | "Mapping With Melanin™ reviewed documentation confirming minority ownership of this business." | Does not confirm all business practices, employment conditions, or accuracy of listings. |
| Community Organization | No badge (claimed) | "Self-reported organization." | Not verified. |
| Verified Community Organization | ✔ Verified Org | "Mapping With Melanin™ reviewed documentation confirming this organization's legitimacy." | Does not endorse all activities. |

**Disclaimer language required on all badges (accessible via tap):**
"This badge reflects what Mapping With Melanin™ confirmed during a specific review process. It does not mean this member or business is safe, endorsed, or infallible. Always use your own judgment."

---

## OUTPUT 29 — COMMUNITY MEMBER VERSUS VERIFIED COMMUNITY MEMBER

| Dimension | Community Member | Verified Community Member |
|---|---|---|
| How obtained | Registration + profile setup | Paid tier + photo submission + admin approval |
| Cost to member | Free | Included in Navigator+ subscription |
| Cost to platform | None | Admin labor (no third-party vendor currently) |
| Trust Level | 1 | 2 |
| Badge | None (default) | ✔ Verified (not currently displayed) |
| What it means | Real registration, accepted community guidelines | Admin reviewed a submitted photo and confirmed a real person |
| What it does NOT mean | Has submitted any verification | Legal identity confirmed |
| Dependence | None | Requires Community Member status (Trust Level 1) first |
| Cultural Ambassador path | No — this is a separate admin grant | No — Ambassador (Level 4) is independent |

---

## OUTPUT 30 — PERSONAL VERIFICATION VERSUS BUSINESS VERIFICATION

Two separate verification workflows exist. They are correctly designed as separate systems but are currently architecturally linked through the shared upload endpoint.

**Personal member identity verification:**
- Routes in: `artifacts/api-server/src/routes/trust.ts`
- Table: `identity_verifications`
- Purpose: Confirm real person behind a member account
- Result: `identityVerified=true`, `trustLevel=2` on user
- Admin tool: Identity verifications queue in admin panel

**Business ownership verification:**
- Routes in: `artifacts/api-server/src/routes/verification.ts`
- Table: `verification_requests`
- Purpose: Confirm minority ownership of a business
- Result: `verified=true` on business
- Admin tool: Verification requests queue in admin panel
- Additional feature: DocuSign certification envelope sent async on submit

**Current architectural entanglement:**
The mobile `community-verified.tsx` calls `POST /api/verification/upload-document` — the business verification upload endpoint — to store member identity photos. This means:
1. Member identity photos are stored in `verification-docs/` with `docType: "government_issued_id"` (business document prefix)
2. Personal identity images share object storage path space with business documents
3. An admin viewing the admin panel cannot easily distinguish between a member selfie and a business document if both are in `verification-docs/`
4. The code bug (line 149) means ALL member verification uploads — including selfies — are labeled as `government_issued_id`

This should be resolved by creating a dedicated member identity upload endpoint (separate prefix, correct docTypes) when the Verified Community Member workflow is formally built.

---

## OUTPUT 31 — BUILD 97 RECOMMENDATION

**DECISION A — FREE COMMUNITY MEMBER SIGNUP**  
**Recommendation: INCLUDE IN BUILD 97**

Community Member is already the default Trust Level 1 for all registered users. The fix required is purely display and navigation — no schema change, no new routes, no vendor integration. Specifically:

1. Display "Community Member" trust level label on the profile screen (reads from existing GET /api/users/me/trust)
2. Add a settings entry point to the trust/verification screen (navigation only)
3. Correct membership.tsx to match the actual server-side paid-tier gate
4. Correct getTrustProgress() requirement labels to accurately describe the manual photo review process
5. Add one-time display of "You are now a Community Member" at profile-setup completion

None of these require a schema migration or new package installation.

**DECISION B — VERIFIED COMMUNITY MEMBER WORKFLOW**  
**Recommendation: DO NOT INCLUDE IN BUILD 97**

Evaluation against the twelve required conditions from the audit prompt:

| Required condition | Currently met? |
|---|---|
| Vendor conclusively identified | ❌ NO — no vendor |
| Required keys configured | ❌ NO — no keys |
| Current pricing understood | ❌ NO — no vendor, no pricing |
| End-to-end workflow connected | ❌ NO — no nav entry point, no notification |
| Server-side tier eligibility works | ✅ YES |
| Duplicate charge prevention works | ✅ YES (no vendor, so vacuously true) |
| Consent language complete | ❌ NO |
| Privacy and retention documented | ❌ NO |
| Status and retry experiences work | 🟡 PARTIAL — status works, no notification |
| Deletion and support processes exist | ❌ NO |
| iOS and Android tests pass | ❌ NO — screen not reachable from navigation |
| Verification does not destabilize registration | ✅ YES — routes are separate |

8 of 12 conditions are not met. Verified Community Member should not be in Build 97.

**What to do instead for Build 97:**
- Ensure community-verified.tsx still exists and compiles (it does)
- Ensure the server routes still exist (they do)
- Do NOT display a "Get Verified" button or entry point until the consent, navigation, and notification gaps are resolved
- Document the deferral in the Future-State Register

---

## OUTPUT 32 — NEXT ANDROID BUILD RECOMMENDATION

Same as Build 97: Decision A (Community Member display) — YES. Decision B (Verified Community Member) — NO. The verification workflow gaps apply equally to Android.

The next Android build should include the Community Member label display and profile navigation entry point as part of the same set of changes as Build 97.

---

## OUTPUT 33 — EXACT FILES, ROUTES, TABLES, PACKAGES, AND CONFIGURATIONS REVIEWED

**Files read in full:**
- `lib/db/src/trust.ts` — complete trust level system
- `artifacts/api-server/src/routes/trust.ts` — all trust/verification routes (338 lines)
- `artifacts/api-server/src/routes/verification.ts` — upload-document and business verification routes (242 lines)
- `artifacts/mobile/app/community-verified.tsx` — lines 1–359 of 598
- `artifacts/mobile/app/trust-verification.tsx` — complete (5 lines)

**Files grep-searched:**
- `artifacts/api-server/src/routes/index.ts` — verified router registration
- `artifacts/mobile/app/profile-setup.tsx` — Community Member copy
- `artifacts/mobile/app/membership.tsx` — verification tier claims
- `artifacts/web/src/pages/billing.tsx` — memberType labels
- `artifacts/api-server/src/lib/env.ts` — environment validation
- All `package.json` files (mobile, api-server, root)
- `pnpm-lock.yaml` — vendor package check

**Comprehensive searches run:**
- All `.ts`/`.tsx` files in `artifacts/` for vendor names (Persona, Veriff, Onfido, Jumio, Socure, Sumsub, ID.me, Rekognition, KYC, liveness, $1.50)
- All `.md` files in `docs/` for vendor names and $1.50
- All `.md` files in `.agents/memory/` for vendor references
- `pnpm-lock.yaml` for vendor package names
- Runtime environment for vendor API key names
- Git history for vendor-related commits

**Routes confirmed live:**
- GET /api/users/me/trust
- POST /api/users/identity-verification
- POST /api/verification/upload-document
- GET /api/admin/identity-verifications
- PATCH /api/admin/identity-verifications/:id
- GET /api/admin/identity-verifications/:id/selfie-url

**Routes confirmed NOT present:**
- Any external vendor API calls
- Any verification webhook receiver
- Any vendor session creation route
- DELETE for verification records

---

## OUTPUT 34 — DOCUMENTATION AND FUTURE-STATE REGISTER UPDATES REQUIRED

**New FSR entries recommended:**

| Entry | Topic | Priority |
|---|---|---|
| FSR-NEW-A | Verified Community Member — accurate description (manual photo review, no liveness, no document processing) | P0 — prevents misinformation in member communications |
| FSR-NEW-B | Verification vendor selection and integration (deferred, future work) | P1 |
| FSR-NEW-C | Consent and retention framework for verification data | P0 — legal exposure |
| FSR-NEW-D | Member notification on verification outcome | P1 |
| FSR-NEW-E | Trust Level badge display on profile and content | P1 — connected to Build 97 Community Member work |
| FSR-NEW-F | Verification navigation entry point (profile → settings → Community Trust) | P0 — Build 97 |
| FSR-NEW-G | Selfie docType bug fix in community-verified.tsx | P0 — before any verification is promoted |
| FSR-NEW-H | Membership.tsx contradiction with trust.ts (Build 97 fix) | P0 |
| FSR-NEW-I | Dedicated member identity upload endpoint (separate from business document upload) | P1 |
| FSR-NEW-J | Admin UI panel for identity verification review | P1 — confirm admin.tsx panel status |
| FSR-NEW-K | Verification member deletion rights | P1 |
| FSR-NEW-L | Verification expiry mechanism | P2 |

**MEMORY.md update required:**
Add entry: `[Verification architecture gap](verification-architecture-gap.md)` — no vendor; self-built photo upload + admin review; community-verified.tsx reuses business upload endpoint; docType bug line 149; no nav entry point.

---

## OUTPUT 35 — FOUNDER DECISIONS REQUIRED

**FD-VER-001 — Is manual photo review the permanently intended verification model, or is a third-party automated service the future direction?**

Options:
- A: Manual photo review is the permanent model. No third-party vendor. Correctly describe it as such.
- B: Third-party vendor is the future direction. The current manual model is an interim state. Defer Verified Community Member until vendor is selected and integrated.
- C: Tiered approach — manual review for standard Verified status; third-party vendor for Enhanced Verified status used in higher-trust contexts.

**FD-VER-002 — What does "Verified" mean to the member and to the community?**

The current system confirms "a real person submitted this profile" based on admin judgment. Should the platform communicate this exactly, or defer launching any verification badge until stronger technical confirmation exists?

Options:
- A: Launch "Community Verified" with accurate language: "We confirmed a real person is behind this account."
- B: Defer all verification badges until a liveness or ID technology is integrated.

**FD-VER-003 — Should the verification screen be visible (but clearly described as deferred) in Build 97, or completely hidden?**

Options:
- A: Remove the "Get Verified" entry point from Build 97. Do not show nonfunctional verification UI.
- B: Show the entry point but add a "Coming Soon" state instead of the current flow.
- C: Make it fully functional (with consent language added) — admin-reviewed photo submission is complete and honest.

Founder selection fields:
  FD-VER-001: ☐ A  ☐ B  ☐ C  Other: ___
  FD-VER-002: ☐ A  ☐ B  Other: ___
  FD-VER-003: ☐ A  ☐ B  ☐ C  Other: ___

---

## OUTPUT 36 — CONFIRMATION THAT NO CHANGES WERE MADE

No code, schemas, routes, screens, environment variables, database records, object storage contents, provider accounts, membership tiers, verification settings, packages, or documentation statuses were modified during this audit.

No vendor session was created or activated.  
No chargeable action was taken.  
No secret values were revealed.  
No provider settings were changed.  
No membership tiers were changed.  
No build was submitted.

This is a read-only report. No implementation has occurred.

---

## ARCHITECTURAL DIAGRAM — CURRENT VERIFICATION SYSTEM

```
Member (iOS only)
    │
    ├── [No navigation entry point from standard app]
    │
    └── community-verified.tsx (598 lines)
            │
            ├── CHECK: memberType in PAID_TIERS?
            │     └── NO  → upgrade_required state
            │     └── YES → load trust status
            │
            ├── GET /api/users/me/trust
            │     └── returns: trustLevel, pendingVerification
            │
            ├── Choose method: "selfie" | "gov_id"
            │
            ├── expo-image-picker → local URI
            │
            ├── POST /api/verification/upload-document  ← BUSINESS DOC ENDPOINT (reused)
            │     ├── multer memoryStorage (15MB limit)
            │     ├── stores in: verification-docs/{UUID}.{ext}
            │     ├── docType: "government_issued_id" (BUG: both selfie AND gov_id)
            │     └── returns: { key }
            │
            ├── POST /api/users/identity-verification
            │     ├── body: { selfieKey: key }
            │     ├── checks: paid tier (403 if free)
            │     ├── checks: no pending (409 if pending)
            │     ├── checks: not already verified (409)
            │     └── inserts to identity_verifications table
            │
            └── pending state (no notification to member)


Admin
    │
    ├── GET /api/admin/identity-verifications
    │     └── returns all submissions with member name/email
    │
    ├── GET /api/admin/identity-verifications/:id/selfie-url
    │     └── 15-minute signed URL to object storage image
    │
    └── PATCH /api/admin/identity-verifications/:id
          ├── status: "approved" → identityVerified=true, trustLevel=2
          └── status: "rejected" → adminNotes stored
                (no notification to member either way)
```

**Nowhere in this flow:**
- Does any external service receive a call
- Does any liveness check occur
- Does any document validation occur
- Does the member receive a notification
- Does the member see a "Verified" badge on their profile after approval
- Does any consent statement appear before photo capture
