# Mapping With Melanin — Build Roadmap

**Version:** August 5, 2026  
**Status:** ACTIVE — This is the source of truth for all builds.

---

## Rules for Replit

1. **Nothing in this document is optional.** Every item is a founder-approved, committed decision. Do not defer, deprioritize, or remove any item without explicit founder authorization.
2. **Never delete prior decisions.** If a new feature appears to conflict with a prior decision, STOP and flag it to the founder. Do not silently resolve conflicts by removing the older feature.
3. **This document is append-only.** New items get added. Existing items get marked COMPLETE or MOVED (with the new build number). Items are never deleted.
4. **Store this document permanently.** It lives in `docs/product/BUILD_ROADMAP.md` in the repository. Update it as items are completed. The founder and Manus AI will reference it in every session.
5. **When in doubt, ask.** If you're unsure whether something conflicts, whether a feature should be included, or whether a decision has changed — ask the founder. Do not guess.

---

## Build 102 — Apple Rejection Fix (SUBMITTED Aug 5, 2026)

| # | Item | Status |
|---|---|---|
| 1 | Remove all IAP/subscription references | ✅ COMPLETE |
| 2 | Stub RevenueCat — zero StoreKit calls | ✅ COMPLETE |
| 3 | Membership screen → free features only | ✅ COMPLETE |
| 4 | Billing screen → "app is free" message | ✅ COMPLETE |
| 5 | UpgradeModal returns null | ✅ COMPLETE |
| 6 | Remove premium trial countdown banner | ✅ COMPLETE |
| 7 | Remove video quota upgrade button | ✅ COMPLETE |
| 8 | Build number 101 → 102, versionCode 76 → 77 | ✅ COMPLETE |
| 9 | Age Rating: Parental Controls → None | ✅ COMPLETE (App Store Connect) |
| 10 | App Review note submitted | ✅ COMPLETE |

---

## Build 103 — Post-Approval Feature Build (Target: Aug 10-11)

**Purpose:** Fix data pipeline bugs, launch all tour cities, enable tester experience, fix font scaling.

| # | Item | Workstream | Priority | Status |
|---|---|---|---|---|
| 1 | Bug fix: Interests saving to DB (`selectedInterests` → PATCH payload → `user_preferences.cultural_interests`) | Data Pipeline | P0 | ✅ COMPLETE |
| 2 | Bug fix: Heritage transfer (AsyncStorage → `user_preferences.diaspora_countries` + `preferred_ownership_types`) | Data Pipeline | P0 | ✅ COMPLETE |
| 3 | Launch 16 tour cities (DC, Richmond, Raleigh/Durham, Charlotte, Columbia, Atlanta, Montgomery, Birmingham, Mobile, Baton Rouge, New Orleans, Houston, Allentown, Abington, Harrisburg, Chicopee) | City Launch | P0 | |
| 4 | Admin tester toggle (search by email → flip `isTester` on/off) | Admin | P0 | |
| 5 | Universal demo businesses (5 test pins near tester's GPS location) | Tester Experience | P1 | |
| 6 | Demo business indicator ("🧪 Test Business" badge, visible to testers only) | Tester Experience | P1 | |
| 7 | Test data isolation (reviews on demo businesses tagged, deletable at phaseout) | Data Integrity | P1 | |
| 8 | Font scaling fix (text renders correctly on all device sizes) | UI | P1 | |
| 9 | City boundary logic: map is radius-based, not city-gated (Option C) | Map | P1 | |
| 10 | Home city determines Kinfolk personalization, not GPS (Option A) | Kinfolk | P1 | |
| 11 | Inclusive language audit: replace all 323 generic "Black-owned" instances with "minority-owned" / "community" across web, mobile, and API — add regression prevention | Language | P0 | |

*Verification: See `docs/product/MWM_Replit_Build_103_Complete_Instructions.md` and `docs/product/MWM_Replit_Language_Audit_Fix.md` for full checklists.*

---

## Build 104 — Onboarding & Personalization (Target: Aug 14-16)

**Purpose:** Complete the onboarding flywheel so new users from the tour get a personalized day-1 experience.

| # | Item | Source Document |
|---|---|---|
| 1 | New onboarding step: "What brings you here?" (7 options, single-select) | Onboarding Flywheel Instructions |
| 2 | DB column for intent/purpose (`user_preferences.onboarding_intent`) | Onboarding Flywheel Instructions |
| 3 | Kinfolk first-message logic (7 personalized messages based on intent) | Onboarding Flywheel Instructions |
| 4 | Reframe identity screen: "What communities are part of YOUR story?" (not "who to support") | Onboarding Flywheel Instructions |
| 5 | One-Way Mirror implementation: Kinfolk references behavior only, never identity | Onboarding Flywheel Instructions |
| 6 | Business aggregate intelligence dashboard (anonymous counts: "47 people searching for X") | Onboarding Flywheel Instructions |
| 7 | City Story / Living Legacy page header (historical context from cultural guides) | City Story Instructions |
| 8 | City Story welcome card (first visit, dismissible) | City Story Instructions |
| 9 | City Story searchable ("Philadelphia history" returns City Story content) | City Story Instructions |
| 10 | Soft city transition prompt ("You're in Philadelphia — want to explore its Living Legacy?") | City Boundary Instructions |

---

## Build 105 — Business Profile Card & Content Hierarchy (Target: Aug 20-25)

**Purpose:** Implement the 4-layer business profile card that makes the introduction before the transaction.

| # | Item | Source Document |
|---|---|---|
| 1 | Layer 1: Business's own story (video upload, photos, description — uploaded to MWM) | Integrity Framework §9 |
| 2 | Layer 2: Community voice ("1,001 people said this is the sharpest lineup in town" — aggregated endorsements) | Integrity Framework §9 |
| 3 | Layer 3: Cultural Ambassador content (embedded creator videos about this business) | Integrity Framework §9 |
| 4 | Layer 4: Outbound link ("Book a service" / "Visit their page" → business website/social media) | Integrity Framework §9 |
| 5 | Tier-based content upload (what each tier can upload: videos, photos, story content) | Integrity Framework §9 |
| 6 | Business story prompt at listing: "Tell your community why you do this" (video or text) | Integrity Framework §9 |
| 7 | "Put your people on" endorsement flow (prominent on all business profiles) | Integrity Framework §9 |
| 8 | Community endorsement count display ("1,001 people endorsed this") | Integrity Framework §9 |
| 9 | Dual designation system: a business CAN be a cultural landmark (both badges shown) | City Data Instructions |
| 10 | Description tab: shows research description until owner claims OR community adds insight | City Data Instructions |
| 11 | URLs on business cards (where users can learn more — from cultural guide data) | City Data Instructions |

---

## Build 106 — Community Entrepreneur Experience (Target: Sept 1-7)

**Purpose:** Implement the full Community Entrepreneur tier as specified in the framework.

| # | Item | Source Document |
|---|---|---|
| 1 | Community Entrepreneur listing type (always free, no advertising, organic only) | Integrity Framework §9 |
| 2 | Marketplace section (distinct from community feed — commerce ≠ conversation) | Integrity Framework §9 |
| 3 | Search display: Verified Businesses first, Community Entrepreneurs below, clearly separated | Integrity Framework §9 |
| 4 | CE capabilities: profile card, reviews, community endorsements, social media links | Integrity Framework §9 |
| 5 | CE restrictions: no advertising, no promoted listings, no multiple locations, no employees | Integrity Framework §9 |
| 6 | Upgrade journey: Kinfolk celebrates growth (never warns), upgrade is optional | Integrity Framework §9 |
| 7 | Upgrade prompt: "Your community has supported you through 100 sales!" (celebratory, not a gate) | Integrity Framework §9 |
| 8 | All history carries forward on upgrade (reviews, endorsements, sales preserved) | Integrity Framework §9 |
| 9 | Abuse guardrails: Kinfolk prompts upgrade if operating like a full business; admin review if refused | Integrity Framework §9 |
| 10 | Talent Pipeline connection: Kinfolk monitors marketplace activity for talent matches | Integrity Framework §9 |
| 11 | Story prompt at CE onboarding: "Tell your community why you do this" | Integrity Framework §9 |
| 12 | Dual profiles: simultaneous business + community member profiles, linked | Integrity Framework §9 |

---

## Build 107 — Safety & Trust System (Target: Sept 8-15)

**Purpose:** Implement the two-type safety reporting and dual trust scores.

| # | Item | Source Document |
|---|---|---|
| 1 | Type A safety report (visitor: 7-day delay, 2 reports/60 days) | Integrity Framework §4 |
| 2 | Type B safety report (employee: 30-60 day delay, 3 reports/90 days, cryptographic reporter protection) | Integrity Framework §4 |
| 3 | Employer Trust Score (separate from Visitor Safety Score) | Integrity Framework §5 |
| 4 | Dual trust score display (businesses show both scores where applicable) | Integrity Framework §5 |
| 5 | Report flow UI (clearly distinguishes "I visited" vs "I worked here") | Integrity Framework §4 |
| 6 | Reporter protection: encrypted reporter identity, admin-only access | Integrity Framework §4 |
| 7 | Retaliation prevention: if reporter is also an employee, extra protections apply | Integrity Framework §4 |

---

## Build 108 — Partnership Pipeline & Allied Businesses (Target: Sept 16-22)

**Purpose:** Implement the 5-stage partnership pipeline and allied business tier.

| # | Item | Source Document |
|---|---|---|
| 1 | Allied Business tier (distinct from Verified — community-aligned, not community-owned) | Integrity Framework §3 |
| 2 | Community Verified badge (earned through community engagement, separate from ownership badge) | Integrity Framework §3 |
| 3 | 5-stage partnership pipeline (Discovery → Monitoring → Outreach → Negotiation → Active) | Integrity Framework §6 |
| 4 | Partnership tracking dashboard (admin: click-through counts, Stage 3 threshold at 500+ clicks) | Integrity Framework §6 |
| 5 | Automated partnership outreach trigger (when threshold is met) | Integrity Framework §6 |
| 6 | Partnership terms display (what the allied business committed to) | Integrity Framework §6 |

---

## Build 109 — Direct Commerce Layer (Target: Oct 1-15)

**Purpose:** In-app booking, tickets, and transactions for verified businesses.

| # | Item | Source Document |
|---|---|---|
| 1 | Service booking (in-app, verified businesses only) | Integrity Framework §9 |
| 2 | Experience/excursion booking (with safety integration — itinerary sharing, check-in prompts) | Integrity Framework §9 |
| 3 | Event ticket sales (promoters sell directly through MWM) | Integrity Framework §9 |
| 4 | Reservation system | Integrity Framework §9 |
| 5 | "My Bookings" section (tied to community member profile) | Integrity Framework §9 |
| 6 | Kinfolk reminders ("Your excursion is in 3 days — here are safety tips") | Integrity Framework §9 |
| 7 | Rebooking flow ("You loved this barber last month — book again?") | Integrity Framework §9 |
| 8 | Transaction fee (small, comparable to Eventbrite/Square) | Integrity Framework §9 |
| 9 | Revenue reporting for businesses | Integrity Framework §9 |
| 10 | Safety integration per commerce type (Circle alerts, itinerary sharing) | Integrity Framework §9 |

---

## Build 110 — Subscriptions & Monetization (Target: Oct 15-30)

**Purpose:** Re-introduce IAP/subscriptions (properly this time) with StoreKit 2, sandbox-tested.

| # | Item | Source Document |
|---|---|---|
| 1 | StoreKit 2 implementation (proper, sandbox-tested) | Apple rejection fix learnings |
| 2 | Subscription tiers (Explorer, Navigator, etc.) | Original membership design |
| 3 | Paid Apps Agreement verified | Apple requirements |
| 4 | IAP products created and submitted in App Store Connect with screenshots | Apple requirements |
| 5 | Sandbox testing verified before submission | Apple requirements |
| 6 | Paywall UI (clean, non-aggressive, clearly shows free vs. paid features) | Original membership design |
| 7 | Business tier upgrades (Community Entrepreneur → Verified, free → paid features) | Integrity Framework §9 |
| 8 | Direct Commerce transaction fees active | Integrity Framework §9 |

---

## Build 111+ — Give-Back & Advanced Features (Target: Nov+)

**Purpose:** Scholarship infrastructure, micro-grants, mentorship matching, international expansion.

| # | Item | Source Document |
|---|---|---|
| 1 | Give-back infrastructure (scholarships, micro-grants, LLC assistance) | Integrity Framework §9 |
| 2 | Mentorship matching system | Integrity Framework §9 |
| 3 | Diaspora international business contribution flow | Integrity Framework §8 |
| 4 | Pay It Forward Moment (end-of-chapter prompts) | Life Chapters Model |
| 5 | Cultural Journey tracking (opt-in Spotify Wrapped style) | Kinfolk Constitution |
| 6 | Advanced Kinfolk AI matching (talent pipeline, bidirectional prompts) | Integrity Framework §9 |

---

## Foundation Complete Criteria

The app has a "solid foundation of tweaking, not building" when ALL of the following are true:

- [ ] All tour cities launched with real business data
- [ ] Community Entrepreneur tier fully functional
- [ ] Business profile 4-layer card working
- [ ] Safety reporting (Type A + B) operational
- [ ] Onboarding flywheel spinning (data flows from user → Kinfolk → business intelligence → more businesses)
- [ ] Direct Commerce processing real transactions
- [ ] Subscriptions live and generating revenue
- [ ] Give-back infrastructure distributing resources
- [ ] Cultural Ambassador content flowing
- [ ] Kinfolk talent pipeline making matches

**Estimated foundation complete date: November 2026**

---

## Document Registry

*All documents must be stored in `docs/product/` and never deleted.*

| Document | Contains |
|---|---|
| `MWM_Integrity_Partnership_Framework.md` | Master framework — all business rules, tiers, safety, partnerships, commerce |
| `MWM_Replit_Onboarding_Flywheel_Instructions.md` | Onboarding flow, one-way mirror rule, Kinfolk boundaries |
| `MWM_Replit_City_Data_Instructions.md` | Pin system, dual designations, phased seeding, JSON format |
| `MWM_Replit_Real_vs_Demo_Data_Instructions.md` | Listing statuses, real vs demo distinction |
| `MWM_Replit_Name_Disambiguation_Instructions.md` | Duplicate detection, uniqueness rules |
| `MWM_Replit_City_Story_Instructions.md` | Living Legacy page, City Story display |
| `MWM_Replit_City_Boundary_Location_Instructions.md` | Radius-based map, home city personalization |
| `MWM_Replit_Tester_Demo_Business_Instructions.md` | Demo business system, tester experience |
| `MWM_Replit_Build_103_Complete_Instructions.md` | Build 103 full implementation spec |
| `MWM_Replit_Apple_Rejection_Fix.md` | Build 102 spec (complete) |
| `MWM_Replit_Onboarding_Bug_Fix_Authorization.md` | Bug 1 + Bug 2 fix details |
| `MWM_Tour_Cultural_Guide_Part1.md` | Cultural data: Philly, DC, Richmond, Raleigh/Durham, Charlotte |
| `MWM_Tour_Cultural_Guide_Part2.md` | Cultural data: Columbia through Houston + 4 satellites |
| `MWM_Tour_Cultural_Guide_Part3_Expansion.md` | Cultural data: 36 expansion cities |
| `MWM_Cultural_Phrases_By_City.md` | Regional slang, AAVE, cultural phrases for all cities |
| `MWM_Community_Entrepreneur_Comprehension_Test.md` | 7-question test (Replit passed 7/7) |
| `MWM_Post_Apple_Build_Plan.md` | Original post-approval plan (superseded by this roadmap) |
| `MWM_Replit_Language_Audit_Fix.md` | 323-instance inclusive language regression — all fix locations, exceptions, regression prevention |

---

## Change Log

| Date | Change | Authorized By |
|---|---|---|
| Aug 5, 2026 | Document created — Builds 102-111+ defined | Founder |
| Aug 5, 2026 | Build 103 item 11 added: inclusive language audit (323 instances) | Founder |
