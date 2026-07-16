---
name: iOS build status and definitive fix
description: How the react-native-maps pod name mismatch was definitively fixed for iOS EAS builds.
---

# iOS Pod Install Fix — July 16, 2026

## The Problem (builds 40-53)
Every iOS EAS build failed at `pod install` with:
```
[!] No podspec found for 'react-native-google-maps' in '...node_modules/react-native-maps'
```
`react-native-maps@1.27.x` podspec has `s.name = "react-native-maps"`, but React Native
autolinking generated `pod 'react-native-google-maps', :path => '...'`.

## Failed Approaches
1. **`eas-build-post-install` patch** — pnpm CAS hardlinks reject writes; script ran but patch didn't persist
2. **`withDangerousMod` config plugin** — plugin ran but the regex didn't catch all quote styles

## Definitive Fix: `react-native.config.js`
```javascript
module.exports = {
  dependencies: {
    'react-native-maps': {
      platforms: {
        ios: {
          podspecPath: './node_modules/react-native-maps/react-native-maps.podspec',
        },
      },
    },
  },
};
```
**Why this works**: autolinking reads the actual podspec name (`s.name = "react-native-maps"`)
and generates `pod 'react-native-maps', :path => '...'` in the Podfile — the correct name.
The Podfile is never generated with the wrong name.

## Belt-and-Suspenders
`plugins/withRnMapsPodfileFix.js` — regex `/pod ['"]react-native-google-maps['"]/g` handles
both single and double quote variants. Acts as secondary correction after prebuild.

## SDK details
- Expo SDK 57, React Native 0.86.0
- react-native-maps@1.27.2 — `"main": "src/index.ts"` (TypeScript source, not precompiled)
- react-native-reanimated@4.5.0 — its `/plugin/index.js` re-exports `react-native-worklets/plugin`
- react-native-worklets@0.10.0 peer dep: `react-native: "0.83 - 0.86"` (in range ✓)

## Apple Sign-In status
- FULLY IMPLEMENTED: expo-apple-authentication, cryptographic nonce (iOS 26 requirement), server endpoint
- Any build that compiles will have working Apple Sign-In

## Build commands (from inside artifacts/mobile/)
```
eas build --platform ios --profile production
eas submit --platform ios --profile production
```
