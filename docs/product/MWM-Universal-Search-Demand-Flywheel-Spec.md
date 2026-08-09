# MWM Universal Search + Demand Flywheel — Full Specification
*Source: Founder strategic documents, August 9, 2026*
*Status: READ-ONLY AUDIT COMPLETE. No implementation until authorized.*

---

## Core Product Principle

> **MWM should learn not only from what people review, but from what they are trying to find.**

> **A business or creator should learn what their community wants without learning who privately searched for it.**

> **ZERO RESULTS IS A SIGNAL, NOT AN END STATE.**

---

## The Flywheel

```
Search → intent signal → matching → discovery → engagement
→ contribution → smarter recommendations → business/creator opportunity
→ more relevant supply → better future search
```

One example:
```
"Fruity Pebble waffles near me"
→ MWM searches businesses, specialties, menus, community comments, videos, posts
→ User selects brunch business → checks in → taps vibes → posts social URL
→ MWM now knows that business matches "Fruity Pebble waffles"
→ Nearby businesses see: "Specialty waffle searches trending nearby"
→ Cultural Ambassador sees: "Specialty brunch trending in Philadelphia"
→ Next search has better business results AND better community content
```

---

## What Users Search For (Not Just Business Names)

```
Fruity Pebble waffles          → product/menu item
tea parties near me            → experience + location
luxury spa Cabo                → experience + location
natural hair salon for alopecia → specialty + health
tax attorney immigrant business → profession + specialty + community
Ethiopian restaurants I-95     → cuisine + route
Black-owned florists weddings  → ownership + specialty + occasion
quiet brunch grown folks       → vibe + occasion
rooftop dinner live jazz       → atmosphere + entertainment
Dominican bakery tres leches   → cuisine + product
autism-friendly barber         → specialty + accessibility
safe gas station road trip     → safety + travel + category
hotels Howard Homecoming       → event proximity + travel
family photographer darker skin → specialty + cultural expertise
Kenya                          → Library topic → country hub
welding                        → Library topic → skills/trades
```

A search is BOTH:
1. A DISCOVERY REQUEST for the member
2. An anonymized DEMAND SIGNAL for the MWM ecosystem

---

## Search Surface Architecture (One System, Different Doors)

| Surface | Primary Behavior | Query Framing |
|---|---|---|
| Map Search | "Show me WHERE" | Geographic pins |
| Explore Search | "Help me FIND" | Broad discovery (businesses + content + posts + events) |
| Library Search | "Help me LEARN" | Knowledge/cultural content |
| KinfolkAI | "Help me FIGURE IT OUT" | Conversational, inferential |

**Underneath: same search intelligence.** Different presentation per surface.

Map search field label: `What are you looking for?` (not "Search businesses")
Map filters (Cultural Sites, HBCUs, Festivals, etc.) remain — filters answer "Show me what's around here."

---

## Entity Types the Search Engine Must Eventually Cover

```
Business          Product/menu item    Service
Specialty         Experience           Vibe
Occasion          Location             Cultural identity
Ownership         Community phrase     Library topic
Event             Creator/media        Heritage place
Safety/travel context
```

---

## Zero-Results Fallback Ladder (Kinfolk + Search)

Kinfolk must NEVER fabricate an exact match. When no exact result exists:

| Level | What Kinfolk Offers | Trust Basis |
|---|---|---|
| 1 | Exact confirmed match | Verified business data, menu info, business media, credible community evidence |
| 2 | Community-confirmed match | Multiple member posts/reviews/tags for that item at a business |
| 3 | Closely related item | Cereal waffles, specialty waffles, loaded waffles, creative brunch |
| 4 | Behavioral/community affinity | People who searched this also saved/visited/positively reviewed X |
| 5 | Experience/vibe match | What the query MEANS: fun, creative food, Instagram-worthy — only where data supports it |
| 6 | Nearby category alternative | "3 highly regarded brunch spots within 3 miles" |
| 7 | Ask permission to expand | "Nothing close enough? I can expand to 10 miles." |

Kinfolk's language distinguishes ladder levels:
- Level 1: "X serves Fruity Pebble waffles" ← confirmed
- Level 4: "Members looking for similar experiences frequently choose X" ← behavioral
- Level 6: "Here are three highly regarded brunch spots nearby" ← category alternative

**Hard rule: Kinfolk must clearly distinguish exact matches from inferred alternatives.**

---

## Demand Signal Architecture

### Privacy Rules
- Businesses and Cultural Ambassadors receive AGGREGATED demand — never individual search histories
- Display threshold: do not show specific counts below minimum (e.g., don't say "2 people searched for this")
- Below threshold: "Others nearby are looking for this too."
- Above threshold: "37 members in this area have searched for similar brunch experiences recently."

### Business Notification Model

Notification triggers: relevance + frequency + geography + recency threshold

```
"12 people within 5 miles searched for specialty waffles this week."
"Your supporters are looking for tea parties nearby."  ← most powerful — own followers/savers
```

Business response options:
```
[ Yes — Add to my profile ]    → adds specialty, improves future search instantly
[ Something similar ]          → tags related item
[ Not something we offer ]     → dismisses, doesn't affect other businesses
```

Only notify RELEVANT businesses. "Fruity Pebble waffles" → brunch/bakery/restaurant. NOT the nearby law office.

### Cultural Ambassador Demand Signal
```
"Members planning Cabo trips are searching for: luxury spas, Black traveler experiences, couples activities"
→ Ambassador creates content
→ Content enters Library / Explore / search ecosystem
→ Future searches get richer answers
```

---

## Search Intent Object (Future Data Model)

```
raw_query           "Fruity Pebble waffles near me"
intent_type         product/menu item
normalized_concept  specialty waffles
exact_terms         Fruity Pebble waffles
location_context    user's approximate area (NOT precise)
business_categories restaurant / brunch / bakery
vibes               [only where data supports — do NOT infer unnecessarily]
timestamp
results_found       count
result_engagement   clicked / saved / directions / none
```

Privacy: individual records never exposed to businesses. Only aggregated signals cross the privacy boundary.

---

## Library Flywheel Connection

Search demand reveals missing Library topics:

```
Many searches for "welding" + no Library topic exists
→ Library topic shell created: Skilled Trades → Welding
→ Authority model assigned (community contributions ok, not medical/legal)
→ Community and verified sources populate it
```

Search also builds connections:
```
"Kenyan hair braiders Philadelphia"
→ learns: Kenya → Kenyan diaspora → Philadelphia → Beauty → Braiding
→ enriches Kenya book without manual curation
```

---

## Collaborative Filtering (Future)

People who searched "Fruity Pebble waffles" also tended to:
- save Business A
- visit Business B
- watch Creator C's brunch video
- tap "Worth Every Visit" on Business D
- search "birthday brunch"
- choose "Fun & Social" vibe
- save a brunch event

Aggregate relationships learned — no individual tracking needed.

---

## Applied to Hard Searches

**"Black woman OB-GYN specializing in fibroids"**
No exact match → specialty → relevant providers → community-trusted providers → expand geography → Library resources

**"Tax attorney speaks Haitian Creole"**
No exact match → profession + specialty + language → nearby related professionals → community recommendations → expand radius → Library/legal resources

**"Luxury spa Cabo, Black-woman-owned"**
No exact match → separate criteria: "I couldn't confirm a Black-woman-owned luxury spa in Cabo yet. I did find these luxury spa experiences, and these Black-owned businesses nearby."

---

## Non-Negotiable Rules

1. **Kinfolk never fabricates exact availability to avoid zero results**
2. **Businesses receive aggregate demand, never individual search histories**
3. **Historical sundown/safety context is never presented as active danger via search**
4. **Ownership designations are never inferred from search results — only from verified data**
5. **The Map search field is never just renamed — the underlying search capability must be audited first**
6. **Map filters (browse) and Universal Search (intent) are different tools that complement each other**
7. **Zero results is a signal, not a dead end — always trigger the fallback ladder**
