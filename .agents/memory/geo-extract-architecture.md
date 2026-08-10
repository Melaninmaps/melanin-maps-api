---
name: Geo-extract map search architecture
description: Natural-language geography extraction for the map search pipeline — separates WHERE from WHAT before geocoding
---

## The Problem It Solved
"Phuket restaurants" → Nominatim found a restaurant named "Phuket" in Oslo, Norway (class=amenity) → map panned to Oslo.
"Phuket night life" → Nominatim returned NO RESULT (no place called "Phuket night life") → map didn't move.

## Product Rule (permanent)
GEOCODER answers: WHERE IS THIS?
MWM DATABASE answers: WHAT DO WE HAVE THERE?
These must never merge. Nominatim/OSM POIs never appear as MWM business results.

## The Endpoint
`GET /api/maps/geo-extract?q=Phuket+restaurants`
Returns: `{ hasLocation, locationQuery, contentQuery, lat, lng, formattedAddress }`

**Why:** requireAuth is on this route (all maps routes require auth). Unauthenticated requests return 401 JSON — which looks like NO_GEO to callers.

## Algorithm (in order)
1. Normalize two-word intent phrases: "night life" → "nightlife", "child care" → "childcare"
2. Preposition pattern: "X in/near/at/around Y" → content=X, location=Y
3. Strip CONTENT_TOKENS (80+ words: restaurants, nightlife, spa, church, braider, owned, black, romantic, etc.) → remaining = geo candidate
4. Geocode ONLY the geo candidate via Nominatim (3 hits, addressdetails=0)
5. **Validate:** reject class=amenity (specific businesses/POIs), class=highway, class=shop. Accept: place, boundary, natural, administrative, landuse, leisure, tourism (non-hotel/restaurant)
6. Return hasLocation=false if no valid geographic result

## Client Usage (map.tsx)
- `runUniversalSearch` calls geo-extract FIRST (awaits it), then pans map to detected lat/lng
- Passes detected lat/lng to MWM DB search (overrides userCoords when geography detected)
- Full original query still passes to universal search so Pass 2.5 city detection works
- Zero-result state: "No MWM listings in [city] yet" + "View all MWM places in X" + Add a Place

## Known Gap (post-launch)
International businesses (Phuket, Jamaica, Bangkok) exist in the DB (26 Thailand, etc.) but universal search returns 0 even with detected lat/lng passed. Root cause: unknown — possibly Pass 2.5 city name mismatch or radius too small. Map pans correctly; honest empty state shows.

## Verified Test Cases (13/13 ✅ in production)
- "Phuket restaurants" → loc=Phuket lat=7.94 lng=98.35 content=restaurants
- "Phuket night life" → loc=Phuket lat=7.94 lng=98.35 content=nightlife
- "restaurants in Phuket" → loc=Phuket content=restaurants
- "nightlife in Bangkok" → loc=Bangkok lat=13.75 lng=100.49
- "Bangkok restaurants" → loc=Bangkok
- "Jamaica restaurants" → loc=Jamaica lat=18.19 lng=-77.39
- "Philadelphia restaurants" → loc=Philadelphia lat=39.95 (MWM DB: 9 results ✅)
- "Atlanta braiders" → loc=Atlanta lat=33.75
- "AME church Baltimore" → loc=Baltimore lat=39.29
- "Black hair salon Atlanta" → loc=Atlanta
- "restaurants near Patong Beach" → loc=Patong Beach lat=7.90 lng=98.30
- "Phuket" → loc=Phuket content=""
- "Kingston Jamaica nightlife" → loc=Kingston Jamaica lat=17.97 lng=-76.79

**Why:** Nominatim returned class=place for all these (not class=amenity like the Oslo case).
