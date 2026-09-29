# Historical submission instructions — retired

This document previously described a Build 106 TestFlight staging path. It is **not an executable release procedure** and must not be used to request a build, upload to TestFlight, submit to App Review, or promote a Google Play track.

## Current policy

Use the repository-wide [release-stage policy](../../docs/RELEASE_STAGE_POLICY.md) and the append-only validator:

```bash
node scripts/release-state.mjs --help
```

A source candidate must have a validated, immutable evidence chain in this order:

```text
CODED
→ AUTOMATED_TESTED
→ INTEGRATION_TESTED
→ DEVICE_TESTED_IOS
→ DEVICE_TESTED_ANDROID
→ FOUNDER_ACCEPTED
→ RELEASED
```

A local build number, `app.json`, `eas.json`, a successful source gate, an EAS request, an EAS completion, or a TestFlight upload is not device evidence or a release by itself.

## Prohibited shortcuts

- Do not run an old `release-build-106.sh` command.
- Do not use automatic EAS submission flags.
- Do not mark a build as fixed based on source inspection or configuration alone.
- Do not reuse an iOS build number or Android versionCode without first checking the live EAS and store records.
- Do not change or overwrite `.build-record.json` to create release evidence.

The release-evidence chain intentionally contains only redacted IDs, hashes, timestamps, and test references. It must never carry member, payment, transcript, raw audio, location, Community, or business/directory records.
