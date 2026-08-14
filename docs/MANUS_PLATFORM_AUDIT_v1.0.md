# Mapping With Melanin™ — Full Platform Audit for Manus
**Version 1.0 | August 14, 2026 | Prepared by Replit Agent**

> **Purpose:** This document is a complete, ground-truth audit of every feature, button, loop, flywheel, and system in the Mapping With Melanin platform — mobile (Expo/React Native) and web (React/Vite). It is written for Manus so they can independently verify correctness, identify bugs, and write precise corrective code for every issue they find.
>
> **For every bug found:** Write the exact file path, line range, root cause, and a complete corrected code block. No ambiguity. No vague suggestions. Executable fixes only.

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Mobile App — Tab Bar and Navigation](#2-mobile-app--tab-bar-and-navigation)
3. [Discover / Home Screen (Mobile)](#3-discover--home-screen-mobile)
4. [Map Screen (Mobile & Web)](#4-map-screen-mobile--web)
5. [Business Detail Screen (Mobile & Web)](#5-business-detail-screen-mobile--web)
6. [Community Vibes — What They Are and How They Work](#6-community-vibes--what-they-are-and-how-they-work)
7. [The Real — Professional Trust Tags](#7-the-real--professional-trust-tags)
8. [Endorsement Tags — Relationship to Vibes and The Real](#8-endorsement-tags--relationship-to-vibes-and-the-real)
9. [Community Feed & Social Features](#9-community-feed--social-features)
10. [@Mentions — Users and Businesses](#10-mentions--users-and-businesses)
11. [Adding Photos and URLs to Businesses](#11-adding-photos-and-urls-to-businesses)
12. [Check-In (Business Visit)](#12-check-in-business-visit)
13. [Reviews and Ratings](#13-reviews-and-ratings)
14. [Adding a Business — Two Flows](#14-adding-a-business--two-flows)
15. [Claiming a Business Listing](#15-claiming-a-business-listing)
16. [Business Owner Dashboard](#16-business-owner-dashboard)
17. [Business Verification Badge](#17-business-verification-badge)
18. [Allied Partner Journey — 5 Stages](#18-allied-partner-journey--5-stages)
19. [KinfolkAI — Full Architecture and Flywheel](#19-kinfolkai--full-architecture-and-flywheel)
20. [Library System — Full Architecture](#20-library-system--full-architecture)
21. [Safety Hub](#21-safety-hub)
22. [Trusted Safety Share](#22-trusted-safety-share)
23. [Events Tab (Mobile)](#23-events-tab-mobile)
24. [Circles — Group AI Planning](#24-circles--group-ai-planning)
25. [Connections / Find People](#25-connections--find-people)
26. [Notifications](#26-notifications)
27. [Profile Screen (Mobile & Web)](#27-profile-screen-mobile--web)
28. [Auth Flows — Sign Up, Login, Apple Sign-In](#28-auth-flows--sign-up-login-apple-sign-in)
29. [Resources Tab (Mobile)](#29-resources-tab-mobile)
30. [Admin Panel (Web)](#30-admin-panel-web)
31. [Web Home / Landing Page](#31-web-home--landing-page)
32. [Membership / Subscription](#32-membership--subscription)
33. [Referral System](#33-referral-system)
34. [City Health Alerts](#34-city-health-alerts)
35. [KinfolkAI Flywheel — How Community Data Improves AI Over Time](#35-kinfolkai-flywheel--how-community-data-improves-ai-over-time)
36. [Test Scenarios for 30+ Testers](#36-test-scenarios-for-30-testers)
37. [Known Gaps — Manus Action Items](#37-known-gaps--manus-action-items)

---

## 1. Platform Overview

**Mapping With Melanin™** is a community-first discovery and safety platform for the Black diaspora and melanated travelers. The platform has four surfaces:

| Surface | Technology | Purpose |
|---|---|---|
| Mobile App | Expo / React Native | Primary consumer experience |
| Web App | React / Vite (SPA) | Browser access + admin |
| API Server | Express / TypeScript / PostgreSQL | Single backend serving both |
| Admin Panel | Part of the web app at `/admin` | Founder and admin tooling |

**Core loops:**
1. **Discover** → business details → save / check-in / review → vibe and trust tags accumulate → KinfolkAI gets richer context
2. **Community** → posts, @mentions, hashtags → businesses get social proof → safety signals propagate
3. **Business growth** → add listing → claim → verify → allied partner → promoted to community
4. **Library** → topics surfaced → click "More" → read source → follow topic → KinfolkAI gains knowledge context
5. **Safety** → members report experiences → aggregated as community safety intelligence → shared via Trusted Safety Share

---

## 2. Mobile App — Tab Bar and Navigation

**File:** `artifacts/mobile/app/(tabs)/_layout.tsx` lines 83–215

The mobile app has **8 tabs**. On iOS, native tab bar is used with blur background.

| Tab | Route | Purpose |
|---|---|---|
| Community | `/(tabs)/community` | Social feed, posts, hashtags, circles |
| Discover | `/(tabs)` / `/(tabs)/index` | Business discovery, AI search, vibe filtering |
| Map | `/(tabs)/map` | Interactive Google Map with business/event pins |
| Safety | `/(tabs)/safety-hub` | Safety hub, community reports, sundown town history |
| Events | `/(tabs)/events` | Community events happening near you |
| Library | `/(tabs)/library` | Knowledge library, topics, articles, cultural intel |
| Resources | `/(tabs)/resources` | Tools, guides, links for Black travelers and families |
| Profile | `/(tabs)/profile` | Account, preferences, saved places, reviews |

**Library tab** shows an unread badge pulled from `GET /api/knowledge/feed/count`.

**Manus: verify** the badge count API returns a number (not null/undefined) when no unread items exist. Null would show a badge of "0" or crash the badge renderer.

---

## 3. Discover / Home Screen (Mobile)

**File:** `artifacts/mobile/app/(tabs)/index.tsx`
**Route:** `/(tabs)` or `/(tabs)/index`

**Purpose:** Personalized business discovery with category, vibe, score, and ownership filters.

### Every Interactive Element

| Element | What It Does |
|---|---|
| 🔔 Notification bell (top right) | Navigates to `/notification-center` |
| Search bar (tap to focus) | Navigates to `/business-search`; typing filters businesses in real time |
| **AI Search** button | Navigates to `/smart-search` (KinfolkAI-powered semantic business search) |
| **Find People** button | Navigates to `/connections` |
| **Vibe Search** button | Navigates to `/vibe-search` — browse businesses by mood/vibe tag |
| Category dropdown | Opens category filter modal; X or outside tap closes; selecting a category sets the active filter |
| Vibe chips (row of mood tags) | Toggle-filter businesses by vibe — each chip activates/deactivates a vibe |
| ScoreFilterPanel | Controls minimum community score, verified-only, and ownership filters (Black-owned, minority-owned, etc.) |
| Pull-to-refresh | Refetches businesses and city alerts |
| Business cards | Tap → `/business/[id]` |
| ❤ Save heart (on card) | Toggles favorite/saved status for that business |
| **Leave a note** (on card) | Opens a short feedback modal for the founder-facing feedback system |
| **Not interested** (on card) | Dismisses the card from recommendations |
| Preference banner X | Dismisses the ownership filter banner |
| **Show All Businesses** / **Show Everything** | Clears active ownership filters |
| KinfolkAI banner/card | Opens KinfolkAI chat or navigates to settings |
| Spotlight/recommendation cards | Opens business detail |

### Core Loop
Search or select filters → businesses update → tap card → detail page → save/check-in/review → pull-to-refresh.

**Manus: verify** the vibe chip filter correctly scopes to the selected vibe on the API side (`GET /api/businesses?vibes=hidden_gem,etc`). If the API ignores the `vibes` query param, the filter does nothing.

---

## 4. Map Screen (Mobile & Web)

**Mobile file:** `artifacts/mobile/app/(tabs)/map.tsx` wrapping `components/FullMapView`
**Web file:** `artifacts/web/src/pages/map.tsx`
**Web route:** `/map`

### Mobile Map — All Interactions (in FullMapView)
- Pan/zoom — standard Google Maps gestures
- Tap marker → selects it, shows bottom sheet with business name, distance, category
- Marker selection → detail panel → **View Details** → `/business/[id]`
- Filter controls: category chips, mood chips, Near Me (uses device location), radius slider
- Legend filter: toggles between Business / Cultural Sites / Events / Sundown Towns layers
- **Reset view** — recenters map to default city
- Directions — pulls walking/driving/transit route, displays step overlay, **Clear** button removes it
- `focusSiteId` / `focusLat` / `focusLng` props — used when deep-linked from another screen

### Web Map — All Interactions
**File:** `artifacts/web/src/pages/map.tsx` lines 1180–1346, 1398–1614

| Element | What It Does |
|---|---|
| Search field + **Search** / submit button | Geocodes query; searches businesses; pans map |
| Clear search (×) | Resets search results |
| Category chips | Filter map pins to a single category |
| Mood chips | Filter by vibe |
| **Near Me** | Uses browser geolocation, shows nearby businesses |
| Radius control | Sets search radius |
| Legend filters | Toggles layers: Businesses / Cultural Sites / Events / Sundown Towns |
| **Reset view** | Pans back to default city/region |
| Map markers | Click → popup with name/address/category |
| Popup **View Details** | → `/businesses/:id` |
| Popup **Official website ↗** | Opens business website in new tab |
| Popup **Learn more on MWM →** | → internal `/sites/:id` for cultural sites |
| Result cards (sidebar) | Click → selects marker, centers map |
| **Directions** | Opens Google Maps route |
| Active route **Clear** | Removes route overlay |
| **Explore with KinfolkAI** | → `/travel?q=...` with the current search pre-filled |
| **Add a Place** | Opens `AddPlaceModal` (3-step business submission form) |
| Sidebar open/close chevron | Collapses/expands result list panel |
| Sundown / history layer toggle | Shows/hides historical sundown town markers |

**Manus: verify** the map popup correctly distinguishes between external links (business websites) and internal links (cultural sites). The `safePublicUrl()` guard must reject non-http/https URLs before opening external links. If it doesn't, a `javascript:` URL injection is possible.

---

## 5. Business Detail Screen (Mobile & Web)

**Mobile file:** `artifacts/mobile/app/business/[id].tsx` and `business/[id].web.tsx`
**Web file:** `artifacts/web/src/pages/business-detail.tsx`
**Web route:** `/businesses/:id` and legacy `/business/:id`

This is the most feature-rich screen on the platform.

### Every Button and Action

| Element | What It Does |
|---|---|
| ← Back | Goes back to previous screen |
| ❤ Save / Unsave | Toggles saved status; unauthenticated → prompts login |
| 📞 Call | Opens phone dialer with business number (`tel:` link) |
| 🌐 Website | Opens business website in external browser |
| 📍 Address (Google Maps link) | Opens turn-by-turn directions in Google Maps |
| **Check In** | Records a visit check-in to this business (see §12) |
| **Directions / Navigator** | Opens in-app directions modal with Walk/Drive/Transit chips; fetches route; shows turn-by-turn; **Close** dismisses |
| **Write a Review** | → `/write-review` (mobile) or review section inline (web) |
| Star rating buttons (1–5) | Sets star rating for review |
| **Submit Review** | POSTs review to `/api/businesses/:id/reviews` |
| Edit my review | Opens review editor with existing content pre-filled |
| **Report** | Opens reporting modal (inappropriate content, discrimination, safety concern, etc.) |
| Photo gallery thumbnails | Opens photo lightbox |
| **Add a photo** / **Contribute** | Opens contribution modal (§11) |
| Community contribution modal × | Closes modal |
| **Is this your business? / Claim this listing** | Opens claim accordion/modal (§15) |
| Claim form **Submit** | POSTs claim to `/api/businesses/claims` |
| Vibe tags (community atmosphere) | Tap to add your vote; tap again to remove (§6) |
| Caption feedback chips | Same toggle mechanic as vibes |
| **The Real** endorsement tags | For professional/service businesses only (§7) |
| **Sign In** (when unauthenticated) | → `/login` |
| **Upgrade** CTA | → `/membership` or opens UpgradeModal |
| Social post / hiring links | Opens linked social post or job listing |
| Safety / community report links | Opens safety reporting flow |

### Membership Gate
Unauthenticated users see a preview. Certain actions (save, check-in, review, vibe, claim) require authentication. Paid-tier content requires active membership.

**Manus: verify**
- The `claim` endpoint at `POST /api/businesses/claims` correctly validates that the user doesn't already have a pending claim for this business (409 on duplicate)
- The vibe toggle correctly handles the case where the user's session expires mid-session (should prompt login, not silently fail)
- The membership gate for the web business detail page (artifacts/web/src/pages/business-detail.tsx) correctly redirects non-members without exposing premium content in the HTML

---

## 6. Community Vibes — What They Are and How They Work

**What vibes are:** Atmosphere and character tags that community members apply to businesses. They are NOT crime data, safety scores from external sources, or owner-self-descriptions. They are collective, lived-experience tags.

**Server file:** `artifacts/api-server/src/routes/vibes.ts`
**Web component:** `artifacts/web/src/pages/business-detail.tsx` lines 396–463
**Mobile component:** `artifacts/mobile/app/business/[id].tsx`
**DB table:** `business_member_feedback` (kind = `vibe` or `caption`)

### Canonical Vibe Catalog (with stable DB keys)

Vibes are organized by business category. A business in a category only shows the vibes relevant to that category.

**Atmosphere / General:**
- `hidden_gem` — Hidden Gem
- `community_staple` — Community Staple
- `grandma_approved` — Grandma Approved
- `worth_every_penny` — Worth Every Penny
- `date_night` — Date Night
- `hood_classic` — Hood Classic
- `grown_sexy` — Grown & Sexy

**Wellness/Spa:**
- `healing_hands` — Healing Hands
- `zen_vibes` — Zen Vibes

**Work & Study:**
- `wifi_works` — WiFi Works
- `laptop_friendly` — Laptop Friendly

**Adventure:**
- `bucket_list` — Bucket List Spot
- `bring_the_crew` — Bring the Crew

Stable DB keys are generated by `toVibeId()` — lowercase, spaces become underscores, special characters removed. **Example:** "Grown & Sexy" → `grown_sexy`.

**Vibes are NOT shown for service-category businesses.** Professional Services, Home & Property, Automotive, Pets, Technology, Financial, Legal, and Other Services show **The Real** instead (§7).

### How a Vibe Vote Works

1. User taps a vibe chip on the business detail page
2. `PUT /api/businesses/:businessId/community-feedback` is called with `{ kind: "vibe", key: "hidden_gem", action: "toggle" }`
3. Server upserts into `business_member_feedback` — one row per (business, member, kind, key)
4. If the row already exists, it's removed (toggle off); if absent, it's inserted (toggle on)
5. Response includes updated counts for all vibes on this business
6. UI re-renders vibe chips with new counts and the user's active selection highlighted

### Caption Feedback
Same mechanic as vibes but `kind = "caption"`. Captions are short phrases like "Great for families" or "Cash only — plan ahead." They describe logistics, not atmosphere.

### Who Can Vote
Any authenticated user. One vote per vibe per business per user. Unauthenticated users see counts but cannot vote.

### API Routes
- `GET /api/businesses/:businessId/community-feedback` — Returns aggregate counts and the authenticated viewer's selections
- `PUT /api/businesses/:businessId/community-feedback` — Toggle a vibe or caption

**Manus: verify**
1. `PUT /api/businesses/:businessId/community-feedback` returns the **full updated counts** for all vibes (not just the toggled one). The mobile UI re-renders all chips from the response.
2. The toggle is idempotent: calling it twice on the same vibe returns the user to zero (off state).
3. The `kind` field is validated server-side — only `vibe` and `caption` are accepted. Arbitrary `kind` values should return 400.

---

## 7. The Real — Professional Trust Tags

**What The Real is:** A separate endorsement system for service-based and professional businesses. Instead of atmosphere vibes ("Grandma Approved"), professionals get trust-signal tags ("Certified," "Prompt," "Clear Communication").

**DB tables:**
- `the_real_tags` — catalog of tags with category, type, adaptive family, scope, helper text, sort order
- `the_real_taps` — user taps (one per user/business/tag)
- `business_endorsement_taps` — generalized tap table used for both The Real and endorsement tags

**File:** `artifacts/api-server/src/lib/startup-migrations.ts` lines 1376–1420

**When The Real shows instead of vibes:**
The web `business-detail.tsx` lines 396–407 explicitly excludes these categories from vibe UI:
- Professional Services
- Home & Property Services
- Automotive & Transportation
- Pets & Animal Services
- Technology & Digital Services
- Financial & Business Services
- Legal & Government Services
- Other Services

For all of these, The Real endorsement tags are shown instead.

### How The Real Works

1. User views a professional/service business
2. Instead of atmosphere vibe chips, they see The Real tag buttons
3. Tapping a tag calls `POST /api/vibes/endorsements/:businessId` with `{ tagKey: "certified" }`
4. Server inserts into `business_endorsement_taps` — one row per (business, user, tag)
5. `GET /api/vibes/endorsements/:businessId` returns top tags with counts and the viewer's selections
6. Labels are resolved from `the_real_tags` table, or generated from the key via `INITCAP` if not in table

### API Routes
- `POST /api/vibes/endorsements/:businessId` — Add tap
- `DELETE /api/vibes/endorsements/:businessId/:tagKey` — Remove tap
- `GET /api/vibes/endorsements/:businessId` — Returns top endorsement tags with counts

**Manus: verify**
1. The `GET /api/vibes/endorsements/:businessId` route correctly JOINs `the_real_tags` for label resolution and falls back gracefully when a tag key has no matching row (uses INITCAP of the key, not a crash)
2. The web business detail page (`business-detail.tsx`) loads endorsements from the correct endpoint — it should call `GET /api/vibes/endorsements/:id`, not the community-feedback endpoint
3. **Known label lookup bug:** `artifacts/api-server/src/routes/vibes.ts:526–537` does a LEFT JOIN from `business_endorsement_taps` to `the_real_tags` on `rt.tag_key = t.tag_key`. Confirm the alias `t` refers to the aggregated taps CTE and `rt` refers to `the_real_tags`. If the join keys don't match exactly (case sensitivity, underscores vs hyphens), labels will always be null and INITCAP fallback will be used.

---

## 8. Endorsement Tags — Relationship to Vibes and The Real

**Three distinct systems — do not conflate:**

| System | Purpose | DB table | Who sees it |
|---|---|---|---|
| Community Vibes | Atmosphere/character tags | `business_member_feedback` (kind='vibe') | Non-service businesses |
| Caption Feedback | Logistics/practical tags | `business_member_feedback` (kind='caption') | All businesses |
| The Real / Endorsements | Professional trust signals | `business_endorsement_taps` + `the_real_tags` | Service/professional businesses |

The `GET /api/vibes/endorsements/:businessId` and `POST /api/vibes/endorsements/:businessId` routes power **both** The Real and any generic endorsement-tag surface. The distinction is which tags exist in `the_real_tags` for a given business category.

The mobile `business-owner/vibe-tags.tsx` screen lets the **owner** see what vibe/endorsement tags the community has given their business and understand what tags are available.

**Constants file:** `@workspace/constants` exports `VIBES_BY_CATEGORY` — the mapping from business category to applicable vibe keys. This is the source of truth for which vibes appear on which business type.

**Manus: verify** that `VIBES_BY_CATEGORY` is imported and used consistently on both mobile and web. If mobile and web show different vibes for the same business category, there's a data inconsistency.

---

## 9. Community Feed & Social Features

**Mobile file:** `artifacts/mobile/app/(tabs)/community.tsx`
**Components:** `StatusComposer.tsx`, `CommunityPostCard.tsx`
**Server routes:** `artifacts/api-server/src/routes/community.ts` lines 305–367, 475–525, 615–635
**Web file:** `artifacts/web/src/pages/community.tsx`

### Feed Filters
- `GET /api/community/posts` accepts: `category`, `postType`, `locationTag`, `topicTag`, `businessId`, `hashtag`
- `?feed=following` — shows only posts from users the viewer follows
- `?feed=everyone` — shows all community posts

### Feed Toggle (Mobile)
The mobile community tab has a **"For You / Following"** toggle. "For You" is the broad feed; "Following" filters to users you follow.

### Post Composer — Every Element

| Element | What It Does |
|---|---|
| Text input | Free text; supports @user and @business mentions (see §10) |
| @ trigger | Typing `@` opens both `UserMentionPicker` and `BusinessMentionPicker` |
| Photo attach | Lets user attach a photo to the post |
| Location tag | Tags post to a city/neighborhood |
| Topic tag | Tags post to a library topic |
| Business tag | Tags post to a specific business (via @business mention) |
| Privacy / visibility selector | Public / Followers only |
| **Post** / **Submit** button | `POST /api/community/posts` with content, mentionedUserIds, mentionedBusinessId, stance, rating, visibility, locationTag, topicTag |
| **Cancel** | Dismisses composer without posting |

### Post Types
When a post includes a business @mention, the composer requires **either**:
- A stance (`community_favorite`, `hidden_gem`, `supporting_local`, `visited_loved`)
- OR a rating of 3–5 stars

**New member moderation:** Business mentions from new members are held for moderation before appearing.

### Post Card — Every Action

| Element | What It Does |
|---|---|
| ❤ Like | Toggles like; count updates |
| 💬 Comment | Opens comment thread |
| Share | Shares post link |
| Hashtags (in post body) | Tap → `hashtag-feed.tsx` — all posts with that hashtag |
| @User mention | Tap → user profile |
| @Business mention | Tap → `/business/[id]` |
| **Report** (⋯ menu) | Opens content report modal |
| **Delete** (own post) | Soft-deletes post |

### Hashtag System
Web: `artifacts/web/src/pages/community.tsx` lines 692–907 — trending hashtag retrieval, filter chips, hashtag selection opens filtered feed.
Mobile: `artifacts/mobile/app/hashtag-feed.tsx` — feeds filtered by hashtag.

**Manus: verify**
1. The `POST /api/community/posts` endpoint validates that business mentions with a rating use a rating of 3–5 (not 1–2, which would be a negative review masquerading as a mention)
2. The `?feed=following` filter actually joins on a follows table — confirm the follows relationship table exists and is populated
3. New member moderation: confirm what defines "new member" — is it account age? number of posts? zero prior activity? The condition should be explicit and testable

---

## 10. @Mentions — Users and Businesses

**File:** `artifacts/mobile/components/StatusComposer.tsx` lines 146–375
**Business mention picker:** `artifacts/mobile/components/BusinessMentionPicker.tsx` lines 49–75
**Server notification:** `artifacts/api-server/src/routes/community.ts` lines 305–367

### How @Mention Works

1. User types `@` in the post composer
2. Both `UserMentionPicker` and `BusinessMentionPicker` open as overlays
3. **For businesses:** `BusinessMentionPicker` calls `GET /api/businesses/mention-search?q=...` as the user types
   - Results show matching businesses
   - Selecting a business inserts `@BusinessName` into the post, sets `mentionedBusinessId`, and shows stance/rating selector
   - **"Suggest/Add missing business"** button in the picker → `POST /api/businesses/submit` with `{ businessName, notes }` — creates a pending suggestion
4. **For users:** `UserMentionPicker` shows matching user accounts
   - Selecting stores the user ID in `mentionedUserIds` array
5. The full post is submitted with `mentionedUserIds` and `mentionedBusinessId` fields

### Notifications Triggered by Mentions

- **Business owner notification:** When a post mentions a business, the business owner (identified via `businesses.submittedById`) receives an in-app notification: *"[Author] mentioned your business in a community post"* with a deep link to the post and business
- **User mention notification:** ⚠️ **Current state unclear** — user IDs are stored in `mentionedUserIds` but the server route does not visibly process them into notifications. **Manus: audit `community.ts` lines 305–367 for whether user @mentions trigger push or in-app notifications. If not, this is a missing feature.**

### Missing Business Suggestion Flow
If a user types a business name that doesn't exist:
1. They tap "Suggest/Add missing business" in `BusinessMentionPicker`
2. `POST /api/businesses/submit` is called with name and notes
3. This creates a pending suggestion (NOT immediately published)
4. The business does not appear in search until an admin approves it

**Manus: verify** `POST /api/businesses/submit` returns a success message that explains the business is pending review (not immediately live). If the UI shows "Business added!" it sets incorrect expectations.

---

## 11. Adding Photos and URLs to Businesses

**Web file:** `artifacts/web/src/pages/business-detail.tsx` lines 171–284
**Mobile:** via contribution modal on business detail
**Server routes:** `artifacts/api-server/src/routes/businesses.ts` lines 665+

### Photo Upload Flow

Photos are uploaded by **any authenticated member** — this is a community contribution feature, not owner-only.

1. User taps **"Add a photo"** on business detail
2. Contribution/photo modal opens
3. User selects a file (image formats: jpg/png/webp)
4. Modal shows preview; user can remove and re-select
5. **Submit** → `POST /api/businesses/:id/community-photos` with multipart form data
6. Photo is held for **moderation** — it does NOT immediately appear on the listing
7. Admin approves/rejects in the admin panel Photos section
8. Approved photos appear in the gallery

### URL / Website Contribution

When a business listing has no website URL, community members can suggest one:
- Field appears in the contribution modal
- `POST /api/businesses/:id/contributions` with `{ type: "website_url", value: "https://..." }`
- Held for moderation like photos

### Adding via AddPlaceModal (when adding a new business)

When a user adds a new business via the **Add a Place** 3-step form, after successful creation they are redirected to `/businesses/:id?addContent=true`. The `addContent=true` query param auto-opens the contribution modal (`business-detail.tsx` lines 228–233), allowing the submitter to immediately add photos and URLs to the listing they just created.

**Manus: verify**
1. `POST /api/businesses/:id/community-photos` has a file size limit and file type validation on the server side (not just client-side). Without this, any file type could be uploaded.
2. After photo moderation approval in admin, the photo correctly appears in `GET /api/businesses/:id` response — check the photos field is included in the businesses query.
3. The `?addContent=true` auto-open behavior in business-detail.tsx (line 228–233): confirm it uses `useEffect` with a dependency on the query param, not on mount — otherwise navigating away and back reopens the modal unexpectedly.

---

## 12. Check-In (Business Visit)

**What it does:** Records that a user visited a business. This is distinct from Safety Check-In (§21).

**Mobile:** **Check In** button on business detail → `POST /api/businesses/:id/checkins`
**Effect:**
- Increments visit count for the business
- Contributes to the user's "Member Journey" statistics
- Feeds the Allied Partner eligibility calculation (§18) — 5 community check-ins at a business unlock the allied partner application

**Manus: verify** the check-in endpoint debounces or rate-limits to prevent a single user from inflating visit counts. Check if there's a cooldown (e.g., one check-in per user per 24-hour period per business).

---

## 13. Reviews and Ratings

**Mobile:** → `/write-review` from business detail
**Web:** Inline review section on `business-detail.tsx`
**Server route:** `POST /api/businesses/:id/reviews`

### Review Form Fields
- Star rating (1–5, required)
- Text review (optional, up to ~1000 chars)
- **Would return?** Yes/No/Maybe toggle
- Photo (optional, goes through same moderation as §11)

### Review Actions on Business Detail
- **Submit Review** — creates new review
- **Edit my review** — opens pre-filled editor; updates existing review
- **Report** (on another user's review) — flags for admin moderation
- **Delete** (own review) — soft-deletes

### Review Status Flow
All reviews start as `pending_review` if the user is a new member, or `approved` for established members. Admin can change status.

**Manus: verify**
1. A user cannot review the same business twice — confirm the server returns 409 on duplicate and the UI shows an appropriate message
2. Star rating of 0 or > 5 is rejected by the server, not just the client
3. The `would_return` field is stored and displayed correctly in the business aggregate stats

---

## 14. Adding a Business — Two Flows

### Flow 1: Community "Add a Place" (Any Member)

**Web modal:** `artifacts/web/src/components/AddPlaceModal.tsx` lines 50–374
**Mobile:** same flow accessible from Map → **Add a Place** and from empty search states

**3-Step Form:**

**Step 1 — Identity**
- Business name* (required)
- Category* buttons: Food, Beauty, Wellness, Entertainment, Retail, Cultural, Professional, Healthcare, Finance, Travel & Tourism, Trades & Education, Other
- **Next: Location →** button

**Step 2 — Location**
- Country* select (USA, Thailand, Jamaica, Mexico, Bahamas, Canada, UK, Ghana, Nigeria, South Africa, Kenya, Brazil, Colombia, Cuba, Trinidad & Tobago, Barbados, Dominican Republic, Haiti, Senegal, Ethiopia, Tanzania, Other)
- Custom country text field (if "Other" selected)
- City* (required)
- State (2-letter, only shown for USA)
- Address (optional — "helps place the pin on the map")
- **← Back** and **Next →** buttons

**Step 3 — About**
- About this place (optional textarea, 500 char max)
- Website (optional URL)
- Note shown: "Next step: attach Instagram/TikTok/YouTube"
- **← Back** and **Add Place → / Adding…** buttons

**Validation:** name, category, city, country are required. State and address are optional.

**What happens on submit:**
- `POST /api/businesses/suggest-place` with JSON body
- **If business already exists (409):** navigates to `/businesses/:existingId?addContent=true`
- **If new:** navigates to `/businesses/:businessId?addContent=true` — auto-opens contribution modal for photos/URLs

**Important:** Community-submitted businesses are NOT held in a review queue — they go **live immediately** with `listing_status = 'active'`. The dedup gate is the only protection against duplicates.

**Manus: verify** this is intentional or whether community-submitted businesses should enter a review queue before going live. If they go live immediately, any user can flood the database with fake listings.

### Flow 2: Business Owner "List a Business" (Owner Self-Submit)

**Web page:** `artifacts/web/src/pages/for-business-owners.tsx` lines 200–348
**CTA button:** "Claim Your Free Listing" → "Submit Your Business"

**Form fields:**
- Your Name* (required)
- Business Name* (required)
- Category (optional, 22 choices)
- City (optional)
- Email Address* (required)
- Website (optional URL)
- Social Media (optional): Instagram, Facebook, TikTok, X/Twitter

**What happens on submit:**
- Creates a business invite/lead in the system
- Admin is notified
- Business owner gets a follow-up email
- The listing is NOT immediately live — admin processes the lead

**Manus: verify** the email notification actually fires. The `sendBusinessOutreach` function is imported in admin.ts — confirm it's also called from this submission route (not just from admin outreach actions).

---

## 15. Claiming a Business Listing

**What claiming means:** Establishing that you are the owner/operator of a business that already exists in the platform database. Claiming ≠ verification. Claiming ≠ allied partner status. These are four independent dimensions.

**Mobile:** "Is this your business? / Claim this listing" button on business detail → claim modal
**Web:** Same button → claim accordion on business-detail.tsx
**Server:** `artifacts/api-server/src/routes/claims.ts` (not `community-impact.ts` — duplicate handler was removed Aug 12 2026)

### Claim Flow

1. User taps "Claim this listing"
2. Modal opens with:
   - Confirmation that they are the owner/authorized representative
   - Contact email field
   - Optional proof/context field
3. User taps **Submit**
4. `POST /api/businesses/claims` is called
5. Server creates a claim record with `status = 'pending'`
6. Admin reviews in the admin panel Claims section
7. Admin approves → `POST /admin/business-claims/:id/approve`
   - Sets `ownership_control_status = 'claimed'`
   - **Never** sets `verified = true` (that's a separate process — §17)
8. Owner receives confirmation notification

### Four Independent Business State Dimensions

| Dimension | Column | Values | Meaning |
|---|---|---|---|
| Listing status | `listing_status` | active / pending / rejected | Whether the listing is visible |
| Ownership control | `ownership_control_status` | none / claimed / disputed | Who has claimed control |
| Verification | `verified` | boolean | MWM has independently verified ownership |
| Allied partner | `allied_partner` | boolean | Has completed 5-stage partner journey |

**Manus: verify**
1. `POST /admin/business-claims/:id/approve` sets `ownership_control_status = 'claimed'` and **never** sets `verified = true`
2. A business can only have one active pending claim — duplicate pending claims for the same business by different users should be blocked or flagged as disputed
3. After claiming, the owner can access the Business Owner Dashboard (§16)

---

## 16. Business Owner Dashboard

**Web file:** `artifacts/web/src/pages/business-dashboard.tsx`
**Route:** `/business-dashboard` (owner-only, auth required)
**Data:** `GET /api/businesses/mine` — returns all businesses where the authenticated user is the owner

### Dashboard Tabs and Features

| Tab | Contents |
|---|---|
| Overview | Stats: Reviews count, Avg Rating, Would Return %, Verified badge; Quick actions: View Public Listing, Edit Profile, Promote My Business, Get Verified; Recent reviews list |
| Promote | Growth tools; Stripe checkout for paid visibility boosts |
| Global | Submit global recommendations: country, city, business name, website, type, reason, personal connection |

### Current Dashboard Limitations (as built)

The dashboard currently does **NOT** have:
- Hours editor
- Photo uploader (photos are submitted via community contribution flow, not owner-specific upload)
- Menu or URL editor
- Analytics chart (only counts/rating/return rate)
- Owner reply to reviews

**Manus: audit** whether the "Edit Profile" quick action (`/for-business-owners?claim=...`) actually pre-fills the business owner form with existing data. If it navigates to a blank form, that's a UX bug.

---

## 17. Business Verification Badge

**Web file:** `artifacts/web/src/pages/verify-business.tsx`
**Server route:** `POST /api/verification/submit`

### 3 Verification Tiers

| Level | Name | Requirement |
|---|---|---|
| Level 1 | Verified | Community confirmed, publicly listed |
| Level 2 | Verified Black-Owned | 51%+ Black ownership with documentation |
| Level 3 | Third-Party Certified | Recognized external certification linked |

### Verification Form Fields

**Basic Info (required):**
- Business Name*
- Business Type* (9 choices)
- Owner Full Name*
- Years in Business (optional)
- City / State / Website / Instagram (optional)
- Contact Email*
- Business Description (optional)

**Ownership Documentation (optional section — required for Level 2):**
- Ownership Percentage (must be ≥51% if provided)
- EIN (optional)
- Documents available checkboxes: articles/registration, EIN letter, business license, ownership/operating agreement, government photo ID, other

**Third-Party Certification (optional — required for Level 3):**
- Organization select: NMSDC, WBENC, SBA 8(a), SBA HUBZone, NGLCC, Disability:IN, NABOB, NACC, NBCC, State/Local MWBE, Other
- Certification URL* (required once org selected)
- Certification Number/ID (optional)

**Submit button:** "Submit Verification Request" — reviewed in 3–5 business days.

**Important:** Documents are NOT uploaded through this form — they are referenced by checkbox and submitted separately. Uploads are not implemented in the form UI.

**Manus: verify** the form submission sends the contact email to the MWM admin team. The confirmation message says "reviewed in 3–5 business days" — is there actually an email notification to the admin when a verification request is submitted?

---

## 18. Allied Partner Journey — 5 Stages

**File:** `artifacts/api-server/src/routes/allied-partners.ts`

The Allied Partner program is how community-verified businesses become paying platform partners. It is **earned through community engagement**, not purchased.

### The 5 Stages

| Stage | How Unlocked |
|---|---|
| `community_ready` | Auto-unlocked: ≥5 community check-ins (score = checkins + floor(endorsements/2), threshold = 5) |
| `applied` | Business owner submits application |
| `under_review` | Admin picks up the application |
| `agreement_pending` | Admin approves; waiting for owner to sign/confirm |
| `active_partner` | Owner confirms agreement; `allied_partner = true` set on business |

**Rejection:** Terminal with a 60-day reapply cooldown.

### Application Form Fields
- Contact Name* (required)
- Contact Email* (required)
- Contact Phone (optional)
- Partnership Goal* (required)
- Audience Description (optional)
- Additional Info (optional)

**Route:** `POST /api/businesses/:id/partner-application`

Admin is notified on submission. Response promises 3–5 business days. Active approval sets `allied_partner = true`, `allied_partner_since` timestamp, and sends a partner-benefits/dashboard email.

**Benefits unlocked at `active_partner`:**
- Allied partner badge on listing
- Access to partner dashboard features
- Promotional placement eligibility
- Email communication about platform opportunities

**Manus: verify**
1. The eligibility check at `community_ready` stage correctly uses `checkins + floor(endorsements/2) >= 5`. If the formula is wrong, no business can ever advance.
2. Rejection with 60-day cooldown: the cooldown is enforced on `POST /api/businesses/:id/partner-application` — confirm it checks `rejected_at` + 60 days before allowing reapplication.
3. When an admin approves at `agreement_pending` → `active_partner`, the business's `allied_partner` column is set to `true` and `listing_status` remains `active`. Confirm this is a single atomic transaction.

---

## 19. KinfolkAI — Full Architecture and Flywheel

KinfolkAI is Mapping With Melanin's AI travel and cultural intelligence companion. It is NOT a general-purpose chatbot. It is culturally grounded, community-informed, and governed by strict evidence policies.

### 19.1 Request/Response Flow

**Mobile hook:** `artifacts/mobile/hooks/useKinfolk.ts` lines 127–262
**Server route:** `artifacts/api-server/src/routes/kinfolk.ts` lines 2135–3443

**Step by step:**

1. Mobile sends authenticated `POST /api/kinfolk/chat` with:
   - `{ sessionId, message, vibes, voiceMode }`
   - 30-second `AbortController` timeout
   - Optimistic user message inserted into UI immediately

2. Server validates:
   - Auth required (401 if not authenticated)
   - Message non-empty and ≤2,000 characters
   - Free tier monthly quota (3 messages, then `KINFOLK_LIMIT_REACHED` HTTP 429)
   - Paid AI-pool quota
   - Tester bypass flag

3. Server loads context:
   - Cached user preferences (30s TTL)
   - Last 40 likes/dislikes
   - Saved places
   - Session history (last 8 messages, 400 chars each)
   - Destination, journey, catalog
   - Travel/city/weather/education data
   - Intent classification and context resolver results

4. System prompt is built (`buildSystemPrompt`) with:
   - Cultural context and city profile
   - Knowledge graph facts (provenance-aware)
   - Circle member context (if circleId supplied)
   - Personalization from saves, vibes, twin recommendations
   - Evidence policy (what the AI can/cannot assert)

5. Token estimation → token bucket admission (see §19.3)

6. OpenAI call: `gpt-4o-mini`, JSON mode, max 600 output tokens

7. Response parsed into:
   - `reply` (text)
   - `recommendations` (optional array of business/place cards)
   - `followups` (suggested follow-up questions)
   - `smartPromotion` (optional)
   - `tasks` (optional)

8. If model response is malformed JSON, raw text fallback is used

9. Local discovery enrichment: if model omitted recommendations, MWM's own business database is queried for verified businesses matching the query context

10. Session persisted (unless memory disabled by user)

11. Response returned to mobile; mobile renders reply text + cards + followup chips

12. **Error states:**
    - `KINFOLK_QUEUE_FULL` / `KINFOLK_BUSY` (503) → original question preserved for retry
    - `KINFOLK_LIMIT_REACHED` (429) → quota exceeded, upgrade prompt shown
    - TPM 429 from OpenAI → `parseRetryAfterMs()` floors retry to provider-declared wait

### 19.2 Intent Classification

**File:** `artifacts/api-server/src/kinfolk/intent-router.ts` lines 228–331

Two-layer classification:

**Layer 1 — KinfolkIntent (broad topic, deterministic regex):**
- `safety` — safety-related queries
- `medical` — medical/health queries
- `legal` — legal queries
- `financial` — financial queries
- `current` — queries about current events
- `culture` — cultural queries
- `education` — education/school queries
- `business` / `destination` — place-specific queries
- `hobby` — leisure/activity queries
- `general` — everything else

**Layer 2 — Query class (resolver path, deterministic):**
- `education_nearby` — education regex match
- `culture_opinion` — opinion phrase + music/artist terms
- `named_entity` — 1–3 capitalized words or named-entity terms
- `local_business` — local/near me terms
- `general` — fallback

No LLM is used for classification — it's pure regex. This keeps classification fast (no API call) and deterministic.

### 19.3 Evidence Policy

**File:** `artifacts/api-server/src/kinfolk/intent-router.ts` lines 56–180

| Query type | Consequence level | Citation required | Community proof allowed |
|---|---|---|---|
| Medical / Legal / Financial | High | Yes | No |
| Safety | High | Yes | Community experience signals only |
| Current events | Medium | Currency caveat required | No |
| Culture | Medium | Subjectivity label required | Yes |
| Business / Destination | Low | MWM listings prioritized | Yes |

**Governing rule:** KinfolkAI never asserts unverified facts about Black neighborhoods as dangerous based on crime data. Community experience is signal; police crime statistics are not used. This is the Safety Philosophy locked decision in memory.

### 19.4 Knowledge Graph and Cultural Retrieval

**File:** `artifacts/api-server/src/kinfolk/context-resolver.ts` lines 148–280

Retrieval pipeline:
1. Exact entity match → `entity-resolver` → server-authoritative facts injected (lines 148–190)
2. Ambiguous entity → clarification question returned, no answer generated (lines 194–212)
3. Unconfirmed named entity → short-circuit (lines 215–237)
4. Lexical full-text + vector candidate recall → rerank via `cultural-reranker` → context block built (lines 239–280)

City profiles add cultural anchors and neighborhood context. Cultural phrases are cached. Education results inject exact HBCU institution records with verification warnings.

### 19.5 Circles / Group Context

If a `circleId` is provided with the chat request:
1. Authorization: `circle_members` JOIN `kinfolk_circles` confirms the user is a member
2. Circle context loaded: member names, shared saved places, upcoming dates
3. Prompt Circle Intelligence injected: collective saves/check-ins/vibes, itinerary substitution for unavailable places, repeated group saves treated as demand signals
4. Private member data never leaks to circle context (privacy boundary enforced in prompt)
5. Circle context is suppressed for sensitive/high-consequence queries

### 19.6 Token Bucket Queue

**File:** `artifacts/api-server/src/routes/kinfolk.ts` lines 240–495

Parameters:
- Provider TPM cap: 200,000 tokens/minute
- Safety target: 160,000 tokens rolling 60s
- Max active generations: **4** simultaneous
- Reservation cap per request: 4,500 tokens
- Max output: 600 tokens
- Max queue waiters: 30
- Wait deadline: 25 seconds
- Retry: one retry with exponential backoff + jitter, honoring provider `Retry-After`

Queue behavior:
- Each request reserves estimated tokens + max output against the 160k rolling ledger
- Ledger entries expire after 60s
- Waiters are served FIFO when a slot opens
- One in-flight request per user
- Full queue → `KINFOLK_QUEUE_FULL` (503)
- Deadline exceeded → `KINFOLK_BUSY` (503)
- Both preserve the original question in mobile UI for retry

**Manus: verify** the rolling ledger correctly expires entries at 60 seconds. A memory leak in ledger entries would cause the effective TPM to appear permanently saturated and block all new requests.

### 19.7 Privacy Intelligence

**File:** `artifacts/api-server/src/kinfolk/adaptive-delivery.ts`

- Sensitive topic classifier runs on every message
- **Non-leakage rule:** Kinfolk never reveals other users' data, saved places, or circle discussions to non-members
- **Divorce Rule:** Kinfolk does not engage with relationship dissolution or family legal matters
- **Circle data boundary:** Circle member names and plans never appear outside the circle's own session
- Private activity is treated as personal property (Community Intelligence Constitution §11)

### 19.8 Audience Eligibility

- Age band loaded from user profile: `<13`, `13-15`, `16-17`, `18+`, `unknown`
- Protected audiences: 13–15, 16–17, unknown
- Graphic/adult content plans are replaced with age-appropriate overview + optional safety caveat
- `under_13` accounts cannot use KinfolkAI

**Manus: verify** the `audience_band` field is actually populated for existing users. If it's `null` for most users (common when a feature is added post-launch), the system will treat everyone as `unknown` (protected), which blocks adult-appropriate responses for all adult users.

### 19.9 Adaptive Depth System

**File:** `artifacts/api-server/src/kinfolk/kinfolk_answer_plans` (incomplete — see known gaps §37)

The system classifies answers as shallow/medium/deep based on query complexity. Users can request "Tell me more" to get deeper follow-ups. Currently the `answerPlanId` in responses is null — the `kinfolk_answer_plans` INSERT is not wired. Depth PATCH returns 404.

---

## 20. Library System — Full Architecture

The library is MWM's community knowledge system. It surfaces cultural intelligence, history, health, travel, and lived-experience knowledge from trusted sources.

### 20.1 Database Tables

| Table | Purpose |
|---|---|
| `knowledge_topics` | Topics/nodes — the graph nodes |
| `knowledge_sources` | Sources attached to topics — what to cite |
| `topic_relationships` | Graph edges between topics |
| `kinfolk_cultural_documents` | Vector-embedded documents used for Kinfolk retrieval |

**`knowledge_topics` columns:** title, slug, description, node_type (`topic` or geography), geography_ref, status (default `published`), plus graph indexes.

**`knowledge_sources` authority tiers:**
- `authoritative` — governments, museums, archives, universities, official organizations
- `professional` — credentialed historians, doctors, economists, journalists
- `community` — member lived experience
- `ambassador` — Cultural Ambassador videos, reels, guides, travel stories

### 20.2 How Topics Are Organized

The library is a **graph**, not a flat list:
- Geography nodes contain culture/history topic nodes
- Topics have parent/child relationships via `topic_relationships`
- Relationship types: `contains`, `part_of`, `related_to`, `subtopic_of`, `precedes`, `follows`, `related_geography`
- Weighted edges allow relevance ordering

**Mobile:** `/(tabs)/library`
**Web:** `/library` (`artifacts/web/src/pages/library.tsx`)

### 20.3 Library Tabs (Web)

| Tab | Contents |
|---|---|
| **Feed** | Personalized topic/article cards; pull-to-refresh; filter by category |
| **Browse Topics** | Topic graph browser; search; follow/unfollow topics |
| **Happening Now** | Events tied to library topics |

### 20.4 Every Interactive Element — Library

| Element | What It Does |
|---|---|
| Feed tab | Shows personalized topic cards |
| Browse Topics tab | Graph browser mode |
| Happening Now tab | Events with cultural/topic context |
| Topic search input | Filters topics by name |
| Category filter chips | Narrows to a topic category |
| Collection cards | Opens a curated collection of topics |
| Topic card | Opens Knowledge Book panel (see §20.5) |
| **Follow topic** / **Unfollow** button | Subscribes/unsubscribes; personalized feed uses follows |
| **Source →** external link | Opens primary source article in new tab or browser |
| Related topic/entity/city links | Navigate within the graph |
| City **View all** | → `/cities` |
| City story links | Opens cultural story |
| **Request a Topic** button | Opens form: topic name, description, why important; submits for admin review |
| Request topic **Submit** | `POST /api/knowledge/topics/request` |
| Load more / pagination | Loads next page of feed items |
| Library tab badge | Unread count from `GET /api/knowledge/feed/count` |

### 20.5 Less / More — How Topic Expansion Works

**"Less" state (default):** Topic card shows:
- Topic title
- 2-line summary (CSS `line-clamp-2`)
- Primary source name (if available)
- "Read more" or the source → link

**"More" state (Knowledge Book panel):** Clicking/tapping a topic opens the Knowledge Book panel. This fetches `GET /api/knowledge/graph/:topicId?surface=library` and reveals:
- Full topic description
- All sources with authority tier badges
- Evidence and confidence
- Connected articles (each with 2-line summary)
- Connected entities (people, places, organizations)
- Parent/child relationships ("Also in this collection")
- Related geography ("More Books in [City]")

**"Source →" link behavior:**
- If `link_status = 'available'`: clickable external link opens the article/website
- If `link_status = 'redirected'`: link opens but with a note that it may have moved
- If `link_status = 'unavailable'`: link is **hidden** from the UI — not shown at all
- If `link_status = 'not_checked'`: link is shown but not yet validated

The `link_status` comes from `knowledge_sources.link_status` and is maintained by the `ensureLibraryLinkHealth` guard. Clicking "Most current article" opens the source's URL directly.

### 20.6 How Topics Are Added (Admin Flow)

Topics are added by admins through:
1. Direct database seeding (startup migrations)
2. Admin knowledge contributions tab in the admin panel (`/admin` → Knowledge Contributions tab)
3. Community topic requests (reviewed and approved by admin)

Community topic requests flow:
1. Member taps "Request a Topic" in library
2. Fills form: topic name, description, why it's important
3. `POST /api/knowledge/topics/request` → creates a `topic_issues` row with `status = 'pending'`
4. Admin sees pending requests in Knowledge Contributions tab
5. Admin can: approve (creates topic), reject, or need more info

### 20.7 Library and KinfolkAI Connection

When a user asks KinfolkAI a question, the system:
1. Calls `getKnowledgeGraphContext(message, destination)` — pulls culturally relevant topics and sources
2. Injects provenance-aware context into the system prompt
3. This means: the more library content exists for a city/topic, the richer KinfolkAI's answers become

This is part of the Knowledge Flywheel (§35).

**Manus: verify**
1. `GET /api/knowledge/graph/:topicId?surface=library` returns data in the exact shape expected by `library.tsx:53–93` (TypeScript type match)
2. The `link_status` field is populated on all knowledge_sources rows — NULL defaults should be treated as `not_checked`, not `unavailable`
3. The Library tab unread badge (`/api/knowledge/feed/count`) returns `0` (not `null`) when there are no unread items — a null badge would crash the badge renderer on the tab bar

---

## 21. Safety Hub

**Mobile route:** `/(tabs)/safety-hub`
**Mobile file:** `artifacts/mobile/app/(tabs)/safety-hub.tsx`

**What it does:**
- Shows community safety intelligence for a city/area
- Displays community experience reports (NOT crime statistics)
- Shows sundown town historical data and context
- Links to the Trusted Safety Share system (§22)
- Shows the "Welcoming Environment" badge when community data confirms it

### Safety Check-In (distinct from Business Check-In)

The safety hub has its own **check-in** — this is a location-based safety ping, not a business visit. Used when traveling to confirm arrival and share current conditions.

### Safety Reporting

Users can submit a safety experience report:
- Type: positive / concerning / discriminatory / other
- Location (address or GPS)
- Description
- Anonymized — reporter identity is not shared

### Welcoming Environment Badge

**Mobile file:** `artifacts/mobile/components/WelcomingEnvironmentBadge.tsx` (from memory: task #259)
**Web:** Community safety card on `business-detail.tsx` (§5)

When community data (check-ins + vibe tags + endorsements) meets a threshold confirming positive experiences, the "Welcoming Environment" badge appears on:
- The business detail page
- The safety hub city overview

**This is community-verified, not self-applied.** Businesses cannot purchase or request this badge.

**Manus: verify** the threshold calculation for the Welcoming Environment badge is implemented and documented. If the badge appears with zero community data, it's meaningless.

---

## 22. Trusted Safety Share

**File:** `artifacts/api-server/src/routes/trusted-safety-share.ts` (and related mobile screen)
**Built:** August 11, 2026

**What it does:** When a severe safety alert is triggered for a city/area, the system can mirror that alert to a user's pre-configured trusted contacts.

### Flow

1. User configures trusted contacts in safety settings (email and/or phone)
2. When a severe alert is active for the user's current area, a **Share with trusted contacts** option appears
3. User can send the alert details to their contacts
4. Contacts receive a message with: alert type, location, what to know, and a safe-arrival check-in link

### Integration Gaps (3 remaining as of Aug 11 2026, tasks #242–244)

- Gap 1: Contacts may not receive notifications if push permissions are not granted
- Gap 2: The safe-arrival check-in link may not resolve correctly in production
- Gap 3: Trusted contacts are not deduplicated — the same person can be added multiple times

**Manus: audit these three gaps and provide fixes.**

---

## 23. Events Tab (Mobile)

**Route:** `/(tabs)/events`
**Purpose:** Shows community events (festivals, markets, gatherings) near the user

Events are sourced from the `recurring_events` table. As of Aug 14 2026, ~535 events are seeded across multiple cities.

**Every element:**
- Location filter (city/area selector)
- Date range filter
- Category chips (festival, market, cultural, food, etc.)
- Event cards: name, date, location, category
- Tap event card → event detail
- **Interested** / **Going** buttons on event detail
- **Directions** → opens Google Maps
- Past events are automatically hidden (task #121 — pending)

**Manus: verify** task #121 — past events filter. The `recurring_events` table has `event_date` or `next_occurrence_date` columns. Verify the `GET /api/events` route applies `WHERE event_date >= NOW()` or equivalent. If not, expired events remain visible on the map and events tab forever.

---

## 24. Circles — Group AI Planning

**Mobile screens:** `artifacts/mobile/app/circles/create.tsx` and `artifacts/mobile/app/circles/[id].tsx`
**Server routes:** `artifacts/api-server/src/routes/circles.ts`

**What Circles are:** Group AI-assisted itinerary planning sessions. A circle is a group (family, friends, travel crew) that shares saves, vibes, and AI planning context.

### DB Tables (6 total)
- `kinfolk_circles` — circle definitions
- `circle_members` — membership
- `circle_plans` — AI-generated itineraries for the circle
- `circle_saves` — shared saved places
- `circle_vibes` — shared vibe preferences
- `circle_events` — shared events

### 3 AI Curator Modes
- **Standard** — general group itinerary
- `curatorMode` — focused on a theme (food, culture, nightlife, etc.)
- `curatorMemberId` — one member's preferences drive the plan

### Creating a Circle
**Route:** `POST /api/circles`
- Name* (required)
- Description (optional)
- Invite members (by username or email)
- Tier limit enforced: free tier allows limited circle members

### Circle AI Planning
1. Circle members chat with KinfolkAI together (shared session)
2. Each member's saves and vibes contribute to recommendations
3. AI generates group-optimized itinerary
4. Members can save/approve/reject suggestions
5. Repeated group saves of the same place are treated as demand signals

**Manus: verify** that when a circle chat is active, only circle members can see the session — the `circleId` authorization at `kinfolk.ts:3130–3140` must be airtight.

---

## 25. Connections / Find People

**Mobile route:** `/connections`
**Triggered by:** "Find People" button on Discover home screen

**What it does:** Find and follow other platform members

**Interactions:**
- Search by username or name
- Follow / Unfollow buttons
- Following vs Followers tab
- Mutual connections highlighted
- Following a user makes their posts appear in the "Following" community feed

**Manus: verify** the follow action is idempotent — calling follow twice should not create two follow records (unique constraint on follower_id + followee_id).

---

## 26. Notifications

**Mobile:** `/notification-center` (bell icon on Discover home and Profile)

**Events that trigger in-app notifications:**
- Business mention in community post (→ business owner)
- Review submitted on your business (→ owner)
- Your review received a like
- Someone followed you
- City health alert for your saved cities
- Allied partner application status change
- Business claim approved/rejected
- Verification request status update
- Trusted safety share received

**Push notifications:** Sent when app is backgrounded. Uses Expo notifications infrastructure.

**Manus: verify** that notification deep links resolve correctly for each type. A notification for "business mention" should deep-link to the specific post, not just the business page.

---

## 27. Profile Screen (Mobile & Web)

**Mobile file:** `artifacts/mobile/app/(tabs)/profile.tsx`
**Web file:** `artifacts/web/src/pages/profile.tsx`
**Web route:** `/profile`

### Mobile Profile — All Interactions

| Element | What It Does |
|---|---|
| 🔔 Notifications | → `/notification-center` |
| ⚙ Settings | → `/settings` |
| **Create Account** (logged out) | → `/signup` |
| **I Already Have an Account** (logged out) | → `/login` |
| **Preview** (logged out) | → `/preview` (browse without account) |
| Safety alert switches | Toggle city-specific safety alerts |
| Radius chips | Set alert radius (5mi / 10mi / 25mi) |
| Recommended spots **Add** | Opens business picker; select business; stance chips; save |
| Recommended spot **Remove** (×) | Removes from recommended list |
| Review **Report** | Opens report modal |
| Review **Edit** | Opens review editor |
| **View Social Post** | Opens linked social media post |
| **Now Hiring** link | Opens job listing |
| Business cards | → business detail |
| **Claim listing** | Opens claim modal |
| **Call** | Opens dialer |
| **Check In** | Records visit check-in |
| **Review** | Opens review composer |
| Directions modal close | Dismisses directions |
| Travel-mode chips | Walk / Drive / Transit |
| Route/reload | Recalculates directions |

### Web Profile — All Interactions

| Element | What It Does |
|---|---|
| Avatar/name/username/bio/location | Editable profile fields |
| Username availability check | Real-time check as user types |
| **Save / Update profile** | `POST /api/profile` |
| **Admin** link | → `/admin` (admin users only) |
| **Discover** link | → `/discover` |
| Clear story-search (×) | Resets story search |
| Shortcut links | → Connections, Circles, Library, Business Dashboard, Notifications, Travel, Referral, Admin |
| Saved businesses | → `/businesses/:id` |
| Community / Circle CTAs | Opens relevant features |

---

## 28. Auth Flows — Sign Up, Login, Apple Sign-In

**Web files:** `artifacts/web/src/pages/login.tsx`, `artifacts/web/src/pages/signup.tsx`
**Routes:** `/login`, `/signup` (redirects to `/waitlist`), `/forgot-password`, `/reset-password`

### Login Form
- Sign in / Register tab toggle
- Email input, password input
- 👁 Password visibility toggle
- **Sign In** submit
- **Forgot password** → `/forgot-password`
- Apple account "Forgot password?" action (for Apple-relayed emails)

### Registration Form
- First name, Last name, Email, Username, Password, Date of Birth
- Password visibility toggle
- **Register** submit
- Terms → `/terms` link
- Privacy Policy → `/privacy-policy` link

### Force New Password
- Shown when a temporary password must be changed
- Form with new password + confirm

### Apple Sign-In (iOS)
**Critical:** iOS 26+ enforces cryptographic nonce.
- Client: `expo-crypto` `getRandomBytesAsync(32)` + SHA256 → `rawNonce`
- Server verifies: `SHA256(rawNonce) === payload.nonce`
- On sign-in: `exchangeAuthCode` called to get Apple refresh token
- On account delete: `revokeAppleToken` called
- Encrypted Apple refresh token stored in `users.appleRefreshToken` (AES-256-GCM)

### Mobile Auth Flow
Replit OIDC rejects custom scheme redirect URIs, so the flow is proxied:
`/mobile-auth/init` → `/login` → `/callback` → `/mobile-auth/done` → `mappingwithmelanin://auth-complete?token=SID`

**Manus: verify**
1. The nonce verification on Apple Sign-In is active in production — a missing nonce check would allow token replay attacks
2. The Apple relay email "Forgot password?" flow actually works — users with `privaterelay.appleid.com` emails cannot use standard password reset

---

## 29. Resources Tab (Mobile)

**Route:** `/(tabs)/resources`
**Purpose:** Tools, guides, and external links for Black travelers and families

**Contents:**
- Travel safety guides
- Know Your Rights resources
- HBCU finder
- Cultural heritage travel links
- Community organization directory

**Manus: verify** all external links in Resources are validated by `ensureLibraryLinkHealth`. If link health is not monitored, broken links accumulate silently.

---

## 30. Admin Panel (Web)

**File:** `artifacts/web/src/pages/admin.tsx` (4,801+ lines)
**Route:** `/admin` (ProtectedRoute — admin users only)

### Admin Tabs (17 total after Aug 14 2026 addition)

| Tab ID | Label | Purpose |
|---|---|---|
| `waitlist` | Waitlist | Manage join requests; approve/reject; send nudge emails |
| `leaderboard` | Referral Leaderboard | Top referrers; community builders; top cities |
| `metrics` | Metrics | Platform growth charts (Recharts) |
| `users` | Registered Users | User list; approve pending; manage roles |
| `businesses` | Businesses | Full business management; edit/archive/delete; photo approve |
| `members` | Members | Paid member management; subscription status |
| `reviews` | Reviews | Review moderation; approve/reject |
| `reports` | Reports | Content and safety reports; resolve |
| `challenges` | Challenges | Challenge application review |
| `category-waitlist` | Category Waitlist | Users waiting for specific business categories |
| `global-recs` | Global Recs | Community-submitted global business recommendations |
| `health` | Production Health | Railway deployment health; bundle SHA; DB pool stats |
| `cities` | City Launches | City checklist; launch readiness; health alert trigger |
| `feedback` | Beta Feedback | Beta tester feedback from `AdminFeedbackTab` component |
| `knowledge-contrib` | Knowledge Contributions | Topic requests; library contributions |
| `library-growth` | Library Growth | Topic growth analytics from `LibraryGrowthTab` |
| `biz-review` | Business Review Queue | Duplicate review queue; approve/merge/reject ingested businesses |

### Admin Interactions — Businesses Tab

| Element | What It Does |
|---|---|
| Search / filter | Filter by name, city, status, category |
| Export CSV | Downloads filtered business list |
| **Add Business** | Opens `AdminAddBusiness` modal |
| **Edit** (per business) | Opens `AdminEditBusiness` modal |
| **Archive** | Sets `listing_status = 'archived'` |
| **Delete** | Soft-deletes (sets `status = 'deleted'`) |
| **Approve Photo** | Approves pending community-submitted photo |
| **Reject Photo** | Rejects and removes from pending |
| **Send Nudge** | Sends outreach email to business contact |
| Duplicate-check | Shows dedup warnings; action to mark duplicate |

### Admin Interactions — Business Review Queue Tab (NEW)

| Element | What It Does |
|---|---|
| Filter tabs (All / Possible Duplicate / Ownership Unverified / Insufficient Evidence) | Filters review items by type |
| Stats cards | Pending / Approved / Rejected / Total counts |
| Review item card | Shows candidate vs. existing business side-by-side |
| **Approve & Add** | Creates new business from candidate; marks item `approved` |
| **Reject** | Marks item `rejected`; candidate not added |
| **Merge into existing** | Marks item `merged`; candidate treated as same as matched business |
| **Keep both** | Creates new business AND keeps existing; marks item `keep_both` |
| **Needs more research** | Marks item `needs_research`; returns to queue later |

### Admin Interactions — Cities Tab

| Element | What It Does |
|---|---|
| City selector | Selects a city to view/edit launch checklist |
| Launch checklist items | Check off: businesses seeded, events seeded, library topics added, safety data reviewed, etc. |
| **Trigger city health alert** | Sends immediate city health alert (for testing without waiting 30 minutes) — task #203 |
| **Save checklist** | Persists checklist state |

---

## 31. Web Home / Landing Page

**File:** `artifacts/web/src/pages/home.tsx`
**Route:** `/`
**Note:** Authenticated users are redirected to `/map` immediately

### Every Element

| Element | What It Does |
|---|---|
| **Choose Your Experience** | → `/preview` (explore without account) |
| Quick links: Find Businesses | → `/businesses` |
| Quick links: Safety Intelligence | → `/safety` |
| Quick links: KinfolkAI | → `/travel` |
| Quick links: Community | → `/community` |
| Waitlist form | Name, email, city/state, business-owner toggle, referral code, city nomination, family email inputs |
| **Join / Submit** waitlist | Submits waitlist entry |
| Share buttons (post-submit) | X/Facebook/LinkedIn share windows; Copy link to clipboard |
| Invite tabs: By Email / By Social | Switch invite mode |
| Invite type: Friend / Business | Switch invite type |
| Invite **Submit** | Sends invites |
| **Recommend a Business** | Opens/closes business recommendation modal |
| Business recommendation form | Category select + business details + submit |
| Leaderboard tabs | Community Builders / Top Cities |
| Footer and header links | Standard navigation and social links |

---

## 32. Membership / Subscription

**Mobile:** UpgradeModal opened from membership gates
**Web:** `/membership` page

### Tiers
- **Free:** 3 KinfolkAI messages/month; basic discovery; basic library access
- **Paid (monthly/annual):** Unlimited KinfolkAI; full library; saved places sync; circles; priority support

### Payment Flows
- **iOS:** RevenueCat → `stripe_subscription_id = "rc_<productId>"` stored
- **Web/Android:** Stripe checkout
- **Business plans on iOS:** Redirected to web (App Store policy)

**Manus: verify** the membership gate correctly checks subscription status from both Stripe and RevenueCat (for iOS users). A user who subscribed on iOS with RevenueCat should NOT be blocked on web.

---

## 33. Referral System

**Web:** Referral section on home page and profile
**Mobile:** Profile → Referral shortcut

### How It Works
1. User gets a unique referral link (`/join?ref=USERNAME`)
2. When someone joins via that link, the referrer is credited
3. Leaderboard shows top referrers (Community Builders) and top cities by referrals
4. Referral credits may unlock rewards or recognition (displayed on leaderboard)

**Manus: verify** the referral code is correctly attributed on sign-up even when the user takes multiple steps (e.g., clicks the link, browses, then signs up later). The referral code should persist in session/localStorage until sign-up is complete.

---

## 34. City Health Alerts

**File:** `artifacts/api-server/src/lib/cityHealthAlertScheduler.ts`

City health alerts are automated notifications about conditions in a city (safety events, community news, platform-specific alerts).

**Schedule:** Normally runs every 30 minutes.
**Admin override:** Admin Cities tab → "Trigger city health alert" — bypasses the 30-minute wait (task #203 — already implemented).

### Alert Types
- Safety conditions in a city
- Platform updates relevant to a city's community
- Event-driven alerts (community-submitted)

**Manus: verify** the admin trigger for city health alerts (`POST /admin/city-health-check/run`) calls `runCityHealthCheck()` and returns a result within a reasonable timeout (< 10 seconds). If the function takes longer than the request timeout, the admin gets a false error.

---

## 35. KinfolkAI Flywheel — How Community Data Improves AI Over Time

This is the core virtuous loop that makes MWM's AI differentiated from generic travel AI.

```
Community Action → Platform Data → KinfolkAI Context → Better Answers → More Community Action
```

### The Flywheel in Detail

**Step 1: Community members engage**
- Check in to a business → check-in count grows
- Add vibe tags → vibe signal for the business strengthens
- Write reviews → sentiment and would-return rate accumulate
- Save places → save count grows; becomes a trust signal
- Post on community feed mentioning a business → social proof accumulates
- Follow library topics → personalization improves

**Step 2: Data aggregates on the platform**
- Business community score = f(check-ins, saves, vibe votes, review ratings, endorsement taps)
- Library topic richness = f(sources added, sources verified, community topic requests)
- Circle collective saves = demand signal for group itinerary AI
- Vibe tags become context for KinfolkAI when recommending businesses
- Review sentiment feeds "Would Return" rate displayed on business cards

**Step 3: KinfolkAI ingests the enriched context**
When a user asks "Where should I eat in Atlanta tonight?":
- Community score filters rank businesses
- Vibe tags match the user's mood preference
- Twin recommendations (users with overlapping saves) add personalization
- Library cultural context about Atlanta neighborhoods is injected
- Check-in history confirms places are still active
- Endorsement taps on restaurant-type businesses add trust signals

**Step 4: Better answers surface better businesses**
- KinfolkAI recommends a community-vetted restaurant with high vibe scores
- User goes, loves it, checks in, leaves a vibe tag, writes a review
- Score increases further

**Step 5: Community grows stronger**
- High-score businesses attract more community members
- More check-ins and vibes → more data → stronger AI context
- Allied partner threshold reached → business joins partner program → promotional placement
- Promotional placement drives more community engagement → flywheel accelerates

### The Library Knowledge Flywheel

```
Admin/Ambassador adds topic → Library grows → KinfolkAI answers improve → 
Users ask more questions → Topics requested by community → More topics added
```

1. Library topics and sources are added by admins and Cultural Ambassadors
2. Topics are vectorized into `kinfolk_cultural_documents`
3. KinfolkAI retrieves relevant topics via vector + lexical search
4. Better cultural context → more accurate, culturally grounded answers
5. Users ask follow-up questions → topic gaps identified → community requests new topics
6. Admins add requested topics → library grows → cycle repeats

### What Breaks the Flywheel

- Stale or incorrect library sources (link_status = unavailable but still shown)
- Vibe tags not being saved correctly (toggle bug would show user clicked but data not persisted)
- Check-in rate limiting that's too aggressive (discourages honest behavior)
- KinfolkAI not using the correct endpoint for business recommendations (falls back to generic, ignores community scores)

---

## 36. Test Scenarios for 30+ Testers

### Pre-Test Checklist for Admins
- [ ] Confirm at least 10 businesses exist in the tester's city
- [ ] Confirm at least 3 library topics exist for the tester's area
- [ ] Confirm at least 1 event exists within 30 days
- [ ] Confirm admin has a "tester bypass" flag set so they can use KinfolkAI without hitting the 3-message free limit
- [ ] Confirm the tester's account is not `under_13`

### Tester Scenario Matrix

| Scenario | Steps | Expected Result | What to Check |
|---|---|---|---|
| **Discover a business** | Open app → Discover tab → scroll → tap business card | Business detail loads with name, category, address, phone | Photos load; address link opens Google Maps |
| **Save a business** | Tap ❤ on any business card | Heart fills; business appears in Saved on Profile | Tap again — heart empties; removed from Saved |
| **Vibe vote** | Open business detail → tap a vibe chip | Chip highlights; count increments | Tap again → chip deactivates; count decrements |
| **Check in** | Open business detail → tap Check In | Success toast shows | Check-in count on business increments |
| **Write a review** | Open business detail → tap Write a Review → enter rating + text → Submit | Review appears on business page | Rating shows in business aggregate; review visible to others |
| **Search businesses** | Tap search bar → type "soul food" | Relevant businesses appear | Results update as typing; empty state shows if no match |
| **AI Search** | Tap AI Search → type "quiet workspace with coffee" | KinfolkAI-ranked results appear | Results are culturally relevant; no generic chains |
| **KinfolkAI chat** | Tap KinfolkAI → ask "Best spots for brunch in [city]?" | Reply with business recommendations | Cards appear below reply; cards are clickable → business detail |
| **KinfolkAI follow-up** | After first answer → tap a followup chip | Follow-up question pre-fills | Answer is contextually aware of prior message |
| **Library topic** | Tap Library tab → tap a topic card | Knowledge Book panel opens with sources | "Source →" link opens article in browser |
| **Follow topic** | Open topic → tap Follow | Topic appears in Feed | Feed updates to include followed topic content |
| **Community post** | Community tab → tap composer → type text + @mention a business → Post | Post appears in feed | Business name is a link; tapping opens business |
| **Community feed toggle** | Tap Following toggle | Feed narrows to followed users | "For You" toggle shows all posts again |
| **Add a Place** | Map → Add a Place → fill 3-step form → Submit | Business appears on map | Navigate to `/businesses/:id?addContent=true` opens contribution modal |
| **Claim a business** | Open any unclaimed business → tap "Is this your business?" → submit form | "Claim submitted" message | Claim appears in admin panel for review |
| **Events tab** | Tap Events tab | Events in or near city appear | Past events are NOT shown |
| **Directions** | Business detail → tap Directions → tap Drive | Route overlay shows on map | Close button dismisses route |
| **Safety Hub** | Safety tab | City safety overview loads | No crime statistics shown — only community experience |
| **Notification bell** | Tap bell on Discover | Notification center opens | Unread notifications listed |
| **Sign out and back in** | Profile → Settings → Sign Out → Sign In | Session restored | Saved businesses and preferences persist |
| **The Real tags (professional)** | Find a Professional Services business → open detail | Endorsement tags appear instead of vibes | Vibe chips are NOT shown for service businesses |

---

## 37. Known Gaps — Manus Action Items

For every item below, write: (1) exact file path and line number, (2) root cause, (3) complete corrected code block, (4) verification step.

### Critical — Potential Data or Security Issues

**GAP-01: Community-submitted businesses go live immediately**
- `POST /api/businesses/suggest-place` creates businesses with `listing_status = 'active'` immediately
- **Risk:** Any authenticated user can flood the database with fake listings
- **Expected behavior:** Community submissions should enter `business_review_items` with `review_type = 'insufficient_evidence'` unless the business passes dedup gate
- **File:** `artifacts/api-server/src/routes/businesses.ts` ~line 1271
- **Action:** Audit whether this is intentional or should route through the review queue

**GAP-02: User @mention notifications not implemented**
- `mentionedUserIds` is stored in post data but server-side notification for user mentions is unclear
- **File:** `artifacts/api-server/src/routes/community.ts` lines 305–367
- **Action:** Confirm whether user mention notifications fire; if not, implement

**GAP-03: Kinfolk adaptive depth — `answerPlanId` is null**
- `kinfolk_answer_plans` INSERT not wired; depth PATCH returns 404
- **File:** `artifacts/api-server/src/routes/kinfolk.ts` (response construction after line 3443)
- **Action:** Wire the INSERT or remove the `answerPlanId` from the response contract

**GAP-04: Past events not filtered from map/events tab**
- Task #121 pending
- **File:** `artifacts/api-server/src/routes/events.ts` (find the GET /api/events query)
- **Action:** Add `AND (event_date >= NOW() OR next_occurrence_date >= NOW())` to query

**GAP-05: Trusted Safety Share — 3 integration gaps**
- Contacts may not receive push if permissions not granted (gap 1)
- Safe-arrival check-in link resolution (gap 2)
- Trusted contacts not deduplicated (gap 3)
- **File:** `artifacts/api-server/src/routes/trusted-safety-share.ts`

### Medium — UX and Correctness Issues

**GAP-06: Library tab badge returns null for zero unread**
- `GET /api/knowledge/feed/count` may return null when 0 unread
- **File:** `artifacts/api-server/src/routes/knowledge.ts`
- **Expected:** Always returns `{ count: number }` — never null

**GAP-07: Business Review Queue tab in admin renders as iframe**
- `/admin` → Business Review Queue tab uses an `<iframe src="/admin/business-review">` instead of rendering `<AdminBusinessReview>` component inline
- **File:** `artifacts/web/src/pages/admin.tsx` (biz-review tab panel)
- **Better approach:** Import and render `AdminBusinessReview` directly

**GAP-08: `audience_band` field null for most users**
- Added post-launch; existing users have `null` audience band
- **Effect:** All existing users treated as "unknown" (protected audience) → adult content plans blocked for adults
- **File:** `artifacts/api-server/src/kinfolk/adaptive-delivery.ts`
- **Fix:** Treat `null` audience band as `18+` for users with `date_of_birth` that confirms adult age, not as `unknown`

**GAP-09: Verification request — no admin email notification**
- `POST /api/verification/submit` may not send admin notification
- **File:** `artifacts/api-server/src/routes/verification.ts`
- **Expected:** Admin email sent on every new verification request

**GAP-10: Business owner dashboard has no photo upload**
- Owners use community contribution flow, not owner-specific upload
- **File:** `artifacts/web/src/pages/business-dashboard.tsx`
- **Action:** Either add owner-specific photo upload or document that community contribution is the intended path

**GAP-11: "Edit Profile" quick action may open blank form**
- `/for-business-owners?claim=...` may not pre-fill business data
- **File:** `artifacts/web/src/pages/for-business-owners.tsx`
- **Action:** Verify the `claim` query param causes the form to pre-fill existing business data

**GAP-12: Referral code session persistence**
- If user clicks referral link, browses, then signs up later — referral code may be lost
- **File:** Auth sign-up flow + referral attribution
- **Action:** Confirm referral code is stored in sessionStorage/localStorage until sign-up completes

**GAP-13: Safety check-in vs. business check-in naming**
- Two features both called "check-in" — different purposes, different APIs
- **Risk:** Testers and future developers will confuse them
- **Action:** Audit all UI labels — safety hub check-in should be labeled "Safety Check-In" and business visit check-in labeled "I Visited" or "Visit Check-In"

### Low — Polish and Completeness

**GAP-14: Business detail web page — membership gate timing**
- Confirm premium content is not in the HTML for unauthenticated users (SSR/CSR boundary)

**GAP-15: Map `safePublicUrl()` coverage**
- Verify all map popup external links go through `safePublicUrl()` guard
- **File:** `artifacts/web/src/pages/map.tsx` lines 568, 701–702, 1066

**GAP-16: Vibe toggle idempotency**
- Confirm calling toggle twice returns user to zero (off state), not creates two rows

**GAP-17: Photo moderation — file type server validation**
- Server-side file type and size limits must exist on `POST /api/businesses/:id/community-photos`

---

## How to Report Bugs (Instructions for Manus)

For every bug found, provide:

```
## BUG-[N]: [Short title]

**File:** `path/to/file.ts` line [N]
**Root cause:** [One precise sentence]
**Reproduction:** [Exact steps to reproduce]
**Current code:**
```[language]
[exact current code]
```
**Fix:**
```[language]
[complete corrected code — no partial fixes]
```
**Verification:** [How to confirm the fix works — specific API call or UI step]
```

No ambiguity. No "consider changing." Complete, executable corrections only.

---

*End of Mapping With Melanin Platform Audit v1.0*
*Generated: August 14, 2026*
*Source: Live codebase — artifacts/api-server, artifacts/web, artifacts/mobile*
