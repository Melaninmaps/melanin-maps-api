---
name: react-native-maps iOS pod install fix
description: Root cause + definitive fix for "No podspec found for react-native-google-maps" in EAS iOS builds
---

# react-native-maps iOS pod name mismatch

## Root cause
`react-native-maps@1.27.x` ships `react-native-maps.podspec` with `s.name = "react-native-google-maps"`.

`link_native_modules!` reads the podspec, gets `s.name`, and generates:
```ruby
pod 'react-native-google-maps', :path => '.../react-native-maps'
```
CocoaPods then looks for `react-native-google-maps.podspec` **by filename** in the directory — only `react-native-maps.podspec` exists — FAIL.

## Why node_modules patching fails in EAS
EAS PREBUILD phase sequence:
1. `expo prebuild` runs (plugins fire here, including `withDangerousMod`)
2. `expo prebuild` finishes
3. `pnpm install --no-frozen-lockfile` runs (AFTER prebuild, INSIDE PREBUILD phase)
4. `pod install` runs (INSTALL_PODS phase)

Any patch to `node_modules` in step 1 gets reset by step 3. The `eas-build-post-install` hook also runs before step 3.

The "already correct" log message in previous builds was because EAS restored a cached pnpm store with a previously-patched podspec, but step 3 reinstalled from the pnpm content store.

## The definitive fix
**Inject Ruby code into the Podfile** via `withDangerousMod`. The Podfile is a static file — pnpm install never touches it. The Ruby code runs during CocoaPods Podfile evaluation (step 4), after all pnpm installs are done.

**Why:** `[rn-maps-fix]` block in the Podfile uses `Dir.glob` to find all `react-native-maps@*` pnpm store entries and `FileUtils.cp` to create `react-native-google-maps.podspec` alongside `react-native-maps.podspec`. CocoaPods then finds it by filename.

**Do NOT:** patch `s.name` inside `react-native-maps.podspec` — the file gets reset. Do NOT add `postinstall` scripts — they run before the final pnpm install in PREBUILD.

## Key file
`artifacts/mobile/plugins/withRnMapsPodfileFix.js` — injects the Ruby fix block at the top of the Podfile.
`artifacts/mobile/scripts/patch-rnmaps-podspec.js` — old approach, no longer wired up, do not wire it up.
