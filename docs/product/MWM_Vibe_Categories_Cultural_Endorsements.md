# Vibe Categories & Cultural Endorsement Language — Audit & Recommendations

**Status:** ADD TO BUILD 105 (Business Profile Card)  
**Source:** Manus AI audit — Aug 5, 2026

---

## What Replit Currently Has

### Vibe Tags (12 total — from vibes.ts)
| ID | Label | Description | Appropriate For |
|---|---|---|---|
| date-night | Date Night | Romantic, intimate, couples | Restaurants, lounges, entertainment ✅ |
| group-hangout | Group Hangout | Lively, social, great for squads | Bars, bowling, events ✅ |
| solo-vibes | Solo Vibes | Quiet, chill, recharge energy | Cafes, bookstores, parks ✅ |
| bougie-treat | Bougie Treat | Upscale, elevated, special occasion | Fine dining, spas, hotels ✅ |
| hood-classic | Hood Classic | Authentic, local, community staple | Soul food, barbershops, corner stores ✅ |
| soul-food | Soul Food | Southern comfort, home cooking, real flavor | Restaurants only ✅ |
| late-night | Late Night | After dark, nightlife, good energy | Bars, clubs, lounges ✅ |
| family-time | Family Time | Kid-friendly, wholesome, all ages | Restaurants, parks, education ✅ |
| creative-scene | Creative Scene | Art, music, culture, expression | Galleries, studios, venues ✅ |
| wellness | Wellness | Health, spa, spiritual, balance | Gyms, spas, yoga ✅ |
| work-and-study | Work & Study | Productive, WiFi, focused energy | Cafes, coworking, libraries ✅ |
| adventure | Adventure Ready | Active, explorative, outdoors | Parks, tours, excursions ✅ |

---

## Problem 1: Vibes Apply to Everything (Including Dentists) — MUST FIX in Build 105

Current system lets ANY business be tagged with ANY vibe. A dentist office is NOT a "Hood Classic" or a "Date Night."

### The Fix: `businessType` Classification

Every business needs a `businessType` field that determines which discovery features apply:

| Business Type | Vibes Apply? | Cultural Endorsements Apply? | Discovery Method |
|---|---|---|---|
| `experience` (restaurants, bars, salons, entertainment, cultural sites) | ✅ YES | ✅ YES ("Auntie Approved", "Tía's Pick") | Vibe search + endorsements |
| `service` (dentists, lawyers, accountants, mechanics, doctors) | ❌ NO | ✅ YES (different language: "Community Trusted", "5-Star Professional") | Category search + trust score |
| `retail` (shops, boutiques, online stores) | ✅ SOME (Bougie Treat, Shopping) | ✅ YES ("Certified Fresh", "Community Staple") | Category + vibe hybrid |
| `community` (nonprofits, churches, organizations) | ❌ NO | ✅ YES ("Community Pillar") | Category search only |

**Rule:** Vibes are for places you GO TO for an EXPERIENCE. Not for places you go because you NEED something fixed. Nobody says "I'm in a Hood Classic mood, let me find a dentist."

---

## Problem 2: Cultural Endorsement Language Missing — MUST FIX in Build 105

Cultural Phrases document covers REGIONAL language but not CULTURAL COMMUNITY endorsements.

### Cultural Endorsement Badges by Community

Badges are EARNED (not self-assigned) — triggered when X community members endorse (10 for small cities, 25 for large cities). The system detects which cultural community endorsed based on endorser's heritage profile from onboarding Step 2.

#### Black American / African American
| Badge | Use When | Appropriate For |
|---|---|---|
| "Auntie Approved" | 10+ endorsements | Soul food, home cooking, comfort food |
| "Uncle's Pick" | 10+ endorsements | Barbershops, auto shops, sports bars |
| "Sunday Best" | High atmosphere ratings | Churches, fine dining, formal venues |
| "Cookout Certified" | Community staple, feels like family | Casual restaurants, BBQ, gathering spots |
| "Real Ones Know" | Hidden gem, word-of-mouth | Any experience business with loyal following |
| "Community Pillar" | Long-standing, trusted | Professional services, nonprofits, churches |
| "Fresh to Death" | Consistently excellent quality | Salons, barbershops, boutiques |

#### Hispanic / Latino
| Badge | Use When | Appropriate For |
|---|---|---|
| "Tía Approved" / "Aprobado por la Tía" | 10+ Hispanic community endorsements | Restaurants, bakeries, home cooking |
| "Sazón Certified" | Exceptional flavor/seasoning | Restaurants, food trucks, catering |
| "Como en Casa" (Like Home) | Feels like being at home | Family restaurants, cultural centers |
| "Abuela's Pick" / "La Favorita de Abuela" | Traditional, authentic, generational | Bakeries (panaderías), traditional restaurants |
| "Barrio Staple" | Community institution | Corner stores, taquerias, community orgs |
| "De Confianza" (Trustworthy) | Reliable, honest, community-trusted | Professional services, mechanics, doctors |

#### Ethiopian / East African
| Badge | Use When | Appropriate For |
|---|---|---|
| "Habesha Approved" | Ethiopian/Eritrean community endorsed | Ethiopian restaurants, coffee shops |
| "Buna Certified" (Coffee Certified) | Exceptional coffee experience | Coffee shops, cafes |
| "Injera & Love" | Authentic, communal dining | Ethiopian restaurants |
| "Like Mama's Kitchen" | Feels like home cooking | Any restaurant with home-style feel |
| "Community Blessed" | Trusted by the community | Professional services, cultural centers |

#### Caribbean (Jamaican, Haitian, Trinidadian, etc.)
| Badge | Use When | Appropriate For |
|---|---|---|
| "Yard Approved" (Jamaican) | Caribbean community endorsed | Jamaican restaurants, jerk spots |
| "Lakay" (Haitian — "Home") | Feels like home | Haitian restaurants, cultural spaces |
| "Trini Certified" | Trinidadian community endorsed | Doubles spots, roti shops |
| "Island Vibes" | Authentic Caribbean atmosphere | Restaurants, music venues, cultural events |
| "Real Ting" | Authentic, no shortcuts | Any Caribbean food establishment |
| "Manman's Pick" (Haitian — "Mama's Pick") | Traditional, home-style | Haitian restaurants, bakeries |

#### West African (Nigerian, Ghanaian, Senegalese, etc.)
| Badge | Use When | Appropriate For |
|---|---|---|
| "Naija Approved" (Nigerian) | Nigerian community endorsed | Nigerian restaurants, shops |
| "Chop Life Certified" (Nigerian — "Enjoy Life") | Exceptional food/experience | Restaurants, entertainment |
| "Mama Put" (Nigerian — street food vendor) | Authentic, affordable, delicious | Food vendors, casual restaurants |
| "Jollof Certified" | Outstanding jollof rice | West African restaurants |
| "Wahala-Free" (Nigerian — "No trouble") | Smooth, reliable service | Professional services, any business |
| "Chez Nous" (Senegalese — "Our Place") | Community gathering spot | Senegalese restaurants, cultural centers |

#### Vietnamese / Southeast Asian
| Badge | Use When | Appropriate For |
|---|---|---|
| "Phở Real" | Authentic, exceptional Vietnamese food | Vietnamese restaurants, phở shops |
| "Bà Nội's Pick" (Grandma's Pick) | Traditional, generational recipes | Restaurants, bakeries |
| "Community Gem" | Trusted by the community | Any business with strong community ties |
| "Flavor Certified" | Outstanding taste/quality | Restaurants, food vendors |

#### Korean
| Badge | Use When | Appropriate For |
|---|---|---|
| "Halmeoni Approved" (Grandma Approved) | Traditional, authentic | Korean restaurants, markets |
| "Daebak" (Amazing/Awesome) | Exceptional quality | Any experience business |
| "K-Town Certified" | Community staple in Korean community | Korean businesses, markets |

#### Indigenous / Native American
| Badge | Use When | Appropriate For |
|---|---|---|
| "Elder Approved" | Indigenous community endorsed | Cultural centers, art galleries, restaurants |
| "Sacred Ground" | Culturally significant location | Heritage sites, cultural centers |
| "Community Honored" | Respected institution | Any business with deep community roots |

#### Brazilian
| Badge | Use When | Appropriate For |
|---|---|---|
| "Aprovado pela Vovó" (Grandma Approved) | Traditional, authentic | Brazilian restaurants, bakeries |
| "Saudade Certified" (Nostalgia/Longing) | Makes you feel like you're back home | Cultural spaces, restaurants |
| "Comunidade" (Community) | Community gathering spot | Brazilian businesses, cultural centers |

---

## Problem 3: Professional Services Need Different Language — MUST FIX in Build 105

A dentist doesn't get "Auntie Approved." Professional service endorsements are culture-neutral, trust-based:

| Badge | Use When | Appropriate For |
|---|---|---|
| "Community Trusted" | 20+ positive reviews | Doctors, dentists, lawyers, accountants |
| "5-Star Professional" | Consistent 5-star ratings | Any professional service |
| "Been Here for Us" | Long-standing service to community | Established professional practices |
| "No Judgment Zone" | Community reports feeling safe/welcome | Mental health, medical, legal |
| "They Get It" | Community feels understood culturally | Any professional who demonstrates cultural competence |
| "Referred by Family" | High referral rate from existing clients | Any professional service |

---

## Problem 4: "Black Professionals" Category — REMOVE

**Current:** `"Black Professionals"` exists as a business category.  
**Problem:** Implies only Black professionals are on the platform. What about Hispanic lawyers? Ethiopian doctors?  
**Fix:** Remove from `VALID_CATEGORIES`. Professional services are already covered by `"Professional Services"`. Ownership designation (minority-owned, Black-owned, etc.) handles cultural identity — the CATEGORY describes what the business DOES, not who owns it.

---

## How the System Works Together

- **User searches by vibe:** "I'm feeling Date Night" → restaurants, lounges, entertainment. NOT dentists or lawyers.
- **User searches by need:** "I need a dentist" → dental practices sorted by community trust score and endorsements. No vibes.
- **User browses by culture:** "Show me Ethiopian restaurants" → Habesha Approved badges, Buna Certified tags, regional slang from that city.
- **Badge is earned:** When 10+ Ethiopian community members endorse an Ethiopian restaurant → earns "Habesha Approved" automatically. NOT self-assigned.
- **Kinfolk uses the language:** "Since you've been browsing Ethiopian spots, here's one that's Habesha Approved with 47 endorsements — the injera is supposed to be incredible."

---

## Implementation Notes for Replit

1. Add `businessType` field: `"experience" | "service" | "retail" | "community"` — determines which discovery features apply
2. Vibe tags only show on `experience` + some `retail` businesses — never on `service` or `community`
3. Cultural endorsement badges are EARNED — triggered when X members from that cultural community endorse (10 for small cities, 25 for large cities)
4. System detects which cultural community endorsed — based on endorser's heritage profile (onboarding Step 2)
5. Multiple badges can coexist — a Nigerian restaurant in Houston can be "Naija Approved" + "H-Town Certified" + "Hood Classic"
6. Professional services get trust-based badges only — "Community Trusted", "5-Star Professional"
7. Remove `"Black Professionals"` from `VALID_CATEGORIES` — `"Professional Services"` already exists
8. Endorsement language displayed on business card — Layer 2 (Community Voice) of the 4-layer profile card

---

## Verification Checklist for Replit

- [ ] `businessType` classification for 5 example businesses (restaurant → experience, dentist → service, boutique → retail, nonprofit → community, barbershop → experience)
- [ ] Vibes do NOT appear on service-type businesses
- [ ] Cultural endorsement badge earn/display flow demonstrated
- [ ] "Black Professionals" category removed or renamed
- [ ] Kinfolk using cultural endorsement language in a recommendation
