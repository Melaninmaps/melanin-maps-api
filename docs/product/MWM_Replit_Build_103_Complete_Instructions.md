# Build 103 — Complete Instructions

**Status:** IMPLEMENT IMMEDIATELY AFTER APPLE APPROVES BUILD 102

This is the first feature build after Apple approval. It contains 5 workstreams that are all independent and can be developed in parallel.

---

## Workstream 1: Bug Fixes (Priority — Do First)

### Bug 1: Interests Not Saving to Database ✅ COMPLETE
**Problem:** Profile-setup Step 3 collects `selectedInterests` but `handleFinish()` never includes them in the PATCH payload. `user_preferences.cultural_interests` is always empty.  
**Fix:** Add `culturalInterests: Array.from(selectedInterests)` to the PATCH body in `handleFinish()`. Backend handler saves to `user_preferences.cultural_interests` (jsonb).  
**Status: COMPLETE — implemented and DB-verified Aug 5, 2026**

### Bug 2: Heritage Data Never Reaches Database ✅ COMPLETE
**Problem:** `identity.tsx` stores `diasporaCountries` and `designations` in AsyncStorage (`@mwm_pending_ownership_prefs`) but they're never transferred to the database after signup.  
**Fix:** In `profile-setup.tsx` (or signup completion), retrieve from AsyncStorage and include in the PATCH payload or call `/api/kinfolk/preferences` separately. Clear AsyncStorage after successful write.  
**Status: COMPLETE — implemented and DB-verified Aug 5, 2026**

---

## Workstream 2: Launch All Tour Cities (16 Cities)

Run the city launch trigger for each of the following cities. This promotes all staged real businesses to `live_unclaimed` and hides demo data.

**Cities to launch (in order):**

| # | City | Slug |
|---|---|---|
| 1 | Washington, DC | washington-dc |
| 2 | Richmond, VA | richmond |
| 3 | Raleigh/Durham, NC | raleigh-durham |
| 4 | Charlotte, NC | charlotte |
| 5 | Columbia, SC | columbia |
| 6 | Atlanta, GA | atlanta |
| 7 | Montgomery, AL | montgomery |
| 8 | Birmingham, AL | birmingham |
| 9 | Mobile, AL | mobile |
| 10 | Baton Rouge, LA | baton-rouge |
| 11 | New Orleans, LA | new-orleans |
| 12 | Houston, TX | houston |
| 13 | Allentown, PA | allentown |
| 14 | Abington/Willow Grove, PA | abington |
| 15 | Harrisburg, PA | harrisburg |
| 16 | Chicopee, MA | chicopee |

**Pre-launch checklist for each city:**
1. Confirm `city_launches` entry exists (create if not — slug, name, state, `status='planning'`)
2. Confirm `tour_guide_businesses` data exists for that city (from the cultural guides we provided)
3. Confirm businesses have valid lat/lng coordinates within city bounds
4. Run: `POST /admin/city-launches/:slug/trigger-launch`
5. Verify response: `{ promoted: X, demoHidden: X, counts: { live_unclaimed: X } }`

**Expected result:** A user in Philadelphia can open the map, zoom out or search Charlotte, and see real business pins. A tester can "plan a day in Charlotte" from their couch in Philly.

**Important:** If any city doesn't have a `city_launches` entry yet, CREATE it first. The satellite cities (Allentown, Abington, Harrisburg, Chicopee) likely need to be registered before they can be launched.

---

## Workstream 3: Admin Tester Toggle

Build a simple admin interface (or endpoint) that allows the founder to flag/unflag tester accounts.

**Endpoints:**
```
GET  /admin/testers                    — List all current tester accounts (email, name, home_city, date_added)
PATCH /admin/users/tester-status       — Body: { "email": "user@example.com", "isTester": true }
DELETE /admin/users/tester-status      — Body: { "email": "user@example.com" } (remove tester flag)
```

**Admin UI (preferred if admin dashboard exists):**
- Search for user by email
- Toggle "Tester" status on/off
- Show list of all current testers with their home city
- One-click to add, one-click to remove

**What the tester flag enables:**
- User sees demo businesses on the map (in addition to all live businesses)
- Demo businesses have a subtle "Test Business" indicator
- Reviews on demo businesses are tagged as test data
- No other behavioral differences — testers use the real app with real features

**Founder workflow:**
1. Recruit a tester (friend, family, community member)
2. They sign up for the app normally
3. Founder goes to admin → searches their email → toggles tester status ON
4. Tester now sees demo businesses for interaction testing
5. When testing is complete, founder toggles OFF

---

## Workstream 4: Demo Businesses for All Cities

Create 5 demo businesses that are available in EVERY city (not city-specific). These are universal test pins that testers can interact with regardless of location.

**The 5 Universal Demo Businesses:**

| # | Name | Type | Category | Description |
|---|---|---|---|---|
| 1 | Harmony Kitchen | Restaurant | Food & Dining | "A family-owned restaurant celebrating flavors from across the diaspora. Known for their fusion brunch menu and warm community atmosphere." |
| 2 | Crown & Glory Studio | Salon/Barbershop | Beauty & Grooming | "A full-service salon specializing in natural hair care, protective styles, and barbering. Walk-ins welcome, appointments preferred." |
| 3 | Heritage Corner Gallery | Cultural Site | Arts & Culture | "A community art space showcasing rotating exhibitions from local artists. Features a permanent collection of neighborhood history and oral stories." |
| 4 | Mosaic Marketplace | Retail | Shopping | "A curated retail collective featuring handmade goods, apparel, and accessories from community artisans. Every purchase supports a local maker." |
| 5 | Elevate Community Services | Service Provider | Professional Services | "Business consulting, financial literacy workshops, and mentorship programs designed specifically for first-generation entrepreneurs." |

**Demo Business Properties:**
```json
{
  "listing_status": "demo",
  "data_source": "dev_seed",
  "is_universal_demo": true,
  "address": "123 Community Way",
  "city": null,
  "state": null,
  "latitude": null,
  "longitude": null,
  "website_url": "https://example.com",
  "phone": "555-010-0100"
}
```

**IMPORTANT — Location Logic for Universal Demos:**

Since these are universal (not tied to one city), they should appear near the TESTER'S current location. When a tester's map loads:
- Place the 5 demo businesses at randomized coordinates within 1-2 miles of the tester's current GPS position
- This way they always have something nearby to tap, regardless of which city they're in
- Non-tester users never see these (`listing_status = 'demo'` filtered out)

**Demo Business Indicator:**
- Small badge on the business card: "🧪 Test Business — for testing only"
- Slightly different pin color on map (gray or lighter shade)
- Only visible to accounts where `isTester = true`

---

## Workstream 5: Demo Business Phaseout Plan

Demo businesses are temporary — they exist only for the testing period.

### Phase 1: Active Testing (Aug 8 — Aug 14)
- Demo businesses visible to all testers
- Testers interact freely (reviews, ratings, endorsements)
- All interactions tagged as test data

### Phase 2: Tour Begins (Aug 15)
- Demo businesses REMAIN for testers (they're still testing during the tour)
- Real businesses are live in all tour cities
- Testers can now compare demo vs. real experience

### Phase 3: Testing Complete (Founder decides — likely late August / early September)
- Founder sends notification to testers: "Thank you! Testing is complete. Demo businesses will be removed in 48 hours. Your real reviews on real businesses will stay forever."
- After 48 hours: run cleanup script

**Cleanup Script:**
```sql
-- 1. Delete all reviews/ratings/endorsements on demo businesses
DELETE FROM reviews WHERE business_id IN (
  SELECT id FROM businesses WHERE listing_status = 'demo'
);
DELETE FROM ratings WHERE business_id IN (
  SELECT id FROM businesses WHERE listing_status = 'demo'
);
DELETE FROM endorsements WHERE business_id IN (
  SELECT id FROM businesses WHERE listing_status = 'demo'
);
-- 2. Hide demo businesses permanently
UPDATE businesses SET listing_status = 'permanently_hidden'
WHERE listing_status = 'demo';

-- 3. Optionally: remove tester flags (or keep them for future testing rounds)
-- UPDATE users SET is_tester = false WHERE is_tester = true;
```

**Tester Notification (founder sends via group text or in-app message):**
> "Hey family! 🙏 Thank you so much for helping us test. Your feedback made this app better for everyone. The test businesses are being removed now — but every real review you left on a real business stays forever. You were the first. That matters. When your city fully launches, you'll be the ones who shaped it."

The founder decides WHEN to run the phaseout. It's not automatic. She'll tell Replit "remove demo businesses" when she's satisfied testing is complete.

---

## Build 103 Delivery Checklist

| # | Workstream | Verification |
|---|---|---|
| 1 | Bug 1 — Interests saving | ✅ COMPLETE — DB verified Aug 5, 2026 |
| 2 | Bug 2 — Heritage transfer | ✅ COMPLETE — DB verified Aug 5, 2026 |
| 3 | City launches (16) | Confirm all 16 cities show `live_unclaimed` businesses |
| 4 | Admin tester toggle | Founder can search email → toggle tester status |
| 5 | Demo businesses | Tester account sees 5 demo pins near their location |
| 6 | Demo indicator | Screenshot showing "Test Business" badge on demo card |
| 7 | Test data isolation | Review on demo business tagged/isolated from production |
| 8 | Font scaling fix | Text renders correctly on all device sizes |

---

## Timeline

**Estimated effort:** 2-3 days total (all workstreams parallel)
- **Day 1:** Bug fixes (DONE) + City launch triggers (~1 hr) + Admin toggle (~2-3 hrs)
- **Day 2:** Demo businesses + indicator UI + test data isolation (~3-4 hrs)
- **Day 3:** Font scaling + QA + OTA push

**Target:** Build 103 live by Aug 10-11, giving testers 4-5 days before tour starts Aug 15.

---

## Confirmation Required

After implementing all workstreams, provide:

1. Database query showing `user_preferences.cultural_interests` populated for a test user
2. Database query showing `user_preferences.diaspora_countries` populated for a test user
3. List of all 16 cities with their launch status and business counts
4. Screenshot of admin tester toggle UI (or endpoint documentation)
5. Screenshot of demo business card with "Test Business" indicator
6. Confirm: non-tester user sees NO demo businesses
7. Confirm: tester user sees demo businesses near their current location
8. Confirm: a user in Philadelphia can search/browse Charlotte and see real business pins
