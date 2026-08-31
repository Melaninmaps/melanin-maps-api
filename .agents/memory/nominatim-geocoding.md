---
name: Nominatim server-side geocoding
description: Why we use Nominatim for server-side geocoding instead of Google Geocoding REST API
---

## Rule
`/api/maps/geocode` uses OpenStreetMap Nominatim, NOT the Google Geocoding REST API.

**Why:** `GOOGLE_MAPS_API_KEY` (the server key used for Directions) does NOT have "Geocoding API" enabled in Google Cloud Console. Calling `https://maps.googleapis.com/maps/api/geocode/json?key=...` with that key returns `REQUEST_DENIED` for every address including "Philadelphia".

The browser-side `google.maps.Geocoder()` (Maps JS SDK) works fine because it's part of the Maps JavaScript API, but it fails when the referrer-restricted `GOOGLE_MAPS_BROWSER_KEY` is used from localhost or non-whitelisted origins.

**Fix applied:** Nominatim endpoint: `https://nominatim.openstreetmap.org/search?q=...&format=json&limit=1`
- Free, no API key required
- Full international coverage (Bangkok, Phuket, Jamaica all return correct lat/lng)
- MUST include `User-Agent: MappingWithMelanin/1.0 (contact@mappingwithmelanin.com)` header — Nominatim blocks requests without a valid User-Agent
- Returns array; `[0].lat` and `[0].lon` (NOT `lng`)

**How to apply:** Any new server-side geocoding needs should use Nominatim or ensure the correct Google Cloud Console APIs are enabled on whichever key is used. Do NOT assume `GOOGLE_MAPS_API_KEY` supports geocoding.

## Sparse institution seed exception

Nominatim may be used during startup only for an unresolved, institution-backed canonical seed after the configured Google provider has failed. Queries must be rate-limited to one per second and a successful coordinate must be persisted so later boots make no repeat request.

**Why:** The prior boot-time batch geocoder violated OSM rate guidance; a bounded one-time repair for verified institutional addresses does not broaden that policy.

**How to apply:** Never adapt this fallback for imported collections, user-entered locations, or broad backfills. Those need a separately approved provider or an offline, rate-compliant job.
