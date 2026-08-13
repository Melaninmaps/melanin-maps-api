# Mapping With Melanin™ — Business Data Enrichment & Tag Matching Fix

## PASTE-READY REPLIT INSTRUCTIONS

**Priority:** P0 — Data integrity is broken across 76% of businesses
**Date:** August 13, 2026
**Context:** 2,639 active businesses, 76% have no website, 99.6% have no phone, 99.6% have no Instagram. Community Vibes and "Community Says" tags are mismatched to business categories.

---

## PART 1: FIX COMMUNITY VIBES & "COMMUNITY SAYS" TAG MATCHING

### The Problem:
Community Vibes and endorsement tags are being assigned to businesses WITHOUT matching the business category. A hair salon should NEVER show food-related tags. A restaurant should NEVER show beauty tags. A doctor should NEVER show "vibe" tags at all.

### The Rule:
**Tags MUST match the business's Main Category.** The founder provided explicit category-to-tag mappings in the Master Business Directory. These are NOT interchangeable.

### Category-to-Tag Mapping (STRICT — no exceptions):

**FOOD & DRINK (Restaurants, Cafes, Bakeries, Food Trucks):**
- Vibes: Romantic, Chill, Turn Up, Grown Folks, Family Time, Live Music, Eat Good, Date Night, Sunday Brunch, Late Night
- Endorsements: Seasoned Right, Worth The Wait, Grandma Approved, Made From Scratch, Portions Generous, Abuela Approved, Worth The Drive, Cookout Approved

**BEAUTY & PERSONAL CARE (Salons, Barbers, Nail Techs, Spas):**
- Vibes: Soft Life, Auntie Energy, Tía Energy, Main Character Energy, Sunday Best, Chill & Restore, Come As You Are, For The Culture, Neighborhood Love, Luxury Without The Attitude
- Endorsements: On Time Every Time, Clean Station, Worth The Price, Blessed Hands, They Know Our Hair, Sharpest Lineup, Fresh To Death, Knows My Texture, Style Lasted, Didn't Overbook Me

**HEALTH & WELLNESS (Doctors, Dentists, Therapists, OBGYNs):**
- Vibes: N/A — DO NOT SHOW VIBES. Show "The Real" instead.
- The Real: This Doctor Listens, Believed My Pain, Bedside Manner On Point, Made Me Feel Heard, Fought For Me, Culturally Competent, Respected My Birth Plan, Explained It Plain, Didn't Rush Me, Takes My Insurance Seriously

**LEGAL & GOVERNMENT (Lawyers, Notaries, Advocates):**
- Vibes: N/A — DO NOT SHOW VIBES. Show "The Real" instead.
- The Real: Fought For Me, Didn't Talk Down To Me, Returned My Calls, Understood My Situation, Kept My Family Together, Handled Immigration With Care, Explained The Process, Worth Every Dollar, Actually Showed Up

**FINANCIAL & BUSINESS (Banks, Accountants, Tax Prep, Credit Repair):**
- Vibes: N/A — DO NOT SHOW VIBES. Show "The Real" instead.
- The Real: Said Yes When Others Said No, No Predatory Terms, Explained It Plain, Helped My Credit, Respected My Small Numbers, Built My Business Plan, Didn't Judge My Situation, Transparent Fees

**PROFESSIONAL SERVICES (Consultants, Coaches, Photographers):**
- Vibes: N/A — DO NOT SHOW VIBES. Show "The Real" instead.
- The Real: Delivered On Time, Worth The Investment, Understood My Vision, Professional But Personal, Exceeded Expectations, Flexible With My Schedule

**HOME & PROPERTY (Contractors, Plumbers, Electricians, Movers):**
- Vibes: N/A — DO NOT SHOW VIBES. Show "The Real" instead.
- The Real: Fixed It Right The First Time, Fair Price, Showed Up On Time, Didn't Overcharge My Zip Code, Clean Work, Explained What They Did, Came Back When I Called

**AUTOMOTIVE & TRANSPORTATION (Mechanics, Detailers, Rideshare):**
- Vibes: N/A — DO NOT SHOW VIBES. Show "The Real" instead.
- The Real: Honest Diagnosis, Didn't Assume I Don't Know Cars, Fair Labor Rate, Showed Me The Problem, Didn't Talk Past Me, Quick Turnaround

**RETAIL & SHOPPING (Boutiques, Bookstores, Markets):**
- Vibes: Hidden Gem, Curated, For The Culture, Neighborhood Love, Black Girl Magic, Luxury Without The Attitude, One Of A Kind, Support Small
- Endorsements: Found Something Unique, Prices Fair, Owner Knows Your Name, Always Something New, Quality Over Quantity

**FAITH & SPIRITUAL (Churches, Mosques, Temples):**
- Vibes: The Spirit Lives Here, Felt The Ancestors, Community Not Just Congregation, All Are Welcome (And Mean It), Come As You Are, Healing Space
- Endorsements: Pastor/Imam Accessible, Youth Programs Strong, Feeds The Community, Welcomes All Identities, Music Moves You

**EDUCATION & CHILDREN (Daycares, Tutors, Schools, Youth Programs):**
- Vibes: N/A for formal education. Use endorsements only.
- Endorsements: My Kids See Themselves, They Get Our Hair, Culturally Affirming, Safe For My Baby, Diverse Staff, Curriculum Includes Us, Patient With My Child

**ENTERTAINMENT & NIGHTLIFE (Clubs, Lounges, Comedy, Music Venues):**
- Vibes: Turn Up, Grown Folks, Chill, Live Music, Date Night, Late Night, VIP Energy, No Drama, Good Energy Only
- Endorsements: DJ Knows The Culture, Security Respectful, Drinks Worth The Price, Always A Good Time, Safe Vibes

**TRAVEL & HOSPITALITY (Hotels, Airbnbs, Tour Guides, Excursions):**
- Vibes: Romantic, Chill, Adventure, Luxury, Budget Friendly, Family, Solo Traveler Friendly, Hair Friendly
- Endorsements: Hair Friendly Water & Towels, Felt Safe As A Minority, Staff Respectful, Clean, Location Perfect, Worth The Price

**TECHNOLOGY & DIGITAL (IT, Web Design, App Dev):**
- Vibes: N/A — DO NOT SHOW VIBES. Show "The Real" instead.
- The Real: Delivered On Time, Didn't Overcharge, Explained In Plain Language, Available After Launch, Understood My Vision, Responsive

### Implementation:

1. **Create a category_tag_mapping table** that maps each Main Category to its allowed Vibe tags and Endorsement tags.

2. **On every business page render:**
   - Look up the business's `mainCategory`
   - Query the `category_tag_mapping` for that category
   - ONLY display tags that are in the allowed list for that category
   - If the category is marked "N/A" for vibes, DO NOT render the "Community Vibes" section at all — render "The Real" section instead

3. **For existing businesses with mismatched tags:**
   - Run a migration that removes any tags from businesses that don't match their category
   - Example: If a nail salon has "Worth The Wait" (food tag), REMOVE it
   - Example: If a restaurant has "Sharpest Lineup" (barber tag), REMOVE it

4. **Validation rule (permanent):**
   - When a community member taps a tag on a business, the system MUST verify the tag is in the allowed list for that business's category BEFORE recording the tap
   - If someone tries to tap "Grandma Approved" on a law firm, the tap is rejected silently (the tag shouldn't even be showing)

5. **Verification test:**
   ```sql
   -- This should return 0 rows after fix
   SELECT b.name, b.main_category, bt.tag_name 
   FROM businesses b 
   JOIN business_tags bt ON b.id = bt.business_id 
   WHERE bt.tag_name NOT IN (
     SELECT tag_name FROM category_tag_mapping 
     WHERE category = b.main_category
   );
   ```

---

## PART 2: BUSINESS DATA ENRICHMENT (Find Missing Websites, Social Media, Phone Numbers)

### The Problem:
- 2,017 businesses (76%) have NO website
- 2,630 businesses (99.6%) have NO phone number
- 2,628 businesses (99.6%) have NO Instagram
- 2,028 businesses are completely bare — name and address ONLY

These businesses were seeded by Replit from various sources. The founder needs to know: ARE THESE BUSINESSES EVEN REAL? And if they are, they need contact information so users can actually visit them.

### The Solution: Automated Enrichment Pass

Replit must perform a data enrichment pass across ALL seeded businesses using the following process:

#### Step 1: Verify the Business Exists
For each business with only a name and address:
1. Search Google for: "[Business Name] [City] [State]"
2. Check if a Google Business Profile exists
3. Check if a website, phone number, or social media appears in results
4. If NOTHING comes up — flag the business as `needs_verification: true`

#### Step 2: Extract Available Data
When a business IS found online, extract:
- **Website URL** (official website)
- **Phone number** (from Google Business Profile or website)
- **Instagram** (search Instagram for the business name + city)
- **Facebook** (search Facebook for the business name + city)
- **TikTok** (if applicable — beauty, food, entertainment businesses)
- **Hours of operation** (from Google Business Profile or website)
- **Price range** ($ / $$ / $$$ / $$$$)

#### Step 3: Confidence Levels
For each piece of data found, assign a confidence level:

| Confidence | Meaning | Action |
|:---|:---|:---|
| HIGH | Found on Google Business Profile with matching name + address | Auto-populate |
| MEDIUM | Found a likely match but address differs slightly or name is slightly different | Auto-populate but flag for review |
| LOW | Found something similar but can't confirm it's the same business | SKIP — do not populate |
| NONE | Cannot find this business online at all | Flag as `needs_verification: true` |

#### Step 4: Rules for Enrichment

**DO:**
- Use Google Business Profile as primary source (most reliable)
- Cross-reference the address — if the Google result shows a different address than what's in our database, flag it but don't overwrite
- Populate website, phone, Instagram, Facebook, hours when found with HIGH confidence
- Mark businesses as `enriched: true` with a timestamp after processing
- Log what was found and what was skipped for audit trail

**DO NOT:**
- Invent or fabricate ANY data
- Use a phone number from a different business with a similar name
- Assume two businesses with the same name in different cities are the same
- Populate data from a business that has CLOSED (check if Google shows "Permanently Closed")
- Override any data the founder manually entered (check `source` field — if `source = 'founder'`, never overwrite)

#### Step 5: Handle Businesses That Can't Be Found

If a business cannot be verified online:
1. Set `needs_verification: true`
2. Set `verification_note: "Could not find online presence as of [date]"`
3. DO NOT delete the business — it may be a very small local business without an online presence
4. These businesses should display a note to users: "This business was community-recommended. Help us verify — have you been here?"
5. Provide the founder with a list of all unverifiable businesses so she can manually confirm or remove them

#### Step 6: Reporting

After the enrichment pass, provide a report:

```
ENRICHMENT RESULTS:
- Total businesses processed: [X]
- Successfully enriched (HIGH confidence): [X] ([%])
- Partially enriched (MEDIUM confidence): [X] ([%])
- Could not find online (flagged): [X] ([%])
- Already had complete data (skipped): [X] ([%])

DATA POPULATED:
- Websites added: [X]
- Phone numbers added: [X]
- Instagram handles added: [X]
- Facebook pages added: [X]
- Hours added: [X]

FLAGGED FOR REVIEW:
- Businesses that may have closed: [X]
- Businesses with address mismatches: [X]
- Businesses that cannot be found online: [X]
```

---

## PART 3: VERIFICATION THAT SEEDED BUSINESSES ARE REAL

### The Concern:
The founder does not know if these 2,639 businesses are all real. Replit seeded them from various sources. Some may be:
- Closed permanently
- Duplicates with slightly different names
- Incorrectly categorized
- In the wrong city/state
- Completely fabricated by an AI hallucination

### Verification Process:

1. **For every business, attempt to verify it exists** using Google Search, Google Maps, or Yelp
2. **If a business cannot be verified after reasonable search:**
   - Mark it `verification_status: 'unverified'`
   - It should NOT appear in search results until verified
   - Add to a "Needs Community Verification" queue
3. **If a business is confirmed CLOSED:**
   - Mark it `verification_status: 'closed'`
   - Remove from active listings
   - Optionally show "This business has permanently closed" if someone searches for it
4. **If a business is confirmed REAL:**
   - Mark it `verification_status: 'verified'`
   - Populate any missing data found during verification

### Priority Order for Verification:
1. Tour cities first (Philadelphia, DC, Richmond, Charlotte, Columbia, Atlanta, Birmingham, New Orleans, Houston)
2. Then satellite cities (Allentown, Abington, Harrisburg, Chicopee)
3. Then remaining cities

---

## PART 4: WHAT SUCCESS LOOKS LIKE

After these instructions are complete:

- [ ] Every business page shows ONLY tags appropriate for its category
- [ ] No hair salon shows food tags
- [ ] No restaurant shows beauty tags
- [ ] Professional businesses show "The Real" instead of "Community Vibes"
- [ ] At least 60% of businesses have a website or social media link
- [ ] At least 40% of businesses have a phone number
- [ ] All businesses have a `verification_status` field
- [ ] Unverifiable businesses are flagged and not shown to users by default
- [ ] A full enrichment report is provided to the founder
- [ ] The category_tag_mapping table exists and is enforced on every render

---

## TIMELINE:

- Tag matching fix: Should be immediate (it's a rendering logic change + one migration)
- Data enrichment: This is a larger task. Prioritize tour cities first. Provide progress reports every 100 businesses processed.
- Verification: Can run alongside enrichment — if you can't find the business online, it's both unenriched AND unverified.

**DO NOT mark this as complete without providing the enrichment report and verification counts.**
