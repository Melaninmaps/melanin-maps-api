# Mapping With Melanin™ — Complete Build-by-Build Phase Inventory
**Version:** 1.0  
**Date:** July 28, 2026  
**Status:** READ-ONLY — No implementation authorized by this document  
**Authorization phrase:** "Please implement." — applies per build, not to the whole document  
**Sources:** BUILD_97_SCOPE_AND_ROADMAP.md · FOUNDATION_BUILD_STRATEGY.md · FUTURE_STATE_REGISTER.md · MWM-Implementation-Waves-v0.1.md · MWM-Launch-Readiness-Dashboard-v0.2.md · launch-backlog.md · android-vc67-build-content.md · post-build95-roadmap.md · all memory files · July 28, 2026 founder session (Kinfolk Cultural Intelligence Model, Kinfolk Constitution decisions, Lifelong Companion Vision, Life Chapters Model, Community Intelligence Model)

---

## SECTION 1 — CURRENT RELEASE BASELINE

### Build Numbers
| Platform | Build identifier | Submitted | Status |
|---|---|---|---|
| iOS | buildNumber 97, version 1.1.5 | July 27, 2026 | Apple review in progress |
| Android | versionCode 71, version 1.1.5 | July 27, 2026 | EAS build pending confirmation |
| Backend | Railway production | Continuous deployment | Live |
| Web | Vercel / Railway static | Continuous deployment | Live |

### Features Currently Visible to Users

**Authentication**
- Email registration and login
- Phone SMS OTP registration and login
- Apple Sign-In (iOS) — nonce-compliant per TN3194, with authorization code storage and revocation
- Password reset (6-digit code flow)
- Session restore (cold launch with valid token)
- Profile setup (4-step onboarding: isBusinessOwner, isContentCreator, isCommunityOrganizer, profileSetupComplete)

**Business Discovery**
- Business search (name, category, city)
- Map tab with business markers (lat/lng on all businesses)
- Category filter chips (horizontal scroll)
- Business detail screen (hero image, hours, vibes, reviews, check-in, save)
- Business check-in with points toast
- Save/unsave business
- Reviews with ownership tier weighting
- Owner response on reviews
- Intro video on business profile
- Compliment chips (topCaptions — max 2)
- Business preview for owners
- Flash deals
- Business stories

**Map and Heritage**
- FullMapView.tsx — no platform extension
- Cultural/heritage sites ON by default
- 11 category-specific pins
- "View Details" deep-link to cultural-heritage screen
- Heritage library (horizontal scroll of 16 live site cards)
- HBCU sites on map (partially restored after Build 95 debugging)
- Freedom Trail category
- Directions deep-link to native maps

**KinfolkAI**
- 36-city CITY_VOICES registry (hardcoded in kinfolk.ts)
- CITY_LOCAL_TERMS (36 cities, hardcoded)
- 12-city travel voice (travel.ts)
- 12-city navigation voice (maps.ts)
- Multi-turn chat with session continuity (kinfolk_sessions table)
- Lifestyle onboarding (5-step, including lifestyleServices jsonb col)
- AAVE Level 0–3 (aave_level smallint in user_preferences, default 0)
- buildSystemPrompt() with tier param (free/navigator/trailblazer depth rules)
- KinfolkAI voice (TTS "Listen" button, voice_usage table, tier character limits)
- Life Journey injection in system prompt
- Business AI plan cache (businessAiPlanCacheTable)
- Weather context injection (Open-Meteo — free API)

**Community and Social**
- Community feed (posts, likes, comments, reposts)
- Post visibility: public / followers / connections
- Post audience rating (everyone/teen/young_adult/adult)
- Hashtags (hashtags table, user_hashtag_follows, trending strip)
- Location tagging on posts (venue/city/lat/lng)
- Link previews on posts (linkUrl/Title/Desc/Domain/Favicon)
- Safe Spaces feature (entry in Resources)
- Community Health Profile (5 dimensions)
- Community Guidance ratings on posts and events

**Safety**
- Safety hub (dashboard with live check-in/share/meetup status)
- Safety check-ins (safety_checkins table, overdue email alert)
- Location sharing (location_shares table, live update, expiry)
- Meetup verification (meetup_verifications table)
- Officer Watch
- Safety survey geo-alert (amber banner in MapTabView if avg score <45)
- Activity alerts (useActivityAlerts hook)
- Safety proximity (useSafetyProximity hook)
- Discrimination and safety reports (contentReportsTable, admin moderation queue)

**Membership and Billing**
- Tiered membership: free (individual), navigator, trailblazer, community_builder, founding, beta, legacy_member
- Family plan (family_ai_usage + family_add_on_seats tables)
- Stripe checkout session (POST /api/billing/checkout)
- Stripe webhooks (trial start, trial ending, cancellation)
- RevenueCat iOS subscription sync (client-initiated — P0 security gap — see known defects)
- Billing history page (web, /billing)
- UpgradeModal (mobile — blocks features by tier)
- MembershipGate (web)
- Trial email sequence (3-day / 1-day / expiry / win-back)

**Community Resources**
- Opportunity Center (jobs table with GPS/remote/pay, saved_jobs, mentorship_profiles)
- Marketplace (community_listings table, /api/marketplace/*)
- Wellness tracker (wellness_checkins + wellness_goals, streak server-side)
- Financial hub (financial_goals + financial_checkins, 10 curated resources)
- Mental health resources (crisis lines, Black mental health orgs, AA/NA)
- Groups + group travel planning (groupInvites, groupItineraries)
- Kinfolk Circles (6 DB tables, mobile create/view screens — deferred from main nav)

**Life Journeys**
- life_journeys + entity_connections DB tables
- /api/journeys/* routes
- KinfolkAI injection in buildSystemPrompt
- app/life-journey.tsx screen

**Library**
- Topic Library System (70+ seeded topics, user_delivery_preferences, topic_issues)
- 3-tab Library UI (Library / Browse / Issues)
- Admin Topics Library console

**Events**
- Event discovery
- RSVP

**Business Owner**
- Business dashboard (web, /business-dashboard)
- Business growth tools (business_promotions table, 5 placement types, dynamic Stripe checkout)
- Owner verification (self-built photo upload + admin review; DocuSign for ownership docs)
- Skip insights (community skip feedback surfaced in business dashboard)
- Community Reference feature (is_reference_only on businesses, teal badge)

**Admin**
- Full admin panel (web) — users, members, reviews, reports, waitlist analytics
- Content moderation queue (content reports)
- Decision Ledger (partially — Wave 3-E implemented per Launch Dashboard v0.2 but awaiting founder verification)

**Profile and Identity**
- Trust Level system (Trust Level 1–4, getTrustProgress())
- community-verified.tsx (8 states — built, NO navigation entry point)
- isBusinessOwner / isContentCreator / isCommunityOrganizer / profileSetupComplete flags
- Social feed: following/followers, visitor profile (app/user/[id].tsx)
- StatusComposer + SavedSpotsShare on profile
- CommunityImpactCard on profile
- Apple Sign-In revocation (users.appleRefreshToken, revokeAppleToken on delete)

**Legal and Compliance**
- Privacy policy, terms of service, support pages (web, live)
- Account deletion with error handling and Apple revocation

### Features Partially Implemented

| Feature | What exists | What is missing |
|---|---|---|
| Community Member persistent identity | Trust Level 1 data + one-time profile-setup display | Persistent "Community Member" label on profile screen post-onboarding |
| Verified Community Member | Full backend (routes, admin queue, mobile screen) | Navigation entry point (intentionally hidden), third-party vendor, consent framework |
| KinfolkAI Family Mode integration | family_settings table (familyModeEnabled) | Not wired into buildSystemPrompt() or any KinfolkAI gate |
| voiceMode persistence | Passed per-request, defaults to "community" | No column in user_preferences — not persisted |
| Community Voice / Cultural Language / Profanity separation | aave_level 0–3 (all bundled) | Three separate settings (Professional/Friendly/Local/Home + Standard/Community-Informed/Community Native + None/Mild/Explicit) |
| "Things You'll Hear" / "Things Locals Appreciate" | Not present in any registry | New teaching formats defined today — not in CITY_LOCAL_TERMS |
| Living Community Language Layer (Layer Two) | archive_contributions schema (0 rows, no routes, no admin UI) | Full Layer Two pipeline: contributor metadata, review status, layer designation, expiration |
| HBCU map horizontal strip | Removed during Build 95 debugging (commit 05e63933) | Compact horizontal strip above bottom card area — restore from library.tsx pattern |
| Cultural Ambassador system | Trust Level 4 (admin grant only), FSR-003 PARTIALLY BUILT | Ambassador portal, 7-engine model, Community Impact Report, Communities Served metric |
| 5-question personalization onboarding | Build 97 spec written, columns exist on user_preferences | Build 97 implementation authorized but not yet delivered to Store |
| Business KinfolkAI | Chat with basic business context injected | 6-engine structure (Phase 6): Identity, Community Intelligence, Growth Coach, Opportunity, Partnership, Celebration |
| Community Organization role | isContentCreator / isCommunityOrganizer flags | Dedicated org profile, resource listing, events, volunteer coordination |
| City-as-container (community layers) | Single-voice per city in CITY_VOICES | Multiple community layers per city, stackable selection, interest filters |

### Features Hidden or Feature-Flagged

| Feature | Location | Reason hidden |
|---|---|---|
| community-verified.tsx | artifacts/mobile/app/community-verified.tsx | No nav entry point — awaiting Phase 5 vendor evaluation |
| map-diagnostic.tsx | artifacts/mobile/app/map-diagnostic.tsx | Dev/QA tool — not linked from production navigation |
| Kinfolk Circles | Built (6 tables, screens) | No main navigation entry point — deferred to Phase 7 |

### Features Represented Only by Schema or Documentation

| Feature | Schema/doc evidence | Status |
|---|---|---|
| Cultural Journey / Explore Cultures | Defined today in session | Future-state only |
| My Story / Life Chapters / My Passport | Defined today in session | Future-state only |
| Curiosity Lists | Defined today in session | Future-state only |
| Pay It Forward Moment | Defined today in session | Future-state only |
| "If this is your first time..." | Defined today in session | Future-state only |
| Journey Ambassadors | Defined today in session | Future-state only |
| Opportunity AI / Community Pulse for creators | Defined today in session | Future-state only |
| KinfolkAI code-switching | Defined today in session | Future-state only |
| Community Intelligence ecosystem (user-facing) | Defined today in session | Future-state only |
| archive_contributions | DB schema exists, 0 rows, no routes | Schema only |
| cultural_journey (user exploration history) | Not in DB schema at all | Future-state only |
| Invisible Architecture (34 specs) | Specs complete, documented | None implemented — trade secret specs only |
| FSR-001 Living Legacy Stories submission | Route stub / schema partial | Partially built per FSR |
| FSR-002 Heritage Support Links | Partial | Partially built per FSR |
| FSR-003 Cultural Ambassador Program | Admin grant + Trust Level 4 | Partially built per FSR |
| FSR-004 through FSR-055 | See FUTURE_STATE_REGISTER.md | PROPOSED or NEEDS FOUNDER CLARIFICATION |

### Known Open Defects and Incomplete Experiences

| Defect | Severity | Location |
|---|---|---|
| absoluteFillObject removed in RN 0.86 — resolves to undefined at runtime | High | BusinessMapView.tsx (×2), BusinessPreviewModal.tsx, ReportContentModal.tsx, ShareModal.tsx, SkipFeedbackModal.tsx, VideoDetailModal.tsx, WriteReviewModal.tsx, FeaturedVideoCard.tsx, AIChatWidget.tsx, business/[id].tsx, spaces.tsx, travel-videos.tsx, wishlist.tsx |
| RevenueCat /revenuecat/sync trusts client-supplied productIdentifier — P0 security | P0 | revenuecat.ts |
| CRON_SECRET fails open (implemented per Wave 3-A but awaiting founder verification) | P0 | routes/cron.ts |
| CAN-SPAM — unsubscribe link absent from emails (Wave 3-B implemented, awaiting verification) | P0 legal | email.ts |
| Stripe webhook not idempotent — retry = double process (Wave 3-C implemented, awaiting verification) | P0 | webhookHandlers.ts |
| Safety alert confirmation not unique-per-user (Wave 2-A) | P0 | community-alerts.ts |
| KinfolkAI Compassion Protocol absent (Wave 2-C) | P0 safety | kinfolk.ts buildSystemPrompt() |
| Family Mode (familyModeEnabled) not wired into KinfolkAI | High | kinfolk.ts — not reading family_settings |
| "Minority" used where "Black" / specific community is historically accurate (36-city registry) | Medium | kinfolk.ts CITY_VOICES |
| Tuskegee: "syphilis study" — correct: "U.S. Public Health Service Untreated Syphilis Study at Tuskegee" | Medium | kinfolk.ts line 176 |
| "Minority Masking Indians" — correct: "Mardi Gras Indians" / "Black Masking Indians" | Medium (community review required) | travel.ts line 67 |
| Quiet hours not enforced on push or email (Wave 2-B) | P0 | pushNotifications.ts, email.ts |
| voiceMode passed per-request, never persisted | Medium | kinfolk.ts, user_preferences schema |
| Account lockout after failed attempts absent (Wave 1-A — implemented, awaiting verification) | P1 | auth.ts |
| Blocking not enforced in community feed, DMs, circles, events (Wave 1-C) | P1 | community.ts, conversations.ts, circles.ts, events.ts |
| Decision Ledger + admin MFA (Wave 3-E — ⬜ Ready, not yet implemented) | P1 governance | Multiple admin routes |
| Pre-existing TypeScript errors (15+ — do not block EAS build but need cleanup) | Low | See android-vc67-build-content.md Section D |
| Google Maps API key restriction on Android (Cloud Console fix required before VC71 is usable) | P0 Android | Google Cloud Console — founder action |
| iOS buildNumber 97 / Android VC71 in Apple review — no OTA updates permitted until approved | Process constraint | — |

---

## SECTION 2 — BUILD-BY-BUILD BREAKDOWN

---

### BUILD 97 — Foundation Build
**TRUST PHASE:** Phase 1 — Can people trust the app?  
**BUILD NAME:** Foundation Build  
**PRIMARY PURPOSE:** Prove the platform is stable enough to become everything else. Every registered member has a clear identity (Community Member), the map works, authentication has no unexplained crashes, and platform language is accurate.  
**FOUNDER OUTCOME:** A member can install the app, register, complete personalization, see themselves as a Community Member, use the map and KinfolkAI, and experience zero confusing crashes or identity labels.

**USER-VISIBLE FEATURES:**
- "Join as a Community Member" persistent entry in registration/onboarding flow
- Post-signup confirmation: "You are now a Community Member of Mapping With Melanin™."
- "Community Member" label displayed persistently on profile screen
- Guest vs. Community Member distinction (what changes after joining)
- 5-question personalization onboarding (all skippable, answers stored in user_preferences)
- Free-tier benefits and limits clearly stated
- Map and heritage sites — regression verified on iOS and Android production binaries
- All authentication paths regression tested against Railway production

**BUSINESS FEATURES:** No new business features in Build 97. Existing business features verified stable.

**CULTURAL AMBASSADOR FEATURES:** None in Build 97. Verification UI hidden (Option B) — no nav entry point.

**KINFOLKAI FEATURES:**
- KinfolkAI canonical naming cleanup ("KinfolkAI" — eliminate "Kinfolk AI" variants in UI copy)
- 36-city registry unchanged (corrections deferred pending founder community review)

**COMMUNITY FEATURES:** Community feed, safety, resources — regression verified. No new community features.

**MAP / HERITAGE FEATURES:**
- Business-category tabs: complete
- Heritage-category tabs: verify and connect
- List/marker synchronization: fix known issue
- Safe-area clearance (bottom nav, notch): fix known issue
- Correct filter vs. total counts: fix bug
- All verified against production binaries

**LIBRARY / LEARNING FEATURES:** Existing library verified. No new library features.

**SAFETY FEATURES:** KinfolkAI Compassion Protocol in system prompt (Wave 2-C). Quiet hours enforcement (Wave 2-B). Safety alert unique confirmation (Wave 2-A).

**ADMIN / MODERATION FEATURES:** CRON_SECRET fail-closed (Wave 3-A). CAN-SPAM compliance (Wave 3-B). Stripe webhook idempotency (Wave 3-C). RevenueCat server-side verification (Wave 3-D). Decision Ledger + admin MFA (Wave 3-E — scheduled but may spill to Build 98).

**DATA / SCHEMA WORK:** No new tables. user_preferences columns for 5-question personalization (primaryIntent, discoveryInterests, ownershipPreferences, lifeContext, contributionIntent — jsonb arrays, already exist or confirm exist).

**PRIVACY / CONSENT REQUIREMENTS:**
- Personalization onboarding copy: "Your answers are private. We never sell this information."
- "Prefer not to say" on every identity question
- All personalization answers private (never shown on member profile)

**AGE / FAMILY SAFEGUARDS:** Family Mode not wired into KinfolkAI — known gap, deferred (founder decision required before implementation).

**DEPENDENCIES:** Apple Build 96 approval (currently awaiting). Android VC71 confirmation.

**EXPLICITLY NOT INCLUDED:**
- Verified Community Member activation (no vendor, no consent)
- Cultural Ambassador portal or program activation
- Community Organization role (flags exist, no dedicated flow)
- HBCU horizontal strip restoration (deferred to first post-launch update)
- "Minority" substitution corrections in registry (require founder community review)
- Tuskegee attribution correction (requires founder confirmation — approved in today's session but not yet in code)
- "Mardi Gras Indians" correction in travel.ts (requires New Orleans community review)
- Three-setting voice decoupling (Community Voice / Cultural Language / Profanity)
- City-as-container community layers
- Cultural Journey / Explore Cultures
- Life Chapters / My Story

**ACCEPTANCE TEST:**
1. Zero authentication crashes in 30-tester distributed binary
2. "Community Member" label visible on every registered member profile
3. Map loads correctly on iOS and Android production builds
4. Zero instances of "Black-owned" as universal default in member-facing copy
5. POST /api/auth/login-email → 200 in <2s on Railway production
6. Railway log audit: zero DB errors in 24 hours before submission
7. Fresh Apple Sign-In registration on production (new Apple ID) — no error
8. iPad layout verified
9. Review account created, verified, uploaded to ASC
10. All 11 submission release gates in SUBMISSION_RELEASE_GATE.md passed

**CURRENT STATUS:** iOS Build 97 submitted July 27, 2026. In Apple review. Android VC71 submitted July 27, 2026. Status pending confirmation. Wave implementations (1-A through 3-E) partially implemented and awaiting founder verification per Launch Readiness Dashboard v0.3.

---

### BUILD 98 — Identity Build
**TRUST PHASE:** Phase 2 — Can people trust their identity?  
**BUILD NAME:** Identity Build  
**PRIMARY PURPOSE:** A member can hold multiple roles (Community Member, Business Owner, Community Organization representative) on one account. Each role adds capabilities without removing others. Profile displays roles gracefully.  
**FOUNDER OUTCOME:** A business owner who is also a community member has one account that serves both identities. No duplicate account workaround needed.

**USER-VISIBLE FEATURES:**
- Business Owner role designation visible on profile
- Claim a business → links to member account
- Community Organization representative role (flags + dedicated flow)
- Role addition mechanism post-signup (settings path)
- Multi-role profile display (designed for clarity, not crowding)
- Verified Community Member navigation entry point (not activated — nav entry only)
- Trust Level badge display on profile (Community Member ○, Community Verified ✔)
- HBCU map horizontal strip restored (compact, above bottom card area — from library.tsx pattern, with enhanced cards: school colors, founding year, alumni stories, Explore Campus CTA, homecoming calendar placeholder)
- Contextual inclusive-language cleanup (PL-001: "Black-owned" only when verified or user-chosen; generic copy uses "minority-owned" / "community businesses")
- Full design pass (layout consistency, typography, spacing, empty states, loading states, icons — no emoji in production UI)

**BUSINESS FEATURES:**
- Business Owner role designation on profile
- Business claim flow (link existing listing to account)
- Business profile completeness indicator
- Ownership designations expansion (multiple minority categories beyond "Black-owned")

**CULTURAL AMBASSADOR FEATURES:** None new in Build 98. Cultural Ambassador application/invitation model defined (AUDIT-009 scope) but not yet activated.

**KINFOLKAI FEATURES:**
- **Tuskegee attribution correction:** "U.S. Public Health Service Untreated Syphilis Study at Tuskegee" (founder approved today — implement in Build 98)
- **"Minority" substitution corrections:** Each flagged instance in CITY_VOICES corrected to historically accurate language (Black/African American where appropriate) — requires founder review of each instance before implementation
- Community Member role awareness in KinfolkAI opening context ("I see you're a Business Owner — would you like business-focused guidance or community exploration today?")
- Role-aware KinfolkAI entry experience (FSR-045)

**COMMUNITY FEATURES:**
- Community Organization representative role and basic profile
- Organization resource listing (initial version)

**MAP / HERITAGE FEATURES:**
- HBCU horizontal strip restored and enhanced (compact, school colors, alumni stories, Explore Campus CTA)
- Heritage map improvements from Build 97 verified stable

**LIBRARY / LEARNING FEATURES:** Library stable from Build 97. No new features.

**SAFETY FEATURES:** Build 97 safety features verified stable. Blocking enforcement across all surfaces (Wave 1-C) — if not completed in Build 97, included here.

**ADMIN / MODERATION FEATURES:**
- Decision Ledger + admin MFA (Wave 3-E — if spilled from Build 97)
- Role management in admin panel

**DATA / SCHEMA WORK:**
- trust.ts PAID_TIERS updated: memberType ≠ "individual" (replaces named allowlist) — prepares for Phase 5
- Community Organization profile DB fields (if not already covered by flags)

**PRIVACY / CONSENT REQUIREMENTS:**
- Multi-role accounts: personal verification ≠ business verification (permanently separated)
- Community Organization: policy definition for eligible org types

**AGE / FAMILY SAFEGUARDS:** No new age/family features in Build 98.

**DEPENDENCIES:** Build 97 Apple approval. Android VC71 stability confirmed.

**EXPLICITLY NOT INCLUDED:**
- Verified Community Member activation (Phase 5)
- Cultural Ambassador portal
- Business KinfolkAI 6-engine structure (Phase 6)
- Three-setting voice decoupling (Phase 4)
- City-as-container community layers (Phase 6+)
- Cultural Journey feature (Phase 6+)

**ACCEPTANCE TEST:**
1. A single account can hold Community Member + Business Owner roles simultaneously
2. Profile displays both roles without crowding or confusion
3. Business claim flow links listing to member account correctly
4. HBCU horizontal strip visible on map tab when Heritage layer is on
5. Zero instances of "Minority" where "Black" or specific community is historically accurate
6. Trust Level badge visible on profile

**CURRENT STATUS:** Designed but not implemented. Depends on Build 97 Apple approval.

---

### BUILD 99/100 — Contribution Build
**TRUST PHASE:** Phase 3 — Can people trust each other?  
**BUILD NAME:** Contribution Build  
**PRIMARY PURPOSE:** Community Members can meaningfully contribute to the platform — reviews, safety reports, heritage nominations, mentorship — and see their trust level progress.  
**FOUNDER OUTCOME:** A member who contributes sees their standing grow. A mentor finds a mentee. An elder contributes a heritage story that outlasts the moment.

**USER-VISIBLE FEATURES:**
- Trust Level progress visible on profile (helpful reviews, contribution points, policy standing)
- Structured mentorship — connect mentors and mentees
- HBCU alumni connections
- Living Legacy nomination flow (FSR-001: heritage story submission pipeline)
- Saved heritage places (FSR-010)
- Event RSVP with community impact tracking
- Heritage support links (FSR-002)
- Verified source citations display (FSR-013)

**BUSINESS FEATURES:**
- Business community teaching moments (contextual cultural nudges at point of visit — owner opt-in)
- Business Learn More (from business detail → cultural context)
- Beta Test Listings clearly identified as such, with separate review/rating treatment

**CULTURAL AMBASSADOR FEATURES:**
- Cultural Ambassador application or invitation model activated (AUDIT-009 decisions required first)
- Ambassador qualification criteria defined and enforced
- Ambassador basic profile page

**KINFOLKAI FEATURES:**
- **"Things You'll Hear"** section added to CITY_LOCAL_TERMS for all 36 cities
- **"Things Locals Appreciate"** section added to CITY_LOCAL_TERMS for all 36 cities
- Gentle curiosity-based nudges ("I noticed you've been exploring HBCU history — would you like to hear from an alum?")
- Crisis keyword detection improvements (Compassion Protocol deepened)
- Kinfolk notices contribution intent (Q5 from onboarding feeds relevant contribution prompts)

**COMMUNITY FEATURES:**
- Living Legacy story submission pipeline (FSR-001 complete)
- Heritage nomination flow
- Oral history submission (text and media)
- Community contribution recognition (visible on profile)
- Trust progression rewards (contribution → trust level advancement)

**MAP / HERITAGE FEATURES:**
- Saved heritage places (user can save a cultural site to profile)
- Heritage site images (FSR-014 — if review cycle allows)
- Place-linked videos (FSR-007) — initial version
- Heritage site official website links in map tile (FSR-012)
- Heritage site accessibility and admission display (FSR-011)
- Freedom Trail category verified

**LIBRARY / LEARNING FEATURES:**
- Saved learning (every article, museum, business, video, elder interview saveable to My Journey)
- "Continue where you left off" — library saves reading position
- Curiosity Lists ("Things I Want To Learn") — initial version

**SAFETY FEATURES:** Safety features from Build 97 stable. No new safety features.

**ADMIN / MODERATION FEATURES:**
- Heritage nomination moderation queue
- Living Legacy content review queue
- Oral history content moderation
- Cultural Ambassador application/invitation admin tools

**DATA / SCHEMA WORK:**
- Living Legacy submission table (if not already present via FSR-001 partial build)
- archive_contributions table populated with first Layer Two content
- cultural_journey table initial design (opt-in exploration history)
- Curiosity Lists table (user_curiosity_items or similar)
- saved_heritage_places table (FSR-010)

**PRIVACY / CONSENT REQUIREMENTS:**
- Living Legacy: creator owns content, licenses MWM to display, can remove
- Oral history: contributor consent form, location optional
- Heritage stories: may name people — sensitivity review required
- Cultural Journey (opt-in): "Your Cultural Journey is optional. You can enable or disable it at any time."
- Curiosity Lists: private by default

**AGE / FAMILY SAFEGUARDS:**
- Heritage stories may involve minors — minor protection policy required
- Family Mode caps AAVE level and blocks profanity — foundation for Phase 4 wiring

**DEPENDENCIES:** Build 98 complete. HBCU alumni data sourcing approach decided. Mentorship tier limits decided. Heritage nomination cultural review process defined. Cultural Ambassador qualification criteria decided.

**EXPLICITLY NOT INCLUDED:**
- Third-party identity verification (Phase 5)
- KinfolkAI memory management UI (Phase 4)
- Business KinfolkAI 6-engine structure (Phase 6)
- City-as-container community layers (Phase 6+)
- Cultural Journey full feature (Phase 6+) — only opt-in history tracking begins here
- Life Chapters / My Story (Phase 6+)
- "From the Community" videos (Phase 8)
- Pay It Forward Moment (Phase 8)
- Journey Ambassadors (Phase 8)

**ACCEPTANCE TEST:**
1. Trust Level progress visible and advances with contributions
2. Mentor/mentee matching flow completes end-to-end
3. Living Legacy story submitted by contributor → appears in moderation queue → admin approves → visible in heritage library
4. "Things You'll Hear" entries visible in KinfolkAI local guide mode for at least 10 cities
5. Saved heritage place appears on member profile
6. Curiosity List items persisted across sessions (opt-in)

**CURRENT STATUS:** Designed but not implemented. FSR-001, FSR-002, FSR-003 partially built. Depends on Build 98.

---

### BUILD 100/101 — KinfolkAI Trust, Memory, and Voice Build
**TRUST PHASE:** Phase 4 — Can people trust Kinfolk?  
**BUILD NAME:** Intelligence Build / KinfolkAI Trust Build  
**PRIMARY PURPOSE:** KinfolkAI explains why it made a recommendation, respects member data choices, and speaks authentically in a way members control — without profanity tied to cultural depth.  
**FOUNDER OUTCOME:** A member knows why Kinfolk suggested something. They can tell Kinfolk to forget something. They can choose how Kinfolk speaks to them — warmly, locally, or at home — without that choice forcing content they don't want.

**USER-VISIBLE FEATURES:**
- KinfolkAI recommendation explanation ("I suggested this because...")
- Member-controlled memory (view what Kinfolk remembers, edit/delete/clear/pause)
- Privacy mode (opt out of personalization without losing access)
- "What KinfolkAI Knows About Me" transparency panel (FSR-027)
- KinfolkAI session deletion (individual + full history wipe) (FSR-028)
- Source attribution in KinfolkAI responses (FSR-039)
- Community Reasons ("Why am I seeing this?")
- Recommendation source attribution

**KINFOLKAI FEATURES — THREE-SETTING VOICE DECOUPLING (FOUNDER APPROVED TODAY):**
- **Community Voice** setting replaces "AAVE Mode":
  - Professional (polished, business, interviews, formal planning)
  - Friendly (approachable, encouraging, conversational)
  - Local (sounds like someone who knows the city well)
  - Home (sounds like someone who grew up there — warmth and cultural depth, NOT more slang)
- **Cultural Language** setting (separate from voice):
  - Standard (Standard English)
  - Community-Informed (draws on community language and references)
  - Community Native (reflects how people commonly speak in this community — no implication of only one authentic way)
- **Profanity** setting (separate, pure personal preference — NEVER tied to membership tier):
  - None (default)
  - Mild (curated list: damn, hell, crap — maintained by moderation team, NOT AI-guessed)
  - Explicit (opt-in, unfiltered)
- **Family Mode override:** Family Mode automatically caps to Professional + Standard + None regardless of user settings — non-negotiable
- **Code-switching** setting (onboarding or settings):
  - Always (Kinfolk shifts register based on conversational context)
  - Ask me (Kinfolk asks before shifting)
  - Never (Kinfolk holds the user's set Community Voice throughout)
- **Database change:** aave_level smallint → three separate columns (communityVoice, culturalLanguage, profanityLevel) or compound value in user_preferences
- **buildSystemPrompt() rewrite** to accept three independent parameters plus code-switching flag
- voiceMode persisted to user_preferences (new column)
- **Kinfolk opening line** — context-aware:
  - First visit to a city: "Welcome home. Let me introduce you to my city."
  - Second visit: "Glad you're back."
  - Third+: "Ready to see something new?"

**KINFOLKAI FEATURES — INTELLIGENCE:**
- Tier-appropriate response depth (Community Member vs. Navigator vs. Trailblazer) fully implemented
- Context-aware register shift (interview → polished; casual → relaxed; grant → formal)
- Crisis intervention block — dedicated crisis response pathway (FSR-029)
- KinfolkAI query count display for free tier (FSR-040)
- AI-generated content labeling (isAiGenerated metadata on responses)
- Guest-to-member conversion prompt in KinfolkAI chat (FSR-038)
- Conversation-to-plan conversion (save full thread as named plan) (FSR-051)
- Prompt versioning and governance system (FSR-052)
- Family Mode fully wired into KinfolkAI (non-negotiable — long overdue):
  - Profanity always off
  - Sensitive history depth: age-appropriate summaries (NOT removal)
  - No nightlife suggestions
  - No adult events
  - Language level caps to Community-Informed maximum

**COMMUNITY FEATURES:**
- Community Understanding architecture surfaced (not just raw community data)
- Living Community Feed (COMMUNITY_UNDERSTANDING_AND_LIVING_FEED.md — 4 layers: initial implementation)

**MAP / HERITAGE FEATURES:** No new map features in this build.

**LIBRARY / LEARNING FEATURES:**
- Library → "Discover" evolution: stores discovery, not just information
- "Continue where you left off" improvements (memory across sessions)
- opt-in Cultural Journey exploration history tracking

**SAFETY FEATURES:**
- KinfolkAI crisis intervention block fully operational
- Safety data → KinfolkAI context injection (FSR-033)

**ADMIN / MODERATION FEATURES:**
- Prompt governance admin console (FSR-037)
- KinfolkAI memory admin visibility (what each member has allowed)

**DATA / SCHEMA WORK:**
- user_preferences: communityVoice, culturalLanguage, profanityLevel, voiceMode, codeSwitchingPreference columns (replaces aave_level or compound mapping)
- kinfolk_memory table (separate from kinfolk_sessions — explicit memory items the user has saved/shared)
- prompt_versions table (for prompt governance)
- AI content label metadata in kinfolk response payload

**PRIVACY / CONSENT REQUIREMENTS:**
- Memory: explicit consent before any memory persists beyond session
- Transparency: "KinfolkAI never uses private chats to change shared city voice registries"
- Deletion: member can delete individual memories or all history at any time
- Data retention policy for chat history (founder decision required)

**AGE / FAMILY SAFEGUARDS:**
- Family Mode KinfolkAI override: fully implemented and tested
- Minimum platform age enforcement in client (if founder decision establishes one)
- Age-appropriate AAVE/cultural language level cap for teen accounts (founder decision required)

**DEPENDENCIES:** Build 99 complete. Chat history retention period decided. Maximum memory depth by tier decided. Code-switching behavior decided. Age/AAVE level interaction for teen accounts decided.

**EXPLICITLY NOT INCLUDED:**
- Third-party verification (Phase 5)
- Business KinfolkAI 6-engine structure (Phase 6)
- Cultural Journey feature full launch (Phase 6+)
- Life Chapters / My Story (Phase 6+)
- KinfolkAI as Opportunity AI for creators (Phase 8)
- City-as-container community layers (Phase 6+)

**ACCEPTANCE TEST:**
1. Member can choose Community Voice "Local" + Cultural Language "Community Native" + Profanity "None" — these three settings are independent
2. Family Mode overrides all three settings to Professional + Standard + None regardless of user preference
3. voiceMode persisted to user_preferences — survives app restart
4. Member can view and delete KinfolkAI memory items
5. Crisis keyword → Compassion Protocol response (not deflection)
6. KinfolkAI explains every recommendation with a reason
7. Code-switching setting takes effect in next conversation

**CURRENT STATUS:** aave_level column exists (single bundled setting). Three-setting decoupling: designed but not implemented. Family Mode not wired into KinfolkAI. voiceMode not persisted. PLACEMENT REQUIRES FOUNDER APPROVAL on exact build number.

---

### BUILD 102 — Third-Party Verified Community Member
**TRUST PHASE:** Phase 5 — Verification capability milestone (not a trust-phase — may ship during Build 101 or 102 depending on vendor evaluation timeline)  
**BUILD NAME:** Verification Build  
**PRIMARY PURPOSE:** Eligible paid members can complete optional identity verification through a provider-hosted flow. Platform stores only a reference ID and status.  
**FOUNDER OUTCOME:** A paid member who chooses to verify sees a "Community Verified ✔" badge on their profile. The platform never stores their selfie or ID image.

**USER-VISIBLE FEATURES:**
- Verified Community Member navigation entry point activated (first time accessible from profile/settings)
- Provider-hosted consent screen → liveness + optional government ID capture
- Status states: pending / approved / rejected / expired
- "Community Verified ✔" badge on profile and reviews
- Member notification on outcome (push or email)
- Member deletion right (triggers provider deletion request + platform record redaction)

**BUSINESS FEATURES:** Verified badge appears on business reviews from Verified members.

**CULTURAL AMBASSADOR FEATURES:** May require Verified status for Ambassador eligibility (founder decision required).

**KINFOLKAI FEATURES:** Trust Level 2 (Verified) unlocks deeper KinfolkAI personalization context.

**COMMUNITY FEATURES:** Community Verified badge visible on community posts from Verified members.

**DATA / SCHEMA WORK:**
- identity_verifications table extension: providerReference, providerStatus, method, consentAt, deletedAt
- trust.ts PAID_TIERS → memberType ≠ "individual" (any non-free tier qualifies)
- Cost logging table (no sensitive data)

**PRIVACY / CONSENT REQUIREMENTS:**
- Biometric data: provider-hosted only — platform never receives or stores raw images
- BIPA / CUBI state law compliance review (Illinois, Texas minimum)
- International data residency confirmation
- Explicit consent screen before handoff to provider
- Deletion: provider deletion request triggered when member requests account deletion

**AGE / FAMILY SAFEGUARDS:** Minimum age enforcement for verification (platform age policy decision required).

**DEPENDENCIES:** Phase 2 complete. Vendor evaluation complete (Stripe Identity or approved alternative). Expo SDK compatibility confirmed. Consent framework legally reviewed. International coverage confirmed.

**EXPLICITLY NOT INCLUDED:**
- Business ownership verification (separate, always separate from personal identity)
- Verification results as proof of minority business ownership (permanently prohibited)

**ACCEPTANCE TEST:**
1. Eligible paid member → navigates to verification entry point → provider-hosted flow → status returned
2. Platform DB stores only reference ID and status — no image
3. Community Verified badge appears on profile after approval
4. Member deletes account → provider deletion request triggered
5. Business verification flow is distinct, separate, and does not reference personal identity verification

**CURRENT STATUS:** Backend routes + admin tools + mobile screen built. No nav entry point (intentionally). No vendor selected. Vendor evaluation required. PLACEMENT: Build 102+ pending vendor evaluation.

---

### BUILD 103 — KinfolkAI Life Journeys and Ecosystem Intelligence
**TRUST PHASE:** Phase 6 — Can businesses trust Kinfolk? (Extended: Can communities trust Kinfolk's intelligence?)  
**BUILD NAME:** Life Journey Build + Business Intelligence Build  
**PRIMARY PURPOSE:** KinfolkAI proactively supports members through life events with coordinated recommendations. Business owners receive Community Intelligence Briefings. The platform begins acting as an ecosystem, not a directory.  
**FOUNDER OUTCOME:** A member announces they're moving. Kinfolk surfaces relevant businesses, organizations, and resources — not as a list, but as a guided plan. A business owner learns "Three members in your neighborhood searched for bakeries this week — your name came up twice."

**USER-VISIBLE FEATURES — LIFE CHAPTERS AND JOURNEYS (FOUNDER APPROVED TODAY):**
- **My Story** (replaces "My Journey" — opens to "Here's the story we've been building together")
- **Life Chapters** as top-level containers:
  - Moving, Marriage, Education, Career, Business, Parenthood, Travel, Wellness, Retirement, Heritage, Community Leadership
- Kinfolk asks: "What's happening in your life right now?" — only when it makes sense or user chooses
- Journeys within Chapters (guided plans for life events)
- Milestones within Journeys (single transactions, tasks, service needs — not standalone Chapters)
- Journey filter: "Will this matter to someone five years from now?" — yes = Journey, no = milestone inside a Chapter
- Opt-in Journey documentation (explicit consent — "Would you like to save this journey?")
- Graduation/milestone summaries ("Four years ago you saved your first HBCU. You graduated from Cheyney.")
- Journeys don't end — they evolve (College → Career → Mentor → Alumni → Board Member → Speaker)
- **Nothing expires** — a member returns three years later and Kinfolk continues exactly where they left off
- Gentle nudges (once every few weeks max, with Not now / Tell me more / Don't show again options)
- "Save" not "Start Journey" — psychologically lighter entry (FSR-025 / Build 97 spec Q4)

**USER-VISIBLE FEATURES — CULTURAL JOURNEYS (FOUNDER APPROVED TODAY — FULL LAUNCH):**
- **Cultural Journeys** section within Library (distinct identity, not just articles)
- Invitation cards (never "You are..." — always "Explore:")
  - West African Roots: "Curious about traditions, music, food, and modern Ghana? Start here."
  - Caribbean Heritage: "Learn about history, neighborhoods, language, food, and celebrations."
  - Indigenous Nations: "Discover living cultures, traditions, languages, and places to visit respectfully."
  - (All 10 first-cohort cities/communities — founder-approved priority order)
- Kinfolk asks inside a journey: "Would you like to learn through travel, food, music, history, businesses, or conversations?"
- 12 learning pathways for every Cultural Journey: Food, Music, Businesses, Museums, Festivals, Books, Films, Podcasts, Local Voices, Language, Faith (never pushed), Family Traditions
- **"If this is your first time..."** section for every culture (no tests, no pressure, just welcome)
- **Curiosity Lists** ("Things I Want To Learn") — full implementation
- **My Passport (Cultural Passport)** — not countries, moments: First HBCU / First Powwow / First Juneteenth / First Caribbean Festival / First Pride / First Ethiopian Coffee Ceremony / First Native-owned business
- **Opt-in exploration history** (Cultural Journey — like Spotify Wrapped, only if enabled)
- Library stores discovery (not just information): every article, museum, business, video, elder interview saveable to My Story

**USER-VISIBLE FEATURES — CITY-AS-CONTAINER (FIRST-COHORT CITIES):**
- Community layers within cities (stackable, user-selected — "Explore Communities"):
  - Miami: Black Miami / Little Haiti / Little Havana / Brazilian Miami / Dominican Miami / LGBTQIA+ Miami
  - New York: Black NYC / Caribbean NY / Afro-Dominican/Puerto Rican / West African NY
  - Los Angeles: Black LA / Korean LA / Afro-Latino LA / Indigenous LA
  - Houston: Black Houston / West African Houston / Afro-Latino Houston
  - Washington DC: Black DC / East African DC / Caribbean DC
  - Philadelphia: Black Philadelphia / (community layers TBD with community reviewers)
  - Minneapolis: East African Minneapolis
  - Boston/Brockton: Black Boston / Cape Verdean Boston / Caribbean Boston
  - Newark: Black Newark / Afro-Brazilian Newark
  - Orlando: Black Orlando / Puerto Rican Orlando / Afro-Brazilian Orlando
- Interest filters (cross-community, stackable): Heritage, Food, Music, Art, Faith, Family, Nightlife, Business, Events, History, Safety, Education
- Community layers are experience selections, not identity assignments
- Universal layer always active (hospitals, transit, safety, major landmarks)

**BUSINESS FEATURES — BUSINESS KINFOLKAI (6 ENGINES, PHASE 6):**
- Business Identity Engine (who the business is — beyond category)
- Community Intelligence Briefings (observations, not analytics dashboards):
  - "Three members searched for bakeries in your neighborhood this week"
  - "Your business came up in two KinfolkAI conversations this month"
- Growth Coach (pattern-based suggestions with explanation — never manipulation)
- Opportunity Engine (seasonal and behavioral signals with explanation of why)
- Partnership Engine (complementary business introductions with reasoning)
- Celebration Engine (milestones surfaced and shared if owner chooses)
- Voice tone learning (owner's writing style over time — explicit opt-in)
- Organic vs. sponsored promotion distinction: "Recommended because you're a good match" vs. "You've chosen to increase visibility"
- **Community Pulse for businesses** (what the community is asking for this week near them)

**CULTURAL AMBASSADOR FEATURES:**
- Journey Ambassador role (separate from Cultural Ambassador — FOUNDER APPROVED TODAY):
  - Cultural Ambassadors: preserve and share community knowledge ("Let me teach you about my community")
  - Journey Ambassadors: people a few chapters ahead ("Let me walk with you through something I've already experienced")
- Journey Ambassador activation (completion of a Chapter triggers invitation to become a guide)
- **Pay It Forward Moment:** "Five years ago someone shared a video that helped you choose Cheyney. Would you like to record a message for someone beginning the same journey?"

**KINFOLKAI FEATURES:**
- Cross-entity coordination (one KinfolkAI plan coordinates business + organization + community resource recommendations)
- Life Journey activation (major life event → guided plan with coordinated entities)
- Proactive KinfolkAI check-ins on active Life Journeys
- Journey editing and completion
- KinfolkAI as Opportunity AI for Journey Ambassadors:
  - "Your community has been asking about HBCU applications..."
  - "People beginning this journey often look for..."
  - "No pressure — your experience could really help someone"
  - Kinfolk ALWAYS explains WHY it is making a suggestion — no invisible algorithm
- **Transparent suggestion rule (LOCKED):** Kinfolk never says "Make this video." Only "Your community has been asking..." / "No thanks is always okay."

**COMMUNITY FEATURES:**
- Community Intelligence ecosystem (initial): Community Members → Questions → Kinfolk Intelligence → Community Needs → Trusted Voices → New Stories → Businesses → Communities → Next Generation
- Community needs and opportunity matching (professional shortages, trade/career needs, business gaps)
- Community contribution recognition (member's contributions visible in My Story)

**MAP / HERITAGE FEATURES:**
- Community layers on map (user selects which community perspective is highlighted)
- Heritage sites connected to Cultural Journey pathways
- Place-triggered cultural nudges (businesses as teachers — owner opt-in)

**LIBRARY / LEARNING FEATURES:**
- Cultural Journey feature fully live (first-cohort 10 cities/communities)
- Library → Discovery full evolution
- My Story with Cultural Passport and Life Chapters

**DATA / SCHEMA WORK:**
- Life Chapters table (life_chapters — distinct from existing life_journeys)
- Cultural Journey tracking (cultural_journey table — opt-in, like Spotify Wrapped)
- community_layers table (stores city → community layer definitions)
- journey_ambassador_profiles table
- business_intelligence_briefings table
- pay_it_forward_contributions table (video/text messages for next-journey users)
- cultural_passport_moments table (user's "First HBCU," "First Powwow," etc.)
- curiosity_list_items table

**PRIVACY / CONSENT REQUIREMENTS:**
- Cultural Journey history: opt-in only, explicit consent, deletable
- Life Chapter documentation: opt-in per chapter
- Business Intelligence Briefings: aggregated, anonymized — no individual member behavior exposed
- Pay It Forward: creator owns content, licenses MWM to display, can remove at any time
- Community Intelligence: no individual data surfaced, only aggregated signals

**AGE / FAMILY SAFEGUARDS:**
- Life Chapter "Education" section: "No assumption that every teenager wants college" (from FSR spec)
- No assumption that every user wants cultural guidance — all pathways optional
- Cultural Journey pathways: family-safe by default; Family Mode filters content depth

**DEPENDENCIES:**
- Phase 4 (KinfolkAI trust/memory) complete
- Phase 3 (community data sufficient for intelligence observations)
- First-cohort community reviewers identified and consulted for each city/community
- Business Intelligence Briefing cadence decided (weekly?)
- Briefing opt-in vs. default decided
- Voice tone learning opt-in mechanism decided
- Cultural Journey privacy model decided

**EXPLICITLY NOT INCLUDED:**
- Phase 8 "From the Community" videos and contributor ecosystem
- Ambassador compensation model (Phase 8)
- Full Living Legacy pipeline (Phase 8)
- Real-time cultural feeds (Phase 9)
- Kinfolk Circles main nav launch (Phase 7 — separate build)
- Economic impact measurement (Phase 9)

**ACCEPTANCE TEST:**
1. User activates "I'm moving to Atlanta" Life Chapter → Kinfolk produces a coordinated plan (businesses + organizations + resources)
2. Cultural Journey "Little Haiti" selected → Kinfolk asks "Travel, food, music, history, businesses, or conversations?" → pathway follows their choice
3. "If this is your first Juneteenth celebration" section visible in Juneteenth Cultural Journey
4. City-as-container: user selects "Little Haiti" layer on Miami map → map highlights Haitian-owned businesses and cultural sites without removing universal layer
5. Business owner receives Community Intelligence Briefing via KinfolkAI — content is an observation, not an analytics dashboard
6. Journey Ambassador invitation triggered at Chapter completion
7. Pay It Forward: completing HBCU chapter → prompt to leave message for next student
8. Cultural Passport records first HBCU visit moment
9. Curiosity List items persisted and connected to Cultural Journey recommendations
10. Transparent suggestion: every KinfolkAI recommendation includes a "Why I suggested this" explanation

**CURRENT STATUS:** Life Journeys DB tables exist (different purpose — entity_connections for KinfolkAI context). Life Chapters / My Story / Cultural Journeys / City-as-container: future-state only. Business KinfolkAI 6-engine structure: future-state only (brainstorming vision received July 26, 2026). PLACEMENT REQUIRES FOUNDER APPROVAL on exact build number.

---

### BUILD 104 — Kinfolk Circles Full Launch
**TRUST PHASE:** Phase 7 — Real-world connection  
**BUILD NAME:** Circles Build  
**PRIMARY PURPOSE:** Kinfolk Circles activated in main navigation. Private shared spaces for trusted groups — family travel planning, friend group discovery, community committees.  
**FOUNDER OUTCOME:** A family can plan a cultural trip together. A community committee can share vetted local spots. A group of friends can discover the city through a shared lens.

**USER-VISIBLE FEATURES:**
- Kinfolk Circles entry in main navigation (previously built, deferred)
- Circle privacy controls and invitation flow
- AI curator modes (votes / random / by_member)
- Circle-based saved places sharing
- Tier limits on Circle creation (Community Member: 1 Circle, Navigator+: more)
- Meetup coordination safety guidelines

**BUSINESS FEATURES:** Circle-shared business recommendations visible to Circle members.

**CULTURAL AMBASSADOR FEATURES:** Cultural Ambassadors may curate public Circles (founder decision required on public Circle discovery).

**KINFOLKAI FEATURES:** Kinfolk uses Circle context to make coordinated recommendations for the group.

**DATA / SCHEMA WORK:** circle_plans table, saved_places sharing — already built. Navigation entry point is the main new work.

**PRIVACY / CONSENT REQUIREMENTS:** Shared private Circles involve member location and saved places — privacy architecture must be explicitly designed.

**AGE / FAMILY SAFEGUARDS:** Family Circles for travel planning — child-safe content filtering.

**DEPENDENCIES:** Phase 5 (identity verification adds trust signal to Circle curation). Phase 3 (community data enriches Circle suggestions).

**EXPLICITLY NOT INCLUDED:** Public Circle discovery (founder decision required). Real-time feeds (Phase 9).

**ACCEPTANCE TEST:**
1. Circle created → members invited → saved places shared within Circle
2. AI curator mode (votes) generates a curated plan from Circle members' preferences
3. Meetup safety guidelines visible when coordinating an in-person Circle event

**CURRENT STATUS:** 6 DB tables + mobile create/view screens — already built. No main navigation entry point (intentionally deferred). Already implemented at architecture level.

---

### BUILD 105 — Cultural Storytelling, Heritage, and Living Legacy
**TRUST PHASE:** Phase 8 — Can Ambassadors trust Kinfolk?  
**BUILD NAME:** Ambassador and Living Legacy Build  
**PRIMARY PURPOSE:** Cultural Ambassadors have their full operating system. Community Members can contribute to the permanent cultural record. The platform becomes a living archive of community memory.  
**FOUNDER OUTCOME:** An elder's oral history is preserved permanently. A Cultural Ambassador sees "27 people visited businesses you recommended this month." The community teaches itself.

**USER-VISIBLE FEATURES:**
- Full Cultural Ambassador portal (7 engines):
  - Identity Engine (who the Ambassador is — beyond content category)
  - Growth Engine (pattern-based insights, not pressure metrics)
  - Community Impact Engine ("27 people visited businesses you recommended this month")
  - Opportunity Engine (evidence-based content suggestion from community gaps)
  - Partnership Engine (intelligent introductions — businesses, orgs, creators, media)
  - Evolution Engine (KinfolkAI celebrates life changes and growing audience evolution)
  - Legacy Engine (preserve heritage, record elder stories, document neighborhood change)
- **"From the Community"** section in every community profile:
  - Real people (not AI): grandmother, barber, teacher, chef, college student, pastor, elder
  - 30-second video format: "Welcome. Here's something I hope you experience while you're here."
  - Creator owns content, licenses MWM to display, can remove at any time
  - Never auto-published — three-stage review (automatic + human moderation + Ambassador review)
- **Creator dashboard — two sections:**
  - External Reach: TikTok views, Instagram reach, YouTube views, website clicks, revenue, brand partnerships
  - Community Impact: people helped, questions answered, businesses supported, journeys contributed to, communities represented, videos saved, businesses visited, museum visits inspired, students who added a school, parents who saved a guide
- **Creator profile as timeline** (not a single content category):
  - Creator identity grows across life chapters — traveler → mom → entrepreneur → mentor
  - Profile never penalizes content evolution (explicit contrast with TikTok)
- **My Community Pulse** for Ambassadors: what the community is asking for — needs, not trends
- Opportunity AI for Ambassadors: "We don't yet have someone covering accessible travel in Cabo. Would you be interested?"

**LIVING LEGACY FEATURES:**
- Heritage nomination full flow (community review → approval → permanent archive)
- Oral history and story submission (text and media)
- Place-linked video contribution
- "Communities Served" metric (not followers/impressions)
- Community Impact Report (Ambassador-facing — impact, not vanity)
- Professional expertise display alongside Ambassador identity
- Ambassador compensation/recognition model (founder decision required)

**DATA / SCHEMA WORK:**
- Ambassador portal tables (ambassador_profiles with 7-engine data)
- from_the_community_submissions table (video, consent, status, creator_id, location, license_agreement)
- community_impact_events table (people helped, businesses visited, journeys contributed to)
- creator_community_pulse table (aggregated community needs by geography)
- oral_history_submissions table

**PRIVACY / CONSENT REQUIREMENTS:**
- "From the Community" video: creator owns content, licenses display, can remove
- Oral histories: may name people — sensitivity review required
- Elder stories: require sensitive handling
- Minor protection in content (oral histories may involve minors)
- Cultural content ownership policy (contributor retains story, platform has license)
- Oral history release form

**AGE / FAMILY SAFEGUARDS:** Cultural content moderation required. Minor protection in oral history capture.

**DEPENDENCIES:** Phase 5 (Ambassador qualification may require Verified status). Phase 3 (contribution ecosystem established). Living Legacy content ownership model decided. Elder story capture process decided. Ambassador compensation model decided.

**EXPLICITLY NOT INCLUDED:**
- Real-time cultural feeds (Phase 9)
- Full Invisible Architecture implementation (Phase 9+)
- Economic impact measurement (Phase 9)

**ACCEPTANCE TEST:**
1. Cultural Ambassador submits "From the Community" video → three-stage review → visible in community profile
2. Ambassador Community Impact Report shows "27 people visited businesses you recommended" — aggregated, anonymized
3. Ambassador profile timeline shows evolution across life chapters
4. "My Community Pulse" surfaces community needs (not trends) to Ambassadors
5. Opportunity AI suggests a knowledge gap to the right Ambassador by lived experience, not fame
6. Living Legacy story submitted → permanently archived → visible in heritage library

**CURRENT STATUS:** Cultural Ambassador system partially built (Trust Level 4 admin grant, no portal). FSR-003 PARTIALLY BUILT. "From the Community" videos: future-state only. Community Impact Report: future-state only. Depends on Phase 5.

---

### BUILD 106+ — Full Community Orchestration
**TRUST PHASE:** Phase 9 — Can communities trust Kinfolk?  
**BUILD NAME:** Full Platform Build  
**PRIMARY PURPOSE:** Every role is interconnected. KinfolkAI coordinates across all roles simultaneously. The platform generates measurable community economic impact.  
**FOUNDER OUTCOME:** The platform achieves what the vision described: a Community Operating System where belonging, opportunity, safety, and culture reinforce each other continuously.

**USER-VISIBLE FEATURES:**
- Cross-role KinfolkAI coordination (same conversation serves a member as Community Member AND Business Owner AND Cultural Ambassador)
- Real-time cultural feeds (community pulse, neighborhood trends)
- Economic impact measurement (platform-wide, not per-member)
- Kinfolk Circles integration with Heritage and Business networks
- Full Community Intelligence platform (anonymous, aggregated signal across all member types)
- Pricing evolution (outcomes-based, usage-based — 6 months of post-launch evidence required before any pricing change)
- Full Living Community Feed (all 4 layers per COMMUNITY_UNDERSTANDING_AND_LIVING_FEED.md)
- Community Reciprocity Engine (early phase of Invisible Architecture implementation)

**DEPENDENCIES:** All prior phases complete. Pricing evolution requires 6+ months of post-launch usage data.

**CURRENT STATUS:** Future-state only. Invisible Architecture (34 specs complete — trade secrets) informs build design. No implementation authorized.

---

## SECTION 3 — REQUIRED CAPABILITIES PLACEMENT

### A. Foundation and Release Stability

| Capability | Current state | Assigned build | Founder decision needed |
|---|---|---|---|
| Authentication reliability | Partially built — auth fixes in Build 97 | Build 97 | None — implemented |
| Apple review account | Required per submission gate | Build 97 | None |
| Android and iOS testing | Regression tests defined | Build 97 | None |
| Tablet support | iPad test in submission gate | Build 97 | None |
| Production readiness | Railway + submission gates | Build 97 | None |
| Database resilience | Phase 1 backend stability (PR #13) | Build 97 | None |
| External monitoring | /api/readyz (PR #13) | Build 97 | None |
| Crash reporting | Sentry or equivalent — confirm state | Build 97 | None |
| Release gates | 11-gate submission gate (permanent) | Every build | None |
| Legal pages | Live on web (privacy, terms, support) | Build 97 ✅ already live | None |
| Account deletion | Improved in Build 97 | Build 97 | None |
| Privacy controls | Personalization opt-out, data controls | Build 97–98 | None |

### B. Maps, Heritage, and Safety

| Capability | Current state | Assigned build | Founder decision needed |
|---|---|---|---|
| Business map | Already implemented | Verified Build 97 | None |
| Heritage places | Already implemented (FullMapView.tsx) | Verified Build 97 | None |
| HBCUs | Horizontal strip removed Build 95 | Build 98 (restore) | None |
| Historical Sundown Towns | Audit complete — 9 gates not yet cleared | PLACEMENT REQUIRES FOUNDER APPROVAL | Yes — all 9 gates in BUILD_97_HISTORICAL_SUNDOWN_TOWNS_AUDIT.md |
| Cultural neighborhoods | Community layers (city-as-container) | Build 103 | Yes — community reviewer for each city |
| Source attribution | FSR-013 PARTIALLY BUILT | Build 99 | None |
| Learn More | From businesses + cultural sites | Build 99 | None |
| Community safety intelligence | Safety hub + surveys + alerts built | Verified Build 97 | None |
| Historical vs. current safety distinction | Not yet implemented | Build 100 | Yes — terminology and display rules |
| Discrimination reports | contentReportsTable built | Verified Build 97 | None |
| Community engagement signals | Safety surveys built | Verified Build 97 | None |
| Community needs and opportunity signals | Community Intelligence | Build 103 | None |
| Officer Watch | Built | Verified Build 97 | None |
| Meet-up Verification | meetup_verifications table built | Verified Build 97 | None |
| Neighborhood surveys | Safety surveys built | Verified Build 97 | None |
| Living community results | Safety survey results visible | Verified Build 97 | None |
| Population-scale weighting | Community Signal Strength Standard — not yet applied in algorithms | Build 104+ | Yes — founder approval of algorithm weight methodology |
| Community contribution effects | Trust progression affecting recommendations | Build 99–100 | None |

### C. KinfolkAI Cultural Intelligence

| Capability | Current state | Assigned build | Founder decision needed |
|---|---|---|---|
| Founding 36-city cultural registry | Implemented (Layer One, hardcoded) | Verified Build 97 | None |
| City-specific cultural history | Implemented | Verified Build 97 | None |
| Local terms | Implemented in CITY_LOCAL_TERMS | Verified Build 97 | None |
| Things You'll Hear | NOT implemented | Build 99 | None |
| Things Locals Appreciate | NOT implemented | Build 99 | None |
| Community etiquette | NOT implemented (covered under Local Terms) | Build 99 | None |
| City voices (travel) | 12-city registry in travel.ts | Verified Build 97 | None |
| Navigation voice | 12-city registry in maps.ts | Verified Build 97 | None |
| Broader-community understanding | Partially via system prompt | Build 103 (full) | None |
| Micro-community understanding | user_preferences feeds this | Build 103 (full) | None |
| City → Community → Neighborhood → Context → User Preference | Future architecture | Build 103 | None |
| Community Voice preferences | NOT implemented (aave_level is bundled) | Build 100/101 | None — FOUNDER APPROVED today: Professional / Friendly / Local / Home |
| Cultural Language preferences | NOT implemented | Build 100/101 | None — FOUNDER APPROVED today: Standard / Community-Informed / Community Native |
| Profanity controls (separate) | NOT implemented (bundled with AAVE Level 3) | Build 100/101 | None — FOUNDER APPROVED today: None / Mild / Explicit; never tied to membership tier |
| Code-switching controls | NOT implemented | Build 100/101 | None — FOUNDER APPROVED today: Always / Ask me / Never |
| Family and minor safeguards | family_settings table built; NOT wired into KinfolkAI | Build 100/101 | None — FOUNDER APPROVED today: Family Mode overrides all three settings |
| Voice preference persistence | NOT persisted (voiceMode per-request only) | Build 100/101 | None |
| Community-governed language evolution | archive_contributions schema (0 rows) | Build 99 (Layer Two pipeline) | Yes — Cultural Ambassador qualification criteria, minimum phrase threshold |
| Phrase review and correction process | NOT implemented | Build 99 | Yes — reviewer designation process |
| Founding Cultural Registry (Layer One) | Hardcoded in kinfolk.ts | Already implemented | None |
| Living Community Language Layer (Layer Two) | Schema only, 0 rows, no routes | Build 99 | Yes — Ambassador review requirements |
| Private chats excluded from shared learning | Already excluded by architecture | Verified Build 97 | None |
| Cultural accuracy and citation governance | NOT implemented | Build 99 | Yes — source citation standard |
| "Minority" correction in registry | NOT yet corrected | Build 98 | Yes — founder review of each instance (approved in principle today) |
| Tuskegee attribution correction | NOT yet corrected | Build 98 | FOUNDER APPROVED today — implement in Build 98 |
| "Mardi Gras Indians" correction in travel.ts | NOT yet corrected | BLOCKED | Yes — New Orleans community review required before any change |

### D. Cultural and Diaspora Expansion

| Capability | Current state | Assigned build | Founder decision needed |
|---|---|---|---|
| Existing Black-city foundation (36 cities) | Implemented | Verified Build 97 | None |
| Equal-depth framework for every future community | 16-category governance standard defined today | Build 103 (first cohort) | Yes — community reviewers per city |
| Miami's multiple community experiences | Single "Miami" entry in CITY_VOICES | Build 103 | Yes — community reviewers for each Miami layer |
| New York's multiple community experiences | Single "new york" entry | Build 103 | Yes — community reviewers |
| Los Angeles's multiple community experiences | Single "los angeles" entry | Build 103 | Yes — community reviewers |
| Houston's multiple community experiences | Single "houston" entry | Build 103 | Yes — community reviewers |
| Washington DC / DMV community layers | Single "dc" entry | Build 103 | Yes — community reviewers |
| Philadelphia community layers | Single "philadelphia" entry | Build 103 | Yes — community reviewers |
| Boston–Brockton | Not in registry | Build 103 | Yes — community reviewers |
| Minneapolis–Saint Paul | Not in registry | Build 103 | Yes — East African community reviewers |
| Orlando–Kissimmee | Not in registry | Build 103 | Yes — community reviewers |
| Newark–Elizabeth | Not in registry | Build 103 | Yes — community reviewers |
| Haitian communities | Thin Miami entry only | Build 103 | Yes — Haitian community reviewers |
| Dominican communities | Not in registry | Build 103 | Yes — Dominican community reviewers |
| Puerto Rican communities | Not in registry | Build 103 | Yes — Puerto Rican community reviewers |
| Brazilian / Afro-Brazilian communities | Not in registry | Build 103 | Yes — Brazilian community reviewers |
| Afro-Latino communities | Not in registry | Build 103 | Yes — community reviewers |
| Caribbean communities | Thin Miami entry only | Build 103 | Yes — community reviewers |
| Ethiopian and East African communities | Not in registry | Build 103 | Yes — East African community reviewers |
| West African communities | Not in registry | Build 103 | Yes — West African community reviewers |
| Indigenous communities | Thin Tulsa entry only | Build 103 | Yes — Indigenous community reviewers; additional governance gates |
| Asian diaspora communities | 7 communities deferred (saved to memory) | PLACEMENT REQUIRES FOUNDER APPROVAL | Yes — separate founder session required |
| LGBTQIA+ communities | Not in registry as community layer | Build 103 | Yes — LGBTQIA+ community reviewers |
| MENA and immigrant communities | Not in registry | PLACEMENT REQUIRES FOUNDER APPROVAL | Yes |
| Community reviewers and cultural governance | Not yet defined | Build 102 prep | Yes — Ambassador role + reviewer designation |

### E. Library and Cultural Reconnection

| Capability | Current state | Assigned build | Founder decision needed |
|---|---|---|---|
| Cultural Journeys / Explore Cultures | NOT implemented | Build 103 | Yes — first cohort priority (FOUNDER APPROVED today: Miami, NYC, LA, Houston, DC, Philadelphia, Minneapolis, Boston, Newark, Orlando) |
| History, Language, Faith, Music, Food, Literature | Library has topics; not organized as Cultural Journey pathways | Build 103 | None |
| Films, Podcasts, Museums | Not yet in Cultural Journey format | Build 103 | None |
| Cultural businesses (as teachers) | businesses table — not connected to Cultural Journeys | Build 103 | None |
| Cultural sites connected to journeys | Heritage map built; not connected to Cultural Journeys | Build 103 | None |
| "If this is your first time..." | NOT implemented | Build 103 | None — FOUNDER APPROVED today |
| Saved learning | Library saves reading position — partial | Build 99 | None |
| Curiosity Lists | NOT implemented | Build 99 | None |
| Continue where you left off | NOT implemented | Build 99/100 | None |
| My Cultural Journey | NOT implemented (opt-in exploration history) | Build 99 (tracking), Build 103 (full feature) | None — FOUNDER APPROVED today: opt-in only |
| Cultural Passport | NOT implemented | Build 103 | None |
| From the Community (videos) | NOT implemented | Build 105 | Yes — ownership model, consent, review process (FOUNDER APPROVED today) |
| Resident, alumni, historian videos | NOT implemented | Build 105 | None |
| Business-owner stories | Partially implemented (business_stories table, /api/stories) | Build 103 (contextual nudges) | None |
| Learn More from locations | Partial (cultural-heritage has detail screen) | Build 99 | None |
| Opt-in exploration history | NOT implemented | Build 99 (start), Build 103 (full) | None — FOUNDER APPROVED today: opt-in |
| Privacy controls for learning history | NOT implemented | Build 99 | None |
| No streaks or pressure-based gamification | NOT explicitly implemented (no gamification present) | Build 99 | None — FOUNDER APPROVED today: never Duolingo model |

### F. Life Chapters and Journeys

| Capability | Current state | Assigned build | Founder decision needed |
|---|---|---|---|
| My Story | NOT implemented | Build 103 | None — FOUNDER APPROVED today |
| Life Chapters | NOT implemented | Build 103 | None — FOUNDER APPROVED today |
| Journeys | life_journeys table (different purpose — entity_connections) | Build 103 | None |
| Milestones (inside Chapters, not standalone Journeys) | NOT implemented | Build 103 | None |
| Moments | NOT implemented | Build 103 | None |
| Education / College / HBCU exploration | HBCU map partially built; Cultural Journey HBCU pathway | Build 103 | None |
| Trade schools, apprenticeships | Opportunity Center has jobs table | Build 103 | None |
| Career changes | NOT as a Life Chapter | Build 103 | None |
| Relocation | NOT as a Life Chapter | Build 103 | None |
| Travel | Travel routes built in KinfolkAI; not as Life Chapter | Build 103 | None |
| Marriage and weddings | NOT as a Life Chapter | Build 103 | None |
| Parenthood | NOT as a Life Chapter | Build 103 | None |
| Entrepreneurship | Business dashboard built; not as Life Chapter | Build 103 | None |
| Home buying | NOT as a Life Chapter | Build 103 | None |
| Heritage reconnection | Cultural Journey provides this; Life Chapter also | Build 103 | None |
| Wellness, Retirement, Community Leadership | NOT as Life Chapters | Build 103 | None |
| Mentorship (as Life Chapter component) | mentorship_profiles table built | Build 103 | None |
| Pay It Forward | NOT implemented | Build 105 (build-on-Chapter-completion) | None — FOUNDER APPROVED today |
| Opt-in journey documentation | NOT implemented | Build 103 | None — FOUNDER APPROVED today: opt-in |
| Graduation / milestone summaries | NOT implemented | Build 105 (full) | None |
| Alumni feedback loops | NOT implemented | Build 105 | None |
| Gentle nudges (at most every few weeks, with opt-out) | NOT implemented | Build 103 | None — FOUNDER APPROVED today: once every few weeks, with Not now / Don't show again |
| No assumption every teenager wants college | NOT yet enforced | Build 103 | None |
| No assumption every user wants cultural guidance | User can opt out of all | Build 103 | None |
| Transactional needs inside Chapters (not standalone) | Journey filter: "5 years from now?" | Build 103 | None — FOUNDER APPROVED today |

### G. Cultural Ambassador Ecosystem

| Capability | Current state | Assigned build | Founder decision needed |
|---|---|---|---|
| Cultural Ambassadors (role) | Trust Level 4, admin grant only | Build 98 (entry), Build 105 (full) | Yes — qualification criteria, application vs. invitation (AUDIT-009) |
| Journey Ambassadors / Journey Guides | NOT implemented | Build 103 | None — FOUNDER APPROVED today: distinct role from Cultural Ambassadors |
| Community Storytellers / Trusted Voices | NOT implemented | Build 103 | None — FOUNDER APPROVED today |
| Creator onboarding | NOT implemented | Build 105 | None |
| Creator life chapters (profile as timeline) | NOT implemented | Build 105 | None |
| Multiple creator identities (evolves with them) | NOT implemented | Build 105 | None |
| Community Pulse (needs, not trends) | NOT implemented | Build 105 | None |
| Questions the community is asking | NOT implemented | Build 103 (for Journey Ambassadors) | None |
| Knowledge gaps surfaced to creators | NOT implemented | Build 105 | None |
| Opportunity suggestions for creators | NOT implemented | Build 105 | None |
| Content recommendations based on audience needs | NOT implemented | Build 105 | None |
| Different suggestions for different creators in same city | NOT implemented | Build 105 | None |
| External platform traffic analytics | NOT implemented | Build 105 | None |
| Community impact analytics (people helped, journeys supported) | NOT implemented | Build 105 | None |
| Compensation and brand opportunities | NOT implemented | PLACEMENT REQUIRES FOUNDER APPROVAL | Yes — compensation model |
| Creator consent and content ownership | NOT implemented | Build 105 | None — FOUNDER APPROVED today |
| Licensing framework | NOT implemented | Build 105 | None — FOUNDER APPROVED today |
| Moderation of Ambassador content | Partial (contentReportsTable) | Build 105 | None |
| Transparent reason for every Kinfolk suggestion | NOT implemented | Build 103 | None — FOUNDER APPROVED today |
| No manipulation for engagement | By design — no algorithm | Every build | None |
| Contribution over popularity | By design — "Communities Served" metric | Build 105 | None |
| Pay-it-forward prompts | NOT implemented | Build 105 | None — FOUNDER APPROVED today |

### H. Community Intelligence Platform

| Capability | Current state | Assigned build | Founder decision needed |
|---|---|---|---|
| Broader community (entire city ecosystem) | Conceptual — not surfaced to users | Build 103 | None |
| Micro community (user's intersection points) | user_preferences stores preferences | Build 103 | None |
| Community Understanding terminology | Platform vocabulary defined (no "algorithm") | Every build | None |
| Living Community Feed | COMMUNITY_UNDERSTANDING_AND_LIVING_FEED.md — not built | Build 103 (initial) | None |
| Community needs | NOT surfaced as a feature | Build 103 | None |
| Community opportunity matching | Partially (Opportunity Center jobs) | Build 103 (KinfolkAI context) | None |
| Professional shortages, trade needs | Opportunity Center has jobs | Build 103 | None |
| Business gaps | NOT surfaced | Build 103 | None |
| Resource gaps | NOT surfaced | Build 103 | None |
| Community requests | NOT aggregated and surfaced | Build 103 | None |
| Community contribution recognition | Partially (trust level progression) | Build 99 | None |
| Evidence-based recommendations | Safety Intelligence Engine (spec only) | Build 106+ | None |
| Scale-aware signals | Signal Strength Standard defined | Build 103 (governance), Build 106+ (algorithm) | None |
| Transparency: why user is seeing a suggestion | NOT implemented | Build 100/101 (KinfolkAI), Build 103 (Community) | None |
| Privacy and user control | Partially (notification prefs, blocking) | Build 99–100 | None |
| Gradual adaptation | NOT implemented | Build 100/101 | None |
| Community before engagement | By design — governance principle | Every build | None |
| Contribution over popularity | By design | Every build | None |

### I. Businesses and Events

| Capability | Current state | Assigned build | Founder decision needed |
|---|---|---|---|
| Real businesses | Already in DB | Verified Build 97 | None |
| Clearly identified Beta Test Listings | NOT clearly labeled | Build 98 | None |
| Tester reviews and ratings | Reviews built; not labeled as beta-test reviews | Build 98 | None |
| Test score changes | NOT implemented | Build 98 | None |
| Separation of demo and real metrics | NOT implemented | Build 98 | None |
| Multiple ownership designations | businesses table has ownershipDesignations | Verified Build 97 | None |
| Diaspora representation | First-cohort community layers | Build 103 | None |
| Professional services | jobs + mentorship built | Verified Build 97 | None |
| Culturally diverse businesses | Category + ownership designation filtering | Build 103 (community layers) | None |
| Business stories | business_stories table + /api/stories | Verified Build 97 | None |
| Community teaching moments | NOT implemented (owner opt-in cultural nudge) | Build 103 | None |
| Learn More | FSR-002 PARTIALLY BUILT | Build 99 | None |
| Real and Beta Test Events | Events built; beta-test separation not done | Build 98 | None |
| Diverse cultural events | Events by community layer | Build 103 | None |
| RSVP and event interaction | RSVP built | Verified Build 97 | None |
| Business KinfolkAI (current state) | Basic context in system prompt | Verified Build 97 | None |
| Business KinfolkAI (6-engine Phase 6) | NOT implemented | Build 103 | Yes — Briefing cadence, voice tone opt-in mechanism |
| Community-needs opportunities for businesses | NOT implemented | Build 103 | None |
| Ambassador and business partnerships | NOT implemented | Build 105 | Yes — partnership model |

---

## SECTION 4 — BUILD SCOPE DISCIPLINE

For every build above, the following discipline rules apply:

**Build 97 (current):**
- Must complete: all 11 submission release gates; Community Member label; personalization onboarding; auth regression; map regression; platform language corrections
- Intentionally deferred: all Phase 2–9 features; registry corrections beyond Priority 1 language fixes
- Depends on real community data: none in Build 97
- Requires founder decisions: none outstanding for Build 97 scope
- Requires cultural or legal review: none new
- Requires new mobile binary: YES — in review now (iOS 97, Android VC71)
- Requires Railway/backend deployment: YES — PR #13 merge (LC-007)
- Can be released independently: YES — stands on its own

**Build 98:**
- Requires new mobile binary: YES (HBCU strip, role display, design pass)
- Requires Railway/backend: YES (trust.ts PAID_TIERS update, org fields)
- Must not bundle: Verified Community Member activation (no vendor ready); third-party SDK
- Requires founder decisions before implementation: "Minority" registry corrections (each instance review — APPROVED in principle today); community reviewer process; org eligibility criteria

**Build 99/100:**
- Requires new mobile binary: YES (curiosity lists, learning pathways, Living Legacy UI)
- Must not bundle: three-setting voice decoupling (save for Build 100/101 to not overload)
- Requires real community data before certain features are meaningful: Layer Two language contributions
- Requires cultural review: Living Legacy content review process defined before nomination flow ships

**Build 100/101:**
- Three-setting voice decoupling should ship in ONE coordinated build (all three settings together — they are interdependent)
- Family Mode KinfolkAI wiring is a prerequisite, not optional
- Must not bundle: Business KinfolkAI 6-engine structure (different trust phase)
- Requires new mobile binary: YES (voice settings UI)

**Build 102 (Verification):**
- Should NOT bundle with any new KinfolkAI or Life Journey features — verification is isolated and risky; ship alone
- Requires founder decisions before implementation: vendor selection, badge wording, retention period
- Requires legal review: BIPA/CUBI compliance before implementation begins

**Build 103 (Life Journeys):**
- This is the largest single build in the roadmap — scope discipline is critical
- Recommend splitting: 103-A (Life Chapters + My Story) and 103-B (Cultural Journeys + city-as-container) if scope proves unmanageable
- First-cohort community layers require community reviewers confirmed and consulted before build begins — not during
- Business KinfolkAI 6-engine and Cultural Journey can be batched only if Build 103 is split appropriately
- Requires founder decisions: first-cohort community reviewer identities; Cultural Journey privacy model; briefing cadence

**Build 105 (Ambassador):**
- "From the Community" video pipeline is high-risk (media handling, consent, moderation) — do not bundle with Living Legacy nominations; ship separately if needed
- Ambassador compensation model must be decided BEFORE the ambassador portal ships (showing a dashboard without knowing compensation creates expectations)

---

## SECTION 5 — TRACEABILITY TABLE

| Capability | Current state | Assigned build | Source document | Founder decision needed | Dependency | User-visible outcome |
|---|---|---|---|---|---|---|
| Community Member persistent label | Partially built | 97 | BUILD_97_SCOPE_AND_ROADMAP.md OUTPUT 2/7 | None | Trust Level 1 exists | "Community Member" on every profile |
| 5-question personalization | Built in spec; not yet in Store | 97 | BUILD_97_SCOPE_AND_ROADMAP.md OUTPUT 8 | None | user_preferences exists | Personalization onboarding on registration |
| Platform language corrections | Partially done | 97/98 | BUILD_97_SCOPE_AND_ROADMAP.md OUTPUT 9 | None (in principle) | None | No "Black-owned" as universal default |
| Maps regression | Fix known issues | 97 | BUILD_97_SCOPE_AND_ROADMAP.md OUTPUT 10 | None | None | Map works on production iOS + Android |
| HBCU horizontal strip | Removed Build 95 | 98 | post-build95-roadmap.md | None | Build 97 stable | Compact HBCU strip on map tab |
| Tuskegee attribution correction | Not corrected | 98 | Memory: kinfolk-constitution-decisions.md | APPROVED today | Build 97 | Correct CDC attribution in KinfolkAI |
| "Minority" registry corrections | Not corrected | 98 | kinfolk-constitution-decisions.md | Approved in principle — each instance requires review | Build 97 | Historically accurate language |
| Multi-role profiles | Not implemented | 98 | BUILD_97_SCOPE_AND_ROADMAP.md OUTPUT 17 Phase 2 | Community Org eligibility types | Build 97 | One account holds multiple roles |
| "Things You'll Hear" | Not implemented | 99 | kinfolk-cultural-intelligence-model.md | None | Build 97 | Teaching format in 36-city registry |
| "Things Locals Appreciate" | Not implemented | 99 | kinfolk-cultural-intelligence-model.md | None | Build 97 | Respect cues in 36-city registry |
| Living Legacy submission | FSR-001 PARTIALLY BUILT | 99 | FSR-001 | None | Build 98 (contribution ecosystem) | Heritage stories submitted and archived |
| Saved heritage places | FSR-010 PROPOSED | 99 | FSR-010 | None | Build 97 | Save a heritage site to profile |
| Curiosity Lists | Not implemented | 99 | kinfolk-lifelong-companion-vision.md | None | Build 97 | "Things I Want To Learn" list |
| Three-setting voice decoupling | Not implemented (aave_level bundled) | 100/101 | kinfolk-constitution-decisions.md, kinfolk-cultural-intelligence-model.md | APPROVED today (all three names confirmed) | Build 99 | Independent Community Voice / Cultural Language / Profanity settings |
| Family Mode KinfolkAI wiring | Not wired | 100/101 | kinfolk-constitution-decisions.md | APPROVED today (non-negotiable) | Build 100 voice settings | Family Mode overrides all voice settings |
| Code-switching | Not implemented | 100/101 | kinfolk-constitution-decisions.md | APPROVED today (Always / Ask me / Never) | Build 100 | Kinfolk shifts register by context |
| KinfolkAI memory management | Not implemented | 100/101 | BUILD_97_SCOPE_AND_ROADMAP.md Phase 4 | Retention period, memory depth by tier | Build 99 | Member controls what Kinfolk remembers |
| voiceMode persistence | Not persisted | 100/101 | kinfolk-cultural-intelligence-model.md | None | Build 100 | Voice settings survive app restart |
| Third-party verification | Not implemented | 102+ | BUILD_97_SCOPE_AND_ROADMAP.md OUTPUT 14/15 | Vendor selection, consent framework | Phase 2 + vendor evaluation | Community Verified badge on profile |
| Life Chapters / My Story | Not implemented | 103 | kinfolk-life-chapters-model.md | None | Build 100/101 | My Story with Chapter containers |
| Cultural Journeys | Not implemented | 103 | kinfolk-lifelong-companion-vision.md, kinfolk-constitution-decisions.md | First-cohort reviewers | Phase 4 | Explore Cultures section in Library |
| City-as-container (community layers) | Not implemented | 103 | kinfolk-cultural-intelligence-model.md | Community reviewers per city | Phase 4 | Stackable community layers on map + city |
| "If this is your first time..." | Not implemented | 103 | kinfolk-lifelong-companion-vision.md | None | Build 103 Cultural Journeys | Welcome section in every community profile |
| Cultural Passport | Not implemented | 103 | kinfolk-lifelong-companion-vision.md | None | Build 103 | Moments collected (First HBCU, First Powwow...) |
| Business KinfolkAI 6 engines | Not implemented | 103 | BUILD_97_SCOPE_AND_ROADMAP.md Phase 6 | Briefing cadence, voice tone opt-in | Phase 4 | Intelligence Briefings for business owners |
| Journey Ambassadors | Not implemented | 103 | kinfolk-community-intelligence.md | None | Build 103 Life Chapters | Chapter completion → Journey Ambassador invitation |
| Pay It Forward Moment | Not implemented | 105 | kinfolk-life-chapters-model.md | None | Build 103 | Graduation/completion → message for next journey |
| "From the Community" videos | Not implemented | 105 | kinfolk-constitution-decisions.md | APPROVED today (ownership model, consent, review) | Build 105 | Real people in every community profile |
| Cultural Ambassador 7-engine portal | Not implemented | 105 | BUILD_97_SCOPE_AND_ROADMAP.md Phase 8 | Compensation model, qualification criteria | Phase 5 (may require Verified) | Full Ambassador operating system |
| Community Impact Report | Not implemented | 105 | kinfolk-community-intelligence.md | None | Build 105 | Ambassador sees impact, not vanity metrics |
| Opportunity AI for creators | Not implemented | 105 | kinfolk-community-intelligence.md | None | Build 105 | "Your community has been asking about..." |
| Living Community Feed (full, 4 layers) | Not implemented | 106+ | COMMUNITY_UNDERSTANDING_AND_LIVING_FEED.md | None | Phase 9 | Real-time community pulse |
| Invisible Architecture implementation | Specs complete (trade secret) | 106+ | invisible-architecture-spec-state.md | Yes — phased implementation plan | Phase 9 | Platform intelligence without visible algorithm |
| Historical Sundown Towns | 9 gates not cleared | BLOCKED | BUILD_97_HISTORICAL_SUNDOWN_TOWNS_AUDIT.md | Yes — all 9 gates | Community review complete | Sensitive historical mapping feature |
| "Mardi Gras Indians" correction | Not corrected | BLOCKED | kinfolk-constitution-decisions.md | New Orleans community review required | Community review | Correct terminology in travel.ts |
| Asian diaspora communities (7) | Deferred to memory | PLACEMENT REQUIRES FOUNDER APPROVAL | kinfolk-excluded-diaspora-cohorts.md | Yes — separate founder session | First cohort complete | 7 communities with proposed city hubs |
| MENA and immigrant communities | Not in registry | PLACEMENT REQUIRES FOUNDER APPROVAL | kinfolk-cultural-intelligence-model.md | Yes | First cohort complete | Community layers for MENA diaspora |
| Economic impact measurement | Not implemented | 106+ | BUILD_97_SCOPE_AND_ROADMAP.md Phase 9 | Yes — measurement methodology | All phases | Platform-wide community economic impact |
| Pricing evolution | Deferred | 6+ months post-launch | FOUNDATION_BUILD_STRATEGY.md | Yes — outcomes-based pricing model | Post-launch evidence | Evidence-based membership pricing |

---

## SECTION 6 — FOUNDER DECISIONS REQUIRED

### Decisions Required Before Build 97 Passes (or Apple Approval Received)

*These are the Wave verifications outstanding per Launch Readiness Dashboard v0.3. No code changes required — founder verification of implemented waves.*

| Decision | Type | Notes |
|---|---|---|
| Verify Wave 1-A (auth hardening) — confirm lockout message is helpful, not alarming | Implementation approval | Human test only |
| Verify Wave 3-A (CRON_SECRET fail-closed) — confirm CRON_SECRET set in Railway production | Process confirmation | Check Railway env before this is production-safe |
| Verify Wave 3-B (CAN-SPAM) — confirm email footer content is correct | Content approval | Human review of email footer |
| Verify Wave 3-C (Stripe idempotency) — confirm test-mode webhook verification | Implementation approval | Stripe test mode test |
| Verify Wave 3-D (RevenueCat server-side verification) — confirm real RC test purchase works | Implementation approval | iOS test purchase |
| Google Maps API key restriction on Android (Google Cloud Console) | Founder action in Google Cloud Console | Required before Android VC71 is usable |

### Decisions Required Before Build 98 Implementation

| Decision | Type | Notes |
|---|---|---|
| Community Organization eligible types (nonprofit only? informal groups? faith organizations?) | Policy | Define before org role ships |
| "Minority" corrections: founder review of each flagged instance in CITY_VOICES | Cultural review | ~10 instances; each requires specific replacement text |
| Cultural Ambassador qualification criteria (application vs. invitation model) | Product | AUDIT-009 scope; drives Build 98 Ambassador entry design |
| HBCU alumni data sourcing approach | Data | Determines how alumni stories are populated |

### Decisions Required Before Build 99 Implementation

| Decision | Type | Notes |
|---|---|---|
| Mentorship tier limits | Product | Which tiers can be mentors / mentees |
| Cultural Ambassador review process (Layer Two language contributions) | Governance | Minimum reviewers per phrase; expiration cadence |
| Minimum community signal threshold before phrase enters Layer Two | Algorithm | Community Signal Strength Standard provides framework |
| Heritage nomination cultural review process | Governance | Who reviews before Living Legacy stories are published |
| Living Legacy content ownership model (creator owns / platform license) | Legal | FOUNDER APPROVED today — confirm for implementation |

### Decisions Required Before Build 100/101 Implementation

| Decision | Type | Notes |
|---|---|---|
| Chat history retention period (how long kinfolk_sessions persisted) | Privacy/legal | Feeds memory deletion policy |
| Maximum memory depth by tier (Community Member vs. Navigator vs. Trailblazer) | Product | How much Kinfolk remembers per tier |
| Minimum platform age (does it gate aave_level or Cultural Language?) | Safety/legal | Platform-age policy needed before teen account safeguards |
| Age/AAVE interaction: cap for teen accounts | Safety | Family Mode handles minors; teen policy separate |

### Decisions Required Before Build 102 (Verification)

| Decision | Type | Notes |
|---|---|---|
| Final vendor selection (Stripe Identity vs. Veriff) | Vendor | Requires live pricing, Expo SDK test, consent review, international coverage |
| Badge exact wording ("Community Verified" — confirm) | Product | Feeds UI and legal copy |
| Verification data retention period | Legal | BIPA/CUBI minimum before implementation |
| What member sees if provider is unavailable | UX | Graceful degradation spec |

### Decisions Required Before Build 103 Implementation

| Decision | Type | Notes |
|---|---|---|
| First-cohort community reviewer identities (one per community layer) | Governance | Non-negotiable before any community layer goes into registry |
| Cultural Journey privacy model (exploration history opt-in confirmed) | Privacy | APPROVED today — confirm for technical spec |
| Business Intelligence Briefing cadence (weekly?) | Product | Drives Briefing generation route design |
| Business Intelligence Briefing opt-in vs. default | Product | Affects whether business owners see it immediately |
| Voice tone learning opt-in mechanism | UX | Explicit consent before Kinfolk learns writing style |
| Public Circles (opt-in discovery of Circles) — yes or no? | Product | Gates Circles navigation design |
| Journey Ambassador compensation or recognition model | Business | Cannot launch Ambassador portal without this |
| Historical Sundown Towns: all 9 pre-implementation gates (see AUDIT document) | Cultural/legal | BLOCKED until all 9 cleared |

### Decisions That May Wait Until Real User Data Exists

| Decision | Type | Notes |
|---|---|---|
| Pricing evolution (outcomes-based, usage-based) | Business | APPROVED today: defer until 6 months post-launch minimum |
| Economic impact measurement methodology | Platform | Requires post-launch usage patterns |
| Population-scale weighting algorithms | Algorithm | Invisible Architecture specs provide framework; application requires real data |
| KinfolkAI proactivity governance (how often Kinfolk reaches out proactively) | Product | FSR-049 — requires real engagement data |

### Decisions Requiring Legal, Cultural, Safety, or Privacy Review

| Decision | Type | Notes |
|---|---|---|
| "Mardi Gras Indians" correction in travel.ts | Community cultural review | New Orleans community reviewers must be identified and consulted |
| Historical Sundown Towns: all 9 gates | Cultural/legal/safety | See BUILD_97_HISTORICAL_SUNDOWN_TOWNS_AUDIT.md — no implementation until all 9 cleared |
| Biometric data compliance (Stripe Identity) | Legal | BIPA (Illinois), CUBI (Chicago) minimum; more states depending on member geography |
| Oral history release form | Legal | Required before Build 105 Living Legacy oral histories |
| Cultural content ownership policy | Legal | Creator owns / MWM license — framework approved today; formal legal review needed |
| Asian diaspora communities (7 deferred) | Cultural | Separate founder session required; distinct community sensitivities per community |

---

## SECTION 7 — EXECUTIVE TABLE

| Build | Trust Phase | Primary Outcome | Main Capabilities | Founder Decisions Outstanding | Key Dependencies | Release Type | Current Readiness |
|---|---|---|---|---|---|---|---|
| **97** | Phase 1 — Can people trust the app? | Community Member identity, stable map, no crashes | Community Member label, 5-Q personalization, auth regression, map/heritage regression, platform language corrections | Wave verifications (Wave 1-A, 3-A, 3-B, 3-C, 3-D founder sign-off); Google Maps API key (Android) | Apple Build 96 approval; PR #13 Railway merge | iOS + Android + Backend | In Apple review. Android VC71 in EAS queue. |
| **98** | Phase 2 — Can people trust their identity? | Multi-role accounts, HBCU restored, language corrected | Business Owner role on profile, HBCU horizontal strip, inclusive-language sweep, multi-role profiles, Tuskegee/Minority corrections | Community Org eligibility types; "Minority" instance review; Cultural Ambassador qualification criteria | Build 97 approval | iOS + Android | Designed but not implemented |
| **99/100** | Phase 3 — Can people trust each other? | Contribution ecosystem, trust progression | Living Legacy submissions, "Things You'll Hear," Saved Heritage Places, Structured Mentorship, Curiosity Lists | Mentorship tier limits; Layer Two review process; HBCU alumni data sourcing; Living Legacy content ownership | Build 98 complete | iOS + Android + Backend | FSR-001/002/003 partially built. Others future-state. |
| **100/101** | Phase 4 — Can people trust Kinfolk? | KinfolkAI speaks authentically and explains itself | Three-setting voice decoupling (APPROVED), Family Mode wiring (APPROVED), code-switching (APPROVED), KinfolkAI memory management, recommendation explanation | Chat history retention; memory depth by tier; minimum platform age; teen account policy | Build 99 complete | iOS + Android + Backend | Not implemented. Founder decisions confirmed today. |
| **102** | Phase 5 — Verification capability | Verified Community Member via third-party | Provider-hosted identity verification, Community Verified badge, consent framework, deletion rights | Vendor selection; badge wording; data retention; unavailability UX | Phase 2 complete; vendor evaluation | iOS + Android + Backend | Backend/screen built, hidden. No vendor. |
| **103** | Phase 6 — Can businesses + communities trust Kinfolk? | Life Chapters, Cultural Journeys, city-as-container, Business Intelligence | My Story, Life Chapters, Cultural Journeys (first cohort), community layers on map, Business KinfolkAI 6 engines, Journey Ambassadors, Pay It Forward | First-cohort community reviewers; Briefing cadence/opt-in; voice tone opt-in; Public Circles yes/no; Ambassador recognition model | Phase 4 complete; community reviewers confirmed | iOS + Android + Backend + Data/content | Future-state only |
| **104** | Phase 7 — Real-world connection | Kinfolk Circles fully launched | Circles in main navigation, Circle privacy controls, AI curation modes, meetup safety guidelines | Public Circle discovery | Phase 5; Phase 3 data | iOS + Android | Built (6 DB tables + screens), hidden from nav |
| **105** | Phase 8 — Can Ambassadors trust Kinfolk? | Cultural Ambassador full operating system, Living Legacy | Ambassador 7-engine portal, "From the Community" videos, Community Impact Report, Pay It Forward full cycle, Opportunity AI for Ambassadors | Ambassador compensation; oral history release form; cultural content ownership (legal) | Phase 5 (Verified may be required); Phase 3 | iOS + Android + Backend + Data/content | FSR-003 partially built. Rest future-state. |
| **106+** | Phase 9 — Can communities trust Kinfolk? | Full Community Operating System | Real-time cultural feeds, cross-role KinfolkAI coordination, economic impact measurement, full Living Community Feed, Invisible Architecture initial implementation | Economic impact methodology; pricing evolution (post-launch data required) | All phases | Mixed release | Future-state only (Invisible Architecture specs complete as trade secrets) |

---

## SECTION 8 — FINAL CONFIRMATION

**1. Total future capabilities accounted for:** 189 capabilities across Sections 3A–3I and the traceability table in Section 5.

**2. Total builds / phases documented:** 9 builds (Build 97 through Build 106+) across 9 trust phases.

**3. Capabilities with confirmed placement:**
- Build 97: 31 capabilities (current release baseline + Build 97 scope)
- Build 98: 18 capabilities
- Build 99/100: 22 capabilities
- Build 100/101: 19 capabilities (voice decoupling, memory, Family Mode wiring)
- Build 102: 12 capabilities (verification)
- Build 103: 47 capabilities (Life Chapters, Cultural Journeys, city-as-container, Business Intelligence, Journey Ambassadors)
- Build 104: 6 capabilities (Circles launch)
- Build 105: 19 capabilities (Ambassador full system, Living Legacy, Pay It Forward)
- Build 106+: 15 capabilities (Full Community Orchestration, Invisible Architecture)

**4. Capabilities awaiting founder placement:**
- Historical Sundown Towns: BLOCKED — 9 gates not cleared (BUILD_97_HISTORICAL_SUNDOWN_TOWNS_AUDIT.md)
- "Mardi Gras Indians" correction: BLOCKED — community review required before any change
- Asian diaspora communities (7 deferred groups): PLACEMENT REQUIRES FOUNDER APPROVAL — separate session needed
- MENA and immigrant communities: PLACEMENT REQUIRES FOUNDER APPROVAL
- Ambassador compensation/recognition model: assigned to Build 105 but model not yet decided
- Economic impact measurement methodology: assigned to Build 106+ but methodology not yet decided
- Pricing evolution: assigned to 6 months post-launch but model not yet decided

**5. Founder decisions required before the next build (Build 98):**
1. Verify Wave 1-A, 3-A, 3-B, 3-C, 3-D (human sign-off on implemented waves)
2. Google Maps API key restriction correction in Google Cloud Console (Android VC71)
3. "Minority" instance review — each flagged entry in CITY_VOICES reviewed by founder and replaced with specific correct language
4. Community Organization eligible types defined
5. Cultural Ambassador qualification criteria defined (application vs. invitation)

**6. Any documented capability that could not be located:**
- The following capabilities from the request appear ONLY in today's session documents (no prior code, schema, or design). They are real, documented, and assigned to Build 103 or later:
  - My Story, Life Chapters, Life Chapter hierarchy (Chapters → Journeys → Moments → People)
  - Cultural Journeys / "Explore Cultures" feature (distinct from existing Topic Library)
  - My Passport (Cultural Passport with First moments)
  - Curiosity Lists ("Things I Want To Learn")
  - "If this is your first time..." section standard
  - Pay It Forward Moment (on Chapter completion)
  - Journey Ambassadors (distinct role from Cultural Ambassadors)
  - Opportunity AI / My Community Pulse for creators
  - Community Intelligence ecosystem (user-facing — distinct from Invisible Architecture trade secrets)
  - KinfolkAI opening line context-awareness (first/second/third visit differentiation)
  - No-gamification principle as a formal design standard

**7. Whether anything discussed today was omitted:**
Everything from today's session has been captured and assigned. Specific items saved to memory today and reflected in this inventory:

| Today's topic | Memory file | Build assigned |
|---|---|---|
| City-as-container, community layers, interest filters, governance standard | kinfolk-cultural-intelligence-model.md | Build 103 |
| Camera metaphor, corrected mental model, city as complete world | kinfolk-cultural-intelligence-model.md | Every build (design principle) |
| Two permanent registry layers (Founding + Living Community) | kinfolk-cultural-intelligence-model.md | Build 99 (Layer Two pipeline) |
| Three-setting voice decoupling | kinfolk-constitution-decisions.md | Build 100/101 |
| Profanity never tied to membership tier | kinfolk-constitution-decisions.md | Build 100/101 |
| "From the Community" governance (owner, consent, review, never auto-publish) | kinfolk-constitution-decisions.md | Build 105 |
| Cultural Journey opt-in only (Spotify Wrapped model) | kinfolk-constitution-decisions.md | Build 99 (tracking), Build 103 (feature) |
| Cultural Ambassador definitions (not celebrities, multiple reviewers required) | kinfolk-constitution-decisions.md | Build 102 prep, Build 105 |
| "Things You'll Hear" vs. Local Terms (two layers, both exist) | kinfolk-constitution-decisions.md | Build 99 |
| Code-switching (Always / Ask me / Never — onboarding choice) | kinfolk-constitution-decisions.md | Build 100/101 |
| Opening line (first/second/third visit) | kinfolk-constitution-decisions.md | Build 100/101 |
| "Minority" → historically accurate corrections | kinfolk-constitution-decisions.md | Build 98 |
| Tuskegee attribution | kinfolk-constitution-decisions.md | Build 98 |
| Family Mode override (non-negotiable) | kinfolk-constitution-decisions.md | Build 100/101 |
| First cohort priority order (10 cities/communities) | kinfolk-constitution-decisions.md | Build 103 |
| Kinfolk as lifelong cultural companion | kinfolk-lifelong-companion-vision.md | Every build (identity) |
| Cultural Journeys invitation cards, 12 pathways | kinfolk-lifelong-companion-vision.md | Build 103 |
| "If this is your first time..." | kinfolk-lifelong-companion-vision.md | Build 103 |
| My Journey / My Passport / Curiosity Lists | kinfolk-lifelong-companion-vision.md | Build 103 |
| No-gamification principle | kinfolk-lifelong-companion-vision.md | Every build (design principle) |
| Nothing expires | kinfolk-lifelong-companion-vision.md | Every build (design principle) |
| Businesses as teachers (owner opt-in) | kinfolk-lifelong-companion-vision.md | Build 103 |
| Library → Discovery evolution | kinfolk-lifelong-companion-vision.md | Build 99 (initial), Build 103 (full) |
| Life Chapters hierarchy | kinfolk-life-chapters-model.md | Build 103 |
| Journey filter ("5 years from now?") | kinfolk-life-chapters-model.md | Build 103 |
| My Story (replaces My Journey) | kinfolk-life-chapters-model.md | Build 103 |
| Pay It Forward Moment | kinfolk-life-chapters-model.md | Build 105 |
| Journeys evolve not end | kinfolk-life-chapters-model.md | Build 103 |
| Platform success metric (growth/connection/contribution) | kinfolk-life-chapters-model.md | Every build (governance) |
| Two ambassador roles (Cultural vs. Journey) | kinfolk-community-intelligence.md | Build 103 (Journey), Build 105 (Cultural full) |
| Kinfolk as Opportunity AI | kinfolk-community-intelligence.md | Build 105 |
| Creator dashboard: External Reach + Community Impact | kinfolk-community-intelligence.md | Build 105 |
| Community Intelligence ecosystem (Members → Questions → Kinfolk → Needs → Voices → Stories) | kinfolk-community-intelligence.md | Build 103 (initial), Build 106+ (full) |
| Transparency principle (Kinfolk always explains WHY) | kinfolk-community-intelligence.md | Build 100/101 (KinfolkAI), Build 103 (Community) |
| "Algorithms chase engagement. Kinfolk cultivates contribution." | kinfolk-community-intelligence.md | Every build (governance principle) |
| Master governance principle (verbatim) | kinfolk-constitution-decisions.md | Every build (governance) |
| Anti-impersonation principle | kinfolk-constitution-decisions.md | Every build (KinfolkAI design) |

---

*This document is read-only. No implementation is authorized by this document.*  
*Authorization phrase: "Please implement." — applies per build, not to the whole document.*  
*Next review: After Build 97 Apple approval.*
