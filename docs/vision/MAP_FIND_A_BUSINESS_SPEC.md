# Map — "Find a Business" Redesign Specification

> **Status:** Audit-first. Do NOT redesign until audit findings are reviewed and exact spec authorized.  
> Advisor instruction: *"I would therefore tell Replit not to redesign this yet. First have them audit..."*

---

## The Problem with the Current Approach

Tapping **Businesses** today dumps up to 200 pins simultaneously onto the map.  
- No radius
- No search intent
- No limiting
- Scales catastrophically as the platform grows (500 → 5,000 businesses)

---

## Vision: Three Sections on the Map Legend

### FIND (Search, not layers)
- 🔎 Find a Business
- 🔎 Find a Place
- 🔎 Find an Event

### CULTURE (Persistent optional layers — geography is the information)
- HBCUs
- Heritage Sites
- Museums
- Cultural Landmarks

### SAFETY (Persistent optional layers)
- Sundown Town History
- Community Safety
- Other approved safety layers

---

## "Find a Business" Search Panel

Tapping opens a compact panel:

```
What are you looking for?
[Search businesses, services, specialties, vibes, or needs...]

Suggested: Hair salon · Alopecia stylist · Black-owned brunch ·
           Tax attorney · Date night · Tattoo cover-up · Open now

Location
  ○ Near Me
  ○ This Map Area
  ○ City / ZIP

Distance
  5 mi · 10 mi · 25 mi · 50 mi

Refine
  Category · Specialty · Ownership · Vibe/THE REAL · Price · Accessibility · Community Signals

[Search]
```

---

## Key Behaviors

### Result Limits
- Start with ~10–15 most relevant results
- "Show More" and "Expand Area" controls for progressively loading more
- If 72 matches exist, show 10 ranked results + "10 of 72 nearby salons shown · Ranked for your search and preferences · Show More · Expand Area · Refine"
- If only 3 qualify for a specific specialty (e.g., Alopecia Care within 10 mi), show all 3

### Ranking (intended — not all layers exist yet)
distance + exact search match + specialty + community feedback + safety + user's explicit preferences + current Kinfolk context

### Near Me Behavior
"Near Me" = show a manageable number of relevant businesses close to where I am.  
NOT = put every business within an enormous area on the map.

### Search This Area
When user pans the map after a search:
- Show: "🔎 Search this area" prompt
- User decides when to refresh results
- Zoom out far: cluster results or show "Zoom in or choose a city to see nearby businesses"

### Two Search Modes
1. **Natural language**: "I need a Black-owned salon near me that specializes in alopecia." → Kinfolk interprets
2. **Structured filters**: Category > Subcategory > Specialty > Ownership > Distance > Vibe (same underlying data, no AI required)

### Search Must Understand the Full Taxonomy
Someone should not need to know that alopecia care = `Beauty → Hair Salons & Stylists → Alopecia Care`.  
They can type "someone who does alopecia hair" and get correct results.

---

## Relationship with KinfolkAI

Regular search: **"Hair Salon — 14 matches within 5 miles"**

Kinfolk: **"I found 14 nearby. These 4 seem closest to what you're looking for."**  
Then explain why:
> 2.1 mi · Alopecia Care · Black-owned  
> *Kinfolk members frequently say: "They Know Our Hair" and "Healthy Hair First."*

This is where the platform stops being a directory and becomes community intelligence.

---

## Audit Findings (completed August 9, 2026)

What currently exists in the codebase (read-only trace):

| Question | Finding |
|---|---|
| What renders the Businesses layer? | `map.tsx` — `useListBusinesses({})` hook with no params; markers created lines 626–647; toggle/visibility lines 770–778 |
| What API endpoint? | `GET /api/businesses` — no query params sent by map; server default `limit=200` |
| Does API support radius? | **NO** |
| Does API support result limiting? | YES — `limit` param, capped at 200 |
| Does API support category filter? | YES — `category` exact match |
| Does API support subcategory/specialty? | **NO** |
| Does API support vibes filter? | **NO** |
| Does API support THE REAL tags filter? | **NO** |
| Does API support ownership filter? | YES — `ownership` param (`black-owned` → `blackOwned=true`; others match `ownershipDesignations`) |
| Does API support text search? | YES — `search` param (not used by map) |
| Pin-level server search on map? | **NO** — map search box is client-side filter + geocoder pan only |
| Near Me API path? | **NO** — geolocation only recenters map; client-side Haversine sort |
| Search this area? | **NO** — no bounds-based refetch |
| Clustering? | **NO** — 200 individual markers, no clustering |
| Current ranking | Server: founding businesses → confidence score, membership tier premium, cultural preference. Client overrides with distance when location available |

**Already built and usable:** category, ownership, search, city, state, culturalPreference query params (just not wired to the map UI)

**Needs building:** radius/bounds query, subcategory/specialty filter, vibes filter, THE REAL filter, result count limiting in the map UI, "Search this area" refetch, Near Me API path, clustering, natural-language search interpretation

---

*Captured from founder advisor session, August 9, 2026. No implementation until "Please implement." authorization + full spec review.*
