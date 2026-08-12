---
name: Map handoff race condition fix
description: Two-phase gmLoaded/ready split in map.tsx — why ready must mean "map object exists", not "Google Maps JS loaded"
---

# Map handoff race condition — root cause and fix

## The rule
In `artifacts/web/src/pages/map.tsx`, `ready` MUST be set only after `mapRef.current = map` is assigned. Never set `ready` from the `__mwmMapInit` callback (which fires when the Google Maps JS loads, BEFORE the map object is created).

**Why:** Any `useEffect` that guards on `ready` assumes `mapRef.current !== null`. If `ready` is set before the map object exists, the effect fires, finds `mapRef.current === null`, exits early, and never re-fires because refs don't trigger re-renders.

## How to apply
Use two states:
- `gmLoaded` — set by `__mwmMapInit` callback (Google Maps JS available in `window.google.maps`)
- `ready` — set inside the initialize-map `useEffect` AFTER `mapRef.current = map`

The initialize-map effect guards on `!gmLoaded` (not `!ready`). All other effects (handoff, discoverability pins, cultural sites, events, sundown towns) guard on `!ready`, which now guarantees the map object exists.

## Root cause (confirmed Aug 12 2026)
- Line 815–816: `__mwmMapInit = () => setReady(true)` — set ready before map object
- Line 830: `if (!ready || !mapDivRef.current || isLoading) return;` — init effect was gated on ready
- Result: ready=true → handoff fires → mapRef.current null → exits → never re-fires
- Fix: split into gmLoaded + ready; setReady(true) moved to after line 856 mapRef.current = map

## Fixed in
Commit `d8e25360` — `artifacts/web/src/pages/map.tsx` only.
