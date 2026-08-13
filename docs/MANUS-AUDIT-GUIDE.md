# Mapping With Melanin™ — Full Platform Audit Guide for Manus
**Version:** August 13, 2026  
**Scope:** Web app, API, database state, search, auth flows, community features, and all processes added during development.  
**Audit posture:** Test as a real user. Do not read source code. Observe what actually renders and behaves. Flag anything that does not match the description.

---

## HOW MANUS DIFFERS FROM DEVELOPER SELF-AUDIT

A developer self-audit reads the code and confirms logic. This guide is for **behavioral verification** — what the running app actually does when a real user touches it. Treat every "should" below as a testable assertion, not an assumption.

---

## PART 1 — PRE-AUDIT SETUP

### 1.1 Accounts to prepare
| Account | Purpose |
|---|---|
| **Unauthenticated session** (no login) | Test public-facing pages, gating behavior |
| **Standard member account** | Test full member experience |
| **Business owner account** (or mock) | Test business dashboard |
| **Admin account** | Test admin panel |

### 1.2 Known test data
- **Shawn Hill Homes** — Los Angeles, CA. Phone: (310) 265-3428. Category: Professional Services. Should appear when searching "Shawn Hill" or "Shawn Hill Homes" in the business directory.
- **92 users** are in the database — member search should find them by name.
- **2,769 businesses** are live — directory should load and paginate.
- **209 community events** are geocoded — map should show them.
- **714 cultural sites** have coordinates — map should show them.

---

## PART 2 — PUBLIC PAGES (NO LOGIN REQUIRED)

### 2.1 Homepage (`/`)
**Visit and verify:**
- [ ] Hero section renders with headline and CTA buttons
- [ ] "Browse Directory →" button navigates to `/businesses`
- [ ] "List Your Business" button navigates to signup or list flow
- [ ] Impact counter shows real numbers (2,769 businesses, 204 cities, 714 cultural sites, 92 community members)
- [ ] Navigation bar renders all items: Map, Businesses, Safety, For Business Owners, Explore, Community, Library, KinfolkAI, Events, Circles, Guides, Marketplace, Connections
- [ ] Navigation items are clickable and route correctly
- [ ] Page is responsive at mobile (375px) and tablet (768px)

### 2.2 Business Directory (`/businesses`)
**Unauthenticated:**
- [ ] Hero renders with search bar, "Browse Directory" and "List Your Business" CTAs
- [ ] Directory loads without login (should show businesses or require login — note actual behavior)
- [ ] Search box is visible and focusable

**Search tests (must run while logged in):**
- [ ] Search "Shawn Hill" → must show **Shawn Hill Homes** (Los Angeles, CA) — NOT "No results"
- [ ] Search "Shawn Hill Homes" → must show **Shawn Hill Homes** — NOT "No results"
- [ ] Search "Ethiopian restaurant" → must return at least 3 results
- [ ] Search "church" → must return results (categories include faith/worship)
- [ ] Search "Atlanta restaurant" → must return businesses in Atlanta
- [ ] Search "Phuket" → must return businesses near Phuket, Thailand (international)
- [ ] Search "xyznotabusiness99999" → must gracefully show "no results" message, not crash
- [ ] Search "OBGYN" → check if results appear; if zero, this is a **content gap finding** (homepage advertises OBGYN searches)
- [ ] Search "tax attorney" → check if results appear; if zero, this is a **content gap finding**
- [ ] After a search, "← Back to directory" link appears and works
- [ ] "NAMED BUSINESS INTENT" badge appears for proper-noun name searches
- [ ] Detected geo location label ("Showing MWM businesses near X") only appears when a real geographic location is detected — NOT for business names like "Shawn Hill"

**Business cards:**
- [ ] Business name is visible
- [ ] Category/subcategory visible
- [ ] City, state visible
- [ ] Phone number visible (enriched from Google Places)
- [ ] Website link present and opens in new tab
- [ ] Clicking a business navigates to the business detail page

### 2.3 Business Detail Page (`/businesses/:id`)
- [ ] Business name, category, city/state visible
- [ ] Phone number clickable (tel: link)
- [ ] Website link opens externally
- [ ] Hours displayed in a readable format (not raw JSON array)
- [ ] Map or location indicator present
- [ ] "Claim this listing" option visible for unclaimed businesses

### 2.4 Map Page (`/map`)
- [ ] Map loads without crashing (Google Maps or fallback)
- [ ] Businesses appear as pins
- [ ] Cultural sites appear as pins (different color/style)
- [ ] Community events appear as pins
- [ ] Clicking a pin shows a summary card
- [ ] Search bar on map accepts input
- [ ] Searching a city pans the map to that city
- [ ] Searching "Phuket" pans to Thailand, not Oslo or a wrong location
- [ ] "Shawn Hill" searched on map does NOT pan to Shawn Hill, Illinois

### 2.5 Events Page (`/events`)
- [ ] Page loads
- [ ] Events list displays with name, date, city
- [ ] Past events do NOT appear (only future events)
- [ ] Clicking an event shows detail or expands inline

### 2.6 Safety Page (`/safety`)
- [ ] Page renders
- [ ] Safety information content is visible
- [ ] Report form or navigation to report is accessible

### 2.7 Library Page (`/library`)
- [ ] Page loads
- [ ] Knowledge topics list renders
- [ ] Searching a topic returns relevant results
- [ ] External links in library show availability status (not all links are dead)

### 2.8 Explore / Guides / Marketplace / Connections
- [ ] Each page loads without a crash
- [ ] Content renders (even if sparse)
- [ ] Navigation between these pages works

---

## PART 3 — AUTHENTICATION FLOWS

### 3.1 Sign Up (`/signup`)
- [ ] Form renders with email, password, name fields
- [ ] Submitting with valid data creates an account and redirects to onboarding or home
- [ ] Submitting with invalid email shows inline error, not crash
- [ ] Submitting with a duplicate email shows "account already exists" message
- [ ] "Already have an account? Sign in" link works

### 3.2 Login (`/login`)
- [ ] Form renders
- [ ] Valid credentials log in and redirect correctly
- [ ] Invalid credentials show error message (not 500 page)
- [ ] "Forgot password?" link navigates to reset flow
- [ ] After login, user is redirected to where they came from (or home)

### 3.3 Apple Sign-In (mobile — note: web-only audit may skip)
- [ ] Apple Sign-In button present on mobile login
- [ ] Tapping triggers Apple auth sheet
- [ ] Successful sign-in lands on home screen

### 3.4 Session persistence
- [ ] After login, refreshing the page keeps user logged in
- [ ] After logout, protected pages redirect to login
- [ ] Auth token does not appear in URL (security check)

---

## PART 4 — AUTHENTICATED MEMBER EXPERIENCE

### 4.1 Community Page (`/community`) — Feed tab
- [ ] Feed loads with posts from community members
- [ ] "Everyone" / "Following" toggle switches feed correctly
- [ ] Trending hashtags appear and are clickable
- [ ] Clicking a hashtag filters posts to that tag
- [ ] Compose button opens post modal
- [ ] Posting with text submits and shows the new post immediately
- [ ] Liking a post increments the count
- [ ] Deleting own post removes it from feed

### 4.2 Community Page — People Search *(new as of Aug 13 2026)*
- [ ] A search bar is visible on the community page
- [ ] Typing "Shawn Hill" in community search returns **community members** named Shawn Hill (if any exist)
- [ ] Typing a known member's name returns their profile card
- [ ] Each member card shows: name, username (if set), avatar or initials, bio snippet
- [ ] Clicking a member card navigates to their profile
- [ ] If no members match, a clear "No members found" state shows — NOT a crash
- [ ] Business Directory link appears alongside people results ("Also search businesses →")

### 4.3 Community Page — Events tab
- [ ] Events list loads
- [ ] Each event shows name, date, city
- [ ] Past events are NOT shown
- [ ] RSVP button present (if feature is live)

### 4.4 Community Page — Groups tab
- [ ] Groups list loads (at least 8 groups exist in DB)
- [ ] Join/Leave button works
- [ ] Member count updates after join/leave

### 4.5 Profile Page (`/profile`)
- [ ] Profile renders with user's name, avatar/initials, bio
- [ ] Edit profile fields save correctly (display name, bio, username)
- [ ] Username change: reserved usernames rejected, duplicates rejected
- [ ] Profile image upload (if applicable) works

### 4.6 KinfolkAI (`/travel` or KinfolkAI section)
- [ ] Chat interface loads
- [ ] Typing a travel question returns an AI response
- [ ] Response is culturally relevant (not generic)
- [ ] No raw error stack traces appear in the response
- [ ] KINFOLK_BUSY state shows a friendly message when the system is at capacity

### 4.7 Library
- [ ] Authenticated library shows full content vs public preview
- [ ] Saving a library topic works (if feature exists)
- [ ] Knowledge source links open correctly; unavailable links are marked

### 4.8 Notifications
- [ ] Notification bell shows unread count
- [ ] Clicking bell opens notification panel
- [ ] Marking as read clears the count

---

## PART 5 — BUSINESS OWNER EXPERIENCE

### 5.1 Business Dashboard (`/business-dashboard`)
- [ ] Dashboard loads for a business owner
- [ ] Business name, category, location visible
- [ ] Analytics panel (views, clicks, etc.) shows numbers
- [ ] Edit business info works and saves

### 5.2 Claim a Listing
- [ ] Unclaimed business detail page shows "Claim this listing"
- [ ] Claim flow starts (form or verification prompt)
- [ ] Submitting a claim creates a record in pending state
- [ ] Admin receives the claim in the admin panel

### 5.3 Business Growth Center (`/business-growth-center`)
- [ ] Page loads
- [ ] Upgrade/membership options visible
- [ ] Stripe checkout initiated correctly for paid tiers

---

## PART 6 — ADMIN PANEL (`/admin`)

### 6.1 Access control
- [ ] Non-admin accounts see 403 or redirect, NOT admin content
- [ ] Admin account accesses panel without issue

### 6.2 Business management
- [ ] Business list loads
- [ ] Search/filter works
- [ ] Permanently closed businesses are flagged (94 exist — verify they show a flag)
- [ ] Businesses with `needs_verification=true` are identifiable (116 exist)
- [ ] Edit business fields saves correctly

### 6.3 User management
- [ ] User list loads
- [ ] Can correct a user's email address (for Apple relay users)
- [ ] Tester list visible and manageable

### 6.4 Claims management
- [ ] Claims queue shows pending claims
- [ ] Approving a claim sets `ownership_control_status = 'claimed'` on the business
- [ ] Rejecting a claim sends notification to claimer

### 6.5 Content moderation
- [ ] Reported posts appear in moderation queue
- [ ] Admin can remove flagged content
- [ ] Appeals visible if implemented

---

## PART 7 — SEARCH SYSTEM END-TO-END

### 7.1 Business name search (all surfaces)
| Query | Expected behavior |
|---|---|
| "Shawn Hill" | Returns "Shawn Hill Homes", LA — no geo bounding to Illinois |
| "Shawn Hill Homes" | Returns exact match |
| "Demera" | Returns Demera Ethiopian Restaurant |
| "Rosa's" | Returns businesses with Rosa's in name |
| "Ethiopian" | Returns multiple Ethiopian restaurants |
| "xyznotreal999" | Returns zero results gracefully |

### 7.2 Category/concept search
| Query | Expected behavior |
|---|---|
| "Ethiopian restaurant" | Returns Ethiopian restaurants |
| "Black-owned salon" | Returns salons with Black ownership |
| "church near Atlanta" | Returns faith organizations in Atlanta |
| "rooftop bar DC" | Returns nightlife in Washington DC |

### 7.3 Geographic search
| Query | Expected behavior |
|---|---|
| "restaurants in Phuket" | Pans to Thailand, shows Phuket results |
| "Jamaica" | Shows Jamaica results, not Jamaica Queens |
| "Cancun" | Shows Cancun Mexico results |
| "Atlanta" | Shows Atlanta GA businesses |

### 7.4 Intent detection
- [ ] Two-capital-word queries are classified as NAMED BUSINESS INTENT
- [ ] Proper place names with categories (e.g., "Phuket restaurants") are classified as geographic search
- [ ] Medical/healthcare terms are NOT classified as named business (OBGYN ≠ a person's name)

### 7.5 Community/people search
- [ ] Searching a person's name on the community page returns member accounts with that name
- [ ] Results are clearly labeled as "Community Members" (separate from business results)
- [ ] Empty state (no matching members) displays gracefully

---

## PART 8 — DATA QUALITY CHECKS (VERIFY AGAINST DATABASE)

### 8.1 Known data issues (as of Aug 13 2026)
| Issue | Count | Risk |
|---|---|---|
| Permanently closed businesses still showing live | 94 | Community members show up to closed locations |
| Businesses with needs_verification=true still live | 116 | Unverified data visible to community |
| Duplicate business names in same city | 2 | Confusing search results |

### 8.2 Enrichment verification
- [ ] A sample of 10 random businesses show phone numbers
- [ ] A sample of 10 random businesses show hours
- [ ] A sample of 10 random businesses show website links
- [ ] Hours display in human-readable format (not raw JSON array like `["Monday: 9 AM–5 PM"]`)

---

## PART 9 — MOBILE BEHAVIOR (if testing mobile)

### 9.1 Navigation
- [ ] Bottom tab bar renders on mobile
- [ ] Map tab opens map
- [ ] Discover tab shows businesses/events
- [ ] Community tab shows feed
- [ ] Profile tab shows user profile

### 9.2 Auth
- [ ] Apple Sign-In button renders on iOS
- [ ] Login with email/password works
- [ ] Session persists after app backgrounded

### 9.3 KinfolkAI
- [ ] Chat interface renders
- [ ] Keyboard doesn't cover the input field
- [ ] Sending a message works; response appears within reasonable time

### 9.4 Business detail
- [ ] Phone number taps to call
- [ ] Website link opens in browser
- [ ] Hours readable
- [ ] Map shows correct location

---

## PART 10 — PERFORMANCE & STABILITY

- [ ] Home page loads in under 3 seconds on a standard connection
- [ ] Business directory loads 200 businesses in under 4 seconds
- [ ] No console errors on any public page (open browser devtools)
- [ ] No 500 errors visible in the UI
- [ ] Refreshing any page keeps the correct page (no redirect to home on refresh)
- [ ] 404 page renders for invalid routes (not a blank screen)

---

## PART 11 — PROCESSES ADDED DURING DEVELOPMENT (VERIFY THESE SPECIFICALLY)

These are features and processes added in recent sessions that need independent verification:

### 11.1 Google Places Enrichment (Aug 13 2026)
- **What was built:** All 2,769 businesses were enriched with phone numbers, hours, and websites from Google Places API (New).
- **Verify:** Open 5 random business pages — at least 3 of them should show a phone number, website, and hours.
- **Risk:** Hours stored as JSON array — if the UI renders `["Monday: 9 AM–5 PM"]` literally, the display layer is broken.

### 11.2 Business Name Search Fix (Aug 13 2026)
- **What was fixed:** Named-business searches (two-word proper nouns) no longer apply a geographic radius filter. Server-side geocoding gate now uses prefix match.
- **Verify:** Search "Shawn Hill" and "Shawn Hill Homes" — both must return the LA business. Neither should show "near Shawn Hill" (Illinois).

### 11.3 Community People Search (Aug 13 2026)
- **What was built:** Search bar on community page now searches member names via `/api/users/search`.
- **Verify:** On community page, type a name → people cards appear. Clicking a card navigates to that member's profile.

### 11.4 Database Column Widening (Aug 13 2026)
- **What was fixed:** website, facebook, instagram, address, name, and other varchar(255) columns widened to TEXT to prevent overflow from Google Places data.
- **Verify:** Open Chatuchak Weekend Market (Bangkok) business page — should load with a website URL that may be longer than 255 characters.

### 11.5 Allied Partner Applications (Task #84)
- **What was built:** 5-stage partner journey table (`allied_partner_applications`), routes, email triggers, community threshold gate.
- **Verify:** Does a business owner see a path to become an allied partner after earning community trust? Admin panel should show partner applications.

### 11.6 Permanently Closed Flag
- **What's missing:** 94 businesses Google marked as permanently closed still show as live. Admin should be able to bulk-review and de-list these.
- **Verify:** Admin panel — is there a "Permanently Closed" filter? If not, this is an open gap.

---

## PART 12 — WHAT TO FLAG AS A FINDING

Flag any of the following regardless of whether it matches this guide:
1. A page that crashes (blank screen, error boundary, or 500)
2. A search that returns zero results when results are expected
3. A search that returns results from the wrong city or country
4. A form that submits but shows no confirmation or error
5. A button that does nothing when clicked
6. Content that renders as raw code or JSON (e.g., `["Monday: 9 AM–5 PM"]`)
7. A "No results" state when the named item definitely exists in the database
8. Any reference to a feature in the navigation that links to a blank or broken page
9. Any auth flow that exposes protected content without login
10. Any UI text that contradicts what the app actually does (homepage says "OBGYN" but no OBGYN businesses exist)

---

## APPENDIX — URLS TO TEST

| Page | URL |
|---|---|
| Home | `/` |
| Business Directory | `/businesses` |
| Map | `/map` |
| Events | `/events` |
| Community | `/community` |
| Library | `/library` |
| KinfolkAI | `/travel` |
| Safety | `/safety` |
| Explore | `/explore` |
| Guides | `/guides` |
| Marketplace | `/marketplace` |
| Connections | `/connections` |
| Circles | `/circles` |
| Profile | `/profile` |
| Admin | `/admin` |
| Business Dashboard | `/business-dashboard` |
| Sign Up | `/signup` |
| Login | `/login` |
| For Business Owners | `/for-business-owners` |
| City Spotlight | `/city-spotlight/:city` |
| Business Detail | `/businesses/:id` |
| Cultural Site Detail | `/cultural-site/:id` |

---

*This document should be updated after every significant build session. Last updated: Aug 13 2026.*
