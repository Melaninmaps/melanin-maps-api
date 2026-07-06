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

4. Run from the full path to avoid "no such file or directory" errors:
   ```bash
   cd /home/runner/workspace/artifacts/mobile && eas build --platform android --profile preview
   ```

5. **`lib/api-client-react` must NOT be excluded from .easignore.** The mobile package depends on `@workspace/api-client-react` which lives in `lib/api-client-react/`. Blanket-excluding `lib` causes "Install dependencies" failure on EAS servers. Instead, exclude each lib subdirectory individually except `api-client-react`. Safe to exclude: `lib/api-spec`, `lib/api-zod`, `lib/db`, `lib/integrations`, `lib/integrations-openai-ai-react`, `lib/integrations-openai-ai-server`, `lib/dbintegrations-openai-ai-server`.

6. **`expo-apple-authentication` must be `~8.0.8` for SDK 54.** Any other major version (e.g. `^57.0.0`) causes "Install dependencies" failure. Check with `pnpm exec expo install --check` from `artifacts/mobile/`.

**Why:** EAS archives the entire pnpm workspace root, runs `pnpm install` on EAS servers, then builds from `artifacts/mobile/`. Any workspace package the mobile app imports must be present in the archive.
