# City Boundaries & Location-Based Display — Implementation Instructions

**Status:** IMPLEMENT IN BUILD 103 (post-Apple-approval)

---

## The Problem

Cities like Philadelphia and Abington/Willow Grove are 15 minutes apart. A user could live in Abington but work in Philly, or drive through both in the same afternoon. The app needs to handle:

1. What pins appear on the map as users move between cities
2. How tester experience works across city boundaries
3. When city-specific content (City Story, Living Legacy) changes

---

## The Rules

### Rule 1: The Map is ALWAYS Location-Based (Option C)

The map shows ALL live pins within a radius of the user's current GPS location, regardless of which "city" those pins are tagged to.

**Implementation:**
```
GET /businesses?lat={user_lat}&lng={user_lng}&radius={miles}
```

- Default radius: 15-25 miles (adjustable by user zoom level)
- The query returns ALL businesses where:
  - `listing_status IN ('live_unclaimed', 'live_claimed')` (for real users)
  - OR `listing_status = 'demo'` (if `isTester = true`)
  - AND business coordinates are within the radius
- City tags are for ORGANIZATION, not visibility gates
- A user standing at the Abington/Philly border sees pins from BOTH areas
- No hard city boundaries cut off pins mid-map

**What this means:**
- A Philly user who zooms out sees Abington pins (if Abington is launched)
- An Abington user who drives into Philly sees Philly pins appear naturally
- There's no jarring "you left City X" transition — pins just appear and disappear based on proximity

---

### Rule 2: Home City Determines Personalization (Option A)

The user's HOME CITY (from onboarding Step 1: "Where do you call home?") determines:
- Which City Story they see on their Living Legacy page by default
- Which Kinfolk dialect/voice is used
- Which city's cultural phrases Kinfolk uses
- Their "home" in the app (the city they return to when they tap "Home")

**Implementation:**
- `users.home_city` is the anchor
- Kinfolk's system prompt uses `home_city` for dialect and cultural context
- The Living Legacy page defaults to `home_city`'s City Story
- BUT — if the user is physically in a DIFFERENT city (GPS shows they're 50+ miles from home), Kinfolk can acknowledge it: *"Looks like you're exploring Philadelphia today. Want me to show you what's here?"*

**What this means:**
- An Abington user's Kinfolk speaks to them as an Abington/suburban Philly person
- If they drive into Center City Philly, the MAP shows Philly pins, but Kinfolk doesn't suddenly change personality
- They can manually browse other cities' Living Legacy pages anytime

---

### Rule 3: Tester Status is Account-Level, Not Location-Level

A tester (`isTester = true`) sees demo businesses EVERYWHERE they go — not just in their home city.

**Implementation:**
- The `isTester` flag is on the user account, not tied to a city
- When fetching businesses, if `isTester = true`, include `listing_status = 'demo'` in results regardless of the user's current location
- Demo businesses have a city tag (so they appear in the right geographic location), but the tester can see ALL demo businesses on the map as they travel

**What this means:**
- An Abington tester driving into Philly sees: Philly real businesses + Philly demo businesses + Abington demo businesses (if they zoom out enough)
- Their reviews on REAL businesses (Philly) are real and persist
- Their reviews on DEMO businesses (anywhere) are test data and get wiped

---

### Rule 4: City Story / Living Legacy Changes by Location (Soft Transition)

When a user is physically in a different city than their home city, the Living Legacy page should offer BOTH:

**Implementation:**
- Default: Show `home_city`'s City Story
- If GPS detects user is in a different launched city (>10 miles from `home_city` center AND within 5 miles of another launched city's center):
  - Show a subtle prompt: *"You're in Philadelphia — want to explore its Living Legacy?"*
  - Tapping it shows Philadelphia's City Story
  - They can always switch back to their home city
- This is NOT a hard redirect — it's an invitation

**What this means:**
- An Abington user visiting Philly gets a gentle nudge to explore Philly's history
- They're never forced out of their home city context
- The transition feels like discovery, not displacement

---

### Rule 5: City Launch Controls Pin EXISTENCE, Not Pin VISIBILITY

- **Before launch:** Businesses tagged to that city have `listing_status = 'staged'` — they don't appear in ANY query (except admin)
- **After launch:** Those businesses become `listing_status = 'live_unclaimed'` — they appear in location-based queries for ANYONE nearby
- City launch does NOT create a geographic fence — it just promotes business data from invisible to visible

**What this means:**
- There's no "you must be in Charlotte to see Charlotte businesses" gate
- A user in Raleigh who zooms out far enough could see Charlotte pins (if Charlotte is launched and within their radius)
- City boundaries are metadata, not walls

---

## Edge Cases

**User lives on a city border (Abington/Philly):**
- They see pins from both areas on their map (radius-based)
- Their `home_city` determines Kinfolk's personality
- They can interact with any live business regardless of which city it's tagged to

**User travels to an unlaunched city:**
- They see no real pins (all staged/invisible)
- If they're a tester, they see demo pins
- Kinfolk can say: *"This city hasn't launched yet — but it's coming. Want to be the first to know?"*

**User's home_city hasn't launched:**
- Their map at home shows no real pins (unless nearby launched cities have pins within radius)
- If they're a tester, they see demo pins at home
- Their City Story page shows a "Coming Soon" state (or the historical context from our guides if it's been seeded)

**Two businesses with the same name in adjacent cities:**
- Both appear on the map as separate pins (already handled by the duplicate detection system — unique key is name + address + city + state)
- No confusion — they're at different geographic coordinates

---

## Database Implications

No new tables needed. Existing fields handle this:

| Field | Purpose |
|---|---|
| `users.home_city` | Personalization anchor, Kinfolk dialect, default Living Legacy |
| `users.is_tester` | Account-level flag, controls demo business visibility |
| `businesses.city` | Organizational tag, used for city launch trigger |
| `businesses.latitude/longitude` | Actual pin placement, used for radius queries |
| `businesses.listing_status` | Controls visibility (live vs staged vs demo) |
| `city_launches.status` | Tracks which cities are live vs planning |

---

## Verification Required

After implementing, confirm:

1. A user in Abington (`home_city = "Abington, PA"`) opens the map — what do they see?  
   *(Expected: demo pins if tester, nothing if not tester, PLUS any live pins from nearby launched cities within radius)*

2. That same user drives into Center City Philadelphia — what changes on their map?  
   *(Expected: Philly live pins appear as they enter radius, demo pins still visible if tester)*

3. Does Kinfolk's voice/dialect change when they cross into Philly?  
   *(Expected: NO — home_city determines Kinfolk personality, not current GPS)*

4. If they tap Living Legacy while physically in Philly, what do they see?  
   *(Expected: their home city's story by default, with a prompt to explore Philly's story)*

5. Can a non-tester user in Abington see Philadelphia's live businesses if they zoom out or drive close enough?  
   *(Expected: YES — the map is radius-based, not city-gated)*
