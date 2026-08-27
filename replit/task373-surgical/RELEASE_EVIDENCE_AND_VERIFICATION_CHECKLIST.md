# Mapping With Melanin — Release Evidence and Verification Checklist

**Purpose:** Remove ambiguity about when the iOS and Android release is complete.  
**Decision rule:** The release remains **NO-GO** until every required row is `PASS` with evidence from the exact signed release candidates. `Deferred`, `covered elsewhere`, `not reproduced`, `pre-existing`, and unsupported prose are not passing results.

Apple requires on-device stability testing, complete reviewer access, working backend services, and functional links; it may reject binaries that crash or exhibit obvious technical problems.[1] Google requires reusable reviewer access without expiring OTP/2FA barriers and provides pre-launch testing across Android devices.[2] [3]

## The simple answer

Replit confirms completion by creating a single folder named with the release candidate, for example:

```text
release-evidence/ios-102_android-77_<commit-sha>/
```

That folder must contain the exact artifact identities, raw command logs, device test matrix, screenshots or short recordings, crash-report proof, reviewer-account proof, policy controls, and store declarations described below. A written statement that a test passed is not enough without the referenced evidence.

Manus checks completion by auditing that folder, rerunning all reproducible code/build checks against the same commit, checking the artifact/build identities, inspecting device evidence and crash-report exports, verifying that no row is missing or mislabeled, and issuing one signed **GO/NO-GO audit**. Physical-device actions cannot be independently recreated without access to those devices; therefore, device rows require named tester attestation plus video/screenshot/log evidence from the exact build.

## Required evidence-folder structure

| Path | Required contents |
|---|---|
| `00-manifest.json` | Commit SHA, branch, timestamp, iOS version/build, Android version/versionCode, artifact names and SHA-256 hashes, API environment, tester names, and evidence index. |
| `01-code-gates/` | Full unfiltered logs for install/lockfile verification, typecheck, lint, formatting, unit/integration tests, web build, API build, Expo config, iOS pre-build, and Android pre-build. |
| `02-artifacts/` | IPA/TestFlight build identity and AAB/APK identity or secure references, plus checksums and signing/build output. |
| `03-device-matrix.csv` | One row per test, device, OS, artifact, result, timestamp, tester, and evidence path. |
| `04-ios/` | iOS screenshots, recordings, console/device logs, install evidence, and crash-report proof. |
| `05-android/` | Android screenshots, recordings, logcat extracts, install evidence, and crash/ANR proof. |
| `06-media/` | Image/video upload request evidence, returned URLs, post payload shape, reloaded API shape, persistence screenshots, and failure-recovery evidence. |
| `07-reviewer-access/` | Redacted account identifiers, reviewer instructions, seeded-data proof, feature-access matrix, and confirmation that OTP/2FA/paywall/approval queues do not block review. |
| `08-policy/` | UGC terms acceptance, report content/user, block user, moderation handling, support contact, in-app account deletion, public deletion URL, privacy policy, and data-disclosure evidence. |
| `09-observability/` | iOS symbolication and Android mapping configuration, test-event screenshots, release tags, and proof that secrets/content are not captured. |
| `10-store/` | Apple review notes, Google app-access instructions, permissions/purpose strings, privacy/Data safety answers, screenshots, support URL, deletion URL, and Google pre-launch report. |
| `GO_NO_GO.md` | Final table of every gate, evidence link, unresolved issue, owner, and explicit decision. |

## Required code and build gates

| ID | Gate | PASS requirement |
|---|---|---|
| C01 | Reproducible install | Clean dependency install succeeds from the committed lockfile. |
| C02 | Full mobile typecheck | Zero errors; no filtering to “changed files only.” |
| C03 | Lint | Runs successfully with zero release-significant errors; dependency mismatch resolved. |
| C04 | Formatting | Required source files pass the project formatter; backup/generated files are excluded appropriately rather than used to hide source failures. |
| C05 | Mobile tests | All tests execute and pass; exact total recorded. |
| C06 | API tests | All suites load and pass, including the suite previously blocked by missing `supertest`. |
| C07 | Web/API builds | Production builds pass from the release commit. |
| C08 | Expo config | Scheme, bundle ID, package name, permissions, purpose strings, and environment resolve correctly. |
| C09 | Platform pre-build | iOS and Android checks pass from a clean committed tree. |
| C10 | Artifact identity | Signed artifacts map to the same commit and declared build numbers; hashes are recorded. |

## Required physical-device matrix

At minimum, test the exact signed candidates on one current and one older supported iPhone/iOS combination, and one current and one older supported Android combination. Every row records `test_id`, `platform`, `device`, `os`, `build`, `install_type`, `network`, `permissions`, `expected`, `actual`, `result`, `tester`, `timestamp`, and `evidence_path`.

| ID | Journey | PASS requirement |
|---|---|---|
| N01 | Clean install and first launch | Launches to the intended screen without crash, permanent loader, or broken assets. |
| N02 | Upgrade install | Existing account/session/data survives upgrade; launch and migrations succeed. |
| N03 | Reviewer login | Permanent review account signs in without OTP, 2FA, geo-gate, approval, or paywall. |
| N04 | Every native tab | Every tab opens its intended screen; back/re-entry work; no dead action or uncaught error. |
| N05 | Deep links | Supported links open the correct screen from cold and warm states; invalid links fail safely. |
| N06 | Image post | Select → upload → preview → submit → feed → force-close → relaunch → image persists. |
| N07 | Video post | Select → upload → preview → submit → feed → force-close → relaunch → video persists and plays/opens. |
| N08 | Partial upload failure | First attachment succeeds, later attachment fails, first remains selected and can be posted. |
| N09 | Legacy media | Array, JSON-string, double-encoded, and malformed legacy rows render or fail safely without crash. |
| N10 | Permission denial | Location, photo/video, notifications, camera if used, and other permissions produce usable recovery paths. |
| N11 | Network failure | Offline, slow, interrupted, timeout, 429, and server failure show retryable states without crash/data loss. |
| N12 | Session failure | Expired token/401, logout, login recovery, and protected-route redirects are stable. |
| N13 | Lifecycle | Background/foreground, lock/unlock, interrupted upload, and low-memory relaunch recover correctly. |
| N14 | Cold-launch repetition | At least 20 consecutive cold launches per tested device complete without crash or permanent loader. |
| N15 | Flywheel | Discover → evaluate → save/follow/connect → contribute/post → notification/profile history → return through personalized/saved content. |
| N16 | Business-owner path | Onboarding, listing management, and principal conversion action complete or are explicitly removed from release claims. |
| N17 | Account deletion | In-app deletion request/path works; public web deletion resource works; resulting state matches policy. |
| N18 | UGC safety | Terms acceptance, report post/user, block user, content warnings, moderation handling, and support contact work. |

## Crash-proof evidence

A blank crash dashboard is not sufficient. The release packet must show that reporting is actually connected.

| ID | Evidence | PASS requirement |
|---|---|---|
| O01 | iOS crash pipeline | A controlled non-production test exception from the release configuration appears with correct version/build/device/OS and is symbolicated. |
| O02 | Android crash pipeline | A controlled non-production test exception appears with correct version/versionCode/device/OS and mapped stack trace. |
| O03 | Privacy | Events exclude passwords, tokens, private media, message/post bodies, and unnecessary personal data. |
| O04 | Device logs | Native smoke runs include console/logcat review with no uncaught fatal error, repeated red-screen condition, or ANR. |
| O05 | Store telemetry | Google pre-launch report and available TestFlight/App Store diagnostics show no unresolved release-significant crash/ANR. |

## Reviewer and policy gates

| ID | Gate | PASS requirement |
|---|---|---|
| R01 | Apple review access | Valid demo credentials and precise review steps reach all advertised functionality; backend remains live.[1] |
| R02 | Google review access | Reusable credentials work from any location without expiring OTP/2FA barriers.[2] |
| R03 | Functional links | Privacy, support, deletion, cultural-site, map, and external resource links work. |
| R04 | UGC controls | Terms, moderation, report, and block controls meet Apple and Google requirements.[4] [5] |
| R05 | Account deletion | In-app deletion path and public deletion-request resource work and match Google disclosures.[6] |
| R06 | Privacy declarations | Apple privacy answers and Google Data safety answers match code, SDKs, storage, retention, deletion, and sharing behavior. |
| R07 | Metadata | Store screenshots and descriptions match the release candidate; unfinished features are not advertised. |
| R08 | Google pre-launch | No unresolved release-significant stability, compatibility, security/privacy, accessibility, or layout findings.[3] |

## What Replit must return

Replit must return the `release-evidence` folder as a ZIP plus the exact commit SHA and secure references to the signed artifacts. Its final message must be generated from `GO_NO_GO.md`, not written from memory. If Replit lacks a physical device, Apple/Google console access, or reviewer credentials, it must mark the corresponding rows `BLOCKED` and assign them to the named device tester or account owner; it cannot close them.

Use this exact completion instruction:

```text
Do not tell me the release is complete in prose. Create and attach the full release-evidence folder using RELEASE_EVIDENCE_AND_VERIFICATION_CHECKLIST.md. Every required row must be PASS with an evidence path, or BLOCKED with owner and dependency. Include raw logs, artifact identities/checksums, the device matrix, media persistence evidence, crash-report proof, reviewer-access proof, policy controls, store declarations, and the Google pre-launch report. Generate GO_NO_GO.md from those rows. The decision is automatically NO-GO if any required row is FAIL, BLOCKED, missing, based on a different build, or supported only by web/Expo-browser evidence.
```

## How Manus will check it

After you attach the ZIP, Manus will perform the following independent audit:

| Verification | Method |
|---|---|
| Completeness | Compare the manifest and matrix against every required gate in this document. |
| Integrity | Verify SHA-256 hashes, commit/build identity, timestamps, and cross-file references. |
| Code gates | Review raw logs and rerun typecheck, lint, tests, builds, and static checks when the matching workspace/export is available. |
| Native evidence | Inspect screenshots/recordings and device logs for the exact build; reject browser or Expo-web evidence mislabeled as native. |
| Media | Trace upload request → URL → submitted payload → stored/reloaded API shape → post-relaunch rendering/playback. |
| Crashes | Confirm test events, release tags, symbolication/mapping, and absence of sensitive captured data. |
| Reviewer access | Check the feature-access matrix and, when credentials/access are provided securely, verify the documented reviewer path. |
| Policies | Compare implemented UGC/deletion/privacy controls with store declarations. |
| Decision | Publish a separate audit table with `VERIFIED PASS`, `UNVERIFIED`, `FAIL`, or `BLOCKED`, followed by a single GO/NO-GO decision. |

No store submission should occur until both the implementation packet and the independent audit say **GO**, followed by the owner’s explicit authorization.

## References

[1]: https://developer.apple.com/distribute/app-review/ "Apple App Review"
[2]: https://support.google.com/googleplay/android-developer/answer/15748846?hl=en "Google Play reviewer sign-in requirements"
[3]: https://play.google.com/console/about/pre-launchreports/ "Google Play pre-launch reports"
[4]: https://developer.apple.com/app-store/review/guidelines/ "Apple App Review Guidelines"
[5]: https://support.google.com/googleplay/android-developer/answer/9876937?hl=en "Google Play User Generated Content policy"
[6]: https://support.google.com/googleplay/android-developer/answer/13327111?hl=en "Google Play account deletion requirements"
