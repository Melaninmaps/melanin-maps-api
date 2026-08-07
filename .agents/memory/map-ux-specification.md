---
name: MWM Map UX Specification v1.1
description: Canonical map experience spec — NNRs, zone types, pin hierarchy, clustering, copy strings, Kinfolk rules, progressive disclosure. Filed Aug 7, 2026.
---

## Location
`docs/product/MWM_Map_UX_Specification_v1.1.pdf`

## Critical NNRs (Non-Negotiable Rules — never override without founder approval)
- NNR-01: Welcoming/caution scores are NEVER derived from police data, arrest data, census income, or any data that criminalizes minority communities.
- NNR-02: "Welcoming" / "Unwelcoming" always. Never "safe" / "unsafe."
- NNR-03: Kinfolk references BEHAVIOR only ("Since you've been browsing salons…"), never identity ("Since you're Black…"). The One-Way Mirror Rule.
- NNR-04: Non-minority businesses NEVER promoted above minority-owned alternatives.
- NNR-05: Community entrepreneurs list free, always. No paywall on visibility.
- NNR-06: Full diaspora — not a "Black-owned business app."
- NNR-07: Sundown Towns / Historical Caution Zones layer is ALWAYS VISIBLE. Cannot be toggled off. Always-on, not just on-by-default.
- NNR-08: Active Safety Alerts always highest z-index. Nothing may obscure them.
- NNR-09: Reporter identity always anonymized. No report traceable to a user.
- NNR-10: "Dangerous" and "unsafe" permanently banned from all user-facing copy.

## Zone Types (Section 5.2)
**Type A — Historical Sundown Town:** Faded amber dashed boundary (40% opacity), 8% amber fill, 16px archive icon at centroid (50% opacity). No text label on map.
**Type B — Current Community-Reported:** Solid amber boundary (70% opacity), 15% amber fill, 18px people icon (80% opacity), report count badge.

## Always-On Layers (Section 4)
- Active Safety Alerts (red pulsing, always z-index 100)
- Sundown Towns / Historical Caution Zones (amber, always z-index 10–25)
- Layers panel must NOT include a toggle for these — static label: "Always active — community safety."

## Default Map View (Section 3)
- Business pins within 7-mile radius (adjustable)
- Caution zone boundaries (subtle, always)
- Safety alerts (always)
- Layer hint dot (pulsing amber, 3 seconds, first open only)
- NO cultural sites, heritage districts, HBCUs, events, welcoming indicators by default

## Pin hierarchy (z-index)
Safety Alert 100 → Selected 90 → Welcoming Indicator 55 → Business 50 → Community Event 45 → Cultural Site 40 → HBCU 40 → Farmers Market 35 → Current Caution Escalated 25 → Current Caution Active 20 → Historical Caution Confirmed 15 → Historical Caution Neutral 10 → Heritage District fills below all

## Progressive Disclosure Schedule
Day 1: Businesses + Safety + Caution zones | Day 3–7: Kinfolk first nudge (aha moment) | Week 2: Cultural Sites layer highlighted | Month 1: Reviews + badges | Month 3+: Full ecosystem

## Key Technical Rules
- NEVER load all pins at once. Viewport + 20% buffer only, debounced 300ms.
- Default radius: 7 miles. Re-query on pan/zoom end.
- Sundown Town data bundled with app binary (offline-available). Not a live API call.
- Supercluster: radius 60px, maxZoom 15, minPoints 3. Safety Alerts never cluster.
- Layer state: AsyncStorage (immediate) + user profile (server sync). Server wins on conflict.

## Canonical Copy Strings
All copy in Section 13 of the spec. Any deviation requires founder approval.

**Why:** These are the product-level design rules. Any new map feature must comply with all 10 NNRs and follow the pin hierarchy, copy strings, and progressive disclosure schedule exactly.
**How to apply:** Before building any map feature, verify it doesn't violate an NNR. Use the exact copy from Section 13. Do not create new caution zone language without founder approval.
