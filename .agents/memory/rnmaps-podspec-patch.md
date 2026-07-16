---
name: react-native-maps podspec name mismatch fix
description: Why iOS pod install was failing and the exact fix applied — critical for future builds.
---

# react-native-maps iOS Pod Install Fix

## The error (seen in every iOS build, lines 236-237 of build log)
```
[!] No podspec found for 'react-native-google-maps' in '...node_modules/.pnpm/react-native-maps@1.27.2_.../node_modules/react-native-maps'
pod install exited with non-zero code: 1
```

## Root cause
React Native / Expo autolinking generates `pod 'react-native-google-maps', :path => '...node_modules/react-native-maps'` in the iOS Podfile.
But `react-native-maps@1.27.2` ships with `s.name = "react-native-maps"` in its podspec.
CocoaPods looks for a podspec declaring `s.name = "react-native-google-maps"` in that directory, finds only `"react-native-maps"`, and fails.

The react-native-maps config plugin (`plugin/build/ios.js`) always runs `withMapsCocoaPods` which inserts `rn_maps_path` before `use_native_modules`. The autolinking then generates the pod reference using the old pod name `react-native-google-maps` (a legacy name from before 1.21.0 rename).

## The fix (committed July 16, 2026)
`artifacts/mobile/scripts/patch-rnmaps-podspec.js` — runs in `eas-build-post-install`:
1. Walks the pnpm virtual store for all `react-native-maps@*` copies
2. Patches `react-native-maps.podspec` in-place:
   - `s.name = "react-native-maps"` → `s.name = "react-native-google-maps"`
   - `ss.dependency 'react-native-maps/...'` → `ss.dependency 'react-native-google-maps/...'` (3 internal refs)
3. `module_name = 'ReactNativeMaps'` is unchanged — Swift/ObjC imports unaffected

`eas-build-post-install` now runs:
```
node scripts/patch-expo-entry.js && node scripts/patch-rnmaps-podspec.js
```

## Verified
- Script ran locally and patched the 1.27.2 copy correctly
- Confirmed: `s.name = "react-native-google-maps"` now appears in installed podspec
- Did NOT modify 1.20.1 copy (different format, correctly skipped with warning)

## If this ever breaks again
Check: does the installed `react-native-maps.podspec` have `s.name = "react-native-maps"`?
If yes → patch script needs to run again / re-check `eas-build-post-install`.
If no → different version of react-native-maps installed, patch logic may need updating.

**Why:**
`expo install --check` (SDK 57) recommends 1.27.2 which removed the legacy `react-native-google-maps.podspec` alias file that older versions kept for backward compatibility. The autolinking still requests the old name. This mismatch is the root cause.
