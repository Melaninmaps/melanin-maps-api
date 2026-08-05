# Community Entrepreneur & Integrity Framework — Gap Analysis
**Spec source:** MWM_Integrity_Partnership_Framework.md
**Date:** August 5, 2026
**Method:** Live codebase inspection (schema files, routes, mobile screens)

---

## Summary

| Feature Area | Status | Priority |
|---|---|---|
| Community Entrepreneur tier (business entity) | ❌ MISSING | P0 |
| Type A / Type B safety report distinction | ❌ MISSING | P0 (Task #80 covers reporter protection only) |
| Dual trust scores (Visitor + Employer) | ❌ MISSING | P0 |
| Business profile 4-layer card hierarchy | 🟡 PARTIAL | P1 |
| Partnership pipeline for Allied businesses | ❌ MISSING | P1 |
| CE search/discovery separation | ❌ MISSING | P0 (depends on CE tier) |
| CE abuse prevention guardrails | ❌ MISSING | P1 (depends on CE tier) |
| CE talent pipeline (Kinfolk AI → jobs) | 🟡 PARTIAL | P1 |
| Social media feed embedding | 🟡 PARTIAL | P2 |
| Diaspora trust weighting system | ❌ MISSING | P2 |
| Direct Commerce layer | ❌ MISSING | P2 |

---

## Detailed Findings

### 1. Community Entrepreneur Tier — ❌ MISSING

**What the spec requires:**
- A distinct business entity type (CE) — separate from Verified Business and External Reference
- Free listing, always
- CE-specific registration flow with "Tell your community why you do this" story prompt
- CE profile: 1 intro video, limited photo gallery, social media links, pop-up announcements
- CE marketplace placement (not in main business search)
- Upgrade journey with Kinfolk AI celebrating milestones
- All history carries forward on upgrade

**What's built:**
- `businesses.verified` (boolean) — basic on/off verification ✓
- `businesses.isReferenceOnly` + `referenceCategory` — External Reference tier exists ✓
- `businesses.marketplaceTier` varchar (default "free") — a tier concept exists but is used for marketplace fee tiers, not the CE vs Verified distinction
- `community_listings` table — generic peer-to-peer marketplace posts by users, NOT CE business profiles

**Gap:** No `businessTier` enum distinguishing `community_entrepreneur` | `verified_business` | `external_reference`. The `community_listings` table serves a different purpose (user-to-user trading). There is no CE-specific registration flow, no story prompt, no CE profile screen, no pop-up announcement feature, and no Kinfolk upgrade prompts for CE growth signals.

---

### 2. Type A / Type B Report Distinction — ❌ MISSING

**What the spec requires:**
- **Type A (Visitor/Customer):** 2 independent reports within 60 days → 7-day delay → affects public Visitor Safety Score
- **Type B (Employee/Workplace):** 3+ reports over 90 days → 30-60 day delay → private Employer Trust Score only
- Reporter identity hashing (one-way)
- Retaliation detection
- Team size protection (< 10 employees → 5+ reports required)
- Geographic fuzzing for Type B (brand level, not location level)
- Report submission flow: "How did you experience this?" as first question

**What's built:**
- `content_reports` table with `targetType` enum (`review | survey | business | post | user`) and generic `reason` enum
- No `reportType` field (A vs B)
- No aggregation threshold logic
- No time-delay visibility system
- No reporter identity hashing
- No retaliation detection
- No team size awareness

**Note:** Task #80 ("Protect employees who report workplace discrimination from being traced back by their employer") is in the queue and covers the reporter protection side of Type B. The Type A/B separation, dual score system, and aggregation thresholds are broader and not yet captured.

---

### 3. Dual Trust Scores — ❌ MISSING

**What the spec requires:**
- `visitorTrustScore` — public, affected by Type A reports, affects search ranking
- `employerTrustScore` — private (job-seekers only), affected by Type B reports, does NOT affect visit/shop visibility
- Graduated response system (Levels 1-5) with human review gate at Levels 3-5

**What's built:**
- `businesses.safetyRating` numeric — a single rating, not split
- `businesses.confidenceScore` — platform confidence metric
- No `employerTrustScore` column
- No Level 1-5 graduated response system
- No human review gate for score changes

---

### 4. Business Profile Card — 4-Layer Hierarchy — 🟡 PARTIAL

**What the spec requires:**
- Layer 1 — Business's own story (video + photos, uploaded to MWM)
- Layer 2 — Community voice (aggregated endorsements, "1,001 people said...")
- Layer 3 — Cultural Ambassador content (embedded creator videos/posts)
- Layer 4 — Outbound link (handoff to business website or Direct Commerce)

**What's built:**
- `businesses.ownerStory`, `businesses.videos`, `businesses.photos` ✓ (Layer 1 data exists)
- Reviews, endorsements (`reviewCount`, `rating`) ✓ (Layer 2 data exists)
- `creator_profiles` table, ambassador content routes exist ✓ (Layer 3 data partially exists)
- `businesses.website` ✓ (Layer 4 link exists)

**Gap:** The 4-layer hierarchy is not enforced as a UX structure in the business profile card. Ambassador content (Layer 3) is not embedded directly on business cards. Direct Commerce (Layer 4 premium path) is completely missing. The profile card shows data but not in this deliberate sequential hierarchy.

---

### 5. Partnership Pipeline for Allied Businesses — ❌ MISSING

**What the spec requires:**
- Stage 1: Community addition (passive, never contacted)
- Stage 2: Data accumulation (views, clicks, saves, mentions tracked)
- Stage 3: Threshold reached (500+ click-throughs OR 100+ saves OR 50+ direction requests)
- Stage 4: Admin-initiated outreach pitch
- Stage 5: Active partner (analytics dashboard access, fee-based)

**What's built:**
- `businesses.profileStatus` varchar (`community_listed | claimed | participating`) — closest analog
- `external_click_events` table — click tracking exists ✓
- No partner stage pipeline
- No threshold detection logic
- No admin pipeline dashboard

---

### 6. CE Search / Discovery Separation — ❌ MISSING

**What the spec requires:**
- Search results: Verified Businesses first, Community Entrepreneurs clearly separated below
- Each CE card shows "Community Entrepreneur" label
- CE not in main search by default — discoverable via specific queries ("home cooked meals near me")
- Marketplace filter: "Community Entrepreneurs only" vs "Verified Businesses only"

**What's built:**
- Search routes exist but no tier-based result separation
- No CE-specific section header in search results
- No CE filter in marketplace

---

### 7. CE Abuse Prevention Guardrails — ❌ MISSING

**What the spec requires:**
- Detect: multiple locations, employee profiles, wholesale inventory (5,000 items), franchise behavior
- Kinfolk AI prompt to upgrade if detected
- Admin review if CE refuses upgrade while operating at business scale

**What's built:**
- Nothing — no guardrail logic exists for CE tier limits

---

### 8. CE Talent Pipeline — 🟡 PARTIAL

**What the spec requires:**
- Kinfolk AI monitors CE marketplace reviews and endorsements
- When CE hits growth signal (e.g., 50 glowing reviews), Kinfolk connects them to relevant job opportunities
- Bidirectional: prompts both the business seeking talent AND the CE

**What's built:**
- Kinfolk AI exists with job matching routes ✓
- Job listings and mentorship profiles exist ✓
- No specific logic connecting CE marketplace review milestones to talent recommendations

---

### 9. Social Media Feed Embedding — 🟡 PARTIAL

**What the spec requires:**
- TikTok and Instagram feeds embedded directly on CE/External Reference profiles
- Click-through tracking to demonstrate value to creators
- Never rehost content; drive traffic TO creators' pages

**What's built:**
- `businesses.instagram`, `.tiktok`, `.facebook` etc. link fields ✓
- `external_click_events` tracking ✓
- No embedded feed rendering (would require TikTok/Instagram embed APIs)

---

### 10. Diaspora Trust Weighting — ❌ MISSING

**What the spec requires:**
- Trust tiers: Owner > Family > Visited > Community Recommended (requires 2+ confirmations)
- Privacy controls: LGBTQIA+ tags hidden in risky regions for non-matching users
- Anonymous contribution option

**What's built:**
- `businesses.diasporaCountries` jsonb field ✓
- No trust weighting tiers on international submissions
- No region-aware privacy for sensitive safety tags

---

### 11. Direct Commerce Layer — ❌ MISSING

**What the spec requires:**
- In-app service booking, excursion booking, event tickets, reservations
- Verified Businesses only (opt-in)
- "My Bookings" persistent record with Kinfolk reminders
- Safety integration: itinerary sharing with Circle, venue safety tips
- Small transaction fee (platform revenue model)

**What's built:**
- Nothing — no in-app transaction or booking flow exists

---

## What Is Already Consistent With the Spec

| Spec Principle | Built Status |
|---|---|
| Minority-owned businesses shown first | ✓ Yes — sort order prioritizes ownership designations |
| Allied/External Reference never contacted when added | ✓ Yes — `isReferenceOnly` flag prevents outreach |
| Click-through tracking for allied business engagement | ✓ Yes — `external_click_events` table |
| Community-sourced business nominations | ✓ Yes — `business_nominations` table |
| Reporter identity privacy (basic) | ✓ Yes — reports stored without public attribution |
| "Accountability Without Surveillance" data principles | ✓ Yes — all collection is opt-in with stated purpose |
| Section 230 language ("community members have shared concerns") | ✓ Yes — copy follows platform-not-publisher pattern |
| Onboarding data feeding Kinfolk AI | 🟡 Partial — stored but pipeline depth varies |

---

## Implementation Priority Order

1. **Community Entrepreneur tier** — foundational; blocks CE search, CE guardrails, CE talent pipeline
2. **Dual trust scores + Type A/B report system** — high safety impact; Task #80 is the entry point
3. **Partnership pipeline** — medium complexity, admin-side feature
4. **Business profile 4-layer hierarchy** — UX refactor, lower risk
5. **Direct Commerce** — largest engineering effort, defer until CE and trust systems are stable
