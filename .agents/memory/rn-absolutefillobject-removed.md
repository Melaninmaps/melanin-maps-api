---
name: StyleSheet.absoluteFillObject removed in RN 0.86
description: absoluteFillObject resolves to undefined at runtime in React Native 0.86+; spreads to empty style, silently zeroing MapView dimensions.
---

## Rule
Never use `StyleSheet.absoluteFillObject` in React Native 0.86+. Use explicit coords or `StyleSheet.absoluteFill` instead.

## Why
`StyleSheet.absoluteFillObject` was removed from the RN 0.86 TypeScript types (TS2551 error: "did you mean absoluteFill?"). At runtime it resolves to `undefined`. Any spread of it — `{ ...StyleSheet.absoluteFillObject }` — produces `{}`, an empty style with no position/size. A MapView given an empty style has zero dimensions; MapKit never initializes, `onMapReady` never fires, and the screen shows the container background (black in this app).

**How to apply:**
- `s.map: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }` for StyleSheet.create entries
- `style={StyleSheet.absoluteFill}` for inline usage (absoluteFill is a registered style number, not an object)
- Any TS2551 "did you mean absoluteFill?" error is a signal to check runtime behavior, not just a cosmetic type error

## Diagnostic that found it
`onMapReady` badge showed container dimensions 440×956 (correct) but red (MapKit never initialized). Correct dimensions + no `onMapReady` = MapView mounted but zero-sized. Inspecting `s.map` revealed the absoluteFillObject spread.
