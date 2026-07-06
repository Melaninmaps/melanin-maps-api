---
name: EAS build archive pitfalls
description: Rules for avoiding disk quota and archive errors when running EAS builds from this pnpm monorepo.
---

## Rules

1. `.easignore` must live in `artifacts/mobile/` — EAS reads it from the project dir (where `app.json` is), NOT the workspace root. A root-level `.easignore` is silently ignored.

2. Delete the pnpm metadata cache before every EAS build:
   ```bash
   rm -rf /home/runner/workspace/.cache/pnpm
   rm -rf /tmp/runner/eas-cli-nodejs/
   ```
   Without this, the 1+ GB cache gets archived and triggers EDQUOT (error -122) during upload.

3. The `preview` profile (APK, internal distribution) is the right choice for tester installs — no Play Store review wait. Use `production` only when submitting to the store.

4. **Always run `eas build` from `artifacts/mobile/`, NOT the workspace root.**
   ```bash
   cd /home/runner/workspace/artifacts/mobile && eas build --platform android --profile production
   ```
   Running from the workspace root causes EAS to use the git root as the Metro projectRoot, which reads the root `package.json` (no `main` field) and falls back to `expo/AppEntry.js` instead of `expo-router/entry`. Running from `artifacts/mobile/` tells EAS the project subdirectory is `artifacts/mobile/`, so Metro runs from there and reads the correct `"main": "expo-router/entry"` from `artifacts/mobile/package.json`.

5. **`lib/api-client-react` must NOT be excluded from .easignore.** The mobile package depends on `@workspace/api-client-react` which lives in `lib/api-client-react/`. Blanket-excluding `lib` causes "Install dependencies" failure on EAS servers. Instead, exclude each lib subdirectory individually except `api-client-react`. Safe to exclude: `lib/api-spec`, `lib/api-zod`, `lib/db`, `lib/integrations`, `lib/integrations-openai-ai-react`, `lib/integrations-openai-ai-server`, `lib/dbintegrations-openai-ai-server`.

6. **`expo-apple-authentication` must be `~8.0.8` for SDK 54.** Any other major version (e.g. `^57.0.0`) causes "Install dependencies" failure. Check with `pnpm exec expo install --check` from `artifacts/mobile/`.

7. **EAS build workers have pnpm 8.7.5 (lockfileVersion '6.0'). Our lockfile is version '9.0' (pnpm 9+).** The `eas-build-pre-install` hook in root `package.json` upgrades pnpm to 10.26.1 via `npm install -g pnpm@10.26.1` before the install step. EAS uses nvm-managed Node.js at `/home/expo/.nvm/versions/node/v18.18.0/bin/pnpm`, so npm global install writes directly to that path. Do NOT add `cp` or `ln -sf` after the npm install — that creates a self-referencing symlink (ELOOP). Just run `npm install -g` and verify the version.

8. **Do NOT add `shamefully-hoist=true` to `.npmrc`.** It causes Metro to bundle from the git root using hoisted expo, which picks up the wrong `package.json` (no `main` field) and tries to resolve `expo/AppEntry.js` → `../../App` which doesn't exist. Running from `artifacts/mobile/` (rule 4) makes hoisting unnecessary.

9. **Use `expo/metro-config` NOT `@expo/metro-config` in `metro.config.js`.** EAS CLI shows a cosmetic warning when it sees `expo/metro-config` ("does not extend @expo/metro-config") but `expo/metro-config` IS the correct import — it re-exports `@expo/metro-config` and is directly accessible as a dep of expo. Using `@expo/metro-config` directly fails on EAS with "Cannot find module '@expo/metro-config'" because it's a transitive dep not directly accessible in pnpm's non-hoisted layout. When EAS CLI asks "Would you like to abort?" due to this warning, say **no**.

10. **EAS Gradle builds fail at `createBundleReleaseJsAndAssets` if metro.config.js has an import error.** This task runs Metro bundler as part of Gradle. If Metro config can't load, Gradle reports "Gradle build failed with unknown error" — check Run gradlew logs, not Bundle JavaScript logs, for the real error.

**Why:** EAS archives the entire pnpm workspace root, runs `pnpm install` on EAS servers, then builds from `artifacts/mobile/`. Any workspace package the mobile app imports must be present in the archive.
