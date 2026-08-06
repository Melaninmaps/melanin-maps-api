# Product Specification: Dynamic Endorsement Tag System

**Status:** ADD TO BUILD 105 (Business Profile Card)  
**Source:** Manus AI spec — Aug 5, 2026

---

## 1. Overview

Replaces the current static "What stands out?" tags (14 universal tags for every business) with an adaptive, context-aware system that dynamically generates tags based on a business's `businessType` and `culturalCommunity`. Goal: culturally relevant, business-appropriate tags that accurately reflect the diverse experiences on the platform.

### The Problem

A dentist should not receive the same tags as a soul food restaurant. Professional services require tags emphasizing trust and cultural competence, not "Worth Every Visit." Culturally specific businesses should have access to culturally resonant tags (e.g., "Abuela Approved" for a Hispanic bakery).

---

## 2. Tag Categories

### 2.1 Universal Tags (ALL business types)

| Current Tag | Action | New Tag | Notes |
|---|---|---|---|
| Hidden Gem | Keep | Hidden Gem | |
| Community Favorite | Keep | Community Favorite | |
| Safe Space | Keep | Safe Space | |
| Truly Welcoming | Keep | Truly Welcoming | |
| I'll Be Back | Keep | I'll Be Back | |
| Black Excellence | Replace | Community Excellence | Culturally adaptive (see Section 4) |
| Five-Star Experience | Remove | N/A | Too generic; sounds like Yelp |

### 2.2 Experience Business Tags
Applicable to restaurants, bars, entertainment venues, cultural sites.

**Food & Restaurant:**
- Worth the Wait, Made from Scratch, Portions are Generous / "They Don't Play About Portions", Seasoned Right / "The Seasoning is There", Cookout Certified, Comfort Food Done Right
- "Sazón Certified" (Hispanic), "Jollof Certified" (West African), "Real Ting" (Caribbean)

**Food & Restaurant (Adaptive — "Home Cooking" family):**
- Grandma Approved (Black American)
- Abuela Approved (Hispanic)
- Habesha Approved (Ethiopian)
- Yard Approved (Caribbean/Jamaican)
- Naija Approved (Nigerian)
- Bà Nội's Pick (Vietnamese)
- Halmeoni Approved (Korean)
- Aprovado pela Vovó (Brazilian)

**Bar/Lounge/Nightlife:**
- Vibes on Point, DJ Knows What They're Doing, Strong Pours, Good Energy, Safe for Women, "The Playlist Hit Different"

**Entertainment/Events:**
- Worth the Ticket Price, Unforgettable Experience, Bring Your Whole Crew, Culture Lives Here

### 2.3 Beauty & Barber Tags
- Sharpest Lineup in Town, Left Looking Right, Knows My Texture, No Rush, "They Understand 4C", Fresh to Death, Transformation Artist, "My Go-To" / "Been Going for Years", Gentle Hands

### 2.4 Professional Service Tags
Replaces "Above & Beyond" and "Exceptional Service" from legacy system.

**Medical:**
- This Doctor Listens, Bedside Manner on Point, Took Time to Explain Everything, Made Me Feel Heard, Didn't Rush Me, Culturally Competent, "I Finally Found MY Doctor", No Judgment, Gentle, "Understands Our Bodies"

**Legal:**
- Fought for Me, Explained Everything in Plain English, Responsive and Available, "They Actually Care", Trustworthy with My Business

**Financial/Accounting:**
- Made It Make Sense, Helped Me Build Wealth, Patient with My Questions, "Finally Understand My Taxes"

**Therapy/Mental Health:**
- Safe to Be Vulnerable, Gets My Cultural Context, No Judgment Zone, "Changed My Life", Understands Generational Trauma

### 2.5 Retail Tags
- Unique Finds, Quality Over Quantity, Fairly Priced, "I Always Find Something", Supports Local Artists, "My Secret Spot", Culturally Curated

### 2.6 Professional Contributor Badges (content creators / knowledge contributors)

**Health/Medical:** Community Educator, Trusted Voice in Health, "Breaks It Down Simply", Evidence-Based  
**Legal/Financial:** Community Advocate, "Keeps Us Informed", Plain Language Expert  
**Cultural Ambassadors/Travel:** Globe Trotter, Culture Keeper, "Been There, Done That", Hidden Gem Finder, "Trust Their Recommendations", Storyteller  
**General Content:** Consistent Creator, Community Voice, "Always Helpful", Rising Star

---

## 3. Technical Implementation

### 3.1 Tag Resolution Logic (order of operations)
1. Check `businessType` — broad category (experience, service, retail, community)
2. Check `category` — specific sub-category (restaurant, dentist, salon)
3. Check `culturalCommunity` — ownership/affiliation
4. Aggregate: UNIVERSAL tags + TYPE-SPECIFIC tags + CULTURAL tags (if applicable)
5. Display counts on business card (e.g., "47 people said 'Worth the Wait'")

### 3.2 UI/UX
- Tappable pill design (consistent with current design language)
- Dynamically constructed per-business — not a static list
- Review form fetches available tags based on current business context before rendering

---

## 4. Display on Business Card (Layer 2 — Community Voice)

Show TOP 3 endorsement tags sorted by count.

**Experience example:**
> "101 said Worth the Wait"  
> "87 said Grandma Approved"  
> "64 said Made from Scratch"

**Professional example:**
> "89 said This Doctor Listens"  
> "76 said Bedside Manner on Point"  
> "52 said Made Me Feel Heard"

---

## 5. Cultural Adaptivity Rules

### 5.1 "Home Cooking" Tag Family
Sentiment: "This tastes like home. Like someone's grandmother made it with love."

| Business Cultural Community | Displayed Tag |
|---|---|
| Black-owned | Grandma Approved |
| Hispanic-owned | Abuela Approved |
| Ethiopian-owned | Habesha Approved |
| Vietnamese-owned | Bà Nội's Pick |
| Korean-owned | Halmeoni Approved |
| Caribbean-owned | Yard Approved |
| Nigerian-owned | Naija Approved |
| Brazilian-owned | Aprovado pela Vovó |

### 5.2 "Excellence" Tag Family
Legacy "Black Excellence" → culturally adaptive equivalent.

| Business Cultural Community | Displayed Tag |
|---|---|
| Default/General | Community Excellence |
| Ethiopian-owned | Habesha Excellence |
| Hispanic/Latino-owned | Orgullo Latino |

---

## 6. Verification Checklist for Replit

- [ ] `businesses` table (or equivalent) includes `businessType`, `category`, `culturalCommunity` fields
- [ ] Tags stored with metadata: `applicableTypes: ['restaurant', 'bar']`, `culturalMapping: { 'Hispanic': 'Abuela Approved' }`
- [ ] Review submission API associates selected tags with business and increments counters
- [ ] Business profile API aggregates and returns top 3 tags by count for display
- [ ] Review form component fetches/computes available tags based on business context before rendering pills
