# Apple iOS Crash Incident Assessment — Replit Audit Does Not Clear the Build

## Bottom line

**Apple’s crash report remains unresolved.** Replit’s response does not contradict Apple; it shows that Replit has not obtained the evidence needed to investigate the Apple reviewer’s actual runtime failure.

A cloud build record only proves that an iOS binary was produced. It does not prove that the binary launches, survives startup, completes onboarding, loads the map, opens Kinfolk, submits the waitlist, handles permissions, or behaves correctly on the Apple reviewer’s device and iOS version.

> Replit has established: “a binary exists.” It has **not** established: “the exact binary Apple reviewed launches and runs without a crash.”

The release must remain blocked until the exact reviewed build is identified, its Apple crash report is obtained and symbolicated, and the crash is reproduced or disproved on the matching binary/runtime.

## What Replit’s report actually proves

| Replit statement | What it proves | What it does **not** prove |
|---|---|---|
| iOS build 102 and Android version code 77 exist | Cloud builds were created. | Either build launches correctly on an iPhone/Android device. |
| No local Apple `.ips`, TestFlight feedback, Android Vitals, or logcat artifact exists | Replit currently lacks direct device/reviewer crash evidence. | That no Apple crash occurred. |
| Expo web preview has a `react-native-maps` import failure | The web preview has a reproducible JavaScript failure. | The specific native iOS crash cause. |
| Web failure is not a native iOS/Android crash | The web error should not be mislabeled as an Apple native crash. | That native iOS is healthy. |
| Native waitlist screen and POST flow exist in source | The app intends to keep waitlist functionality native. | The exact compiled iOS binary reaches and completes that flow without crashing. |
| Current TypeScript has 29 errors | The repository has unresolved type-check failures. | Which one causes the Apple crash; however, it is a material release-quality blocker. |
| Expo package versions have 25 mismatches | Dependency alignment is not clean for the installed Expo SDK. | Which mismatch causes the Apple crash; however, it can create native/runtime incompatibility risk. |

## Why the current response cannot close Apple’s claim

The report has three evidence gaps.

First, it does not identify the exact **App Store Connect/TestFlight build** Apple reviewed. The review build must be matched by bundle identifier, marketing version, build number, upload timestamp, EAS build identifier, and source revision. “Latest iOS build 102” is insufficient until Replit proves that build 102 is the binary Apple installed.

Second, it has no **Apple crash artifact**. The required artifact is the Apple-provided crash/incident report (normally a `.ips` report or a TestFlight/App Store Connect crash record) with the exception type, termination reason, faulting thread, binary image list, and symbolicated app frames. Without that, nobody can truthfully say whether the crash occurred at native launch, JavaScript initialization, map initialization, permissions, network/auth bootstrap, a route transition, or another path.

Third, it has no **native runtime reproduction**. A web-only Expo preview error is useful diagnostic information, but it cannot substitute for launching the reviewed iOS binary on an iPhone or an iOS simulator/device target that matches Apple’s review environment as closely as possible.

## Material release risks already visible

The current evidence identifies risks that should be remediated or explicitly triaged before another iOS submission. It does not identify them as the crash cause.

| Risk | Why it matters | Required disposition before release |
|---|---|---|
| **29 TypeScript errors** | Type errors often indicate mismatched route/data/component contracts and reduce confidence in the compiled runtime path. | Export the complete error list, classify each as build-blocking, runtime-risk, test-only, or dead code; fix or explicitly owner-accept each relevant error. |
| **25 Expo SDK dependency mismatches** | Expo/RN native module versions must align with the installed SDK. A cloud build may succeed while a native module behaves incorrectly at runtime. | Run Expo Doctor in non-mutating audit mode; produce the exact mismatch list and the approved lockfile/package correction plan. Do not blindly install or upgrade packages. |
| **`react-native-maps` web import failure** | It is not evidence of the Apple crash, but map initialization/import handling is a known app startup path worth testing natively. | Test cold launch and map navigation on iOS separately; verify platform guards/import configuration and collect native logs if it fails. |
| **No Apple/TestFlight crash artifact** | There is no causality evidence. | Obtain Apple’s exact rejection/crash material before attempting a code fix. |
| **No native smoke-test evidence** | The cloud build is unproven at runtime. | Test the same binary on iPhone/iOS and record a startup-to-waitlist/Kinfolk/map smoke path. |
| **Lint command attempted automatic configuration** | The audit was not fully read-only and the workspace may now differ from its pre-audit state. | Freeze work, show `git status`/diff, and restore or retain the auto-created lint files only with owner approval. |

## Required evidence chain

The following chain must be complete before anyone claims the iOS build is stable.

```text
Apple reviewer rejection / crash notice
  → exact App Store Connect build identity
  → matching EAS build ID and source SHA
  → Apple .ips / TestFlight crash record
  → symbolicated crash stack
  → native reproduction attempt on exact binary
  → isolated cause and focused patch
  → same-binary native smoke test after patch
  → fresh release build identity + submission evidence
```

## What must happen next

1. **Do not release, resubmit, or “fix” based on the web-preview error alone.** It is insufficient evidence for Apple’s claimed crash.
2. **Obtain Apple’s specific feedback.** The owner should provide the Apple rejection text, screenshot, App Store Connect build number, and any crash log/download available in the review/TestFlight record.
3. **Match the review binary to Replit’s build.** Replit must map that exact Apple build to one EAS build ID and one Git/source revision.
4. **Symbolicate before diagnosing.** Replit must use the matching dSYM/symbols for that binary; a stack without symbols cannot reliably identify the failing app code.
5. **Run a native smoke test on the exact binary.** The tested flow is: cold launch → onboarding/login state → home → map → Kinfolk → native waitlist → app background/foreground. Record device model, iOS version, build number, route, result, and any crash log.
6. **Resolve existing quality blockers independently.** The TypeScript errors and Expo-version mismatches need a scope-locked remediation plan, but must not be blamed for the Apple crash without the Apple stack.
7. **Resolve the lint side effect before any further work.** Replit needs to show the exact diff caused by the automatic lint setup and wait for owner direction before keeping or reverting it.

## Owner decision needed now

There are two separate approvals; they must not be conflated.

| Decision | Recommended owner direction |
|---|---|
| **Automatic lint side effect** | Approve a read-only inspection of `git status` and the exact diff only. Do not approve keeping, reverting, installing, or configuring anything until the diff is shown. |
| **Apple crash triage** | Approve evidence collection and native reproduction only. Do not approve a code fix until Replit returns the exact Apple crash stack and source/build match. |

## Conclusion

Apple may be right that the app crashes. Replit may also be right that its available evidence cannot reproduce or identify a native crash. Those statements are compatible because the critical Apple runtime artifact is missing.

The correct next step is not a broad code change. It is a matched-build, symbolicated-crash, native-runtime investigation with the release gate still blocked.
