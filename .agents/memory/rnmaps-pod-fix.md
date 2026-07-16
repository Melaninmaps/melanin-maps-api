---
name: react-native-maps iOS pod install fix
description: Root cause + definitive fix for react-native-maps pod name mismatch in EAS iOS builds
---

# react-native-maps iOS pod name mismatch

## Root cause
`react-native-maps@1.27.x` ships `react-native-maps.podspec` with `s.name = "react-native-maps"`.

Expo autolinking generates:
```ruby
pod 'react-native-google-maps', :path => '.../react-native-maps'
```
CocoaPods scans the directory for `.podspec` files, finds `react-native-maps.podspec`,
reads `s.name = "react-native-maps"`, expected `"react-native-google-maps"` → FAIL.

## Why `withDangerousMod` / Podfile Ruby injection also failed
Two compounding problems:
1. Any patch to `node_modules` in expo prebuild plugins gets RESET by `pnpm install --no-frozen-lockfile` that runs immediately after prebuild.
2. The Ruby block created a COPY (`react-native-google-maps.podspec`) but if the source was cached-patched with `s.name = "react-native-maps"`, the copy also had the wrong `s.name`. CocoaPods found the copy but the `s.name` mismatch errored.

## EAS build lifecycle (critical)
```
eas-build-pre-install  →  pnpm install  →  eas-build-post-install  →  expo prebuild  →  pod install
```
Wait — actually for iOS managed builds:
```
expo prebuild (plugins fire)  →  pnpm install --no-frozen-lockfile  →  eas-build-post-install  →  pod install
```
`eas-build-post-install` runs AFTER pnpm install, BEFORE pod install. This is the ONLY timing-safe window to patch node_modules files.

## The definitive fix
**Wire `scripts/patch-rnmaps-podspec.js` into the `eas-build-post-install` hook** in `artifacts/mobile/package.json`:
```json
"eas-build-post-install": "node scripts/patch-expo-entry.js && node scripts/patch-rnmaps-podspec.js"
```

The script changes `s.name = "react-native-maps"` → `"react-native-google-maps"` in every copy of the podspec in the pnpm store. It runs after pnpm install so pnpm can't reset it.

## Key files
- `artifacts/mobile/scripts/patch-rnmaps-podspec.js` — patches s.name in the podspec
- `artifacts/mobile/package.json` eas-build-post-install — wires the script
- `artifacts/mobile/plugins/withRnMapsPodfileFix.js` — now a no-op stub, keep it registered

## Do NOT
- Patch in `withDangerousMod` / expo config plugins — resets before pod install
- Inject Ruby into the Podfile — creates conflicting .podspec copies, causing new errors
- Wire the script to `preinstall` or `postinstall` npm hooks — those fire before/during pnpm install, not after
