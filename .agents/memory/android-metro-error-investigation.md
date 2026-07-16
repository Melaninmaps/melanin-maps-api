---
name: Android Metro bundler error investigation
description: What was ruled out for the Android EAS Metro bundler crash (build 53); how to diagnose next time.
---

# Android Metro Bundler Error — Investigation (July 16, 2026)

## The Symptom
EAS Android build fails at:
```
pnpm expo export:embed --eager --platform android --dev false exited with non-zero code: 1
```
Stack trace visible in screenshot starts at line 19 (lines 1-18 — the ACTUAL ERROR MESSAGE — not visible).
Stack goes through `@babel/traverse` → `@expo/metro-config/transform-worker` → `jest-worker`.

## What Was Exhaustively Ruled Out
- All `app/`, `components/`, `hooks/`, `constants/`, `contexts/` files: **PASS** Babel transform
- `react-native-reanimated/src` (369 files): **PASS**
- `react-native-maps/src` (37 files): **PASS**
- `@expo/metro-runtime/src/index.ts`: **PASS**
- Custom plugins (`withAndroidCrashLogger`, `withChromebookSupport`): modify native files only, irrelevant
- Entry chain: `expo-router/entry` → `entry-classic` → `@expo/metro-runtime` + `renderRootComponent` — correct
- `patch-expo-entry.js` not relevant (entry is `expo-router/entry`, not `expo/AppEntry.js`)
- `react-native-worklets/plugin`: Reanimated 4.x re-exports it; RN 0.86.0 is in peer dep range (0.83-0.86)

## Key Package Facts
- `expo-router/entry-classic.js` imports `@expo/metro-runtime` (main: `src/index.ts`) + `qualified-entry`
- `react-native-maps@1.27.2` main: `src/index.ts` — Metro transforms this with project Babel config
- `react-native-reanimated@4.5.0` plugin re-exports `react-native-worklets/plugin`

## How to Diagnose Next Time
The actual error is in lines 1-18 of the EAS Android build log (above what was shown in screenshot).
Go to the EAS build URL → click the failed Android build → scroll to the VERY TOP of the log.
The first line(s) will say something like:
- `Error: Cannot resolve module 'X'` → missing import somewhere
- `SyntaxError: ...` → syntax issue in a specific file
- `ENOENT: no such file...` → missing file path

**Why can't this be reproduced locally?**
`expo export:embed` starts a full Metro server locally and times out in 25 seconds. The actual
bundle creation that triggers the error requires a complete EAS build environment.

## What to Try if Error Persists
1. Look at full build log (lines 1-18) for the actual error message
2. If it's a Babel transform error on a specific file, that file will be named in the error
3. If it's a missing module, check if the import path is correct
4. If it references `react-native-worklets`, try switching babel plugin to `react-native-reanimated/plugin`
