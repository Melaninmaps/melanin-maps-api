# Task 373 Native Release Decision

**Decision: NO-GO**

## Candidate artifacts

- iOS: build `615e8a7a-9163-4006-8484-08ed38f6c1c6`, version `1.1.5`, build `102`, bundle `com.melaninmaps.app`
- Android: build `e2a53b5e-9f04-438a-9e15-f1450aa4e55a`, version `1.1.5`, versionCode `77`, package `com.melaninmaps.app`
- Both candidates were built from commit `cb937479db04dcb4f7a5db1772285d09b86b2e28` with runtime `1.1.5-native.2`.
- Archive SHA-256 values and build detail links are in `00-manifest.json`.

## Release blockers

- The 72-row native device matrix remains `BLOCKED` and unassigned. The IPA and AAB have not been installed and exercised on the required current/older iOS and Android devices.
- The 10 store/policy gates remain `BLOCKED`, including reviewer access, UGC policy evidence, privacy/data-safety answers, deletion URL, and symbolicated crash evidence.
- Web, Expo-browser/static bundle, unit-test, and prebuild results are supporting evidence only; none substitutes for native-device evidence.

## Release rule

Keep the store release **NO-GO** until every native matrix row and store/policy gate has a result, tester, timestamp, and evidence path tied to these exact signed candidates. Do not submit either candidate automatically.
