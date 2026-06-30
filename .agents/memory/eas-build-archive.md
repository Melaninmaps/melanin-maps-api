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

**Why:** The Replit environment accumulates pnpm metadata in `.cache/pnpm` inside the workspace root. EAS archives the entire monorepo root and the cache bloats the tarball past the `/tmp` quota limit.
