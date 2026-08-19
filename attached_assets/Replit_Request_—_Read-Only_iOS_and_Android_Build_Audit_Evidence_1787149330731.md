# Replit Request — Read-Only iOS and Android Build Audit Evidence

**Owner instruction:** Do not change, build, publish, submit, or redeploy the mobile app yet. This is a **read-only audit-evidence request**. Do not edit mobile source, API source, web source, native configuration, EAS configuration, signing credentials, or release settings. Do not create a new build. Do not submit anything to TestFlight, App Store Connect, Google Play, or the public app stores.

The goal is to give Manus enough evidence to audit the current iOS and Android builds, identify the actual causes of Apple-reported crashes, compare the native app against the website features already approved, and write an exact file-scoped mobile patch. We will not guess at crash causes and we will not allow broad app changes.

> **Do not send credentials, signing certificates, private keys, API keys, tokens, provisioning profiles, or personal-device identifiers.** Build identifiers, logs, source file paths, source code, and redacted configuration are sufficient.

## Deliverable A — Mobile revision and source inventory

Report the exact Git revision currently used for the mobile app and the branch name. Then provide the complete file list, including file sizes, for the mobile application root (expected to be `artifacts/mobile/` if that is the active mobile artifact).

Include the content of the following files, if present:

```text
artifacts/mobile/package.json
artifacts/mobile/pnpm-lock.yaml
artifacts/mobile/app.json
artifacts/mobile/app.config.js
artifacts/mobile/app.config.ts
artifacts/mobile/eas.json
artifacts/mobile/tsconfig.json
artifacts/mobile/babel.config.js
artifacts/mobile/metro.config.js
artifacts/mobile/.env.example
artifacts/mobile/app/_layout.tsx
artifacts/mobile/app/**
artifacts/mobile/src/**
artifacts/mobile/components/**
artifacts/mobile/hooks/**
artifacts/mobile/lib/**
artifacts/mobile/constants/**
artifacts/mobile/assets/**
```

For large binary assets, provide the path, file type, dimensions, and hash rather than embedding the binary. For any existing `ios/` or `android/` native projects, include their file lists and configuration files, but do not include signing material.

Also provide a feature-route map with this format:

| Mobile screen or route | Purpose | Entry point(s) | API endpoint(s) used | iOS status | Android status |
|---|---|---|---|---|---|

This route map must include, at minimum: authentication, onboarding, home, map/discovery, directory/business detail, cultural sites, Explore, Events, Community, Living Library, Kinfolk text, Kinfolk voice, business intake, photo upload, business claim, profile/saves, waitlist/tour, and every existing tab or modal.

## Deliverable B — Exact build evidence for both platforms

Provide the following command outputs without creating new builds:

```bash
cd artifacts/mobile

# Toolchain and dependency health
node --version
pnpm --version
npx expo --version
npx expo config --type public
npx expo-doctor
pnpm exec tsc --noEmit
pnpm exec expo lint
npx expo install --check

# Source-state evidence
 git rev-parse HEAD
git status --short
git diff --name-only
```

If EAS is used, provide the outputs from the existing-build list commands:

```bash
cd artifacts/mobile
npx eas-cli build:list --platform ios --limit 5 --json
npx eas-cli build:list --platform android --limit 5 --json
```

For each latest iOS and Android build, provide the build ID, build profile, Git revision, Expo SDK version, React Native version, app version, iOS build number or Android version code, build date, build logs URL or exported build log, and whether the build installed and launched successfully.

## Deliverable C — Apple crash evidence

Apple crash reports are the source of truth for the Apple issue. Provide every available item below, redacting only personally identifying user data:

| Evidence | What Replit must provide |
|---|---|
| App Store Connect issue record | Exact issue title, Apple’s full message, affected app version/build number, affected iOS version(s), device class, and first/last occurrence dates. |
| `.ips` crash report or symbolicated stack trace | The full crash report for each unique crash signature, including exception type, termination reason, crashed thread, and all symbolicated application frames. |
| TestFlight feedback | Exact text, screenshots, and build number for every crash-related report. |
| Xcode/device reproduction | Exact reproduction steps, physical device/simulator model, iOS version, and the full Xcode console stack trace. |
| Build diagnostics | The EAS iOS build log and, if relevant, dSYM availability/status. |

If the report is unsymbolicated, do **not** claim the root cause. Provide the dSYM status and the raw report; we will determine the required symbolication route. Do not ship a speculative fix.

## Deliverable D — Android crash and quality evidence

Provide the corresponding Android evidence:

| Evidence | What Replit must provide |
|---|---|
| Google Play Console | Android Vitals crash and ANR summaries, with issue identifiers, affected version codes, Android versions, device models, and stack traces. |
| Pre-launch report | The complete report for the latest Android App Bundle, including all crash screenshots and failing test paths. |
| Device reproduction | Exact steps, Android version/device or emulator, and focused `adb logcat` output around the crash. |
| Build diagnostics | Latest EAS Android build log, build ID, build profile, artifact type (`.aab`/`.apk`), and ProGuard/R8 mapping-file status if minification is enabled. |

## Deliverable E — Website-to-mobile contract evidence

The mobile app must match the approved website behavior, but the audit must compare actual contracts rather than assume them. Provide the current server/API source or API contract evidence for every mobile-used endpoint. Include request body, response body, status codes, authentication requirement, validation, and failure behavior.

The following endpoints and capabilities require explicit evidence because they are part of the approved Mapping With Melanin behavior:

| Capability | Required API/contract evidence |
|---|---|
| **Direct mobile waitlist** | `POST /api/waitlist`: accepted fields, validation, duplicate response, success payload, rate limiting, CORS, and whether unauthenticated mobile requests are allowed. |
| **Kinfolk text and voice** | Text/voice endpoint contracts, queue/busy response, permission/format/upload/transcription failure states, and required headers. |
| **Location-first discovery** | Closest-two result behavior, no global fallback, location input, expansion opt-in, and coverage-gap signals. |
| **Businesses and cultural sites** | Canonical slug/detail routes, non-business entity lookup, claim/intake/photo-upload contracts, and status behavior. |
| **Living Library** | Topic list, topic detail, citations, saved/reusable topic behavior, city-specific lens, and research-result storage. |
| **Community Intelligence** | Moderated community-sourced signals, terminology, and allowed member submissions. |
| **Profile and saves** | Session/auth behavior, profile update, saved places, and error states. |

For every contract, identify whether the mobile code currently calls it and list the precise client file(s) and function(s) that do so.

## Deliverable F — Current in-app waitlist/tour evidence

The requested new behavior is simple: while someone is on the mobile app tour or has not yet joined, they must be able to join the waitlist **directly inside the native iOS/Android app**. They must not be sent to an external browser unless that is an explicit fallback after a native request fails.

Before any implementation, provide:

1. The current mobile tour/onboarding/waitlist routes and all existing CTA labels.
2. Screenshots or captures at iPhone and Android phone dimensions of the app’s current first-run and tour states.
3. The current native submission path, if any, and the exact client files involved.
4. The verified server contract for `POST /api/waitlist`.
5. A list of every mobile source file that would need to change to add this flow. Do not change them yet.

The desired future mobile behavior is:

| Moment | Required behavior |
|---|---|
| Tour / onboarding | A visible **Join the Waitlist** action is available directly in the app. |
| Form | Native form with required email and optional first name and city, matching the website’s data contract. |
| Submit | Native POST to the existing waitlist endpoint with a mobile source marker and selected preview/experience choice when available. |
| Success | Clear in-app confirmation. Do not open a browser. |
| Duplicate | Friendly, specific in-app “already on the list” state. |
| Offline / server failure | Preserve entered text and give a truthful retry message. |
| Accessibility | Labels, keyboard navigation, readable error text, and safe-area handling on iOS and Android. |

## Deliverable G — Scope-lock release evidence

Before the audit is complete, create **no source edits**. At the end of this evidence-gathering step, provide:

```bash
cd artifacts/mobile
git status --short
git diff --name-only
```

The required result is no mobile-source changes from this evidence request. If a build system creates untracked logs or reports, list them separately and do not commit them.

## Expected response format

Return one audit handoff containing:

1. The mobile revision and full file inventory.
2. The iOS and Android latest-build details and logs.
3. Every Apple crash report/stack trace and Android crash/ANR/pre-launch artifact available.
4. The route map and web-to-mobile API contract table.
5. The current waitlist/tour evidence and proposed affected file list only.
6. The final `git status --short` and `git diff --name-only` proof that no source changed.

Do not propose implementation changes in this response. Manus will audit the evidence first and return an exact, file-by-file surgical patch with separate owner approval before Replit touches mobile source.
