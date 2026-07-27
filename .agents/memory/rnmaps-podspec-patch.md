---
name: react-native-maps pod name fix
description: How the react-native-google-maps / react-native-maps pod name mismatch is resolved for iOS EAS builds
---

## The Problem

`react-native-maps@1.27.x` ships `react-native-maps.podspec` with `s.name = "react-native-maps"`.
Expo autolinking generates `pod 'react-native-google-maps', :path => '...node_modules/react-native-maps'`.
CocoaPods fails: `No podspec found for 'react-native-google-maps'`.

## The Fix (as of July 16 2026)

**`plugins/withRnMapsPodfileFix.js`** — a `withDangerousMod` Expo config plugin registered first in `app.json` plugins array.

It runs during `expo prebuild`, after the Podfile is generated, and replaces:
```
pod 'react-native-google-maps',
```
with:
```
pod 'react-native-maps',
```

Registered as `"./plugins/withRnMapsPodfileFix"` (first entry in plugins array).

## What Was Tried and FAILED

- `eas-build-post-install` script that patched the podspec file in the pnpm virtual store (`scripts/patch-rnmaps-podspec.js`) — unreliable because pnpm CAS hardlinks resist writes. Removed from `eas-build-post-install`.

## How to Apply

Do NOT go back to the patch-script approach. The config plugin approach is the only reliable fix for pnpm + EAS managed builds.
