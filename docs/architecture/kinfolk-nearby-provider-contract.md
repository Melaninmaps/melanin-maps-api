# Kinfolk nearby-provider retrieval contract

> **Product promise:** A request such as “Find a braider near me” returns only source-backed, public Kinfolk businesses that are geographically relevant to the member’s current authorized search location. KinfolkAI, Find a Business, and Map use the same retrieval service and must show the same eligible businesses.

## Input and privacy

The client supplies the member’s current position only after the existing foreground-location consent path. The server receives latitude, longitude, radius, query, optional category, approved VIBES, and optional self-identified designation preferences. Exact member coordinates are used only for current request distance calculation. They are not written into chat text, business records, public feeds, recommendations, analytics events, or notifications.

If precise location is not available, show a city/state selection. Do not pretend an old device location is current and do not broaden to a national search without an explicit member action.

## Source of truth

The endpoint retrieves only businesses satisfying the existing public-listing predicate and with `business_context.context_status = 'ready'` for KinfolkAI recommendations. A Map or standard Find a Business result may surface a public listing with less context, but must label it appropriately and must still use verified address coordinates. The model never invents a business, category, service, address, link, or distance.

A candidate matches “braider” if an approved taxonomy value, explicit `services` value, approved VIBE/context tag, or source-backed business context supports braiding. A name, an image, neighborhood, or assumed cultural association is not enough.

Every public business is also searchable by its **exact public name**, normalized name, known public alias, category, subcategory, source-backed service, approved VIBES, and documented business context. Name matches receive a strong relevance boost, but a person searching “near me” still sees closest eligible exact-name matches first. A name search must never be limited to one category such as Bookstores.

## Retrieval ladder

| Step | Scope | Visible result behavior |
| --- | --- | --- |
| 1 | Exact query/category within the requested radius | Show nearby matches ordered by distance and relevance. |
| 2 | Approved aliases and typo-tolerant matching in the same radius | Treat `braider`, `braids`, and a plausible typo as the same supported intent only when the listing’s sources support it. |
| 3 | Selected city/metro, only after member chooses to expand | Label each result with city and distance. |
| 4 | No supported match | State “No confirmed braiders found in your selected area yet.” Offer change location, expand radius/city, request a business, or save the search. |

No result from another city or state should appear under “near me” unless the member explicitly expands the area and can see the distance/city.

## Shared API contract

```http
GET /api/businesses/nearby?q=braider&lat=39.9526&lng=-75.1652&radiusMeters=8047
```

```json
{
  "scope": { "mode": "radius", "radiusMeters": 8047, "city": "Philadelphia", "state": "PA" },
  "results": [
    {
      "id": "existing-public-listing-id",
      "slug": "existing-business-slug",
      "name": "Example Business",
      "category": "Beauty & Personal Care",
      "subcategory": "Braiders & Natural Hair",
      "supportedServices": ["Knotless braids"],
      "distanceMeters": 1240,
      "latitude": 39.95,
      "longitude": -75.16
    }
  ],
  "canExpand": true,
  "expanded": false
}
```

KinfolkAI’s `POST /api/kinfolk/find-business` should call this retrieval service first and give the model only the returned visible, ready-context listing IDs. The response card must then be hydrated from fresh database data and link to the existing business route. Map calls the same endpoint and renders a clickable marker for each returned listing. Find a Business uses the endpoint for its nearby mode and the city/state route for its manual-location mode.

## Relevance order

Within the member’s selected radius, order results by: exact normalized business name; exact alias; exact category/subcategory or documented service; approved VIBE/context match; typo-tolerant match; then distance and profile completeness. The API must return the matching reason, distance, city, and state so all clients explain why a business appears. When an exact name is not inside the radius, show no local result first and offer an explicit city/metro expansion; do not quietly replace it with a different business or another state.

## Acceptance tests

1. A location-authorized member searches “braider near me” in the chat, map, and Find a Business screen. All returned listing IDs are from the same shared eligible result set.
2. Each return is source-backed as a braider or natural-hair provider, within the requested radius, public, non-duplicate, and has a working coordinate.
3. A near-me search with no match does not display a distant or unrelated business. It offers an explicit expansion choice.
4. A Map marker opens the existing business detail screen.
5. A hidden, duplicated, expired, unsupported-service, or demo-only listing cannot appear through a direct API call.
6. The individual’s precise location does not appear in message content, public UI, database business data, or analytics logs.
7. Search by any active public business name returns that listing across KinfolkAI, Map, and Find a Business, subject to the same location scope and public-listing rules.
