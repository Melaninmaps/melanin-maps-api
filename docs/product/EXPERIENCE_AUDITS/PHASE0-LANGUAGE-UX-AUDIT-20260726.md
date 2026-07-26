# Phase 0 — Platform Language & UX Audit

| Field | Value |
|-------|-------|
| **Audit ID** | AUDIT-003 |
| **Area** | Platform-wide Language & UX Copy |
| **Date** | July 26, 2026 |
| **Phase** | 0 — Read-Only Language Audit |
| **Status** | COMPLETE — findings delivered for founder review |
| **Scope** | Mobile app, web app, API, system prompts |
| **Code changes made** | None |

---

## Audit Methodology

Systematic read of every file in:
- `artifacts/mobile/app/` — all mobile screens
- `artifacts/mobile/components/` — all UI components
- `artifacts/web/src/pages/` — all web screens
- `artifacts/api-server/src/routes/` — error messages and AI system prompts
- `lib/db/src/schema/` — seed data and default query strings

Findings organized by severity: HIGH (immediate attention), MEDIUM (important before public launch), LOW (improvement opportunity).

---

## HIGH — Immediate Attention Required

---

### H-001 — "Black-owned" as Default Platform Language in Smart Pathways

**Location:** `lib/db/src/schema/smart-pathways.ts`
**Specific lines:** 44, 67, 100, 114, 120, 132, 175, 187, 198

**Finding:**
Multiple pre-seeded KinfolkAI pathways use "Black-owned" as the generic default query language, without user verification or intent:

```
"What Black-owned businesses are in this area?"
"What are the best Black-owned restaurants here?"
"Plan your itinerary with Black-owned stays, restaurants, and attractions"
"Finding Black-owned businesses"
"What are the best Black-owned spots for food?"
"What Black-owned businesses are in this area?"  (duplicate)
"Which area has more Black-owned businesses?"
"Find Black-owned employers"
"Are there Black-owned companies hiring here?"
```

**Why this matters:**
These are suggested or default prompts — they activate without the user having verified their identity, stated a preference, or explicitly requested Black-owned results. They apply "Black-owned" as an automatic generic default across business discovery, travel planning, employer search, and itinerary building.

Per the Platform Language Rule (permanent): "Do not use 'Black-owned' as the automatic generic default. Use specific demographic language only when supported by user intent, preferences, verified identity, or the cultural subject."

**Required decision:**
These pathways should use culturally inclusive language as the default ("minority-owned businesses," "community businesses," "culturally relevant spots") and only use "Black-owned" when the user's saved identity preference explicitly includes it.

**No code change made. This requires "Please implement."**

---

### H-002 — SEO Meta Description Applies "Black-owned" to Every Business Detail Page

**Location:** `artifacts/web/src/pages/business-detail.tsx`, line 197

**Finding:**
```typescript
const description = `${business.category} in ${business.city}${business.state}. Discover Black-owned businesses on Mapping With Melanin™.`;
```

This meta description is applied to EVERY business detail page — including businesses that are not Black-owned, not yet verified, or may belong to other minority communities. A search engine result for a Hispanic-owned business would read "Discover Black-owned businesses."

**Additionally on line 481:**
```typescript
"This business is part of our verified network of Black-owned enterprises, supporting economic empowerment."
```
If this text is shown for every business in the verified network, it applies "Black-owned" to businesses that may not be Black-owned.

**Required decision:**
SEO meta should use: "Discover minority-owned and culturally significant businesses on Mapping With Melanin™." The verified badge copy should reflect the actual verified designation of each business, not a blanket "Black-owned" label.

**No code change made. This requires "Please implement."**

---

### H-003 — "Black-Owned — First & Always" as the First Onboarding Identity Option

**Location:** `artifacts/mobile/app/onboarding/identity.tsx`, line 38

**Finding:**
```typescript
{ id: "black-owned", emoji: "✊🏾", label: "Black-Owned", sub: "Black-owned businesses — first & always" }
```

The screen prompt is "Who Do You Want to Support?" — so this IS an active user preference selection, not a platform-imposed default. The user is choosing what they want.

However, three elements need attention:

1. **Position:** "Black-Owned" is listed FIRST. In a preference-selection grid, the first item carries implicit primacy. If all other designations are equal and can be multi-selected, the first position is a product statement.

2. **Sub-text:** "Black-owned businesses — first & always" reads as a platform promise or default commitment, not a user-chosen preference. It implies Black-owned will be surfaced first across the entire app, regardless of context.

3. **Emoji:** The ✊🏾 emoji is a raised fist in a specific skin tone. On a preference-selection screen that includes Hispanic-Owned, Indigenous-Owned, LGBTQ+-Owned, and other communities, using an emoji that signals one community on the first item while using more generic emojis for others is a design inconsistency.

**Important nuance:**
The other 9 designations on this screen demonstrate excellent inclusive design: Minority-Owned, Women-Owned, Veteran-Owned, LGBTQ+-Owned, Hispanic-Owned, Indigenous-Owned, Melanated Diaspora-Owned, D9 Affiliated, Disability-Owned. The list itself is strong. Only the first item's wording and positioning need attention.

**Required decision:**
Should "Black-Owned" remain the first item? If so, should the sub-text read "Support Black-owned businesses" (neutral user preference) rather than "first & always" (platform commitment)? Founder must decide.

**No code change made. This requires "Please implement."**

---

### H-004 — KinfolkAI City Voice System (Slang Instructions)

**Location:** `artifacts/api-server/src/routes/kinfolk.ts`, lines 140–180+

**Finding:**
KinfolkAI has a city-specific voice system that instructs the AI to use specific slang based on the user's city. Examples:

- New York: "deadass," "no cap," "mad," "wildin" — "Write like a proud New Yorker"
- Atlanta: "slime," "on gang," "bussin" — "Write with Atlanta swagger"
- Philadelphia: "jawn," "iight," "young bull" — "Use 'jawn' liberally"
- Chicago: "shorty," "finna," "on me"
- DC: "junt," "bama," "go-go"

This is an intentional design decision, not an accident. The system is sophisticated and culturally grounded. The city-specific cultural touchstones referenced (Harlem Renaissance, Bronzeville, Overtown, Black Panther Party birthplace) are accurate and respectful.

**What needs founder confirmation:**

1. **Is this feature intentional and approved?** The audit did not find prior approval documentation.

2. **Brand voice alignment:** The Platform Vocabulary guide sets a warm, specific, confident, inclusive tone. Regional slang that reads authentically in Atlanta may feel foreign to a member from Nashville or Miami accessing KinfolkAI.

3. **Community-specific slang carried risk:** Terms like "deadass," "on gang," "jawn," and "bussin" are authentic to those communities but may feel performative to members from outside those cities, or may carry negative associations in certain contexts.

4. **Opt-in vs. always-on:** Should this city voice be the default, or should members be able to set their communication style preference?

**This is not flagged as a violation — it may be a deliberate product decision.** It is flagged for explicit founder confirmation before launch.

**No code change made. This requires founder confirmation.**

---

## MEDIUM — Important Before Public Launch

---

### M-001 — KinfolkAI Name Inconsistency

**Locations:** Multiple files across all artifacts

| Usage | Location |
|-------|---------|
| "KinfolkAI™" | biz-deck/DemoS20Plans.tsx, mobile/business-guide.tsx |
| "KinfolkAI" | mobile/list-business.tsx, mobile/wishlist.tsx, api-server/ |
| "Kinfolk AI" | features-deck/COM_Slide09AI.tsx |
| "kinfolk" | Route paths (/kinfolk, /api/kinfolk/) |

**Finding:** Three different capitalizations used across mobile, web, decks, and API. "Kinfolk AI" (with space) appears in the marketing deck, "KinfolkAI" (no space) in the app, "KinfolkAI™" (with trademark) in premium contexts.

**Required decision:** Which form is canonical for user-facing copy?
- Recommendation: "KinfolkAI" (no space, no trademark in UI) for all in-app use; "KinfolkAI™" with trademark on first use in marketing and slides.
- Route paths (/kinfolk) are internal and do not need to match.

---

### M-002 — Empty State Messaging Below Brand Voice

**Locations:**

| File | Current Message | Issue |
|------|-----------------|-------|
| `mobile/app/kinfolk-memory.tsx` line 152 | "Your profile is empty" | No direction. Implies failure. |
| `mobile/app/guides/index.tsx` line 166 | "No guides yet in this category" | No direction. Feels broken. |
| `mobile/app/family-circle.tsx` line 429 | "No members yet. Tap 'Invite'..." | Acceptable — directional |
| `mobile/app/business-owner/index.tsx` line 262 | "No business listed yet" | No direction. |
| `mobile/app/show-love.tsx` line 204 | "No nominations yet" | No direction. |
| `mobile/app/hashtag-feed.tsx` line 164 | "No posts yet" | No direction. |

**Pattern:** Empty states that say "No X yet" without telling the member what to do next feel like broken states, not opportunities.

**Required fix before launch:** All empty states should follow the brand voice pattern: [What is empty] + [Why] + [What to do next].

---

### M-003 — Error Messages Using Technical or Generic Language

**Locations:**

| File | Current Message | Issue |
|------|-----------------|-------|
| `mobile/components/BusinessImprovementPlanModal.tsx` line 243 | "Something went wrong" | No direction |
| `mobile/app/cultural-heritage.tsx` line 152 | `new Error("Failed")` | Could surface as "Failed" to user |
| `api-server/routes/notifications-hub.ts` lines 45, 59, 77, 108 | `{ error: "Failed" }` | Technical jargon visible to API consumers |
| `mobile/app/financial-hub.tsx` line 214 | "Network error." | Generic, period at end is abrupt |

**Required fix before launch:** Error messages should follow the platform voice standards defined in PLATFORM_VOCABULARY.md.

---

### M-004 — Membership Tier Inventory

**Location:** `artifacts/api-server/src/constants/membershipTiers.ts`

**Finding:**
Five tiers are defined: `free`, `navigator`, `trailblazer`, `community_builder`, `legacy_member`.

The web membership page references four tiers. The mobile membership screen uses Navigator and Trailblazer.

**Audit finding:** `community_builder` and `legacy_member` may be founding/legacy tiers that are no longer active. Their presence in the constants file means they still affect tier-based logic.

**Required decision:** Are `community_builder` and `legacy_member` still active, or should they be archived? What is shown to a member who has one of these tiers?

---

## LOW — Improvement Opportunity

---

### L-001 — "Living Memorials" Term

**Finding:** NONE. No instances of "Living Memorials" or "Living Memorial" found anywhere in the codebase. The term was never implemented. FSR-017 documents its supersession for completeness.

**Status:** No action required.

---

### L-002 — Onboarding Copy

**Locations:** `artifacts/mobile/app/onboarding/`

**Finding:**
- `index.tsx`: "Map Your Life. Connect Deeper. Live With Purpose." — On brand, clear.
- `safety.tsx`: "Travel Smarter. Travel Informed." — On brand.
- `identity.tsx`: "Who Do You Want to Support?" — Clear, user-choice framing. Good.
- `travel.tsx`: "Plan Your Journey Your Way." — On brand.

**Status:** Onboarding headlines are clean and brand-consistent. No violations found. The identity.tsx issue is H-003 (first item positioning), not the headline.

---

### L-003 — Placeholder in KinfolkAI Response Schema

**Location:** `artifacts/api-server/src/routes/kinfolk.ts`, line 2247

**Finding:** `"name": "Business Name"` — appears in the AI response schema or tool definition. If this is in a schema definition or JSON structure definition, it is acceptable. If it surfaces in AI responses as a fallback, it would appear as a placeholder to the member.

**Required clarification:** Is this a schema field name or a default value that could surface to users? If it can surface, it should use a non-placeholder value.

---

### L-004 — Officer Watch Notification Uses Emoji

**Location:** `artifacts/api-server/src/routes/officer-watch.ts`, line 196

**Finding:** `"⚠️ Officer Watch Alert"` — uses a literal emoji in a push notification title.

Per the Platform Language Rule: emoji in slides must always be replaced with SVG icons. This rule applies to slides specifically, but the brand voice guide should clarify whether emoji in push notifications are acceptable.

**Status:** Low priority — clarify in PLATFORM_VOCABULARY.md whether emoji are acceptable in push notifications (they are standard in mobile notifications).

---

## No Violations Found

The following areas were audited and found clean:

- **"Living Memorials" term** — not present anywhere in the codebase
- **Latin placeholder text** — no "Lorem ipsum" found
- **"Test Business" or "Demo Business" in user-facing paths** — test data in test files only
- **Onboarding headlines** — on brand and inclusive
- **Privacy policy language** — appropriate for legal copy
- **Family mode copy** — follows Community Guidance Rating system correctly

---

## Summary of Required Founder Decisions

| ID | Question | Severity | Requires Code Change? |
|----|---------|---------|----------------------|
| H-001 | Replace "Black-owned" defaults in smart-pathways with inclusive language | High | Yes — needs "Please implement." |
| H-002 | Update SEO meta and verified badge copy to not apply "Black-owned" universally | High | Yes — needs "Please implement." |
| H-003 | Should "Black-Owned" remain first on the identity screen, and should sub-text change? | High | Needs founder decision first |
| H-004 | Is the KinfolkAI city-voice slang system intentional and approved? | High | Needs founder confirmation |
| M-001 | Which KinfolkAI name form is canonical? | Medium | Yes — needs "Please implement." |
| M-002 | Replace terse empty states with directional messages | Medium | Yes — needs "Please implement." |
| M-003 | Replace generic error messages with platform-voice messages | Medium | Yes — needs "Please implement." |
| M-004 | Are community_builder and legacy_member tiers still active? | Medium | Needs founder decision first |
| L-003 | Is "Business Name" in kinfolk.ts a schema field name or a user-visible default? | Low | Needs code review |

---

## Documents to Update After Founder Review

- `docs/product/PLATFORM_VOCABULARY.md` — Add approved/prohibited copy patterns from H-001, H-002, M-001, M-002, M-003 findings
- `docs/product/AUDIT_LOG.md` — Mark AUDIT-003 complete
- `lib/db/src/schema/smart-pathways.ts` — Update default query language (after "Please implement.")
- `artifacts/web/src/pages/business-detail.tsx` — Update SEO meta and verified copy (after "Please implement.")
- `artifacts/mobile/app/onboarding/identity.tsx` — Update "Black-Owned" sub-text if founder approves (after "Please implement.")

---

*Audit conducted by: Replit Agent (read-only — no code changes made)*
*Date: July 26, 2026*
