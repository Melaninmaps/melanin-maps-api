# Mapping With Melanin Build 106 — TestFlight Staging Only

This repository permits exactly one store-distribution action for Build 106: an **iOS TestFlight build backed by the isolated staging API**. It does not permit an Android build, EAS Update, production-profile build, App Review submission, Play submission, or signing change.

## Canonical command

Run from the repository root only after the exact candidate commit has passed independent review:

```bash
bash scripts/release-build-106.sh ios-testflight-staging
```

Do not call `eas build`, `eas submit`, or `eas update` directly. The dispatcher verifies the clean full SHA, Build `1.1.6 (106)`, runtime `1.1.6-native.1`, staging API origin, disabled Expo Updates, disabled RevenueCat behavior, removed background audio, source scans, tests, typechecks, Expo config/introspection, and a local iOS export before it starts EAS. It uses only the `testflight-staging` build and submit profiles and freezes existing remote signing credentials.

## Required result

A successful run must report the EAS Build ID, exact Git SHA, app version/build number, runtime version, `testflight-staging` profile, staging API origin, signing-credential reuse, App Store Connect/TestFlight upload status, and explicit confirmation that App Review was not started.

Build 105 remains untouched. Testers should install Build 106 from TestFlight only after Apple finishes processing it. Tester acceptance is a separate post-upload step and must cover login/session restore, generic and exact-name business discovery, Map/list behavior, community business submission, Kinfolk directory-first results, current cited answers, microphone transcription, foreground spoken response, and privacy opt-out.

## Prohibited commands

The repository-root `eas.json` intentionally has no build profiles. The mobile project intentionally has no `production` profile. Any old document or task backup showing direct production EAS commands is historical and must not be used.
