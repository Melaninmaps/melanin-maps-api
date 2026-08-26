# Mapping With Melanin — Task #373 Surgical Replit Repair Bundle

This bundle applies **five confirmed, file-specific release repairs** without force-applying the earlier broad patch or overwriting complete files. Every edit is pattern-guarded, backed up, reviewable in `git diff`, and idempotent. If the current merged Replit code has drifted, the script stops rather than guessing.

## What the core script fixes

| File | Surgical repair |
|---|---|
| `artifacts/mobile/app.json` | Updates iOS camera/photo purpose text for community photos/videos; adds Android video-media access; removes obsolete broad storage and write-contacts permissions; records removed permissions in `blockedPermissions`. |
| `artifacts/mobile/app.config.js` | Injects commit SHA, release channel, and environment into resolved Expo metadata without changing the existing Apple Maps/Android Google Maps safeguards. |
| `artifacts/mobile/package.json` | Removes `--auto-submit` from the iOS build command and adds explicit candidate-only iOS/Android build commands. |
| `artifacts/mobile/app/(tabs)/community.tsx` | Prevents Post while media is uploading or incomplete, submits only completed URL arrays, and exposes accessible busy/disabled state. |
| `artifacts/mobile/lib/crashLogger.ts` | Removes query strings and identifiers from request/navigation breadcrumbs, minimizes coordinates, redacts common secrets/email patterns, and tags crash reports with commit/release/environment. |

An optional script replaces the external-only community video tile with an on-demand native `expo-video` modal plus external fallback. It deliberately mounts only one player when the user chooses a video, avoiding a player for every feed tile.

## Authorization boundary

These scripts may edit source/configuration, create local backups, update the lockfile for a missing test dependency, and run code/build checks. They do **not** deploy, submit to Apple/Google, change pricing, delete production data, or alter production databases.

## Exact Replit commands

Upload/extract this folder to the repository root as `replit/task373-surgical/`, then run:

```bash
cd "$REPL_HOME" 2>/dev/null || cd /home/runner/workspace

git status --short
git branch --show-current
git rev-parse HEAD

# Preserve the current merged work before applying repairs.
git switch -c release/task-373-rc 2>/dev/null || git switch release/task-373-rc

# Apply only the five guarded core repairs.
node replit/task373-surgical/apply-task373-surgical.mjs "$PWD"

# Optional but recommended for website parity: native community video playback.
node replit/task373-surgical/apply-native-community-video.mjs "$PWD"
# If requested by the script:
pnpm --filter @workspace/mobile exec expo install expo-video

# Restore only the missing API test dependency, to the package that imports it.
bash replit/task373-surgical/restore-task373-test-deps.sh "$PWD"

# Review every changed line. Do not proceed if unrelated merged work disappeared.
git diff --check
git diff -- artifacts/mobile/app.json \
  artifacts/mobile/app.config.js \
  artifacts/mobile/package.json \
  'artifacts/mobile/app/(tabs)/community.tsx' \
  artifacts/mobile/components/CommunityPostCard.tsx \
  artifacts/mobile/lib/crashLogger.ts

# Verify the 17 deterministic source contracts.
node replit/task373-surgical/validate-task373-surgical.mjs "$PWD"

# Create the 72-row four-device matrix and store/policy gate templates.
node replit/task373-surgical/create-task373-evidence-template.mjs "$PWD"

# Run full precommit code gates and capture raw evidence.
bash replit/task373-surgical/run-task373-code-gates.sh "$PWD" --precommit
```

The precommit runner is expected to remain `NO_GO` until all existing typecheck, lint, test, and build failures are repaired. Replit must open the generated `release-evidence/task373-code-gates-*/code-gates-summary.csv` and fix every `FAIL`; it must not relabel them as unrelated.

After all precommit gates pass except the intentionally blocked clean-tree prebuild checks:

```bash
# Review intended files only, then commit the release candidate source.
git status --short
git add artifacts/mobile replit/task373-surgical pnpm-lock.yaml
# Add the API package manifest only if dependency restoration changed it.
git add '<api-package>/package.json' 2>/dev/null || true
git commit -m "fix(mobile): close Task 373 native release blockers"

git status --short  # must be empty

# Rerun in release mode; this executes iOS and Android prebuild checks.
bash replit/task373-surgical/run-task373-code-gates.sh "$PWD" --release
```

Only after the release-mode code packet says `GO_FOR_SIGNED_BUILD_AND_DEVICE_TESTING` may Replit build signed candidates. It must use the safe candidate scripts and **must not submit**:

```bash
pnpm --filter @workspace/mobile run build:candidate:ios
pnpm --filter @workspace/mobile run build:candidate:android
```

Then install the exact iOS build through TestFlight and the exact Android AAB through Google Play internal testing, execute the physical-device matrix in `TASK_373_IOS_ANDROID_EXECUTION_RUNBOOK.md`, and attach the complete `release-evidence/` packet.

## Remaining fixes Replit must perform from current logs

These are real release gates, but they cannot be safely rewritten by a stale snapshot script. Replit has the current workspace and must make narrow fixes based on the raw logs generated above.

### Full TypeScript errors

Run the full mobile typecheck and fix every error at the owner type or component. Do not use `any`, `@ts-ignore`, broad exclusions, or changed-file-only checks. The older supplied report contained stale failures such as Expo FileSystem API drift, theme token names, callback return types, and unavailable native-tab exports; some were already repaired. The current report refers to 27 endorsement-tag errors, so Replit must fix the current shared endorsement-tag type contract rather than replaying stale substitutions.

### Lint startup failure

Use the raw stack trace plus these diagnostics:

```bash
pnpm --filter @workspace/mobile why eslint
pnpm --filter @workspace/mobile why eslint-config-expo
pnpm --filter @workspace/mobile why zod
pnpm list -r eslint eslint-config-expo zod
```

Align the incompatible declared versions in the correct package or workspace override and regenerate `pnpm-lock.yaml`. Do not edit `node_modules`, add `|| true`, or disable lint.

### API test suite

`restore-task373-test-deps.sh` adds `supertest` and `@types/supertest` only to the package that actually imports `supertest`. Replit must rerun the complete API suite and prove that the formerly unloadable suite executes.

### Upload server hardening

The current API upload route—not present in the supplied source slice—must enforce authentication, allowed upload purpose, image/video MIME allowlists, file-signature inspection, size and duration limits, rate limiting, bounded timeouts, storage-failure cleanup, and clear 401/403/413/415/429/500 responses. Replit must add request-level tests and preserve previously uploaded attachments after later failures.

### UGC and account deletion

The supplied snapshot already contains some report/block behavior through `ReportButton` and user-profile controls; Replit must verify persistence and coverage instead of duplicating it. The supplied source slice did not reveal an account-deletion flow. Replit must confirm the current workspace has:

1. Terms/Community Standards acceptance before first UGC creation.
2. Report post/content and report user.
3. Block/unblock user with blocked content/interactions removed.
4. Published support contact.
5. In-app account deletion using a re-authenticated, idempotent server workflow.
6. A public deletion-request URL and matching Apple/Google disclosures.

Because deletion touches production identity and user data, it must not be invented by a generic text-replacement script; implement it against the current auth/database services with integration tests and a disposable test account.

### Native crash proof

The custom logger covers JavaScript crashes but not a crash before JavaScript starts. Do not blindly restore the prior native Sentry/KSCrash integration that crashed Build 100. Use TestFlight/App Store diagnostics and Android Vitals for native failures; if adding a native SDK, qualify it first in separate preview builds and prove symbolicated/mapped test events on both platforms. Release builds must not expose raw developer crash alerts.

## Rollback

Every core application run creates `.task373-backups/<timestamp>/manifest.json`. To restore the latest core edit:

```bash
node replit/task373-surgical/rollback-task373-surgical.mjs "$PWD"
```

Or specify a backup folder name:

```bash
node replit/task373-surgical/rollback-task373-surgical.mjs "$PWD" 2026-08-26T22-50-10-527Z
```

The optional video script creates a separate `.task373-backups/video-<timestamp>/` copy of `CommunityPostCard.tsx`; restore that single file manually if needed.

## Validation already performed on this bundle

The bundle was exercised against the supplied Mapping With Melanin source snapshot. The core script changed exactly five files; the deterministic validator passed **17/17** contracts; patched TS/TSX files passed TypeScript syntax parsing; the second core run changed **0** files and skipped all five as already satisfied; rollback restored the five original files byte-for-byte; a deliberate current-code conflict aborted and automatically restored three earlier edits; and the evidence generator created **72 native-device rows** plus **10 store/policy rows**, all defaulting to NO-GO until evidence is attached.

This proves the script mechanics against the supplied snapshot. It does not replace full typecheck, builds, signed artifacts, or physical iOS/Android evidence in the current Replit workspace.
