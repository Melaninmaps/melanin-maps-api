---
name: Expo SDK package version mismatch crash
description: How wrong expo package versions cause silent NoClassDefFoundError on Android launch
---

## Rule
When any `expo-*` package major version doesn't match what `expo doctor` / Metro warns about, it will crash Android on launch with `NoClassDefFoundError: Failed resolution of: L<class>`.

**Why:** Newer package versions reference classes added to `expo-modules-core` in a later SDK. The installed SDK's core doesn't have those classes, so the Dalvik runtime crashes at module registration before any JS runs.

**The specific crash that hit us:**
- `expo-contacts@56.0.9` (built for SDK 57+) called `AnyTypeCache` which doesn't exist in SDK 54's `expo-modules-core`
- Stack: `ContactsModule.definition` → `ModuleHolder.<init>` → `AppContext.<init>` → crash on launch
- Metro had been warning about it the entire time: `expo-contacts@56.0.9 - expected version: ~15.0.11`

**How to apply:**
- After any `pnpm add` or version bump, run `expo start` and check for "The following packages should be updated" warnings in Metro output
- Treat those warnings as crash-level errors for Android, not cosmetic
- All `56.x` packages on SDK 54 are wrong — they belong to a future SDK
- SDK 54 correct versions: `expo-contacts@~15.0.11`, `expo-document-picker@~14.0.8`, `expo-local-authentication@~17.0.8`, `expo-build-properties@~1.0.10`, `@react-native-community/netinfo@~11.4.1`
- Use `~` (tilde) not `^` (caret) for expo packages to prevent accidental major upgrades

**Diagnosis shortcut:** If you see `NoClassDefFoundError: Failed resolution of: Lexpo/modules/...` in a crash log, the culprit is always a mismatched expo package version — check Metro startup warnings immediately.
