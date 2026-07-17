---
name: react-native-maps iOS build failure — root cause and fix
description: 36 EAS iOS builds failed due to Expo injecting pod 'react-native-google-maps'. Root cause was app.config.js setting ios.config.googleMapsApiKey. Fix: remove that key from iOS config.
---

# react-native-maps iOS pod failure — root cause (resolved July 2026)

## The Rule
Never set `ios.config.googleMapsApiKey` in `app.config.js` for an app that uses Apple Maps on iOS.

**Why:** Expo's built-in `@expo/config-plugins/build/ios/Maps.js` reads `config.ios?.config?.googleMapsApiKey`. When truthy, it injects `pod 'react-native-google-maps'` into the Podfile via `addMapsCocoaPods()`. The `react-native-maps` npm package does NOT ship `react-native-google-maps.podspec`, so CocoaPods fails on every build with "No podspec found" or "name mismatch".

**How to apply:** `app.config.js` must only set `android.config.googleMaps.apiKey`. The iOS section must NOT have `config.googleMapsApiKey`. The app uses `PROVIDER_DEFAULT` which is Apple Maps on iOS — no Google Maps SDK needed.

## What Was Set (wrong — now removed)
```js
// app.config.js — WRONG, causes all iOS builds to fail
ios: {
  config: {
    googleMapsApiKey: mapsKey,  // ← this triggers Expo's Maps.js to inject the bad pod
  }
}
```

## Current Correct State
```js
// app.config.js — CORRECT
// ios section: no googleMapsApiKey
android: {
  config: {
    googleMaps: { apiKey: mapsKey }  // only Android needs the key
  }
}
```

## Additional Safeguards Added
- `patches/react-native-maps@1.27.2.patch` makes `app.plugin.js` a no-op (belt-and-suspenders)
- `pnpm-workspace.yaml` references the patch under `patchedDependencies`
- `plugins/withRnMapsPodfileFix.js` creates a shim podspec (harmless belt-and-suspenders)

## Investigation Notes
The `@generated begin react-native-maps` block was NOT from react-native-maps's own `app.plugin.js`. It came from Expo's own built-in plugin (`@expo/config-plugins/build/ios/Maps.js`), which runs always during prebuild independently of any package plugin. This is why patching `app.plugin.js` to a no-op (builds 1-36 of this chain) had no effect on the Podfile injection.
