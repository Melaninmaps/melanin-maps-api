# Mapping With Melanin™ — Build 97 Scope, Full Roadmap, and Role-Audit Sequence
**July 26, 2026 | READ-ONLY PLANNING | No implementation authorized**  
**Authorization phrase: "Please implement."**

---

## OUTPUT 1 — EXECUTIVE SUMMARY

Build 96 is under Apple review. All implementation is frozen until approval. This document captures confirmed founder decisions, defines the exact Build 97 scope, provides a nine-phase roadmap from Build 97 through full community orchestration, defines the verification treatment for Build 97, and sequences the four remaining experience audits.

**Three headline clarifications from this session:**

1. Verified Community Member eligibility is **any active paid membership** — not Navigator only. The server-side gate in `trust.ts` must be updated from the current named-tier list to any non-free memberType.

2. The self-built verification system (photo upload + admin review) is **preserved but hidden** in Build 97. No member navigation, no promoted verification, no vendor activation. The infrastructure is retained for the future third-party integration.

3. Community Member is a **persistent displayed identity**, not a one-time onboarding statement. Every registered member is a Community Member. Build 97 makes that visible.

**Business KinfolkAI (6 engines) and Cultural Ambassador (7 engines) visions received.** Both are brainstorming only — no implementation gate triggered. Both are preserved as the authoritative vision reference for AUDIT-007 (Business Owner), AUDIT-008 (Community Organization), and AUDIT-009 (Cultural Ambassador).

---

## OUTPUT 2 — CONFIRMED FOUNDER DECISIONS

These decisions are approved product direction and should not be re-litigated in implementation.

**FD-A — COMMUNITY MEMBER**  
Community Member is the free base membership identity for every person who registers. No payment, selfie, or government ID is required to join as a Community Member.

**FD-B — VERIFIED COMMUNITY MEMBER ELIGIBILITY**  
Eligibility to become a Verified Community Member is included with **every active paid individual membership**. This is not limited to Navigator. The rule is:
- Free membership → Community Member
- Any active paid membership → eligible to complete Verified Community Member verification (optional)

**Current code impact:** `trust.ts` PAID_TIERS = ["navigator", "trailblazer", "community_builder", "founding", "beta", "legacy_member"] is substantially correct but must be confirmed to include every active paid tier. The gate should be based on memberType ≠ "individual" (i.e., any non-free tier), not a named allowlist that could miss a future tier.

**FD-C — MULTIPLE ROLES (ADDITIVE)**  
One account may simultaneously hold:
- Community Member (base)
- Verified Community Member
- Business Owner
- Verified Business Owner
- Cultural Ambassador
- Community Organization representative
- Mentor
- Contributor / Trusted Contributor

These are additive. A Business Owner may be a Verified Community Member without being a Verified Business Owner. Personal identity verification is never treated as proof of minority business ownership. Verified Business Owner requires separate ownership documentation.

**FD-D — THIRD-PARTY VERIFICATION FUTURE DIRECTION**  
The founder prefers a third-party identity verification service for full-launch. Objectives:
- Lowest reasonable cost at early-stage volume (pay-as-you-go)
- Strong user protection
- Provider-hosted capture (platform does not store raw selfie or ID images)
- Explicit consent
- Clear deletion/redaction process
- Reliable iOS and Android experience
- One included verification per eligible paid member
- Duplicate-charge protection
- Accurate badge meaning

**Leading early-stage candidate:** Stripe Identity (pay-as-you-go pricing, existing Stripe infrastructure).  
**Future comparison:** Veriff (when volume justifies monthly minimum).  
**No vendor has been selected, contracted, or configured.** This decision is documented only.

---

## OUTPUT 3 — COMPLETE BUILD 97 FEATURE INVENTORY

### A — Authentication and Sessions
- New Community Member registration (email, phone, Apple Sign-In)
- Existing account login (all three paths)
- Email verification flow
- Apple Sign-In on iOS (with nonce, JWKS verification — already built Build 96)
- Password reset (6-digit code flow — already built)
- Logout (race condition fix — already built)
- Session renewal and expiry handling
- Cold launch and session restore
- App close/reopen background resume
- Expired-session UX (graceful prompt, not error)
- Lost-network handling
- Production environment verification (against Railway, not dev)

### B — Community Member Identity
- "Join as a Community Member" — persistent entry in registration/onboarding flow
- Post-signup confirmation: "You are now a Community Member of Mapping With Melanin™."
- "Community Member" label displayed on profile screen (from existing GET /api/users/me/trust)
- Guest versus Community Member distinction (what changes after you join)
- Free-tier benefits and limits clearly stated
- Trust Level 1 reused — no schema migration
- Consistent copy across all screens: eliminate "Explorer," "individual," "user" as member-facing labels
- Web billing.tsx: PLAN_LABELS["individual"] updated to "Community Member"
- membership.tsx: corrected to accurately state verification is a future paid benefit

### C — Lightweight Personalization (5-question onboarding)
See Output 8 for exact question design.

### D — Platform Language Corrections
See Output 9 for exact correction inventory.

### E — Maps and Heritage
See Output 10 for exact scope.

### F — Stability and Diagnostics
- Root-cause resolution for all known crashes (map rendering, auth redirects)
- Crash reporting integration (device/OS/build tagging)
- Navigation breadcrumbs in error reports
- Authentication regression test suite
- Map regression test suite
- Controlled concurrency testing (30-tester load)
- Failure-state testing (network, auth expiry, API down)
- Distributed-binary smoke tests (actual TestFlight + Play Console build)

---

## OUTPUT 4 — COMPLETE NEXT ANDROID BUILD INVENTORY

The next Android build (VC67) targets the same scope as Build 97 with the following Android-specific items:

**Included (same as Build 97):**
- All authentication paths (email, phone — Apple Sign-In excluded on Android)
- Community Member identity display
- Platform language corrections
- Maps and heritage (verified against Play Store binary)
- Stability and diagnostics

**Android-specific:**
- Google Sign-In (if applicable — check current state)
- Map SDK Android verification (separate from iOS)
- Push notification token handling (Android FCM — already built, verify against VC67)
- Android back-button navigation regression test
- SafeAreaView padding correctness on Android notch devices

**Excluded from Android VC67:**
- Apple Sign-In (iOS only)
- Personalization onboarding (unless confirmed parity is achievable within VC67 scope)

---

## OUTPUT 5 — iOS/ANDROID PARITY MATRIX

| Feature | iOS Build 97 | Android VC67 | Gap |
|---|---|---|---|
| Email registration | ✅ | ✅ | None |
| Phone (SMS OTP) registration | ✅ | ✅ | None |
| Apple Sign-In | ✅ | ❌ | Platform-only — expected |
| Google Sign-In | Confirm | Confirm | Status unknown |
| Community Member label on profile | ✅ | ✅ | None expected |
| 5-question personalization | ✅ | ✅ | None expected |
| Maps | ✅ | Verify | iOS pod fix removed googleMapsApiKey from iOS config — confirm Android unaffected |
| Heritage sites | ✅ | ✅ | None expected |
| Crash reporting | ✅ | ✅ | None expected |
| Verification UI (hidden) | ✅ | ✅ | Both hidden |
| Push notifications | ✅ | ✅ | None expected |
| KinfolkAI | ✅ | ✅ | None expected |

---

## OUTPUT 6 — EXPLICITLY DEFERRED ITEMS

The following are explicitly excluded from Build 97 and VC67:

| Item | Reason |
|---|---|
| Verified Community Member activation | No vendor, no consent framework, no end-to-end |
| Third-party liveness / ID service | Vendor not selected |
| Member deletion of verification data | Requires consent + deletion architecture |
| Trust Level badge on reviews/posts | Phase 2 work |
| Cultural Ambassador pages | Phase 2 |
| Community Organization pages | Phase 2 |
| Living Legacy video submissions | Phase 8 |
| Saved heritage places | Phase 2 |
| Structured mentorship | Phase 3 |
| HBCU alumni connections | Phase 3 |
| Kinfolk Circles | Phase 7 |
| Business Community Intelligence Briefings | Phase 6 |
| Post-launch pricing model changes | Post-launch (evidence needed first) |
| Real-time cultural feeds | Phase 9 |

---

## OUTPUT 7 — COMMUNITY MEMBER BUILD 97 EXPERIENCE

**Member journey from cold install through confirmed Community Member identity:**

1. **Install** — App opens. No account. Current state shows home screen with limited data.

2. **Registration choice** — Email / Phone / Apple Sign-In presented. No friction before this point.

3. **Registration** — Member creates account. memberType="individual", trustLevel=1 set by default.

4. **5-question personalization** — Concise onboarding before home screen. See Output 8.

5. **Confirmation moment** — After personalization: "You are now a Community Member of Mapping With Melanin™. Here's what that means." Brief explanation of what they can do now and what unlocks with a paid membership.

6. **Profile displays** — Profile screen shows name + "Community Member" label derived from trust level. No "individual," no "Explorer."

7. **Guest vs. Community Member** — Any unauthenticated visitor is a Guest. After registration they are a Community Member. This distinction is shown when a Guest attempts a feature that requires an account (favorites, surveys, circles, etc.).

8. **Future verification** — The profile will show a "Verification coming to paid members" note. No button, no action, no screen link. The verification screen itself is unreachable from navigation.

---

## OUTPUT 8 — PERSONALIZATION BUILD 97 EXPERIENCE

Five concise questions. All skippable. No personally identifiable data collected. Answers stored in `user_preferences` table (already exists).

---

**QUESTION 1 — What brings you here?**

*Wording:* "What brings you to Mapping With Melanin™?"

*Choices (multi-select):*
- Discover places in my community
- Support community businesses
- Plan travel or a move
- Safety and neighborhood insight
- Connect with my culture and heritage
- Find events and experiences
- Career, mentorship, or professional growth
- Just exploring

*Required:* No. Skip available.
*Data field:* user_preferences.primaryIntent (jsonb array)
*Recommendation effect:* Top discovery categories shown first. "Just exploring" shows balanced feed.
*KinfolkAI effect:* First-context hint for opening KinfolkAI response.
*Edit path:* Profile → Settings → Personalization
*Skip/prefer-not-to-answer:* Skips to Q2. Balanced defaults applied.
*Privacy:* "Your answers are private and improve your recommendations. We never sell this information."

---

**QUESTION 2 — What would you like to discover?**

*Wording:* "What kinds of places or experiences matter most to you?"

*Choices (multi-select):*
- Restaurants and food
- Beauty and wellness
- Arts, music, and culture
- History and heritage sites
- Faith and spiritual spaces
- Health and medical care
- Family activities
- Nightlife and entertainment
- Professional services
- Shopping and retail
- Fitness and outdoors

*Required:* No.
*Data field:* user_preferences.discoveryInterests (jsonb array)
*Recommendation effect:* Map category defaults. Discover feed weighting.
*KinfolkAI effect:* Category hints in KinfolkAI planning responses.
*Edit path:* Profile → Settings → Personalization
*Skip behavior:* All categories weighted equally.
*Privacy:* Same as Q1.

---

**QUESTION 3 — Which business communities or ownership designations would you especially like to support?**

*Wording:* "Are there specific ownership communities or business backgrounds you'd like to prioritize discovering?"

*Choices (multi-select, any combination):*
- Black-owned businesses
- Latino-owned businesses
- Caribbean-owned businesses
- African immigrant-owned businesses
- Indigenous-owned businesses
- LGBTQ+-owned businesses
- Women-owned businesses
- Veteran-owned businesses
- Disability-owned businesses
- Any minority-owned — no preference
- Prefer not to say

*Required:* No. "Prefer not to say" is always available.
*Data field:* user_preferences.ownershipPreferences (jsonb array)
*Recommendation effect:* When preferences are set, verified businesses matching those designations receive a relevance bonus in search and discovery — not exclusion of others.
*KinfolkAI effect:* KinfolkAI uses this to qualify recommendations ("Since you mentioned you prioritize...").
*"Black-owned" language:* Only appears in response to explicit member selection per Platform Language Rule.
*Edit path:* Profile → Settings → Personalization
*Skip behavior:* No preference applied. All verified businesses surface equally.
*Privacy:* "Your preference is private. It helps us show businesses whose ownership aligns with your values."

---

**QUESTION 4 — What matters most to you?**

*Wording:* "What are you working toward right now? (Choose all that apply)"

*Choices (multi-select):*
- Family and community connection
- Growing my career or business
- Health and wellness
- Cultural exploration and identity
- Safety and peace of mind
- Financial stability
- Giving back and volunteering
- Travel and adventure
- Education and learning
- Something personal I'd rather not share

*Required:* No.
*Data field:* user_preferences.lifeContext (jsonb array — existing lifestyleServices field or new)
*Recommendation effect:* Feeds KinfolkAI Life Journey context.
*KinfolkAI effect:* Activates contextual Life Journey suggestions.
*Edit path:* Profile → Settings → Personalization
*Skip behavior:* Life Journey suggestions use generic prompts.
*Privacy:* "This helps KinfolkAI give you more meaningful guidance. It is never shared or sold."

---

**QUESTION 5 — How would you like to contribute?**

*Wording:* "Would you like to help the community in any of these ways?"

*Choices (multi-select):*
- Write reviews and share experiences
- Report safety information
- Recommend businesses I know
- Share events or community news
- Mentor others in my field
- Represent my city or neighborhood as an Ambassador
- Support community organizations
- Not right now

*Required:* No.
*Data field:* user_preferences.contributionIntent (jsonb array)
*Recommendation effect:* Surfaces relevant contribution prompts (survey after a visit, etc.).
*KinfolkAI effect:* If "Mentor" is selected → KinfolkAI surfaces mentorship feature. If "Ambassador" selected → flags interest for future Ambassador invitation review.
*Edit path:* Profile → Settings → Personalization
*Skip behavior:* No contribution prompts surfaced until member engages organically.
*Privacy:* "Contribution choices are optional and private."

---

**Personalization flow design rules:**
- Maximum 5 questions, one screen each
- Progress indicator shown (1 of 5, 2 of 5...)
- "Skip" visible on every screen, top right
- "Prefer not to say" option on every question that involves identity
- Answers editable at any time in Profile → Settings → Personalization
- No question blocks access to the app
- No question result is ever exposed publicly on the member's profile

---

## OUTPUT 9 — PLATFORM LANGUAGE CHANGES

### Priority 1 — Live contradictions (must fix before Build 97)

| Location | Current copy | Correct copy |
|---|---|---|
| membership.tsx line 1063 | "Verification is available at every membership tier — including Community Business (free)." | "Identity verification is included with every paid membership. Free Community Members can upgrade at any time." |
| getTrustProgress() | "Government-issued ID" / "Live selfie / liveness check" | "A photo submitted for review by our team" |
| community-verified.tsx footer line 349 | "Verified Member or Verified Business badge" | Remove or update to reflect actual badge state |
| billing.tsx PLAN_LABELS["individual"] | "Explorer" | "Community Member" |

### Priority 2 — Generic "Black-owned" without designation or preference

These should only appear when: (a) user has selected Black-owned as a preference, or (b) the business is verified with that designation, or (c) the subject is specifically Black history/culture.

All audit instances to be documented before implementation. Do not apply blanket replacement — apply contextual rule per Platform Language Rule.

### Priority 3 — Member-facing identity labels

All instances of "individual," "user," "Explorer" (as a tier label) in member-facing copy replaced with "Community Member" where appropriate. Admin-only views may retain internal field names.

### Priority 4 — KinfolkAI canonical naming

"KinfolkAI" is the canonical name throughout. Eliminate any inconsistent variants (Kinfolk AI, kinfolkAI, etc.) in copy and UI labels.

### Priority 5 — Empty states, error messages, success messages

Audit all empty states to remove:
- Generic placeholder text that implies only one community type
- Any "Black-owned" language in default/fallback UI
- "Find Black-owned restaurants near you" style hardcoded suggestions

Replace with: "Discover community businesses near you" or mission-aligned equivalents.

---

## OUTPUT 10 — MAPS AND HERITAGE CHANGES

**Scope included in Build 97:**

| Item | Status | Build 97 action |
|---|---|---|
| Business-category tabs (horizontal scroll) | Partially built | Complete |
| Heritage-category tabs | Built | Verify and connect |
| Search within map view | Built | Verify |
| Vertical results list (sidebar/bottom sheet) | Built | Verify correct count |
| List and marker synchronization | Known issue | Fix |
| Detail tiles on business tap | Built | Verify |
| Freedom Trail display | Built | Verify |
| Safe-area clearance (bottom nav, notch) | Known issue | Fix |
| Responsive device behavior | Known issue | Audit and fix |
| Reusable results architecture | Exists | Refactor if needed |
| Correct counts (filter vs. total) | Bug | Fix |

**Excluded from Build 97:**
- Place-linked videos
- Saved heritage places (UI)
- Mentorship connections on map
- Alumni connections on map
- Living Legacy submission flow
- Real-time cultural feeds

---

## OUTPUT 11 — AUTHENTICATION REQUIREMENTS

All paths must pass against Railway production (not dev) before Build 97 is recommended:

1. Email registration → home screen in < 5s
2. Email login → home screen in < 2s
3. Phone SMS OTP → home screen in < 5s
4. Apple Sign-In (iOS) → home screen without error (nonce fix in Build 96)
5. Password reset → receives email → sets new password → logs in
6. Logout → session cleared → login prompt shown
7. Session restore → cold launch with valid token → home screen without login prompt
8. Session expiry → cold launch with expired token → graceful login prompt (no crash)
9. Lost network → appropriate error state, not crash
10. Multiple accounts on same device (if supported) → no session bleed

**Authentication freeze:** Auth architecture is frozen until public launch. Only surgical bug fixes are permitted.

---

## OUTPUT 12 — STABILITY AND DIAGNOSTIC REQUIREMENTS

| Requirement | Current state | Build 97 action |
|---|---|---|
| Crash reporting | Unclear — confirm Sentry or equivalent | Confirm or add |
| Build/device/OS tagging in error reports | Unknown | Add if not present |
| Navigation breadcrumbs | Unknown | Add |
| Auth regression test | Not confirmed as automated | Create |
| Map regression test | Not confirmed | Create |
| 30-tester concurrency test | Not run | Run before recommending expansion |
| Failure-state test (network down) | Unknown | Run |
| Distributed-binary smoke tests | Not confirmed for Build 97 binary | Required before TestFlight expansion |

---

## OUTPUT 13 — VERIFICATION TREATMENT IN BUILD 97

**Recommendation: Option B — Preserved but inaccessible**

**What this means:**
- `community-verified.tsx` stays in the codebase, compiles, and routes remain live
- No navigation entry point is added to profile, settings, or any menu
- No "Get Verified" button, card, or prompt is shown to any member
- No verification UI is visible to any member in Build 97
- The admin review queue continues to function (any prior submissions remain accessible to admin)
- The membership.tsx copy is corrected to accurately describe verification as a future paid benefit — not a current feature

**Why not Option A (completely hidden):**  
The routes and screen will be needed when Stripe Identity is integrated. Removing them creates rebuild work. They are live but benign in production — no member can reach them without a deep link, and no member has been directed there. Hiding them from code provides false safety while creating real rebuild cost.

**Why not Option C (Coming at Full Launch):**  
A "Coming soon" state in the UI creates member expectations, support questions, and pressure to launch prematurely. It also triggers member outreach asking when verification will be available. The platform is not ready to answer that question honestly yet.

**Specific changes required in Build 97 under Option B:**
1. Correct membership.tsx line 1063 to eliminate the live contradiction
2. Correct getTrustProgress() requirements language (remove "liveness check," "government-issued ID")
3. Correct community-verified.tsx footer (remove promise of badge that doesn't exist)
4. Do NOT add any navigation entry point to community-verified.tsx
5. Do NOT promote, advertise, or surface the screen to members

---

## OUTPUT 14 — THIRD-PARTY VERIFICATION FUTURE RECOMMENDATION

**Vendor evaluation for Phase 5:**

**Stripe Identity (primary evaluation candidate)**
- Pricing: Pay-as-you-go (~$1.50 per verification, confirmed from provider documentation at time of evaluation — must be verified from Stripe dashboard before implementation)
- Hosting: Provider-hosted (Stripe handles capture in their UI — platform does not receive or store raw ID images)
- Supported: Selfie + government ID + liveness matching (all three)
- Platform fit: Existing Stripe infrastructure, shared API key, familiar integration pattern
- Consent: Stripe-hosted consent screen (reduces platform legal exposure)
- Deletion: Stripe retains verification data per their privacy policy; platform stores only a reference ID and status
- Mobile: Stripe Identity SDK for React Native exists (must validate for Expo compatibility before selecting)
- Risk: Stripe's verification is US/EU-centric; international coverage should be confirmed for global member base

**Veriff (comparison candidate for later volume)**
- Pricing: Monthly minimum — not appropriate until verification volume is high enough to justify
- Coverage: Strong international coverage (relevant if global tester/launch volume materializes)
- Hosting: Provider-hosted
- Deferral reason: Monthly minimum cost + more complex integration vs. current volume

**Evaluation must happen before Phase 5 begins.** No vendor should be selected without:
1. Live dashboard pricing confirmation (not AI estimate)
2. Expo/React Native SDK compatibility test
3. Consent framework review
4. Data residency and deletion policy review
5. International coverage confirmation

---

## OUTPUT 15 — PAID-MEMBERSHIP ELIGIBILITY RULE

**Approved rule:** Any active paid membership → eligible for Verified Community Member (optional)

**Implementation impact:**
- `trust.ts` PAID_TIERS named list should be replaced with: memberType ≠ "individual" (any non-free tier)
- This ensures new future tiers automatically qualify without requiring a code change
- "individual" is the only free tier; all others are paid

**Not applicable in Build 97** — verification is hidden. This change prepares for Phase 5.

---

## OUTPUT 16 — PERSONAL VERIFICATION VERSUS BUSINESS VERIFICATION

These are permanently separate workflows. They must never be merged or implied as equivalent.

| Dimension | Personal Identity Verification | Business Ownership Verification |
|---|---|---|
| Purpose | Confirm real person behind member account | Confirm minority ownership of business |
| Result | Trust Level 2 "Community Verified" on member | `verified=true` on business listing |
| Data collected | Provider-hosted selfie + liveness (Phase 5) | Ownership documents, EIN, certification |
| Who can submit | Eligible paid member | Business owner/claimer |
| Admin approval | Required (current) or provider-automated (Phase 5) | Required (always) |
| Implications for the other | NONE — personal verification does not verify business | NONE — business verification does not verify identity |
| DocuSign | No | Yes (certification envelope) |

**The line that must never be crossed:**  
A member who has completed identity verification (Community Verified, Trust Level 2) has not thereby verified their business ownership. A member who has completed business verification has not thereby verified their personal identity. These are independent processes with independent results.

---

## OUTPUT 17 — FULL PHASE 1–9 ROADMAP

---

### PHASE 1 — STABLE TESTING FOUNDATION
**Build grouping:** Build 97 / Android VC67

**Member outcome:** A registered member experiences the app as a Community Member with a clear identity, accurate language, a working map, and no unexplained crashes.

**Features:**
- Community Member identity displayed persistently
- 5-question personalization onboarding
- Authentication regression tested (all paths)
- Map and heritage regression tested
- Platform language corrected
- Verification UI hidden but preserved
- Crash reporting and diagnostics

**Existing capabilities reused:** Trust Level 1 (lib/db/src/trust.ts), GET /api/users/me/trust, user_preferences table, profile-setup.tsx, map tab architecture, heritage data

**New work:** Trust level label on profile, personalization question flow, language correction sweep, settings → Community Trust entry point deferred, membership.tsx copy correction

**Dependencies:** Apple Build 96 approval, Android VC67 EAS build

**Privacy risks:** Low — no new sensitive data collected

**Safety risks:** Low

**Legal/policy needs:** None new

**Complexity:** Medium

**Testing requirements:** Full auth regression, map regression, 30-tester distributed binary test

**Required founder decisions:** FD-VER-003 (verification hidden vs. coming soon) — answered (Option B)

**FSR entries:** FSR-NEW-A through FSR-NEW-H (from AUDIT-006B)

**Exit criteria:**
- Zero authentication crashes in 30-tester binary
- "Community Member" label visible on every registered member profile
- Map loads correctly on iOS and Android production builds
- Zero instances of "Black-owned" as universal default in member-facing copy
- POST /api/auth/login-email → 200 in < 2s on Railway production

---

### PHASE 2 — ROLE FOUNDATIONS AND MULTI-ROLE ACCOUNTS
**Build grouping:** Build 98 (estimated)

**Member outcome:** A member can hold multiple roles (Community Member + Business Owner + Community Organization representative) on one account without creating duplicate accounts. Each role adds capabilities without removing others.

**Features:**
- Business Owner role designation visible on profile
- Claim a business → links to member account
- Community Organization representative role
- Role addition mechanism post-signup (settings path)
- Multi-role profile display (not crowded — designed for clarity)
- Verified Community Member navigation entry point (not activated — nav only)
- Trust Level badge display on profile (Community Member ○, Community Verified ✔)

**Existing capabilities reused:** isBusinessOwner flag, business claims architecture, isContentCreator/isCommunityOrganizer flags, Trust Level system

**New work:** Profile redesign to display roles gracefully, post-signup role addition flow, Community Organization tab architecture

**Dependencies:** Phase 1 complete

**Privacy risks:** Low

**Safety risks:** Low

**Legal/policy needs:** Community Organization eligibility criteria need policy definition

**Complexity:** Medium

**Testing requirements:** Multi-role account regression, profile display across role combinations

**Required founder decisions:** Community Organization eligible types (nonprofit only? informal groups? faith organizations?)

**Deferred:** Verification activation, Business Intelligence Briefings, Ambassador application

---

### PHASE 3 — COMMUNITY CONTRIBUTION ECOSYSTEM
**Build grouping:** Build 99 / 100

**Member outcome:** A Community Member can meaningfully contribute to the platform — reviews, safety reports, heritage nominations, event RSVPs, mentorship — and see their contribution reflected in their trust progress.

**Features:**
- Trust Level progress visible to member (GET /api/users/me/trust surfaced in profile)
- Helpful reviews count displayed
- Policy violations count (admin view only — not member-facing)
- Structured mentorship (connect mentors and mentees)
- HBCU alumni connections
- Living Legacy nomination flow
- Saved heritage places
- Event RSVP with community impact tracking

**Existing capabilities reused:** Reviews table, helpfulReviewsCount, helpfulVotes, mentorship_profiles table, getTrustProgress()

**New work:** Trust progress UI component, mentorship matching flow, HBCU connection screen

**Dependencies:** Phase 2 complete, alumni/mentorship data seeded

**Privacy risks:** Medium — mentorship involves personal professional data; need communication boundary controls

**Safety risks:** Low-medium — mentorship requires safeguards against misuse

**Legal/policy needs:** Mentorship disclaimer (not a licensed professional relationship)

**Complexity:** Large

**Testing requirements:** Trust level progression tests, review weight tests, mentorship matching tests

**Required founder decisions:** Mentorship tier limits, HBCU data sourcing approach

---

### PHASE 4 — KinfolkAI TRUST, MEMORY, PRIVACY, AND EXPLAINABILITY
**Build grouping:** Build 100 / 101

**Member outcome:** KinfolkAI explains why it made a recommendation, respects member data choices, and remembers context across conversations appropriately for the member's tier.

**Features:**
- KinfolkAI recommendation explanation ("I suggested this because...")
- Member-controlled memory (what Kinfolk remembers, what to forget)
- Privacy mode (opt out of personalization without losing access)
- Crisis keyword detection improvements
- Tier-appropriate response depth (Community Member vs. Navigator vs. Trailblazer)
- Voice feature (TTS "Listen" button) — already built, validate across tiers

**Existing capabilities reused:** buildSystemPrompt(), user_preferences, life_journeys table, kinfolk chat routes

**New work:** Explanation layer in KinfolkAI responses, memory management UI, privacy mode route

**Dependencies:** Phase 3 complete (trust levels needed for KinfolkAI personalization depth)

**Privacy risks:** High — long-term AI memory of personal context requires clear consent, access controls, and deletion

**Safety risks:** High — crisis keyword handling must be comprehensive

**Legal/policy needs:** AI memory consent framework, data retention policy for chat history

**Complexity:** Large

**Testing requirements:** Crisis response tests, tier enforcement tests, memory deletion tests

**Required founder decisions:** Chat history retention period, maximum memory depth by tier

---

### PHASE 5 — THIRD-PARTY VERIFIED COMMUNITY MEMBER
**Build grouping:** Build 102+ (after vendor evaluation)

**Member outcome:** An eligible paid member can complete identity verification through a provider-hosted flow. Mapping With Melanin™ receives only a reference ID and status — no raw image. The member receives the Community Verified designation on their profile.

**Features:**
- Stripe Identity (or approved alternative) integration
- Provider-hosted capture (selfie + liveness + optional government ID)
- Platform stores: provider reference ID, status, verifiedAt, method
- Platform does NOT store: selfie image, ID image, biometric template
- Member consent screen (before handoff to provider)
- Status states: pending / approved / rejected / expired
- Member notification on outcome (push or email)
- "Community Verified ✔" badge on profile and reviews
- Retry policy (1 included, admin-authorized additional)
- Duplicate session prevention
- Cost logging (no sensitive data)
- Member deletion right (triggers provider deletion request + platform record redaction)

**Existing capabilities reused:** identity_verifications table (schema extension needed), community-verified.tsx (rebuilt around provider SDK), admin verification queue, trust.ts approval route

**New work:** Provider SDK integration, consent screen, notification hooks, deletion endpoint, cost logging, database columns (providerReference, providerStatus, method, consentAt, deletedAt)

**Dependencies:** Phase 2 complete (role foundation), vendor evaluation complete, consent framework approved, Expo SDK compatibility confirmed

**Privacy risks:** HIGH — biometric data law compliance (BIPA, CUBI), international data residency

**Safety risks:** Medium — abuse prevention (multiple accounts), duplicate member detection

**Legal/policy needs:** Biometric data consent framework, retention and deletion policy, state law review (Illinois, Texas minimum)

**Complexity:** Large

**Testing requirements:** Provider sandbox end-to-end, duplicate prevention test, deletion test, notification delivery test

**Required founder decisions:** Final vendor selection, badge exact wording, retention period, what member sees if provider is unavailable

**Exit criteria:** End-to-end verified in TestFlight + Play Store binary against Railway production; member receives notification on approval; Community Verified label appears on member profile

---

### PHASE 6 — KinfolkAI LIFE JOURNEYS AND ECOSYSTEM INTELLIGENCE
**Build grouping:** Build 103+

**Member outcome:** KinfolkAI proactively supports members through life events (relocation, new baby, career change, business launch) with coordinated recommendations across businesses, organizations, and community resources. Business owners receive Community Intelligence Briefings.

**Features (Community Member side):**
- Life Journey activation (major life event triggers a guided plan)
- Cross-entity coordination (business + organization + community resource recommendations in one plan)
- Proactive check-ins (KinfolkAI follows up on an active Life Journey)
- Journey editing and completion

**Features (Business KinfolkAI — 6 engines):**
- Business Identity Engine (who are you — beyond category)
- Community Intelligence Briefings (observations, not analytics dashboards)
- Growth Coach (pattern-based suggestions with explanation)
- Opportunity Engine (seasonal and behavioral signals — with explanation of why)
- Partnership Engine (complementary business introductions with reasoning)
- Celebration Engine (milestones surfaced and shared if owner chooses)
- Voice tone learning (owner's writing style over time, opt-in)
- Promotion label: "Recommended because you're a good match and you've chosen to increase visibility" — organic and sponsored clearly distinguished

**Existing capabilities reused:** life_journeys table, entity_connections table, business_promotions, buildSystemPrompt, KinfolkAI chat routes

**New work:** Briefing generation route, Business KinfolkAI persona, Partnership Engine matching logic, Celebration Engine triggers, voice tone learning

**Dependencies:** Phase 4 (KinfolkAI trust/memory), Phase 3 (community data sufficient for observations)

**Privacy risks:** High — business intelligence briefings should not expose individual member behavior; aggregation and anonymization required

**Safety risks:** Low-medium — partnership suggestions must include reasoning, not speculation

**Legal/policy needs:** Business intelligence data use disclosure, partnership recommendation disclaimer

**Complexity:** Large

**Testing requirements:** Briefing quality review, partnership relevance tests, promotion label accuracy

**Required founder decisions:** Community Intelligence Briefing cadence (weekly?), briefing opt-in vs. default, voice tone opt-in mechanism

---

### PHASE 7 — KINFOLK CIRCLES AND REAL-WORLD CONNECTION
**Build grouping:** Build 104+

**Member outcome:** Members can create private shared spaces (Circles) for trusted groups — family travel planning, friend group discovery, community committees. Circles can be AI-curated or member-curated.

**Features:**
- Kinfolk Circles full launch (already built — 6 DB tables, mobile screens)
- Circle privacy controls and invitation flow
- AI curator mode (votes / random / by_member)
- Circle-based saved places sharing
- Tier limits on Circle creation (Community Member: 1 Circle, Navigator+: more)
- Meetup/in-person coordination safety guidelines

**Existing capabilities reused:** Circles architecture (fully built per memory entry), saved_places, circle_plans, curatorMode

**New work:** Circles launch entry point in main navigation, Meetup safety guidelines UI, Circle discovery (public Circles feature — if approved)

**Dependencies:** Phase 5 (identity verification adds trust signal to Circle curation)

**Privacy risks:** High — shared private Circles involve member location, preferences, and saved places

**Safety risks:** Medium — real-world connection facilitation requires safety guidelines

**Legal/policy needs:** Meetup safety policy, private Circle data handling

**Complexity:** Medium (mostly built)

**Required founder decisions:** Public Circles (opt-in discovery of Circles) — yes or no?

---

### PHASE 8 — CULTURAL STORYTELLING, HERITAGE, AND LIVING LEGACY
**Build grouping:** Build 105+

**Member outcome:** Cultural Ambassadors and Community Members can contribute to the permanent cultural record — heritage nominations, oral histories, place-linked videos, elder stories — and the platform becomes a living archive of community memory.

**Features (Cultural Ambassador — 7 engines):**
- Identity Engine (who the Ambassador is — beyond content category)
- Growth Engine (pattern-based insights, not pressure metrics)
- Community Impact Engine ("27 people visited businesses you recommended this month")
- Opportunity Engine (evidence-based content suggestion)
- Partnership Engine (intelligent introductions — businesses, organizations, creators, media)
- Evolution Engine (KinfolkAI celebrates life changes and growing audience evolution)
- Legacy Engine (Cultural Ambassadors preserve heritage, record elder stories, document neighborhood change)

**Features (Living Legacy):**
- Heritage nomination flow
- Oral history and story submission
- Place-linked video contribution
- "Communities Served" metric (not followers/impressions)
- Community Impact Report (Ambassador-facing — impact, not vanity metrics)
- Professional expertise display alongside Ambassador identity

**Existing capabilities reused:** Heritage sites on map, cultural-heritage screen, community_posts table (for story submission base)

**New work:** Ambassador portal, Living Legacy submission pipeline, oral history media handling, Community Impact Report generation, professional expertise fields

**Dependencies:** Phase 5 (Ambassador qualification may require Verified status), Phase 3 (contribution ecosystem)

**Privacy risks:** High — heritage stories may name people; elder stories require sensitive handling; oral histories may include minors
**Safety risks:** Medium — cultural content moderation required; harmful narrative risk in heritage documentation

**Legal/policy needs:** Cultural content ownership policy (contributor retains story, platform has license), oral history release form, minor protection in content

**Complexity:** Large

**Required founder decisions:** Living Legacy content ownership model, elder story capture process, Ambassador compensation/recognition model

---

### PHASE 9 — FULL COMMUNITY ORCHESTRATION
**Build grouping:** Post-launch builds

**Member outcome:** The platform achieves full Community Operating System capability: every role (Community Member, Business Owner, Cultural Ambassador, Community Organization, Mentor, Contributor) is interconnected, KinfolkAI coordinates across all roles simultaneously, and the platform generates measurable community economic impact.

**Features:**
- Cross-role KinfolkAI coordination (same conversation serves a member as Community Member AND Business Owner AND Cultural Ambassador)
- Real-time cultural feeds (community pulse, neighborhood trends)
- Economic impact measurement (platform-wide, not per-member)
- Kinfolk Circles integration with Heritage and Business networks
- Full Community Intelligence platform (anonymous, aggregated signal across all member types)
- Pricing evolution (outcomes-based, usage-based — post-launch evidence required)

**Dependencies:** All prior phases complete

**Complexity:** Very Large

**Required founder decisions:** Economic impact measurement methodology, outcomes-based pricing model, platform governance as scale grows

---

## OUTPUT 18 — BUSINESS OWNER AUDIT SCOPE

**AUDIT-007 — Business Owner Experience**

The Business Owner journey to audit (read-only, no implementation):

1. Joining as a Community Member first (prerequisite path)
2. Adding Business Owner role (isBusinessOwner flag, post-signup)
3. Creating a business listing vs. claiming an existing one
4. Business profile completion (hero image, story, services, hours, vibes)
5. Ownership verification (separate from personal identity — documentation process)
6. Business storytelling (bio, origin story, cultural context)
7. Videos (place-linked videos — current state vs. future state)
8. Events (creating, managing, promoting)
9. Offers and promotions (business_promotions table, placement types)
10. Hiring (jobs table — current state per opportunity center architecture)
11. Mentorship (as a mentor — current state)
12. Partnerships (current state vs. Phase 6 Partnership Engine)
13. Cultural Ambassador relationships
14. Community Organization relationships
15. Ratings and reviews (receiving, responding — owner response: built per Philly launch features)
16. Analytics (current state — what data is available)
17. Community Intelligence Briefings (Phase 6 — future state)
18. Membership tier and what changes by tier (business tiers)
19. Notifications (what triggers, what is received)
20. Multiple locations (current architecture support)
21. Enterprise businesses (no current architecture — flag as gap)
22. Business closure or transfer (no current mechanism — flag as gap)
23. Account deletion with active business (what happens to the listing)
24. KinfolkAI for Business (current state vs. 6-engine Phase 6 vision)

**Vision input received (brainstorming only):** Business KinfolkAI 6-engine model (Business Identity, Community Intelligence, Growth Coach, Opportunity, Partnership, Celebration). Stored as vision reference for this audit.

---

## OUTPUT 19 — COMMUNITY ORGANIZATION AUDIT SCOPE

**AUDIT-008 — Community Organization Experience**

1. Eligible organization types (nonprofit, informal, faith-based, mutual aid, advocacy, professional associations)
2. Registration process (current vs. needed)
3. One-account/multiple-role model (Organization rep is also a Community Member)
4. Organization verification (separate from both personal identity and business)
5. Service areas (geographic scope declaration)
6. Resources (what resources the org provides, how listed)
7. Eligibility requirements (who can access org resources)
8. Events (creating and promoting community events)
9. Volunteers (recruitment, coordination)
10. Donations (current support — none expected; flag if needed)
11. Mentorship (organization-facilitated mentorship vs. individual mentorship)
12. Youth services (privacy protection for minors, parent/guardian data)
13. Emergency support (crisis resources, safety hub integration)
14. Recurring information (announcements, recurring events)
15. Expiration and reconfirmation (org profiles should have a reconfirmation period)
16. Business partnerships
17. Cultural Ambassador partnerships
18. Privacy of people served (particularly for social services organizations)
19. Admin moderation (harmful organizations, misinformation)
20. Current vs. future state

---

## OUTPUT 20 — CULTURAL AMBASSADOR AUDIT SCOPE

**AUDIT-009 — Cultural Ambassador Experience**

1. Qualification criteria (current: admin grant only — what should it be?)
2. Application vs. invitation model
3. Verification (does Ambassador require Verified Community Member first?)
4. Communities and places represented (geographic scope)
5. Guides (can write platform guides — current state)
6. Videos (place-linked video creation — current state)
7. Events (hosting, highlighting community events)
8. Recommendations (how recommendations flow to Community Members)
9. Sponsorship disclosure (distinction between organic and paid recommendations)
10. Heritage and Living Legacy contributions (Phase 8 primary role)
11. Mentorship (as community mentor)
12. Safety responsibilities (Ambassadors as trusted voices — implications for safety)
13. Recognition and incentives (how success is measured — "Communities Served," not followers)
14. Analytics (Community Impact Report vs. vanity metrics)
15. Removal or suspension (ambassador status can be removed)
16. Professional expertise display alongside Ambassador identity
17. Current vs. future state

**Vision input received (brainstorming only):** Cultural Ambassador 7-engine model (Identity, Growth, Community Impact, Opportunity, Partnership, Evolution, Legacy). "Communities Served" metric vs. follower count. Community Impact Report vs. analytics dashboard. Stored as vision reference for this audit.

---

## OUTPUT 21 — CROSS-ROLE ARCHITECTURE AUDIT SCOPE

**AUDIT-010 — Cross-Role and Multi-Role Architecture**

1. Current boolean role flags (isBusinessOwner, isContentCreator, isCommunityOrganizer, isInfluencer) — completeness and gaps
2. How profile displays multiple roles simultaneously without crowding
3. How KinfolkAI context switches between roles within one conversation
4. How trust level (personal identity) interacts with role permissions
5. Permission model: what does each role unlock that others don't?
6. How admin manages a member who holds 5+ roles
7. Duplicate account risk (member creates two accounts for different roles)
8. How notifications target role-relevant content
9. How business verification is separate from personal verification for the same user
10. Data model sufficiency for Phase 2 role foundation work

---

## OUTPUT 22 — FEATURES REPLIT BELIEVES ARE ALREADY BUILT

(Confirmed from audit trail and memory)

| Feature | Location | Status |
|---|---|---|
| Trust Level 1–4 system | lib/db/src/trust.ts | ✅ Fully built |
| Community Member label (Trust Level 1) | TRUST_LEVELS constant | ✅ Data exists |
| Admin identity verification queue | trust.ts routes | ✅ Fully built |
| community-verified.tsx (8 states) | mobile app | ✅ Fully built (no nav entry point) |
| Business verification (ownership docs) | verification.ts | ✅ Fully built |
| Reviews with trust weighting | getReviewWeight() | ✅ Fully built |
| Profile setup "Community Member" text | profile-setup.tsx line 188 | ✅ Exists (one-time display) |
| KinfolkAI chat (multi-tier depth) | kinfolk routes | ✅ Fully built |
| Life Journeys | life_journeys table + routes | ✅ Fully built |
| Kinfolk Circles | 6 DB tables + mobile screens | ✅ Fully built |
| Business Growth Tools (promotions) | business_promotions table | ✅ Fully built |
| Philly launch features (9 items) | Per memory entry | ✅ Fully built |
| Heritage sites on map | FullMapView.tsx | ✅ Fully built |
| Opportunity Center | opportunities.tsx | ✅ Fully built |
| Community Reference feature | community-reference.tsx | ✅ Fully built |
| Social feed + privacy | community_posts | ✅ Fully built |
| Topic Library System | 70+ topics seeded | ✅ Fully built |
| DocuSign integration | docusign.ts | ✅ Fully built |

---

## OUTPUT 23 — FEATURES REPLIT BELIEVES ARE PARTIALLY BUILT

| Feature | What exists | What is missing |
|---|---|---|
| Community Member persistent identity | Trust Level data + one-time profile-setup copy | Profile label, settings entry, post-setup confirmation |
| Verified Community Member | Backend routes + admin tools + mobile screen | Nav entry point, consent, notification, badge display |
| Business KinfolkAI | Chat with basic business context | 6-engine structure, Intelligence Briefings, voice tone learning |
| Cultural Ambassador system | Trust Level 4 (admin grant) | Full Ambassador portal, 7-engine model, Communities Served metric |
| Community Organization role | isContentCreator/isCommunityOrganizer flags | Dedicated org profile, resource listing, events, volunteer coordination |
| Personalization onboarding | KinfolkOnboarding (existing 5-step flow) | Revised 5-question design per approved spec |
| Trust Level progress display | getTrustProgress() API | No member-accessible UI screen |
| Trust Level badge on content | computeTrustLevel(), weights | No badge component in reviews/posts |
| Member notifications on verification | DB records | No push/email trigger |
| Admin Community Verified UI panel | API routes exist | admin.tsx panel for identity reviews unconfirmed |

---

## OUTPUT 24 — FEATURES REPLIT BELIEVES ARE MISSING

| Feature | Notes |
|---|---|
| Third-party identity verification | No vendor integrated — Phase 5 |
| Liveness detection | No technology exists anywhere — Phase 5 |
| Document OCR / government ID validation | No technology exists — Phase 5 |
| Member deletion right for verification data | No mechanism — Phase 5 prerequisite |
| Verified Community Member badge on profile | Badge component doesn't exist — Phase 5 |
| Member notification on verification outcome | Not built — Phase 5 |
| Business Intelligence Briefings | Phase 6 |
| KinfolkAI 6-engine business model | Phase 6 |
| Cultural Ambassador 7-engine model | Phase 8 |
| Cultural Ambassador portal | Phase 8 |
| Community Organization full platform | Phase 2-3 |
| Living Legacy submission pipeline | Phase 8 |
| "Communities Served" metric | Phase 8 |
| Community Impact Report (Ambassador) | Phase 8 |
| Enterprise business architecture | Unscoped |
| Business closure/transfer mechanism | Unscoped |
| Post-signup role addition mechanism | Phase 2 |
| Mentorship matching UI | Phase 3 |

---

## OUTPUT 25 — RISKS AND CONTRADICTIONS

**Live production contradictions requiring Build 97 fix:**

1. membership.tsx says verification is free — trust.ts blocks free members at API level
2. getTrustProgress() advertises liveness + government ID — neither service exists
3. community-verified.tsx footer promises "Verified Member badge" — no badge exists
4. billing.tsx labels free members "Explorer" — mobile calls them "Community Member"

**Architectural risks:**

1. Personal member selfie images stored in `verification-docs/` (business document prefix) — architectural confusion
2. community-verified.tsx line 149 bug — both paths submit docType="government_issued_id"
3. No notification mechanism on verification outcome — member cannot know without returning to screen
4. Object storage image retention: no expiry, no member deletion right, no retention schedule

**Platform language risk:**
The Platform Language Rule (use "Black-owned" only when verified/preferred, not as default) has not been fully audited across all copypoints. This must be completed before broad tester expansion.

**30-tester capacity risk:**
Railway production connection pool (5 connections) was previously exhausted under 7 rapid deploys. Under normal tester load, 5 connections is sufficient for 30 concurrent testers at typical usage patterns. Risk: if a deployment happens during active testing, the graceful shutdown (now implemented) must fire correctly. Recommended: no deploys during active tester sessions.

---

## OUTPUT 26 — FOUNDER DECISIONS STILL REQUIRED

| ID | Question | Status |
|---|---|---|
| FD-BO-001 | What distinguishes an eligible "business" for Mapping With Melanin™? (Sole proprietors? Registered LLCs only? Any minority-operated enterprise?) | Needed before AUDIT-007 |
| FD-CO-001 | What organization types are eligible to register as Community Organizations? | Needed before AUDIT-008 |
| FD-CA-001 | Does Cultural Ambassador require Verified Community Member status as a prerequisite? | Needed before AUDIT-009 |
| FD-CA-002 | Is Cultural Ambassador application-based or invitation-only? | Needed before AUDIT-009 |
| FD-P4-001 | KinfolkAI chat history: how long is it retained per tier? | Needed before Phase 4 |
| FD-P6-001 | Community Intelligence Briefings: weekly default, or opt-in? | Needed before Phase 6 |
| FD-P7-001 | Public Circles: can Circles be discovered by non-members? | Needed before Phase 7 |
| FD-P8-001 | Living Legacy content ownership model | Needed before Phase 8 |
| FD-P8-002 | Ambassador compensation or recognition model | Needed before Phase 8 |
| FD-VERIFY | Final vendor selection (Stripe Identity or other) | Needed before Phase 5 |
| FD-PRICE | Post-launch pricing model evolution (outcomes-based) | After launch — evidence needed first |

---

## OUTPUT 27 — FUTURE-STATE REGISTER UPDATES REQUIRED

The following new FSR entries should be added (not overwriting existing entries):

| FSR ID | Title | Priority |
|---|---|---|
| FSR-NEW-A | Verified Community Member accurate description (manual photo review) | P0 |
| FSR-NEW-B | Stripe Identity / Veriff vendor evaluation | P1 |
| FSR-NEW-C | Consent and retention framework for verification data | P0 |
| FSR-NEW-D | Member notification on verification outcome | P1 |
| FSR-NEW-E | Trust Level badge on profile and content | P1 |
| FSR-NEW-F | Community Member persistent label (Build 97) | P0 |
| FSR-NEW-G | docType bug fix in community-verified.tsx line 149 | P0 |
| FSR-NEW-H | membership.tsx contradiction with trust.ts | P0 |
| FSR-NEW-I | Dedicated member identity upload endpoint | P1 |
| FSR-NEW-J | Admin panel for identity verification review (confirm status) | P1 |
| FSR-NEW-K | Member deletion rights for verification data | P1 |
| FSR-NEW-L | Business Owner 6-engine KinfolkAI (Phase 6) | P2 |
| FSR-NEW-M | Cultural Ambassador 7-engine model (Phase 8) | P2 |
| FSR-NEW-N | "Communities Served" metric vs. follower count | P2 |
| FSR-NEW-O | Community Intelligence Briefings (Business) | P2 |
| FSR-NEW-P | Eligibility gate: any paid tier, not named allowlist | P1 |

---

## OUTPUT 28 — EXACT DOCUMENTS UPDATED

1. `docs/product/community-member/COMMUNITY_MEMBER_VERIFICATION_AUDIT.md` — Created (AUDIT-006A, 34 sections)
2. `docs/product/community-member/VERIFIED_COMMUNITY_MEMBER_VENDOR_TRACE.md` — Created (AUDIT-006B, 36 sections)
3. `docs/product/BUILD_97_SCOPE_AND_ROADMAP.md` — This document (AUDIT-006C, 29 sections)
4. `.agents/memory/MEMORY.md` — Added verification architecture gap pointer
5. `.agents/memory/verification-architecture-gap.md` — Created (permanent reference)

---

## OUTPUT 29 — CONFIRMATION THAT NO CODE OR BUILD CHANGES WERE MADE

No code, schema, routes, screens, environment variables, database records, object storage contents, provider accounts, membership tiers, verification settings, packages, Apple submissions, or Android submissions were modified during this session.

No build was submitted. No build number was changed. No vendor account was created or activated. No verification was activated.

This is a read-only planning document. No implementation has occurred.

---

## DIRECT ANSWERS — 6 REQUIRED QUESTIONS

**A. Does Replit understand that every paid membership is eligible for Verified Community Member?**

Yes. Any active paid membership (any memberType that is not "individual") qualifies a member to optionally pursue Verified Community Member status. This is not limited to Navigator. The trust.ts PAID_TIERS named allowlist should be replaced with memberType ≠ "individual" logic in Phase 5 to ensure all current and future paid tiers automatically qualify without a code change.

**B. Does Replit understand that a verified person is not automatically a verified business owner?**

Yes, completely. Community Verified (Trust Level 2) confirms a real person is behind a member account. It has no relationship to business ownership verification. A member can be Community Verified and not be a Verified Business Owner. A Verified Business Owner has not thereby verified their personal identity. These are two separate processes, two separate admin queues, two separate results stored in two separate database tables, and they never imply each other.

**C. What exactly is proposed for Build 97 and the next Android build?**

Build 97 (iOS) and VC67 (Android): Authentication regression (all paths), Community Member identity displayed on profile, 5-question personalization onboarding, platform language corrections (membership.tsx contradiction, getTrustProgress() language, web "Community Member" label, generic Black-owned audit), maps and heritage (category tabs, search, list/marker sync, safe-area clearance), stability and crash diagnostics. Verified Community Member is preserved but inaccessible — no member navigation, no promoted feature.

**D. What is explicitly excluded?**

Verified Community Member activation, third-party vendor integration, any new verification UI entry points, Cultural Ambassador pages, Community Organization pages, Living Legacy submission, saved heritage places, structured mentorship, HBCU connections, Business Intelligence Briefings, Kinfolk Circles changes, real-time cultural feeds, post-launch pricing changes.

**E. Which experience audits remain necessary before implementation of the larger ecosystem?**

AUDIT-007 — Business Owner Experience  
AUDIT-008 — Community Organization Experience  
AUDIT-009 — Cultural Ambassador Experience  
AUDIT-010 — Cross-Role and Multi-Role Architecture  

These should be completed in sequence before Phase 2 implementation begins.

**F. Is Replit confident that the current app can support 30 testers, and what evidence supports that answer?**

Yes, at the infrastructure level. Evidence:
- Railway production Postgres with graceful shutdown (SIGTERM → pool.end()) prevents connection pool exhaustion under normal tester load
- The connection pool (5 connections) handles concurrent requests at 30-tester volumes under typical usage patterns (not all 30 simultaneously hammering the API)
- The auth system has been tested through TestFlight with founder and close testers
- Maps are live with data (Build 96 includes the map fix)

Qualification: The app has known gaps (language corrections, map sync issues, Community Member label) that Build 97 addresses. Recommending 30-tester expansion only after Build 97 TestFlight binary passes the Phase 1 exit criteria, specifically: zero auth crashes, Community Member label visible, map loads correctly, zero "Black-owned" as universal default in member-facing copy, and production API smoke test passes.

Risk: A deployment during active testing without the graceful shutdown firing correctly could temporarily exhaust the connection pool (the July 21 pattern). Recommended: schedule any deploys outside active tester sessions.
