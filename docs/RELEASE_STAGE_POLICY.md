# Release-stage policy

This policy prevents a source change, an EAS request, or a store upload from being described as a completed product fix.

> A release candidate is one immutable full Git SHA. A changed SHA starts a new candidate and cannot inherit device or founder evidence from a prior candidate.

## Required order

| Stage | What it proves | What it does **not** prove |
|---|---|---|
| `CODED` | Clean, committed source candidate and tree identity | Tests, integration, devices, or a store artifact |
| `AUTOMATED_TESTED` | CI/source gate output for that exact SHA | Real deployment, native device behavior, or founder approval |
| `INTEGRATION_TESTED` | Isolated non-production integration environment/API identity and protected-flow evidence | iOS/Android device behavior or store processing |
| `DEVICE_TESTED_IOS` | A completed iOS artifact plus physical iOS device evidence | Android behavior, founder acceptance, App Review, or release |
| `DEVICE_TESTED_ANDROID` | A completed Android artifact plus physical Android device evidence | Founder acceptance, Play promotion, or release |
| `FOUNDER_ACCEPTED` | Founder approval tied to the candidate evidence digest | A completed store rollout |
| `RELEASED` | Store/track evidence and live source/version probe | Future edits, later store withdrawal, or a different candidate |

No stage can be skipped, reordered, edited in place, or reused by another SHA.

## Evidence boundaries

Release evidence is limited to IDs, hashes, timestamps, test/run links, build/artifact IDs, and redacted physical-device test references. It must **not** contain member data, raw audio, transcripts, addresses, Community content, business records, ownership designations, billing/customer data, access tokens, or provider secrets.

Evidence is validated through `scripts/release-state.mjs` against `release/evidence.schema.json`. Each transition is digest-chained to the previous snapshot. The CLI refuses to overwrite an evidence snapshot; a transition writes a new file.

## Native build rule

An EAS request is only permitted after `INTEGRATION_TESTED` evidence for the same SHA has been validated. It must be described as a **build request** until EAS returns a completed artifact ID and artifact digest. A native build, EAS completion, TestFlight upload, or Play artifact is not a device-test pass or release.

Store upload/promotion is blocked until both device stages and `FOUNDER_ACCEPTED` evidence exist. A legacy Build 106 script and the historical 115/85 dispatcher are intentionally retired so they cannot bypass this policy.

## Required physical-device evidence

The iOS and Android device stages each require a named test run tied to the immutable artifact. The relevant test matrix includes:

- install/update, sign-in and session restoration;
- map location and permission recovery;
- Community visibility/action preservation;
- business lookup and source/card behavior;
- payment handoff without uncontrolled production charges;
- Kinfolk microphone, transcription, reply, and foreground playback;
- logout/expired-session behavior; and
- relevant release-specific regression cases.

A human tester must confirm actual audio-route audibility. CI, source inspection, and EAS logs cannot make that claim.

## External controls still required

Repository code cannot prevent a person with direct account credentials from bypassing it. Before the policy is treated as enforced, configure:

1. GitHub branch protection requiring the release-evidence workflow;
2. a protected approval environment for `FOUNDER_ACCEPTED`;
3. EAS credentials restricted to the approved CI/owner path; and
4. App Store Connect/Google Play roles that prevent uncontrolled promotion.

Until those account-level controls are in place, the repository validates evidence and blocks its own dispatchers but cannot prevent direct external-console actions.
