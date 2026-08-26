# Task #373 — Exact iOS and Android Execution Runbook

**Goal:** Produce and verify the exact signed Mapping With Melanin release candidates that can be submitted to Apple and Google without relying on web-only evidence.  
**Current overall status:** **NO-GO** until this runbook completes.  
**Known candidate identifiers from the supplied configuration:** iOS bundle `com.melaninmaps.app`, build `102`; Android package `com.melaninmaps.app`, versionCode `77`; Expo project `0f873107-7787-46ab-9a04-685c2a6756b1`.[1]

> Replit can implement code, run workspace checks, build artifacts, and organize evidence. A named human tester or device-testing service must execute physical-device rows. Replit must not mark those rows complete from Expo Web, Playwright, simulators alone, or the 49/49 web navigation tests.

## Paste this master instruction into Replit Agent

```text
Execute Task #373 exactly from TASK_373_IOS_ANDROID_EXECUTION_RUNBOOK.md. Preserve the completed Manus and route-audit work. Create a release branch/checkpoint first. Implement all Mandatory Code Repairs that are still missing, clear every release code gate, build signed release candidates without auto-submitting, install the exact candidates through TestFlight and Google Play internal testing, coordinate and record the required physical-device matrix, and create the complete release-evidence folder. Do not deploy production changes, submit to store review, or mark Task #373 complete while any required row is FAIL, BLOCKED, missing, based on another build, or supported only by web/Expo-browser evidence.
```

## Step 1 — Freeze and identify the release source

Replit must start from the current merged workspace and preserve every prior repair.

```bash
git status --short
git rev-parse --show-toplevel
git rev-parse HEAD
git branch --show-current
pnpm -r list --depth -1
```

Create a release-readiness branch and checkpoint. If the tree contains intended uncommitted work, review it file by file, remove generated artifacts and backups from source control, then commit the intended source. Record the resulting commit SHA in `release-evidence/00-manifest.json`. Do not build from a dirty tree.

```bash
git switch -c release/task-373-rc
# Review, stage, and commit intended source only.
git status --short
```

**PASS:** `git status --short` is empty immediately before building, and the manifest records the commit SHA.

## Step 2 — Implement the mandatory code repairs

Replit must inspect the current code before editing and skip only repairs already implemented with tests. It must report the exact file and test proving each skipped repair.

### 2.1 Eliminate all full-project TypeScript errors

The prior report still showed 27 mobile errors, described as endorsement-tag errors. They are release blockers because TypeScript failures can hide invalid props, unexpected response shapes, and unreachable error paths. Run the full check without filtering to changed files:

```bash
pnpm --filter @workspace/mobile run typecheck
```

Fix every error at its source. Do not add blanket `any`, `@ts-ignore`, global type suppression, or exclude affected screens from `tsconfig`. Shared endorsement-tag types must be defined once and consumed consistently by screens, components, API payloads, and constants.

**PASS:** zero errors in the full mobile project.

### 2.2 Repair lint execution, not merely lint findings

Capture the complete ESLint/Zod stack trace, then inspect ownership before changing versions:

```bash
pnpm --filter @workspace/mobile run lint
pnpm --filter @workspace/mobile why eslint
pnpm --filter @workspace/mobile why eslint-config-expo
pnpm --filter @workspace/mobile why zod
pnpm list -r eslint eslint-config-expo zod
```

Align the incompatible package versions in the correct workspace or root override, regenerate the lockfile through the package manager, and rerun lint. Do not edit `node_modules` or silence the package-export error.

**PASS:** lint starts normally and reports no release-significant source errors.

### 2.3 Restore the skipped API test suite

Add `supertest` and its TypeScript types as development dependencies to the API package that imports them—not blindly to the repository root—then rerun all API tests.

```bash
# Replace <api-package> with the package identified by `pnpm -r list --depth -1`.
pnpm --filter <api-package> add -D supertest @types/supertest
pnpm --filter <api-package> test
```

**PASS:** every API suite loads; no suite is skipped because of a missing module; exact totals are recorded.

### 2.4 Block post submission while media is uploading

The supplied community composer disabled the photo/video buttons during upload but did not include `uploadingMedia` in the Post button’s disabled condition. In `artifacts/mobile/app/(tabs)/community.tsx`, implement both a UI and function guard:

```tsx
const submitPost = async () => {
  if (uploadingMedia) {
    Alert.alert("Upload in progress", "Wait for your attachments to finish uploading before posting.");
    return;
  }

  const completedMediaUrls = mediaAttachments
    .map((item) => item.uploaded)
    .filter((url): url is string => typeof url === "string" && url.length > 0);

  if (completedMediaUrls.length !== mediaAttachments.length) {
    Alert.alert("Attachment not ready", "Remove the failed attachment or retry its upload.");
    return;
  }

  // Continue with the existing post request and send completedMediaUrls as an array.
};
```

The Post control must use:

```tsx
disabled={!newPostText.trim() || submittingPost || uploadingMedia}
```

If media-only posts are intentionally supported, replace the text-only condition with a named `canSubmitPost` expression that permits content or a completed attachment. Test whichever behavior is advertised.

**PASS:** rapid selection followed by immediate Post cannot create an empty or incomplete post; successful earlier attachments remain after a later failure.

### 2.5 Finish native video behavior

The current repaired fallback exposes an `Open Video` action. If store screenshots, metadata, or product copy claim native video posts/playback, implement in-app playback using the Expo-SDK-compatible package rather than shipping a dead or browser-only experience:

```bash
cd artifacts/mobile
pnpm exec expo install expo-video
```

Use a focused video component with `VideoView`, loading, playback error, retry/open-external fallback, lifecycle cleanup, accessibility labels, and no hook calls inside array loops. If in-app playback is deliberately deferred, remove any metadata claim that implies it and prove the external action works on iOS and Android.

**PASS:** the exact release candidate can play or clearly open a persisted posted video after force-close and relaunch.

### 2.6 Align permissions with actual image/video behavior

Update the iOS purpose strings so they describe all real uses—not only profile photos. For example:

```text
NSCameraUsageDescription: Mapping With Melanin uses your camera when you choose to take a profile or community photo or video.
NSPhotoLibraryUsageDescription: Mapping With Melanin accesses photos and videos you select for your profile or community posts.
NSPhotoLibraryAddUsageDescription: Mapping With Melanin saves media only when you choose to save it.
```

On Android, verify video selection on Android 13+ and add `READ_MEDIA_VIDEO` if the implementation requires direct video-library access. Remove legacy `READ_EXTERNAL_STORAGE`/`WRITE_EXTERNAL_STORAGE`, contacts, microphone, foreground-service, or other permissions if no release feature requires them. Do not request a permission at launch; request it at the action that needs it and show a recovery path to Settings after denial.

Use Expo’s resolved configuration to verify final manifests:

```bash
cd artifacts/mobile
pnpm exec expo config --type public --json > ../../release-evidence/01-code-gates/expo-config-public.json
pnpm exec expo prebuild --clean --no-install
# Inspect generated Info.plist and AndroidManifest.xml, then discard generated folders if the project policy requires managed workflow.
```

**PASS:** every declared permission has a tested feature and clear purpose; image and video selection work on current and older supported OS versions.

### 2.7 Make release crash reports identifiable and privacy-safe

The supplied custom logger captures JS exceptions but explicitly has no active native Sentry bridge, and its API breadcrumb currently records the full request URL.[2] Implement these minimum changes:

1. Add `commitSha`, release channel, environment, app version, and build number to Expo `extra`, populated during EAS build. The release packet must never show `commitSha: unknown`.
2. Sanitize API breadcrumbs before storage/transmission by removing query strings, fragments, credentials, access tokens, email addresses, and user-entered content. Never record Authorization headers, request bodies, post text, private media URLs, passwords, or message content.
3. Ensure crash-report POSTs have bounded timeouts and cannot loop or block startup.
4. Confirm release builds do not display developer crash alerts or debug screens to ordinary users.
5. Keep the working JS logger. For pre-JS native crashes, use TestFlight/App Store diagnostics and Android Vitals at minimum. Re-enable a native crash SDK only in a separate preview build first because the prior native KSCrash integration caused a launch crash. Ship it only after both iOS and Android preview builds pass the complete matrix and controlled test events are symbolicated/mapped.

Suggested configuration addition in `app.config.js`:

```js
const commitSha =
  process.env.EAS_BUILD_GIT_COMMIT_HASH ??
  process.env.GITHUB_SHA ??
  process.env.REPLIT_GIT_COMMIT_SHA ??
  "unknown";

// Merge into the returned Expo config:
extra: {
  ...(config.extra ?? {}),
  commitSha,
  releaseChannel: process.env.APP_RELEASE_CHANNEL ?? "production",
  environment: process.env.APP_ENV ?? "production",
},
```

**PASS:** a controlled non-production JS exception appears with the correct build metadata; iOS and Android native diagnostics are available; all captured data passes a privacy review.

### 2.8 Enforce upload limits and server validation

On the shared media-upload endpoint, verify authentication, purpose allowlist, image/video MIME allowlist, actual file-signature validation, maximum file size, maximum video duration, rate limiting, storage failure handling, and orphan cleanup. The client must show recoverable messages for 401, 403, 413, 415, 429, timeout, and 500 responses. Do not rely on client MIME or filename alone.

**PASS:** invalid/oversized files are rejected safely; failed uploads do not crash or erase successful attachments.

### 2.9 Verify authentication and startup do not hang

Apply explicit bounded loading and retry behavior to reviewer-critical startup calls. An auth request returning 401 must settle the auth state; it must not leave the splash screen indefinitely. Test expired tokens, offline launch, malformed profile responses, and backend 500. Preserve the existing auth-navigation guard tests and add native journey coverage.

**PASS:** every tested failure reaches login, retry, offline, or error UI within the defined timeout; no permanent spinner.

### 2.10 Verify UGC and account controls in native screens

Because the app contains posts, images/videos, circles, connections, mentions, and comments, verify these native controls and implement any missing ones:

- Acceptance of current Terms/Community Standards before first UGC creation.
- Report post/content and report user.
- Block and unblock user; blocked content and 1:1 interactions disappear appropriately.
- Content-warning flow for sensitive media.
- Published support contact.
- In-app account-deletion path plus public deletion-request URL.

Apple and Google both require reporting/blocking for UGC apps, and Google requires in-app plus web deletion paths when users can create accounts.[3] [4] [5]

**PASS:** controls work on exact release builds and store declarations match.

## Step 3 — Clear all code and configuration gates

Create `release-evidence/01-code-gates/` and save raw, unfiltered logs. Determine actual workspace package names first with `pnpm -r list --depth -1`.

```bash
mkdir -p release-evidence/01-code-gates

pnpm install --frozen-lockfile \
  2>&1 | tee release-evidence/01-code-gates/install.log

pnpm --filter @workspace/mobile run audit \
  2>&1 | tee release-evidence/01-code-gates/mobile-audit.log
pnpm --filter @workspace/mobile run typecheck \
  2>&1 | tee release-evidence/01-code-gates/mobile-typecheck.log
pnpm --filter @workspace/mobile run lint \
  2>&1 | tee release-evidence/01-code-gates/mobile-lint.log
pnpm --filter @workspace/mobile test -- --run \
  2>&1 | tee release-evidence/01-code-gates/mobile-tests.log

pnpm -r --if-present run typecheck \
  2>&1 | tee release-evidence/01-code-gates/workspace-typecheck.log
pnpm -r --if-present run lint \
  2>&1 | tee release-evidence/01-code-gates/workspace-lint.log
pnpm -r --if-present test \
  2>&1 | tee release-evidence/01-code-gates/workspace-tests.log
pnpm -r --if-present run build \
  2>&1 | tee release-evidence/01-code-gates/workspace-builds.log

cd artifacts/mobile
pnpm exec expo-doctor \
  2>&1 | tee ../../release-evidence/01-code-gates/expo-doctor.log
pnpm exec expo config --json \
  > ../../release-evidence/01-code-gates/expo-config.json
node scripts/pre-build-check.js ios \
  2>&1 | tee ../../release-evidence/01-code-gates/ios-prebuild.log
node scripts/pre-build-check.js android \
  2>&1 | tee ../../release-evidence/01-code-gates/android-prebuild.log
```

Do not use `| grep`, changed-file-only typechecks, `|| true`, or truncated screenshots as passing evidence. If a command is not defined, record that and run the repository’s actual equivalent rather than silently skipping it.

**PASS:** every required command exits `0`; the tree remains clean.

## Step 4 — Add deterministic native smoke flows

Use Maestro or the project’s established native UI framework. Add versioned flows under `artifacts/mobile/.maestro/` for:

| Flow | Required journey |
|---|---|
| `01-clean-launch.yaml` | Clean state → launch → splash settles → reviewer login. |
| `02-native-tabs.yaml` | Open every native tab and verify a stable heading/test ID. |
| `03-image-post.yaml` | Select fixture image → upload → preview → post → feed assertion. |
| `04-video-post.yaml` | Select fixture video → upload → preview → post → playback/open assertion. |
| `05-media-relaunch.yaml` | Force-close → relaunch → persisted image/video assertions. |
| `06-partial-upload.yaml` | First upload success, second forced failure, first preview remains. |
| `07-permissions.yaml` | Deny permission → recovery UI → grant in Settings → retry. |
| `08-session-expiry.yaml` | Seed expired token → stable login/re-auth path. |
| `09-offline-recovery.yaml` | Offline launch/action → retry state → restore network → recovery. |
| `10-flywheel.yaml` | Discover → detail → save/follow → community contribution → return via profile/saved/notification. |
| `11-ugc-controls.yaml` | Report content/user, block user, verify hidden interaction. |
| `12-account-deletion.yaml` | Reach deletion control and verify confirmation/request behavior using a disposable account. |

Use stable accessibility labels/test IDs. Do not add production-only hidden bypasses. Test credentials may be injected securely into the test runner, never committed.

**PASS:** automated flows pass where device automation supports them; manual-only rows are recorded separately, not omitted.

## Step 5 — Create reviewer accounts and seeded data

Create separate Apple and Google reviewer accounts in the production review environment. They must be permanent, reusable, valid worldwide, and free of OTP, 2FA, geo-gates, paywalls, waitlists, or manual approval.[6]

Seed each account with representative data: profile, location-independent discover results, a saved place, a followed business/user, circle/connection examples, a notification, an image post, a video post, and business-owner access if advertised. Test the credentials from a clean device and separate network.

Store credentials only in App Store Connect/Play Console and the approved secure secret channel. Put redacted identifiers and feature access—not passwords—in the evidence ZIP.

**PASS:** every advertised feature is reachable by the reviewer with the written steps.

## Step 6 — Build exact signed candidates without submitting

Do not use the supplied `pnpm run build:ios` command if it includes `--auto-submit`. Build only after the tree is clean and all code gates pass.

From `artifacts/mobile`:

```bash
pnpm exec eas whoami
pnpm exec eas project:info

# Confirm production profile and environment first.
pnpm exec eas config --platform ios --profile production
pnpm exec eas config --platform android --profile production

# Build, but do not submit.
pnpm exec eas build --platform ios --profile production --non-interactive
pnpm exec eas build --platform android --profile production --non-interactive
```

Record EAS build IDs, artifact references, versions/build numbers, commit SHA, runtime version, and SHA-256 where downloadable. Confirm no profile auto-submits. If the existing production profile cannot be installed by internal testers, use TestFlight for the exact iOS build and Google Play internal testing for the exact AAB. A separate Android APK preview may support debugging, but it does not replace testing the Play-delivered AAB.

**PASS:** artifact identity matches the manifest and source commit.

## Step 7 — Install through the real distribution channels

### iOS

Upload the exact candidate to App Store Connect/TestFlight without submitting for App Review. Process symbols. Add internal testers. Install from TestFlight on required devices. Record TestFlight build number and device screenshots.

### Android

Upload the exact AAB to Google Play internal testing. Add testers and reviewer credentials. Install from the Play testing link on required devices. This verifies Play signing, splits, delivery, and manifest behavior.

**PASS:** testers install the exact declared builds from TestFlight and Google Play, not development clients or Expo Go.

## Step 8 — Execute the physical-device matrix

Minimum device coverage:

| Platform | Required coverage |
|---|---|
| iOS | One current supported iPhone/iOS combination and one older supported iPhone/iOS combination. |
| Android | One current Android version/device and one older supported Android version/device, including a lower-memory device if possible. |

Run clean install and upgrade install, then execute all Task #373 journeys from `RELEASE_EVIDENCE_AND_VERIFICATION_CHECKLIST.md`: every native tab, reviewer login, image/video creation through force-close/relaunch, partial upload failure, legacy media, denied permissions, offline/slow/interrupted network, expired session, lifecycle transitions, 20 cold launches per device, flywheel, business-owner path, UGC controls, and account deletion.

For each row record device, OS, build, expected, actual, PASS/FAIL, named tester, UTC timestamp, and evidence path. Capture short videos for multi-step journeys and native logs for any failure.

**PASS:** every required row passes on all required devices. Any reproducible crash is immediate NO-GO.

## Step 9 — Verify crash reporting and native diagnostics

Use a non-production controlled test action gated to internal testers. Do not deliberately crash a public production build.

1. Trigger one JS test exception on iOS and Android; verify the custom pipeline receives it with correct release metadata and sanitized breadcrumbs.
2. If a native SDK is enabled after preview qualification, trigger one safe non-production native test event and verify iOS symbolication and Android mapping.
3. Confirm dSYM and Android mapping/native symbol files are retained/uploaded for the exact builds.
4. Review TestFlight/App Store diagnostics and Android logcat/Vitals for the smoke window.
5. Confirm ordinary users never see debug crash controls or raw stack traces.

**PASS:** reporting works, events identify the exact build, stacks are actionable, and privacy review passes.

## Step 10 — Run Google pre-launch and store-compliance checks

Keep the AAB in a testing track and provide Google’s reusable credentials. Run the pre-launch report across devices and resolve release-significant crashes, ANRs, compatibility, security/privacy, accessibility, and layout findings.[7]

Verify Apple review notes, Google app-access instructions, privacy policy, support URL, public account-deletion URL, UGC moderation, permission disclosures, screenshots, and Data safety/App Privacy answers against the exact build.

**PASS:** no unresolved release-significant finding and no inaccessible advertised feature.

## Step 11 — Build the evidence packet

Use the structure in `RELEASE_EVIDENCE_AND_VERIFICATION_CHECKLIST.md`. Required top-level output:

```text
release-evidence/ios-<build>_android-<versionCode>_<commit>/
  00-manifest.json
  01-code-gates/
  02-artifacts/
  03-device-matrix.csv
  04-ios/
  05-android/
  06-media/
  07-reviewer-access/
  08-policy/
  09-observability/
  10-store/
  GO_NO_GO.md
```

Generate SHA-256 hashes for every non-secret file and ZIP the folder. Attach the ZIP, commit SHA, EAS build IDs, TestFlight build, and Play internal-test release to Task #373.

**PASS:** no required row is missing, blocked, or supported by another build.

## Step 12 — Final decision and submission control

Task #373 may close only when `GO_NO_GO.md` says **GO**, every required row has an evidence path, the exact signed artifacts passed, and an independent audit confirms the packet. Store submission is a separate explicit owner-authorized action.

If the release is tied to approaching events, Apple permits an expedited-review request for an associated event. Submit that request only after GO, and include the event name/date, Mapping With Melanin’s association, and reproduction steps for any critical bug fixed from the prior version.[8]

## What Replit should report as concrete code changes

At minimum, the final diff/evidence must answer these questions:

| Area | Required answer |
|---|---|
| TypeScript | Which 27 errors were fixed, in which files, without suppressions? |
| Lint | What exact dependency mismatch caused startup failure, and what manifest/lockfile change fixed it? |
| API tests | Where were `supertest` and types added, and does the formerly skipped suite pass? |
| Community post race | Is Post disabled/guarded while upload is active, and are only completed URLs submitted? |
| Video | Is native playback implemented and tested, or are claims/UI explicitly limited to external opening? |
| Permissions | Were purpose strings updated for community media, `READ_MEDIA_VIDEO` assessed, and unused permissions removed? |
| Crash privacy | Are API URLs sanitized and build/commit metadata present? Are debug crash surfaces absent from release? |
| Native crash coverage | What captures pre-JS iOS/Android failures, and where is symbolication/mapping proof? |
| Upload hardening | Which server-side MIME/signature/size/duration/rate/timeout checks exist and which tests prove them? |
| Startup/auth | What prevents permanent loading after 401/offline/timeout? |
| UGC/deletion | Where are terms, report, block, moderation, support, in-app deletion, and public deletion request implemented? |

## Automatic NO-GO conditions

Any of the following makes Task #373 incomplete: a reproducible crash or ANR; full typecheck failure; lint unable to start; a skipped required suite; dirty build tree; missing artifact identity; device evidence from Expo Go/web instead of signed candidates; image/video not persistent after relaunch; reviewer credentials blocked; dead tab or permanent loader; unsanitized crash data; missing report/block/deletion controls; unresolved Google pre-launch issue; or physical-device testing deferred to another task without attached evidence.

## References

[1]: ../mwm-manus-mobile-audit/source/artifacts/mobile/app.json "Supplied Expo application configuration"
[2]: ../mwm-manus-mobile-audit/source/artifacts/mobile/lib/crashLogger.ts "Supplied custom crash logger"
[3]: https://developer.apple.com/app-store/review/guidelines/ "Apple App Review Guidelines"
[4]: https://support.google.com/googleplay/android-developer/answer/9876937?hl=en "Google Play User Generated Content policy"
[5]: https://support.google.com/googleplay/android-developer/answer/13327111?hl=en "Google Play account deletion requirements"
[6]: https://support.google.com/googleplay/android-developer/answer/15748846?hl=en "Google Play reviewer sign-in requirements"
[7]: https://play.google.com/console/about/pre-launchreports/ "Google Play pre-launch reports"
[8]: https://developer.apple.com/distribute/app-review/ "Apple App Review"
