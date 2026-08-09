---
name: businesses table NOT NULL constraints
description: address and description are NOT NULL in the businesses table — use placeholders when street address or description is unknown; latitude is also NOT NULL.
---

## Rule
The `businesses` table enforces NOT NULL on: `address`, `description`, and `latitude` (and `longitude`).

**Why:** Discovered when seeding 14 founder-curated businesses via boot guard. South Jazz Kitchen (no address) and N Plainfield Barber (no description) both failed silently then loudly.

## How to apply
When inserting a business without a known street address, use city+state as a placeholder string: `"Philadelphia, PA"`.
When inserting a business without a description, use a short generic description: `"Barbershop serving North Plainfield, NJ."`
When inserting without lat/lng, use approximate city-center coordinates — never null.

## Pattern used in seed files
```typescript
address: b.address ?? `${b.city}, ${b.state}`,
description: b.description ?? `${b.subcategory} in ${b.city}, ${b.state}.`,
latitude: b.latitude ?? CITY_CENTER_COORDS[b.city]?.lat ?? 39.9526,
longitude: b.longitude ?? CITY_CENTER_COORDS[b.city]?.lng ?? -75.1652,
```
