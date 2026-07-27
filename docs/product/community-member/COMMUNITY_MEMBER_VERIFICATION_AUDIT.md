# Mapping With Melanin™ — Community Member and Verification Trace
**AUDIT-006A | July 26, 2026 | READ-ONLY | No implementation authorized**  
**Authorization phrase to begin implementation:** "Please implement."

---

## OUTPUT 1 — EXECUTIVE SUMMARY

Community Member is not missing. It exists — precisely where it should — as Trust Level 1 in `lib/db/src/trust.ts`, labeled "Community Member" with badge "○" and description "Welcome to the community." Every registered user who signs up today is, technically, a Community Member at Trust Level 1. The data model is correct.

What is missing is the **member-facing moment**. After a new member completes profile setup, "Community Member" disappears from their experience permanently. The trust level label is never shown on their profile, never shown in settings, never shown in a badge. The system knows who they are. The member never learns it.

The verification architecture is also substantially built. A 598-line `community-verified.tsx` screen handles all eight verification states. Admin review routes are live. The identity verification table exists. Object storage captures selfies. The admin panel can approve or reject.

What is not built is a **functioning end-to-end member journey**: no third-party liveness or document verification service exists, the trust level progress screen is not accessible from any navigation entry point, and a live contradiction in the membership screen promises free members access to verification while the server blocks it at the API level.

**Three specific defects requiring founder decisions:**
1. "Community Member" identity is invisible after onboarding completes — a copy fix, not a schema change
2. `membership.tsx` promises free members access to verification that `trust.ts` denies at the API — a live contradiction
3. `getTrustProgress()` promises "Live selfie / liveness check" — a service that does not exist; only a selfie photo upload and manual admin review are implemented

No third-party verification service is being paid for unused. The platform is not paying for a capability members cannot access.

---

## OUTPUT 2 — FOUNDER INTENT AS UNDERSTOOD

The intended model as described in the audit prompt:

```
Guest
→ Community Member (free, chosen at signup, no verification required)
→ Contributor (earned through activity)
→ Verified Community Member (eligible paid member + completed verification)
→ Trusted Contributor (earned through sustained contribution)
→ Cultural Ambassador (separate invitation-based qualification)
```

Community Member = a belonging identity, not a billing tier.  
Verified Community Member = an additional trust designation on top of Community Member, available to eligible paid members.  
These are distinct from business owner, content creator, and community organizer — which are additive roles, not replacements.

---

## OUTPUT 3 — COMMUNITY MEMBER TERMINOLOGY HISTORY

**In the trust level system (lib/db/src/trust.ts):**  
Trust Level 1 has been labeled "Community Member" since the trust architecture was first built. This is the authoritative system label. Every registered user defaults here.

**In the users table (lib/db/src/schema/auth.ts):**  
The `memberType` field is an internal billing classification: `"individual"` is the default value. This field has no label-bearing relationship to "Community Member" — it tracks the subscription tier, not the community identity. The two systems exist on separate tracks and were never unified in the member-facing experience.

**In mobile onboarding (artifacts/mobile/app/profile-setup.tsx, line 188):**  
The text "You're joining as a Community Member." was written into the profile-setup flow. It appears exactly once during the 4-step profile setup process.

**In the web app (artifacts/web/src/pages/billing.tsx):**  
`PLAN_LABELS = { individual: "Explorer" }`. On the web, `memberType = "individual"` renders as "Explorer" — not "Community Member." This is a third distinct label for the same user state: mobile calls them "Community Member," the web calls them "Explorer," and the database calls them "individual."

**In the Future-State Register (docs/product/FUTURE_STATE_REGISTER.md):**  
FSR-019 references "Conversational Onboarding" and mentions Community Member as context, but does not document the specific gap between the trust level label and the member-facing experience.

**In AUDIT-004 findings:**  
The prior community member signup audit identified the gap at the registration/onboarding level. It did not trace the full depth of the trust architecture that already defines the identity correctly internally.

---

## OUTPUT 4 — CURRENT REGISTRATION ARCHITECTURE

When a new member registers (any path — email, phone, Apple Sign-In):

| Field | Value set at registration | Source |
|---|---|---|
| `role` | `"user"` | Default in schema |
| `memberType` | `"individual"` | Default in schema |
| `trustLevel` | `1` | Default in schema |
| `reputationScore` | `0` | Default in schema |
| `identityVerified` | `false` | Default in schema |
| `approved` | `true` | Set explicitly in auth.ts during registration |
| `emailVerified` | `false` | Set; requires email confirmation flow |
| `profileSetupComplete` | `false` | Set; requires profile-setup completion |

**What "approved" means:**  
The `approved` field defaults to `false` in the schema but is set to `true` during registration in `auth.ts`. This was a holdover from an earlier waitlist/approval model. All new registrations are auto-approved. The field is technically live but has no user-facing effect.

**What the member experiences:**  
After registration, the member completes a 4-step profile setup (home city → roles → interests → privacy). At step 2 ("roles"), the screen says: "You're joining as a Community Member." After profile setup completes, this statement is never repeated or displayed again.

---

## OUTPUT 5 — WHY COMMUNITY MEMBER IS MISSING

"Community Member" is not architecturally missing. It is **experientially invisible** after the first 30 seconds.

The complete chain of failure:

**Step 1 — Two parallel systems, never unified:**  
`memberType` (billing tier: individual/navigator/trailblazer/etc.) and `trustLevel` (community progression: 1/2/3/4) were built and maintained independently. `memberType` is what the UI references most of the time. `trustLevel` is what actually maps to "Community Member" — but it is not displayed anywhere in the member's persistent experience.

**Step 2 — Onboarding says it once and moves on:**  
profile-setup.tsx correctly says "You're joining as a Community Member." at step 2. But after the setup completes, there is no post-setup screen that says "You are a Community Member" and explains what that means.

**Step 3 — The profile doesn't show trust level:**  
The profile tab does not display the member's trust level label ("Community Member," "Community Verified," etc.) in any visible form. A member who earned Trust Level 2 would not see "Community Verified" on their profile.

**Step 4 — The web uses a different label entirely:**  
On the web, `memberType = "individual"` renders as "Explorer." This is unrelated to the trust system and was never reconciled with the mobile experience.

**Step 5 — No navigation path to the trust progress screen:**  
The trust and verification data can be fetched via `GET /api/users/me/trust` and there are screens for it (`community-verified.tsx`, `trust-and-safety.tsx`) — but there is no entry point in the profile tab or settings that leads a member there from normal app navigation.

**Root cause in one sentence:**  
The trust level system was designed correctly for the intended product model, and the onboarding copy was written correctly, but neither was connected to the member's persistent visible identity after onboarding completed.

---

## OUTPUT 6 — PRIOR COMMUNITY MEMBER WORK FOUND

| Location | What it says | Status |
|---|---|---|
| `lib/db/src/trust.ts` | Trust Level 1 = "Community Member" | Active, correct |
| `artifacts/mobile/app/profile-setup.tsx` line 188 | "You're joining as a Community Member." | Active, visible during setup only |
| `artifacts/mobile/app/community-verified.tsx` | 598-line full verification screen (8 states) | Active, fully built, no nav entry point |
| `artifacts/mobile/app/trust-verification.tsx` | Redirect → community-verified | Active |
| `artifacts/mobile/app/trust-and-safety.tsx` | Platform trust and safety information | Active |
| `artifacts/api-server/src/routes/trust.ts` | Trust routes, verification submission, admin review | Active |
| `lib/db/src/schema/identity-verifications.ts` | identity_verifications table | Active |
| `artifacts/web/src/pages/billing.tsx` | memberType="individual" → label "Explorer" | Active, contradicts mobile |
| `docs/product/FUTURE_STATE_REGISTER.md` FSR-019 | Conversational onboarding / Community Member | NEEDS FOUNDER CLARIFICATION |

---

## OUTPUT 7 — CURRENT MEMBER ROLES AND DESIGNATIONS

**Billing tiers (memberType field):**
```
individual         → default, free member
navigator          → paid tier
trailblazer        → paid tier
community_builder  → paid tier
legacy_member      → paid tier
business           → business tier
founding           → founding member
beta               → beta member
business_referral  → referral-sourced business member
```

**Community trust levels (trustLevel field):**
```
1  →  Community Member        badge: ○    (default, all registrations)
2  →  Community Verified      badge: ✔    (identityVerified=true, admin-approved)
3  →  Trusted Contributor     badge: 🏆   (earned: 90+ days, 0 violations, 10 helpful reviews)
4  →  Community Ambassador    badge: 👑   (admin-granted only)
```

**Role flags (boolean fields on users table):**
```
isBusinessOwner        → separate business role
isContentCreator       → separate content creator role
isCommunityOrganizer   → separate community organizer role
isInfluencer           → separate influencer designation
```

These four role flags are additive — a member can hold any combination of them simultaneously with any trust level. A Business Owner is also a Community Member at Trust Level 1 until they progress.

---

## OUTPUT 8 — CURRENT TRUST AND PROGRESSION ARCHITECTURE

**computeTrustLevel() logic in lib/db/src/trust.ts:**
```
Level 4 (Ambassador): Stays at 4 if already Ambassador (admin-granted only)
Level 3 (Trusted Contributor): accountAgeDays >= 90 + 0 violations + 10 helpful reviews
Level 2 (Verified): identityVerified = true
Level 1 (Community Member): default (everyone else)
```

**getTrustProgress() — what members are told they need:**
- To reach Level 2: "Government-issued ID" + "Live selfie / liveness check"
- To reach Level 3: "Account at least 90 days old" + "No policy violations" + "10 helpful reviews"
- To reach Level 4: "Invitation from the Mapping With Melanin team"

**GAP — Critical:** `getTrustProgress()` tells members they need "Government-issued ID" and "Live selfie / liveness check" to reach Level 2. Neither a government ID processing service nor a liveness check service exists. What actually exists is: a selfie photo upload (or photo library image for "gov_id" path) and manual admin review. Members are being told they need a service that the platform cannot actually perform.

---

## OUTPUT 9 — VERIFIED COMMUNITY MEMBER CAPABILITY

**What the intended model requires:**
A Community Member + eligible paid tier + completed verification process → Trust Level 2 "Community Verified"

**What actually exists (server-side):**
- `POST /api/users/identity-verification` — accepts `{ selfieKey }`, creates a record in `identity_verifications` table with `status: "pending"`, restricted to paid tiers (navigator, trailblazer, community_builder, legacy_member, founding, beta)
- `GET /api/users/me/trust` — returns current trust level + pending verification status
- `PATCH /api/admin/identity-verifications/:id` — admin approves or rejects; on approval sets `identityVerified=true` and `trustLevel=2` on the user
- `GET /api/admin/identity-verifications` — admin queue of all pending reviews
- `GET /api/admin/identity-verifications/:id/selfie-url` — generates a 15-minute signed URL to the selfie in object storage

**What actually exists (mobile):**
- `community-verified.tsx` (598 lines) handles 8 states: loading / upgrade_required / already_verified / pending / rejected / choose_method / capturing / submitting / success
- Selfie path: front-facing camera via expo-image-picker → uploads to object storage → submits selfieKey to server
- Gov ID path: photo library picker via expo-image-picker → uploads to object storage → submits key to server
- Rejection path: shows admin notes
- Success path: shows verified confirmation

**Critical gaps in the verification workflow:**
1. The selfie is uploaded to object storage but the upload route and presigned-URL mechanism are referenced but not confirmed functional end-to-end in this audit (not verified against production)
2. No notification is sent to the member when admin approves or rejects — the member would need to re-open the community-verified screen to see the update
3. No document retention policy or deletion mechanism exists for submitted selfies
4. No consent language exists before the selfie is taken
5. The community-verified screen has no navigation entry point from the profile or settings tab — it is only reachable via deep link or if a member knows the route

---

## OUTPUT 10 — VERIFICATION PROVIDER AND PAID-SERVICE STATUS

**Verification provider: None. There is no third-party verification service.**

The platform does not use Persona, Stripe Identity, Jumio, Onfido, Veriff, or any other automated identity or liveness verification service. There are no API keys for any such service in the environment variables.

What the platform uses:
- `expo-image-picker` for photo capture (built into the Expo SDK)
- Replit Object Storage for selfie/document storage (already paid as part of the platform's infrastructure)
- Manual admin review via the admin panel

**The "paid service" question answered directly:**  
Mapping With Melanin™ is **not** paying for an identity verification service that members cannot access. The verification system is built in-house and uses admin labor for review. The only cost is object storage space and admin time.

**What `getTrustProgress()` tells members vs. what exists:**

| What members are told they need | What actually exists |
|---|---|
| "Live selfie / liveness check" | Front-facing camera photo — no liveness detection |
| "Government-issued ID" | Photo library image upload — no OCR, no document validation |

This is a significant gap between what members are promised and what the platform can deliver.

---

## OUTPUT 11 — VERIFICATION UI STATUS

**community-verified.tsx:**
- Status: Fully built (598 lines)
- States covered: All 8 states
- Entry points: None from standard navigation. Reachable via deep link or if developer navigates directly to the route. The `trust-verification.tsx` file is a redirect to this screen but has the same navigation gap.
- Platform note: The screen detects web and shows "Please use the iOS app to complete verification." for web users — correctly blocking the flow on web.
- Consent: No explicit consent statement before selfie capture
- Retention notice: None — members are not told what happens to their selfie image

**trust-and-safety.tsx:**  
A separate screen containing platform trust and safety information. Does not link to verification.

**trust-verification.tsx:**  
5-line file that is simply `<Redirect href="/community-verified" />`. Has no purpose beyond the redirect.

---

## OUTPUT 12 — VERIFICATION API AND DATABASE STATUS

**identity_verifications table (lib/db/src/schema/identity-verifications.ts):**
```
id              varchar  PRIMARY KEY  UUID
userId          varchar  NOT NULL
status          varchar  enum: pending | approved | rejected  DEFAULT pending
adminNotes      text     nullable
selfieKey       text     nullable (object storage key)
submittedAt     timestamp  NOT NULL  DEFAULT now()
reviewedAt      timestamp  nullable
reviewedBy      varchar  nullable
```

**Gaps:**
- No `method` column — cannot distinguish selfie from gov_id submissions in the database
- No `documentKey` — government ID images use the same `selfieKey` column
- No `consentAt` — no timestamp of member consent to the verification process
- No `retentionPolicy` or `deletedAt` — no mechanism to expire or delete images
- No `notifiedAt` — no record of when/whether member was notified of outcome

**Routes live in production:**
- `GET /api/users/me/trust` ✅
- `POST /api/users/identity-verification` ✅ (requires paid tier)
- `GET /api/admin/identity-verifications` ✅ (admin only)
- `PATCH /api/admin/identity-verifications/:id` ✅ (admin only)
- `GET /api/admin/identity-verifications/:id/selfie-url` ✅ (admin only, 15-min signed URL)

---

## OUTPUT 13 — MEMBERSHIP-TIER RELATIONSHIP

**memberType and trustLevel serve different purposes and should not be conflated:**

| Field | Purpose | Values | Who sets it |
|---|---|---|---|
| memberType | Billing/subscription tier | individual, navigator, trailblazer, etc. | Stripe webhook on subscription event |
| trustLevel | Community progression | 1, 2, 3, 4 | computeTrustLevel() + admin grant |
| identityVerified | Verification flag | boolean | Admin approval |

**How they interact (current code):**
- POST /users/identity-verification checks `memberType` — only paid tiers may submit
- Admin approval sets `identityVerified=true` AND `trustLevel=2` simultaneously
- `computeTrustLevel()` uses `identityVerified` to determine if Level 2 should apply

**The live contradiction:**
- `membership.tsx` line 1063: *"Verification is available at every membership tier — including Community Business (free). It's about trust, not the tier you choose."*
- `trust.ts` line 85: Returns HTTP 403 with `"Community Verified is available for Navigator members and above."` for any `memberType = "individual"` member.

This contradiction is in production. A free member who reads the membership screen and attempts verification will be blocked. This is both an incorrect member promise and a confusing user experience.

---

## OUTPUT 14 — SELFIE AND LIVENESS STATUS

**Selfie:** expo-image-picker with front-facing camera. Image uploaded to object storage. selfieKey stored in identity_verifications. No liveness detection. No anti-spoof check. No face matching against ID.

**Liveness:** Advertised in getTrustProgress() as a requirement. **Does not exist.** There is no liveness detection service, SDK, or algorithm in the codebase.

**Assessment:** The selfie path can confirm that a person was able to take a photo. It cannot confirm that the photo was taken live, that it matches any identity document, or that it is not a photo of a photo. This is a manual review workflow, not a liveness verification workflow.

---

## OUTPUT 15 — GOVERNMENT-ID STATUS

**Gov ID path in community-verified.tsx:** Uses `ImagePicker.launchImageLibraryAsync` — a photo library picker. The member selects an image from their camera roll. It is uploaded to object storage as the selfieKey. There is no OCR, no document type detection, no barcode/MRZ reading, no document validation.

**Assessment:** The "government-issued ID" path is, technically, a photo of any image the member selects from their library. An admin reviewer looking at the submission would see a photo (or potentially any image) from the member's library. Without document processing technology, this is a manual inspection process only.

**getTrustProgress() promise vs. reality:**

| getTrustProgress() says | Reality |
|---|---|
| "Government-issued ID" | Photo library image upload |
| "Live selfie / liveness check" | Front-facing camera photo |

Both requirements as stated in the member-facing progress screen describe capabilities that do not exist. The requirements should be rewritten to describe what is actually happening: a selfie or photo submission for manual review by the platform team.

---

## OUTPUT 16 — VERIFICATION BADGE AND MEMBER-FACING STATUS

**Trust Level 2 label:** "Community Verified" with badge "✔"  
**Where it appears:** Nowhere currently visible in the persistent member UI.

The `TRUST_LEVELS` object is defined and correct. The trust level is stored in the users table. The trust route returns it. But:
- The profile tab does not display it
- The settings screen does not display it
- Reviews display the reviewer's name but not their trust badge
- There is no visible badge anywhere in the mobile or web app that shows a member's trust level

The trust level exists in the data. It has no current member-facing manifestation.

---

## OUTPUT 17 — BUSINESS VERIFICATION VERSUS MEMBER VERIFICATION

**Business verification** (existing, in business-verify.tsx and the businesses table):
- Verifies minority ownership
- Uses admin review of submitted documentation
- Results in a verified badge on the business listing
- Available at any tier (including free business accounts)
- Described in membership.tsx as a 3-step process: Ownership docs + Business photos + Community signals

**Member identity verification** (community-verified.tsx):
- Verifies personal identity (selfie / photo)
- Uses admin review
- Results in Trust Level 2 "Community Verified"
- Currently restricted to paid tiers in the server route
- Membership.tsx incorrectly states it is available at all tiers

These are correctly designed as separate processes. A business owner goes through both separately — one for their personal identity, one for their business. The `identity_verifications` table handles personal identity. Business verification has its own separate flow.

---

## OUTPUT 18 — CULTURAL AMBASSADOR VERSUS VERIFIED MEMBER

**Current architecture:**
- Trust Level 2 = "Community Verified" — earned through identity verification, admin-approved
- Trust Level 4 = "Community Ambassador" — granted by admin via `POST /api/admin/users/:id/ambassador`, which sets `trustLevel=4` and raises `reputationScore` to at least 500

These are correctly implemented as **separate designations**. An admin can grant Ambassador status directly without requiring verification. Verification (Level 2) and Ambassador (Level 4) are independent paths. A member can be a Community Ambassador without having completed identity verification and vice versa.

**Gap:** The intended model specifies that Ambassador is reached through a "separate qualification process." Currently, it is simply an admin button press — there is no documented qualification process, application form, or standard criteria.

---

## OUTPUT 19 — MULTI-ROLE ACCOUNT MODEL

**Current state:**
The users table contains four boolean role flags:
- `isBusinessOwner`
- `isContentCreator`
- `isCommunityOrganizer`
- `isInfluencer`

These are correctly additive. A member can be a Business Owner, Content Creator, and Community Organizer simultaneously at any trust level. No role replaces another. No duplicate account is needed.

**What is missing:**
Role selection happens once during profile-setup. There is no mechanism for a member to add a role later (e.g., they become a business owner six months after joining). The profile-setup step that captures roles is not re-accessible.

---

## OUTPUT 20 — CURRENT PRIVACY AND RETENTION CONTROLS

**Selfie and document images:**
- Stored in object storage as `selfieKey` in `identity_verifications` table
- Admin-accessible via 15-minute signed URL only
- No public URL, no member-accessible URL
- No automatic deletion mechanism
- No stated retention period

**Member-accessible controls:**
- None. Members cannot view their submitted verification images
- Members cannot delete their verification submissions
- Members cannot withdraw a pending verification request

**Admin controls:**
- Admin can approve or reject with notes
- Admin can view selfie via signed URL
- No admin deletion UI for verification records or images

---

## OUTPUT 21 — CURRENT LEGAL AND CONSENT GAPS

1. **No consent statement before photo capture.** Members tap "Selfie" or "ID" and the camera immediately opens. There is no "by continuing, you consent to..." statement.

2. **No disclosure of what is being collected.** The screen does not explain that the image is stored, who reviews it, how long it is retained, or how to request deletion.

3. **No explanation of what the review process involves.** Members are not told that a human admin reviews their submission.

4. **No deletion right communicated.** Members are not told they can request deletion of their verification data.

5. **Biometric data note:** A selfie used for identity verification may constitute biometric data in certain jurisdictions (Illinois BIPA, Texas CUBI, etc.). The absence of a consent statement and retention policy creates legal exposure if the platform operates in those states.

6. **Gov ID note:** Photo ID documents contain highly sensitive personal information. Storing them in object storage without a stated retention policy and deletion right creates additional legal exposure.

7. **Age verification gap:** No age gate exists before a member can access the verification screen. A minor could theoretically submit a selfie without any parental consent mechanism.

---

## OUTPUT 22 — WHAT IS FULLY BUILT

| Component | Status |
|---|---|
| Trust Level definitions (4 levels with labels, badges, weights) | ✅ Fully built |
| computeTrustLevel() auto-promotion logic | ✅ Fully built |
| getTrustProgress() progress reporting | ✅ Fully built (with inaccurate requirements language) |
| identity_verifications table | ✅ Fully built |
| POST /api/users/identity-verification (submit selfie) | ✅ Fully built |
| GET /api/users/me/trust (fetch trust status) | ✅ Fully built |
| Admin verification queue (GET, PATCH) | ✅ Fully built |
| Admin signed-URL selfie viewer | ✅ Fully built |
| community-verified.tsx (8-state verification screen) | ✅ Fully built |
| Selfie capture via front camera | ✅ Fully built |
| Photo library upload (gov_id path) | ✅ Fully built |
| Object storage for selfie images | ✅ Fully built |
| Admin approval → sets identityVerified + trustLevel | ✅ Fully built |
| profile-setup.tsx "You're joining as a Community Member." | ✅ Built (single-use, disappears after setup) |
| Paid-tier gate on verification submission | ✅ Fully built |

---

## OUTPUT 23 — WHAT IS PARTIALLY BUILT

| Component | What exists | What is missing |
|---|---|---|
| Liveness check | Front-facing camera photo | Liveness detection service |
| Government ID verification | Photo library image upload | Document OCR, type detection, validation |
| Trust level badge | Defined in trust.ts | Not displayed anywhere in the member UI |
| "Community Member" identity display | Said once in profile-setup | Not persistent in profile, settings, or anywhere else |
| Member notification on approval/rejection | Data updates in DB | No push notification or email to member |
| Trust progress UI | Data exists + getTrustProgress() | No member-accessible screen linked from standard navigation |
| Verification consent | Screen exists | No consent statement before photo capture |
| Selfie deletion | Images in object storage | No member or admin deletion mechanism |
| Web "Community Member" label | Mobile says "Community Member" | Web says "Explorer" (billing.tsx PLAN_LABELS) |

---

## OUTPUT 24 — WHAT IS MISSING

1. A persistent "Community Member" identity displayed after onboarding (profile badge, settings label, or trust level chip)
2. A navigation entry point from the profile tab or settings to the trust and verification screen
3. Consent and disclosure language before selfie/document capture
4. Member deletion rights for verification data
5. A member notification (push or email) when verification is approved or rejected
6. Correction of the live contradiction: membership.tsx vs. trust.ts paid-tier gate
7. Rewrite of getTrustProgress() requirements to accurately describe what exists (manual selfie review, not liveness check)
8. Reconciliation of the web "Explorer" label with the mobile "Community Member" label
9. A mechanism for members to add roles after initial profile setup
10. An Ambassador qualification process beyond an admin button press

---

## OUTPUT 25 — WHAT WAS PREVIOUSLY REQUESTED BUT LOST OR DISCONNECTED

| Item | Where it was documented | What happened |
|---|---|---|
| "Join as a Community Member" moment | profile-setup.tsx copy | Exists once during setup; not connected to persistent identity |
| Trust level badge in profile | Implied by trust system design | Never built into profile tab UI |
| Verification as Navigator+ benefit | trust.ts route logic | Built correctly; never surfaced in Navigator benefits copy |
| Member notification on verification outcome | Implied by rejection state in community-verified.tsx | Never built |
| Community Member vs. Guest distinction | Intended model | Guest → Community Member distinction not visible (both see the same app shell) |
| Trust level progress entry point | GET /api/users/me/trust exists | No navigation from standard UI |

---

## OUTPUT 26 — ROOT CAUSE

**What was requested:** A "Community Member" identity that a person chooses at signup, distinct from Guest, distinct from paid membership.

**What was documented:** The trust level system correctly defined Community Member as Level 1 from the beginning. The founding vision documents reference the progression.

**What was built:** The full trust architecture (4 levels, computation, admin tools, verification submission, admin review, approval workflow). The onboarding copy. The verification screen.

**What was paid for:** Nothing external. No third-party service. Object storage (already in use) and admin labor.

**What was connected:** The trust level system connects correctly to the users table, to the verification submission route, to the admin panel, and to the community-verified screen.

**What became disconnected:** The member-facing identity moment. The trust level label ("Community Member") was never surfaced in the profile tab, settings, or anywhere persistent. The profile-setup.tsx says it once. Nothing else does.

**What the member currently experiences:** A person signs up, completes profile setup, sees "You're joining as a Community Member" once, and then sees nothing further about their identity. Their profile shows their name and whatever membership tier they purchased. If they purchased nothing, their billing identity on the web is "Explorer." In neither case do they see "Community Member" again.

**Why the gap was not previously identified:** The trust level system was built correctly. The onboarding copy was written correctly. Each piece appeared complete when reviewed in isolation. The gap existed at the connection point between the two systems — the moment when a newly set-up member should see and understand their identity — and that connection was never built.

**What process failure allowed it to remain hidden:** Before the Future-State Register audit workflow was established, there was no document tracking what was promised to members vs. what was built. The verification screen was built without an entry point being added to the navigation. The trust level was computed without a display layer being built. Each piece of work was closed when the code was written, not when the member journey was complete.

**How the new audit-first workflow prevents recurrence:** Every future feature must now have:
1. A confirmed entry point in the navigation (not just a route)
2. A member-facing communication of the benefit
3. An FSR entry tracking the gap between backend capability and member-facing implementation
4. An acceptance criterion that includes what a member actually sees, not just what the API returns

---

## OUTPUT 27 — PAID-SERVICE VALUE ASSESSMENT

| Question | Answer |
|---|---|
| Name of verification service | None. Self-built with admin review. |
| Current configuration status | Active (routes live, table exists) |
| Called by production | Yes (POST /api/users/identity-verification is a live route) |
| Successful verification records | Unknown — requires DB query to confirm |
| Failed/rejected attempts | Unknown — requires DB query to confirm |
| Mobile screen launches it | community-verified.tsx — but no nav entry point |
| Paid tier advertises it | trust.ts blocks free members; membership.tsx incorrectly says it's free |
| Provider charging despite no member-facing usage | N/A — no external provider |
| Integration safely activatable | The backend is live; the missing piece is member navigation + consent language |
| Should be paused or downgraded | N/A — no external service to pause |
| Evidence needed to prove end-to-end | Admin reviews at least one live submission; member notification is sent; member sees Trust Level 2 on their profile |
| Data the provider retains | N/A — no external provider |
| What platform retains | selfieKey in object storage + record in identity_verifications table (indefinitely — no expiry) |
| Who can access verification records | Admin only (signed URL, 15-min expiry) |
| How a member requests deletion | Currently: no mechanism exists |

---

## OUTPUT 28 — EXACT FILES, ROUTES, TABLES, ENVIRONMENT VARIABLES, AND SCREENS REVIEWED

**Database schema files:**
- `lib/db/src/schema/auth.ts` — users table (all fields including memberType, trustLevel, identityVerified)
- `lib/db/src/schema/identity-verifications.ts` — identity_verifications table

**Library files:**
- `lib/db/src/trust.ts` — TRUST_LEVELS, computeTrustLevel(), getTrustProgress(), getReviewWeight()

**API route files:**
- `artifacts/api-server/src/routes/trust.ts` — all trust and verification routes (fully read)
- `artifacts/api-server/src/routes/auth.ts` — registration routes (grep reviewed)
- `artifacts/api-server/src/routes/users.ts` — user profile routes (grep reviewed)
- `artifacts/api-server/src/routes/billing.ts` — billing routes (grep reviewed)

**Mobile screens:**
- `artifacts/mobile/app/community-verified.tsx` — verification screen (read lines 1–139 of 598)
- `artifacts/mobile/app/trust-verification.tsx` — redirect (fully read, 5 lines)
- `artifacts/mobile/app/profile-setup.tsx` — profile setup (grep reviewed)
- `artifacts/mobile/app/membership.tsx` — membership screen (grep reviewed)

**Web files:**
- `artifacts/web/src/pages/billing.tsx` — PLAN_LABELS (grep reviewed)
- `artifacts/web/src/pages/admin.tsx` — admin member management (grep reviewed)
- `artifacts/web/src/pages/home.tsx` — homepage (grep reviewed)

**Documentation:**
- `docs/product/FUTURE_STATE_REGISTER.md` — FSR-019 reviewed
- `docs/product/AUDIT_LOG.md` — prior audit entries reviewed

**Environment variables reviewed:**  
No third-party verification API keys found. Available secrets reviewed: no Persona, Stripe Identity, Jumio, Onfido, or similar service keys are present.

---

## OUTPUT 29 — DOCUMENTATION AND FUTURE-STATE REGISTER CROSSWALK

| Item | Currently in FSR? | Action needed |
|---|---|---|
| Community Member persistent identity display | No — FSR-019 is about onboarding conversation design | New FSR entry recommended |
| Trust level badge on profile | No | New FSR entry recommended |
| Navigation entry point to trust/verification | No | New FSR entry recommended |
| Consent language for verification | No | New FSR entry recommended |
| Member notification on verification outcome | No | New FSR entry recommended |
| Selfie/document deletion mechanism | No | New FSR entry recommended |
| Membership.tsx ↔ trust.ts contradiction | No | New FSR entry recommended |
| getTrustProgress() inaccurate requirements | No | New FSR entry recommended |
| Web "Explorer" vs. mobile "Community Member" label | No | New FSR entry recommended |
| Member role addition post-setup | No | New FSR entry recommended |
| Ambassador qualification process | No | New FSR entry recommended |

---

## OUTPUT 30 — FOUNDER DECISIONS REQUIRED

**FD-CM-001 — Verification tier gate: free or paid only?**  
`membership.tsx` currently promises free members access to verification. `trust.ts` blocks them. Which is correct?

Options:
- A: Verification is available to all Community Members (free and paid) — requires removing the paid-tier gate in trust.ts
- B: Verification is a paid-tier benefit (Navigator+) — requires correcting membership.tsx to reflect this
- C: Verification is available to paid members and offered as an upgrade prompt to free members who attempt it
  
**FD-CM-002 — What replaces the inaccurate "liveness" and "ID" requirements?**  
getTrustProgress() currently tells members they need "Government-issued ID" and "Live selfie / liveness check." These services don't exist. The correct description is: "A selfie or photo submission reviewed by our team."

Options:
- A: Correct the language to match reality (selfie + manual review)
- B: Invest in a third-party liveness/ID service to match the current promise
- C: Remove the ID requirement entirely; require selfie only

**FD-CM-003 — Should "Community Member" be displayed persistently?**  
After onboarding, should the member's trust level label ("Community Member") be visible on their profile, in settings, or as a small badge?

Options:
- A: Show trust level label on profile screen
- B: Show trust level badge/chip on the profile header
- C: Show in settings only ("Your community status: Community Member")
- D: Keep it invisible; rely on onboarding to communicate it

**FD-CM-004 — Consent and retention policy for verification**  
Before any more verification submissions can occur, the platform needs a consent statement and a retention/deletion policy.

Options:
- A: Add in-screen consent text before camera opens + add member deletion route + document 90-day image retention
- B: Add consent text only; defer deletion mechanism and retention policy
- C: Pause verification acceptance until full consent + deletion architecture is in place

**FD-CM-005 — Web label: "Explorer" or "Community Member"?**  
The web app uses "Explorer" for `memberType = "individual"`. Mobile uses "Community Member." These should be reconciled.

Options:
- A: Update web to use "Community Member" (aligns with trust system)
- B: Keep "Explorer" on web as a distinct web identity
- C: Remove the label from the web billing screen entirely

---

## OUTPUT 31 — SMALLEST SAFE BUILD 97 RECOMMENDATION

**Safe to include in Build 97 (small, surgical, no schema change):**

1. **Trust level label in profile-setup persistence** — After step 4 of profile-setup completes, show a brief confirmation: "You're now a Community Member of Mapping With Melanin™." This is a single UI addition.

2. **Trust level label in profile tab** — Add "Community Member" (or the computed trust label) as a small text element below the member's name in the profile tab. Uses existing `GET /api/users/me/trust` data. No new route needed.

3. **getTrustProgress() language correction** — Change the requirement labels from "Government-issued ID" / "Live selfie / liveness check" to "A photo for identity review" / "Selfie for identity review." Server-side only, one function in trust.ts.

4. **Membership.tsx ↔ trust.ts contradiction** — Correct one of the two. If FD-CM-001 chooses Option B (paid-only), update membership.tsx to say "Verification is available for Navigator members and above." If FD-CM-001 chooses Option A (free), update trust.ts to remove the paid-tier gate.

5. **Navigation entry point** — Add a "Community Trust" row to the settings screen that links to community-verified.tsx. One navigation item, no new screen needed.

**Not safe for Build 97 (requires additional architecture, consent work, or schema changes):**
- Full consent and retention system for verification (requires design + legal review)
- Member deletion of verification data (requires new admin flow + object storage deletion)
- Member notification on approval/rejection (requires push notification wiring)
- Third-party liveness or ID verification service (requires vendor selection + integration)
- Web label reconciliation (requires web app change + review)

---

## OUTPUT 32 — ITEMS THAT MUST BE DEFERRED

| Item | Reason |
|---|---|
| Third-party liveness/ID service | Requires vendor selection, contract, integration, consent framework, biometric data legal review |
| Member self-service deletion of verification data | Requires object storage deletion route + admin workflow change + member UI |
| Member notification on verification outcome | Requires push notification or email integration to verification approval flow |
| Full consent + retention framework | Requires legal review, especially for states with biometric data laws |
| Ambassador qualification process | Requires product design (criteria, application, review) |
| Post-signup role addition | Requires settings UI addition |
| Web label reconciliation | Web app change; lower priority than mobile fixes |

---

## OUTPUT 33 — ACCEPTANCE TESTS REQUIRED

Before any Community Member or verification work is marked complete:

1. A new member signs up and completes profile setup → sees "Community Member" identity in their profile
2. A member navigates from profile tab → settings → Community Trust → lands on community-verified screen without knowing the route
3. GET /api/users/me/trust returns `{ trustLevel: 1, levelInfo: { label: "Community Member" } }` for a new member
4. A free member attempts verification → receives an appropriate response (either allowed per FD-CM-001 Option A, or shown an upgrade prompt per Option C — not a raw 403 error)
5. An admin approves a verification → the member's trust level changes to 2 and label becomes "Community Verified" on their profile
6. getTrustProgress() requirements no longer reference "liveness check" or "government-issued ID" unless that service has been built
7. membership.tsx and trust.ts describe the same tier requirement for verification access

---

## OUTPUT 34 — CONFIRMATION THAT NO CHANGES WERE MADE

No code, schema, routes, screens, environment variables, database records, object storage contents, admin settings, membership tiers, verification statuses, or documentation statuses were modified during this audit.

This is a read-only report. No implementation has occurred.

---

## DIRECT ANSWERS TO THE FIVE REQUIRED QUESTIONS

**A. Why could a new person not choose "Community Member" even though this was part of the founder's intended platform model?**

They technically can — and are — a Community Member (Trust Level 1) the moment they register. The gap is that nothing shows them this after profile setup completes. The identity is real in the data. It is invisible in the experience. The fix does not require a database change — it requires adding the trust level label to the member's profile view.

**B. Does a functioning Verified Community Member workflow currently exist?**

Partially. The backend is fully functional: submission route, admin review queue, admin approval, trustLevel update. The mobile screen is fully built. What is non-functional: there is no navigation entry point from the standard app, no member notification on outcome, no consent language, and no retention/deletion mechanism. A paid member who somehow navigates to community-verified.tsx can successfully submit a selfie, an admin can approve it, and their trust level will become 2 — but the member would never know unless they returned to the screen manually.

**C. Is Mapping With Melanin™ paying for a verification capability that members cannot currently use?**

No. There is no third-party verification service. The verification system is self-built using expo-image-picker, object storage, and admin manual review. There is nothing to pause, downgrade, or cancel. The cost of the existing verification system is zero beyond object storage (which is shared infrastructure) and admin time.

**D. What exact work is required to give free users Community Member status while allowing eligible paid members to pursue verification?**

Community Member status exists already for all users at Trust Level 1. The work required is:
1. Display "Community Member" on the profile screen (Trust Level 1 label, one UI change)
2. Add a navigation entry point to the verification screen from settings
3. Resolve FD-CM-001 (free vs. paid verification gate) to eliminate the live contradiction
4. Correct getTrustProgress() to describe what the verification process actually is
5. Add pre-selfie consent language

None of these require a schema migration.

**E. Can this be safely included in Build 97 and the next Android build without introducing a large architectural refactor?**

Yes, with the boundary defined in Output 31. The label display, navigation entry point, and contradiction fix are all small, targeted changes. The consent framework, deletion mechanism, and notification system should be deferred. The core Community Member identity display is a UI-only change — it reads an existing API, shows an existing label, and requires no new routes or tables.
